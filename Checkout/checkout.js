// ============================================================================
// ARTEZO CHECKOUT — Production Grade
// Senior Architecture: clean state machine, API-first, no dummy data
// ============================================================================

'use strict';

const BASE_URL = 'http://localhost:8085';

// ── State ──────────────────────────────────────────────────────────────────
const STATE = {
    currentStep: 1,
    totalSteps: 4,
    userId: null,           // resolved from auth
    cartData: null,         // { cartId, items[], totalAmount, totalMrp, totalDiscount, totalItems }
    addresses: [],          // fetched from API
    selectedAddressId: null,
    editingShippingId: null, // null = new, number = edit
    shipping: { id: 'standard', name: 'Standard Delivery', description: '5–7 business days', price: 0 },
    payment: { type: 'PREPAID', mode: 'ONLINE' }, // PREPAID/COD
    termsAccepted: false,
};

// ── GST Rate ──────────────────────────────────────────────────────────────
// Per Indian tax norm: GST is INCLUSIVE in MRP. We extract it.
// GST rate applicable for art supplies / stationery = 12% or 18%.
// We'll apply 18% GST extraction from the selling price for display parity.
const GST_RATE = 0.18;

// ── Init ───────────────────────────────────────────────────────────────────
async function initCheckout() {
    try {
        STATE.userId = await resolveUserId();
        if (!STATE.userId) {
            toast('Please login to continue', 'error');
            setTimeout(() => window.location.href = '/Login/login.html', 1500);
            return;
        }
        await Promise.all([loadCart(), loadAddresses()]);
        selectShipping('standard', 0); // default
        goToStep(1);
    } catch (err) {
        console.error('[Checkout] Init error:', err);
        toast('Failed to load checkout. Please refresh.', 'error');
    }
}

function resolveUserId() {
    // Try auth service first, then localStorage fallback
    if (window.authService && window.authService.getUserId) {
        return Promise.resolve(window.authService.getUserId());
    }
    const uid = localStorage.getItem('userId') || sessionStorage.getItem('userId');
    return Promise.resolve(uid ? parseInt(uid) : null);
}

// ── Cart ───────────────────────────────────────────────────────────────────
async function loadCart() {
    try {
        const res = await apiFetch(`/api/v1/cart?userId=${STATE.userId}`);
        if (!res.success || !res.data) throw new Error(res.message || 'Cart load failed');
        STATE.cartData = res.data;
        if (!STATE.cartData.items || STATE.cartData.items.length === 0) {
            toast('Your cart is empty!', 'info');
            setTimeout(() => window.location.href = '/Cart/cart.html', 1800);
            return;
        }
        renderCartItems();
        renderSummaryBreakdown();
    } catch (err) {
        console.error('[Cart] Load error:', err);
        toast('Could not load cart. Please try again.', 'error');
    }
}

function renderCartItems() {
    const container = document.getElementById('order-items-list');
    const clearBtn = document.getElementById('clear-cart-btn');
    if (!STATE.cartData || !STATE.cartData.items.length) {
        container.innerHTML = '<p class="text-sm text-gray-400 text-center py-4">Cart is empty</p>';
        clearBtn.classList.add('hidden');
        return;
    }
    clearBtn.classList.remove('hidden');

    container.innerHTML = STATE.cartData.items.map(item => `
        <div class="cart-item-row" id="cart-row-${item.itemId}">
            <img class="cart-item-img"
                src="${item.productImageUrl ? BASE_URL + item.productImageUrl : '../Images/placeholder.jpg'}"
                alt="${item.titleName}"
                onerror="this.src='../Images/placeholder.jpg'">
            <div class="cart-item-info">
                <div class="cart-item-name">${item.titleName}</div>
                <div class="cart-item-meta">
                    ${[item.selectedColor, item.selectedSize].filter(Boolean).join(' · ')}
                </div>
                <div class="flex items-center justify-between mt-1">
                    <div class="cart-item-qty-controls">
                        <button class="qty-btn" id="qty-minus-${item.itemId}"
                            onclick="updateQty(${item.itemId}, ${item.quantity - 1}, '${item.productId}', '${item.variantId || ''}')"
                            ${item.quantity <= 1 ? 'disabled' : ''}>−</button>
                        <span class="qty-value" id="qty-val-${item.itemId}">${item.quantity}</span>
                        <button class="qty-btn" id="qty-plus-${item.itemId}"
                            onclick="updateQty(${item.itemId}, ${item.quantity + 1}, '${item.productId}', '${item.variantId || ''}')">+</button>
                        <button class="delete-item-btn" title="Remove item"
                            onclick="removeItem(${item.productId}, '${item.variantId || ''}', ${item.itemId})">
                            <i class="fa-solid fa-trash-can"></i>
                        </button>
                    </div>
                    <div class="font-semibold text-sm text-primary">₹${fmtNum(item.itemTotal)}</div>
                </div>
            </div>
        </div>
    `).join('');
}

