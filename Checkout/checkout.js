// ============================================================================
// ARTEZO CHECKOUT — Production Grade v2
// Changes: 3-step flow (removed Delivery step), return/exchange policy added,
//          premium SVG illustration overlay for order placement animation.
// Architecture: clean state machine, API-first, zero dummy data.
// ============================================================================

'use strict';

// ── Constants ────────────────────────────────────────────────────────────────
const BASE_URL        = 'http://localhost:8085';
const RAZORPAY_KEY_ID = 'rzp_live_YOUR_KEY_HERE'; // ← replace with your live key
const GST_RATE        = 0.18; // Art supplies: 18% GST inclusive in MRP

// ── Global State ─────────────────────────────────────────────────────────────
// Single source of truth — all mutations go through STATE only
const STATE = {
    currentStep:       1,
    totalSteps:        3,   // Address → Payment → Review (Delivery step removed)
    userId:            null,
    cartData:          null, // { cartId, items[], totalAmount, totalMrp, totalDiscount, totalItems }
    addresses:         [],
    selectedAddressId: null,
    editingShippingId: null, // null = new address, number = editing existing
    // Delivery step removed — shipping defaults to Standard (FREE) always
    shipping: { id: 'standard', name: 'Standard Delivery', description: '5–7 business days', price: 0 },
    payment:  { type: 'PREPAID', mode: 'ONLINE' }, // PREPAID | COD
};

// ── Overlay Illustration Frames ──────────────────────────────────────────────
// SVG art product illustrations shown during order placement animation
// Represents the type of products sold: photo frames, wall art, canvas prints etc.
const ART_ILLUSTRATIONS = [
    // Photo Frame
    `<svg width="64" height="64" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="6" y="6" width="52" height="52" rx="3" fill="#1D3C4A" stroke="#E39F32" stroke-width="2.5"/>
        <rect x="13" y="13" width="38" height="38" rx="2" fill="#f0f9ff"/>
        <rect x="16" y="16" width="32" height="32" rx="1.5" fill="#dbeafe"/>
        <path d="M16 38 L26 28 L33 35 L39 29 L48 38 V48 H16Z" fill="#1D3C4A" opacity="0.18"/>
        <circle cx="24" cy="26" r="4" fill="#E39F32" opacity="0.7"/>
        <rect x="6" y="6" width="52" height="5" rx="3" fill="#E39F32" opacity="0.5"/>
        <rect x="6" y="53" width="52" height="5" rx="3" fill="#E39F32" opacity="0.5"/>
        <rect x="6" y="6" width="5" height="52" rx="3" fill="#E39F32" opacity="0.5"/>
        <rect x="53" y="6" width="5" height="52" rx="3" fill="#E39F32" opacity="0.5"/>
    </svg>`,
    // Canvas / Wall Art
    `<svg width="64" height="64" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="8" y="10" width="48" height="40" rx="3" fill="#fff" stroke="#1D3C4A" stroke-width="2.5"/>
        <rect x="8" y="10" width="48" height="5" fill="#1D3C4A" rx="3"/>
        <line x1="32" y1="7" x2="32" y2="10" stroke="#1D3C4A" stroke-width="3" stroke-linecap="round"/>
        <line x1="26" y1="5" x2="38" y2="5" stroke="#1D3C4A" stroke-width="2.5" stroke-linecap="round"/>
        <path d="M14 42 Q22 24 32 34 Q40 22 50 42" fill="#E39F32" opacity="0.25"/>
        <path d="M14 42 Q22 24 32 34 Q40 22 50 42" stroke="#E39F32" stroke-width="1.5" fill="none"/>
        <circle cx="32" cy="26" r="5" fill="#1D3C4A" opacity="0.12"/>
        <path d="M29 26 L32 23 L35 26 L32 29Z" fill="#1D3C4A" opacity="0.3"/>
        <line x1="24" y1="50" x2="28" y2="56" stroke="#1D3C4A" stroke-width="2" stroke-linecap="round"/>
        <line x1="40" y1="50" x2="36" y2="56" stroke="#1D3C4A" stroke-width="2" stroke-linecap="round"/>
    </svg>`,
    // Painting Palette
    `<svg width="64" height="64" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M32 8C18.7 8 8 18.7 8 32C8 40 12 46 18 50C20 51.5 22 50 22 48V44C22 42 23.5 40.5 25.5 40.5H32C45.3 40.5 56 31.6 56 21.3C56 13.5 45 8 32 8Z" fill="#fff" stroke="#1D3C4A" stroke-width="2.5"/>
        <circle cx="20" cy="26" r="4" fill="#ef4444"/>
        <circle cx="30" cy="18" r="4" fill="#E39F32"/>
        <circle cx="42" cy="20" r="4" fill="#3b82f6"/>
        <circle cx="47" cy="30" r="4" fill="#10b981"/>
        <circle cx="44" cy="16" r="2" fill="#ec4899"/>
        <path d="M40 46 L52 34 L56 38 L44 50Z" fill="#1D3C4A" opacity="0.8"/>
        <rect x="50" y="30" width="6" height="14" rx="3" transform="rotate(-45 50 30)" fill="#6b7280"/>
    </svg>`,
    // Decorative Frame / Wall Decor
    `<svg width="64" height="64" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="8" y="8" width="48" height="48" rx="4" fill="none" stroke="#1D3C4A" stroke-width="3"/>
        <rect x="14" y="14" width="36" height="36" rx="2" fill="none" stroke="#E39F32" stroke-width="1.5" stroke-dasharray="3 2"/>
        <rect x="19" y="19" width="26" height="26" rx="2" fill="#f0f9ff"/>
        <path d="M8 8 L18 18" stroke="#E39F32" stroke-width="1.5"/>
        <path d="M56 8 L46 18" stroke="#E39F32" stroke-width="1.5"/>
        <path d="M8 56 L18 46" stroke="#E39F32" stroke-width="1.5"/>
        <path d="M56 56 L46 46" stroke="#E39F32" stroke-width="1.5"/>
        <circle cx="32" cy="32" r="8" fill="none" stroke="#1D3C4A" stroke-width="1.5"/>
        <path d="M28 32 L31 35 L37 29" stroke="#10b981" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>`,
    // Shipping Box
    `<svg width="64" height="64" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="8" y="26" width="48" height="32" rx="3" fill="#1D3C4A"/>
        <path d="M8 26 L32 14 L56 26" fill="#2d6a7f" stroke="#1D3C4A" stroke-width="1"/>
        <rect x="22" y="26" width="20" height="14" rx="2" fill="#E39F32" opacity="0.9"/>
        <line x1="32" y1="26" x2="32" y2="40" stroke="#1D3C4A" stroke-width="1.5"/>
        <path d="M22 33 Q27 30 32 33 Q37 36 42 33" fill="none" stroke="#fff" stroke-width="1" opacity="0.4"/>
        <rect x="24" y="46" width="16" height="4" rx="1" fill="#E39F32" opacity="0.3"/>
        <line x1="22" y1="48" x2="42" y2="48" stroke="#E39F32" stroke-width="1" opacity="0.5"/>
        <circle cx="14" cy="56" r="4" fill="#374151"/>
        <circle cx="50" cy="56" r="4" fill="#374151"/>
        <rect x="10" y="52" width="44" height="4" rx="2" fill="#374151" opacity="0.6"/>
    </svg>`,
];

