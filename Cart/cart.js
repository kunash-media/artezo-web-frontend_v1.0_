/**
 * cart.js — Artezo Shopping Cart
 * Integrated with backend API (base: http://localhost:8085)
 * Author: Senior Architecture Integration
 * 
 * API Endpoints:
 *   GET    /api/v1/cart?userId={id}                        — Fetch cart
 *   DELETE /api/v1/cart/remove?userId={id}&productId={id}&variantId={v} — Remove item
 *   DELETE /api/v1/cart/clear?userId={id}                  — Clear cart
 *   PATCH  /api/v1/cart/update-quantity?userId={id}&itemId={id}&quantity={qty} — Update quantity
 */

// ─── Constants ───────────────────────────────────────────────────────────────
const BASE_URL       = 'http://localhost:8085';
const CART_FETCH_URL = `${BASE_URL}/api/v1/cart`;
const CART_REMOVE_URL= `${BASE_URL}/api/v1/cart/remove`;
const CART_CLEAR_URL = `${BASE_URL}/api/v1/cart/clear`;
const CART_UPDATE_QUANTITY_URL = `${BASE_URL}/api/v1/cart/update-quantity`;

const SHIPPING_THRESHOLD = 999;
const SHIPPING_COST      = 99;
const FREE_SHIPPING_COST = 0;

const REQUEST_TIMEOUT_MS = 10000; // 10 seconds

// ─── State ────────────────────────────────────────────────────────────────────
let cartService     = null;
let apiCartData     = null;   // raw API response .data
let currentUserId   = null;
let isLoading       = false;
let pendingDeleteAction = null;
let initAttempts    = 0;
const MAX_INIT_ATTEMPTS = 10;

// ─── DOM refs ─────────────────────────────────────────────────────────────────
const cartItemsContainer = document.getElementById('cartItemsContainer');
const cartLoading        = document.getElementById('cart-loading');
const emptyCartMessage   = document.getElementById('emptyCartMessage');
const cartContent        = document.getElementById('cartContent');
const cartSubtotal       = document.getElementById('cartSubtotal');
const cartShipping       = document.getElementById('cartShipping');
const cartTotal          = document.getElementById('cartTotal');
const checkoutBtn        = document.getElementById('checkoutBtn');
const applyCouponBtn     = document.getElementById('applyCouponBtn');
const couponCodeInput    = document.getElementById('couponCode');
const couponMessage      = document.getElementById('couponMessage');
const recommendedSection = document.getElementById('recommendedSection');
const recommendedGrid    = document.getElementById('recommendedGrid');

// ─── Utilities ────────────────────────────────────────────────────────────────

/**
 * Escape HTML to prevent XSS
 */
function escapeHtml(text) {
    if (text === null || text === undefined) return '';
    const div = document.createElement('div');
    div.textContent = String(text);
    return div.innerHTML;
}

/**
 * Build a URL with query params, skipping null/undefined values
 * @param {string} base
 * @param {Object} params
 */
function buildUrl(base, params = {}) {
    const url = new URL(base);
    Object.entries(params).forEach(([k, v]) => {
        if (v !== null && v !== undefined && v !== '') {
            url.searchParams.set(k, v);
        }
    });
    return url.toString();
}

/**
 * Fetch with timeout + abort support
 * @param {string} url
 * @param {RequestInit} options
 * @param {number} timeoutMs
 */
async function fetchWithTimeout(url, options = {}, timeoutMs = REQUEST_TIMEOUT_MS) {
    const controller = new AbortController();
    const timer = setTimeout(() => {
        controller.abort();
        console.warn(`[Cart][API] Request timed out after ${timeoutMs}ms: ${url}`);
    }, timeoutMs);

    try {
        const response = await fetch(url, { ...options, signal: controller.signal });
        clearTimeout(timer);
        return response;
    } catch (err) {
        clearTimeout(timer);
        throw err;
    }
}

/**
 * Safely parse JSON; returns null on error
 */
function safeJsonParse(text) {
    try {
        return JSON.parse(text);
    } catch {
        return null;
    }
}

/**
 * Resolve userId from multiple possible sources
 * Priority: auth service → localStorage auth → localStorage user → fallback
 */
function resolveUserId() {
    // 1. Anthropic auth service (injected by auth.js)
    if (window.authService && typeof window.authService.getCurrentUser === 'function') {
        const u = window.authService.getCurrentUser();
        if (u?.id || u?.userId) {
            const id = u.id || u.userId;
            console.log(`[Cart][Auth] userId resolved from authService: ${id}`);
            return id;
        }
    }

    // 2. Common localStorage auth keys
    const authKeys = ['authUser', 'currentUser', 'user', 'artezUser'];
    for (const key of authKeys) {
        const raw = localStorage.getItem(key);
        if (raw) {
            const parsed = safeJsonParse(raw);
            const id = parsed?.id || parsed?.userId || parsed?.user_id;
            if (id) {
                console.log(`[Cart][Auth] userId resolved from localStorage["${key}"]: ${id}`);
                return id;
            }
        }
    }

    // 3. Dedicated userId key
    const direct = localStorage.getItem('userId') || sessionStorage.getItem('userId');
    if (direct) {
        console.log(`[Cart][Auth] userId resolved from direct storage: ${direct}`);
        return parseInt(direct, 10) || direct;
    }

    console.warn('[Cart][Auth] Could not resolve userId — API calls will be skipped');
    return null;
}

/**
 * Show delete confirmation modal
 * @param {string} title - Modal title
 * @param {string} message - Modal message
 * @param {Function} onConfirm - Function to execute on confirmation
 */
