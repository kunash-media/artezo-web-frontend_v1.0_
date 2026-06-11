/**
 * cart.js — Artezo Shopping Cart
 * Integrated with backend API (base: http://localhost:8085)
 *
 * API Endpoints:
 *   GET    /api/v1/cart?userId={id}
 *   DELETE /api/v1/cart/remove?userId={id}&productId={id}&variantId={v}
 *   DELETE /api/v1/cart/clear?userId={id}
 *   PATCH  /api/v1/cart/update-quantity?userId={id}&itemId={id}&quantity={qty}
 *   GET    /api/products/get-by-category?category={cat}&page=0&size=4
 */

const BASE_URL       = 'http://localhost:8085';
const CART_FETCH_URL = `${BASE_URL}/api/v1/cart`;
const CART_REMOVE_URL= `${BASE_URL}/api/v1/cart/remove`;
const CART_CLEAR_URL = `${BASE_URL}/api/v1/cart/clear`;
const CART_UPDATE_QUANTITY_URL = `${BASE_URL}/api/v1/cart/update-quantity`;
const CATEGORY_PRODUCTS_URL    = `${BASE_URL}/api/products/get-by-category`;

const SHIPPING_THRESHOLD = 0;
const SHIPPING_COST      = 0;
const FREE_SHIPPING_COST = 0;
const REQUEST_TIMEOUT_MS = 10000;

let cartService         = null;
let apiCartData         = null;
let currentUserId       = null;
let isLoading           = false;
let pendingDeleteAction = null;
let initAttempts        = 0;
const MAX_INIT_ATTEMPTS = 10;

const cartItemsContainer = document.getElementById('cartItemsContainer');
const cartLoading        = document.getElementById('cart-loading');
const emptyCartMessage   = document.getElementById('emptyCartMessage');
const cartContent        = document.getElementById('cartContent');
const cartSubtotal       = document.getElementById('cartSubtotal');
const cartShipping       = document.getElementById('cartShipping');
const cartTotal          = document.getElementById('cartTotal');
const checkoutBtn        = document.getElementById('checkoutBtn');
const recommendedSection = document.getElementById('recommendedSection');
const recommendedGrid    = document.getElementById('recommendedGrid');

// ─── Utilities ────────────────────────────────────────────────────────────────

// ─── Confirmed quantity store (last known good from backend) ──────────────────
const confirmedQty = {};   // itemId → last quantity backend accepted

// ─── Quantity Rate Limit Tracker ──────────────────────────────────────────────
const qtyRequestTracker = {
    counts: {},        // key: itemId → request count this window
    timers: {},        // key: itemId → reset timer
    LIMIT: 18,         // slightly under backend's 20 to account for network lag
    WINDOW_MS: 60000,  // 1 minute — matches backend window

    increment(itemId) {
        const key = String(itemId);
        this.counts[key] = (this.counts[key] || 0) + 1;

        // Reset counter after window
        clearTimeout(this.timers[key]);
        this.timers[key] = setTimeout(() => {
            delete this.counts[key];
        }, this.WINDOW_MS);

        return this.counts[key];
    },

    isLimitReached(itemId) {
        return (this.counts[String(itemId)] || 0) >= this.LIMIT;
    },

    reset(itemId) {
        const key = String(itemId);
        clearTimeout(this.timers[key]);
        delete this.counts[key];
        delete this.timers[key];
    }
};

function handle429(res, context = "") {
    if (res.status === 429) {
        showToast("Too many requests — please wait a moment and try again", "info");
        console.warn(`[RateLimit] 429 on ${context}`);
        return true;
    }
    return false;
}

function escapeHtml(text) {
    if (text === null || text === undefined) return '';
    const div = document.createElement('div');
    div.textContent = String(text);
    return div.innerHTML;
}

function buildUrl(base, params = {}) {
    const url = new URL(base);
    Object.entries(params).forEach(([k, v]) => {
        if (v !== null && v !== undefined && v !== '') url.searchParams.set(k, v);
    });
    return url.toString();
}

async function fetchWithTimeout(url, options = {}, timeoutMs = REQUEST_TIMEOUT_MS) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
        const response = await fetch(url, { ...options, signal: controller.signal });
        clearTimeout(timer);
        return response;
    } catch (err) { clearTimeout(timer); throw err; }
}

function safeJsonParse(text) {
    try { return JSON.parse(text); } catch { return null; }
}

function resolveUserId() {
    if (window.authService && typeof window.authService.getCurrentUser === 'function') {
        const u = window.authService.getCurrentUser();
        if (u?.id || u?.userId) return u.id || u.userId;
    }
    const authKeys = ['authUser', 'currentUser', 'user', 'artezUser'];
    for (const key of authKeys) {
        const raw = localStorage.getItem(key);
        if (raw) {
            const parsed = safeJsonParse(raw);
            const id = parsed?.id || parsed?.userId || parsed?.user_id;
            if (id) return id;
        }
    }
    const direct = localStorage.getItem('userId') || sessionStorage.getItem('userId');
    if (direct) return parseInt(direct, 10) || direct;
    return null;
}

// ─── Delete Modal ─────────────────────────────────────────────────────────────

function showDeleteConfirmModal(title, message, onConfirm) {
    const modal        = document.getElementById('deleteConfirmModal');
    const modalContent = document.getElementById('deleteModalContent');
    const titleEl      = document.getElementById('deleteModalTitle');
    const messageEl    = document.getElementById('deleteModalMessage');
    if (!modal || !modalContent) return;

    if (titleEl)   titleEl.textContent   = title;
    if (messageEl) messageEl.textContent = message;
    pendingDeleteAction = onConfirm;

    modal.classList.remove('hidden');
    modal.classList.add('flex');
    setTimeout(() => {
        modalContent.classList.remove('scale-95', 'opacity-0');
        modalContent.classList.add('scale-100', 'opacity-100');
    }, 10);
    document.body.style.overflow = 'hidden';

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

    // Clone to remove old listeners
    const oldConfirm = document.getElementById('confirmDeleteBtn');
    const oldCancel  = document.getElementById('cancelDeleteBtn');
    const newConfirm = oldConfirm.cloneNode(true);
    const newCancel  = oldCancel.cloneNode(true);
    oldConfirm.replaceWith(newConfirm);
    oldCancel.replaceWith(newCancel);

    newConfirm.addEventListener('click', () => { if (pendingDeleteAction) pendingDeleteAction(); closeModal(); });
    newCancel.addEventListener('click', closeModal);
    modal.addEventListener('click', (e) => { if (e.target === modal) closeModal(); });

    const handleEscape = (e) => {
        if (e.key === 'Escape') { closeModal(); document.removeEventListener('keydown', handleEscape); }
    };
    document.addEventListener('keydown', handleEscape);
}

// ─── API Layer ────────────────────────────────────────────────────────────────
async function apiFetchCart(userId) {
    const url = buildUrl(CART_FETCH_URL, { userId });
    try {
        const res = await fetchWithTimeout(url, { method: 'GET' });
        if (res.status === 429) return 'rate_limited';
        if (!res.ok) return null;
        const json = await res.json();
        return json.success ? (json.data ?? null) : null;
    } catch { return null; }
}
async function apiRemoveItem(userId, productId, variantId = null) {
    const url = buildUrl(CART_REMOVE_URL, { userId, productId, variantId });
    try {
        const res = await fetchWithTimeout(url, { method: 'DELETE' });
        if (!res.ok) return false;
        if (res.status === 429) { handle429(res, "cart-action"); return false; }
        const json = await res.json();
        return json.success === true;
    } catch { return false; }
}