async function updateQty(itemId, newQty, productId, variantId) {
    if (newQty < 1) return;
    // Disable buttons during update
    ['minus', 'plus'].forEach(dir => {
        const btn = document.getElementById(`qty-${dir}-${itemId}`);
        if (btn) btn.disabled = true;
    });
    const valEl = document.getElementById(`qty-val-${itemId}`);
    if (valEl) valEl.innerHTML = '<div class="qty-spinner mx-auto"></div>';

    try {
        const params = new URLSearchParams({ userId: STATE.userId, itemId, quantity: newQty });
        const res = await apiFetch(`/api/v1/cart/update-quantity?${params}`, { method: 'PATCH' });
        if (!res.success) throw new Error(res.message);
        await loadCart(); // re-fetch full cart for accurate totals
    } catch (err) {
        console.error('[Cart] Update qty error:', err);
        toast('Failed to update quantity', 'error');
        await loadCart(); // revert UI to actual state
    }
}

async function removeItem(productId, variantId, itemId) {
    const row = document.getElementById(`cart-row-${itemId}`);
    if (row) { row.style.opacity = '0.4'; row.style.pointerEvents = 'none'; }

    try {
        const params = new URLSearchParams({ userId: STATE.userId, productid: productId });
        if (variantId) params.append('variantId', variantId);
        const res = await apiFetch(`/api/v1/cart/remove?${params}`, { method: 'DELETE' });
        if (!res.success) throw new Error(res.message);
        toast('Item removed', 'info');
        await loadCart();
    } catch (err) {
        console.error('[Cart] Remove error:', err);
        toast('Failed to remove item', 'error');
        if (row) { row.style.opacity = '1'; row.style.pointerEvents = ''; }
    }
}

async function clearCart() {
    if (!confirm('Remove all items from cart?')) return;
    try {
        const res = await apiFetch(`/api/v1/cart/clear?userId=${STATE.userId}`, { method: 'DELETE' });
        if (!res.success) throw new Error(res.message);
        toast('Cart cleared', 'info');
        setTimeout(() => window.location.href = '/Cart/cart.html', 1200);
    } catch (err) {
        console.error('[Cart] Clear error:', err);
        toast('Failed to clear cart', 'error');
    }
}

// ── Summary Calculation ────────────────────────────────────────────────────
// Indian standard (Flipkart / Amazon IN style):
//   MRP Total          = sum of all item MRP * qty
//   Product Discount   = MRP Total - Selling Price Total  (no rounding)
//   Delivery Charges   = shipping.price  (0 if free)
//   GST (18%)          = extracted from selling price (already included in price; displayed separately)
//                        displayed as: round( sellingTotal * GST_RATE / (1 + GST_RATE) )
//   Total Payable      = Selling Price Total + Delivery Charges
//   (GST is already included in price, displayed for transparency — like Flipkart)

function calcSummary() {
    const cart = STATE.cartData;
    if (!cart) return { mrp: 0, sellingTotal: 0, productDiscount: 0, shipping: 0, gst: 0, total: 0, savings: 0 };

    // Use API-provided values directly — no manual calculation that can drift
    const mrpTotal       = cart.totalMrp || 0;          // sum of mrpPrice * qty
    const sellingTotal   = cart.totalAmount || 0;        // sum of unitPrice * qty (post-discount)
    const productDiscount = Math.max(0, mrpTotal - sellingTotal); // = totalDiscount from API

    const shippingCharge = STATE.shipping.price || 0;

    // GST extraction (inclusive): GST = price * rate / (1 + rate)
    // We show it for transparency, total stays = sellingTotal + shipping
    const gstExtracted = Math.round(sellingTotal * GST_RATE / (1 + GST_RATE));

    const totalPayable = sellingTotal + shippingCharge; // GST already in price

    return {
        mrp: mrpTotal,
        sellingTotal,
        productDiscount,
        shipping: shippingCharge,
        gst: gstExtracted,          // informational, already in price
        total: totalPayable,
        savings: productDiscount + (shippingCharge === 0 && mrpTotal > 0 ? 0 : 0),
    };
}