function showDeleteConfirmModal(title, message, onConfirm) {
    const modal = document.getElementById('deleteConfirmModal');
    const modalContent = document.getElementById('deleteModalContent');
    const titleEl = document.getElementById('deleteModalTitle');
    const messageEl = document.getElementById('deleteModalMessage');
    const confirmBtn = document.getElementById('confirmDeleteBtn');
    const cancelBtn = document.getElementById('cancelDeleteBtn');
    
    if (!modal || !modalContent) return;
    
    // Set modal content
    if (titleEl) titleEl.textContent = title;
    if (messageEl) messageEl.textContent = message;
    
    // Store the action to execute on confirm
    pendingDeleteAction = onConfirm;
    
    // Show modal with animation
    modal.classList.remove('hidden');
    modal.classList.add('flex');
    
    // Animate modal content
    setTimeout(() => {
        modalContent.classList.remove('scale-95', 'opacity-0');
        modalContent.classList.add('scale-100', 'opacity-100');
    }, 10);
    
    // Prevent body scroll
    document.body.style.overflow = 'hidden';
    
    // Setup event listeners
    const closeModal = () => {
        modalContent.classList.remove('scale-100', 'opacity-100');
        modalContent.classList.add('scale-95', 'opacity-0');
        setTimeout(() => {
            modal.classList.add('hidden');
            modal.classList.remove('flex');
            document.body.style.overflow = '';
            pendingDeleteAction = null;
        }, 300);
    };
    
    // Handle confirm button click
    const handleConfirm = () => {
        if (pendingDeleteAction && typeof pendingDeleteAction === 'function') {
            pendingDeleteAction();
        }
        closeModal();
    };
    
    // Handle cancel button click
    const handleCancel = () => {
        closeModal();
    };
    
    // Handle modal background click
    const handleBackgroundClick = (e) => {
        if (e.target === modal) {
            closeModal();
        }
    };

    // Remove old listeners and add new ones
    confirmBtn.removeEventListener('click', handleConfirm);
    cancelBtn.removeEventListener('click', handleCancel);
    modal.removeEventListener('click', handleBackgroundClick);
    
    confirmBtn.addEventListener('click', handleConfirm);
    cancelBtn.addEventListener('click', handleCancel);
    modal.addEventListener('click', handleBackgroundClick);
    
    // Handle Escape key
    const handleEscape = (e) => {
        if (e.key === 'Escape') {
            closeModal();
            document.removeEventListener('keydown', handleEscape);
        }
    };
    document.addEventListener('keydown', handleEscape);
}

// ─── API Layer ────────────────────────────────────────────────────────────────

/**
 * Fetch cart from backend
 * @returns {Promise<Object|null>} API data.data or null on error
 */
async function apiFetchCart(userId) {
    const url = buildUrl(CART_FETCH_URL, { userId });
    console.log(`[Cart][API] GET ${url}`);

    try {
        const res = await fetchWithTimeout(url, { method: 'GET' });
        console.log(`[Cart][API] Response status: ${res.status}`);

        if (!res.ok) {
            const errText = await res.text();
            console.error(`[Cart][API] Non-OK status ${res.status}:`, errText);
            return null;
        }

        const json = await res.json();
        console.log('[Cart][API] Parsed response:', json);

        if (!json.success) {
            console.warn('[Cart][API] API returned success=false:', json.message);
            return null;
        }

        return json.data ?? null;

    } catch (err) {
        if (err.name === 'AbortError') {
            console.error('[Cart][API] Request aborted (timeout)');
        } else {
            console.error('[Cart][API] Fetch error:', err);
        }
        return null;
    }
}

/**
 * Remove a single item from cart via API
 * @param {number} userId
 * @param {number} productId
 * @param {string|null} variantId
 * @returns {Promise<boolean>}
 */
async function apiRemoveItem(userId, productId, variantId = null) {
    const url = buildUrl(CART_REMOVE_URL, { userId, productId, variantId });
    console.log(`[Cart][API] DELETE remove item — ${url}`);

    try {
        const res = await fetchWithTimeout(url, { method: 'DELETE' });
        console.log(`[Cart][API] Remove response status: ${res.status}`);

        if (!res.ok) {
            const errText = await res.text();
            console.error(`[Cart][API] Remove failed ${res.status}:`, errText);
            return false;
        }

        const json = await res.json();
        console.log('[Cart][API] Remove response:', json);
        return json.success === true;

    } catch (err) {
        console.error('[Cart][API] Remove item error:', err);
        return false;
    }
}

/**
 * Clear entire cart via API
 * @param {number} userId
 * @returns {Promise<boolean>}
 */
async function apiClearCart(userId) {
    const url = buildUrl(CART_CLEAR_URL, { userId });
    console.log(`[Cart][API] DELETE clear cart — ${url}`);

    try {
        const res = await fetchWithTimeout(url, { method: 'DELETE' });
        console.log(`[Cart][API] Clear response status: ${res.status}`);

        if (!res.ok) {
            const errText = await res.text();
            console.error(`[Cart][API] Clear failed ${res.status}:`, errText);
            return false;
        }

        const json = await res.json();
        console.log('[Cart][API] Clear response:', json);
        return json.success === true;

    } catch (err) {
        console.error('[Cart][API] Clear cart error:', err);
        return false;
    }
}

/**
 * Update quantity of an item via backend
 * @param {number} userId
 * @param {number|string} itemId
 * @param {number} quantity
 * @returns {Promise<boolean>}
 */
async function apiUpdateQuantity(userId, itemId, quantity) {
    if (!userId || !itemId || quantity < 1) {
        console.warn('[Cart][API] Invalid params for update quantity');
        return false;
    }

    const url = buildUrl(CART_UPDATE_QUANTITY_URL, { 
        userId, 
        itemId, 
        quantity 
    });

    console.log(`[Cart][API] PATCH update quantity — ${url}`);

    try {
        const res = await fetchWithTimeout(url, { 
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' }
        });

        console.log(`[Cart][API] Update qty response status: ${res.status}`);

        if (!res.ok) {
            const errText = await res.text();
            console.error(`[Cart][API] Update quantity failed ${res.status}:`, errText);
            return false;
        }

        const json = await res.json();
        console.log('[Cart][API] Update quantity response:', json);
        return json.success === true;

    } catch (err) {
        console.error('[Cart][API] Update quantity error:', err);
        return false;
    }
}

// ─── Image Resolution ─────────────────────────────────────────────────────────

/**
 * Resolve product image URL.
 * If it's a relative API path like "/api/products/1/main", prefix base URL.
 * Falls back to placeholder.
 */
function resolveImageUrl(raw) {
    if (!raw) return 'https://placehold.co/400x300/e2e8f0/475569?text=Product';
    if (raw.startsWith('http://') || raw.startsWith('https://')) return raw;
    if (raw.startsWith('/')) return `${BASE_URL}${raw}`;
    return raw;
}