// ── Init ─────────────────────────────────────────────────────────────────────
// Entry point: resolve user, load cart + addresses in parallel, set step 1
async function initCheckout() {
    try {
        STATE.userId = await resolveUserId();
        if (!STATE.userId) {
            toast('Please login to continue', 'error');
            setTimeout(() => window.location.href = '/Login/login.html', 1500);
            return;
        }
        await Promise.all([loadCart(), loadAddresses()]);
        goToStep(1);
    } catch (err) {
        console.error('[Checkout] Init error:', err);
        toast('Failed to load checkout. Please refresh.', 'error');
    }
}

// Resolve userId from auth service → localStorage → sessionStorage
function resolveUserId() {
    if (window.authService && window.authService.getUserId) {
        return Promise.resolve(window.authService.getUserId());
    }
    const uid = localStorage.getItem('userId') || sessionStorage.getItem('userId');
    return Promise.resolve(uid ? parseInt(uid) : null);
}

// ── Cart ─────────────────────────────────────────────────────────────────────
// Fetch cart from API, guard empty cart, render items + summary
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

// Render cart item rows with qty controls + delete button
function renderCartItems() {
    const container = document.getElementById('order-items-list');
    const clearBtn  = document.getElementById('clear-cart-btn');

    if (!STATE.cartData || !STATE.cartData.items.length) {
        container.innerHTML = '<p class="text-sm text-gray-400 text-center py-4">Cart is empty</p>';
        clearBtn.classList.add('hidden');
        return;
    }
    clearBtn.classList.remove('hidden');

    container.innerHTML = STATE.cartData.items.map(item => `
        <div class="cart-item-row" id="cart-row-${item.itemId}">
            <img class="cart-item-img"
                src="${item.productImageUrl ? BASE_URL + item.productImageUrl : '../Images/product_fallback/artezo_product_fallback_img.png'}"
                alt="${item.titleName}"
                onerror="this.src='../Images/product_fallback/artezo_product_fallback_img.png'">
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

// PATCH qty via API; re-fetch full cart to keep totals authoritative
async function updateQty(itemId, newQty, productId, variantId) {
    if (newQty < 1) return;
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
        await loadCart();
    } catch (err) {
        console.error('[Cart] Update qty error:', err);
        toast('Failed to update quantity', 'error');
        await loadCart(); // revert UI to server state
    }
}

// DELETE single item; fade row optimistically, re-fetch on success/revert on fail
async function removeItem(productId, variantId, itemId) {
    const row = document.getElementById(`cart-row-${itemId}`);
    if (row) { row.style.opacity = '0.4'; row.style.pointerEvents = 'none'; }

    try {
        const params = new URLSearchParams({ userId: STATE.userId, productId });
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

// DELETE full cart; redirect to cart page after success
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


// ── Summary Calculation (UPDATED) ───────────────────────────────────────────
// function calcSummary() {
//     const cart = STATE.cartData;
//     if (!cart) return { mrp: 0, sellingTotal: 0, productDiscount: 0, shipping: 0, codFee: 0, gst: 0, total: 0 };

//     const mrpTotal        = Number(cart.totalMrp)    || 0;
//     const sellingTotal    = Number(cart.totalAmount)  || 0;
//     const productDiscount = Math.max(0, mrpTotal - sellingTotal);
//     const shippingCharge  = STATE.shipping.price      || 0;
    
//     // COD Convenience Fee
//     const codFee = (STATE.payment.mode === 'COD') ? 100 : 0;

//     const gstExtracted    = Math.round(sellingTotal * GST_RATE / (1 + GST_RATE));
//     const totalPayable    = sellingTotal + shippingCharge + codFee;

//     return { 
//         mrp: mrpTotal, 
//         sellingTotal, 
//         productDiscount, 
//         shipping: shippingCharge, 
//         codFee,
//         gst: gstExtracted, 
//         total: totalPayable 
//     };
// }


function calcSummary() {
    const cart = STATE.cartData;
    if (!cart) return { 
        mrp: 0, sellingTotal: 0, productDiscount: 0, 
        shipping: 0, codFee: 0, gst: 0, total: 0 
    };

    // ✅ MRP and selling totals from cart
    const mrpTotal        = Number(cart.totalMrp)    || 0;  // 2199.00
    const sellingTotal    = Number(cart.totalAmount)  || 0;  // 898.99
    
    // ✅ Display only — never subtract
    const productDiscount = Math.max(0, mrpTotal - sellingTotal);  // 1300.01 (for display)
    
    // ✅ Shipping
    const shippingCharge = STATE.shipping.price || 0;
    
    // ✅ COD fee only if payment is COD
    const codFee = (STATE.payment.mode === 'COD') ? 100 : 0;

    // ✅ GST Extraction: If MRP is tax-inclusive, extract GST
    // GST = (selling price × 18) / (1 + 18) = selling price × 0.18 / 1.18
    const gstExtracted = 0;  //Math.round((sellingTotal * GST_RATE) / (1 + GST_RATE) * 100) / 100;

    // ✅ CORRECT FORMULA: Subtotal + Tax + Shipping + COD - Coupon
    // NO product discount subtraction!
    const totalPayable = sellingTotal + shippingCharge + codFee;

    return { 
        mrp: mrpTotal, 
        sellingTotal, 
        productDiscount,  // ✅ For display only
        shipping: shippingCharge, 
        codFee,
        gst: gstExtracted, 
        total: totalPayable  // ✅ This is the final amount customer pays
    };
}

// ── Render Summary Breakdown (UPDATED) ─────────────────────────────────────
// function renderSummaryBreakdown() {
//     const s    = calcSummary();
//     const cart = STATE.cartData;

//     const totalQty = cart ? (cart.totalItems || 0) : 0;
//     document.getElementById('items-count-badge').textContent =
//         `${totalQty} item${totalQty !== 1 ? 's' : ''}`;

//     setText('sum-mrp', `₹${fmtNum(s.mrp)}`);

//     // Discount
//     const discRow = document.getElementById('sum-discount-row');
//     if (s.productDiscount > 0) {
//         discRow.style.display = 'flex';
//         setText('sum-discount', `-₹${fmtNum(s.productDiscount)}`);
//     } else {
//         discRow.style.display = 'none';
//     }

//     // Shipping
//     const shippingEl = document.getElementById('sum-shipping');
//     shippingEl.textContent = s.shipping === 0 ? 'FREE' : `₹${fmtNum(s.shipping)}`;
//     shippingEl.className   = s.shipping === 0 ? 'text-green-600 font-medium' : 'font-medium';

//     // COD Fee (NEW)
//     const codRow = document.getElementById('sum-cod-fee-row');
//     if (s.codFee > 0) {
//         codRow.style.display = 'flex';
//         setText('sum-cod-fee', `+₹${fmtNum(s.codFee)}`);
//     } else {
//         codRow.style.display = 'none';
//     }

//     setText('sum-gst',   `₹${fmtNum(s.gst)}`);
//     setText('sum-total', `₹${fmtNum(s.total)}`);

//     // Savings
//     const savingsMsg = document.getElementById('sum-savings-msg');
//     if (s.productDiscount > 0) {
//         savingsMsg.classList.remove('hidden');
//         setText('sum-savings-amount', `₹${fmtNum(s.productDiscount)}`);
//     } else {
//         savingsMsg.classList.add('hidden');
//     }
// }



/**
 * Render pricing breakdown in UI (FIXED VERSION)
 * ✅ Uses only existing HTML elements
 */
function renderSummaryBreakdown() {
    const s    = calcSummary();
    const cart = STATE.cartData;

    // ────────────────────────────────────────────────────────
    // Item count badge
    // ────────────────────────────────────────────────────────
    const totalQty = cart ? (cart.totalItems || 0) : 0;
    const badgeEl = document.getElementById('items-count-badge');
    if (badgeEl) {
        badgeEl.textContent = `${totalQty} item${totalQty !== 1 ? 's' : ''}`;
    }

    // ────────────────────────────────────────────────────────
    // MRP (original price)
    // ────────────────────────────────────────────────────────
    setText('sum-mrp', `₹${fmtNum(s.mrp)}`);

    // ────────────────────────────────────────────────────────
    // Product Discount (DISPLAY ONLY — NOT SUBTRACTED)
    // ────────────────────────────────────────────────────────
    const discRow = document.getElementById('sum-discount-row');
    if (discRow) {
        if (s.productDiscount > 0) {
            discRow.style.display = 'flex';
            setText('sum-discount', `-₹${fmtNum(s.productDiscount)}`);
        } else {
            discRow.style.display = 'none';
        }
    }

    // ────────────────────────────────────────────────────────
    // Shipping Charge
    // ────────────────────────────────────────────────────────
    const shippingEl = document.getElementById('sum-shipping');
    if (shippingEl) {
        shippingEl.textContent = s.shipping === 0 ? 'FREE' : `₹${fmtNum(s.shipping)}`;
        shippingEl.className   = s.shipping === 0 ? 'text-green-600 font-medium' : 'font-medium';
    }

    // ────────────────────────────────────────────────────────
    // COD Convenience Fee (only if payment is COD)
    // ────────────────────────────────────────────────────────
    const codRow = document.getElementById('sum-cod-fee-row');
    if (codRow) {
        if (s.codFee > 0) {
            codRow.style.display = 'flex';
            setText('sum-cod-fee', `+₹${fmtNum(s.codFee)}`);
        } else {
            codRow.style.display = 'none';
        }
    }

    // ────────────────────────────────────────────────────────
    // GST
    // ────────────────────────────────────────────────────────
    setText('sum-gst', 'Included in price');  //`₹${fmtNum(s.gst)}`

    // ────────────────────────────────────────────────────────
    // FINAL TOTAL
    // ────────────────────────────────────────────────────────
    setText('sum-total', `₹${fmtNum(s.total)}`);

    // ────────────────────────────────────────────────────────
    // Savings message (showing product discount)
    // ────────────────────────────────────────────────────────
    const savingsMsg = document.getElementById('sum-savings-msg');
    if (savingsMsg) {
        if (s.productDiscount > 0) {
            savingsMsg.classList.remove('hidden');
            setText('sum-savings-amount', `₹${fmtNum(s.productDiscount)}`);
        } else {
            savingsMsg.classList.add('hidden');
        }
    }
}


// ── Addresses ─────────────────────────────────────────────────────────────────
// Fetch all saved addresses for the user; auto-select default
async function loadAddresses() {
    try {
        const data = await apiFetch(`/api/shipping-addresses/get-user-addresses/${STATE.userId}`);
        STATE.addresses = Array.isArray(data) ? data : (data.data || []);
        renderAddressCards();
    } catch (err) {
        console.error('[Address] Load error:', err);
        STATE.addresses = [];
        renderAddressCards();
    }
}

// Render address selection cards; auto-select default or first
function renderAddressCards() {
    const container = document.getElementById('saved-addresses-container');

    if (!STATE.addresses.length) {
        container.innerHTML = '<p class="text-sm text-gray-400 mb-4">No saved addresses found. Add one below.</p>';
        STATE.selectedAddressId = null;
        return;
    }

    // Auto-select: prefer marked default, fallback to first
    if (!STATE.selectedAddressId) {
        const def = STATE.addresses.find(a => a.default) || STATE.addresses[0];
        STATE.selectedAddressId = def.shippingId;
    }

    container.innerHTML = STATE.addresses.map(addr => `
        <div class="address-card ${STATE.selectedAddressId === addr.shippingId ? 'selected' : ''}"
             id="addr-card-${addr.shippingId}"
             onclick="selectAddress(${addr.shippingId})">
            ${addr.default
                ? '<span class="default-badge"><i class="fa-solid fa-star mr-1" style="font-size:10px"></i>Default</span>'
                : ''}
            <button class="edit-btn"
                onclick="event.stopPropagation(); openAddressModal(${addr.shippingId})">
                <i class="fa-solid fa-pen-to-square mr-1"></i>Edit
            </button>
            <div class="flex items-center gap-2 mb-1">
                <input type="radio" name="addr_select"
                    ${STATE.selectedAddressId === addr.shippingId ? 'checked' : ''}
                    style="accent-color:#1D3C4A;width:15px;height:15px;flex-shrink:0;" readonly>
                <span class="font-semibold text-sm text-gray-900">${addr.customerName}</span>
                <span class="text-gray-400 text-xs">· ${addr.customerPhone}</span>
            </div>
            <div class="text-sm text-gray-600 ml-5 leading-relaxed">
                ${addr.flatNo ? addr.flatNo + ', ' : ''}${addr.shippingAddress},
                ${addr.shippingCity}, ${addr.shippingState} – ${addr.shippingPincode}
                ${addr.landmark
                    ? `<br><span class="text-gray-400">Landmark: ${addr.landmark}</span>`
                    : ''}
            </div>
        </div>
    `).join('');
}

// Set selected address; update card highlight
function selectAddress(shippingId) {
    STATE.selectedAddressId = shippingId;
    document.querySelectorAll('.address-card').forEach(el => el.classList.remove('selected'));
    const card = document.getElementById(`addr-card-${shippingId}`);
    if (card) card.classList.add('selected');
}

// ── Address Modal ─────────────────────────────────────────────────────────────
// Open add/edit modal; if editing, fetch current data to pre-fill fields
function openAddressModal(shippingId) {
    clearAddressModalErrors();
    STATE.editingShippingId = shippingId;

    document.getElementById('address-modal-title').textContent =
        shippingId ? 'Edit Address' : 'Add New Address';
    document.getElementById('save-address-btn-text').textContent =
        shippingId ? 'Update Address' : 'Save Address';

    // Reset fields
    ['m-name','m-phone','m-email','m-flatno','m-pincode','m-street','m-city','m-state','m-landmark']
        .forEach(id => { const el = document.getElementById(id); if (el) el.value = ''; });
    document.getElementById('m-default').checked = false;

    if (shippingId) fetchAndPopulateAddress(shippingId);

    document.getElementById('address-modal').classList.add('open');
    document.body.style.overflow = 'hidden';
}

// GET specific address and populate modal fields
async function fetchAndPopulateAddress(shippingId) {
    try {
        const data = await apiFetch(`/api/shipping-addresses/${STATE.userId}/${shippingId}`);
        const addr = data.data || data;
        document.getElementById('m-name').value     = addr.customerName     || '';
        document.getElementById('m-phone').value    = addr.customerPhone    || '';
        document.getElementById('m-email').value    = addr.customerEmail    || '';
        document.getElementById('m-flatno').value   = addr.flatNo           || '';
        document.getElementById('m-pincode').value  = addr.shippingPincode  || '';
        document.getElementById('m-street').value   = addr.shippingAddress  || '';
        document.getElementById('m-city').value     = addr.shippingCity     || '';
        document.getElementById('m-state').value    = addr.shippingState    || '';
        document.getElementById('m-landmark').value = addr.landmark         || '';
        document.getElementById('m-default').checked = addr.default || false;
    } catch (err) {
        console.error('[Address] Fetch error:', err);
        toast('Could not load address details', 'error');
    }
}

// Close modal and reset editing state
function closeAddressModal() {
    document.getElementById('address-modal').classList.remove('open');
    document.body.style.overflow = '';
    STATE.editingShippingId = null;
}

// Validate modal fields, then POST (new) or PATCH (edit) address
async function saveAddress() {
    clearAddressModalErrors();

    // Field map: inputId → [payloadKey, errorMessage]
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

    const payload  = {};
    let   hasError = false;

    for (const [id, [key, msg]] of Object.entries(fields)) {
        const val = document.getElementById(id).value.trim();
        if (!val) {
            document.getElementById(`err-${id}`).textContent = msg;
            hasError = true;
        } else {
            payload[key] = val;
        }
    }

    // Format-level validations
    const phone   = document.getElementById('m-phone').value.trim();
    const email   = document.getElementById('m-email').value.trim();
    const pincode = document.getElementById('m-pincode').value.trim();

    if (phone && !/^\d{10}$/.test(phone)) {
        document.getElementById('err-m-phone').textContent = 'Enter a valid 10-digit phone number';
        hasError = true;
    }
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        document.getElementById('err-m-email').textContent = 'Enter a valid email address';
        hasError = true;
    }
    if (pincode && !/^\d{6}$/.test(pincode)) {
        document.getElementById('err-m-pincode').textContent = 'Enter a valid 6-digit pincode';
        hasError = true;
    }

    if (hasError) return;

    const landmark          = document.getElementById('m-landmark').value.trim();
    payload.nearBy          = landmark;
    payload.landmark        = landmark;
    payload.isDefault       = document.getElementById('m-default').checked;

    setAddressModalLoading(true);

    try {
        let res;
        if (STATE.editingShippingId) {
            res = await apiFetch(
                `/api/shipping-addresses/patch/${STATE.userId}/${STATE.editingShippingId}`,
                { method: 'PATCH', body: JSON.stringify(payload) }
            );
        } else {
            res = await apiFetch(
                `/api/shipping-addresses/create-address/${STATE.userId}`,
                { method: 'POST', body: JSON.stringify(payload) }
            );
        }

        if (res && res.success !== false) {
            toast(STATE.editingShippingId ? 'Address updated!' : 'Address saved!', 'success');
            closeAddressModal();
            await loadAddresses();
            // Auto-select newest address after creation
            if (!STATE.editingShippingId && STATE.addresses.length > 0) {
                selectAddress(STATE.addresses[STATE.addresses.length - 1].shippingId);
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

// Toggle loading state on the modal save button
function setAddressModalLoading(loading) {
    const btn     = document.getElementById('save-address-btn');
    const text    = document.getElementById('save-address-btn-text');
    const spinner = document.getElementById('save-address-spinner');
    btn.disabled      = loading;
    text.textContent  = loading
        ? (STATE.editingShippingId ? 'Updating…' : 'Saving…')
        : (STATE.editingShippingId ? 'Update Address' : 'Save Address');
    spinner.classList.toggle('hidden', !loading);
}

// Clear all modal field error messages
function clearAddressModalErrors() {
    ['m-name','m-phone','m-email','m-flatno','m-pincode','m-street','m-city','m-state']
        .forEach(id => {
            const el = document.getElementById(`err-${id}`);
            if (el) el.textContent = '';
        });
}

// ── Payment Selection ─────────────────────────────────────────────────────────
// Toggle ONLINE / COD; update STATE and radio highlight
// function selectPayment(type, mode) {
//     STATE.payment = { type, mode };
//     ['ONLINE', 'COD'].forEach(val => {
//         const el = document.querySelector(`input[name="paymentMethod"][value="${val}"]`);
//         if (el) {
//             el.checked = (val === mode);
//             const item = el.closest('.radio-item');
//             if (item) item.classList.toggle('selected', val === mode);
//         }
//     });
// }

// ── Payment Selection ─────────────────────────────────────────────────────────
function selectPayment(type, mode) {
    STATE.payment = { type, mode };
    
    // Update UI radio buttons
    ['ONLINE', 'COD'].forEach(val => {
        const el = document.querySelector(`input[name="paymentMethod"][value="${val}"]`);
        if (el) {
            el.checked = (val === mode);
            const item = el.closest('.radio-item');
            if (item) item.classList.toggle('selected', val === mode);
        }
    });

    // 🔥 IMPORTANT: Refresh summary when payment changes
    renderSummaryBreakdown();
}

// ── Step Navigation ───────────────────────────────────────────────────────────
// Show the target step panel; update indicator + nav buttons; scroll to top
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

// Update step circles: active (current), completed (past), default (future)
function updateStepIndicator(step) {
    for (let i = 1; i <= STATE.totalSteps; i++) {
        const ind = document.getElementById(`step-ind-${i}`);
        if (!ind) continue;
        ind.classList.remove('active', 'completed');
        if (i === step)      ind.classList.add('active');
        else if (i < step)   ind.classList.add('completed');
    }
    // Color the connecting lines between completed steps
    for (let i = 1; i < STATE.totalSteps; i++) {
        const line = document.getElementById(`line-${i}-${i + 1}`);
        if (line) line.classList.toggle('done', i < step);
    }
}

// Update Back / Continue / Place Order button states per step
function updateNavButtons(step) {
    const back = document.getElementById('btn-back');
    const next = document.getElementById('btn-next');

    back.classList.toggle('hidden', step === 1);

    if (step === STATE.totalSteps) {
        next.innerHTML = STATE.payment.mode === 'COD'
            ? '<i class="fa-solid fa-check mr-2"></i>Place Order'
            : '<i class="fa-solid fa-lock mr-2"></i>Proceed to Pay';
        next.style.background    = '#10b981';
        next.onmouseover         = () => next.style.background = '#059669';
        next.onmouseleave        = () => next.style.background = '#10b981';
    } else {
        next.innerHTML           = 'Continue <i class="fa-solid fa-chevron-right ml-1"></i>';
        next.style.background    = '';
        next.onmouseover         = null;
        next.onmouseleave        = null;
    }
}

function previousStep() {
    if (STATE.currentStep > 1) goToStep(STATE.currentStep - 1);
}

// Validate current step, populate review if going to step 3, advance
function nextStep() {
    if (STATE.currentStep === STATE.totalSteps) {
        placeOrder();
    } else {
        if (validateStep(STATE.currentStep)) {
            if (STATE.currentStep === 2) populateReviewStep(); // payment → review
            goToStep(STATE.currentStep + 1);
        }
    }
}

// ── Validation ────────────────────────────────────────────────────────────────
function validateStep(step) {
    if (step === 1) {
        // Step 1: must have a selected address
        if (!STATE.selectedAddressId) {
            toast('Please select or add a delivery address', 'error');
            return false;
        }
        return true;
    }
    if (step === 2) {
        // Step 2: payment method always defaults to ONLINE; nothing extra needed
        return true;
    }
    if (step === 3) {
        // Step 3 (Review): terms checkbox must be ticked
        const terms = document.getElementById('termsAgree');
        if (!terms.checked) {
            document.getElementById('error-termsAgree').textContent =
                'Please agree to the Terms & Conditions to continue';
            return false;
        }
        document.getElementById('error-termsAgree').textContent = '';
        return true;
    }
    return true;
}

// ── Review Population ─────────────────────────────────────────────────────────
// Build human-readable summary for the review step from STATE
function populateReviewStep() {
    const addr = STATE.addresses.find(a => a.shippingId === STATE.selectedAddressId);
    if (addr) {
        document.getElementById('review-address').innerHTML = `
            <strong>${addr.customerName}</strong> · ${addr.customerPhone}<br>
            ${addr.flatNo ? addr.flatNo + ', ' : ''}${addr.shippingAddress},<br>
            ${addr.shippingCity}, ${addr.shippingState} – ${addr.shippingPincode}
            ${addr.landmark
                ? `<br><span style="color:#6b7280">Near: ${addr.landmark}</span>`
                : ''}
        `;
    }

    // Delivery is always Standard / FREE since delivery step was removed
    document.getElementById('review-shipping').innerHTML =
        `${STATE.shipping.name} — ${STATE.shipping.description}
        &nbsp;`;

    document.getElementById('review-payment').innerHTML =
        STATE.payment.mode === 'COD'
            ? '💵 Cash on Delivery'
            : '💳 Online Payment (Razorpay — Cards / UPI / Net Banking / Wallets)';
}

// ── Order Placement ───────────────────────────────────────────────────────────
// Gate: get address, calc summary, branch to COD or Razorpay flow
async function placeOrder() {
    const nextBtn = document.getElementById('btn-next');
    nextBtn.disabled = true;

    const addr = STATE.addresses.find(a => a.shippingId === STATE.selectedAddressId);
    if (!addr) {
        toast('No delivery address selected', 'error');
        nextBtn.disabled = false;
        return;
    }

    const s = calcSummary();

    if (STATE.payment.mode === 'COD') {
        await placeCODOrder(addr, s, nextBtn);
    } else {
        await initiateRazorpay(addr, s, nextBtn);
    }
}

// COD: show animation → POST order → finish
async function placeCODOrder(addr, s, nextBtn) {
    showProcessingOverlay('Placing your order…', 'Securing your art pieces');
    const orderPayload = buildOrderPayload(addr, s, 'COD', 'COD', null, null);

    try {
        const res = await apiFetch('/api/orders/create',
            { method: 'POST', body: JSON.stringify(orderPayload) });
        if (!res || res.success === false) throw new Error(res?.message || 'Order creation failed');

        const orderId = res.data?.orderId || res.orderId || `ORD-${Date.now()}`;
        await finishOrder(orderId);
    } catch (err) {
        console.error('[Order] COD error:', err);
        hideProcessingOverlay();
        toast(err.message || 'Order placement failed. Please try again.', 'error');
        nextBtn.disabled = false;
    }
}

// Online: create Razorpay order → open checkout modal → verify → create order
async function initiateRazorpay(addr, s, nextBtn) {
    showProcessingOverlay('Initialising payment…', 'Connecting to secure payment gateway');

    const paymentPayload = {
        userId:        STATE.userId,
        amount:        s.total,      // rupees; backend multiplies × 100 → paise
        currency:      'INR',
        receipt:       `ARTEZO-${Date.now()}`,
        customerName:  addr.customerName,
        customerEmail: addr.customerEmail,
        customerPhone: addr.customerPhone,
    };

    try {
        const payRes = await apiFetch('/api/payments/create-order',
            { method: 'POST', body: JSON.stringify(paymentPayload) });

        if (!payRes || payRes.success === false)
            throw new Error(payRes?.message || 'Payment init failed');

        const razorpayOrderId = payRes.data?.razorpayOrderId || payRes.razorpayOrderId;

        const razorpayKeyId = payRes.razorpayKeyId || payRes.data?.razorpayKeyId;

console.log('[Razorpay] key:', razorpayKeyId, '| orderId:', razorpayOrderId);

if (!razorpayKeyId) {
    hideProcessingOverlay();
    toast('Payment configuration error. Please contact support.', 'error');
    nextBtn.disabled = false;
    return;
}

if (!razorpayOrderId) {
    hideProcessingOverlay();
    toast('Could not create payment order. Please try again.', 'error');
    nextBtn.disabled = false;
    return;
}

hideProcessingOverlay();
        const options = {
            key:         razorpayKeyId,
            amount:      s.total * 100, // paise
            currency:    'INR',
            name:        'Artezo',
            description: `Order for ${STATE.cartData.totalItems} item(s)`,
            order_id:    razorpayOrderId,
            prefill: {
                name:    addr.customerName,
                email:   addr.customerEmail,
                contact: addr.customerPhone,
            },
            theme: { color: '#1D3C4A' },

            // Payment success handler: verify signature → create order
            handler: async function (response) {
                showProcessingOverlay('Confirming payment…', 'Verifying transaction with bank');

                // Step 1: Signature verification
                try {
                    const verifyRes = await apiFetch('/api/payments/verify', {
                        method: 'POST',
                        body: JSON.stringify({
                            razorpayOrderId:   response.razorpay_order_id,
                            razorpayPaymentId: response.razorpay_payment_id,
                            razorpaySignature: response.razorpay_signature,
                        }),
                    });
                    if (!verifyRes || verifyRes.success === false)
                        throw new Error('Signature verification failed');
                } catch (err) {
                    hideProcessingOverlay();
                    toast(
                        'Payment done but verification failed. Contact support. Payment ID: '
                        + response.razorpay_payment_id,
                        'error'
                    );
                    nextBtn.disabled = false;
                    return;
                }

                // Step 2: Create order record in DB
                const orderPayload = buildOrderPayload(
                    addr, s, 'PREPAID', 'UPI',
                    response.razorpay_payment_id,
                    response.razorpay_order_id
                );
                try {
                    const orderRes = await apiFetch('/api/orders/create',
                        { method: 'POST', body: JSON.stringify(orderPayload) });
                    if (!orderRes || orderRes.success === false)
                        throw new Error(orderRes?.message || 'Order creation failed');

                    const orderId = orderRes.data?.orderId
                        || orderRes.orderId
                        || response.razorpay_order_id;
                    await finishOrder(orderId);
                } catch (err) {
                    hideProcessingOverlay();
                    toast(
                        'Payment verified but order creation failed. Contact support. Payment ID: '
                        + response.razorpay_payment_id,
                        'error'
                    );
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
        rzp.on('payment.failed', (response) => {
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

// Build the /api/orders/create payload from STATE + calculated summary
// productStrId comes from cart item directly (set when item was added to cart)
// function buildOrderPayload(addr, s, paymentMethod, paymentMode, razorpayPaymentId, razorpayOrderId) {
//     return {
//         customerName:      addr.customerName,
//         customerPhone:     addr.customerPhone,
//         customerEmail:     addr.customerEmail,
//         shippingAddress1:  (addr.flatNo ? addr.flatNo + ', ' : '') + addr.shippingAddress,
//         shippingAddress2:  addr.landmark || addr.nearBy || '',
//         shippingCity:      addr.shippingCity,
//         shippingState:     addr.shippingState,
//         shippingPincode:   addr.shippingPincode,
//         paymentMethod,
//         paymentMode,
//         razorpayPaymentId: razorpayPaymentId || null,
//         razorpayOrderId:   razorpayOrderId   || null,

//         // productStrId must come from cart API (set at add-to-cart time from ProductEntity)
//         items: STATE.cartData.items.map(item => ({
//             productStrId: item.productStrId,     // e.g. "PRD00001" — never fabricated
//             variantId:    item.variantId || null,
//             quantity:     item.quantity,
//         })),

//         couponCode:      null,
//         couponDiscount:  0,
//         discountAmount:  s.productDiscount,
//         discountPercent: s.mrp > 0
//             ? parseFloat(((s.productDiscount / s.mrp) * 100).toFixed(2))
//             : 0,
//         shippingCharges: s.shipping,
//         convenienceFee:  s.codFee,  //added new value
//         tax:             s.gst,
//         giftWrap:        false,
//         giftwrapCharges: 0,
//         orderNotes:      document.getElementById('deliveryNotes')?.value?.trim() || '',
//     };
// }


function buildOrderPayload(addr, s, paymentMethod, paymentMode, razorpayPaymentId, razorpayOrderId) {
    return {
        customerName:      addr.customerName,
        customerPhone:     addr.customerPhone,
        customerEmail:     addr.customerEmail,
        shippingAddress1:  (addr.flatNo ? addr.flatNo + ', ' : '') + addr.shippingAddress,
        shippingAddress2:  addr.landmark || addr.nearBy || '',
        shippingCity:      addr.shippingCity,
        shippingState:     addr.shippingState,
        shippingPincode:   addr.shippingPincode,
        paymentMethod,
        paymentMode,
        razorpayPaymentId: razorpayPaymentId || null,
        razorpayOrderId:   razorpayOrderId   || null,

        // ✅ Items — only productStrId, variantId, quantity
        items: STATE.cartData.items.map(item => ({
            productStrId: item.productStrId,     // e.g. "PRD00001"
            variantId:    item.variantId || null,
            quantity:     item.quantity,
        })),

        // ✅ CORRECTED PRICING
        // Key Point: discountAmount is ALWAYS 0 (product discount already in price)
        // Only coupon discounts are passed
        couponCode:      null,
        couponDiscount:  0,  // ✅ Only NEW coupons
        discountAmount:  0,  // ✅ ALWAYS 0 — product discount is NOT sent
        discountPercent: 0,  // ✅ ALWAYS 0
        
        // ✅ Additional charges
        tax:             0,           //s.gst  GST on selling price
        shippingCharges: s.shipping,      // Shipping charge (0 if free)
        convenienceFee:  s.codFee,        // ₹100 if COD, else 0
        
        // ✅ Extras
        giftWrap:        false,
        giftwrapCharges: 0,
        orderNotes:      document.getElementById('deliveryNotes')?.value?.trim() || '',
    };
}

// ── Order Finish ──────────────────────────────────────────────────────────────
// Update processing text → wait → confetti → success overlay
async function finishOrder(orderId) {
    localStorage.setItem('lastOrderId', orderId || '');
    updateProcessingText('Order confirmed! 🎉', 'Your art is on its way');
    await sleep(1200);
    hideProcessingOverlay();
    launchConfetti();
    showSuccessOverlay(orderId);
}

// ── Processing Overlay ────────────────────────────────────────────────────────
// Premium SVG illustration carousel during order placement
// Cycles through ART_ILLUSTRATIONS array with smooth crossfade
let _animFrame     = null; // rAF handle for carousel
let _animIndex     = 0;    // current illustration index
let _animIntervalId = null;

function showProcessingOverlay(text, sub) {
    setText('anim-text', text);
    setText('anim-sub',  sub);

    // Start illustration carousel
    _animIndex = 0;
    renderAnimIllustration(_animIndex);
    _animIntervalId = setInterval(() => {
        _animIndex = (_animIndex + 1) % ART_ILLUSTRATIONS.length;
        crossfadeIllustration(_animIndex);
    }, 900);

    document.getElementById('payment-anim-overlay').classList.add('show');
}

function updateProcessingText(text, sub) {
    setText('anim-text', text);
    setText('anim-sub',  sub);
}

function hideProcessingOverlay() {
    clearInterval(_animIntervalId);
    document.getElementById('payment-anim-overlay').classList.remove('show');
}

// Inject SVG into the illustration slot directly
function renderAnimIllustration(index) {
    const slot = document.getElementById('anim-illustration-slot');
    if (slot) slot.innerHTML = ART_ILLUSTRATIONS[index];
}

// Crossfade between illustrations via opacity transition
function crossfadeIllustration(index) {
    const slot = document.getElementById('anim-illustration-slot');
    if (!slot) return;
    slot.style.opacity = '0';
    slot.style.transform = 'scale(0.85)';
    setTimeout(() => {
        slot.innerHTML         = ART_ILLUSTRATIONS[index];
        slot.style.opacity     = '1';
        slot.style.transform   = 'scale(1)';
    }, 200);
}

function showSuccessOverlay(orderId) {
    document.getElementById('success-order-id').textContent = 'Confirmed!!';
    document.getElementById('success-overlay').classList.add('show');
}

// ── Confetti ──────────────────────────────────────────────────────────────────
// 200-particle brand-colored confetti burst on canvas; auto-cleans up
function launchConfetti() {
    const canvas = document.getElementById('confetti-canvas');
    canvas.style.display = 'block';
    canvas.width  = window.innerWidth;
    canvas.height = window.innerHeight;
    const ctx = canvas.getContext('2d');

    const colors = [
        '#1D3C4A','#E39F32','#10b981','#6366f1',
        '#ec4899','#f59e0b','#ef4444','#3b82f6','#fff'
    ];
    const particles = Array.from({ length: 200 }, () => ({
        x:     Math.random() * canvas.width,
        y:    -Math.random() * canvas.height * 0.5,
        w:     Math.random() * 10 + 5,
        h:     Math.random() * 5 + 3,
        color: colors[Math.floor(Math.random() * colors.length)],
        vx:    (Math.random() - 0.5) * 5,
        vy:    Math.random() * 5 + 2,
        angle: Math.random() * Math.PI * 2,
        spin:  (Math.random() - 0.5) * 0.22,
        alpha: 1,
    }));

    let frame = 0;
    function draw() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        particles.forEach(p => {
            p.x     += p.vx;
            p.y     += p.vy;
            p.angle += p.spin;
            if (frame > 110) p.alpha -= 0.014;
            p.alpha  = Math.max(p.alpha, 0);

            ctx.save();
            ctx.globalAlpha = p.alpha;
            ctx.translate(p.x + p.w / 2, p.y + p.h / 2);
            ctx.rotate(p.angle);
            ctx.fillStyle = p.color;
            ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
            ctx.restore();
        });
        frame++;
        if (frame < 260 && particles.some(p => p.alpha > 0)) {
            requestAnimationFrame(draw);
        } else {
            canvas.style.display = 'none';
        }
    }
    draw();
}

// ── API Helper ────────────────────────────────────────────────────────────────
// Central fetch wrapper: prepends BASE_URL, injects auth headers,
// handles non-OK responses uniformly, parses 204 No Content safely
async function apiFetch(path, options = {}) {
    const url    = path.startsWith('http') ? path : BASE_URL + path;
    const config = {
        headers: { 'Content-Type': 'application/json', ...authHeaders() },
        ...options,
    };
    const res = await fetch(url, config);
    if (!res.ok) {
        let errMsg = `HTTP ${res.status}`;
        try { const e = await res.json(); errMsg = e.message || errMsg; } catch (_) {}
        throw new Error(errMsg);
    }
    const text = await res.text();
    return text ? JSON.parse(text) : { success: true };
}

// Build auth headers: JWT Bearer token + X-User-Id (required by Spring Security filter)
function authHeaders() {
    const token  = localStorage.getItem('authToken')  || sessionStorage.getItem('authToken');
    const userId = STATE.userId
        || localStorage.getItem('userId')
        || sessionStorage.getItem('userId');
    const headers = {};
    if (token)  headers['Authorization'] = `Bearer ${token}`;
    if (userId) headers['X-User-Id']     = String(userId);
    return headers;
}

// ── Toast Notifications ───────────────────────────────────────────────────────
// Auto-dismisses: errors at 5s, info/success at 3.5s; slide-out animation
function toast(message, type = 'info') {
    const container = document.getElementById('toast-container');
    const icons     = {
        success: 'fa-check-circle',
        error:   'fa-exclamation-circle',
        info:    'fa-info-circle',
    };
    const el = document.createElement('div');
    el.className = `toast ${type}`;
    el.innerHTML = `<i class="fa-solid ${icons[type] || 'fa-info-circle'}"></i><span>${message}</span>`;
    container.appendChild(el);
    setTimeout(() => {
        el.style.animation = 'slideOutRight 0.3s ease forwards';
        setTimeout(() => el.remove(), 300);
    }, type === 'error' ? 5000 : 3500);
}

// ── Utilities ─────────────────────────────────────────────────────────────────
// Format number to Indian locale (1,23,456); handles null/NaN gracefully
function fmtNum(n) {
    if (n === null || n === undefined || isNaN(n)) return '0';
    return Number(n).toLocaleString('en-IN', { maximumFractionDigits: 0 });
}

function setText(id, val) {
    const el = document.getElementById(id);
    if (el) el.textContent = val;
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

// ── Modal Backdrop Close ──────────────────────────────────────────────────────
// Close address modal when user clicks outside the panel
document.getElementById('address-modal')?.addEventListener('click', function (e) {
    if (e.target === this) closeAddressModal();
});

// ── Bootstrap ─────────────────────────────────────────────────────────────────
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initCheckout);
} else {
    initCheckout();
}