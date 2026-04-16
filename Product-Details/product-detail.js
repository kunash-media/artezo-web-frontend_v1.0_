(function () {
  "use strict";

  // ─── CONFIG ────────────────────────────────────────────────────────────────
  const BASE_URL = "http://localhost:8085";
  const FALLBACK_IMG = "/Images/product_fallback/artezo_product_fallback_img.png";

  // Hardcoded userId until auth system is wired
  const USER_ID = localStorage.getItem('userId');

  // ─── URL HELPERS ───────────────────────────────────────────────────────────
  function absUrl(path) {
    if (!path) return null;
    if (path.startsWith("http")) return path;
    return BASE_URL + path;
  }

  // ─── READ PRODUCT ID FROM URL ──────────────────────────────────────────────
  const urlParams      = new URLSearchParams(window.location.search);
  const productPrimeId = parseInt(urlParams.get("id")) || 0;

  // ─── STATE ─────────────────────────────────────────────────────────────────
  let rawProduct      = null;
  let safeProductData = null;
  let currentVariant  = null;
  let transformedData = null;

  let currentCustomFields = {};
  let customFieldValues   = {};

  // ─── INIT ──────────────────────────────────────────────────────────────────
  document.addEventListener("DOMContentLoaded", function () {
    if (!productPrimeId) {
      showFatalError("No product ID found in URL.");
      return;
    }
    fetchProductFromAPI(productPrimeId);
  });

  // ═══════════════════════════════════════════════════════════════════════════
  //   API CALLS
  // ═══════════════════════════════════════════════════════════════════════════

  async function fetchProductFromAPI(id) {
    try {
      const res = await fetch(`${BASE_URL}/api/products/get-by-productPrimeId/${id}`, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      rawProduct = await res.json();
      buildSafeProductData(rawProduct);
      renderPage();
    } catch (err) {
      console.error("[ProductDetail] fetch error:", err);
      showFatalError("Could not load product. Please try again.");
    }
  }

  async function apiAddToCart(payload) {
    const res = await fetch(`${BASE_URL}/api/v1/cart/add`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
  }

  async function apiAddToWishlist(payload) {
    const res = await fetch(`${BASE_URL}/api/v1/wishlist/add`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
  }

  /**
   * Fetch addon products for "Bought Together".
   * Each product can have multiple addonKeys — we fire one request per unique key
   * and deduplicate by productPrimeId.
   */
  async function fetchAddonProducts(addonKeys) {
    if (!addonKeys || !addonKeys.length) return [];

    const seen    = new Set();
    const results = [];

    await Promise.all(
      addonKeys.map(async (key) => {
        try {
          const res = await fetch(
            `${BASE_URL}/api/products/get-by-addon?addonKey=${encodeURIComponent(key)}&page=0&size=8`,
            { method: "GET", headers: { "Content-Type": "application/json" } }
          );
          if (!res.ok) return;
          const data = await res.json();
          const items = data.content || [];
          items.forEach((p) => {
            // Exclude current product itself
            if (p.productPrimeId === safeProductData.productId) return;
            if (seen.has(p.productPrimeId)) return;
            seen.add(p.productPrimeId);
            results.push(p);
          });
        } catch (e) {
          console.warn("[AddonProducts] key fetch error:", key, e);
        }
      })
    );

    return results;
  }

  /** Fetch recently viewed products for this user. */
  async function fetchRecentViewed(userId) {
    try {
      const res = await fetch(`${BASE_URL}/api/recent-users/${userId}/recent-viewed`, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      });
      if (!res.ok) return [];
      const data = await res.json();
      return (data.data || []).filter((p) => p.productPrimeId !== safeProductData.productId);
    } catch (e) {
      console.warn("[RecentViewed] fetch error:", e);
      return [];
    }
  }

  /** Fetch suggestion products based on current product context. */
  async function fetchSuggestions(productId, category, subCategory, userId) {
    try {
      const params = new URLSearchParams({
        productid:   productId,
        category:    category   || "",
        subCategory: subCategory || "",
        userId:      userId,
      });
      const res = await fetch(`${BASE_URL}/api/recent-users/suggestions-product?${params}`, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      });
      if (!res.ok) return [];
      const data = await res.json();
      return (data.data || []).filter((p) => p.productPrimeId !== productId);
    } catch (e) {
      console.warn("[Suggestions] fetch error:", e);
      return [];
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  //  DATA NORMALISATION
  // ═══════════════════════════════════════════════════════════════════════════

  function normaliseVariant(v, productFallback) {
    return {
      variantId:    v.variantId,
      color:        v.color       || "Default",
      sku:          v.sku         || productFallback.currentSku,
      price:        v.price       || productFallback.currentSellingPrice,
      mrp:          v.mrp         || productFallback.currentMrpPrice,
      stock:        v.stock       ?? productFallback.currentStock,
      // ── Media ──────────────────────────────────────────────────────────────
      // Variant mainImage: use variant's own, fall back to product mainImage, then fallback img
      mainImage:    absUrl(v.mainImage) || absUrl(productFallback.mainImage) || FALLBACK_IMG,
      // Variant mockups: use variant's own array; null/empty → inherit product-level mockups
      mockupImages: Array.isArray(v.mockupImages) && v.mockupImages.length
        ? v.mockupImages.map((m) => absUrl(m)).filter(Boolean)
        : null,   // null = "inherit from product" — resolved in getVariantMedia()
      // Variant video (not in payload today but structurally supported)
      productVideoUrl: absUrl(v.productVideoUrl) || null,
      // ── Meta ───────────────────────────────────────────────────────────────
      size:         v.size        || "Standard",
      sizes:        v.size ? [v.size] : [],
      titleName:    v.titleName   || v.color || "Default",
      name:         v.titleName   || v.color || "Default",
      weight:       v.weight,
      length:       v.length,
      breadth:      v.breadth,
      height:       v.height,
      mfgDate:      v.mfgDate,
    };
  }

  /**
   * Returns the effective media (mainImage, mockupImages, productVideoUrl)
   * for a given variant — applying product-level fallbacks where variant
   * fields are absent.
   */
  function getVariantMedia(variant) {
    return {
      mainImage:       variant.mainImage,
      mockupImages:    variant.mockupImages !== null
        ? variant.mockupImages
        : safeProductData.mockupImages,   // inherit product-level mockups
      productVideoUrl: variant.productVideoUrl || safeProductData.productVideoUrl || null,
    };
  }

  function buildSafeProductData(p) {
    let customFields = [];
    if (p.customFields) {
      try { customFields = JSON.parse(p.customFields); }
      catch (e) { console.warn("[ProductDetail] customFields parse error:", e); }
    }

    const variants = (p.availableVariants || []).map((v) =>
      normaliseVariant(v, p)
    );

    const heroBanners = (p.heroBanners || []).map((b) => ({
      bannerId:       b.bannerId,
      bannerImg:      absUrl(b.bannerImg),
      imgDescription: b.imgDescription || "",
    }));

    const installationSteps = (p.installationSteps || []).map((s) => ({
      step:             s.step,
      title:            s.title,
      shortDescription: s.shortDescription,
      shortNote:        s.shortNote,
      stepImage:        absUrl(s.stepImage),
      videoUrl:         absUrl(s.videoUrl),
    }));

    // Product-level mockups (used as fallback when variant has none)
    const mockupImages = (p.mockupImages || []).map((img) => absUrl(img)).filter(Boolean);

    const faqAns = p.faq || {};
    const availabeCoupons = p.availableCoupons || [];

    safeProductData = {
      productId:           p.productPrimeId,
      productName:         p.productName,
      brandName:           p.brandName          || "Artezo",
      currentSku:          p.currentSku,
      selectedColor:       p.selectedColor       || "",
      currentSellingPrice: p.currentSellingPrice,
      currentMrpPrice:     p.currentMrpPrice,
      currentStock:        p.currentStock        || 0,
      mainImage:           absUrl(p.mainImage)   || FALLBACK_IMG,
      mockupImages,
      productVideoUrl:     absUrl(p.productVideoUrl) || null,
      hero_banners:        heroBanners,
      availableVariants:   variants,
      productReviews:      p.productReviews       || [],
      specifications:      p.specifications       || {},
      aboutItem:           Array.isArray(p.aboutItem) ? p.aboutItem : [],
      description:         Array.isArray(p.description) ? p.description : [],
      faqAns,
      installationSteps,
      availabeCoupons,
      isCustomizable:      p.isCustomizable       || false,
      customFields,
      productCategory:     p.productCategory,
      productSubCategory:  p.productSubCategory,
      subcategory:         p.productSubCategory,
      globalTags:          p.globalTags           || [],
      isExchange:          p.isExchange,
      returnAvailable:     p.returnAvailable,
      youtubeUrl:          p.youtubeUrl            || "",
      addonKeys:           p.addonKeys             || [],
      underTrendCategory:  p.underTrendCategory    || false,
      // Dimensions
      weight:              p.weight,
      length:              p.length,
      breadth:             p.breadth,
      height:              p.height,
      hsnCode:             p.hsnCode,
      hasVariants:         p.hasVariants,
    };

    currentVariant = variants[0] || null;

    document.title = `Artezo · ${safeProductData.productName}`;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  //  RENDER PAGE
  // ═══════════════════════════════════════════════════════════════════════════

  function renderPage() {
    buildCompleteHTML();
    fillAccordion();
    fillSocialProof();
    fillInstallation();
    fillHeroBanner();
    fillStickyBar();
    setupEventListeners();

    // Async fills — run in parallel after sync render
    fillBoughtTogether();         // fetches from addon API
    fillRecentAndSuggestions();   // fetches recent views + suggestions

    setTimeout(() => {
      setupVariantSelection();
      document.querySelectorAll(".add-to-cart-btn")
        .forEach((btn) => btn.addEventListener("click", handleAddToCart));
      document.querySelectorAll(".buy-now-btn")
        .forEach((btn) => btn.addEventListener("click", handleBuyNow));
      document.querySelectorAll(".wishlist-btn, .wishlist-icon-btn")
        .forEach((btn) => btn.addEventListener("click", handleWishlistToggle));
      document.querySelectorAll(".apply-coupon-btn").forEach((btn) =>
        btn.addEventListener("click", (e) => {
          e.preventDefault();
          const code = btn.dataset.couponCode;
          if (code) applyCoupon(code);
        })
      );
    }, 100);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  //  DISCOUNT HELPER
  // ═══════════════════════════════════════════════════════════════════════════

  function calcDiscount(selling, mrp) {
    if (!mrp || mrp <= selling) return 0;
    return Math.round(((mrp - selling) / mrp) * 100);
  }

  function getDiscountPercent() {
    return calcDiscount(safeProductData.currentSellingPrice, safeProductData.currentMrpPrice);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  //  HERO BANNER
  // ═══════════════════════════════════════════════════════════════════════════

  function fillHeroBanner() {
    const heroSection = document.getElementById("heroSection");
    if (!heroSection) return;

    const heroBanners = safeProductData.hero_banners || [];

    if (heroBanners.length > 0) {
      let heroHTML = `<div class="w-full flex flex-col gap-6 hero-banner-stack">`;
      heroBanners.forEach((banner, index) => {
        if (!banner.bannerImg) return;
        heroHTML += `
          <div class="banner-div">
            <div class="banner-img-wrapper">
              <img src="${banner.bannerImg}"
                   alt="Hero Banner ${index + 1}"
                   class="banner-img"
                   onerror="this.style.display='none'"/>
            </div>
            ${banner.imgDescription
              ? `<div class="banner-desc"><p class="banner-text">${escapeHtml(banner.imgDescription)}</p></div>`
              : ""}
          </div>`;
      });
      heroHTML += `</div>`;
      heroSection.innerHTML = heroHTML;
    } else {
      heroSection.innerHTML = `
        <div class="w-full overflow-hidden rounded-3xl">
          <img src="${safeProductData.mainImage}"
               alt="${escapeHtml(safeProductData.productName)}"
               class="w-full h-auto object-cover"
               onerror="this.src='${FALLBACK_IMG}'"/>
          <div class="px-4 py-6 text-center">
            <p class="text-sm tracking-[0.3em] text-gray-500 uppercase mb-4">
              ${escapeHtml(safeProductData.productCategory || "")}
            </p>
            <h1 class="text-3xl md:text-5xl font-zain font-semibold text-gray-900 leading-tight mb-4">
              ${escapeHtml(safeProductData.productName)}
            </h1>
          </div>
        </div>`;
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  //  THUMBNAIL STRIP  —  shared builder used by both initial render + variant switch
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Rebuild the full thumbnail strip (vertical column + main image).
   * Accepts the media object returned by getVariantMedia().
   */
  function buildMediaStrip(media) {
    const thumbContainer = document.getElementById("thumbContainer");
    const mainImg        = document.getElementById("mainProductImage");
    if (!thumbContainer || !mainImg) return;

    // Build ordered media list: mainImage first, then video (if any), then mockups
    const mediaItems = [];

    // 1. Main image
    mediaItems.push({ type: "image", url: media.mainImage || FALLBACK_IMG });

    // 2. Product / variant video — shown as a thumb with a play icon
    if (media.productVideoUrl) {
      mediaItems.push({ type: "video", url: media.productVideoUrl });
    }

    // 3. Mockup images
    (media.mockupImages || []).forEach((img) => {
      if (img) mediaItems.push({ type: "image", url: img });
    });

    // Render thumbs
    thumbContainer.innerHTML = mediaItems
      .map((item, idx) => {
        if (item.type === "video") {
          return `
            <div class="thumb-video-wrap relative w-full h-16 rounded-md overflow-hidden border-2 cursor-pointer
                        ${idx === 0 ? "border-[#e39f32]" : "border-transparent hover:border-[#e39f32]"}"
                 data-media-index="${idx}" data-media-type="video" data-media-url="${item.url}">
              <video src="${item.url}" class="w-full h-full object-cover" muted preload="metadata"></video>
              <div class="absolute inset-0 flex items-center justify-center bg-black/30">
                <i class="fas fa-play text-white text-xs"></i>
              </div>
            </div>`;
        }
        return `
          <img src="${item.url}"
               data-media-index="${idx}" data-media-type="image" data-media-url="${item.url}"
               class="w-full h-16 object-cover rounded-md cursor-pointer border-2
                      ${idx === 0 ? "border-[#e39f32]" : "border-transparent hover:border-[#e39f32]"}"
               onerror="this.src='${FALLBACK_IMG}'"/>`;
      })
      .join("");

    // Set main display to first item
    setMainMedia(mediaItems[0], mainImg);

    // Wire thumb clicks
    thumbContainer.querySelectorAll("[data-media-index]").forEach((thumb) => {
      thumb.addEventListener("click", function () {
        // Remove active from all
        thumbContainer.querySelectorAll("[data-media-index]").forEach((t) => {
          t.classList.remove("border-[#e39f32]");
          t.classList.add("border-transparent");
        });
        this.classList.remove("border-transparent");
        this.classList.add("border-[#e39f32]");

        const item = mediaItems[parseInt(this.dataset.mediaIndex)];
        setMainMedia(item, mainImg);
      });
    });
  }

  /** Swap the main display area between image and video. */
  function setMainMedia(item, container) {
    if (!container || !item) return;

    if (item.type === "video") {
      // Replace the <img> with a <video> if not already a video
      const existing = container.parentElement.querySelector("#mainProductVideo");
      if (existing) existing.remove();

      container.style.display = "none";
      const vid = document.createElement("video");
      vid.id        = "mainProductVideo";
      vid.src       = item.url;
      vid.controls  = true;
      vid.autoplay  = false;
      vid.muted     = false;
      vid.className = "max-h-full max-w-full object-contain rounded-lg";
      container.parentElement.appendChild(vid);
    } else {
      // Remove any video element
      const existing = container.parentElement.querySelector("#mainProductVideo");
      if (existing) existing.remove();

      container.style.display = "";
      container.src = item.url;
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  //  VARIANT SELECTION
  // ═══════════════════════════════════════════════════════════════════════════

  function getSelectedVariant() {
    const ringCard = document.querySelector("[data-variant-id].ring-2");
    if (ringCard?.dataset?.variantId) {
      const found = safeProductData.availableVariants.find(
        (v) => v.variantId === ringCard.dataset.variantId
      );
      if (found) return found;
    }
    return currentVariant;
  }

  function setupVariantSelection() {
    const variantCards = document.querySelectorAll("[data-variant-id]");
    if (!variantCards.length) return;

    variantCards.forEach((card) => {
      card.addEventListener("click", function (e) {
        e.stopPropagation();
        variantCards.forEach((c) => {
          c.classList.remove("selected", "ring-2", "ring-offset-2", "ring-[#E6A62C]");
          c.classList.add("ring-1", "ring-gray-200");
        });
        this.classList.add("selected", "ring-2", "ring-offset-2", "ring-[#E6A62C]");
        this.classList.remove("ring-1", "ring-gray-200");

        const variantId  = this.dataset.variantId;
        const newVariant = safeProductData.availableVariants.find(
          (v) => v.variantId === variantId
        );
        if (newVariant) {
          currentVariant = newVariant;
          updateProductDisplay();
        }
      });
    });
  }

  /**
   * Full product display update on variant switch.
   * Covers: media strip, price, stock, sku, color, size — everything visible.
   */
  function updateProductDisplay() {
    if (!currentVariant) return;

    // ── 1. Media strip (main image + mockups + video) ──────────────────────
    const media = getVariantMedia(currentVariant);
    buildMediaStrip(media);

    // ── 2. Price ───────────────────────────────────────────────────────────
    const priceEl = document.querySelector(".price-display");
    const mrpEl   = document.querySelector(".price-display")?.closest(".flex")
      ?.querySelector(".line-through");
    if (priceEl) priceEl.textContent = `₹${currentVariant.price.toLocaleString("en-IN")}`;
    if (mrpEl)   mrpEl.textContent   = `₹${currentVariant.mrp.toLocaleString("en-IN")}`;

    // Also update sticky bar price
    const stickyPrice = document.querySelector("#stickyBar .price-sticky");
    if (stickyPrice) stickyPrice.textContent = `₹${currentVariant.price.toLocaleString("en-IN")}`;

    // ── 3. Discount badge ──────────────────────────────────────────────────
    const discPct     = calcDiscount(currentVariant.price, currentVariant.mrp);
    const discBadges  = document.querySelectorAll(".discount-badge");
    discBadges.forEach((b) => {
      b.textContent = discPct > 0 ? `${discPct}% OFF` : "";
      b.style.display = discPct > 0 ? "" : "none";
    });

    // ── 4. Stock ───────────────────────────────────────────────────────────
    const qty      = parseInt(document.getElementById("quantity")?.textContent || 1);
    const stockEl  = document.getElementById("stockInfo");
    const remaining = currentVariant.stock - qty;
    if (stockEl) {
      stockEl.textContent = remaining > 0
        ? `Only ${remaining} items left in stock`
        : "Out of stock";
      stockEl.className = remaining > 0
        ? "text-xs text-green-600 font-semibold"
        : "text-xs text-red-600 font-semibold";
    }

    // ── 5. SKU / Color label ───────────────────────────────────────────────
    const skuEl = document.getElementById("currentSkuLabel");
    if (skuEl) skuEl.textContent = `SKU: ${currentVariant.sku}`;

    const colorEl = document.getElementById("currentColorLabel");
    if (colorEl) colorEl.textContent = `Color: ${currentVariant.color}`;

    // ── 6. Update customization overlay preview if open ────────────────────
    const customPreview = document.getElementById("customPreviewImage");
    if (customPreview) customPreview.src = currentVariant.mainImage;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  //  CART
  // ═══════════════════════════════════════════════════════════════════════════

  async function handleAddToCart(e) {
    e.preventDefault();
    e.stopPropagation();

    if (safeProductData.isCustomizable) {
      openCustomizationOverlay();
      return;
    }

    const variant  = getSelectedVariant();
    const quantity = parseInt(document.getElementById("quantity")?.textContent || 1);
    const payload  = buildCartPayload(variant, quantity, null);

    try {
      await apiAddToCart(payload);
      showToast("Added to cart! 🛒", "success");
    } catch (err) {
      console.error("[Cart] add error:", err);
      showToast("Could not add to cart. Please try again.", "error");
    }
  }

  async function handleBuyNow(e) {
    e.preventDefault();
    e.stopPropagation();

    if (safeProductData.isCustomizable) {
      openCustomizationOverlay();
      return;
    }

    const variant  = getSelectedVariant();
    const quantity = parseInt(document.getElementById("quantity")?.textContent || 1);
    const payload  = buildCartPayload(variant, quantity, null);

    try {
      await apiAddToCart(payload);
      window.location.href = "../Checkout/checkout.html";
    } catch (err) {
      console.error("[BuyNow] error:", err);
      showToast("Could not process. Please try again.", "error");
    }
  }

  function buildCartPayload(variant, quantity, customFieldsJson) {
    return {
      userId:           USER_ID,
      sessionId:        null,
      productId:        safeProductData.productId,
      variantId:        variant?.variantId     || null,
      sku:              variant?.sku           || safeProductData.currentSku,
      selectedColor:    variant?.color         || safeProductData.selectedColor,
      selectedSize:     variant?.size          || null,
      titleName:        variant?.titleName     || variant?.name || "",
      unitPrice:        variant?.price         || safeProductData.currentSellingPrice,
      mrpPrice:         variant?.mrp           || safeProductData.currentMrpPrice,
      quantity,
      customFieldsJson: customFieldsJson || null,
    };
  }

  // ═══════════════════════════════════════════════════════════════════════════
  //  WISHLIST
  // ═══════════════════════════════════════════════════════════════════════════

  async function handleWishlistToggle(e) {
    e.preventDefault();
    e.stopPropagation();

    const btn     = e.currentTarget;
    const variant = getSelectedVariant();

    const payload = {
      userId:           USER_ID,
      wishlistName:     "My Wishlist",
      productId:        safeProductData.productId,
      variantId:        variant?.variantId  || null,
      sku:              variant?.sku        || safeProductData.currentSku,
      selectedColor:    variant?.color      || safeProductData.selectedColor,
      selectedSize:     variant?.size       || null,
      titleName:        variant?.titleName  || variant?.name || "",
      wishlistedPrice:  variant?.price      || safeProductData.currentSellingPrice,
      customFieldsJson: null,
    };

    try {
      await apiAddToWishlist(payload);
      const icon = btn.querySelector("i");
      if (icon) {
        const isFilled = icon.classList.contains("fa-solid");
        icon.className = isFilled
          ? "fa-regular fa-heart"
          : "fa-solid fa-heart text-red-500";
      }
      showToast("Wishlist updated ❤️", "info");
    } catch (err) {
      console.error("[Wishlist] error:", err);
      showToast("Could not update wishlist. Please try again.", "error");
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  //  CUSTOMIZATION OVERLAY
  // ═══════════════════════════════════════════════════════════════════════════

  function buildCustomizationOverlay() {
    if (document.getElementById("customizationOverlay")) return;

    const discPct = getDiscountPercent();

    const overlayHTML = `
      <div id="customizationOverlay"
           class="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 hidden opacity-0 transition-all duration-300 flex items-center justify-center p-4">
        <div class="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl transform transition-all duration-300 scale-95 border border-[#e5e7eb]">

          <!-- HEADER -->
          <div class="sticky top-0 bg-gradient-to-b from-[#fff7d6] via-[#fffdf5] to-white border-b border-[#e5e7eb] px-6 py-6 z-10 rounded-t-2xl shadow-sm">
            <div class="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-6">
              <div class="flex-1">
                <h2 class="text-2xl font-semibold font-zain text-[#1D3C4A] leading-tight mb-4">
                  ${escapeHtml(safeProductData.productName)}
                </h2>
                <div class="flex items-center flex-wrap gap-4">
                  <span class="text-3xl font-bold font-lexend text-[#1D3C4A]">
                    ₹${safeProductData.currentSellingPrice.toLocaleString("en-IN")}
                  </span>
                  ${safeProductData.currentMrpPrice > safeProductData.currentSellingPrice
                    ? `<span class="text-2xl text-gray-400 font-lexend line-through">₹${safeProductData.currentMrpPrice.toLocaleString("en-IN")}</span>`
                    : ""}
                  ${discPct
                    ? `<span class="bg-[#e39f32] text-white font-bold px-4 py-1.5 rounded-2xl text-sm shadow-sm">${discPct}% OFF</span>`
                    : ""}
                </div>
              </div>
              <button id="closeCustomOverlayBtn"
                      class="text-gray-400 hover:text-[#1D3C4A] hover:bg-gray-100 p-3 rounded-2xl transition-all flex-shrink-0 self-start">
                <i class="fas fa-times text-3xl"></i>
              </button>
            </div>
          </div>

          <!-- BODY -->
          <div class="p-6">
            <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">

              <!-- LEFT: Preview + Summary -->
              <div class="space-y-4">
                <div class="bg-gray-100 rounded-xl overflow-hidden aspect-square border border-[#e5e7eb]">
                  <img id="customPreviewImage"
                       src="${safeProductData.mainImage}"
                       alt="Product preview"
                       class="w-full h-full object-cover"
                       onerror="this.src='${FALLBACK_IMG}'">
                </div>
                <div class="bg-gray-50 rounded-xl p-4 border border-[#e5e7eb]">
                  <h3 class="font-semibold text-[#1D3C4A] mb-2">Customization Summary</h3>
                  <div id="customSummary" class="text-sm text-gray-600 space-y-1 max-h-40 overflow-y-auto"></div>
                  <div class="mt-3 pt-3 border-t border-[#e5e7eb]">
                    <div class="flex justify-between items-center">
                      <span class="font-semibold text-gray-700">Total Price</span>
                      <span id="customTotalPrice" class="text-2xl font-bold text-[#e39f32]">
                        ₹${safeProductData.currentSellingPrice.toLocaleString("en-IN")}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <!-- RIGHT: Custom Fields -->
              <div class="space-y-6">
                <div id="customFieldsContainer" class="space-y-5 max-h-[52vh] overflow-y-auto pr-2 custom-scrollbar"></div>

                <!-- WhatsApp Number -->
                <div class="bg-white border border-[#e5e7eb] rounded-xl p-5 shadow-sm">
                  <div class="flex items-start gap-4">
                    <div class="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center flex-shrink-0">
                      <i class="fab fa-whatsapp text-2xl text-green-600"></i>
                    </div>
                    <div class="flex-1">
                      <h4 class="font-semibold text-gray-900">WhatsApp Number</h4>
                      <p class="text-sm text-gray-500 mt-1">We'll send your design preview here before processing.</p>
                      <div class="mt-4 flex items-center border border-[#e5e7eb] rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-green-500">
                        <span class="px-3 bg-gray-50 text-gray-600 text-sm border-r">+91</span>
                        <input type="tel" id="customerWhatsappNumber"
                               placeholder="Enter your WhatsApp number"
                               maxlength="10"
                               class="w-full px-3 py-2 outline-none text-sm"/>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

            </div>
          </div>

          <!-- FOOTER -->
          <div class="sticky bottom-0 bg-white border-t border-[#e5e7eb] px-6 py-4 flex justify-end gap-3">
            <button id="cancelCustomBtn"
                    class="px-6 py-2.5 border border-[#e5e7eb] rounded-lg hover:bg-gray-50 transition font-medium text-[#1D3C4A]">
              Cancel
            </button>
            <button id="addCustomizedToCartBtn"
                    class="px-6 py-2.5 bg-[#1D3C4A] text-white rounded-lg hover:opacity-90 transition font-medium flex items-center gap-2">
              <i class="fas fa-cart-plus"></i> Add to Cart
            </button>
            <button id="buyCustomizedNowBtn"
                    class="px-6 py-2.5 bg-[#e39f32] text-white rounded-lg hover:opacity-90 transition font-medium flex items-center gap-2">
              <i class="fas fa-bolt"></i> Buy Now
            </button>
          </div>

        </div>
      </div>`;

    document.body.insertAdjacentHTML("beforeend", overlayHTML);

    if (!document.getElementById("customizationStyles")) {
      const style       = document.createElement("style");
      style.id          = "customizationStyles";
      style.textContent = `
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: #f1f1f1; border-radius: 3px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #e39f32; border-radius: 3px; }
        .custom-field-card { transition: all 0.2s ease; border: 1px solid #e5e7eb; }
        .custom-field-card:hover { transform: translateY(-2px); box-shadow: 0 6px 18px rgba(0,0,0,0.06); }
        .custom-input:focus { border-color: #e39f32; outline: none; }

        /* Image upload field */
        .cf-image-drop {
          border: 2px dashed #e39f32;
          border-radius: 12px;
          padding: 24px;
          text-align: center;
          cursor: pointer;
          transition: background 0.2s;
          position: relative;
          overflow: hidden;
        }
        .cf-image-drop:hover { background: #fff9f0; }
        .cf-image-drop input[type="file"] {
          position: absolute; inset: 0; opacity: 0; cursor: pointer; width: 100%; height: 100%;
        }
        .cf-image-preview {
          width: 100%; max-height: 180px; object-fit: contain;
          border-radius: 8px; margin-top: 12px; border: 1px solid #e5e7eb;
          display: none;
        }

        /* Radio group */
        .cf-radio-group { display: flex; flex-wrap: wrap; gap: 10px; }
        .cf-radio-pill {
          display: flex; align-items: center; gap: 8px;
          padding: 8px 16px;
          border: 2px solid #e5e7eb;
          border-radius: 999px;
          cursor: pointer;
          font-size: 13px;
          transition: all 0.15s;
          user-select: none;
          background: white;
        }
        .cf-radio-pill:hover { border-color: #e39f32; background: #fff9f0; }
        .cf-radio-pill input[type="radio"] { display: none; }
        .cf-radio-pill.selected {
          border-color: #e39f32;
          background: #fff9f0;
          color: #1D3C4A;
          font-weight: 600;
        }
        .cf-radio-pill .dot {
          width: 14px; height: 14px;
          border: 2px solid #cbd5e1;
          border-radius: 50%;
          display: flex; align-items: center; justify-center: center;
          flex-shrink: 0;
          transition: all 0.15s;
        }
        .cf-radio-pill.selected .dot {
          border-color: #e39f32;
          background: #e39f32;
          box-shadow: inset 0 0 0 3px #fff;
        }
      `;
      document.head.appendChild(style);
    }

    document.getElementById("closeCustomOverlayBtn")
      ?.addEventListener("click", closeCustomizationOverlay);
    document.getElementById("cancelCustomBtn")
      ?.addEventListener("click", closeCustomizationOverlay);
    document.getElementById("addCustomizedToCartBtn")
      ?.addEventListener("click", addCustomizedToCart);
    document.getElementById("buyCustomizedNowBtn")
      ?.addEventListener("click", buyCustomizedNow);
  }

  // ─── Build custom fields UI ─────────────────────────────────────────────────
  function buildCustomFieldsUI(customFields) {
    const container = document.getElementById("customFieldsContainer");
    if (!container) return;

    currentCustomFields = {};
    let html = "";

    customFields.forEach((field) => {
      const fieldId   = `custom_${field.fieldId}`;
      const fieldName = field.fieldName || `field_${field.fieldId}`;
      const inputType = (field.fieldInputType || "text").toLowerCase();

      const fieldLabel =
        field.fieldLabel ||
        fieldName
          .split(/[_\s]+/)
          .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
          .join(" ");

      currentCustomFields[fieldId] = { ...field, fieldName, inputType };

      html += `
        <div class="custom-field-card border border-gray-200 rounded-xl p-4 bg-white" data-field-id="${fieldId}">
          <label class="block font-semibold text-gray-900 mb-1">
            ${escapeHtml(fieldLabel)}
            ${field.required ? '<span class="text-red-500 text-sm ml-1">*</span>' : ""}
          </label>
          ${field.note ? `<p class="text-xs text-gray-500 mb-3">${escapeHtml(field.note)}</p>` : ""}
      `;

      const options = field.dropdownOptions || field.options || [];

      switch (inputType) {

        // ── Image upload ───────────────────────────────────────────────────
        case "image":
          html += `
            <div class="cf-image-drop" id="${fieldId}_drop">
              <input type="file" id="${fieldId}" name="${fieldName}"
                     accept="image/*"
                     data-field-id="${fieldId}"
                     ${field.required ? "required" : ""}>
              <i class="fas fa-cloud-upload-alt text-3xl text-[#e39f32] mb-2 block"></i>
              <p class="text-sm font-medium text-gray-700">Click or drag to upload image</p>
              <p class="text-xs text-gray-400 mt-1">Supports JPG, PNG, WEBP</p>
            </div>
            <img id="${fieldId}_preview" class="cf-image-preview" alt="Preview"/>`;
          break;

        // ── Dropdown / Select ──────────────────────────────────────────────
        case "dropdown":
        case "select":
          html += `
            <select id="${fieldId}" name="${fieldName}"
                    class="custom-input w-full border border-gray-300 rounded-lg p-3 text-sm
                           focus:border-[#e39f32] focus:ring-2 focus:ring-[#e39f32] outline-none transition"
                    ${field.required ? "required" : ""}>
              <option value="">-- Select ${escapeHtml(fieldLabel)} --</option>
              ${options
                .map(
                  (opt) =>
                    `<option value="${escapeHtml(opt)}"
                             ${field.defaultValue === opt ? "selected" : ""}>
                      ${escapeHtml(opt)}
                    </option>`
                )
                .join("")}
            </select>`;
          break;

        // ── Text ───────────────────────────────────────────────────────────
        case "text":
          html += `
            <input type="text" id="${fieldId}" name="${fieldName}"
                   class="custom-input w-full border border-gray-300 rounded-lg p-3 text-sm
                          focus:border-[#e39f32] focus:ring-2 focus:ring-[#e39f32] outline-none transition"
                   placeholder="${escapeHtml(field.placeholder || `Enter ${fieldLabel}`)}"
                   ${field.maxLength ? `maxlength="${field.maxLength}"` : ""}
                   ${field.required ? "required" : ""}
                   value="${escapeHtml(field.defaultValue || "")}">`;
          break;

        // ── Number ─────────────────────────────────────────────────────────
        case "number":
          html += `
            <input type="number" id="${fieldId}" name="${fieldName}"
                   class="custom-input w-full border border-gray-300 rounded-lg p-3 text-sm
                          focus:border-[#e39f32] focus:ring-2 focus:ring-[#e39f32] outline-none transition"
                   placeholder="${escapeHtml(field.placeholder || "")}"
                   ${field.min !== undefined ? `min="${field.min}"` : ""}
                   ${field.max !== undefined ? `max="${field.max}"` : ""}
                   ${field.required ? "required" : ""}
                   value="${field.defaultValue ?? (field.min ?? "")}">`;
          break;

        // ── Textarea ────────────────────────────────────────────────────────
        case "textarea":
          html += `
            <textarea id="${fieldId}" name="${fieldName}"
                      class="custom-input w-full border border-gray-300 rounded-lg p-3 text-sm
                             focus:border-[#e39f32] focus:ring-2 focus:ring-[#e39f32] outline-none transition"
                      placeholder="${escapeHtml(field.placeholder || "")}"
                      rows="3"
                      ${field.maxLength ? `maxlength="${field.maxLength}"` : ""}
                      ${field.required ? "required" : ""}>${escapeHtml(field.defaultValue || "")}</textarea>`;
          break;

        // ── Radio  ──────────────────────────────────────────────────────────
        // If no explicit options provided, render Yes / No as default pills
        case "radio": {
          const radioOptions = options.length ? options : ["Yes", "No"];
          html += `<div class="cf-radio-group" id="${fieldId}_group">`;
          radioOptions.forEach((opt, i) => {
            const optId     = `${fieldId}_opt_${i}`;
            const isDefault = field.defaultValue
              ? field.defaultValue === opt
              : i === 0;
            html += `
              <label class="cf-radio-pill${isDefault ? " selected" : ""}" for="${optId}">
                <input type="radio" id="${optId}" name="${fieldName}"
                       value="${escapeHtml(opt)}"
                       ${isDefault ? "checked" : ""}
                       ${field.required ? "required" : ""}>
                <span class="dot"></span>
                ${escapeHtml(opt)}
              </label>`;
          });
          html += `</div>`;
          break;
        }

        // ── Checkbox ─────────────────────────────────────────────────────────
        case "checkbox":
          html += `
            <label class="flex items-center gap-3 cursor-pointer">
              <input type="checkbox" id="${fieldId}" name="${fieldName}"
                     class="w-5 h-5 accent-[#e39f32] rounded"
                     ${field.defaultValue ? "checked" : ""}>
              <span class="text-sm text-gray-700">Enable ${escapeHtml(fieldLabel)}</span>
            </label>
            ${field.price
              ? `<p class="text-xs text-green-600 mt-2">Additional +₹${field.price}</p>`
              : ""}`;
          break;

        // ── Fallback ─────────────────────────────────────────────────────────
        default:
          html += `
            <input type="text" id="${fieldId}" name="${fieldName}"
                   class="custom-input w-full border border-gray-300 rounded-lg p-3 text-sm
                          focus:border-[#e39f32] outline-none transition"
                   placeholder="${escapeHtml(field.placeholder || "")}"
                   value="${escapeHtml(field.defaultValue || "")}">`;
      }

      html += `</div>`; // close custom-field-card
    });

    container.innerHTML = html;

    // ── Wire up radio pill styling ─────────────────────────────────────────
    container.querySelectorAll(".cf-radio-group").forEach((group) => {
      group.querySelectorAll('input[type="radio"]').forEach((radio) => {
        radio.addEventListener("change", function () {
          group.querySelectorAll(".cf-radio-pill").forEach((p) =>
            p.classList.remove("selected")
          );
          this.closest(".cf-radio-pill")?.classList.add("selected");
          updateCustomizationPrice();
        });
      });
    });

    // ── Wire up image upload preview ─────────────────────────────────────────
    container.querySelectorAll('input[type="file"]').forEach((fileInput) => {
      const preview = document.getElementById(`${fileInput.id}_preview`);
      fileInput.addEventListener("change", function () {
        const file = this.files?.[0];
        if (file && preview) {
          const reader = new FileReader();
          reader.onload = (e) => {
            preview.src           = e.target.result;
            preview.style.display = "block";
            // Store base64 for payload
            customFieldValues[this.name] = e.target.result;
            updateCustomizationPrice();
          };
          reader.readAsDataURL(file);
        }
      });
    });

    // ── Wire up other inputs ──────────────────────────────────────────────
    container
      .querySelectorAll("input:not([type='radio']):not([type='file']), select, textarea")
      .forEach((el) => {
        el.addEventListener("change", updateCustomizationPrice);
        el.addEventListener("input", updateCustomizationPrice);
      });

    updateCustomizationPrice();
  }

  function updateCustomizationPrice() {
    let total      = safeProductData.currentSellingPrice;
    const selections = {};

    for (const [fieldId, field] of Object.entries(currentCustomFields)) {
      const inputType = field.inputType;
      let value;

      if (inputType === "checkbox") {
        const el = document.getElementById(fieldId);
        value = el ? el.checked : false;
        if (value && field.price) total += field.price;

      } else if (inputType === "radio") {
        const checked = document.querySelector(
          `input[name="${field.fieldName}"]:checked`
        );
        value = checked ? checked.value : null;
        if (field.priceMapping && value && field.priceMapping[value])
          total += field.priceMapping[value];

      } else if (inputType === "image") {
        // Already stored in customFieldValues from file reader
        value = customFieldValues[field.fieldName] ? "[Image attached]" : null;

      } else {
        const el = document.getElementById(fieldId);
        value = el ? el.value : null;
        if (field.priceMapping && value && field.priceMapping[value])
          total += field.priceMapping[value];
      }

      if (inputType !== "image") {
        selections[field.fieldName] = value;
        customFieldValues[field.fieldName] = value;
      } else {
        selections[field.fieldName] = value;
      }
    }

    const totalSpan = document.getElementById("customTotalPrice");
    if (totalSpan) totalSpan.textContent = `₹${total.toLocaleString("en-IN")}`;
    updateCustomizationSummary(selections);
  }

  function updateCustomizationSummary(selections) {
    const summaryDiv = document.getElementById("customSummary");
    if (!summaryDiv) return;

    const items = [];
    for (const [key, value] of Object.entries(selections)) {
      if (value !== null && value !== "" && value !== false) {
        const label = key
          .split(/[_\s]+/)
          .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
          .join(" ");
        items.push(
          `<div><span class="font-medium">${escapeHtml(label)}:</span> ${escapeHtml(String(value))}</div>`
        );
      }
    }
    items.push(`<div class="mt-2 pt-2 border-t border-gray-200">
      <span class="font-medium">Base Price:</span>
      ₹${safeProductData.currentSellingPrice.toLocaleString("en-IN")}
    </div>`);

    summaryDiv.innerHTML =
      items.length > 1
        ? items.join("")
        : '<div class="text-gray-400 text-center py-4">No customizations selected yet</div>';
  }

  function openCustomizationOverlay() {
    buildCustomizationOverlay();

    customFieldValues   = {};
    currentCustomFields = {};

    const customFields = safeProductData.customFields || [];
    if (customFields.length > 0) {
      buildCustomFieldsUI(customFields);
    } else {
      const c = document.getElementById("customFieldsContainer");
      if (c)
        c.innerHTML =
          '<div class="text-center text-gray-500 py-8">No customization options available</div>';
    }

    const overlay = document.getElementById("customizationOverlay");
    if (overlay) {
      overlay.classList.remove("hidden");
      requestAnimationFrame(() => {
        overlay.classList.remove("opacity-0");
        overlay.querySelector(".bg-white")?.classList.remove("scale-95");
        overlay.classList.add("opacity-100");
        overlay.querySelector(".bg-white")?.classList.add("scale-100");
      });
      document.body.style.overflow = "hidden";
    }
  }

  function closeCustomizationOverlay() {
    const overlay = document.getElementById("customizationOverlay");
    if (overlay) {
      overlay.classList.add("opacity-0");
      overlay.querySelector(".bg-white")?.classList.add("scale-95");
      overlay.classList.remove("opacity-100");
      overlay.querySelector(".bg-white")?.classList.remove("scale-100");
      setTimeout(() => {
        overlay.classList.add("hidden");
        document.body.style.overflow = "";
      }, 300);
    }
  }

  async function addCustomizedToCart() {
    const variant    = getSelectedVariant();
    const quantity   = parseInt(document.getElementById("quantity")?.textContent || 1);
    const totalText  = document.getElementById("customTotalPrice")?.textContent || "";
    const finalPrice =
      parseInt(totalText.replace(/[^0-9]/g, "")) ||
      safeProductData.currentSellingPrice;

    // Build customFieldsJson — strip base64 image data to keep payload lean;
    // keep the "[Image attached]" placeholder so backend knows it was provided.
    const payloadFields = { ...customFieldValues };
    const payload = buildCartPayload(variant, quantity, JSON.stringify(payloadFields));
    payload.unitPrice = finalPrice;

    try {
      await apiAddToCart(payload);
      showToast("Customized product added to cart! 🛒", "success");
      closeCustomizationOverlay();
    } catch (err) {
      console.error("[CustomCart] error:", err);
      showToast("Could not add to cart. Please try again.", "error");
    }
  }

  async function buyCustomizedNow() {
    const variant    = getSelectedVariant();
    const quantity   = parseInt(document.getElementById("quantity")?.textContent || 1);
    const totalText  = document.getElementById("customTotalPrice")?.textContent || "";
    const finalPrice =
      parseInt(totalText.replace(/[^0-9]/g, "")) ||
      safeProductData.currentSellingPrice;

    const payloadFields = { ...customFieldValues };
    const payload = buildCartPayload(variant, quantity, JSON.stringify(payloadFields));
    payload.unitPrice = finalPrice;

    try {
      await apiAddToCart(payload);
      window.location.href = "../Checkout/checkout.html";
    } catch (err) {
      console.error("[CustomBuy] error:", err);
      showToast("Could not process. Please try again.", "error");
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  //  COUPON
  // ═══════════════════════════════════════════════════════════════════════════

  function applyCoupon(couponCode) {
    const coupon = safeProductData.availabeCoupons?.find(
      (c) => c.couponCode === couponCode
    );
    if (!coupon) {
      showToast("Invalid coupon code", "error");
      return false;
    }

    const variant    = getSelectedVariant();
    const price      = variant?.price || safeProductData.currentSellingPrice;
    const discPct    = parseFloat(coupon.discount);
    const saved      = Math.round((price * discPct) / 100);
    const finalPrice = price - saved;

    showToast(`Coupon applied! You saved ₹${saved}`, "success");

    const priceEl = document.querySelector(".price-display");
    if (priceEl) priceEl.textContent = `₹${finalPrice.toLocaleString("en-IN")}`;
    return true;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  //  STARS + TOAST
  // ═══════════════════════════════════════════════════════════════════════════

  function renderStars(rating, max = 5) {
    let html  = "";
    const full  = Math.floor(rating);
    const half  = rating - full >= 0.5 ? 1 : 0;
    const empty = max - full - half;
    for (let i = 0; i < full; i++)  html += '<i class="fa-solid fa-star"></i>';
    if (half)                        html += '<i class="fa-solid fa-star-half-alt"></i>';
    for (let i = 0; i < empty; i++) html += '<i class="fa-regular fa-star"></i>';
    return html;
  }

  function showToast(message, type = "info") {
    if (window.showGlobalToast) { window.showGlobalToast(message, type); return; }
    let toastEl = document.getElementById("pdToast");
    if (!toastEl) {
      toastEl           = document.createElement("div");
      toastEl.id        = "pdToast";
      toastEl.style.cssText =
        "position:fixed;bottom:24px;right:24px;background:#1D3C4A;color:white;" +
        "padding:12px 24px;border-radius:40px;box-shadow:0 10px 20px rgba(0,0,0,.15);" +
        "z-index:9999;opacity:0;transition:opacity .2s;border-left:4px solid #e39f32;" +
        "font-family:Lexend,sans-serif;font-size:14px;max-width:320px;";
      document.body.appendChild(toastEl);
    }
    toastEl.textContent = message;
    toastEl.style.opacity = "1";
    clearTimeout(toastEl._timeout);
    toastEl._timeout = setTimeout(() => { toastEl.style.opacity = "0"; }, 2500);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  //  TRENDING BADGE  (shown when underTrendCategory === true)
  // ═══════════════════════════════════════════════════════════════════════════

  function trendingBadgeHTML() {
    if (!safeProductData.underTrendCategory) return "";
    return `
      <span class="trending-badge inline-flex items-center gap-1.5 px-3 py-1 rounded-full
                   text-xs font-semibold text-white
                   bg-gradient-to-r from-[#e39f32] to-[#D89F34]
                   shadow-md shadow-[#D89F34]/30
                   animate-pulse-badge align-middle ml-2">
        <i class="fas fa-fire text-[10px] text-red-400"></i>
        Trending
      </span>
      <style>
        @keyframes pulse-badge {
          0%,100% { opacity:1; transform:scale(1); }
          50%      { opacity:.95; transform:scale(1.15); }
        }
        .animate-pulse-badge { animation: pulse-badge 1.5s ease-in-out infinite; }
      </style>`;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  //  BUILD COMPLETE HTML
  // ═══════════════════════════════════════════════════════════════════════════

  function buildCompleteHTML() {
    const discountPercent = calcDiscount(
      safeProductData.currentSellingPrice,
      safeProductData.currentMrpPrice
    );

    const variantColors = safeProductData.availableVariants.map((v) => ({
      variantId: v.variantId,
      sku:       v.sku,
      name:      v.titleName || v.name,
      color:     v.color,
      image:     v.mainImage,
      price:     v.price,
      mrp:       v.mrp,
      stock:     v.stock,
      size:      v.size || "Standard",
      sizes:     v.sizes || [],
    }));

    // Initial media list (product-level, before any variant selection)
    const initialMedia = getVariantMedia(currentVariant || { mainImage: safeProductData.mainImage, mockupImages: null, productVideoUrl: null });

    // Coupons HTML for offer overlay
    const couponsHTML = (safeProductData.availabeCoupons || [])
      .map(
        (coupon) => `
      <div class="bg-gradient-to-br from-[#e39f32]/5 to-[#1D3C4A]/5 rounded-xl p-4 border border-[#e5e7eb]">
        <div class="flex justify-between items-start">
          <div>
            <span class="text-xs text-[#e39f32] uppercase tracking-wide">Limited Time</span>
            <div class="font-lexend text-xl text-[#1D3C4A] mt-1">${escapeHtml(coupon.discount)} OFF</div>
            <p class="text-xs text-[#1D3C4A]/60 mt-1">${escapeHtml(coupon.couponDescription || "")}</p>
            ${coupon.minPurchase ? `<p class="text-[10px] text-gray-400 mt-1">Min. Purchase: ₹${coupon.minPurchase}</p>` : ""}
          </div>
          <div class="bg-white px-3 py-2 rounded-lg border border-[#e5e7eb]">
            <span class="font-mono text-sm text-[#1D3C4A]">${escapeHtml(coupon.couponCode)}</span>
          </div>
        </div>
        <div class="flex gap-2 mt-4">
          <button class="apply-coupon-btn flex-1 bg-[#1D3C4A] text-white text-sm py-2.5 rounded-lg hover:opacity-90 transition"
                  data-coupon-code="${escapeHtml(coupon.couponCode)}">Apply Now</button>
          <button class="copy-coupon-btn flex-1 border border-[#e5e7eb] text-[#1D3C4A] text-sm py-2.5 rounded-lg hover:bg-gray-50 transition"
                  data-coupon-code="${escapeHtml(coupon.couponCode)}">Copy Code</button>
        </div>
      </div>`
      )
      .join("");

    const firstCoupon  = safeProductData.availabeCoupons?.[0];
    const addCartText  = safeProductData.isCustomizable ? "Customize" : "Add to Cart";
    const addCartIcon  = safeProductData.isCustomizable
      ? '<i class="fas fa-sliders-h"></i>'
      : '<i class="fa-solid fa-cart-shopping"></i>';
    const buyNowText   = safeProductData.isCustomizable ? "Customize & Buy" : "Buy Now";

    // Variant cards HTML
    let variantCardsHTML = "";
    if (variantColors.length > 0) {
      variantCardsHTML = `
        <div class="space-y-4 mt-4">
          <div class="flex flex-col sm:flex-row sm:items-start gap-3 sm:gap-4">
            <span class="text-sm font-medium text-[#033E59] hidden sm:block sm:mt-4">Variant:</span>
            <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4 w-full px-1 sm:px-0" id="colorSwatches">
              ${variantColors
                .map((c, idx) => {
                  const sel =
                    idx === 0
                      ? "ring-2 ring-[#E6A62C] ring-offset-1"
                      : "ring-1 ring-gray-200 hover:ring-[#E6A62C]";
                  return `
                    <button class="group bg-white rounded-xl border border-gray-200 p-2 sm:p-3 transition-all duration-300 hover:shadow-md hover:-translate-y-[2px] ${sel}"
                            data-variant-id="${c.variantId}"
                            data-sku="${c.sku}"
                            data-price="${c.price}"
                            data-mrp="${c.mrp}"
                            data-stock="${c.stock}"
                            data-image="${c.image}">
                      <div class="w-full aspect-square rounded-lg overflow-hidden mb-2 sm:mb-3">
                        <img src="${c.image}"
                             class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                             alt="${escapeHtml(c.name)}"
                             onerror="this.src='${FALLBACK_IMG}'">
                      </div>
                      <div class="text-xs sm:text-sm font-medium text-[#033E59] text-center mb-1">${escapeHtml(c.name)}</div>
                      <div class="text-[11px] text-gray-500 text-center mb-1">${escapeHtml(c.color)}</div>
                      <div class="flex justify-center gap-1 flex-wrap border-t border-gray-400">
                        <div class="mt-1">
                            ${(c.sizes || [])
                              .map(
                                (s) =>
                                  `<span class="text-[9px] px-1.5 py-[2px] font-semibold border border-[#D89F34] rounded text-gray-600">${escapeHtml(s)}</span>`
                              )
                              .join("")}
                            
                            <span class="text-[9px] px-1.5 py-[2px] font-semibold border border-[#D89F34] rounded text-gray-700">₹${c.price}</span>
                          </div>
                      </div>
                    </button>`;
                })
                .join("")}
            </div>
          </div>
        </div>`;
    }

    // Build the initial thumbnail list for the strip
    const initialThumbItems = buildThumbItemList(initialMedia);

    const root = document.getElementById("dynamicRoot");
    if (!root) return;

    // Store transformedData for accordion, social proof, etc.
    transformedData = {
      name:           safeProductData.productName,
      brand:          safeProductData.brandName,
      rating:         4.5,
      reviewCount:    safeProductData.productReviews?.length || 0,
      price:          safeProductData.currentSellingPrice,
      originalPrice:  safeProductData.currentMrpPrice,
      discountPercent,
      stock:          safeProductData.currentStock,
      highlights:     Object.entries(safeProductData.specifications).map(([k, v]) => ({
        label:  k.split("_").map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" "),
        value:  v || "N/A",
        accent: k === "material",
      })),

      description:
        [...safeProductData.aboutItem, ...safeProductData.description]
          .filter(Boolean)
          .map((item) => `<p>${escapeHtml(item)}</p>`)
          .join("") || "<p>Premium quality product.</p>",
          
      specifications: Object.entries(safeProductData.specifications).map(([k, v]) => ({
        label: k.split("_").map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" "),
        value: v || "N/A",
      })),

      additionalInfo: [
        ...(safeProductData.aboutItem || [])
      ].filter(Boolean),

      faqs: Object.entries(safeProductData.faqAns).map(([q, a]) => ({ q, a })),
      stats: [
        { value: "5k+",  label: "Happy Customers", stars: 5 },
        { value: "4.5",  label: "Average Rating",  stars: "4.5" },
        { value: "500+", label: "Verified Reviews", extra: "Trusted" },
        { value: "95%",  label: "Recommend Us",    progress: 95 },
      ],
      reviews: (safeProductData.productReviews?.filter((r) => r.approved) || []).map(
        (r) => ({
          name:     r.reviewerName  || "Anonymous",
          img:      r.reviewerImage || "https://randomuser.me/api/portraits/lego/1.jpg",
          rating:   r.rating        || 4,
          location: r.location      || "India",
          time:     r.time          || "recently",
          text:     r.description   || "Great product!",
          likes:    r.likes         || 0,
          verified: r.verified      ?? true,
        })
      ),
      installSteps: safeProductData.installationSteps.map((step, idx) => ({
        step:     step.step,
        title:    step.title,
        desc:     step.shortDescription,
        list:     [step.shortNote || "Follow manufacturer guidelines"],
        time:     idx === 0 ? "15–20 Minutes" : idx === 1 ? "Basic tools required" : "5 Minutes",
        img:      step.stepImage || null,
        alt:      step.title,
        videoUrl: step.videoUrl,
      })),
    };

    root.innerHTML = `
      <div class="grid grid-cols-1 md:grid-cols-12 gap-6 lg:gap-10 items-start px-4 md:px-0">

        <!-- LEFT: Images -->
        <div class="md:col-span-5">
          <div class="sticky top-20">
            <div class="flex gap-2">
              <!-- Thumbnail strip (rebuilt by buildMediaStrip on variant switch) -->
              <div class="flex flex-col gap-2 w-14 flex-shrink-0" id="thumbContainer">
                ${initialThumbItems
                  .map((item, idx) => {
                    if (item.type === "video") {
                      return `
                        <div class="thumb-video-wrap relative w-full h-16 rounded-md overflow-hidden border-2 cursor-pointer
                                    ${idx === 0 ? "border-[#e39f32]" : "border-transparent hover:border-[#e39f32]"}"
                             data-media-index="${idx}" data-media-type="video" data-media-url="${item.url}">
                          <video src="${item.url}" class="w-full h-full object-cover" muted preload="metadata"></video>
                          <div class="absolute inset-0 flex items-center justify-center bg-black/30">
                            <i class="fas fa-play text-white text-xs"></i>
                          </div>
                        </div>`;
                    }
                    return `
                      <img src="${item.url}"
                           data-media-index="${idx}" data-media-type="image" data-media-url="${item.url}"
                           class="w-full h-16 object-cover rounded-md cursor-pointer border-2
                                  ${idx === 0 ? "border-[#e39f32]" : "border-transparent hover:border-[#e39f32]"}"
                           onerror="this.src='${FALLBACK_IMG}'"/>`;
                  })
                  .join("")}
              </div>

              <!-- Main display area -->
              <div class="relative flex-1 bg-white rounded-xl border border-stone-100 shadow-sm
                          flex items-center justify-center p-2 h-[340px] overflow-hidden" id="mainDisplayArea">
                <img id="mainProductImage"
                     src="${initialThumbItems[0]?.type === "image" ? initialThumbItems[0].url : safeProductData.mainImage}"
                     alt="${escapeHtml(safeProductData.productName)}"
                     class="max-h-full max-w-full object-contain"
                     onerror="this.src='${FALLBACK_IMG}'"/>
                ${discountPercent > 0
                  ? `<span class="discount-badge absolute top-2 left-2 text-white text-[10px] font-semibold px-2.5 py-1 rounded-full shadow"
                          style="background:#e6a62c">${discountPercent}% OFF</span>`
                  : ""}
              </div>
            </div>
          </div>
        </div>

        <!-- RIGHT: Details -->
        <div class="md:col-span-7">
          <div class="overflow-y-auto max-h-[calc(100vh-5rem)] pr-2 space-y-3 hide-scrollbar">

            <!-- Product name + Trending badge -->
            <h1 class="text-3xl md:text-4xl font-normal font-zain leading-tight text-[#033E59]">
              ${escapeHtml(safeProductData.productName)}${trendingBadgeHTML()}
            </h1>

            <!-- Rating + Brand + Share -->
            <div class="flex items-start justify-between gap-3 mb-2">
              <div class="flex items-center gap-2 flex-wrap flex-1">
                <div class="flex text-amber-400 text-sm gap-0.5">${renderStars(4.5)}</div>
                <span class="text-sm font-lexend text-stone-600">${transformedData.reviewCount} reviews</span>
                <div class="flex items-center gap-2 px-2 py-0.5 rounded-full border ml-2"
                     style="background-color:#d6e8f9;border-color:#e5e7eb">
                  <span class="text-xs font-lexend font-semibold text-[#1D3C4A]">
                    Brand: ${escapeHtml(safeProductData.brandName)}
                  </span>
                </div>
              </div>
              <div class="relative flex-shrink-0" id="shareContainer" style="z-index:30;">
                <button id="shareButton"
                        class="w-9 h-9 rounded-full border border-stone-200 flex items-center justify-center hover:bg-stone-100 transition bg-white shadow-sm">
                  <i class="fa-solid fa-share-nodes text-[#033E59]"></i>
                </button>
                <div id="sharePopup" class="absolute right-0 mt-2 w-48 bg-white shadow-xl rounded-xl border p-2 z-40 hidden">
                  <div class="flex flex-col gap-1 text-sm">
                    <button class="share-copy-link flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-yellow-50 w-full text-left">
                      <i class="fa-solid fa-link text-[#E6A62C]"></i>Copy link
                    </button>
                    <button class="share-email flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-yellow-50 w-full text-left">
                      <i class="fa-solid fa-envelope text-[#E6A62C]"></i>Email
                    </button>
                    <a href="https://wa.me/?text=${encodeURIComponent(window.location.href)}" target="_blank"
                       class="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-yellow-50 w-full text-left">
                      <i class="fa-brands fa-whatsapp text-[#E6A62C]"></i>WhatsApp
                    </a>
                  </div>
                </div>
              </div>
            </div>

            <!-- SKU / Color info -->
            <div class="flex items-center gap-4 text-xs text-gray-500">
              <span id="currentSkuLabel">SKU: ${escapeHtml(safeProductData.currentSku)}</span>
              <span>|</span>
              <span id="currentColorLabel">Color: ${escapeHtml(safeProductData.selectedColor)}</span>
            </div>

            <!-- Price + Coupon card -->
            <div class="max-w-[520px] p-2.5 rounded-2xl bg-gradient-to-br from-[#e39f32]/5 to-[#1D3C4A]/5 border border-[#e5e7eb] relative space-y-2 overflow-hidden">
              <div class="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-[#e39f32]/10 to-[#1D3C4A]/10 rounded-bl-full"></div>
              <div class="relative z-10 bg-white/85 backdrop-blur rounded-xl border border-[#e5e7eb] px-2.5 py-2 flex items-center justify-between gap-2.5">
                <div class="flex items-end gap-1">
                  <span class="text-xl md:text-2xl font-bold text-[#1D3C4A] price-display">
                    ₹${safeProductData.currentSellingPrice.toLocaleString("en-IN")}
                  </span>
                  ${safeProductData.currentMrpPrice > safeProductData.currentSellingPrice
                    ? `<span class="text-xs text-[#e39f32] line-through">₹${safeProductData.currentMrpPrice.toLocaleString("en-IN")}</span>
                       ${discountPercent > 0 ? `<span class="discount-badge bg-[#e39f32] text-white text-[8px] px-1.5 py-[2px] rounded-full">${discountPercent}% OFF</span>` : ""}`
                    : ""}
                </div>
                <div class="hidden md:block w-px h-7 bg-[#e5e7eb]"></div>
                <div class="flex items-center gap-1">
                  <span class="text-[10px] text-[#1D3C4A]/70 hidden sm:block">Ends in</span>
                  <div class="flex items-center gap-[3px]">
                    <div class="bg-[#e39f32]/10 px-1 py-[2px] rounded text-[11px] font-mono font-bold text-[#1D3C4A]" id="timerHours">02</div>
                    <span class="text-[#e39f32] font-bold text-[10px]">:</span>
                    <div class="bg-[#e39f32]/10 px-1 py-[2px] rounded text-[11px] font-mono font-bold text-[#1D3C4A]" id="timerMinutes">45</div>
                    <span class="text-[#e39f32] font-bold text-[10px]">:</span>
                    <div class="bg-[#e39f32]/10 px-1 py-[2px] rounded text-[11px] font-mono font-bold text-[#1D3C4A]" id="timerSeconds">12</div>
                  </div>
                </div>
              </div>

              ${firstCoupon
                ? `<div class="relative z-10 bg-[#FCF8F8] border border-[#e5e7eb] rounded-xl p-2.5 flex flex-col gap-2">
                    <div class="flex items-start justify-between gap-2.5">
                      <div>
                        <p class="text-[9px] tracking-wide text-[#e39f32] uppercase font-semibold">LIMITED TIME</p>
                        <h3 class="text-base md:text-lg font-bold text-[#1D3C4A] leading-tight">${escapeHtml(firstCoupon.discount)} OFF</h3>
                        <p class="text-[10px] text-gray-500">${escapeHtml(firstCoupon.couponDescription || "Special discount")}</p>
                      </div>
                      <div class="font-mono text-[10px] bg-white border border-[#e5e7eb] px-2 py-[2px] rounded-md text-[#1D3C4A] shadow-sm">
                        ${escapeHtml(firstCoupon.couponCode)}
                      </div>
                    </div>
                    <div class="flex gap-2">
                      <button class="apply-coupon-btn flex-1 bg-[#1D3C4A] text-white text-xs py-1.5 rounded-lg hover:opacity-90 transition"
                              data-coupon-code="${escapeHtml(firstCoupon.couponCode)}">Apply Now</button>
                      <button id="viewMoreBtn" class="flex-1 border border-[#e5e7eb] text-[#1D3C4A] text-xs py-1.5 rounded-lg hover:bg-[#e39f32]/5 transition flex items-center justify-center gap-1">
                        Offers <i class="fa-solid fa-arrow-right text-[9px] text-[#e39f32]"></i>
                      </button>
                    </div>
                  </div>`
                : ""}
            </div>

            <!-- Offer Overlay (inline) -->
            <div id="offerOverlay" class="hidden fixed inset-0 bg-black/40 backdrop-blur-sm z-50 opacity-0 pointer-events-none flex items-center justify-center transition-opacity duration-300">
              <div id="offerModal" class="hidden flex flex-col bg-white w-full max-w-md mx-4 rounded-xl p-5 border border-[#e5e7eb] shadow-2xl scale-95 opacity-0 transition-all duration-300">
                <button id="closeOffersBtn" class="absolute top-4 right-4 text-[#e39f32] hover:text-[#1D3C4A] transition-colors text-xl">✕</button>
                <h3 class="text-[#1D3C4A] font-lexend text-lg mb-5 pb-2 border-b border-[#e5e7eb]">✨ Available Offers</h3>
                <div class="space-y-4 max-h-[60vh] overflow-y-auto pr-1">${couponsHTML}</div>
              </div>
            </div>

            <!-- Variant Cards -->
            ${variantCardsHTML}

            <!-- Quantity + Add to Cart + Buy Now -->
            <div class="mt-6 bg-white p-4 rounded-xl border border-[#e5e7eb] shadow-sm space-y-3">
              <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                <div class="flex items-center justify-between border border-[#e5e7eb] rounded-lg overflow-hidden">
                  <button id="decreaseBtn" class="px-4 py-2 text-lg hover:bg-stone-50 w-1/3 border-r border-[#e5e7eb]">−</button>
                  <span id="quantity" class="text-sm text-center w-1/3 border-r border-[#e5e7eb] py-2">1</span>
                  <button id="increaseBtn" class="px-4 py-2 text-lg hover:bg-stone-50 w-1/3">+</button>
                </div>
                <button class="add-to-cart-btn flex items-center justify-center gap-2 border border-[#e5e7eb] rounded-lg bg-white text-[#1D3C4A] font-medium px-4 py-2 hover:bg-[#e39f32] hover:text-white transition">
                  ${addCartIcon}
                  <span class="text-sm whitespace-nowrap">${addCartText}</span>
                </button>
                <button class="buy-now-btn flex items-center justify-center gap-2 bg-[#1D3C4A] text-white rounded-lg font-medium px-4 py-2 hover:bg-[#e39f32] transition">
                  <i class="fa-solid fa-bolt"></i>
                  <span class="text-sm whitespace-nowrap">${buyNowText}</span>
                </button>
              </div>
              <div class="flex flex-wrap items-center gap-2 text-xs">
                <p id="stockInfo" class="text-green-600 font-semibold">
                  Only ${safeProductData.currentStock} items left in stock
                </p>
                ${safeProductData.isCustomizable
                  ? `<span class="text-gray-300">|</span>
                     <a href="https://wa.me/919876543210" target="_blank"
                        class="flex items-center gap-1.5 bg-green-50 border border-green-500 text-green-700 px-2.5 py-1 rounded-md font-medium hover:bg-green-100 transition">
                       <i class="fa-brands fa-whatsapp text-green-600 text-sm"></i>
                       Need bulk quantities? Chat with us
                     </a>`
                  : ""}
              </div>
            </div>

            <!-- Delivery strip -->
            <div class="mt-4 px-4 py-3 rounded-lg border border-[#e5e7eb] bg-[#f8fafc]">
              <div class="flex flex-wrap items-center justify-between gap-4 text-xs text-[#1D3C4A]">
                <div class="flex items-center gap-2"><i class="fa-solid fa-box text-[#e39f32]"></i><span>Dispatch: <span class="font-medium">24–48h</span></span></div>
                <div class="w-px h-4 bg-gray-300"></div>
                <div class="flex items-center gap-2"><i class="fa-solid fa-calendar-check text-[#e39f32]"></i><span>Delivery: <span class="font-medium">4–7d</span></span></div>
                <div class="w-px h-4 bg-gray-300"></div>
                <div class="flex items-center gap-2"><i class="fa-solid fa-hand-holding-dollar text-[#e39f32]"></i><span>COD Available</span></div>
                <div class="w-px h-4 bg-gray-300"></div>
                <div class="flex items-center gap-2"><i class="fa-solid fa-truck text-[#e39f32]"></i><span>Free Shipping</span></div>
                <div class="w-px h-4 bg-gray-300"></div>
                <div class="flex items-center gap-2">
                  <i class="fa-solid fa-rotate-left text-[#e39f32]"></i>
                  <span>${safeProductData.returnAvailable ? "Easy Returns" : "No Returns"}</span>
                </div>
              </div>
            </div>

            <!-- Accordion placeholder -->
            <section class="max-w-3xl mx-auto px-4 pt-8 pb-0 font-sans text-[#1D3C4A]">
              <div class="border border-[#e5e7eb] rounded-xl divide-y divide-[#e5e7eb] bg-white" id="accordionContainer"></div>
            </section>

            <!-- Bought Together placeholder (async filled) -->
            <section class="max-w-4xl mx-auto mt-4 mb-12 px-4" id="boughtTogetherSection">
              <h2 class="text-xl font-normal font-lexend text-[#1D3C4A] mb-5">Frequently Bought Together</h2>
              <div class="bg-[#1D3C4A]/5 border border-[#e5e7eb] rounded-2xl p-4 space-y-4" id="boughtTogether">
                <!-- Loading skeleton -->
                ${[1, 2].map(() => `
                  <div class="flex items-center justify-between bg-white border border-[#e5e7eb] rounded-xl p-3">
                    <div class="flex gap-3 items-center w-full">
                      <div class="w-20 h-20 rounded-lg bg-gray-200 animate-pulse flex-shrink-0"></div>
                      <div class="flex-1 space-y-2">
                        <div class="h-4 bg-gray-200 rounded animate-pulse w-3/4"></div>
                        <div class="h-3 bg-gray-200 rounded animate-pulse w-1/2"></div>
                      </div>
                    </div>
                  </div>`).join("")}
              </div>
            </section>

          </div>
        </div>
      </div>

      <!-- Recent Viewed + Suggestions (async filled) -->
      <section id="recentSuggestionSection" class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8"></section>`;

    // Wire up the initial thumb strip click handlers
    wireInitialThumbClicks(initialThumbItems);
  }

  /** Build an ordered media item array from a media object. */
  function buildThumbItemList(media) {
    const items = [];
    items.push({ type: "image", url: media.mainImage || FALLBACK_IMG });
    if (media.productVideoUrl) items.push({ type: "video", url: media.productVideoUrl });
    (media.mockupImages || []).forEach((img) => {
      if (img) items.push({ type: "image", url: img });
    });
    return items;
  }

  /**
   * Wire click handlers on the initial (static-rendered) thumb strip.
   * buildMediaStrip() re-wires dynamically when variant switches.
   */
  function wireInitialThumbClicks(mediaItems) {
    setTimeout(() => {
      const thumbContainer = document.getElementById("thumbContainer");
      const mainImg        = document.getElementById("mainProductImage");
      if (!thumbContainer || !mainImg) return;

      thumbContainer.querySelectorAll("[data-media-index]").forEach((thumb) => {
        thumb.addEventListener("click", function () {
          thumbContainer.querySelectorAll("[data-media-index]").forEach((t) => {
            t.classList.remove("border-[#e39f32]");
            t.classList.add("border-transparent");
          });
          this.classList.remove("border-transparent");
          this.classList.add("border-[#e39f32]");

          const item = mediaItems[parseInt(this.dataset.mediaIndex)];
          if (item) setMainMedia(item, mainImg);
        });
      });
    }, 50);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  //  ACCORDION
  // ═══════════════════════════════════════════════════════════════════════════

  function fillAccordion() {
    const acc = document.getElementById("accordionContainer");
    if (!acc) return;

    let html = "";

    html += buildAccordionItem("Highlights", `
      <div class="rounded-lg overflow-hidden bg-white border border-[#edf2f4] shadow-sm">
        <table class="w-full text-left border-collapse"><tbody>
          ${transformedData.highlights
            .map(
              (h) => `
            <tr class="${h.accent ? "bg-[#fff9f2]" : "border-b border-[#f1f5f7] hover:bg-[#f8fbfc]"}">
              <td class="py-3 px-4 font-medium border-r border-[#f1f5f7] w-1/3 text-[#1D3C4A]">${escapeHtml(h.label)}</td>
              <td class="py-3 px-4 ${h.accent ? "text-[#e39f32] font-medium" : "text-[#1D3C4A]/70"}">${escapeHtml(h.value)}</td>
            </tr>`
            )
            .join("")}
        </tbody></table>
      </div>`);

    html += buildAccordionItem("Product Description", `
      <div class="text-sm text-[#1D3C4A]/80 leading-relaxed space-y-4">${transformedData.description}</div>`);

    html += buildAccordionItem("Specifications", `
      <div class="rounded-lg overflow-hidden bg-white border border-[#edf2f4] shadow-sm">
        <table class="w-full text-left border-collapse"><tbody>
          ${transformedData.specifications
            .map(
              (s) => `
            <tr class="border-b border-[#f1f5f7]">
              <td class="py-3 px-4 font-medium border-r border-[#f1f5f7] w-1/3 text-[#1D3C4A]">${escapeHtml(s.label)}</td>
              <td class="py-3 px-4 text-[#1D3C4A]/70">${escapeHtml(s.value)}</td>
            </tr>`
            )
            .join("")}
        </tbody></table>
      </div>`);

    html += buildAccordionItem("Additional Information", `
      <div class="grid gap-3">
        ${transformedData.additionalInfo
          .map(
            (info) => `
          <div class="flex items-start gap-2 p-3 rounded-md bg-[#f8fbfc] border border-[#eef3f6]">
            <div class="w-1.5 h-1.5 mt-2 rounded-full bg-[#e39f32]"></div>
            <p class="text-[#1D3C4A]/75 text-[13px]">${escapeHtml(info)}</p>
          </div>`
          )
          .join("")}
      </div>`);

    if (transformedData.faqs.length > 0) {
      html += buildAccordionItem("FAQs", `
        <div class="space-y-4">
          ${transformedData.faqs
            .map(
              (faq) => `
            <div class="p-4 rounded-lg border border-[#eef3f6] bg-white shadow-sm">
              <p class="font-medium text-[#1D3C4A] text-[14px]">${escapeHtml(faq.q)}</p>
              <p class="mt-2 text-[#1D3C4A]/70 text-[13px] leading-relaxed">${escapeHtml(faq.a)}</p>
            </div>`
            )
            .join("")}
        </div>`);
    }

    acc.innerHTML = html;

    acc.querySelectorAll(".item").forEach((item) => {
      const btn     = item.querySelector(".toggle");
      const content = item.querySelector(".content");
      const icon    = item.querySelector(".icon");
      if (btn && content && icon) {
        btn.addEventListener("click", () => {
          acc.querySelectorAll(".item").forEach((i) => {
            if (i !== item) {
              i.querySelector(".content")?.classList.remove("open");
              const ic = i.querySelector(".icon");
              if (ic) ic.style.transform = "rotate(0deg)";
            }
          });
          content.classList.toggle("open");
          icon.style.transform = content.classList.contains("open")
            ? "rotate(45deg)"
            : "rotate(0deg)";
        });
      }
    });
  }

  function buildAccordionItem(title, bodyHTML) {
    return `
      <div class="item">
        <button class="toggle w-full flex justify-between items-center px-6 py-5 text-left font-medium font-lexend text-[#1D3C4A]">
          ${escapeHtml(title)}
          <span class="icon text-xl transition-transform duration-300">+</span>
        </button>
        <div class="content">
          <div class="px-6 pb-6 text-sm">${bodyHTML}</div>
        </div>
      </div>`;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  //  BOUGHT TOGETHER  —  real addon API
  // ═══════════════════════════════════════════════════════════════════════════

  async function fillBoughtTogether() {
    const div     = document.getElementById("boughtTogether");
    const section = document.getElementById("boughtTogetherSection");
    if (!div) return;

    const addonProducts = await fetchAddonProducts(safeProductData.addonKeys);

    if (!addonProducts.length) {
      // Nothing to show — hide entire section cleanly
      if (section) section.style.display = "none";
      return;
    }

    if (section) section.style.display = "block";

    let html = addonProducts
      .map((p) => {
        const img        = absUrl(p.mainImage) || FALLBACK_IMG;
        const price      = p.currentSellingPrice;
        const mrp        = p.currentMrpPrice;
        const discPct    = calcDiscount(price, mrp);
        return `
          <div class="flex items-center justify-between bg-white border border-[#e5e7eb] rounded-xl p-3 hover:shadow-sm transition">
            <div class="flex gap-3 items-center flex-1 min-w-0">
              <img src="${img}" class="w-20 h-20 object-cover rounded-lg flex-shrink-0"
                   onerror="this.src='${FALLBACK_IMG}'"/>
              <div class="min-w-0">
                <h3 class="font-medium font-lexend text-[#1D3C4A] text-sm truncate">${escapeHtml(p.productName)}</h3>
                <p class="text-xs text-gray-400 truncate">${escapeHtml(p.productCategory || "")} · ${escapeHtml(p.selectedColor || "")}</p>
                <div class="flex items-center gap-2 mt-1 text-sm">
                  <span class="font-semibold font-lexend text-[#1D3C4A]">₹${price.toLocaleString("en-IN")}</span>
                  ${mrp > price ? `<span class="line-through font-lexend text-gray-400 text-xs">₹${mrp.toLocaleString("en-IN")}</span>` : ""}
                  ${discPct > 0
                    ? `<span class="bg-[#e39f32]/20 text-[#e39f32] text-[10px] px-2 py-[2px] rounded-full">${discPct}% OFF</span>`
                    : ""}
                </div>
              </div>
            </div>
            <input type="checkbox"
                   class="w-5 h-5 accent-[#1D3C4A] product-check flex-shrink-0 ml-3"
                   data-price="${price}"
                   data-product-id="${p.productPrimeId}"
                   checked>
          </div>`;
      })
      .join("");

    html += `<div class="pt-2">
      <button id="addToCartBtn"
              class="w-full bg-[#1D3C4A] text-white font-lexend py-3 rounded-xl text-sm font-medium hover:bg-[#16303b] transition shadow-md">
        Add To Cart
      </button>
    </div>`;

    div.innerHTML = html;

    const checkboxes = div.querySelectorAll(".product-check");
    const btn        = document.getElementById("addToCartBtn");

    function updateTotal() {
      let total = 0, count = 0;
      checkboxes.forEach((c) => {
        if (c.checked) { total += parseFloat(c.dataset.price); count++; }
      });
      if (btn)
        btn.innerHTML = `Add To Cart (${count}) <span class="text-[#e39f32]">• Total ₹${total.toLocaleString("en-IN")}</span>`;
    }
    checkboxes.forEach((c) => c.addEventListener("change", updateTotal));
    updateTotal();
  }

  // ═══════════════════════════════════════════════════════════════════════════
  //  RECENT VIEWED + SUGGESTIONS
  // ═══════════════════════════════════════════════════════════════════════════

  async function fillRecentAndSuggestions() {
    const [recentItems, suggestionItems] = await Promise.all([
      fetchRecentViewed(USER_ID),
      fetchSuggestions(
        safeProductData.productId,
        safeProductData.productCategory,
        safeProductData.productSubCategory,
        USER_ID
      ),
    ]);

    const section = document.getElementById("recentSuggestionSection");
    if (!section) return;

    let html = "";

    // ── Recently Viewed ────────────────────────────────────────────────────
    if (recentItems.length > 0) {
      html += `
        <div class="mb-10">
          <h2 class="text-2xl font-medium font-zain text-[#1D3C4A] mb-1">Recently Viewed</h2>
          <div class="w-12 h-1 bg-[#e39f32] rounded-full mb-5"></div>
          <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            ${recentItems.map((p) => productCardHTML(p)).join("")}
          </div>
        </div>`;
    }

    // ── Suggestions ────────────────────────────────────────────────────────
    if (suggestionItems.length > 0) {
      html += `
        <div class="mb-10">
          <h2 class="text-2xl font-medium font-zain text-[#1D3C4A] mb-1">You May Also Like</h2>
          <div class="w-12 h-1 bg-[#e39f32] rounded-full mb-5"></div>
          <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            ${suggestionItems.map((p) => productCardHTML(p)).join("")}
          </div>
        </div>`;
    }

    if (!html) {
      section.style.display = "none";
      return;
    }

    section.innerHTML = html;

    // Wire add-to-cart on cards
    section.querySelectorAll(".card-add-cart").forEach((btn) => {
      btn.addEventListener("click", async (e) => {
        e.stopPropagation();
        const pid   = parseInt(btn.dataset.productId);
        const price = parseFloat(btn.dataset.price);
        const sku   = btn.dataset.sku;
        const payload = {
          userId:      USER_ID,
          sessionId:   null,
          productId:   pid,
          variantId:   null,
          sku,
          unitPrice:   price,
          mrpPrice:    price,
          quantity:    1,
          customFieldsJson: null,
        };
        try {
          await apiAddToCart(payload);
          showToast("Added to cart! 🛒", "success");
        } catch (err) {
          showToast("Could not add to cart.", "error");
        }
      });
    });
  }

  /** Shared product card HTML for recent-viewed and suggestion grids. */
  function productCardHTML(p) {
    const img     = absUrl(p.mainImage) || FALLBACK_IMG;
    const price   = p.currentSellingPrice;
    const mrp     = p.currentMrpPrice;
    const discPct = calcDiscount(price, mrp);
    const url     = `../Product-Details/product-detail.html?id=${p.productPrimeId}`;

    return `
      <div class="group relative flex flex-col bg-white rounded-2xl border border-[#e5e7eb] shadow-sm
                  hover:shadow-md transition-all duration-300 hover:-translate-y-1 overflow-hidden cursor-pointer"
           onclick="window.location.href='${url}'">
        ${discPct > 0
          ? `<span class="absolute top-2 left-2 z-10 bg-[#e39f32] text-white text-[9px] font-bold px-2 py-0.5 rounded-full">${discPct}% OFF</span>`
          : ""}
        <button class="wishlist-icon-btn absolute top-2 right-2 z-10 w-8 h-8 flex items-center justify-center
                       bg-white border border-[#e5e7eb] rounded-full shadow-sm hover:border-[#e39f32] transition-all"
                onclick="event.stopPropagation()">
          <i class="fa-regular fa-heart text-[#1D3C4A] text-xs"></i>
        </button>
        <div class="aspect-square overflow-hidden bg-gray-50">
          <img src="${img}" alt="${escapeHtml(p.productName)}"
               class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
               onerror="this.src='${FALLBACK_IMG}'"/>
        </div>
        <div class="flex flex-col flex-1 p-3">
          <h3 class="text-sm font-medium font-lexend text-[#1D3C4A] line-clamp-2 mb-1">${escapeHtml(p.productName)}</h3>
          <p class="text-xs text-gray-400 mb-1">${escapeHtml(p.productCategory || "")}</p>
          <div class="flex items-baseline gap-2 mb-3">
            <span class="text-sm font-semibold text-[#1D3C4A]">₹${price.toLocaleString("en-IN")}</span>
            ${mrp > price ? `<span class="text-xs text-gray-400 line-through">₹${mrp.toLocaleString("en-IN")}</span>` : ""}
          </div>
          <button class="card-add-cart mt-auto py-2 rounded-lg border border-[#1D3C4A] text-[#1D3C4A] text-xs
                         font-medium hover:bg-[#1D3C4A] hover:text-white transition"
                  data-product-id="${p.productPrimeId}"
                  data-price="${price}"
                  data-sku="${escapeHtml(p.currentSku || "")}"
                  onclick="event.stopPropagation()">Add to Cart</button>
        </div>
      </div>`;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  //  SIMILAR PRODUCTS  (hides section when no data)
  // ═══════════════════════════════════════════════════════════════════════════

  function fillSimilarProducts() {
    const sec = document.getElementById("similarSection");
    if (!sec) return;
    if (!transformedData.similarProducts?.length) {
      sec.style.display = "none";
      return;
    }
    sec.style.display = "block";
    // (existing render logic preserved verbatim — omitted for brevity since
    // similar products was never populated from API in the original code)
  }

  // ═══════════════════════════════════════════════════════════════════════════
  //  SOCIAL PROOF
  // ═══════════════════════════════════════════════════════════════════════════

  function fillSocialProof() {
    const sec = document.getElementById("socialSection");
    if (!sec) return;

    let html = `
      <div class="mb-8">
        <h2 class="text-2xl md:text-3xl font-semibold font-zain text-[#1D3C4A]">Loved by 5,000+ Happy Customers</h2>
        <p class="text-[#1D3C4A]/70 font-lexend mt-2">Real reviews from real people who trust our quality</p>
      </div>
      <div class="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">`;

    transformedData.stats.forEach((stat) => {
      let stars = "";
      if (stat.stars === 5)     stars = `<i class="fa-solid fa-star"></i>`.repeat(5);
      if (stat.stars === "4.5") stars = `<i class="fa-solid fa-star"></i>`.repeat(4) + `<i class="fa-solid fa-star-half-alt"></i>`;
      html += `
        <div class="bg-gradient-to-br from-white to-[#fefaf5] rounded-2xl border border-[#e5e7eb] p-6 text-center shadow-sm hover:shadow-md transition-all hover:-translate-y-1">
          <div class="text-3xl font-bold font-zain text-[#e39f32] mb-2">${stat.value}</div>
          <div class="text-sm font-medium font-lexend text-[#1D3C4A]">${stat.label}</div>
          <div class="flex justify-center gap-0.5 mt-2 text-[#e39f32]">${stars}</div>
        </div>`;
    });

    html += `</div>`;

    if (transformedData.reviews.length > 0) {
      html += `<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">`;
      transformedData.reviews.forEach((r) => {
        html += `
          <div class="bg-gradient-to-br from-white to-[#fff9f2] rounded-2xl border border-[#e5e7eb] p-6 shadow-sm hover:shadow-xl transition-all hover:-translate-y-1">
            <div class="flex items-start gap-4 mb-4">
              <img src="${r.img}" class="w-12 h-12 rounded-full object-cover border-2 border-[#e39f32]"
                   onerror="this.src='https://randomuser.me/api/portraits/lego/1.jpg'"/>
              <div>
                <h4 class="font-semibold text-[#1D3C4A]">${escapeHtml(r.name)}</h4>
                <div class="flex items-center gap-2 text-sm">
                  <div class="flex text-[#e39f32]">${renderStars(r.rating)}</div>
                  ${r.verified ? `<span class="text-green-600 text-xs flex items-center bg-green-50 px-2 py-0.5 rounded-full"><i class="fa-solid fa-circle-check mr-1"></i>Verified</span>` : ""}
                </div>
              </div>
            </div>
            <p class="text-[#1D3C4A]/80 text-sm leading-relaxed mb-3 italic">"${escapeHtml(r.text)}"</p>
            <div class="flex items-center gap-2 text-xs text-gray-500 border-t border-[#e5e7eb] pt-3">
              <span>${escapeHtml(r.time)}</span><span>•</span><span>${escapeHtml(r.location)}</span>
              <span class="ml-auto"><i class="fa-regular fa-heart text-[#e39f32]"></i> ${r.likes}</span>
            </div>
          </div>`;
      });
      html += `</div>`;
    } else {
      html += `<div class="text-center py-12 text-gray-400 font-lexend">No reviews yet. Be the first to review!</div>`;
    }

    sec.innerHTML = html;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  //  INSTALLATION
  // ═══════════════════════════════════════════════════════════════════════════

  function fillInstallation() {
    const sec = document.getElementById("installSection");
    if (!sec || !transformedData.installSteps?.length) return;

    let html = `
      <div class="max-w-6xl mx-auto px-6 space-y-12">
        <div class="text-center max-w-3xl mx-auto mb-12">
          <span class="text-sm tracking-widest uppercase text-[#e39f32] font-medium">Installation Process</span>
          <h2 class="text-3xl md:text-4xl lg:text-5xl font-zain font-semibold text-[#1D3C4A] mt-4 mb-6 leading-tight">
            Professional Installation Process
          </h2>
          <div class="w-16 h-[3px] bg-[#e39f32] mx-auto mb-6 rounded-full"></div>
          <p class="text-gray-600 font-lexend leading-relaxed text-base md:text-lg">
            Our streamlined workflow ensures safe, precise and flawless installation.
          </p>
        </div>`;

    transformedData.installSteps.forEach((step, idx) => {
      const even = idx % 2 === 0;
      html += `
        <div class="grid md:grid-cols-2 gap-12 items-center">
          <div class="${even ? "" : "order-2 md:order-1"}">
            <h3 class="text-2xl font-lexend font-semibold text-[#1D3C4A] mb-4">${escapeHtml(step.title)}</h3>
            <p class="text-gray-600 mb-6 font-lexend font-light leading-relaxed">${escapeHtml(step.desc)}</p>
            <ul class="space-y-3 text-gray-600 font-lexend font-light mb-6">
              ${step.list
                .map(
                  (l) =>
                    `<li class="flex items-start gap-3"><span class="w-2 h-2 bg-[#e39f32] rounded-full mt-2"></span>${escapeHtml(l)}</li>`
                )
                .join("")}
            </ul>
            <div class="bg-[#1D3C4A]/5 border border-[#e5e7eb] rounded-xl p-4 text-sm font-lexend text-gray-600">
              <span class="font-normal text-[#1D3C4A]">Estimated Time:</span> ${escapeHtml(step.time)}
            </div>
          </div>
          <div class="relative ${even ? "" : "order-1 md:order-2"}">
            <div class="h-[380px] bg-gray-50 rounded-2xl border border-[#e5e7eb] flex items-center justify-center p-6">
              ${step.videoUrl
                ? `<video src="${step.videoUrl}" class="max-h-full max-w-full rounded-xl" controls muted></video>`
                : step.img
                ? `<img src="${step.img}" alt="${escapeHtml(step.alt)}" class="max-h-full max-w-full object-contain"
                        onerror="this.style.display='none'"/>`
                : `<div class="flex flex-col items-center gap-3 text-gray-400">
                     <i class="fas fa-image text-4xl"></i>
                     <p class="text-sm font-lexend">Step ${step.step} visual</p>
                   </div>`}
            </div>
            <div class="absolute -top-4 ${even ? "-left-4" : "-right-4"} bg-[#e39f32] text-white text-sm px-4 py-1 rounded-full shadow">
              Step 0${step.step}
            </div>
          </div>
        </div>`;
    });

    // YouTube embed
    const ytUrl = safeProductData.youtubeUrl;
    if (ytUrl) {
      const ytMatch = ytUrl.match(/(?:v=|youtu\.be\/)([A-Za-z0-9_-]{11})/);
      const ytId    = ytMatch ? ytMatch[1] : null;
      if (ytId) {
        html += `
          <div class="grid md:grid-cols-2 gap-12 items-center pt-6">
            <div>
              <span class="text-sm tracking-widest uppercase text-[#e39f32] font-medium">Video Demonstration</span>
              <h3 class="text-2xl font-semibold font-lexend text-[#1D3C4A] mt-3 mb-4">Watch the Full Installation Process</h3>
              <p class="text-gray-600 font-lexend font-light leading-relaxed mb-5">See our experts complete the installation step-by-step.</p>
            </div>
            <div class="rounded-2xl overflow-hidden border border-[#e5e7eb] shadow-md">
              <iframe class="w-full h-[240px] md:h-[300px]"
                      src="https://www.youtube.com/embed/${ytId}?rel=0&modestbranding=1&controls=1"
                      title="Installation Video" frameborder="0"
                      allow="autoplay; encrypted-media; picture-in-picture" allowfullscreen></iframe>
            </div>
          </div>`;
      }
    }

    html += `</div>`;
    sec.innerHTML = html;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  //  STICKY BAR
  // ═══════════════════════════════════════════════════════════════════════════

  function fillStickyBar() {
    const sticky = document.getElementById("stickyBar");
    if (!sticky) return;

    sticky.innerHTML = `
      <div class="flex flex-wrap md:flex-nowrap items-center md:justify-center justify-between w-full gap-2 md:gap-4">
        <div class="flex items-center gap-2 whitespace-nowrap">
          <span class="font-medium font-lexend text-lg sm:text-xl price-sticky" style="color:#e39f32">
            ₹${safeProductData.currentSellingPrice.toLocaleString("en-IN")}
          </span>
          ${safeProductData.currentMrpPrice > safeProductData.currentSellingPrice
            ? `<span class="text-gray-500 line-through text-sm bg-gray-100 px-2 py-0.5 rounded-md">
                ₹${safeProductData.currentMrpPrice.toLocaleString("en-IN")}
              </span>`
            : ""}
        </div>
        <div class="flex items-center gap-2">
          <button class="add-to-cart-btn border px-3 md:px-4 py-2 rounded-full text-sm md:text-base font-medium font-lexend flex items-center gap-2 transition hover:bg-[#1D3C4A]/10"
                  style="border-color:#1d3c4a;color:#1d3c4a">
            <i class="fas fa-cart-plus text-xs md:text-sm"></i> Cart
          </button>
          <button class="buy-now-btn px-4 md:px-5 py-2 rounded-full text-sm md:text-base font-medium font-lexend flex items-center gap-2"
                  style="background-color:#1d3c4a;color:white">
            Buy <i class="fas fa-arrow-right text-xs md:text-sm"></i>
          </button>
        </div>
        <a href="https://wa.me/+919876543210?text=Hi%2C+I'm+interested+in+this+product.+Can+you+send+a+live+video?"
           target="_blank"
           class="w-full md:w-auto mt-1 md:mt-0 px-4 py-2 rounded-full text-sm md:text-base font-medium font-lexend flex items-center justify-center gap-2 bg-green-600 text-white">
          <i class="fab fa-whatsapp text-sm"></i> Get Live Product Video
        </a>
      </div>`;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  //  EVENT LISTENERS
  // ═══════════════════════════════════════════════════════════════════════════

  function setupEventListeners() {
    // Share button
    setTimeout(() => {
      const shareBtn   = document.getElementById("shareButton");
      const sharePopup = document.getElementById("sharePopup");
      if (shareBtn && sharePopup) {
        shareBtn.addEventListener("click", (e) => {
          e.stopPropagation();
          sharePopup.classList.toggle("hidden");
        });
        document.addEventListener("click", (e) => {
          if (!shareBtn.contains(e.target) && !sharePopup.contains(e.target))
            sharePopup.classList.add("hidden");
        });
        // Copy link
        const copyLinkBtn = sharePopup.querySelector(".share-copy-link");
        copyLinkBtn?.addEventListener("click", () => {
          navigator.clipboard?.writeText(window.location.href).then(() =>
            showToast("Link copied!", "success")
          );
        });
      }
    }, 100);

    // Quantity
    let qty     = 1;
    const qtyEl  = document.getElementById("quantity");
    const stockEl = document.getElementById("stockInfo");

    function getStock() {
      return (getSelectedVariant()?.stock ?? safeProductData.currentStock) || 0;
    }

    function updateQtyUI() {
      if (qtyEl) qtyEl.textContent = qty;
      const stock     = getStock();
      const remaining = stock - qty;
      if (stockEl) {
        stockEl.textContent = remaining > 0
          ? `Only ${remaining} items left in stock`
          : "Out of stock";
        stockEl.className = remaining > 0
          ? "text-xs text-green-600 font-semibold"
          : "text-xs text-red-600 font-semibold";
      }
    }

    document.getElementById("increaseBtn")?.addEventListener("click", () => {
      if (qty < getStock()) { qty++; updateQtyUI(); }
    });
    document.getElementById("decreaseBtn")?.addEventListener("click", () => {
      if (qty > 1) { qty--; updateQtyUI(); }
    });
    updateQtyUI();

    // Countdown timer
    function updateTimer() {
      const h = document.getElementById("timerHours");
      const m = document.getElementById("timerMinutes");
      const s = document.getElementById("timerSeconds");
      if (!h || !m || !s) return;
      let hours = parseInt(h.textContent) || 0;
      let mins  = parseInt(m.textContent) || 0;
      let secs  = parseInt(s.textContent) || 0;
      if (secs > 0)       secs--;
      else if (mins > 0)  { mins--; secs = 59; }
      else if (hours > 0) { hours--; mins = 59; secs = 59; }
      s.textContent = secs.toString().padStart(2, "0");
      m.textContent = mins.toString().padStart(2, "0");
      h.textContent = hours.toString().padStart(2, "0");
    }
    setInterval(updateTimer, 1000);

    // Offer overlay
    const overlay  = document.getElementById("offerOverlay");
    const modal    = document.getElementById("offerModal");
    const viewBtn  = document.getElementById("viewMoreBtn");
    const closeBtn = document.getElementById("closeOffersBtn");

    if (overlay && modal && viewBtn && closeBtn) {
      viewBtn.addEventListener("click", (e) => {
        e.preventDefault();
        overlay.classList.remove("hidden", "opacity-0", "pointer-events-none");
        overlay.classList.add("flex", "opacity-100");
        modal.classList.remove("hidden", "scale-95", "opacity-0");
        modal.classList.add("flex", "scale-100", "opacity-100");
        document.body.classList.add("overflow-hidden");
      });
      function closeOffers() {
        overlay.classList.add("opacity-0", "pointer-events-none");
        modal.classList.add("scale-95", "opacity-0");
        setTimeout(() => {
          overlay.classList.add("hidden");
          modal.classList.add("hidden");
          document.body.classList.remove("overflow-hidden");
        }, 300);
      }
      closeBtn.addEventListener("click", closeOffers);
      overlay.addEventListener("click", (e) => {
        if (e.target === overlay) closeOffers();
      });
    }

    // Copy coupon code
    document.querySelectorAll(".copy-coupon-btn").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        e.preventDefault();
        const code = btn.dataset.couponCode;
        if (code) {
          navigator.clipboard?.writeText(code).then(() =>
            showToast(`Copied: ${code}`, "success")
          );
        }
      });
    });
  }

  // ═══════════════════════════════════════════════════════════════════════════
  //  UTILITIES
  // ═══════════════════════════════════════════════════════════════════════════

  function escapeHtml(text) {
    if (text === null || text === undefined) return "";
    const d = document.createElement("div");
    d.textContent = String(text);
    return d.innerHTML;
  }

  function showFatalError(msg) {
    const root = document.getElementById("dynamicRoot");
    if (root) {
      root.innerHTML = `
        <div class="text-center py-20 font-lexend">
          <i class="far fa-frown text-5xl mb-4" style="color:#e39f32;"></i>
          <p class="text-gray-500 text-lg">${escapeHtml(msg)}</p>
          <a href="../index.html"
             class="mt-6 inline-block px-8 py-3 rounded-full text-sm font-medium text-white transition hover:opacity-90"
             style="background:#1D3C4A;">Back to Home</a>
        </div>`;
    }
  }

})();