// ─── Rendering ────────────────────────────────────────────────────────────────

/**
 * Main render: fetch from API then paint the UI
 */
async function renderCart() {
    if (isLoading) {
        console.log('[Cart][Render] Already loading, skipping duplicate call');
        return;
    }

    isLoading = true;
    console.log('[Cart][Render] Starting cart render…');

    // Show loader
    if (cartLoading) cartLoading.classList.remove('hidden');
    if (cartContent) cartContent.classList.add('hidden');
    if (emptyCartMessage) emptyCartMessage.classList.add('hidden');

    currentUserId = resolveUserId();

    if (!currentUserId) {
        console.warn('[Cart][Render] No userId — falling back to localStorage cart');
        isLoading = false;
        renderFromLocalStorage();
        return;
    }

    // Fetch from API
    const data = await apiFetchCart(currentUserId);
    isLoading = false;

    if (cartLoading) cartLoading.classList.add('hidden');

    if (!data) {
        console.warn('[Cart][Render] API returned no data — trying localStorage fallback');
        renderFromLocalStorage();
        return;
    }

    apiCartData = data;
    console.log(`[Cart][Render] Received ${data.items?.length ?? 0} item(s) from API`);

    paintCart(data.items ?? []);
    updateCartSummaryFromApi(data);
    loadRecommendedProducts();
}

/**
 * Fallback: read from localStorage when API is unavailable or user not logged in
 */
function renderFromLocalStorage() {
    console.log('[Cart][Render] Using localStorage fallback');

    try {
        const raw = localStorage.getItem('artezocart');
        const cart = safeJsonParse(raw) ?? { items: [] };
        const items = cart.items ?? [];
        console.log(`[Cart][Render][LS] Found ${items.length} item(s) in localStorage`);

        // Normalize localStorage items to API shape
        const normalized = items.map(item => ({
            itemId   : item.id || item.productId || item.itemId,
            productId: item.id || item.productId,
            titleName: item.name || item.titleName || item.productName || 'Product',
            unitPrice: item.finalPrice || item.unitPrice || item.price || 0,
            mrpPrice : item.mrp || Math.round((item.finalPrice || item.price || 0) * 1.35),
            itemTotal: (item.finalPrice || item.unitPrice || item.price || 0) * (item.quantity || 1),
            quantity : item.quantity || 1,
            selectedColor: item.selectedColor || item.color || null,
            selectedSize : item.selectedSize || item.size || null,
            sku      : item.sku || null,
            variantId: item.variantId || null,
            productImageUrl: item.image || null,
            isCustomized: item.isCustomized || false,
            customization: item.customization || null,
            basePrice: item.basePrice || null,
        }));

        paintCart(normalized);

        // Summary from LS
        const subtotal = normalized.reduce((s, i) => s + i.itemTotal, 0);
        const totalMrp = normalized.reduce((s, i) => s + (i.mrpPrice * i.quantity), 0);
        updateCartSummaryRaw({
            totalAmount  : subtotal,
            totalMrp     : totalMrp,
            totalDiscount: totalMrp - subtotal,
            totalItems   : normalized.reduce((s, i) => s + i.quantity, 0),
        });

        loadRecommendedProducts();

    } catch (err) {
        console.error('[Cart][Render][LS] Error reading localStorage:', err);
        showFallbackMessage();
    }
}

/**
 * Paint cart items HTML into the DOM
 * @param {Array} items — normalized API items
 */