function renderSummaryBreakdown() {
    const s = calcSummary();
    const cart = STATE.cartData;

    // Items count
    const totalQty = cart ? cart.totalItems || 0 : 0;
    document.getElementById('items-count-badge').textContent = `${totalQty} item${totalQty !== 1 ? 's' : ''}`;

    setText('sum-mrp', `₹${fmtNum(s.mrp)}`);

    const discRow = document.getElementById('sum-discount-row');
    if (s.productDiscount > 0) {
        discRow.style.display = 'flex';
        setText('sum-discount', `-₹${fmtNum(s.productDiscount)}`);
    } else {
        discRow.style.display = 'none';
    }

    const shippingEl = document.getElementById('sum-shipping');
    shippingEl.textContent = s.shipping === 0 ? 'FREE' : `₹${fmtNum(s.shipping)}`;
    shippingEl.className = s.shipping === 0 ? 'text-green-600 font-medium' : 'font-medium';

    setText('sum-gst', `₹${fmtNum(s.gst)}`);

    const totalEl = document.getElementById('sum-total');
    totalEl.textContent = `₹${fmtNum(s.total)}`;

    // Savings message
    const savingsMsg = document.getElementById('sum-savings-msg');
    const totalSavings = s.productDiscount;
    if (totalSavings > 0) {
        savingsMsg.classList.remove('hidden');
        setText('sum-savings-amount', `₹${fmtNum(totalSavings)}`);
    } else {
        savingsMsg.classList.add('hidden');
    }
}

// ── Addresses ──────────────────────────────────────────────────────────────
async function loadAddresses() {
    try {
        const data = await apiFetch(`/api/shipping-addresses/get-user-addresses/${STATE.userId}`);
        // API returns array directly (not wrapped in .data)
        STATE.addresses = Array.isArray(data) ? data : (data.data || []);
        renderAddressCards();
    } catch (err) {
        console.error('[Address] Load error:', err);
        STATE.addresses = [];
        renderAddressCards();
    }
}

function renderAddressCards() {
    const container = document.getElementById('saved-addresses-container');

    if (!STATE.addresses.length) {
        container.innerHTML = '<p class="text-sm text-gray-400 mb-4">No saved addresses found. Add one below.</p>';
        // Auto-select cleared
        STATE.selectedAddressId = null;
        return;
    }

    // Auto-select default or first
    if (!STATE.selectedAddressId) {
        const def = STATE.addresses.find(a => a.default) || STATE.addresses[0];
        STATE.selectedAddressId = def.shippingId;
    }

    container.innerHTML = STATE.addresses.map(addr => `
        <div class="address-card ${STATE.selectedAddressId === addr.shippingId ? 'selected' : ''}"
             id="addr-card-${addr.shippingId}"
             onclick="selectAddress(${addr.shippingId})">
            ${addr.default ? '<span class="default-badge"><i class="fa-solid fa-star mr-1" style="font-size:10px"></i>Default</span>' : ''}
            <button class="edit-btn" onclick="event.stopPropagation(); openAddressModal(${addr.shippingId})">
                <i class="fa-solid fa-pen-to-square mr-1"></i>Edit
            </button>
            <div class="flex items-center gap-2 mb-1">
                <input type="radio" name="addr_select" ${STATE.selectedAddressId === addr.shippingId ? 'checked' : ''}
                    style="accent-color:#1D3C4A;width:15px;height:15px;flex-shrink:0;" readonly>
                <span class="font-semibold text-sm text-gray-900">${addr.customerName}</span>
                <span class="text-gray-400 text-xs">· ${addr.customerPhone}</span>
            </div>
            <div class="text-sm text-gray-600 ml-5 leading-relaxed">
                ${addr.flatNo ? addr.flatNo + ', ' : ''}${addr.shippingAddress},
                ${addr.shippingCity}, ${addr.shippingState} – ${addr.shippingPincode}
                ${addr.landmark ? '<br><span class="text-gray-400">Landmark: ' + addr.landmark + '</span>' : ''}
            </div>
        </div>
    `).join('');
}

function selectAddress(shippingId) {
    STATE.selectedAddressId = shippingId;
    document.querySelectorAll('.address-card').forEach(el => el.classList.remove('selected'));
    const card = document.getElementById(`addr-card-${shippingId}`);
    if (card) card.classList.add('selected');
}