async function apiClearCart(userId) {
    const url = buildUrl(CART_CLEAR_URL, { userId });
    try {
        const res = await fetchWithTimeout(url, { method: 'DELETE' });
        if (!res.ok) return false;
        if (res.status === 429) { handle429(res, "cart-action"); return false; }
        const json = await res.json();
        return json.success === true;
    } catch { return false; }
}

async function apiUpdateQuantity(userId, itemId, quantity) {
    if (!userId || !itemId || quantity < 1) return false;
    const url = buildUrl(CART_UPDATE_QUANTITY_URL, { userId, itemId, quantity });
    try {
        const res = await fetchWithTimeout(url, { method: 'PATCH', headers: { 'Content-Type': 'application/json' } });
        if (res.status === 429) return 'rate_limited';
        if (!res.ok) return false;
        const json = await res.json();
        return json.success === true;
    } catch { return false; }
}

async function apiFetchCategoryProducts(category) {
    if (!category) return [];
    const url = buildUrl(CATEGORY_PRODUCTS_URL, { category, page: 0, size: 4 });
    try {
        const res = await fetchWithTimeout(url, { method: 'GET' });
        if (!res.ok) return [];
        const json = await res.json();
        return json.content ?? [];
    } catch { return []; }
}

// ─── Wishlist API ─────────────────────────────────────────────────────────────

async function apiCheckWishlist(userId, productId) {
    if (!userId || !productId) return false;
    const url = buildUrl(`${BASE_URL}/api/v1/wishlist/check`, { userId, productId });
    try {
        const res = await fetchWithTimeout(url, { method: 'GET' });
        if (res.status === 429) {
            console.warn("[Wishlist] Rate limited — skipping check for productId:", productId);
            return false;
        }
        if (!res.ok) return false;
        const json = await res.json();
        return json.data === true;
    } catch { return false; }
}

async function apiAddWishlist(userId, productId, item) {
    try {
        const res = await fetchWithTimeout(`${BASE_URL}/api/v1/wishlist/add`, {
             method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                userId,
                wishlistName: 'My Wishlist',
                productId:    item.productPrimeId || productId,
                variantId:    item.variantId      || null,
                sku:          item.currentSku     || item.sku || null,
                selectedColor:item.selectedColor  || null,
                selectedSize: item.selectedSize   || null,
                titleName:    item.productName    || item.titleName || null,
                wishlistedPrice: item.currentSellingPrice != null
                    ? item.currentSellingPrice
                    : (item.wishlistedPrice ?? null),
                mrpPrice:     item.currentMrpPrice || item.mrpPrice || null,
                customFieldsJson: null
            })
        });
        if (!res.ok) return false;
        const json = await res.json();
        return json.success === true;
    } catch { return false; }
}


// async function apiAddToCart(userId, product) {
//     try {
//         const res = await fetchWithTimeout(`${BASE_URL}/api/v1/cart/add`, {
//             method: 'POST',
//             headers: { 'Content-Type': 'application/json' },
//             body: JSON.stringify({
//                 userId:       userId,
//                 productId:    product.productPrimeId,
//                 productName:  product.productName,
//                 variantId:    null,
//                 sku:          product.currentSku || null,
//                 selectedColor:product.selectedColor || null,
//                 selectedSize: null,
//                 unitPrice:    product.currentSellingPrice,
//                 mrpPrice:     product.currentMrpPrice || product.currentSellingPrice,
//                 quantity:     1,
//                 customFieldsJson: null
//             })
//         });
//         if (!res.ok) return false;
//         const json = await res.json();
//         return json.success === true;
//     } catch { return false; }
// }


async function apiAddToCart(userId, product) {
    try {
        const res = await fetchWithTimeout(`${BASE_URL}/api/v1/cart/add`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                userId:       userId,
                productId:    product.productPrimeId,
                productName:  product.productName,
                variantId:    product.variantId || `VAR-${product.productPrimeId}`, // ← FIX
                sku:          product.currentSku || `PROD-${product.productPrimeId}`, // ← FIX
                selectedColor:product.selectedColor || null,
                selectedSize: null,
                unitPrice:    product.currentSellingPrice,
                mrpPrice:     product.currentMrpPrice || product.currentSellingPrice,
                quantity:     1,
                customFieldsJson: null
            })
        });
        if (!res.ok) return false;
        const json = await res.json();
        return json.success === true;
    } catch { return false; }
}

async function apiRemoveWishlist(userId, productId) {
    const url = buildUrl(`${BASE_URL}/api/v1/wishlist/remove`, { userId, productId });
    try {
        const res = await fetchWithTimeout(url, { method: 'DELETE' });
        if (!res.ok) return false;
        const json = await res.json();
        return json.success === true;
    } catch { return false; }
}



// ─── Image Resolution ─────────────────────────────────────────────────────────

function resolveImageUrl(raw) {
    if (!raw) return 'https://placehold.co/400x300/e2e8f0/475569?text=Product';
    if (raw.startsWith('http://') || raw.startsWith('https://')) return raw;
    if (raw.startsWith('/')) return `${BASE_URL}${raw}`;
    return raw;
}

// ─── Main Render ──────────────────────────────────────────────────────────────

async function renderCart() {
    if (isLoading) return;
    isLoading = true;
    // Clear any stale rate limit message
    const rlMsg = document.getElementById('cartRateLimitMsg');
    if (rlMsg) rlMsg.classList.add('hidden');


    if (cartLoading)      cartLoading.classList.remove('hidden');
    if (cartContent)      cartContent.classList.add('hidden');
    if (emptyCartMessage) emptyCartMessage.classList.add('hidden');

    currentUserId = resolveUserId();

    if (!currentUserId) {
        isLoading = false;
        renderFromLocalStorage();
        return;
    }

    const data = await apiFetchCart(currentUserId);
    isLoading = false;
    if (cartLoading) cartLoading.classList.add('hidden');

    if (data === 'rate_limited') { showRateLimitedCart(); return; }
    if (!data) { renderFromLocalStorage(); return; }

    apiCartData = data;
    paintCart(data.items ?? []);
    updateCartSummaryFromApi(data);
    loadRecommendedProducts(data.items ?? []);
}

function renderFromLocalStorage() {
    try {
        const raw   = localStorage.getItem('artezocart');
        const cart  = safeJsonParse(raw) ?? { items: [] };
        const items = cart.items ?? [];

        const normalized = items.map(item => ({
            itemId:         item.id || item.productId || item.itemId,
            productId:      item.id || item.productId,
            titleName:      item.name || item.titleName || item.productName || 'Product',
            unitPrice:      item.finalPrice || item.unitPrice || item.price || 0,
            mrpPrice:       item.mrp || Math.round((item.finalPrice || item.price || 0) * 1.35),
            itemTotal:      (item.finalPrice || item.unitPrice || item.price || 0) * (item.quantity || 1),
            quantity:       item.quantity || 1,
            selectedColor:  item.selectedColor || item.color || null,
            selectedSize:   item.selectedSize  || item.size  || null,
            sku:            item.sku || null,
            variantId:      item.variantId || null,
            productImageUrl:item.image || null,
            isCustomized:   item.isCustomized || false,
            isCustomizable: item.isCustomizable || false,
            customization:  item.customization || null,
            basePrice:      item.basePrice || null,
        }));

        paintCart(normalized);
        const subtotal  = normalized.reduce((s, i) => s + i.itemTotal, 0);
        const totalMrp  = normalized.reduce((s, i) => s + (i.mrpPrice * i.quantity), 0);
        const totalItems = normalized.reduce((s, i) => s + i.quantity, 0);
        updateCartSummaryRaw({ totalAmount: subtotal, totalMrp, totalDiscount: totalMrp - subtotal, totalItems });
        loadRecommendedProducts(normalized);
    } catch (err) {
        console.error('[Cart][LS]', err);
        showFallbackMessage();
    }
}