function paintCart(items) {
    console.log(`[Cart][Paint] Painting ${items.length} item(s)`);

    if (!items || items.length === 0) {
        if (emptyCartMessage) emptyCartMessage.classList.remove('hidden');
        if (cartContent) cartContent.classList.add('hidden');
        if (recommendedSection) recommendedSection.classList.add('hidden');
        return;
    }

    if (emptyCartMessage) emptyCartMessage.classList.add('hidden');
    if (cartContent) cartContent.classList.remove('hidden');

    let html = '';

    items.forEach((item, index) => {
        const itemId     = item.itemId || item.productId;
        const productId  = item.productId;
        const variantId  = item.variantId || '';
        const name       = item.titleName || 'Product';
        const unitPrice  = parseFloat(item.unitPrice) || 0;
        const mrpPrice   = parseFloat(item.mrpPrice) || Math.round(unitPrice * 1.35);
        const quantity   = parseInt(item.quantity) || 1;
        const itemTotal  = parseFloat(item.itemTotal) || unitPrice * quantity;
        const discount   = mrpPrice > unitPrice
            ? Math.round(((mrpPrice - unitPrice) / mrpPrice) * 100)
            : 0;
        const imageUrl   = resolveImageUrl(item.productImageUrl);

        console.log(`[Cart][Paint] Item[${index}] — id:${itemId}, product:${productId}, name:"${name}", price:₹${unitPrice}, qty:${quantity}`);

        html += `
        <div class="cart-item bg-white rounded-xl border border-gray-200 p-4 shadow-sm hover:shadow-md transition-shadow"
             data-item-id="${escapeHtml(String(itemId))}"
             data-product-id="${escapeHtml(String(productId))}"
             data-variant-id="${escapeHtml(variantId)}">
            <div class="flex flex-col md:flex-row gap-4">

                <!-- Product Image -->
                <div class="w-full md:w-24 h-24 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                    <img src="${escapeHtml(imageUrl)}"
                         alt="${escapeHtml(name)}"
                         class="w-full h-full object-cover"
                         onerror="this.src='https://placehold.co/400x300/e2e8f0/475569?text=Product'">
                </div>

                <!-- Product Details -->
                <div class="flex-grow">
                    <div class="flex flex-col md:flex-row justify-between gap-4">
                        <div class="flex-grow">
                            <h3 class="font-semibold text-gray-800 mb-1 line-clamp-2">${escapeHtml(name)}</h3>
                            ${item.selectedColor ? `<p class="text-sm text-gray-500">Color: ${escapeHtml(item.selectedColor)}</p>` : ''}
                            ${item.selectedSize  ? `<p class="text-sm text-gray-500">Size: ${escapeHtml(item.selectedSize)}</p>` : ''}
                            ${item.sku           ? `<p class="text-xs text-gray-400 mt-1">SKU: ${escapeHtml(item.sku)}</p>` : ''}
                            ${variantId          ? `<p class="text-xs text-gray-400 mt-1">Variant: ${escapeHtml(variantId)}</p>` : ''}
                            ${item.isCustomized  ? `<p class="text-xs text-purple-600 mt-1"><i class="fas fa-magic"></i> Customized Item</p>` : ''}
                        </div>

                        <!-- Price Block -->
                        <div class="text-right flex-shrink-0">
                            <div class="font-bold text-lg" style="color:#1D3C4A;">₹${unitPrice.toLocaleString()}</div>
                            ${mrpPrice > unitPrice
                                ? `<div class="text-xs text-gray-400 line-through">₹${mrpPrice.toLocaleString()}</div>`
                                : ''}
                            ${discount > 0
                                ? `<div class="text-xs text-green-600">${discount}% off</div>`
                                : ''}
                        </div>
                    </div>

                    <!-- Customization Accordion -->
                    ${item.isCustomized && item.customization ? buildCustomizationAccordion(item) : ''}

                    <!-- Quantity Controls + Item Total + Remove -->
                    <div class="flex items-center justify-between mt-4 pt-4 border-t border-gray-100">
                        <div class="flex items-center gap-3">
                            <button class="quantity-decrease w-8 h-8 rounded-full border border-gray-300 hover:border-accent hover:bg-accent hover:text-white transition-all duration-300 flex items-center justify-center"
                                    data-product-id="${escapeHtml(String(productId))}"
                                    data-variant-id="${escapeHtml(variantId)}"
                                    data-item-id="${escapeHtml(String(itemId))}"
                                    ${quantity <= 1 ? 'disabled title="Minimum quantity reached"' : ''}>
                                <i class="fas fa-minus text-xs"></i>
                            </button>
                            <span class="quantity-value w-12 text-center font-medium">${quantity}</span>
                            <button class="quantity-increase w-8 h-8 rounded-full border border-gray-300 hover:border-accent hover:bg-accent hover:text-white transition-all duration-300 flex items-center justify-center"
                                    data-product-id="${escapeHtml(String(productId))}"
                                    data-variant-id="${escapeHtml(variantId)}"
                                    data-item-id="${escapeHtml(String(itemId))}">
                                <i class="fas fa-plus text-xs"></i>
                            </button>
                        </div>

                        <div class="flex items-center gap-4">
                            <span class="font-semibold" style="color:#1D3C4A;">₹${itemTotal.toLocaleString()}</span>
                            <button class="remove-item text-gray-400 hover:text-red-500 transition-colors"
                                    data-product-id="${escapeHtml(String(productId))}"
                                    data-variant-id="${escapeHtml(variantId)}"
                                    data-item-id="${escapeHtml(String(itemId))}"
                                    title="Remove item">
                                <i class="far fa-trash-alt"></i>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>`;
    });

    if (cartItemsContainer) {
        cartItemsContainer.innerHTML = html;
        console.log('[Cart][Paint] DOM updated');
    }

    attachCartEventListeners();
}

/**
 * Build customization accordion HTML
 */
function buildCustomizationAccordion(item) {
    const c = item.customization;
    const basePrice  = parseFloat(item.basePrice)  || 0;
    const unitPrice  = parseFloat(item.unitPrice)   || 0;
    const custCost   = unitPrice - basePrice;

    const rows = [
        ['Size',          c.size],
        ['Frame Color',   c.frameColor],
        ['Frame Material',c.frameMaterial],
        ['Glass Type',    c.glassType],
        ['Font',          c.font],
        ['Finish',        c.finish],
        ['Shape',         c.shape],
        ['LED Color',     c.ledColor],
        ['Canvas Type',   c.canvasType],
        ['Border Style',  c.borderStyle],
        ['Paper Type',    c.paperType],
    ].filter(([, v]) => v);

    const extraRows = [];
    if (c.engraving?.enabled && c.engraving.text)
        extraRows.push(['Engraving', `"${escapeHtml(c.engraving.text)}"`]);
    if (c.matBoard?.enabled && c.matBoard.color)
        extraRows.push(['Mat Board', escapeHtml(c.matBoard.color)]);
    if (c.addIcon?.enabled && c.addIcon.icon)
        extraRows.push(['Icon', escapeHtml(c.addIcon.icon)]);
    if (c.customMessage?.enabled && c.customMessage.text)
        extraRows.push(['Message', `"${escapeHtml(c.customMessage.text)}"`]);

    const allRows = [...rows.map(([k, v]) => [k, escapeHtml(v)]), ...extraRows];
    if (!allRows.length && custCost <= 0) return '';

    return `
    <div class="mt-2 text-xs text-gray-500 border-t border-gray-100 pt-2">
        <details>
            <summary class="cursor-pointer text-purple-600 hover:text-purple-700 font-medium">
                <i class="fas fa-sliders-h mr-1"></i>Customization Details ▼
            </summary>
            <div class="mt-2 space-y-1 pl-2">
                ${allRows.map(([k, v]) => `
                    <div class="flex justify-between">
                        <span class="text-gray-500">${k}:</span>
                        <span class="text-gray-700">${v}</span>
                    </div>`).join('')}
            </div>
            ${custCost > 0 ? `
            <div class="mt-2 pt-1 border-t border-gray-100">
                <div class="flex justify-between font-medium">
                    <span>Customization Cost:</span>
                    <span class="text-purple-600">+₹${custCost.toLocaleString()}</span>
                </div>
            </div>` : ''}
        </details>
    </div>`;
}

// ─── Event Listeners ──────────────────────────────────────────────────────────