// ── Address Modal ──────────────────────────────────────────────────────────
function openAddressModal(shippingId) {
    clearAddressModalErrors();
    STATE.editingShippingId = shippingId;

    document.getElementById('address-modal-title').textContent = shippingId ? 'Edit Address' : 'Add New Address';
    document.getElementById('save-address-btn-text').textContent = shippingId ? 'Update Address' : 'Save Address';

    // Clear fields first
    ['m-name','m-phone','m-email','m-flatno','m-pincode','m-street','m-city','m-state','m-landmark'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.value = '';
    });
    document.getElementById('m-default').checked = false;

    if (shippingId) {
        // Fetch specific address to populate
        fetchAndPopulateAddress(shippingId);
    }

    document.getElementById('address-modal').classList.add('open');
    document.body.style.overflow = 'hidden';
}

async function fetchAndPopulateAddress(shippingId) {
    try {
        const data = await apiFetch(`/api/shipping-addresses/${STATE.userId}/${shippingId}`);
        const addr = data.data || data; // handle both wrapped and unwrapped
        document.getElementById('m-name').value    = addr.customerName || '';
        document.getElementById('m-phone').value   = addr.customerPhone || '';
        document.getElementById('m-email').value   = addr.customerEmail || '';
        document.getElementById('m-flatno').value  = addr.flatNo || '';
        document.getElementById('m-pincode').value = addr.shippingPincode || '';
        document.getElementById('m-street').value  = addr.shippingAddress || '';
        document.getElementById('m-city').value    = addr.shippingCity || '';
        document.getElementById('m-state').value   = addr.shippingState || '';
        document.getElementById('m-landmark').value= addr.landmark || '';
        document.getElementById('m-default').checked = addr.default || false;
    } catch (err) {
        console.error('[Address] Fetch error:', err);
        toast('Could not load address details', 'error');
    }
}

function closeAddressModal() {
    document.getElementById('address-modal').classList.remove('open');
    document.body.style.overflow = '';
    STATE.editingShippingId = null;
}

async function saveAddress() {
    clearAddressModalErrors();
    const fields = {
        'm-name':    ['customerName',    'Full name is required'],
        'm-phone':   ['customerPhone',   'Phone is required'],
        'm-email':   ['customerEmail',   'Email is required'],
        'm-flatno':  ['flatNo',          'Flat/House no. is required'],
        'm-pincode': ['shippingPincode', 'Pincode is required'],
        'm-street':  ['shippingAddress', 'Street address is required'],
        'm-city':    ['shippingCity',    'City is required'],
        'm-state':   ['shippingState',   'State is required'],
    };

    const payload = {};
    let hasError = false;

    for (const [id, [key, msg]] of Object.entries(fields)) {
        const val = document.getElementById(id).value.trim();
        if (!val) {
            document.getElementById(`err-${id}`).textContent = msg;
            hasError = true;
        } else {
            payload[key] = val;
        }
    }

    // Extra validations
    const phone = document.getElementById('m-phone').value.trim();
    if (phone && !/^\d{10}$/.test(phone)) {
        document.getElementById('err-m-phone').textContent = 'Enter a valid 10-digit phone number';
        hasError = true;
    }
    const email = document.getElementById('m-email').value.trim();
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        document.getElementById('err-m-email').textContent = 'Enter a valid email address';
        hasError = true;
    }
    const pincode = document.getElementById('m-pincode').value.trim();
    if (pincode && !/^\d{6}$/.test(pincode)) {
        document.getElementById('err-m-pincode').textContent = 'Enter a valid 6-digit pincode';
        hasError = true;
    }

    if (hasError) return;

    payload.nearBy   = document.getElementById('m-landmark').value.trim();
    payload.landmark = document.getElementById('m-landmark').value.trim();
    payload.isDefault = document.getElementById('m-default').checked;

    setAddressModalLoading(true);

    try {
        let res;
        if (STATE.editingShippingId) {
            res = await apiFetch(`/api/shipping-addresses/patch/${STATE.userId}/${STATE.editingShippingId}`, {
                method: 'PATCH',
                body: JSON.stringify(payload),
            });
        } else {
            res = await apiFetch(`/api/shipping-addresses/create-address/${STATE.userId}`, {
                method: 'POST',
                body: JSON.stringify(payload),
            });
        }

        if (res && (res.success !== false)) {
            toast(STATE.editingShippingId ? 'Address updated!' : 'Address saved!', 'success');
            closeAddressModal();
            await loadAddresses();
            // Auto-select the newly created address
            if (!STATE.editingShippingId && STATE.addresses.length > 0) {
                const newest = STATE.addresses[STATE.addresses.length - 1];
                selectAddress(newest.shippingId);
            }
        } else {
            throw new Error(res?.message || 'Failed to save address');
        }
    } catch (err) {
        console.error('[Address] Save error:', err);
        toast(err.message || 'Failed to save address. Try again.', 'error');
    } finally {
        setAddressModalLoading(false);
    }
}

