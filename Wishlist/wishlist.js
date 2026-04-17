/**
 * Wishlist Page - Production Ready (Backend Only)
 * Uses productImageUrl from backend response
 * Fixed BASE_URL conflict + Clear Wishlist + Move All
 */
 
const BASE_URL_WISHLIST = "http://localhost:8085";
 
let currentWishlistItems = [];
let isLoading = false;
let pendingDeleteAction = null;
 
// DOM Elements
const wishlistGrid = document.getElementById('wishlist-grid');
const wishlistLoading = document.getElementById('wishlist-loading');
const emptyState = document.getElementById('empty-state');
const wishlistCountDisplay = document.getElementById('wishlist-count-display');
const moveAllContainer = document.getElementById('move-all-container');
const moveAllButton = document.getElementById('move-all-to-cart');
const clearWishlistButton = document.getElementById('clear-wishlist-btn');
 
document.addEventListener('DOMContentLoaded', () => {
    console.log("[Wishlist] Production script loaded");
    initWishlistPage();
});
 
async function initWishlistPage() {
    const userId = localStorage.getItem("userId");
    if (!userId) {
        console.warn("[Wishlist] No userId found");
        showEmptyState();
        return;
    }
    await loadWishlistFromBackend(userId);
}
 
async function loadWishlistFromBackend(userId) {
    if (isLoading) return;
    isLoading = true;
    showLoading(true);
 
    try {
        const token = localStorage.getItem("token") || "";
        const headers = {
            "Content-Type": "application/json"
        };
        if (token) headers.Authorization = `Bearer ${token}`;
 
        const response = await fetch(`${BASE_URL_WISHLIST}/api/v1/wishlist?userId=${userId}`, {
            method: "GET",
            headers: headers
        });
 
        if (!response.ok) {
            if (response.status === 401) {
                showToast("Session expired. Please login again.", "error");
                return;
            }
            throw new Error(`HTTP ${response.status}`);
        }
 
        const data = await response.json();
 
        if (data.success && data.data && Array.isArray(data.data) && data.data.length > 0) {
            // Backend returns data[0].items
            currentWishlistItems = data.data[0].items || [];
            console.log(`[Wishlist] Loaded ${currentWishlistItems.length} items from backend`);
 
            currentWishlistItems.length === 0 ? showEmptyState() : renderWishlistItems();
        } else {
            showEmptyState();
        }
    } catch (error) {
        console.error("[Wishlist] Load error:", error);
        showToast("Failed to load wishlist. Please try again.", "error");
        showEmptyState();
    } finally {
        isLoading = false;
        showLoading(false);
    }
}
 
function showLoading(show) {
    if (wishlistLoading) wishlistLoading.classList.toggle('hidden', !show);
    if (wishlistGrid) wishlistGrid.classList.toggle('hidden', show);
}
 
function renderWishlistItems() {
    if (!wishlistGrid) return;
 
    if (wishlistCountDisplay) wishlistCountDisplay.textContent = currentWishlistItems.length;
    if (moveAllContainer) moveAllContainer.classList.remove('hidden');
 
    let html = '';
 
    currentWishlistItems.forEach(item => {
        const productName = item.titleName || `Product ${item.productId}`;
        const sellingPrice = parseFloat(item.wishlistedPrice) || 0;
        const mrpPrice = parseFloat(item.mrpPrice) || sellingPrice;
       
        let discountPercent = 0;
        if (mrpPrice > sellingPrice) {
            discountPercent = Math.round(((mrpPrice - sellingPrice) / mrpPrice) * 100);
        }
       
        const imageUrl = item.productImageUrl ||
                        "https://placehold.co/400x300/e2e8f0/475569?text=No+Image";
 
        const productUrl = `../Product-Details/product-detail.html?id=${item.productId}`;
 
        const discountBadge = discountPercent > 0
            ? `<span class="absolute top-2 left-2 bg-red-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full z-10 shadow">${discountPercent}% OFF</span>`
            : '';
 
        html += `
            <div class="wishlist-item bg-white rounded-lg border border-gray-200 overflow-hidden group cursor-pointer"
                 data-item-id="${item.itemId}"
                 onclick="window.location.href='${productUrl}'">
                <div class="relative">
                    <div class="aspect-square bg-gray-100 overflow-hidden">
                        <img src="${BASE_URL_WISHLIST}${imageUrl}"
                             alt="${escapeHtml(productName)}"
                             class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                             onerror="this.src='https://placehold.co/400x300/e2e8f0/475569?text=No+Image'">
                    </div>
                   
                    ${discountBadge}
 
                    <button onclick="event.stopPropagation(); removeFromWishlist(${item.itemId}, ${item.productId}, '${item.variantId || ''}')"
                            class="remove-wishlist-btn absolute top-2 right-2 bg-white/90 rounded-full shadow-md hover:bg-red-500 hover:text-white transition-all z-10 flex items-center justify-center"
                            style="width: 28px; height: 28px;">
                        <i class="fa-solid fa-trash-can text-xs"></i>
                    </button>
                </div>
 
                <div class="p-2.5 flex flex-col flex-1">
                    <h3 class="font-medium text-gray-800 text-xs mb-1 line-clamp-2 group-hover:text-primary transition-colors">${escapeHtml(productName)}</h3>
                   
                    <div class="mb-2">
                        <div class="flex items-baseline gap-1.5 flex-wrap">
                            <span class="font-bold text-sm text-primary">₹${sellingPrice.toLocaleString('en-IN')}</span>
                            ${mrpPrice > sellingPrice ? `<span class="text-[10px] text-gray-400 line-through">₹${mrpPrice.toLocaleString('en-IN')}</span>` : ''}
                            ${discountPercent > 0 ? `<span class="text-[9px] font-semibold text-green-600">${discountPercent}% off</span>` : ''}
                        </div>
                        ${item.selectedColor ? `<span class="text-[10px] text-gray-500 block">${escapeHtml(item.selectedColor)}</span>` : ''}
                        ${item.selectedSize ? `<span class="text-[10px] text-gray-500 block">${escapeHtml(item.selectedSize)}</span>` : ''}
                    </div>
 
                    <button onclick="event.stopPropagation(); moveToCart(${item.itemId})"
                            class="move-to-cart-btn w-full bg-primary text-white py-1.5 rounded-md text-[11px] font-medium flex items-center justify-center gap-1.5 hover:bg-primary/90 transition mt-auto">
                        <i class="fa-solid fa-cart-shopping text-[10px]"></i>
                        Move to Cart
                    </button>
                </div>
            </div>
        `;
    });
 
    wishlistGrid.innerHTML = html;
    wishlistGrid.classList.remove('hidden');
}
 