function attachCartEventListeners() {
    console.log('[Cart][Events] Attaching event listeners to cart items');

    document.querySelectorAll('.quantity-decrease').forEach(btn => {
        btn.replaceWith(btn.cloneNode(true)); // Remove old listeners
    });
    document.querySelectorAll('.quantity-increase').forEach(btn => {
        btn.replaceWith(btn.cloneNode(true));
    });
    document.querySelectorAll('.remove-item').forEach(btn => {
        btn.replaceWith(btn.cloneNode(true));
    });

    // Re-select after clone
    document.querySelectorAll('.quantity-decrease').forEach(btn => {
        btn.addEventListener('click', handleQuantityDecrease);
    });
    document.querySelectorAll('.quantity-increase').forEach(btn => {
        btn.addEventListener('click', handleQuantityIncrease);
    });
    document.querySelectorAll('.remove-item').forEach(btn => {
        btn.addEventListener('click', handleRemoveItem);
    });

    console.log('[Cart][Events] Listeners attached successfully');
}

// ─── Quantity Handlers ────────────────────────────────────────────────────────

async function handleQuantityDecrease(e) {
    e.preventDefault();
    e.stopPropagation();

    const btn       = e.currentTarget;
    const productId = btn.getAttribute('data-product-id');
    const variantId = btn.getAttribute('data-variant-id') || null;
    const itemId    = btn.getAttribute('data-item-id');
    const cartItem  = btn.closest('.cart-item');
    const qtySpan   = cartItem?.querySelector('.quantity-value');
    const current   = parseInt(qtySpan?.textContent || '1', 10);

    console.log(`[Cart][Qty-] Decrease for itemId:${itemId}, product:${productId}, current:${current}`);

    if (current <= 1) {
        confirmAndRemove(productId, variantId, cartItem);
        return;
    }

    const newQty = current - 1;

    // Optimistic UI update
    updateQtyInDom(cartItem, newQty);
    updateLocalStorageQty(productId, variantId, newQty);
    recalcSummaryFromDom();

    // Try to sync with backend if logged in
    if (currentUserId && itemId) {
        setCheckoutBtnLoading(true);
        const success = await apiUpdateQuantity(currentUserId, itemId, newQty);
        setCheckoutBtnLoading(false);

        if (!success) {
            console.warn('[Cart][Qty-] Backend update failed — re-fetching cart');
            showToast('Quantity update failed. Refreshing...', 'error');
            await renderCart();   // safe fallback
            return;
        }
    }

    showToast('Quantity updated', 'success');
}

async function handleQuantityIncrease(e) {
    e.preventDefault();
    e.stopPropagation();

    const btn       = e.currentTarget;
    const productId = btn.getAttribute('data-product-id');
    const variantId = btn.getAttribute('data-variant-id') || null;
    const itemId    = btn.getAttribute('data-item-id');
    const cartItem  = btn.closest('.cart-item');
    const qtySpan   = cartItem?.querySelector('.quantity-value');
    const current   = parseInt(qtySpan?.textContent || '1', 10);

    const newQty = current + 1;

    // Optimistic UI update
    updateQtyInDom(cartItem, newQty);
    updateLocalStorageQty(productId, variantId, newQty);
    recalcSummaryFromDom();

    // Try to sync with backend if logged in
    if (currentUserId && itemId) {
        setCheckoutBtnLoading(true);
        const success = await apiUpdateQuantity(currentUserId, itemId, newQty);
        setCheckoutBtnLoading(false);

        if (!success) {
            console.warn('[Cart][Qty+] Backend update failed — re-fetching cart');
            showToast('Quantity update failed. Refreshing...', 'error');
            await renderCart();
            return;
        }
    }

    showToast('Quantity updated', 'success');
}

/**
 * Update quantity display and item subtotal within a cart-item DOM element
 */
function updateQtyInDom(cartItemEl, newQty) {
    if (!cartItemEl) return;

    const qtySpan  = cartItemEl.querySelector('.quantity-value');
    if (qtySpan) qtySpan.textContent = newQty;

    // Update the disable state on decrease button
    const decBtn = cartItemEl.querySelector('.quantity-decrease');
    if (decBtn) decBtn.disabled = newQty <= 1;

    // Recalculate the item subtotal (unit price × new qty)
    const priceEl = cartItemEl.querySelector('.flex-shrink-0 .font-bold');
    const subtotalEl = cartItemEl.querySelector('.flex.items-center.gap-4 .font-semibold');

    if (priceEl && subtotalEl) {
        const rawPrice = priceEl.textContent.replace('₹', '').replace(/,/g, '');
        const unitPrice = parseFloat(rawPrice) || 0;
        subtotalEl.textContent = `₹${(unitPrice * newQty).toLocaleString()}`;
    }
}

/**
 * Update quantity in localStorage for offline/no-API mode
 */
function updateLocalStorageQty(productId, variantId, newQty) {
    try {
        const raw  = localStorage.getItem('artezocart');
        const cart = safeJsonParse(raw) ?? { items: [] };
        const idx  = cart.items.findIndex(item =>
            String(item.id || item.productId) === String(productId) &&
            (!variantId || (item.variantId || '') === variantId)
        );
        if (idx !== -1) {
            cart.items[idx].quantity = newQty;
            recalcLocalStorageTotals(cart);
            localStorage.setItem('artezocart', JSON.stringify(cart));
            console.log(`[Cart][LS] Updated qty for productId:${productId} to ${newQty}`);
        }
    } catch (err) {
        console.error('[Cart][LS] updateLocalStorageQty error:', err);
    }
}

// ─── Remove Handler ───────────────────────────────────────────────────────────

async function handleRemoveItem(e) {
    e.preventDefault();
    e.stopPropagation();

    const btn       = e.currentTarget;
    const productId = btn.getAttribute('data-product-id');
    const variantId = btn.getAttribute('data-variant-id') || null;
    const cartItemEl = btn.closest('.cart-item');

    console.log(`[Cart][Remove] Removing productId:${productId}, variantId:${variantId}`);

    confirmAndRemove(productId, variantId, cartItemEl);
}

/**
 * Remove item with confirmation modal
 */