function setAddressModalLoading(loading) {
    const btn = document.getElementById('save-address-btn');
    const text = document.getElementById('save-address-btn-text');
    const spinner = document.getElementById('save-address-spinner');
    btn.disabled = loading;
    text.textContent = loading ? (STATE.editingShippingId ? 'Updating…' : 'Saving…') : (STATE.editingShippingId ? 'Update Address' : 'Save Address');
    spinner.classList.toggle('hidden', !loading);
}

function clearAddressModalErrors() {
    ['m-name','m-phone','m-email','m-flatno','m-pincode','m-street','m-city','m-state'].forEach(id => {
        const el = document.getElementById(`err-${id}`);
        if (el) el.textContent = '';
    });
}

// ── Shipping Selection ─────────────────────────────────────────────────────
function selectShipping(id, price) {
    const names = {
        standard: { name: 'Standard Delivery', desc: '5–7 business days' },
        express:  { name: 'Express Delivery',  desc: '2–3 business days' },
        overnight:{ name: 'Overnight Delivery', desc: 'Next day delivery' },
    };
    STATE.shipping = { id, price, ...names[id] };

    ['standard','express','overnight'].forEach(s => {
        const el = document.getElementById(`ship-${s}`);
        if (el) el.classList.toggle('selected', s === id);
    });
    document.querySelector(`input[name="shipping"][value="${id}"]`).checked = true;
    renderSummaryBreakdown();
}

// ── Payment Selection ──────────────────────────────────────────────────────
function selectPayment(type, mode) {
    STATE.payment = { type, mode };
    ['ONLINE','COD'].forEach(val => {
        const el = document.querySelector(`input[name="paymentMethod"][value="${val}"]`);
        if (el) {
            el.checked = (val === mode);
            const item = el.closest('.radio-item');
            if (item) item.classList.toggle('selected', val === mode);
        }
    });
}

