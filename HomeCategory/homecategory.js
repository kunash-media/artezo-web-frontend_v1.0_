// homecategory.js
// Features: product grid + wishlist + add-to-cart + subcategory tags + price filter

(function () {
  "use strict";

  // ─── CONFIG ──────────────────────────────────────────────────────────────────
  const BASE_URL     = "http://localhost:8085";
  const FALLBACK_IMG = "/Images/product_fallback/artezo_product_fallback_img.png";
  const PAGE_SIZE    = 12;

  // ─── WISHLIST STATE ───────────────────────────────────────────────────────────
  const wishlistSet = new Set();
  const inFlight    = new Set();

  // ─── CART STATE ───────────────────────────────────────────────────────────────
  const addedToCartSet = new Set();
  const cartInFlight   = new Set();

  // ─── PRODUCT STATE ────────────────────────────────────────────────────────────
  let currentCategory    = "";
  let currentPage        = 0;
  let totalPages         = 0;
  let totalElements      = 0;
  let isLoading          = false;
  let allProducts        = [];   // raw page products — filter operates on this
  let currentFilter      = "default";
  let activeSubCategory  = null; // null = show all

  // ─── GET USER ID ─────────────────────────────────────────────────────────────
  function getUserId() {
    const direct = localStorage.getItem("userId");
    if (direct) return Number(direct);
    try {
      const u = JSON.parse(localStorage.getItem("user") || "{}");
      if (u.id || u.userId) return Number(u.id || u.userId);
    } catch (_) {}
    try {
      const u = JSON.parse(localStorage.getItem("userData") || "{}");
      if (u.id || u.userId) return Number(u.id || u.userId);
    } catch (_) {}
    return null;
  }

  function getAuthHeaders() {
    const token  = localStorage.getItem("authToken") || sessionStorage.getItem("authToken");
    const userId = getUserId();
    const h = { "Content-Type": "application/json" };
    if (token)  h["Authorization"] = `Bearer ${token}`;
    if (userId) h["X-User-Id"]     = String(userId);
    return h;
  }


  async function loadCartItems() {
  const userId = getUserId();
  if (!userId) return;
  try {
    const res = await fetch(`${BASE_URL}/api/v1/cart?userId=${userId}`, {
      headers: getAuthHeaders()
    });
    if (!res.ok) return;
    const data = await res.json();
    if (!data.success || !data.data?.items) return;
    data.data.items.forEach(item => {
      if (item.productId) addedToCartSet.add(Number(item.productId));
    });
  } catch (err) {
    console.warn("[HC] loadCartItems failed:", err.message);
  }
}

  // ─── INIT ─────────────────────────────────────────────────────────────────────
  async function init() {
    const params = new URLSearchParams(window.location.search);
    currentCategory = params.get("category") || "";

    if (!currentCategory) {
      showError("No category selected. Please navigate from the menu.");
      return;
    }

    updatePageTitle(currentCategory);
    wireGridDelegation();
    wirePriceFilter();

    await Promise.all([
      loadWishlist(),
      fetchProducts(0),
      fetchSubCategories(),
      loadCartItems()  // ← ADD
    ]);
  }

  // ─── PRICE FILTER WIRING ──────────────────────────────────────────────────────
  function wirePriceFilter() {
    const sel = document.getElementById("categoryPriceFilter");
    if (!sel) return;
    sel.addEventListener("change", function () {
      currentFilter = this.value;
      renderProducts(applyFilter(allProducts));
    });
  }

  function applyFilter(products) {
    let list = [...products];

    // Sub-category filter
    if (activeSubCategory) {
      list = list.filter(p =>
        (p.productSubCategory || "").toLowerCase() === activeSubCategory.toLowerCase()
      );
    }

    // Price filter
    switch (currentFilter) {
      case "price_asc":
        list.sort((a, b) => (a.currentSellingPrice || 0) - (b.currentSellingPrice || 0));
        break;
      case "price_desc":
        list.sort((a, b) => (b.currentSellingPrice || 0) - (a.currentSellingPrice || 0));
        break;
      case "under_500":
        list = list.filter(p => (p.currentSellingPrice || 0) < 500);
        break;
      case "500_2000":
        list = list.filter(p => {
          const s = p.currentSellingPrice || 0;
          return s >= 500 && s <= 2000;
        });
        break;
      case "above_2000":
        list = list.filter(p => (p.currentSellingPrice || 0) > 2000);
        break;
      default:
        break;
    }
    return list;
  }

  // ─── SUBCATEGORY TAGS ────────────────────────────────────────────────────────
  async function fetchSubCategories() {
    const container = document.getElementById("categorySubTags");
    if (!container) return;

    try {
      // AFTER — pass the current category from URL
const res = await fetch(
  `${BASE_URL}/api/products/sub-categories?productCategory=${encodeURIComponent(currentCategory)}`,
  { headers: { "Content-Type": "application/json" } }
);
      if (!res.ok) return;
      const data = await res.json();

      if (!data.success || !Array.isArray(data.data) || !data.data.length) return;

      // Filter sub-categories that actually appear in current category products
      // so we never show dead tags. We do a loose match after products load.
      renderSubCategoryTags(data.data, container);
    } catch (err) {
      console.warn("[HC] fetchSubCategories failed:", err.message);
    }
  }

  function renderSubCategoryTags(subCats, container) {
    if (!container) return;

    // "All" pill + one pill per sub-category
    const allPill = `
      <button
        class="sub-tag-btn active-tag font-lexend text-xs px-4 py-1.5 rounded-full border border-accent bg-accent text-white shadow-sm transition-all duration-200 hover:shadow-md"
        data-sub="">
        All
      </button>`;

    const pills = subCats.map(sub => {
      const label = sub.charAt(0).toUpperCase() + sub.slice(1);
      return `
        <button
          class="sub-tag-btn font-lexend text-xs px-4 py-1.5 rounded-full border border-[#fccd81] bg-white text-[#1D3C4A] shadow-sm transition-all duration-200 hover:border-accent hover:bg-accent/10"
          data-sub="${escapeHtml(sub)}">
          ${escapeHtml(label)}
        </button>`;
    }).join("");

    container.innerHTML = allPill + pills;

    // Delegate clicks on the strip
    container.addEventListener("click", function (e) {
      const btn = e.target.closest(".sub-tag-btn");
      if (!btn) return;

      // Update active style
      container.querySelectorAll(".sub-tag-btn").forEach(b => {
        b.classList.remove("active-tag", "bg-accent", "text-white", "border-accent");
        b.classList.add("bg-white", "text-[#1D3C4A]", "border-[#fccd81]");
      });
      btn.classList.add("active-tag", "bg-accent", "text-white", "border-accent");
      btn.classList.remove("bg-white", "text-[#1D3C4A]", "border-[#fccd81]");

      const sub = btn.dataset.sub || null;

      // If sub-category clicked — redirect to homesubcategory page
      if (sub) {
        window.location.href = `/HomeSub/homesubcategory.html?subCategory=${encodeURIComponent(sub)}`;
        return;
      }

      // "All" pill — just clear sub filter and re-render current products
      activeSubCategory = null;
      renderProducts(applyFilter(allProducts));
    });
  }

  // ─── EVENT DELEGATION ─────────────────────────────────────────────────────────
  let delegationWired = false;
  function wireGridDelegation() {
    if (delegationWired) return;
    const grid = document.getElementById("categoryProductGrid");
    if (!grid) return;
    delegationWired = true;

    grid.addEventListener("click", function (e) {

      // Heart button
      const heartBtn = e.target.closest(".wl-btn");
      if (heartBtn) {
        e.stopPropagation();
        e.preventDefault();
        handleHeartClick(heartBtn);
        return;
      }

      // Add to Cart button
      const cartBtn = e.target.closest(".cart-btn");
      if (cartBtn) {
        e.stopPropagation();
        e.preventDefault();
        if (cartBtn.dataset.added === "true") {
          window.location.href = "/Cart/cart.html";
          return;
        }
        handleCartClick(cartBtn);
        return;
      }

      // Card body — navigate to product detail
      const card = e.target.closest(".product-card");
      if (card && card.dataset.pid) {
        const productData = {
          productPrimeId: card.dataset.pid,
          brandName:      card.dataset.brand,
          productName:    card.dataset.productName,
          productCategory: card.dataset.category,
          currentSku:     card.dataset.sku
        };
        navigateToProduct(card.dataset.pid, productData);
      }
    });
  }

  // ─── ADD TO CART ─────────────────────────────────────────────────────────────
  async function handleCartClick(btn) {
    const userId = getUserId();
    if (!userId) {
      showToast("Please log in to add items to cart.");
      return;
    }

    const pid = Number(btn.dataset.pid);
    if (!pid || cartInFlight.has(pid)) return;

    cartInFlight.add(pid);
    const orig    = btn.innerHTML;
    btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin text-xs"></i> Adding…';
    btn.disabled  = true;

    const payload = {
      userId,
      productId:     pid,
      variantId:     btn.dataset.variantId || null,
      sku:           btn.dataset.sku       || `PROD-${pid}`,
      selectedColor: btn.dataset.color     || null,
      selectedSize:  btn.dataset.size      || null,
      titleName:     btn.dataset.title     || null,
      unitPrice:     Number(btn.dataset.price)    || 0,
      mrpPrice:      Number(btn.dataset.mrpPrice)  || 0,
      quantity:      1
    };

    try {
      const res = await fetch(`${BASE_URL}/api/v1/cart/add`, {
        method:  "POST",
        headers: getAuthHeaders(),
        body:    JSON.stringify(payload)
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      addedToCartSet.add(pid);
      showToast("Added to cart 🛒");
      window.dispatchEvent(new CustomEvent('cart:updated')); // ← ADD HERE


      btn.innerHTML        = '<i class="fa-solid fa-bag-shopping text-xs"></i> Go to Cart';
      btn.disabled         = false;
      btn.dataset.added    = "true";
      btn.style.background = "#e39f32";
      btn.style.color      = "#1D3C4A";
      btn.style.fontWeight = "600";
    } catch (err) {
      showToast("Could not add to cart. Please try again.");
      btn.innerHTML = orig;
      btn.disabled  = false;
    } finally {
      cartInFlight.delete(pid);
    }
  }

  // ─── SLUGIFY ─────────────────────────────────────────────────────────────────
  function slugify(text) {
    if (!text) return "product";
    return text.toString().toLowerCase().trim()
      .replace(/\s+/g, "-")
      .replace(/[^\w\-]+/g, "")
      .replace(/\-\-+/g, "-")
      .replace(/^-+/, "")
      .replace(/-+$/, "");
  }

  function navigateToProduct(pid, productData = null) {
    if (productData && productData.brandName && productData.productName) {
      let cleanName = productData.productName;
      if (cleanName.toLowerCase().startsWith((productData.brandName || "").toLowerCase())) {
        cleanName = cleanName.substring(productData.brandName.length).trim();
      }
      const url = `/products/product-detail.html?id=${pid}&sku=${productData.currentSku || `PROD-${pid}`}&brand=${slugify(productData.brandName)}&category=${slugify(productData.productCategory)}`;
      window.location.href = url;
    } else {
      window.location.href = `/products/product-detail.html?id=${pid}`;
    }
  }

  // ─── HEART CLICK ─────────────────────────────────────────────────────────────
  async function handleHeartClick(btn) {
    const userId = getUserId();
    if (!userId) {
      showToast("Please log in to save items to your wishlist.");
      return;
    }

    const productId = Number(btn.dataset.productId);
    if (!productId || isNaN(productId) || inFlight.has(productId)) return;

    const wasWishlisted = wishlistSet.has(productId);
    const nowWishlisted = !wasWishlisted;
    nowWishlisted ? wishlistSet.add(productId) : wishlistSet.delete(productId);
    setHeartState(btn, nowWishlisted);
    inFlight.add(productId);

    try {
      if (nowWishlisted) {
        await addToWishlist(userId, productId, btn.dataset);
        showToast("Added to wishlist ♥");
        window.dispatchEvent(new CustomEvent('wishlist:updated')); // ← ADD HERE

      } else {
        await removeFromWishlist(userId, productId, btn.dataset.variantId);
        showToast("Removed from wishlist");
        window.dispatchEvent(new CustomEvent('wishlist:updated')); // ← ADD HERE

      }
    } catch (err) {
      wasWishlisted ? wishlistSet.add(productId) : wishlistSet.delete(productId);
      setHeartState(btn, wasWishlisted);
      showToast("Could not update wishlist. Please try again.");
    } finally {
      inFlight.delete(productId);
    }
  }

  // ─── WISHLIST LOAD ────────────────────────────────────────────────────────────
  async function loadWishlist() {
    const userId = getUserId();
    if (!userId) return;

    try {
      const res = await fetch(`${BASE_URL}/api/v1/wishlist?userId=${encodeURIComponent(userId)}`, {
        headers: { "Content-Type": "application/json" }
      });
      if (!res.ok) return;
      const data = await res.json();
      if (!data.success || !Array.isArray(data.data)) return;

      data.data.forEach(wl => {
        (wl.items || []).forEach(item => {
          if (item.productId != null) wishlistSet.add(Number(item.productId));
        });
      });
      syncHeartIcons();
    } catch (err) {
      console.warn("[HC] loadWishlist failed:", err.message);
    }
  }

  function syncHeartIcons() {
    document.querySelectorAll(".wl-btn[data-product-id]").forEach(btn => {
      setHeartState(btn, wishlistSet.has(Number(btn.dataset.productId)));
    });
  }

  // ─── WISHLIST API ─────────────────────────────────────────────────────────────
  async function addToWishlist(userId, productId, d) {
    const sku       = d.sku       || `PROD-${productId}`;
    const variantId = d.variantId || null;
    const payload   = {
      userId:          Number(userId),
      wishlistName:    "My Wishlist",
      productId:       Number(productId),
      variantId,
      sku,
      selectedColor:   d.color  || null,
      selectedSize:    d.size   || null,
      titleName:       d.title  || null,
      wishlistedPrice: Number(d.price) || 0,
      customFieldsJson: null
    };
    const res = await fetch(`${BASE_URL}/api/v1/wishlist/add`, {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify(payload)
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
  }

  async function removeFromWishlist(userId, productId, variantId) {
    const params = new URLSearchParams({ userId: Number(userId), productId: Number(productId) });
    if (variantId) params.append("variantId", variantId);
    const res = await fetch(`${BASE_URL}/api/v1/wishlist/remove?${params.toString()}`, {
      method: "DELETE"
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
  }

  // ─── HEART STATE ──────────────────────────────────────────────────────────────
  function setHeartState(btn, isWishlisted) {
    if (!btn) return;
    btn.innerHTML = isWishlisted
      ? `<i class="fa-solid fa-heart" style="color:#e39f32;font-size:14px;"></i>`
      : `<i class="fa-regular fa-heart" style="color:#9ca3af;font-size:14px;"></i>`;
    btn.setAttribute("aria-label", isWishlisted ? "Remove from wishlist" : "Add to wishlist");
    btn.title = isWishlisted ? "Remove from wishlist" : "Add to wishlist";
  }

  // ─── PAGE TITLE ───────────────────────────────────────────────────────────────
  function updatePageTitle(name) {
    document.title = `${name} — Artezo Store`;
    document.querySelectorAll("[data-category-title],#categoryPageTitle,#heroTitle")
      .forEach(el => { el.textContent = name; });
    const bc = document.querySelector("[data-category-breadcrumb],#categoryBreadcrumb");
    if (bc) bc.textContent = name;
  }

  // ─── FETCH PRODUCTS ───────────────────────────────────────────────────────────
  async function fetchProducts(page) {
    if (isLoading) return;
    isLoading = true;
    showSkeleton(true);
    hideError();

    const url = `${BASE_URL}/api/products/get-by-category?category=${encodeURIComponent(currentCategory)}&page=${page}&size=${PAGE_SIZE}`;

    try {
      const res  = await fetch(url, { headers: { "Content-Type": "application/json" } });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();

      currentPage   = data.page?.number       ?? page;
      totalPages    = data.page?.totalPages    ?? 1;
      totalElements = data.page?.totalElements ?? 0;

      allProducts = data.content || [];   // store raw for filter

      showSkeleton(false);
      renderProducts(applyFilter(allProducts));
      renderPagination();
      updateProductCount(totalElements);
    } catch (err) {
      console.error("[HC] fetchProducts FAILED:", err);
      showSkeleton(false);
      showError(`Could not load products for "${currentCategory}". Please try again.`);
    } finally {
      isLoading = false;
    }
  }

  // ─── RENDER PRODUCTS ─────────────────────────────────────────────────────────
  function renderProducts(products) {
    const grid       = document.getElementById("categoryProductGrid");
    const emptyState = document.getElementById("categoryEmptyState");
    if (!grid) return;

    if (!products.length) {
      grid.innerHTML = "";
      grid.classList.add("hidden");
      emptyState?.classList.remove("hidden");
      return;
    }

    emptyState?.classList.add("hidden");
    grid.classList.remove("hidden");
    grid.innerHTML = products.map(buildProductCard).join("");

    syncHeartIcons();
    wireGridDelegation();
  }

  // ─── BUILD CARD ───────────────────────────────────────────────────────────────
  function buildProductCard(p) {
    const mrp      = p.currentMrpPrice     || 0;
    const selling  = p.currentSellingPrice || 0;
    const discount = mrp > 0 ? Math.round(((mrp - selling) / mrp) * 100) : 0;
    const pid      = Number(p.productPrimeId);
    const isWL     = wishlistSet.has(pid);
    const isAdded  = addedToCartSet.has(pid);

    const imageUrl = p.mainImage
      ? (p.mainImage.startsWith("http") ? p.mainImage : `${BASE_URL}${p.mainImage}`)
      : FALLBACK_IMG;

    const name         = escapeHtml(p.productName        || "Unnamed Product");
    const subCategory  = escapeHtml(p.productSubCategory || p.productCategory || "");
    const isOutOfStock = (p.currentStock != null && p.currentStock <= 0);

    const resolvedVariantId = p.variantId  || null;
    const resolvedSku       = p.currentSku || `PROD-${pid}`;

    const resolvedSku_safe = escapeHtml(resolvedSku);
    const resolvedVI_safe  = escapeHtml(resolvedVariantId);
    const color_safe       = escapeHtml(p.selectedColor || "");
    const size_safe        = escapeHtml(p.selectedSize  || "");
    const title_safe       = escapeHtml(p.productName   || "");

    // ── Badge ─────────────────────────────────────────────────────────────────
    const topBadge = isOutOfStock
      ? `<div class="absolute inset-0 flex items-center justify-center bg-black/30 z-10">
           <span class="bg-gray-800 text-white text-[10px] font-bold px-2 py-1 rounded-full">OUT OF STOCK</span>
         </div>`
      : p.isCustomizable
        ? `<span class="absolute top-2 left-2 bg-purple-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full z-10 shadow">CUSTOMIZABLE</span>`
        : discount > 0
          ? `<span class="absolute top-2 left-2 bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full z-10 shadow">${discount}% OFF</span>`
          : "";

    // ── Heart ─────────────────────────────────────────────────────────────────
    const heartIcon = isWL
      ? `<i class="fa-solid fa-heart" style="color:#e39f32;font-size:12px;"></i>`
      : `<i class="fa-regular fa-heart" style="color:#6b7280;font-size:12px;"></i>`;

    // ── Cart btn label ────────────────────────────────────────────────────────
    const cartLabel   = isOutOfStock ? "Out of Stock" : isAdded ? "Go to Cart" : "Add to Cart";
    const cartBtnStyle = isAdded ? "background:#e39f32;color:#1D3C4A;font-weight:600;" : "";

    const productUrl = `/products/product-detail.html?id=${pid}&sku=${resolvedSku}&brand=artezo&category=${escapeHtml(p.productCategory || "")}`;

    return `
      <div class="product-card bg-white rounded-xl  overflow-hidden
                  shadow-sm hover:-translate-y-1 hover:shadow-md transition-all duration-300
                  flex flex-col cursor-pointer group
                  ${isOutOfStock ? "grayscale opacity-70" : ""}"
           data-pid="${pid}"
           data-brand="${escapeHtml(p.brandName || "")}"
           data-product-name="${title_safe}"
           data-category="${escapeHtml(p.productCategory || "")}"
           data-sku="${resolvedSku_safe}">

        <!-- Image — exact trending height -->
        <div class="relative border border-gray-100 rounded-t-xl overflow-hidden bg-gray-50">
          <img src="${imageUrl}" alt="${name}"
               class="w-full h-[140px] sm:h-[150px] md:h-[170px] object-cover
                      group-hover:scale-105 transition-transform duration-500"
               loading="lazy"
               onerror="this.src='${FALLBACK_IMG}'">
          ${topBadge}
          <button class="wl-btn absolute top-2 right-2 w-7 h-7 sm:w-8 sm:h-8 bg-white rounded-full
                         shadow flex items-center justify-center hover:scale-110 transition z-20"
                  data-product-id="${pid}"
                  data-variant-id="${resolvedVI_safe}"
                  data-sku="${resolvedSku_safe}"
                  data-color="${color_safe}"
                  data-size="${size_safe}"
                  data-title="${title_safe}"
                  data-price="${selling}"
                  aria-label="${isWL ? "Remove from wishlist" : "Add to wishlist"}"
                  title="${isWL ? "Remove from wishlist" : "Add to wishlist"}">
            ${heartIcon}
          </button>
        </div>

        <!-- Info — exact trending p-3 flex-col flex-grow justify-between -->
        <div class="p-3 flex flex-col flex-grow justify-between">

          <div>
            <h3 class="text-xs sm:text-sm font-semibold text-[#1D3C4A] leading-snug mb-1"
                style="display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;
                       overflow:hidden;min-height:2.6em;">
              ${name}
            </h3>
            <p class="text-[9px] sm:text-xs text-gray-500 mb-1">${subCategory}</p>
            <div class="flex items-center gap-2 mt-1 flex-wrap">
              <span class="text-[#1D3C4A] font-semibold text-xs sm:text-sm">
                ₹${selling.toLocaleString("en-IN")}
              </span>
              ${mrp > selling
                ? `<span class="text-gray-400 line-through text-[9px] sm:text-xs">₹${mrp.toLocaleString("en-IN")}</span>
                   <span class="text-green-600 text-[9px] sm:text-xs font-semibold">${discount}% OFF</span>`
                : ""}
            </div>
          </div>

          <!-- Cart btn — exact trending -->
          <button class="cart-btn group mt-2 sm:mt-3 w-full bg-[#1D3C4A] text-white
                         text-[10px] sm:text-sm py-1.5 sm:py-2 rounded-md
                         hover:bg-[#E39F32] transition flex items-center justify-center gap-2"
                  style="${cartBtnStyle}"
                  data-pid="${pid}"
                  data-variant-id="${resolvedVI_safe}"
                  data-sku="${resolvedSku_safe}"
                  data-color="${color_safe}"
                  data-size="${size_safe}"
                  data-title="${title_safe}"
                  data-price="${selling}"
                  data-mrp-price="${mrp}"
                  data-added="${isAdded ? "true" : "false"}"
                  ${isOutOfStock ? "disabled" : ""}>
            <i class="fa-solid fa-cart-shopping text-[#E39F32] group-hover:text-[#1D3C4A]
                      transition text-[10px] sm:text-xs"></i>
            ${cartLabel}
          </button>

        </div>
      </div>`;
  }

  // ─── PAGINATION ───────────────────────────────────────────────────────────────
  function renderPagination() {
    const container = document.getElementById("categoryPagination");
    if (!container) return;
    if (totalPages <= 1) { container.innerHTML = ""; return; }

    let html = `<div class="flex items-center justify-center gap-2 mt-8 flex-wrap">`;
    html += `<button
      class="px-4 py-2 rounded-full text-sm border transition-colors ${currentPage === 0 ? "border-gray-200 text-gray-300 cursor-not-allowed" : "border-gray-300 text-gray-700 hover:border-[#1D3C4A] hover:text-[#1D3C4A]"}"
      ${currentPage === 0 ? "disabled" : `onclick="window.goToPage(${currentPage - 1})"`}>← Prev</button>`;

    const sp = Math.max(0, currentPage - 2);
    const ep = Math.min(totalPages - 1, currentPage + 2);
    for (let i = sp; i <= ep; i++) {
      const active = i === currentPage;
      html += `<button
        class="w-9 h-9 rounded-full text-sm border transition-colors ${active ? "text-white border-[#1D3C4A]" : "border-gray-300 text-gray-700 hover:border-[#1D3C4A] hover:text-[#1D3C4A]"}"
        style="${active ? "background:#1D3C4A;" : ""}"
        onclick="window.goToPage(${i})">${i + 1}</button>`;
    }

    html += `<button
      class="px-4 py-2 rounded-full text-sm border transition-colors ${currentPage >= totalPages - 1 ? "border-gray-200 text-gray-300 cursor-not-allowed" : "border-gray-300 text-gray-700 hover:border-[#1D3C4A] hover:text-[#1D3C4A]"}"
      ${currentPage >= totalPages - 1 ? "disabled" : `onclick="window.goToPage(${currentPage + 1})"`}>Next →</button>`;

    html += `</div>`;
    container.innerHTML = html;
  }

  window.goToPage = function (page) {
    if (page < 0 || page >= totalPages || page === currentPage) return;
    window.scrollTo({ top: 0, behavior: "smooth" });
    fetchProducts(page);
  };

  // ─── SMALL HELPERS ────────────────────────────────────────────────────────────
  function updateProductCount(count) {
    const el = document.getElementById("categoryProductCount");
    if (el) el.textContent = `${count} product${count !== 1 ? "s" : ""}`;
  }

  function showSkeleton(show) {
    const s = document.getElementById("categorySkeletonGrid");
    const g = document.getElementById("categoryProductGrid");
    if (s) s.style.display = show ? "grid" : "none";
    if (g && show) g.classList.add("hidden");
  }

  function showError(msg) {
    const el = document.getElementById("categoryError");
    if (!el) return;
    el.textContent = msg;
    el.classList.remove("hidden");
  }

  function hideError() {
    document.getElementById("categoryError")?.classList.add("hidden");
  }

  function showToast(message) {
    if (window.showGlobalToast) { window.showGlobalToast(message); return; }
    let t = document.getElementById("pdToast");
    if (!t) {
      t = document.createElement("div");
      t.id = "pdToast";
      t.style.cssText =
        "position:fixed;bottom:24px;right:24px;background:#1D3C4A;color:white;" +
        "padding:12px 24px;border-radius:40px;box-shadow:0 10px 20px rgba(0,0,0,.15);" +
        "z-index:9999;opacity:0;transition:opacity .2s;border-left:4px solid #e39f32;" +
        "font-family:Lexend,sans-serif;font-size:14px;max-width:320px;";
      document.body.appendChild(t);
    }
    t.textContent   = message;
    t.style.opacity = "1";
    clearTimeout(t._timeout);
    t._timeout = setTimeout(() => { t.style.opacity = "0"; }, 2500);
  }

  function escapeHtml(text) {
    if (!text) return "";
    const d = document.createElement("div");
    d.textContent = text;
    return d.innerHTML;
  }

  // ─── START ────────────────────────────────────────────────────────────────────
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }

})();