async function confirmAndRemove(productId, variantId, cartItemEl) {
    showDeleteConfirmModal(
        'Remove Item?',
        'Are you sure you want to remove this item from your cart? This action cannot be undone.',
        async () => {
            // Optimistic: visually fade out immediately
            if (cartItemEl) {
                cartItemEl.style.transition = 'opacity 0.3s, transform 0.3s';
                cartItemEl.style.opacity = '0.4';
                cartItemEl.style.pointerEvents = 'none';
            }
            
            setCheckoutBtnLoading(true);
            
            let success = false;
            
            if (currentUserId) {
                console.log(`[Cart][API] Removing item from API — userId:${currentUserId}, productId:${productId}, variantId:${variantId}`);
                success = await apiRemoveItem(currentUserId, productId, variantId);
            } else {
                // No API — remove from localStorage only
                console.warn('[Cart][Remove] No userId — removing from localStorage only');
                success = removeFromLocalStorage(productId, variantId);
            }
            
            setCheckoutBtnLoading(false);
            
            if (success) {
                console.log(`[Cart][Remove] Success — refreshing cart`);
                showToast('Item removed from cart', 'info');
                
                // Remove DOM element with animation
                if (cartItemEl) {
                    cartItemEl.style.opacity = '0';
                    cartItemEl.style.transform = 'translateX(-20px)';
                    cartItemEl.style.maxHeight = cartItemEl.scrollHeight + 'px';
                    setTimeout(() => {
                        cartItemEl.style.maxHeight = '0';
                        cartItemEl.style.padding = '0';
                        cartItemEl.style.margin = '0';
                        cartItemEl.style.overflow = 'hidden';
                    }, 200);
                    setTimeout(() => {
                        cartItemEl.remove();
                        // Check if cart is now empty
                        const remaining = document.querySelectorAll('.cart-item');
                        if (remaining.length === 0) {
                            if (cartContent) cartContent.classList.add('hidden');
                            if (emptyCartMessage) emptyCartMessage.classList.remove('hidden');
                            if (recommendedSection) recommendedSection.classList.add('hidden');
                            updateCartSummaryRaw({ totalAmount: 0, totalMrp: 0, totalDiscount: 0, totalItems: 0 });
                        } else {
                            recalcSummaryFromDom();
                        }
                    }, 420);
                } else {
                    await renderCart();
                }
            } else {
                console.error('[Cart][Remove] Failed — reverting optimistic update');
                showToast('Failed to remove item. Please try again.', 'error');
                if (cartItemEl) {
                    cartItemEl.style.opacity = '1';
                    cartItemEl.style.pointerEvents = '';
                }
            }
        }
    );
}

/**
 * Remove item from localStorage only
 */
function removeFromLocalStorage(productId, variantId) {
    try {
        const raw  = localStorage.getItem('artezocart');
        const cart = safeJsonParse(raw) ?? { items: [] };
        const before = cart.items.length;
        cart.items = cart.items.filter(item =>
            !(String(item.id || item.productId) === String(productId) &&
              (!variantId || (item.variantId || '') === variantId))
        );
        recalcLocalStorageTotals(cart);
        localStorage.setItem('artezocart', JSON.stringify(cart));
        console.log(`[Cart][LS] Removed — before:${before}, after:${cart.items.length}`);
        return true;
    } catch (err) {
        console.error('[Cart][LS] removeFromLocalStorage error:', err);
        return false;
    }
}

/**
 * Recalculate localStorage cart totals in place
 */
function recalcLocalStorageTotals(cart) {
    cart.total = cart.items.reduce((s, i) => {
        const p = i.finalPrice || i.unitPrice || i.price || 0;
        return s + p * (i.quantity || 1);
    }, 0);
    cart.count = cart.items.reduce((s, i) => s + (i.quantity || 1), 0);
}

// ─── Clear Cart ───────────────────────────────────────────────────────────────

/**
 * Clear entire cart (with confirmation)
 */
/**
 * Clear entire cart (with confirmation modal)
 */
function handleClearCart() {
    showDeleteConfirmModal(
        'Clear Entire Cart?',
        'Are you sure you want to remove all items from your cart? This action cannot be undone.',
        async () => {
            setCheckoutBtnLoading(true);
            
            let success = false;
            
            if (currentUserId) {
                success = await apiClearCart(currentUserId);
            } else {
                // LocalStorage only
                localStorage.removeItem('artezocart');
                success = true;
            }
            
            setCheckoutBtnLoading(false);
            
            if (success) {
                showToast('Cart cleared successfully', 'success');
                await renderCart();   // full refresh
            } else {
                showToast('Failed to clear cart. Please try again.', 'error');
            }
        }
    );
}

// ─── Cart Summary ─────────────────────────────────────────────────────────────

/**
 * Update summary from API response data
 */
function updateCartSummaryFromApi(data) {
    console.log('[Cart][Summary] Updating from API data:', data);
    updateCartSummaryRaw({
        totalAmount  : data.totalAmount   ?? 0,
        totalMrp     : data.totalMrp      ?? 0,
        totalDiscount: data.totalDiscount ?? 0,
        totalItems   : data.totalItems    ?? 0,
    });
}

/**
 * Core summary renderer
 */
function updateCartSummaryRaw({ totalAmount, totalMrp, totalDiscount, totalItems }) {
    const subtotal = parseFloat(totalAmount) || 0;
    const shipping = subtotal > 0 ? (subtotal >= SHIPPING_THRESHOLD ? FREE_SHIPPING_COST : SHIPPING_COST) : 0;

    // Check applied coupon
    const couponRaw  = localStorage.getItem('appliedCoupon');
    const coupon     = safeJsonParse(couponRaw);
    let couponSavings = 0;

    if (coupon && subtotal > 0) {
        if (coupon.type === 'percentage') couponSavings = Math.round(subtotal * coupon.discount / 100);
        if (coupon.type === 'fixed')      couponSavings = coupon.discount;
        if (coupon.type === 'free_shipping') { /* shipping already handled above */ }
    }

    const shippingActual = (coupon?.type === 'free_shipping') ? 0 : shipping;
    const total          = subtotal - couponSavings + shippingActual;

    console.log(`[Cart][Summary] subtotal:₹${subtotal} | shipping:₹${shippingActual} | coupon:-₹${couponSavings} | total:₹${total}`);

    if (cartSubtotal) cartSubtotal.innerText = `₹${subtotal.toLocaleString()}`;

    if (cartShipping) {
        if (subtotal === 0) {
            cartShipping.innerText = 'Calculating...';
            cartShipping.className = 'font-medium text-gray-500';
        } else if (shippingActual === 0) {
            cartShipping.innerText = 'FREE';
            cartShipping.className = 'font-medium text-green-600';
        } else {
            cartShipping.innerText = `₹${shippingActual.toLocaleString()}`;
            cartShipping.className = 'font-medium text-gray-900';
        }
    }

    if (cartTotal) cartTotal.innerText = `₹${Math.max(0, total).toLocaleString()}`;

    // Update header badge
    const badge = document.getElementById('cart-count-badge');
    if (badge) {
        badge.textContent     = totalItems || 0;
        badge.style.display   = (totalItems > 0) ? 'flex' : 'none';
    }

    // Legacy cart service sync (for header badge fallback)
    if (cartService && typeof cartService.updateBadge === 'function') {
        cartService.updateBadge(totalItems || 0);
    }
}