// ==================== API Actions ====================
 
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
 
async function removeFromWishlist(itemId, productId, variantId = '') {
    showDeleteConfirmModal(
        'Remove Item?',
        'Are you sure you want to remove this item from your wishlist? This action cannot be undone.',
        async () => {
            const userId = localStorage.getItem("userId");
            if (!userId) return;
 
            try {
                const token = localStorage.getItem("token") || "";
                let url = `${BASE_URL_WISHLIST}/api/v1/wishlist/remove?userId=${userId}&productId=${productId}`;
                if (variantId) url += `&variantId=${variantId}`;
 
                const res = await fetch(url, {
                    method: "DELETE",
                    headers: {
                        "Content-Type": "application/json",
                        ...(token && { Authorization: `Bearer ${token}` })
                    }
                });
 
                if (res.ok) {
                    showToast("Item removed successfully", "success");
                    await loadWishlistFromBackend(userId);
                    window.refreshCartWishlistCount?.();
                } else {
                    throw new Error("Remove failed");
                }
            } catch (err) {
                console.error(err);
                showToast("Failed to remove item", "error");
            }
        }
    );
}
 
async function moveToCart(wishlistItemId) {
    const userId = localStorage.getItem("userId");
    if (!userId) return;
 
    try {
        const token = localStorage.getItem("token") || "";
        const url = `${BASE_URL_WISHLIST}/api/v1/cart/move-from-wishlist?userId=${userId}&wishlistItemId=${wishlistItemId}`;
 
        const res = await fetch(url, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                ...(token && { Authorization: `Bearer ${token}` })
            }
        });
 
        if (res.ok) {
            showToast("Moved to cart successfully!", "success");
            await loadWishlistFromBackend(userId);
            window.refreshCartWishlistCount?.();
        } else {
            throw new Error("Move failed");
        }
    } catch (err) {
        console.error(err);
        showToast("Failed to move to cart", "error");
    }
}
 
async function clearWishlist() {
    showDeleteConfirmModal(
        'Clear Entire Wishlist?',
        'Are you sure you want to remove all items from your wishlist? This action cannot be undone.',
        async () => {
            const userId = localStorage.getItem("userId");
            if (!userId) return;
 
            try {
                const token = localStorage.getItem("token") || "";
                const url = `${BASE_URL_WISHLIST}/api/v1/wishlist/clear?userId=${userId}`;
 
                const res = await fetch(url, {
                    method: "DELETE",
                    headers: {
                        "Content-Type": "application/json",
                        ...(token && { Authorization: `Bearer ${token}` })
                    }
                });
 
                if (res.ok) {
                    showToast("Wishlist cleared successfully", "success");
                    currentWishlistItems = [];
                    showEmptyState();
                    window.refreshCartWishlistCount?.();
                } else {
                    throw new Error("Clear failed");
                }
            } catch (err) {
                console.error(err);
                showToast("Failed to clear wishlist", "error");
            }
        }
    );
}
 
function showEmptyState() {
    if (wishlistLoading) wishlistLoading.classList.add('hidden');
    if (wishlistGrid) wishlistGrid.classList.add('hidden');
    if (emptyState) emptyState.classList.remove('hidden');
    if (moveAllContainer) moveAllContainer.classList.add('hidden');
    if (wishlistCountDisplay) wishlistCountDisplay.textContent = '0';
}
 
function showToast(message, type = 'success') {
    let toast = document.getElementById('toast-notification');
    if (!toast) {
        toast = document.createElement('div');
        toast.id = 'toast-notification';
        toast.className = 'fixed bottom-6 right-6 z-[9999]';
        document.body.appendChild(toast);
    }
 
    const bg = type === 'success' ? 'bg-green-500' : 'bg-red-500';
    toast.innerHTML = `
        <div class="${bg} text-white px-6 py-3 rounded-xl shadow-2xl flex items-center gap-3">
            <i class="fa-solid ${type === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle'}"></i>
            <span>${escapeHtml(message)}</span>
        </div>
    `;
 
    setTimeout(() => {
        toast.style.opacity = '0';
        setTimeout(() => { toast.innerHTML = ''; toast.style.opacity = '1'; }, 400);
    }, 3000);
}
 
function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}
 
// Button Event Listeners
if (moveAllButton) {
    moveAllButton.addEventListener('click', async () => {
        if (currentWishlistItems.length === 0) return;
        for (const item of [...currentWishlistItems]) {   // copy to avoid mutation issues
            await moveToCart(item.itemId);
        }
    });
}
 
if (clearWishlistButton) {
    clearWishlistButton.addEventListener('click', clearWishlist);
}
 
// Global exposure for onclick handlers
window.removeFromWishlist = removeFromWishlist;
window.moveToCart = moveToCart;
window.clearWishlist = clearWishlist;
 
console.log("[Wishlist] Fully loaded and ready for production");