// ── Step Navigation ────────────────────────────────────────────────────────
function goToStep(step) {
    if (step < 1 || step > STATE.totalSteps) return;

    document.querySelectorAll('.checkout-step').forEach(el => el.classList.add('hidden'));
    const stepEl = document.getElementById(`checkout-step-${step}`);
    if (stepEl) stepEl.classList.remove('hidden');

    updateStepIndicator(step);
    updateNavButtons(step);
    STATE.currentStep = step;
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function updateStepIndicator(step) {
    for (let i = 1; i <= STATE.totalSteps; i++) {
        const ind = document.getElementById(`step-ind-${i}`);
        if (!ind) continue;
        ind.classList.remove('active','completed');
        if (i === step) ind.classList.add('active');
        else if (i < step) ind.classList.add('completed');
    }
    for (let i = 1; i < STATE.totalSteps; i++) {
        const line = document.getElementById(`line-${i}-${i+1}`);
        if (line) line.classList.toggle('done', i < step);
    }
}

function updateNavButtons(step) {
    const back = document.getElementById('btn-back');
    const next = document.getElementById('btn-next');

    back.classList.toggle('hidden', step === 1);

    if (step === STATE.totalSteps) {
        next.innerHTML = STATE.payment.mode === 'COD'
            ? '<i class="fa-solid fa-check mr-2"></i>Place Order'
            : '<i class="fa-solid fa-lock mr-2"></i>Proceed to Pay';
        next.style.background = '#10b981';
        next.onmouseover = () => next.style.background = '#059669';
        next.onmouseleave = () => next.style.background = '#10b981';
    } else {
        next.innerHTML = 'Continue <i class="fa-solid fa-chevron-right ml-1"></i>';
        next.style.background = '';
        next.onmouseover = null;
        next.onmouseleave = null;
    }
}

function previousStep() {
    if (STATE.currentStep > 1) goToStep(STATE.currentStep - 1);
}

function nextStep() {
    if (STATE.currentStep === STATE.totalSteps) {
        placeOrder();
    } else {
        if (validateStep(STATE.currentStep)) {
            if (STATE.currentStep === 2) renderSummaryBreakdown(); // shipping may have changed
            if (STATE.currentStep === 3) populateReviewStep();
            goToStep(STATE.currentStep + 1);
        }
    }
}

// ── Validation ─────────────────────────────────────────────────────────────
function validateStep(step) {
    if (step === 1) {
        if (!STATE.selectedAddressId) {
            toast('Please select or add a delivery address', 'error');
            return false;
        }
        return true;
    }
    if (step === 2) {
        if (!STATE.shipping.id) {
            toast('Please select a delivery option', 'error');
            return false;
        }
        return true;
    }
    if (step === 3) {
        // Payment method always has a default; nothing extra to validate
        return true;
    }
    if (step === 4) {
        const terms = document.getElementById('termsAgree');
        if (!terms.checked) {
            document.getElementById('error-termsAgree').textContent = 'Please agree to the Terms & Conditions to continue';
            return false;
        }
        document.getElementById('error-termsAgree').textContent = '';
        return true;
    }
    return true;
}

// ── Review Population ──────────────────────────────────────────────────────
function populateReviewStep() {
    // Address
    const addr = STATE.addresses.find(a => a.shippingId === STATE.selectedAddressId);
    if (addr) {
        document.getElementById('review-address').innerHTML = `
            <strong>${addr.customerName}</strong> · ${addr.customerPhone}<br>
            ${addr.flatNo ? addr.flatNo + ', ' : ''}${addr.shippingAddress},<br>
            ${addr.shippingCity}, ${addr.shippingState} – ${addr.shippingPincode}
            ${addr.landmark ? '<br><span style="color:#6b7280">Near: ' + addr.landmark + '</span>' : ''}
        `;
    }

    // Shipping
    document.getElementById('review-shipping').innerHTML =
        `${STATE.shipping.name} — ${STATE.shipping.desc} &nbsp;
        <strong>${STATE.shipping.price === 0 ? 'FREE' : '₹' + STATE.shipping.price}</strong>`;

    // Payment
    document.getElementById('review-payment').innerHTML =
        STATE.payment.mode === 'COD'
            ? '💵 Cash on Delivery'
            : '💳 Online Payment (Razorpay — Cards / UPI / Net Banking / Wallets)';
}

// ── Order Placement ────────────────────────────────────────────────────────
async function placeOrder() {
    const nextBtn = document.getElementById('btn-next');
    nextBtn.disabled = true;

    const addr = STATE.addresses.find(a => a.shippingId === STATE.selectedAddressId);
    if (!addr) { toast('No delivery address selected', 'error'); nextBtn.disabled = false; return; }

    const s = calcSummary();

    if (STATE.payment.mode === 'COD') {
        await placeCODOrder(addr, s, nextBtn);
    } else {
        await initiateRazorpay(addr, s, nextBtn);
    }
}

async function placeCODOrder(addr, s, nextBtn) {
    showProcessingOverlay('Placing your order…', 'Securing your art pieces');

    const orderPayload = buildOrderPayload(addr, s, 'COD', 'COD', null, null);

    try {
        const res = await apiFetch('/api/orders/create', { method: 'POST', body: JSON.stringify(orderPayload) });
        if (!res || res.success === false) throw new Error(res?.message || 'Order creation failed');

        const orderId = res.data?.orderId || res.orderId || orderPayload.razorpayOrderId;
        await finishOrder(orderId);
    } catch (err) {
        console.error('[Order] COD error:', err);
        hideProcessingOverlay();
        toast(err.message || 'Order placement failed. Please try again.', 'error');
        nextBtn.disabled = false;
    }
}

async function initiateRazorpay(addr, s, nextBtn) {
    showProcessingOverlay('Initialising payment…', 'Connecting to secure payment gateway');

    // Create Razorpay order in DB
    const paymentPayload = {
        userId: STATE.userId,
        amount: s.total,          // in rupees; backend converts to paise
        currency: 'INR',
        receipt: `ARTEZO-${Date.now()}`,
        customerName: addr.customerName,
        customerEmail: addr.customerEmail,
        customerPhone: addr.customerPhone,
    };

    try {
        const payRes = await apiFetch('/api/payments/create-order', {
            method: 'POST',
            body: JSON.stringify(paymentPayload),
        });

        if (!payRes || payRes.success === false) throw new Error(payRes?.message || 'Payment init failed');

        const razorpayOrderId = payRes.data?.razorpayOrderId || payRes.razorpayOrderId;
        const razorpayKeyId   = payRes.data?.keyId           || payRes.keyId;

        hideProcessingOverlay();

        // Open Razorpay checkout
        const options = {
            key: razorpayKeyId,
            amount: s.total * 100, // paise
            currency: 'INR',
            name: 'Artezo',
            description: `Order for ${STATE.cartData.totalItems} item(s)`,
            order_id: razorpayOrderId,
            prefill: {
                name: addr.customerName,
                email: addr.customerEmail,
                contact: addr.customerPhone,
            },
            theme: { color: '#1D3C4A' },
            handler: async function (response) {
                showProcessingOverlay('Confirming payment…', 'Verifying transaction with bank');
                const orderPayload = buildOrderPayload(
                    addr, s,
                    'PREPAID', 'UPI',
                    response.razorpay_payment_id,
                    response.razorpay_order_id
                );
                try {
                    const orderRes = await apiFetch('/api/orders/create', { method: 'POST', body: JSON.stringify(orderPayload) });
                    if (!orderRes || orderRes.success === false) throw new Error(orderRes?.message || 'Order creation failed');
                    const orderId = orderRes.data?.orderId || orderRes.orderId || response.razorpay_order_id;
                    await finishOrder(orderId);
                } catch (err) {
                    hideProcessingOverlay();
                    toast('Payment done but order creation failed. Contact support with Payment ID: ' + response.razorpay_payment_id, 'error');
                    nextBtn.disabled = false;
                }
            },
            modal: {
                ondismiss: () => {
                    toast('Payment cancelled', 'info');
                    nextBtn.disabled = false;
                }
            }
        };

        const rzp = new window.Razorpay(options);
        rzp.on('payment.failed', function (response) {
            toast('Payment failed: ' + (response.error?.description || 'Unknown error'), 'error');
            nextBtn.disabled = false;
        });
        rzp.open();

    } catch (err) {
        hideProcessingOverlay();
        console.error('[Payment] Init error:', err);
        toast(err.message || 'Could not initiate payment. Try again.', 'error');
        nextBtn.disabled = false;
    }
}

function buildOrderPayload(addr, s, paymentMethod, paymentMode, razorpayPaymentId, razorpayOrderId) {
    return {
        customerName:       addr.customerName,
        customerPhone:      addr.customerPhone,
        customerEmail:      addr.customerEmail,
        shippingAddress1:   (addr.flatNo ? addr.flatNo + ', ' : '') + addr.shippingAddress,
        shippingAddress2:   addr.landmark || addr.nearBy || '',
        shippingCity:       addr.shippingCity,
        shippingState:      addr.shippingState,
        shippingPincode:    addr.shippingPincode,
        paymentMethod,
        paymentMode,
        razorpayPaymentId:  razorpayPaymentId || null,
        razorpayOrderId:    razorpayOrderId   || null,
        items: STATE.cartData.items.map(item => ({
            productStrId: item.productStrId,
            variantId:    item.variantId || null,
            quantity:     item.quantity,
        })),
        couponCode:      null,
        couponDiscount:  0,
        discountAmount:  s.productDiscount,
        discountPercent: s.mrp > 0 ? parseFloat(((s.productDiscount / s.mrp) * 100).toFixed(2)) : 0,
        shippingCharges: s.shipping,
        convenienceFee:  0,
        tax:             s.gst,
        giftWrap:        false,
        giftwrapCharges: 0,
        orderNotes:      document.getElementById('deliveryNotes')?.value?.trim() || '',
    };
}

async function finishOrder(orderId) {
    // Persist order id
    localStorage.setItem('lastOrderId', orderId || '');

    // Animate steps
    updateProcessingText('Order confirmed! 🎉', 'Your art is on its way');

    await sleep(1200);
    hideProcessingOverlay();
    launchConfetti();
    showSuccessOverlay(orderId);
}

// ── Animations ─────────────────────────────────────────────────────────────
function showProcessingOverlay(text, sub) {
    const overlay = document.getElementById('payment-anim-overlay');
    setText('anim-text', text);
    setText('anim-sub', sub);
    overlay.classList.add('show');
}

function updateProcessingText(text, sub) {
    setText('anim-text', text);
    setText('anim-sub', sub);
}

function hideProcessingOverlay() {
    document.getElementById('payment-anim-overlay').classList.remove('show');
}

function showSuccessOverlay(orderId) {
    document.getElementById('success-order-id').textContent = `Order #${orderId || 'Confirmed'}`;
    document.getElementById('success-overlay').classList.add('show');
}

// ── Confetti ───────────────────────────────────────────────────────────────
function launchConfetti() {
    const canvas = document.getElementById('confetti-canvas');
    canvas.style.display = 'block';
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    const ctx = canvas.getContext('2d');

    const colors = ['#1D3C4A','#E39F32','#10b981','#6366f1','#ec4899','#f59e0b','#ef4444','#3b82f6'];
    const particles = Array.from({ length: 180 }, () => ({
        x: Math.random() * canvas.width,
        y: -Math.random() * canvas.height,
        w: Math.random() * 10 + 5,
        h: Math.random() * 5 + 3,
        color: colors[Math.floor(Math.random() * colors.length)],
        vx: (Math.random() - 0.5) * 4,
        vy: Math.random() * 4 + 2,
        angle: Math.random() * Math.PI * 2,
        spin: (Math.random() - 0.5) * 0.2,
        alpha: 1,
    }));

    let frame = 0;
    function draw() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        particles.forEach(p => {
            p.x += p.vx;
            p.y += p.vy;
            p.angle += p.spin;
            if (frame > 120) p.alpha -= 0.012;
            p.alpha = Math.max(p.alpha, 0);

            ctx.save();
            ctx.globalAlpha = p.alpha;
            ctx.translate(p.x + p.w / 2, p.y + p.h / 2);
            ctx.rotate(p.angle);
            ctx.fillStyle = p.color;
            ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
            ctx.restore();
        });

        frame++;
        if (frame < 240 && particles.some(p => p.alpha > 0)) {
            requestAnimationFrame(draw);
        } else {
            canvas.style.display = 'none';
        }
    }
    draw();
}