/**
 * Recalculate summary directly from current DOM state (used after optimistic qty changes)
 */
function recalcSummaryFromDom() {
    let subtotal   = 0;
    let totalItems = 0;

    document.querySelectorAll('.cart-item').forEach(el => {
        const subtotalEl = el.querySelector('.flex.items-center.gap-4 .font-semibold');
        const qtyEl      = el.querySelector('.quantity-value');
        if (subtotalEl) {
            const val = parseFloat(subtotalEl.textContent.replace('₹', '').replace(/,/g, '')) || 0;
            subtotal += val;
        }
        if (qtyEl) {
            totalItems += parseInt(qtyEl.textContent, 10) || 0;
        }
    });

    console.log(`[Cart][Summary][DOM] Recalculated from DOM — subtotal:₹${subtotal}, items:${totalItems}`);
    updateCartSummaryRaw({ totalAmount: subtotal, totalMrp: 0, totalDiscount: 0, totalItems });
}

// ─── Recommended Products ─────────────────────────────────────────────────────

function loadRecommendedProducts() {
    try {
        if (!recommendedSection || !recommendedGrid) return;

        let products = [];

        if (window.ProductDatabase?.getRecommendedProducts) {
            products = window.ProductDatabase.getRecommendedProducts(4);
        } else {
            products = [
                { id: 101, name: 'Rustic Wooden Wall Clock',     price: 1299, image: 'https://i.etsystatic.com/18909544/r/il/4d908c/7682769240/il_1588xN.7682769240_b8zb.jpg' },
                { id: 103, name: 'Emerald Gold Geode Resin Clock', price: 899, image: 'https://i.etsystatic.com/32365247/r/il/38d2e1/7626635886/il_1588xN.7626635886_9ong.jpg' },
                { id: 201, name: 'Mughal Floral Arch Print',     price: 4299, image: 'https://i.etsystatic.com/24426965/r/il/1a2154/7320284410/il_1588xN.7320284410_9gj3.jpg' },
                { id: 501, name: 'Goldfern Metal Wall Accent',   price: 3499, image: 'https://cdn.shopify.com/s/files/1/0632/2526/6422/files/9100000045771_6.jpg?v=1771489110&width=4320' },
            ];
        }

        recommendedGrid.innerHTML = products.map(p => `
            <div class="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-md transition-shadow cursor-pointer group"
                 onclick="viewProductDetails(${p.id})">
                <div class="aspect-square bg-gray-100 overflow-hidden">
                    <img src="${escapeHtml(p.image)}" alt="${escapeHtml(p.name)}"
                         class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                         onerror="this.src='https://placehold.co/400x300/e2e8f0/475569?text=Product'">
                </div>
                <div class="p-3">
                    <h3 class="text-sm font-medium text-gray-800 line-clamp-2">${escapeHtml(p.name)}</h3>
                    <div class="mt-2 font-bold" style="color:#1D3C4A;">₹${p.price.toLocaleString()}</div>
                    <button class="mt-2 w-full text-xs bg-gray-100 hover:bg-primary hover:text-white py-1.5 rounded transition"
                            onclick="event.stopPropagation(); addToCartFromRecommended(${p.id})">
                        <i class="fas fa-cart-plus mr-1"></i> Add to Cart
                    </button>
                </div>
            </div>`).join('');

        recommendedSection.classList.remove('hidden');
        console.log('[Cart][Recommended] Loaded recommended products');

    } catch (err) {
        console.error('[Cart][Recommended] Error loading recommended products:', err);
    }
}

window.addToCartFromRecommended = function(productId) {
    if (window.ProductDatabase) {
        const product = window.ProductDatabase.getProductById(productId);
        if (product && cartService) {
            const result = cartService.addToCart({
                id: product.id, productId: product.id,
                name: product.name, productName: product.name,
                price: product.price, unitPrice: product.price,
                image: product.image, quantity: 1,
                material: product.material, color: product.color, size: product.size,
            }, 1);
            if (result?.success) {
                showToast('Added to cart!', 'success');
                renderCart();
            } else {
                showToast(result?.message || 'Error adding to cart', 'error');
            }
        }
    }
};

window.viewProductDetails = function(productId) {
    window.location.href = `../Product-Details/product-detail.html?id=${productId}`;
};

// ─── Checkout ─────────────────────────────────────────────────────────────────

function handleCheckout() {
    const itemCount = document.querySelectorAll('.cart-item').length;
    if (itemCount === 0) {
        showToast('Your cart is empty', 'error');
        return;
    }
    console.log('[Cart][Checkout] Navigating to checkout');
    window.location.href = '../Checkout/checkout.html';
}

function setCheckoutBtnLoading(loading) {
    if (!checkoutBtn) return;
    if (loading) {
        checkoutBtn.disabled = true;
        checkoutBtn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Please wait...';
    } else {
        checkoutBtn.disabled = false;
        checkoutBtn.innerHTML = 'Proceed to Checkout <i class="fa-solid fa-arrow-right ml-2"></i>';
    }
}

// ─── Coupon ───────────────────────────────────────────────────────────────────

const VALID_COUPONS = {
    'WELCOME10': { discount: 10,  type: 'percentage',    message: '10% off applied!' },
    'SAVE50'   : { discount: 50,  type: 'fixed',         message: '₹50 off applied!' },
    'FREESHIP' : { discount: 0,   type: 'free_shipping', message: 'Free shipping applied!' },
    'ARTEZO20' : { discount: 20,  type: 'percentage',    message: '20% off applied!' },
};