// ─── Paint Cart ───────────────────────────────────────────────────────────────

function paintCart(items) {
    if (!items || items.length === 0) {
        if (emptyCartMessage)   emptyCartMessage.classList.remove('hidden');
        if (cartContent)        cartContent.classList.add('hidden');
        if (recommendedSection) recommendedSection.classList.add('hidden');
        return;
    }

    if (emptyCartMessage) emptyCartMessage.classList.add('hidden');
    if (cartContent)      cartContent.classList.remove('hidden');

    let html = '';

    items.forEach(item => {
        const itemId     = item.itemId || item.productId;
        const productId  = item.productId;
        const variantId  = item.variantId || '';
        const name       = item.titleName || 'Product';
        const unitPrice  = parseFloat(item.unitPrice) || 0;
        const mrpPrice   = parseFloat(item.mrpPrice)  || 0;
        const quantity   = parseInt(item.quantity)    || 1;
        const itemTotal  = parseFloat(item.itemTotal) || unitPrice * quantity;
        const imageUrl   = resolveImageUrl(item.productImageUrl);

        // Customizable detection
        const isCustom = !!(item.isCustomized || item.isCustomizable
            || (item.customFieldsJson && item.customFieldsJson !== 'null' && item.customFieldsJson !== '{}'));

        // Discount — only if mrp > selling price
        const hasDiscount = mrpPrice > unitPrice && mrpPrice > 0;
        const discountAmt = hasDiscount ? Math.round(mrpPrice - unitPrice) : 0;
        const discountPct = hasDiscount ? Math.round(((mrpPrice - unitPrice) / mrpPrice) * 100) : 0;

        // Return policy
        const returnBadge = isCustom
            ? `<span class="inline-flex items-center gap-1 text-xs text-orange-600 bg-orange-50 border border-orange-200 px-2 py-0.5 rounded-full">
                   <i class="fas fa-info-circle text-xs"></i> No returns on customized items
               </span>`
            : `<span class="inline-flex items-center gap-1 text-xs text-green-600 bg-green-50 border border-green-200 px-2 py-0.5 rounded-full">
                   <i class="fas fa-rotate-left text-xs"></i> 7-day return available
               </span>`;

        html += `
        <div class="cart-item bg-white rounded-xl border border-gray-200 p-4 shadow-sm hover:shadow-md transition-shadow"
             data-item-id="${escapeHtml(String(itemId))}"
             data-product-id="${escapeHtml(String(productId))}"
             data-variant-id="${escapeHtml(variantId)}"
             data-is-custom="${isCustom}">
            <div class="flex flex-col md:flex-row gap-4">

                <div class="w-full md:w-24 h-24 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                    <img src="${escapeHtml(imageUrl)}" alt="${escapeHtml(name)}"
                         class="w-full h-full object-cover"
                         onerror="this.src='https://placehold.co/400x300/e2e8f0/475569?text=Product'">
                </div>

                <div class="flex-grow">
                    <div class="flex flex-col md:flex-row justify-between gap-4">
                        <div class="flex-grow">
                            <h3 class="font-semibold text-gray-800 mb-1 line-clamp-2">${escapeHtml(name)}</h3>
                            ${item.selectedColor ? `<p class="text-sm text-gray-500">Color: ${escapeHtml(item.selectedColor)}</p>` : ''}
                            ${item.selectedSize  ? `<p class="text-sm text-gray-500">Size: ${escapeHtml(item.selectedSize)}</p>`   : ''}
                            ${item.sku           ? `<p class="text-xs text-gray-400 mt-1">SKU: ${escapeHtml(item.sku)}</p>`        : ''}
                            ${isCustom           ? `<p class="text-xs text-purple-600 mt-0.5"><i class="fas fa-magic text-xs"></i> Customized Item</p>` : ''}
                            <div class="mt-1.5">${returnBadge}</div>
                        </div>

                        <div class="text-right flex-shrink-0 min-w-[100px]">
                            <div class="font-bold text-lg" style="color:#1D3C4A;">₹${unitPrice.toLocaleString('en-IN')}</div>
                            ${hasDiscount ? `
                                <div class="text-xs text-gray-400 line-through">MRP ₹${mrpPrice.toLocaleString('en-IN')}</div>
                                <div class="text-xs font-medium text-green-600">${discountPct}% off</div>
                                <div class="text-xs text-green-600">Save ₹${discountAmt.toLocaleString('en-IN')}</div>
                            ` : ''}
                        </div>
                    </div>

                    ${isCustom && item.customization ? buildCustomizationAccordion(item) : ''}

                    <div class="flex items-center justify-between mt-4 pt-4 border-t border-gray-100">
                        <div class="flex items-center gap-3">
                            <button class="quantity-decrease w-8 h-8 rounded-full border border-gray-300 hover:border-accent hover:bg-accent hover:text-white transition-all duration-300 flex items-center justify-center"
                                    data-product-id="${escapeHtml(String(productId))}"
                                    data-variant-id="${escapeHtml(variantId)}"
                                    data-item-id="${escapeHtml(String(itemId))}"
                                    ${quantity <= 1 ? 'disabled' : ''}>
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
                            <div class="text-right">
                                <span class="font-semibold" style="color:#1D3C4A;">₹${itemTotal.toLocaleString('en-IN')}</span>
                                ${quantity > 1 ? `<p class="text-xs text-gray-400">${quantity} × ₹${unitPrice.toLocaleString('en-IN')}</p>` : ''}
                            </div>
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
        cartItemsContainer.innerHTML = '';  // clear before paint — prevents duplicates
        cartItemsContainer.innerHTML = html;
    }
    attachCartEventListeners();
}

// ─── Customization Accordion ──────────────────────────────────────────────────

function buildCustomizationAccordion(item) {
    const c         = item.customization;
    const basePrice = parseFloat(item.basePrice) || 0;
    const unitPrice = parseFloat(item.unitPrice) || 0;
    const custCost  = unitPrice - basePrice;

    const rows = [
        ['Size', c.size], ['Frame Color', c.frameColor], ['Frame Material', c.frameMaterial],
        ['Glass Type', c.glassType], ['Font', c.font], ['Finish', c.finish],
        ['Shape', c.shape], ['LED Color', c.ledColor], ['Canvas Type', c.canvasType],
        ['Border Style', c.borderStyle], ['Paper Type', c.paperType],
    ].filter(([, v]) => v);

    const extraRows = [];
    if (c.engraving?.enabled && c.engraving.text)         extraRows.push(['Engraving', `"${escapeHtml(c.engraving.text)}"`]);
    if (c.matBoard?.enabled  && c.matBoard.color)         extraRows.push(['Mat Board', escapeHtml(c.matBoard.color)]);
    if (c.addIcon?.enabled   && c.addIcon.icon)           extraRows.push(['Icon', escapeHtml(c.addIcon.icon)]);
    if (c.customMessage?.enabled && c.customMessage.text) extraRows.push(['Message', `"${escapeHtml(c.customMessage.text)}"`]);

    const allRows = [...rows.map(([k, v]) => [k, escapeHtml(v)]), ...extraRows];
    if (!allRows.length && custCost <= 0) return '';

    return `
    <div class="mt-2 text-xs text-gray-500 border-t border-gray-100 pt-2">
        <details>
            <summary class="cursor-pointer text-purple-600 hover:text-purple-700 font-medium">
                <i class="fas fa-sliders-h mr-1"></i>Customization Details ▼
            </summary>
            <div class="mt-2 space-y-1 pl-2">
                ${allRows.map(([k, v]) => `<div class="flex justify-between"><span class="text-gray-500">${k}:</span><span class="text-gray-700">${v}</span></div>`).join('')}
            </div>
            ${custCost > 0 ? `
            <div class="mt-2 pt-1 border-t border-gray-100">
                <div class="flex justify-between font-medium">
                    <span>Customization Cost:</span>
                    <span class="text-purple-600">+₹${custCost.toLocaleString('en-IN')}</span>
                </div>
            </div>` : ''}
        </details>
    </div>`;
}

// ─── Event Listeners ──────────────────────────────────────────────────────────

function attachCartEventListeners() {
    document.querySelectorAll('.quantity-decrease').forEach(btn => btn.replaceWith(btn.cloneNode(true)));
    document.querySelectorAll('.quantity-increase').forEach(btn => btn.replaceWith(btn.cloneNode(true)));
    document.querySelectorAll('.remove-item').forEach(btn => btn.replaceWith(btn.cloneNode(true)));

    document.querySelectorAll('.quantity-decrease').forEach(btn => btn.addEventListener('click', handleQuantityDecrease));
    document.querySelectorAll('.quantity-increase').forEach(btn => btn.addEventListener('click', handleQuantityIncrease));
    document.querySelectorAll('.remove-item').forEach(btn => btn.addEventListener('click', handleRemoveItem));
}

// ─── Quantity Handlers ────────────────────────────────────────────────────────

// async function handleQuantityDecrease(e) {
//     e.preventDefault(); e.stopPropagation();
//     const btn       = e.currentTarget;
//     const productId = btn.getAttribute('data-product-id');
//     const variantId = btn.getAttribute('data-variant-id') || null;
//     const itemId    = btn.getAttribute('data-item-id');
//     const cartItem  = btn.closest('.cart-item');
//     const current   = parseInt(cartItem?.querySelector('.quantity-value')?.textContent || '1', 10);

//     if (current <= 1) { confirmAndRemove(productId, variantId, cartItem); return; }

//     const newQty = current - 1;
//     updateQtyInDom(cartItem, newQty);
//     updateLocalStorageQty(productId, variantId, newQty);
//     recalcSummaryFromDom();

//     if (currentUserId && itemId) {
//         setCheckoutBtnLoading(true);
//         const ok = await apiUpdateQuantity(currentUserId, itemId, newQty);
//         setCheckoutBtnLoading(false);
//         // if (!ok) { showToast('Quantity update failed. Refreshing...', 'error'); await renderCart(); return; }
        
//         if (ok === 'rate_limited') {
//           showToast('Too many requests — please wait a moment', 'info');
//           const allQtyBtns = cartItem?.querySelectorAll('.quantity-decrease, .quantity-increase');
//           allQtyBtns?.forEach(b => { b.disabled = true; b.classList.add('opacity-50', 'cursor-not-allowed'); });
//           setTimeout(() => {
//             allQtyBtns?.forEach(b => { b.disabled = false; b.classList.remove('opacity-50', 'cursor-not-allowed'); });
//           }, 5000); // freeze for 5s
//           return;
//         }
//         if (!ok) { showToast('Quantity update failed. Refreshing...', 'error'); await renderCart(); return; }
//     }
//     showToast('Quantity updated', 'success');
// }


// ─── Replace handleQuantityDecrease ──────────────────────────────────────────
async function handleQuantityDecrease(e) {
    e.preventDefault(); e.stopPropagation();
    const btn       = e.currentTarget;
    const itemId    = btn.getAttribute('data-item-id');
    const productId = btn.getAttribute('data-product-id');
    const variantId = btn.getAttribute('data-variant-id') || null;
    const cartItem  = btn.closest('.cart-item');
    const current   = parseInt(cartItem?.querySelector('.quantity-value')?.textContent || '1', 10);

    if (current <= 1) { confirmAndRemove(productId, variantId, cartItem); return; }

    // ── Frontend limit gate ───────────────────────────────────────────────────
    if (qtyRequestTracker.isLimitReached(itemId)) {
        showToast('Update limit reached — please wait a moment', 'info');
        disableQtyButtons(cartItem, true);
        return;
    }

    const requestCount = qtyRequestTracker.increment(itemId);

    if (requestCount >= qtyRequestTracker.LIMIT) {
        disableQtyButtons(cartItem, true);
        showToast('Update limit reached — buttons will re-enable shortly', 'info');
    }

    const newQty = current - 1;
    updateQtyInDom(cartItem, newQty);
    updateLocalStorageQty(productId, variantId, newQty);
    recalcSummaryFromDom();

    if (currentUserId && itemId) {
        setCheckoutBtnLoading(true);
        const ok = await apiUpdateQuantity(currentUserId, itemId, newQty);
        setCheckoutBtnLoading(false);

        if (ok === 'rate_limited') {
            const fallback = confirmedQty[itemId] ?? current;
            updateQtyInDom(cartItem, fallback);
            updateLocalStorageQty(productId, variantId, fallback);
            recalcSummaryFromDom();
            disableQtyButtons(cartItem, true);
            showToast('Too many requests — quantity restored', 'info');

            setTimeout(() => {
                qtyRequestTracker.reset(itemId);
                disableQtyButtons(cartItem, false);
                const qty = parseInt(cartItem?.querySelector('.quantity-value')?.textContent || '1', 10);
                const decBtn = cartItem?.querySelector('.quantity-decrease');
                if (decBtn) decBtn.disabled = qty <= 1;
            }, 20000);
            return;
        }

        if (!ok) {
            showToast('Quantity update failed. Refreshing...', 'error');
            await renderCart();
            return;
        }

        confirmedQty[itemId] = newQty;
    }

    showToast('Quantity updated', 'success');
}

// async function handleQuantityIncrease(e) {
//     e.preventDefault(); e.stopPropagation();
//     const btn       = e.currentTarget;
//     const productId = btn.getAttribute('data-product-id');
//     const variantId = btn.getAttribute('data-variant-id') || null;
//     const itemId    = btn.getAttribute('data-item-id');
//     const cartItem  = btn.closest('.cart-item');
//     const current   = parseInt(cartItem?.querySelector('.quantity-value')?.textContent || '1', 10);
//     const newQty    = current + 1;

//     updateQtyInDom(cartItem, newQty);
//     updateLocalStorageQty(productId, variantId, newQty);
//     recalcSummaryFromDom();

//     if (currentUserId && itemId) {
//         setCheckoutBtnLoading(true);
//         const ok = await apiUpdateQuantity(currentUserId, itemId, newQty);
//         setCheckoutBtnLoading(false);
//         // if (!ok) { showToast('Quantity update failed. Refreshing...', 'error'); await renderCart(); return; }

//         // if (ok === 'rate_limited') { showToast('Too many requests — please wait a moment', 'info'); return; }

//         if (ok === 'rate_limited') {
//           showToast('Too many requests — please wait a moment', 'info');
//           const allQtyBtns = cartItem?.querySelectorAll('.quantity-decrease, .quantity-increase');
//           allQtyBtns?.forEach(b => { b.disabled = true; b.classList.add('opacity-50', 'cursor-not-allowed'); });
//           setTimeout(() => {
//             allQtyBtns?.forEach(b => { b.disabled = false; b.classList.remove('opacity-50', 'cursor-not-allowed'); });
//           }, 5000); // freeze for 5s
//           return;
//         }
//         if (!ok) { showToast('Quantity update failed. Refreshing...', 'error'); await renderCart(); return; }
//     }
//     showToast('Quantity updated', 'success');
// }

// ─── Replace handleQuantityIncrease ──────────────────────────────────────────
async function handleQuantityIncrease(e) {
    e.preventDefault(); e.stopPropagation();
    const btn       = e.currentTarget;
    const itemId    = btn.getAttribute('data-item-id');
    const productId = btn.getAttribute('data-product-id');
    const variantId = btn.getAttribute('data-variant-id') || null;
    const cartItem  = btn.closest('.cart-item');
    const current   = parseInt(cartItem?.querySelector('.quantity-value')?.textContent || '1', 10);
    const newQty    = current + 1;

    // ── Frontend limit gate ───────────────────────────────────────────────────
    if (qtyRequestTracker.isLimitReached(itemId)) {
        showToast('Update limit reached — please wait a moment', 'info');
        disableQtyButtons(cartItem, true);
        return;
    }

    const requestCount = qtyRequestTracker.increment(itemId);

    // Disable buttons when approaching limit
    if (requestCount >= qtyRequestTracker.LIMIT) {
        disableQtyButtons(cartItem, true);
        showToast('Update limit reached — buttons will re-enable shortly', 'info');
    }

    // Optimistic DOM update
    updateQtyInDom(cartItem, newQty);
    updateLocalStorageQty(productId, variantId, newQty);
    recalcSummaryFromDom();

    if (currentUserId && itemId) {
        setCheckoutBtnLoading(true);
        const ok = await apiUpdateQuantity(currentUserId, itemId, newQty);
        setCheckoutBtnLoading(false);

        if (ok === 'rate_limited') {
            // Snap back to last confirmed quantity
            const fallback = confirmedQty[itemId] ?? (current);
            updateQtyInDom(cartItem, fallback);
            updateLocalStorageQty(productId, variantId, fallback);
            recalcSummaryFromDom();
            disableQtyButtons(cartItem, true);
            showToast('Too many requests — quantity restored', 'info');

            // Re-enable after 20s
            setTimeout(() => {
                qtyRequestTracker.reset(itemId);
                disableQtyButtons(cartItem, false);
                // Also re-enable decrease unless qty is 1
                const qty = parseInt(cartItem?.querySelector('.quantity-value')?.textContent || '1', 10);
                const decBtn = cartItem?.querySelector('.quantity-decrease');
                if (decBtn) decBtn.disabled = qty <= 1;
            }, 20000);
            return;
        }

        if (!ok) {
            showToast('Quantity update failed. Refreshing...', 'error');
            await renderCart();
            return;
        }

        // ── Confirmed by backend — save as last known good ────────────────────
        confirmedQty[itemId] = newQty;
    }

    showToast('Quantity updated', 'success');
}

// ─── Helper: disable/enable both qty buttons on a cart item ──────────────────
function disableQtyButtons(cartItemEl, disabled) {
    if (!cartItemEl) return;
    cartItemEl.querySelectorAll('.quantity-increase, .quantity-decrease').forEach(btn => {
        btn.disabled = disabled;
        if (disabled) {
            btn.classList.add('opacity-50', 'cursor-not-allowed');
        } else {
            btn.classList.remove('opacity-50', 'cursor-not-allowed');
        }
    });
}


function updateQtyInDom(cartItemEl, newQty) {
    if (!cartItemEl) return;
    const qtySpan = cartItemEl.querySelector('.quantity-value');
    if (qtySpan) qtySpan.textContent = newQty;

    const decBtn = cartItemEl.querySelector('.quantity-decrease');
    if (decBtn) decBtn.disabled = newQty <= 1;

    const priceEl    = cartItemEl.querySelector('.flex-shrink-0 .font-bold');
    const subtotalEl = cartItemEl.querySelector('.flex.items-center.gap-4 .font-semibold');
    const qtyLabelEl = cartItemEl.querySelector('.flex.items-center.gap-4 .text-xs.text-gray-400');

    if (priceEl && subtotalEl) {
        const unitPrice = parseFloat(priceEl.textContent.replace('₹', '').replace(/,/g, '')) || 0;
        subtotalEl.textContent = `₹${(unitPrice * newQty).toLocaleString('en-IN')}`;
        if (qtyLabelEl) qtyLabelEl.textContent = newQty > 1 ? `${newQty} × ₹${unitPrice.toLocaleString('en-IN')}` : '';
    }
}

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
        }
    } catch (err) { console.error('[Cart][LS] updateLocalStorageQty error:', err); }
}

// ─── Remove ───────────────────────────────────────────────────────────────────

async function handleRemoveItem(e) {
    e.preventDefault(); e.stopPropagation();
    const btn       = e.currentTarget;
    const productId = btn.getAttribute('data-product-id');
    const variantId = btn.getAttribute('data-variant-id') || null;
    confirmAndRemove(productId, variantId, btn.closest('.cart-item'));
}

async function confirmAndRemove(productId, variantId, cartItemEl) {
    showDeleteConfirmModal(
        'Remove Item?',
        'Are you sure you want to remove this item from your cart?',
        async () => {
            if (cartItemEl) { cartItemEl.style.opacity = '0.4'; cartItemEl.style.pointerEvents = 'none'; }
            setCheckoutBtnLoading(true);

            const success = currentUserId
                ? await apiRemoveItem(currentUserId, productId, variantId)
                : removeFromLocalStorage(productId, variantId);

            setCheckoutBtnLoading(false);

            if (success) {
                showToast('Item removed from cart', 'info');

                // === IMPORTANT: Notify Trending "Go to Cart" state ===
                if (typeof window.trendingRemoveFromAddedToCart === 'function') {
                    window.trendingRemoveFromAddedToCart(productId);
                }
                window.dispatchEvent(new CustomEvent('cart:updated', { 
                    detail: { action: 'remove', productId: productId } 
                }));
                if (cartItemEl) {
                    cartItemEl.style.transition = 'opacity 0.3s, transform 0.3s, max-height 0.4s';
                    cartItemEl.style.opacity    = '0';
                    cartItemEl.style.transform  = 'translateX(-20px)';
                    cartItemEl.style.maxHeight  = cartItemEl.scrollHeight + 'px';
                    setTimeout(() => { cartItemEl.style.maxHeight = '0'; cartItemEl.style.padding = '0'; cartItemEl.style.margin = '0'; cartItemEl.style.overflow = 'hidden'; }, 200);
                    setTimeout(() => {
                        cartItemEl.remove();
                        const remaining = document.querySelectorAll('.cart-item');
                        if (remaining.length === 0) {
                            if (cartContent)        cartContent.classList.add('hidden');
                            if (emptyCartMessage)   emptyCartMessage.classList.remove('hidden');
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
                showToast('Failed to remove item. Please try again.', 'error');
                if (cartItemEl) { cartItemEl.style.opacity = '1'; cartItemEl.style.pointerEvents = ''; }
            }
        }
    );
}

function removeFromLocalStorage(productId, variantId) {
    try {
        const raw  = localStorage.getItem('artezocart');
        const cart = safeJsonParse(raw) ?? { items: [] };
        cart.items = cart.items.filter(item =>
            !(String(item.id || item.productId) === String(productId) &&
              (!variantId || (item.variantId || '') === variantId))
        );
        recalcLocalStorageTotals(cart);
        localStorage.setItem('artezocart', JSON.stringify(cart));
        return true;
    } catch { return false; }
}

function recalcLocalStorageTotals(cart) {
    cart.total = cart.items.reduce((s, i) => s + (i.finalPrice || i.unitPrice || i.price || 0) * (i.quantity || 1), 0);
    cart.count = cart.items.reduce((s, i) => s + (i.quantity || 1), 0);
}

// ─── Clear Cart ───────────────────────────────────────────────────────────────

function handleClearCart() {
    showDeleteConfirmModal(
        'Clear Entire Cart?',
        'Are you sure you want to remove all items from your cart? This action cannot be undone.',
        async () => {
            setCheckoutBtnLoading(true);
            let success = false;
            if (currentUserId) { success = await apiClearCart(currentUserId); }
            else { localStorage.removeItem('artezocart'); success = true; }
            setCheckoutBtnLoading(false);
            if (success) {

                showToast('Cart cleared successfully', 'success');

                // === IMPORTANT: Clear all persisted "Go to Cart" states ===
                if (typeof window.trendingRemoveFromAddedToCart === 'function') {
                    // For clear cart, we can reload trending state
                    window.dispatchEvent(new CustomEvent('cart:updated', { 
                        detail: { action: 'clear' } 
                    }));
                } else {
                    // Fallback: clear localStorage directly
                    try {
                        localStorage.removeItem("trendingAddedToCart");
                    } catch(e) {}
                }
                window.dispatchEvent(new CustomEvent('cart:updated')); // ← ADD
                await renderCart(); 
            }
            else showToast('Failed to clear cart. Please try again.', 'error');
        }
    );
}

// ─── Order Summary — Amazon/Flipkart style ────────────────────────────────────
/*
  Breakdown:
    Price (N items)   = sum of all MRP × qty      [shown as original price]
    Discount          = MRP total - selling total  [green, negative]
    Delivery Charges  = FREE ≥ ₹999, else ₹99     [show strikethrough ₹99 FREE]
    ──────────────────────────────────────
    Total Amount      = selling total + delivery
    You save          = discount amount            [green callout at bottom]
*/

function updateCartSummaryFromApi(data) {
    updateCartSummaryRaw({
        totalAmount  : data.totalAmount   ?? 0,
        totalMrp     : data.totalMrp      ?? 0,
        totalDiscount: data.totalDiscount ?? 0,
        totalItems   : data.totalItems    ?? 0,
    });
}

function updateCartSummaryRaw({ totalAmount, totalMrp, totalDiscount, totalItems }) {
    const subtotal    = parseFloat(totalAmount) || 0;
    const mrpTotal    = parseFloat(totalMrp)    || subtotal;   // fallback: mrp = subtotal (no discount)
    const savedAmount = mrpTotal > subtotal ? Math.round(mrpTotal - subtotal) : 0;
    const shippingCost = subtotal > 0
        ? (subtotal >= SHIPPING_THRESHOLD ? FREE_SHIPPING_COST : SHIPPING_COST)
        : 0;
    const grandTotal  = Math.round((subtotal + shippingCost) * 100) / 100;
    const itemLabel   = `${totalItems || ''} item${totalItems !== 1 ? 's' : ''}`.trim();

    // Inject into dedicated breakdown container (see HTML note below)
    const summaryEl = document.getElementById('order-summary-breakdown');
    if (summaryEl) {
        summaryEl.innerHTML = `
            <div class="space-y-2.5 text-sm">
                <div class="flex justify-between">
                    <span class="text-gray-600">Price (${itemLabel})</span>
                    <span class="font-medium text-gray-900">₹${mrpTotal.toLocaleString('en-IN')}</span>
                </div>
                ${savedAmount > 0 ? `
                <div class="flex justify-between">
                    <span class="text-gray-600">Discount</span>
                    <span class="font-medium text-green-600">− ₹${savedAmount.toLocaleString('en-IN')}</span>
                </div>` : ''}
                <!-- <div class="flex justify-between">
                    <span class="text-gray-600">Delivery Charges</span>
                    ${subtotal === 0
                        ? `<span class="text-gray-400">—</span>`
                        : shippingCost === 0
                            ? `<span class="font-medium"><s class="text-gray-400 text-xs mr-1">₹${SHIPPING_COST}</s><span class="text-green-600 font-semibold">FREE</span></span>`
                            : `<span class="font-medium text-gray-900">₹${shippingCost}</span>`
                    }
                </div> -->
            </div>

            <div class="border-t border-dashed border-gray-300 my-3"></div>

            <div class="flex justify-between font-semibold text-base">
                <span class="text-gray-900">Total Amount</span>
                <span style="color:#1D3C4A;">₹${grandTotal.toLocaleString('en-IN')}</span>
            </div>

            ${savedAmount > 0 ? `
            <div class="mt-3 bg-green-50 border border-green-200 rounded-lg px-3 py-2 text-xs text-green-700 font-medium text-center">
                🎉 You will save ₹${savedAmount.toLocaleString('en-IN')} on this order
            </div>` : ''}

            ${subtotal > 0 && subtotal < SHIPPING_THRESHOLD ? `
            <p class="text-xs text-gray-500 mt-2 text-center">
                Add ₹${(SHIPPING_THRESHOLD - subtotal).toLocaleString('en-IN')} more for <span class="text-green-600 font-medium">FREE delivery</span>
            </p>` : ''}`;
    }

    // Legacy element fallbacks
    if (cartSubtotal) cartSubtotal.innerText = `₹${subtotal.toLocaleString('en-IN')}`;
    if (cartShipping) {
        if (subtotal === 0)       { cartShipping.innerText = '—'; cartShipping.className = 'font-medium text-gray-400'; }
        else if (shippingCost === 0) { cartShipping.innerText = 'FREE'; cartShipping.className = 'font-medium text-green-600'; }
        else { cartShipping.innerText = `₹${shippingCost}`; cartShipping.className = 'font-medium text-gray-900'; }
    }
    if (cartTotal) cartTotal.innerText = `₹${grandTotal.toLocaleString('en-IN')}`;

    if (cartService && typeof cartService.updateBadge === 'function') cartService.updateBadge(totalItems || 0);
}

function recalcSummaryFromDom() {
    let subtotal   = 0;
    let totalItems = 0;
    let mrpTotal   = 0;

    document.querySelectorAll('.cart-item').forEach(el => {
        const subtotalEl = el.querySelector('.flex.items-center.gap-4 .font-semibold');
        const qtyEl      = el.querySelector('.quantity-value');
        const mrpEl      = el.querySelector('.flex-shrink-0 .line-through');
        const unitEl     = el.querySelector('.flex-shrink-0 .font-bold');
        const qty        = parseInt(qtyEl?.textContent || '1', 10);

        if (subtotalEl) subtotal += parseFloat(subtotalEl.textContent.replace('₹', '').replace(/,/g, '')) || 0;
        if (qtyEl)      totalItems += qty;

        if (mrpEl) {
            const mrpRaw = mrpEl.textContent.replace(/MRP|₹|,/g, '').trim();
            mrpTotal += (parseFloat(mrpRaw) || 0) * qty;
        } else if (unitEl) {
            mrpTotal += (parseFloat(unitEl.textContent.replace('₹', '').replace(/,/g, '')) || 0) * qty;
        }
    });

    updateCartSummaryRaw({ totalAmount: subtotal, totalMrp: mrpTotal, totalDiscount: mrpTotal - subtotal, totalItems });
}

// ─── Recommended Products from Category API ───────────────────────────────────

async function loadRecommendedProducts(items) {
    if (!recommendedSection || !recommendedGrid) return;

    // Pick category from first cart item
    let category = null;
    if (apiCartData?.items?.length)  category = apiCartData.items[0]?.productCategory || null;
    if (!category && items?.length)  category = items[0]?.productCategory || null;

    if (!category) { recommendedSection.classList.add('hidden'); return; }

    let products = await apiFetchCategoryProducts(category);
    if (!products.length) { recommendedSection.classList.add('hidden'); return; }

    // Exclude items already in cart
    const cartProductIds = new Set(
        (apiCartData?.items ?? []).map(i => String(i.productId))
    );
    products = products.filter(p => !cartProductIds.has(String(p.productPrimeId)));
    if (!products.length) { recommendedSection.classList.add('hidden'); return; }
    
   // Wishlist state — staggered to avoid rate limit burst
    const wishlistStates = {};
    if (currentUserId) {
        for (const p of products) {
            wishlistStates[p.productPrimeId] = await apiCheckWishlist(currentUserId, p.productPrimeId);
            await new Promise(r => setTimeout(r, 80)); // 80ms gap between each check
        }
    }

    // Update section title
    const titleEl = recommendedSection.querySelector('h2');
    if (titleEl) titleEl.textContent = `More in ${category.charAt(0).toUpperCase() + category.slice(1)}`;

    // Remove old "View More" button if it exists
    const oldMore = document.getElementById('rec-view-more-btn');
    if (oldMore) oldMore.remove();

    recommendedGrid.innerHTML = products.map(p => {
        const imgUrl      = resolveImageUrl(p.mainImage);
        const hasDiscount = p.currentMrpPrice > p.currentSellingPrice && p.currentMrpPrice > 0;
        const discPct     = hasDiscount ? Math.round(((p.currentMrpPrice - p.currentSellingPrice) / p.currentMrpPrice) * 100) : 0;
        const isWishlisted = wishlistStates[p.productPrimeId] || false;
        const stockLabel   = p.currentStock === 0
            ? `<p class="text-xs text-red-500 mt-1 font-medium">Out of stock</p>`
            : p.currentStock <= 10
                ? `<p class="text-xs text-orange-500 mt-1">Only ${p.currentStock} left</p>`
                : '';

        return `
        <div class="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-md transition-shadow cursor-pointer group relative"
             onclick="window.location.href='/products/product-detail.html?id=${p.productPrimeId}'">

            <button class="wishlist-rec-btn absolute top-2 right-2 z-10 w-8 h-8 rounded-full bg-white/90 flex items-center justify-center shadow-sm hover:scale-110 transition-transform"
                    data-product-id="${p.productPrimeId}"
                    data-wishlisted="${isWishlisted}"
                    onclick="event.stopPropagation(); toggleRecommendedWishlist(this, ${p.productPrimeId})"
                    title="${isWishlisted ? 'Remove from wishlist' : 'Add to wishlist'}">
                <i class="${isWishlisted ? 'fas' : 'far'} fa-heart text-sm ${isWishlisted ? 'text-red-500' : 'text-gray-400'}"></i>
            </button>

           

            <div class="aspect-square bg-gray-100 overflow-hidden">
                <img src="${escapeHtml(imgUrl)}" alt="${escapeHtml(p.productName)}"
                     class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                     onerror="this.src='https://placehold.co/400x300/e2e8f0/475569?text=Product'">
            </div>

            <div class="p-3">
                <h3 class="text-sm font-medium text-gray-800 line-clamp-2 mb-2">${escapeHtml(p.productName)}</h3>
                <div class="flex items-baseline gap-2 flex-wrap">
                    <span class="font-bold text-base" style="color:#1D3C4A;">₹${p.currentSellingPrice.toLocaleString('en-IN')}</span>
                    ${hasDiscount ? `
                        <span class="text-xs text-gray-400 line-through">₹${p.currentMrpPrice.toLocaleString('en-IN')}</span>
                        <span class="text-xs font-semibold text-green-600">${discPct}% off</span>
                    ` : ''}
                </div>
                ${stockLabel}
                <button class="rec-add-to-cart-btn mt-2.5 w-full bg-[#1D3C4A] text-white text-xs font-medium border border-gray-300 hover:border-accent hover:bg-accent hover:text-white text-gray-700 py-1.5 rounded-lg transition flex items-center justify-center gap-1.5 ${p.currentStock === 0 ? 'opacity-50 cursor-not-allowed' : ''}"
                        data-product-id="${p.productPrimeId}"
                        onclick="event.stopPropagation(); handleRecAddToCart(this, ${JSON.stringify(p).replace(/"/g, '&quot;')})"
                        ${p.currentStock === 0 ? 'disabled' : ''}>
                    <i class="fas fa-cart-plus text-xs"></i>
                    ${p.currentStock === 0 ? 'Out of Stock' : 'Add to Cart'}
                </button>
            </div>
        </div>`;
    }).join('');

    // Insert "View More" button after the grid
    const moreUrl = `/HomeCategory/homecategory.html?category=${encodeURIComponent(category)}`;
    recommendedGrid.insertAdjacentHTML('afterend', `
        <div id="rec-view-more-btn" class="text-center mt-5">
            <a href="${escapeHtml(moreUrl)}"
               class="inline-flex items-center gap-2 border border-gray-300 text-gray-700 hover:border-accent hover:text-accent px-6 py-2.5 rounded-lg text-sm font-medium transition">
                View More in ${escapeHtml(category.charAt(0).toUpperCase() + category.slice(1))}
                <i class="fas fa-arrow-right text-xs"></i>
            </a>
        </div>`);

    // Attach product data to wishlist buttons for sku/price context
    recommendedGrid.querySelectorAll('.wishlist-rec-btn').forEach(btn => {
        const pid = parseInt(btn.getAttribute('data-product-id'));
        btn._productData = products.find(p => p.productPrimeId === pid) || {};
    });

    recommendedSection.classList.remove('hidden');
}

// Wishlist toggle on recommended card
window.toggleRecommendedWishlist = async function(btn, productId) {
    if (!currentUserId) { showToast('Please login to add to wishlist', 'error'); return; }

    const isWishlisted = btn.getAttribute('data-wishlisted') === 'true';
    const icon         = btn.querySelector('i');

    // Optimistic update
    icon.className     = isWishlisted ? 'far fa-heart text-sm text-gray-400' : 'fas fa-heart text-sm text-red-500';
    btn.setAttribute('data-wishlisted', String(!isWishlisted));

    const ok = isWishlisted
        ? await apiRemoveWishlist(currentUserId, productId)
        : await apiAddWishlist(currentUserId, productId, btn._productData || {});

    if (!ok) {
        // Revert
        icon.className = isWishlisted ? 'fas fa-heart text-sm text-red-500' : 'far fa-heart text-sm text-gray-400';
        btn.setAttribute('data-wishlisted', String(isWishlisted));
        showToast('Failed to update wishlist', 'error');
    } else {
        showToast(isWishlisted ? 'Removed from wishlist' : 'Added to wishlist', 'success');
        window.dispatchEvent(new CustomEvent('wishlist:updated')); // ← ADD

    }
};

window.handleRecAddToCart = async function(btn, product) {
    if (!currentUserId) {
        showToast('Please login to add to cart', 'error');
        return;
    }

    // Loading state
    const original = btn.innerHTML;
    btn.disabled   = true;
    btn.innerHTML  = '<i class="fas fa-spinner fa-spin text-xs"></i> Adding...';

    const ok = await apiAddToCart(currentUserId, product);

    if (ok) {
        // Success state
        btn.innerHTML = '<i class="fas fa-check text-xs"></i> Added!';
        btn.classList.remove('text-gray-700');
        btn.classList.add('bg-green-500', 'text-white', 'border-green-500');
        showToast('Item added to cart!', 'success');
        window.dispatchEvent(new CustomEvent('cart:updated')); // ← ADD


        // Reset after 2s
        // setTimeout(() => {
        //     btn.disabled  = false;
        //     btn.innerHTML = '<i class="fa-solid fa-cart-shopping text-[#E39F32] group-hover:text-[#1D3C4A] transition text-[10px] sm:text-xs"></i> Add to Cart';
        //     btn.classList.remove('bg-green-500', 'text-white', 'border-green-500');
        // }, 2000);

        setTimeout(() => {
            window.location.reload();
        }, 1000);

        // Refresh cart count in header badge if available
        if (cartService && typeof cartService.updateBadge === 'function') {
            const count = await apiFetchCart(currentUserId);
            if (count) cartService.updateBadge(count.totalItems || 0);
        }
    } else {
        btn.disabled  = false;
        btn.innerHTML = original;
        showToast('Failed to add to cart. Try again.', 'error');
    }
};



// ─── Checkout ─────────────────────────────────────────────────────────────────

function handleCheckout() {
    if (document.querySelectorAll('.cart-item').length === 0) { showToast('Your cart is empty', 'error'); return; }
    window.location.href = '../Checkout/checkout.html';
}

function setCheckoutBtnLoading(loading) {
    if (!checkoutBtn) return;
    checkoutBtn.disabled  = loading;
    checkoutBtn.innerHTML = loading
        ? '<i class="fas fa-spinner fa-spin mr-2"></i>Please wait...'
        : 'Proceed to Checkout <i class="fa-solid fa-arrow-right ml-2"></i>';
}

// ─── Toast ────────────────────────────────────────────────────────────────────

let toastTimer = null;

function showToast(message, type = 'success') {
    let toast = document.getElementById('toast-notification');
    if (!toast) { toast = document.createElement('div'); toast.id = 'toast-notification'; toast.className = 'fixed bottom-6 right-6 z-50'; document.body.appendChild(toast); }

    const bg   = type === 'success' ? 'bg-green-500' : type === 'error' ? 'bg-red-500' : 'bg-primary';
    const icon = type === 'success' ? 'fa-check-circle' : type === 'error' ? 'fa-exclamation-circle' : 'fa-info-circle';

    toast.innerHTML = `<div class="${bg} text-white px-6 py-3 rounded-lg shadow-lg flex items-center gap-3 min-w-[200px] animate-slide-in"><i class="fa-solid ${icon}"></i><span class="text-sm">${escapeHtml(message)}</span></div>`;
    toast.classList.remove('hidden');

    if (toastTimer) clearTimeout(toastTimer);
    toastTimer = setTimeout(() => { toast.classList.add('hidden'); toast.innerHTML = ''; }, 3000);
}

// ─── Fallback ─────────────────────────────────────────────────────────────────

// ─── Rate Limited Cart State ──────────────────────────────────────────────────
function showRateLimitedCart() {
    if (cartLoading)        cartLoading.classList.add('hidden');
    if (cartContent)        cartContent.classList.add('hidden');
    if (recommendedSection) recommendedSection.classList.add('hidden');
    if (emptyCartMessage)   emptyCartMessage.classList.add('hidden');

    let el = document.getElementById('cartRateLimitMsg');
    if (!el) {
        el = document.createElement('div');
        el.id = 'cartRateLimitMsg';
        // Insert before cartContent or as sibling
        const anchor = cartContent || emptyCartMessage;
        anchor?.parentNode?.insertBefore(el, anchor);
    }

    el.className = '';
    el.innerHTML = `
        <div class="flex flex-col items-center justify-center py-16 px-6 text-center">
            <div class="w-16 h-16 rounded-full bg-amber-50 border border-amber-200 flex items-center justify-center mb-4">
                <i class="fa-solid fa-clock text-amber-400 text-2xl"></i>
            </div>
            <h3 class="text-lg font-semibold text-gray-700 mb-1">Too many requests</h3>
            <p class="text-sm text-gray-500 mb-5">Please wait a moment before loading your cart again.</p>
            <button onclick="handleRateLimitRetry()"
                    class="inline-flex items-center gap-2 bg-[#1D3C4A] text-white px-6 py-2.5 rounded-lg text-sm font-medium hover:bg-[#e39f32] transition">
                <i class="fa-solid fa-rotate-right text-xs"></i> Try Again
            </button>
        </div>`;
    el.classList.remove('hidden');
}

window.handleRateLimitRetry = function() {
    const el = document.getElementById('cartRateLimitMsg');
    if (el) el.classList.add('hidden');
    initAttempts = 0;
    renderCart();
};


function showFallbackMessage() {
    if (cartLoading)        cartLoading.classList.add('hidden');
    if (cartContent)        cartContent.classList.add('hidden');
    if (recommendedSection) recommendedSection.classList.add('hidden');
    if (emptyCartMessage) {
        emptyCartMessage.classList.remove('hidden');
        if (!emptyCartMessage.querySelector('.retry-btn')) {
            const btn = document.createElement('button');
            btn.className   = 'retry-btn mt-4 px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition';
            btn.textContent = 'Retry Loading Cart';
            btn.onclick     = () => { initAttempts = 0; renderCart(); };
            emptyCartMessage.appendChild(btn);
        }
    }
}

// ─── Init ─────────────────────────────────────────────────────────────────────

function initCartPage() {
    if (initAttempts >= MAX_INIT_ATTEMPTS) { showFallbackMessage(); return; }
    initAttempts++;
    try {
        if (typeof window.getCartWishlistService !== 'undefined') cartService = window.getCartWishlistService();
        else if (typeof getCartWishlistService !== 'undefined')   cartService = getCartWishlistService();
    } catch (err) { console.warn('[Cart][Init]', err.message); }
    renderCart();
}

(function injectAnimStyles() {
    if (document.getElementById('cart-anim-styles')) return;
    const s = document.createElement('style');
    s.id = 'cart-anim-styles';
    s.textContent = `
        @keyframes slideIn { from { transform: translateX(100%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
        .animate-slide-in { animation: slideIn 0.3s ease-out; }
        details summary { list-style: none; cursor: pointer; }
        details summary::-webkit-details-marker { display: none; }
        .line-clamp-2 { display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical; overflow:hidden; }
    `;
    document.head.appendChild(s);
})();

if (checkoutBtn) checkoutBtn.addEventListener('click', handleCheckout);
const clearCartBtn = document.getElementById('clearCartBtn');
if (clearCartBtn) clearCartBtn.addEventListener('click', handleClearCart);
window.addEventListener('cartServiceReady', () => { initAttempts = 0; initCartPage(); });
window.addEventListener('storage', e => { if (e.key === 'artezocart') renderCart(); });
document.addEventListener('DOMContentLoaded', () => initCartPage());

console.log('[Cart] cart.js loaded ✓');