// ── API Helper ─────────────────────────────────────────────────────────────
async function apiFetch(path, options = {}) {
    const url = path.startsWith('http') ? path : BASE_URL + path;
    const config = {
        headers: { 'Content-Type': 'application/json', ...authHeaders() },
        ...options,
    };
    const res = await fetch(url, config);
    if (!res.ok) {
        let errMsg = `HTTP ${res.status}`;
        try { const e = await res.json(); errMsg = e.message || errMsg; } catch(_) {}
        throw new Error(errMsg);
    }
    // Some DELETE endpoints return 204 no content
    const text = await res.text();
    return text ? JSON.parse(text) : { success: true };
}

// function authHeaders() {
//     const token = localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
//     return token ? { Authorization: `Bearer ${token}` } : {};
// }


function authHeaders() {
    const token  = localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
    const userId = STATE.userId
                || localStorage.getItem('userId')
                || sessionStorage.getItem('userId');

    const headers = {};
    if (token)  headers['Authorization'] = `Bearer ${token}`;
    if (userId) headers['X-User-Id']     = String(userId);   // ← this is what backend needs
    return headers;
}

// ── Toast ──────────────────────────────────────────────────────────────────
function toast(message, type = 'info') {
    const container = document.getElementById('toast-container');
    const icons = { success: 'fa-check-circle', error: 'fa-exclamation-circle', info: 'fa-info-circle' };
    const el = document.createElement('div');
    el.className = `toast ${type}`;
    el.innerHTML = `<i class="fa-solid ${icons[type] || 'fa-info-circle'}"></i><span>${message}</span>`;
    container.appendChild(el);
    setTimeout(() => {
        el.style.animation = 'slideOutRight 0.3s ease forwards';
        setTimeout(() => el.remove(), 300);
    }, type === 'error' ? 5000 : 3500);
}

// ── Utilities ──────────────────────────────────────────────────────────────
function fmtNum(n) {
    if (n === null || n === undefined || isNaN(n)) return '0';
    return Number(n).toLocaleString('en-IN', { maximumFractionDigits: 0 });
}

function setText(id, val) {
    const el = document.getElementById(id);
    if (el) el.textContent = val;
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

// Close modal on backdrop click
document.getElementById('address-modal')?.addEventListener('click', function(e) {
    if (e.target === this) closeAddressModal();
});

// ── Bootstrap ──────────────────────────────────────────────────────────────
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initCheckout);
} else {
    initCheckout();
}