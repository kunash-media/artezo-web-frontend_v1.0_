// GLOBAL UTILITY FUNCTIONS

// Wait for service to be ready
if (!window.cartWishlistService) {
  console.warn('[GlobalUtils] Waiting for CartWishlistService to load...');
  window.addEventListener('cartWishlistServiceReady', initGlobalUtils);
} else {
  initGlobalUtils();
}

function initGlobalUtils() {
  console.log('[GlobalUtils] Initializing...');

  // ==================== GLOBAL ADD TO CART ====================

  /**
   * Add item to cart from anywhere
   * Usage:
   *   addToCartGlobal(product, quantity)  // Pass product object
   *   addToCartGlobal(productId, 1)       // Pass just product ID (simple)
   */
  window.addToCartGlobal = function(productOrId, quantityOrVariant = 1, quantityIfThirdArg = 1) {
    console.log('[GlobalUtils] addToCartGlobal called with:', arguments);

    let product;
    let quantity = quantityOrVariant;

    // Handle different call signatures
    if (typeof productOrId === 'object') {
      // Called with product object: addToCartGlobal({...}, 2)
      product = productOrId;
      quantity = quantityOrVariant || 1;
    } else if (typeof productOrId === 'number' || typeof productOrId === 'string') {
      // Called with product ID: addToCartGlobal(123) or addToCartGlobal(123, 2)
      // Try to get product from database or create minimal object
      product = buildProductFromId(productOrId, quantityOrVariant);
      quantity = quantityIfThirdArg;
    } else {
      showGlobalToast('Invalid product information', 'error');
      return;
    }

    if (!product || !product.productId) {
      showGlobalToast('Could not find product details', 'error');
      return;
    }

    // Show loading state
    showGlobalToast(`Adding ${quantity} item(s) to cart...`, 'loading');

    // Add to service
    const result = window.cartWishlistService.addToCart(product, quantity);

    if (result.success) {
      showGlobalToast(`✓ Added to cart`, 'success');
      // Update any visual indicators
      updateGlobalCartBadge();
    } else {
      showGlobalToast(result.message || 'Failed to add to cart', 'error');
    }

    return result;
  };

  // ==================== GLOBAL REMOVE FROM CART ====================

  /*
   * Remove item from cart
   * Usage:
   *   removeFromCartGlobal(itemId)
   */
  window.removeFromCartGlobal = function(itemId) {
    console.log('[GlobalUtils] removeFromCartGlobal called with:', itemId);

    const result = window.cartWishlistService.removeFromCart(itemId);

    if (result.success) {
      showGlobalToast('✓ Removed from cart', 'info');
      updateGlobalCartBadge();
    } else {
      showGlobalToast(result.message || 'Failed to remove item', 'error');
    }

    return result;
  };

  // ==================== GLOBAL UPDATE QUANTITY ====================

  /*
   * Update quantity of item in cart
   * Usage:
   *   updateCartQuantityGlobal(itemId, 5)
   */
  window.updateCartQuantityGlobal = function(itemId, newQuantity) {
    console.log('[GlobalUtils] updateCartQuantityGlobal called with:', itemId, newQuantity);

    const result = window.cartWishlistService.updateQuantity(itemId, newQuantity);

    if (result.success) {
      showGlobalToast('✓ Quantity updated', 'success');
      updateGlobalCartBadge();
    } else {
      showGlobalToast(result.message || 'Failed to update quantity', 'error');
    }

    return result;
  };

  // ==================== GLOBAL ADD TO WISHLIST ====================

  /*
   * Add item to wishlist from anywhere
   * Usage:
   *   addToWishlistGlobal(product)
   *   addToWishlistGlobal(productId)
   */
  window.addToWishlistGlobal = function(productOrId, variantId = null) {
    console.log('[GlobalUtils] addToWishlistGlobal called with:', productOrId, variantId);

    let product;

    if (typeof productOrId === 'object') {
      // Called with product object
      product = productOrId;
    } else {
      // Called with product ID
      product = buildProductFromId(productOrId, variantId);
    }

    if (!product || !product.productId) {
      showGlobalToast('Could not find product details', 'error');
      return;
    }

    const result = window.cartWishlistService.addToWishlist(product);

    if (result.success) {
      showGlobalToast('❤️ Added to wishlist', 'success');
      updateGlobalWishlistBadge();
      // Update wishlist button states on page
      updateWishlistButtonStates(product.productId, product.variantId, true);
    } else {
      showGlobalToast(result.message || 'Failed to add to wishlist', 'error');
    }

    return result;
  };

  // ==================== GLOBAL REMOVE FROM WISHLIST ====================

  /*
   * Remove item from wishlist
   * Usage:
   *   removeFromWishlistGlobal(productId)
   *   removeFromWishlistGlobal(productId, variantId)
   */
  window.removeFromWishlistGlobal = function(productId, variantId = null) {
    console.log('[GlobalUtils] removeFromWishlistGlobal called with:', productId, variantId);

    const result = window.cartWishlistService.removeFromWishlist(productId, variantId);

    if (result.success) {
      showGlobalToast('❤️ Removed from wishlist', 'info');
      updateGlobalWishlistBadge();
      // Update wishlist button states on page
      updateWishlistButtonStates(productId, variantId, false);
    } else {
      showGlobalToast(result.message || 'Failed to remove from wishlist', 'error');
    }

    return result;
  };

  // ==================== GLOBAL TOGGLE WISHLIST ====================

  /*
   * Toggle wishlist (add if not exists, remove if exists)
   * Usage:
   *   toggleWishlistGlobal(product)
   *   toggleWishlistGlobal(productId, variantId)
   */
  window.toggleWishlistGlobal = function(productOrId, variantId = null) {
    console.log('[GlobalUtils] toggleWishlistGlobal called with:', productOrId, variantId);

    let product;
    let productId;

    if (typeof productOrId === 'object') {
      product = productOrId;
      productId = product.productId;
      variantId = product.variantId || variantId;
    } else {
      productId = productOrId;
    }

    // Check if in wishlist
    const isInWishlist = window.cartWishlistService.isInWishlist(productId, variantId);

    if (isInWishlist) {
      return window.removeFromWishlistGlobal(productId, variantId);
    } else {
      if (!product) {
        product = buildProductFromId(productId, variantId);
      }
      return window.addToWishlistGlobal(product);
    }
  };

  // ==================== HELPER FUNCTIONS ====================

  /*
   * Build product object from ID (for simple cases)
   * This tries to get the product from ProductDatabase if available
   */
  function buildProductFromId(productId, variantId = null) {
    console.log('[GlobalUtils] Building product from ID:', productId, variantId);

    // Try to get from ProductDatabase if available
    if (window.ProductDatabase && typeof window.ProductDatabase.getProductById === 'function') {
      const product = window.ProductDatabase.getProductById(productId);
      
      if (product) {
        let variant = product.availableVariants?.[0]; // Default first variant
        
        if (variantId && product.availableVariants) {
          variant = product.availableVariants.find(v => v.variantId === variantId);
        }

        return {
          productId: product.productId,
          productName: product.productName,
          titleName: product.productName,
          variantId: variant?.variantId || variantId,
          sku: variant?.sku || product.currentSku,
          selectedColor: variant?.color || product.selectedColor,
          selectedSize: variant?.size || null,
          unitPrice: variant?.price || product.currentSellingPrice,
          mrpPrice: variant?.mrp || product.currentMrpPrice,
          image: variant?.mainImage || product.mainImage,
          stock: variant?.stock || product.currentStock
        };
      }
    }

    // Fallback: minimal product object
    console.warn('[GlobalUtils] ProductDatabase not available, using minimal object');
    return {
      productId: productId,
      variantId: variantId,
      titleName: 'Product ' + productId,
      unitPrice: 0
    };
  }

  /**
   * Show toast notification (global, works from any page)
   */
 function showGlobalToast(message, type = 'success') {

  // If page already has toast system use that
  if (typeof showToast === 'function') {
    showToast(message, type);
    return;
  }

  let container = document.getElementById('global-notification-container');

  if (!container) {
    container = document.createElement('div');
    container.id = 'global-notification-container';
    container.style.cssText = `
      position: fixed;
      top: 100px;
      right: 20px;
      z-index: 9999;
      display: flex;
      flex-direction: column;
      gap: 10px;
      max-width: 360px;
    `;
    document.body.appendChild(container);
  }

  const notification = document.createElement('div');

  const colors = {
    success: '#1D3C4A',
    error: '#dc2626',
    info: '#1D3C4A'
  };

  const icons = {
    success: 'fa-check',
    error: 'fa-xmark',
    info: 'fa-circle-info'
  };

  notification.style.cssText = `
    background: white;
    color: #374151;
    padding: 14px 16px;
    border-radius: 10px;
    border: 1px solid #e5e7eb;
    border-left: 4px solid #e39f32;
    box-shadow: 0 8px 24px rgba(0,0,0,0.08);
    font-size: 14px;
    animation: toastSlideIn 0.25s ease;
    display: flex;
    align-items: center;
    gap: 10px;
    font-family: system-ui, sans-serif;
  `;

  notification.innerHTML = `
    <i class="fa-solid ${icons[type] || icons.info}" 
       style="color:${colors[type]}; font-size:14px;"></i>
    <span style="flex:1;">${message}</span>
  `;

  container.appendChild(notification);

  setTimeout(() => {
    notification.style.animation = 'toastSlideOut 0.25s ease';
    setTimeout(() => notification.remove(), 250);
  }, 3000);
}
  /**
   * Update cart count badge in header
   */
  function updateGlobalCartBadge() {
    const count = window.cartWishlistService.cart.totalItems;
    
    // Update all cart badge elements
    document.querySelectorAll('[data-cart-count], #cart-count-badge, .cart-badge').forEach(el => {
      el.textContent = count;
      el.style.display = count > 0 ? 'flex' : 'none';
    });
  }

  /**
   * Update wishlist count badge in header
   */
  function updateGlobalWishlistBadge() {
    const count = window.cartWishlistService.wishlist.items.length;
    
    // Update all wishlist badge elements
    document.querySelectorAll('[data-wishlist-count], #wishlist-count-badge, .wishlist-badge').forEach(el => {
      el.textContent = count;
      el.style.display = count > 0 ? 'flex' : 'none';
    });
  }

  /**
   * Update wishlist button states on the page
   */
  function updateWishlistButtonStates(productId, variantId, isInWishlist) {
    const selector = `[data-product-id="${productId}"]${variantId ? `[data-variant-id="${variantId}"]` : ''}`;
    document.querySelectorAll(selector).forEach(el => {
      const wishlistBtn = el.querySelector('[data-wishlist-btn], .wishlist-btn, .toggle-wishlist');
      if (wishlistBtn) {
        if (isInWishlist) {
          wishlistBtn.classList.add('active', 'in-wishlist');
          wishlistBtn.innerHTML = '<i class="fa-solid fa-heart"></i>';
        } else {
          wishlistBtn.classList.remove('active', 'in-wishlist');
          wishlistBtn.innerHTML = '<i class="fa-regular fa-heart"></i>';
        }
      }
    });
  }

  // ==================== ANIMATIONS ====================

  const style = document.createElement('style');
  style.textContent = `
    @keyframes slideIn {
      from {
        transform: translateX(400px);
        opacity: 0;
      }
      to {
        transform: translateX(0);
        opacity: 1;
      }
    }
    @keyframes slideOut {
      from {
        transform: translateX(0);
        opacity: 1;
      }
      to {
        transform: translateX(400px);
        opacity: 0;
      }
    }
  `;
  document.head.appendChild(style);

  console.log('[GlobalUtils] Ready! Available functions:');
  console.log('  - addToCartGlobal(product, quantity)');
  console.log('  - removeFromCartGlobal(itemId)');
  console.log('  - updateCartQuantityGlobal(itemId, quantity)');
  console.log('  - addToWishlistGlobal(product)');
  console.log('  - removeFromWishlistGlobal(productId, variantId)');
  console.log('  - toggleWishlistGlobal(product)');
}