function applyCoupon() {
    const code = couponCodeInput?.value.trim().toUpperCase();
    if (!code) {
        showToast('Please enter a coupon code', 'error');
        return;
    }
    console.log(`[Cart][Coupon] Applying coupon: ${code}`);

    if (VALID_COUPONS[code]) {
        const coupon = VALID_COUPONS[code];
        localStorage.setItem('appliedCoupon', JSON.stringify(coupon));
        setCouponMessage(coupon.message, true);
        showToast(coupon.message, 'success');
        recalcSummaryFromDom();
        console.log(`[Cart][Coupon] Applied successfully: ${code}`);
    } else {
        localStorage.removeItem('appliedCoupon');
        setCouponMessage('Invalid or expired coupon code', false);
        showToast('Invalid coupon code', 'error');
        console.warn(`[Cart][Coupon] Invalid code attempted: ${code}`);
    }
}

function setCouponMessage(msg, success) {
    if (!couponMessage) return;
    couponMessage.textContent = msg;
    couponMessage.className   = `text-xs mt-2 ${success ? 'text-green-600' : 'text-red-500'}`;
    couponMessage.classList.remove('hidden');
    setTimeout(() => couponMessage.classList.add('hidden'), 4000);
}

// ─── Toast ────────────────────────────────────────────────────────────────────

let toastTimer = null;

function showToast(message, type = 'success') {
    let toast = document.getElementById('toast-notification');
    if (!toast) {
        toast = document.createElement('div');
        toast.id        = 'toast-notification';
        toast.className = 'fixed bottom-6 right-6 z-50';
        document.body.appendChild(toast);
    }

    const bg   = type === 'success' ? 'bg-green-500' : type === 'error' ? 'bg-red-500' : 'bg-primary';
    const icon = type === 'success' ? 'fa-check-circle' : type === 'error' ? 'fa-exclamation-circle' : 'fa-info-circle';

    toast.innerHTML = `
        <div class="${bg} text-white px-6 py-3 rounded-lg shadow-lg flex items-center gap-3 min-w-[200px] animate-slide-in">
            <i class="fa-solid ${icon}"></i>
            <span class="text-sm">${escapeHtml(message)}</span>
        </div>`;
    toast.classList.remove('hidden');

    if (toastTimer) clearTimeout(toastTimer);
    toastTimer = setTimeout(() => {
        toast.classList.add('hidden');
        toast.innerHTML = '';
    }, 3000);
}

// ─── Fallback / Error State ───────────────────────────────────────────────────

function showFallbackMessage() {
    if (cartLoading)    cartLoading.classList.add('hidden');
    if (cartContent)    cartContent.classList.add('hidden');
    if (recommendedSection) recommendedSection.classList.add('hidden');

    if (emptyCartMessage) {
        emptyCartMessage.classList.remove('hidden');
        if (!emptyCartMessage.querySelector('.retry-btn')) {
            const retryBtn = document.createElement('button');
            retryBtn.className   = 'retry-btn mt-4 px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition';
            retryBtn.textContent = 'Retry Loading Cart';
            retryBtn.onclick     = () => {
                initAttempts = 0;
                renderCart();
            };
            emptyCartMessage.appendChild(retryBtn);
        }
    }
}

// ─── Initialization ───────────────────────────────────────────────────────────

function initCartPage() {
    console.log(`[Cart][Init] Attempt ${initAttempts + 1}/${MAX_INIT_ATTEMPTS}`);

    if (initAttempts >= MAX_INIT_ATTEMPTS) {
        console.error('[Cart][Init] Max attempts reached — showing fallback UI');
        showFallbackMessage();
        return;
    }

    initAttempts++;

    // Try to grab the cart service (legacy local service for badge/header sync)
    try {
        if (typeof window.getCartWishlistService !== 'undefined') {
            cartService = window.getCartWishlistService();
        } else if (typeof getCartWishlistService !== 'undefined') {
            cartService = getCartWishlistService();
        }
    } catch (err) {
        console.warn('[Cart][Init] Could not get cart service:', err.message);
    }

    console.log('[Cart][Init] cartService:', cartService ? 'found' : 'not available');

    // Always render from API (or localStorage fallback)
    renderCart();
}

// ─── Inject animation styles ──────────────────────────────────────────────────

(function injectAnimStyles() {
    if (document.getElementById('cart-anim-styles')) return;
    const s = document.createElement('style');
    s.id = 'cart-anim-styles';
    s.textContent = `
        @keyframes slideIn {
            from { transform: translateX(100%); opacity: 0; }
            to   { transform: translateX(0);    opacity: 1; }
        }
        .animate-slide-in { animation: slideIn 0.3s ease-out; }
        details summary { list-style: none; cursor: pointer; }
        details summary::-webkit-details-marker { display: none; }
        .line-clamp-2 {
            display: -webkit-box;
            -webkit-line-clamp: 2;
            -webkit-box-orient: vertical;
            overflow: hidden;
        }
    `;
    document.head.appendChild(s);
})();

// ─── Event Bus ────────────────────────────────────────────────────────────────

// Checkout button
if (checkoutBtn)     checkoutBtn.addEventListener('click', handleCheckout);
if (applyCouponBtn)  applyCouponBtn.addEventListener('click', applyCoupon);
if (couponCodeInput) couponCodeInput.addEventListener('keypress', e => { if (e.key === 'Enter') applyCoupon(); });

// Clear Cart button
const clearCartBtn = document.getElementById('clearCartBtn');
if (clearCartBtn) {
    clearCartBtn.addEventListener('click', handleClearCart);
}

// Cart service ready (from cart-wishlist-service.js)
window.addEventListener('cartServiceReady', () => {
    console.log('[Cart][Event] cartServiceReady received — re-initializing');
    initAttempts = 0;
    initCartPage();
});

// Cross-tab localStorage sync
window.addEventListener('storage', e => {
    if (e.key === 'artezocart') {
        console.log('[Cart][Event] localStorage changed (cross-tab) — re-rendering');
        renderCart();
    }
});

// DOM ready
document.addEventListener('DOMContentLoaded', () => {
    console.log('[Cart] DOM ready — starting initialization');
    initCartPage();
});

console.log('[Cart] cart.js loaded ✓');