// homesubcategory.js
// Reads ?subCategory= from URL → fetches /api/products/get-by-sub-category → renders product cards
// Wishlist: single fetch on load → in-memory Set → optimistic UI → event delegation (no inline onclick)

(function () {
  "use strict";

  // ─── CONFIG ──────────────────────────────────────────────────────────────────
  const BASE_URL     = "http://localhost:8085";
  const FALLBACK_IMG = "/Images/product_fallback/artezo_product_fallback_img.png";
  const PAGE_SIZE    = 12;

  // ─── WISHLIST STATE ───────────────────────────────────────────────────────────
  const wishlistSet = new Set();  // Set<productId (number)> — populated once on load
  const inFlight    = new Set();  // debounce: ignore rapid double-clicks per productId

  // ─── PRODUCT STATE ────────────────────────────────────────────────────────────
  let currentSubCategory  = "";
  let currentPage         = 0;
  let totalPages          = 0;
  let totalElements       = 0;
  let isLoading           = false;
  let currentPageProducts = [];   // raw products from last fetch — used by client-side filters

  // Active UI filters (client-side, applied to fetched page data)
  let activeFilters = { priceRange: null, color: null };

  // ─── DOM REFS ─────────────────────────────────────────────────────────────────
  const grid                = document.getElementById("productGrid");
  const skeleton            = document.getElementById("skeletonGrid");
  const emptyState          = document.getElementById("emptyState");
  const toast               = document.getElementById("toast");
  const desktopFilterDiv    = document.getElementById("desktopFilterContainer");
  const mobileFilterContent = document.getElementById("mobileFilterContent");
  const mobileDrawer        = document.getElementById("mobileFilterDrawer");
  const closeMobile         = document.getElementById("closeMobileFilter");
  const mobileApply         = document.getElementById("mobileApplyFilters");
  const resetFiltersBtn     = document.getElementById("resetFiltersBtn");
  const applyFiltersBtn     = document.getElementById("applyFiltersBtn");
  const tabsContainer       = document.getElementById("subcategoryTabs");

  // ─── GET USER ID ─────────────────────────────────────────────────────────────
  function getUserId() {
    console.group("[HSC] getUserId() — scanning localStorage");

    if (localStorage.length === 0) {
      console.warn("[HSC] localStorage is EMPTY");
    } else {
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        console.log(`[HSC]   key="${k}"  raw value=`, localStorage.getItem(k));
      }
    }

    // Strategy 1: plain value under key "userId"
    const directId = localStorage.getItem("userId");
    if (directId) {
      const id = Number(directId);
      console.log(`[HSC] Strategy 1 hit — key "userId" = "${directId}", parsed = ${id}`);
      console.groupEnd();
      return id;
    }

    // Strategy 2: JSON object under key "user"
    const userRaw = localStorage.getItem("user");
    if (userRaw) {
      try {
        const parsed = JSON.parse(userRaw);
        const id = parsed.id || parsed.userId || parsed.user_id || null;
        if (id) {
          console.log("[HSC] Strategy 2 hit — id =", id);
          console.groupEnd();
          return Number(id);
        }
        console.warn("[HSC] Strategy 2 — no id field in object:", parsed);
      } catch (err) {
        console.warn('[HSC] Strategy 2 — "user" is not valid JSON:', userRaw, err);
      }
    }

    // Strategy 3: JSON object under key "userData"
    const userDataRaw = localStorage.getItem("userData");
    if (userDataRaw) {
      try {
        const parsed = JSON.parse(userDataRaw);
        const id = parsed.id || parsed.userId || null;
        if (id) {
          console.log("[HSC] Strategy 3 hit — id =", id);
          console.groupEnd();
          return Number(id);
        }
      } catch (err) {
        console.warn('[HSC] Strategy 3 — "userData" not valid JSON', err);
      }
    }

    console.error("[HSC] getUserId() FAILED — no userId found. Wishlist API will be skipped.");
    console.groupEnd();
    return null;
  }

  // ─── INIT ─────────────────────────────────────────────────────────────────────
  async function init() {
    console.log("[HSC] ========== init() start ==========");
    const params = new URLSearchParams(window.location.search);
    currentSubCategory = params.get("subCategory") || "";
    console.log("[HSC] subCategory from URL:", currentSubCategory || "(none)");

    if (!currentSubCategory) {
      showError("No subcategory selected. Please navigate from the menu.");
      return;
    }

    updatePageHeader(currentSubCategory);
    bindFilterEvents();
    wireGridDelegation();

    console.log("[HSC] Starting parallel fetch: products + wishlist");
    await Promise.all([loadWishlist(), fetchProducts(0)]);
    console.log("[HSC] ========== init() complete ==========");
  }

  // ─── EVENT DELEGATION ─────────────────────────────────────────────────────────
  let delegationWired = false;
  function wireGridDelegation() {
    if (delegationWired) {
      console.log("[HSC] wireGridDelegation() — already wired, skipping");
      return;
    }
    if (!grid) {
      console.error("[HSC] wireGridDelegation() — #productGrid NOT in DOM");
      return;
    }
    delegationWired = true;
    console.log("[HSC] wireGridDelegation() — listener attached to #productGrid ✅");

    grid.addEventListener("click", function (e) {
      console.log("[HSC] grid click —", e.target.tagName, e.target.className);

      // Heart button or <i> icon inside it
      const heartBtn = e.target.closest(".wl-btn");
      if (heartBtn) {
        console.log("[HSC] 💛 .wl-btn matched — handling heart click");
        e.stopPropagation();
        e.preventDefault();
        handleHeartClick(heartBtn);
        return;
      }

      // "View Product" CTA button
      const ctaBtn = e.target.closest(".cta-btn");
      if (ctaBtn) {
        e.stopPropagation();
        const pid = ctaBtn.dataset.pid;
        console.log("[HSC] .cta-btn clicked, pid:", pid);
        if (pid) navigateToProduct(pid);
        return;
      }

      // Card body — navigate to detail
      const card = e.target.closest(".product-card");
      if (card) {
        const pid = card.dataset.pid;
        console.log("[HSC] .product-card clicked, pid:", pid);
        if (pid) navigateToProduct(pid);
      }
    });
  }

  function navigateToProduct(pid) {
    console.log("[HSC] navigating to product:", pid);
    window.location.href = `../Product-Details/product-detail.html?id=${pid}`;
  }

  // ─── HEART CLICK HANDLER ──────────────────────────────────────────────────────
  async function handleHeartClick(btn) {
    console.group("[HSC] handleHeartClick()");
    console.log("[HSC] btn.dataset:", { ...btn.dataset });

    const userId = getUserId();
    console.log("[HSC] userId:", userId, "(type:", typeof userId, ")");

    if (!userId) {
      console.error("[HSC] ❌ No userId — API skipped, showing login toast");
      showToast("Please log in to save items to your wishlist.");
      console.groupEnd();
      return;
    }

    const productId = Number(btn.dataset.productId);
    console.log("[HSC] productId:", productId);

    if (!productId || isNaN(productId)) {
      console.error("[HSC] ❌ Invalid productId:", btn.dataset.productId);
      console.groupEnd();
      return;
    }

    if (inFlight.has(productId)) {
      console.warn("[HSC] ⏳ Already in-flight for:", productId, "— ignoring");
      console.groupEnd();
      return;
    }

    const wasWishlisted = wishlistSet.has(productId);
    const nowWishlisted = !wasWishlisted;
    console.log(`[HSC] Toggle: wasWishlisted=${wasWishlisted} → nowWishlisted=${nowWishlisted}`);

    nowWishlisted ? wishlistSet.add(productId) : wishlistSet.delete(productId);
    setHeartState(btn, nowWishlisted);
    console.log("[HSC] wishlistSet after optimistic update:", [...wishlistSet]);

    inFlight.add(productId);

    try {
      if (nowWishlisted) {
        console.log("[HSC] 🔼 Calling addToWishlist...");
        await addToWishlist(userId, productId, btn.dataset);
        console.log("[HSC] ✅ addToWishlist SUCCESS");
        showToast("Added to wishlist ♥");
      } else {
        // data-variant-id already holds the resolved fallback (e.g. "VAR-1")
        // written during buildProductCard — matches the DB row exactly.
        console.log("[HSC] 🔽 Calling removeFromWishlist — variantId:", btn.dataset.variantId);
        await removeFromWishlist(userId, productId, btn.dataset.variantId);
        console.log("[HSC] ✅ removeFromWishlist SUCCESS");
        showToast("Removed from wishlist");
      }
    } catch (err) {
      console.error("[HSC] ❌ API failed — rolling back. Error:", err);
      wasWishlisted ? wishlistSet.add(productId) : wishlistSet.delete(productId);
      setHeartState(btn, wasWishlisted);
      showToast("Could not update wishlist. Please try again.");
    } finally {
      inFlight.delete(productId);
      console.log("[HSC] inFlight cleared. Remaining:", [...inFlight]);
      console.groupEnd();
    }
  }

  // ─── WISHLIST: LOAD ONCE ──────────────────────────────────────────────────────
  async function loadWishlist() {
    console.group("[HSC] loadWishlist()");
    const userId = getUserId();
    if (!userId) {
      console.warn("[HSC] loadWishlist — no userId, skipping");
      console.groupEnd();
      return;
    }

    const url = `${BASE_URL}/api/v1/wishlist?userId=${encodeURIComponent(userId)}`;
    console.log("[HSC] GET", url);

    try {
      const res = await fetch(url, { headers: { "Content-Type": "application/json" } });
      console.log("[HSC] loadWishlist status:", res.status, res.statusText);

      if (!res.ok) {
        console.error("[HSC] loadWishlist HTTP error:", res.status);
        console.groupEnd();
        return;
      }

      const data = await res.json();
      console.log("[HSC] loadWishlist response body:", data);

      if (!data.success || !Array.isArray(data.data)) {
        console.warn("[HSC] loadWishlist — unexpected shape:", data);
        console.groupEnd();
        return;
      }

      data.data.forEach(wl => {
        (wl.items || []).forEach(item => {
          if (item.productId != null) wishlistSet.add(Number(item.productId));
        });
      });

      console.log("[HSC] wishlistSet populated:", [...wishlistSet]);
      syncHeartIcons();
    } catch (err) {
      console.error("[HSC] loadWishlist EXCEPTION:", err);
    }
    console.groupEnd();
  }

  function syncHeartIcons() {
    const btns = document.querySelectorAll(".wl-btn[data-product-id]");
    console.log(`[HSC] syncHeartIcons — updating ${btns.length} heart buttons`);
    btns.forEach(btn => {
      setHeartState(btn, wishlistSet.has(Number(btn.dataset.productId)));
    });
  }

  // ─── WISHLIST API ─────────────────────────────────────────────────────────────
  async function addToWishlist(userId, productId, d) {
    // d.variantId and d.sku are already the resolved fallback values
    // written by buildProductCard — no re-derivation needed here.


    const payload = {
      userId:           Number(userId),
      wishlistName:     "My Wishlist",
      productId:        Number(productId),
      variantId:        d.variantId,
      sku:              d.sku,
      selectedColor:    d.color    || null,
      selectedSize:     d.size     || null,
      titleName:        d.title    || null,
      wishlistedPrice:  Number(d.price) || 0,
      customFieldsJson: null,
    };

    const url = `${BASE_URL}/api/v1/wishlist/add`;
    console.log("[HSC] POST", url);
    console.log("[HSC] addToWishlist payload:", JSON.stringify(payload, null, 2));

    const res = await fetch(url, {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify(payload),
    });

    console.log("[HSC] addToWishlist response:", res.status, res.statusText);
    if (!res.ok) {
      const errBody = await res.text().catch(() => "(unreadable)");
      console.error("[HSC] addToWishlist error body:", errBody);
      throw new Error(`HTTP ${res.status}`);
    }
    const json = await res.json().catch(() => null);
    console.log("[HSC] addToWishlist success body:", json);
  }

  async function removeFromWishlist(userId, productId, variantId) {
    // variantId is the resolved value from data-variant-id (e.g. "VAR-1")
    // — guaranteed to match the DB row written during addToWishlist.
    const params = new URLSearchParams({
      userId:    Number(userId),
      productId: Number(productId),
    });
    if (variantId) params.append("variantId", variantId);

    const url = `${BASE_URL}/api/v1/wishlist/remove?${params.toString()}`;
    console.log("[HSC] DELETE", url);

    const res = await fetch(url, { method: "DELETE" });
    console.log("[HSC] removeFromWishlist response:", res.status, res.statusText);
    if (!res.ok) {
      const errBody = await res.text().catch(() => "(unreadable)");
      console.error("[HSC] removeFromWishlist error body:", errBody);
      throw new Error(`HTTP ${res.status}`);
    }
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

  // ─── UPDATE PAGE HEADER ───────────────────────────────────────────────────────
  function updatePageHeader(subCategoryName) {
    document.title = `${subCategoryName} — Artezo Store`;

    const titleEl = document.getElementById("categoryTitle");
    if (titleEl) titleEl.textContent = subCategoryName;

    const descEl = document.getElementById("categoryDescription");
    if (descEl) descEl.textContent = `Browse our collection of ${subCategoryName}.`;

    const breadcrumbEl = document.getElementById("breadcrumbSub");
    if (breadcrumbEl) breadcrumbEl.textContent = subCategoryName;

    if (tabsContainer) tabsContainer.style.display = "none";
  }

  // ─── FETCH PRODUCTS ───────────────────────────────────────────────────────────
  async function fetchProducts(page) {
    if (isLoading) return;
    isLoading = true;
    showSkeleton(true);
    hideError();

    const url =
      `${BASE_URL}/api/products/get-by-sub-category` +
      `?subCategory=${encodeURIComponent(currentSubCategory)}` +
      `&page=${page}&size=${PAGE_SIZE}`;

    console.log("[HSC] fetchProducts GET", url);

    try {
      const res = await fetch(url, { headers: { "Content-Type": "application/json" } });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const data = await res.json();

      currentPage         = data.page?.number       ?? page;
      totalPages          = data.page?.totalPages    ?? 1;
      totalElements       = data.page?.totalElements ?? 0;
      currentPageProducts = data.content || [];

      console.log(`[HSC] fetchProducts OK — ${totalElements} products, page ${currentPage + 1}/${totalPages}`);

      showSkeleton(false);
      buildFilterUI(currentPageProducts);
      applyAndRender();
      renderPagination();
      updateProductCount(totalElements);

    } catch (err) {
      console.error("[HSC] fetchProducts FAILED:", err);
      showSkeleton(false);
      showError(`Could not load products for "${currentSubCategory}". Please try again.`);
    } finally {
      isLoading = false;
    }
  }

  // ─── CLIENT-SIDE FILTER + RENDER ─────────────────────────────────────────────
  function applyAndRender() {
    let filtered = [...currentPageProducts];

    if (activeFilters.priceRange) {
      const range = activeFilters.priceRange;
      filtered = filtered.filter(p => {
        const price = p.currentSellingPrice || 0;
        if (range === "under500")  return price < 500;
        if (range === "500-1000")  return price >= 500  && price <= 1000;
        if (range === "1000-2000") return price >= 1000 && price <= 2000;
        if (range === "above2000") return price > 2000;
        return true;
      });
    }

    if (activeFilters.color) {
      filtered = filtered.filter(p =>
        (p.selectedColor || "").toLowerCase() === activeFilters.color.toLowerCase()
      );
    }

    renderProducts(filtered);
  }

  // ─── RENDER PRODUCTS ─────────────────────────────────────────────────────────
  function renderProducts(products) {
    if (!grid) return;

    if (!products || products.length === 0) {
      grid.innerHTML = "";
      grid.classList.add("hidden");
      emptyState?.classList.remove("hidden");
      return;
    }

    emptyState?.classList.add("hidden");
    grid.classList.remove("hidden");
    grid.innerHTML = products.map(buildProductCard).join("");
    console.log(`[HSC] renderProducts — ${products.length} cards written to DOM`);

    syncHeartIcons();
    wireGridDelegation();
  }

  // ─── BUILD PRODUCT CARD ───────────────────────────────────────────────────────
  function buildProductCard(p) {
    const mrp      = p.currentMrpPrice     || 0;
    const selling  = p.currentSellingPrice || 0;
    const discount = mrp > 0 ? Math.round(((mrp - selling) / mrp) * 100) : 0;
    const pid      = Number(p.productPrimeId);
    const isWL     = wishlistSet.has(pid);

    const imageUrl = p.mainImage
      ? (p.mainImage.startsWith("http") ? p.mainImage : `${BASE_URL}${p.mainImage}`)
      : FALLBACK_IMG;

    const name   = escapeHtml(p.productName        || "Unnamed Product");
    const color  = escapeHtml(p.selectedColor      || "");
    const subCat = escapeHtml(p.productSubCategory || "");

    let badge = "";
    if (p.isCustomizable) {
      badge = `<span class="absolute top-2 left-2 bg-purple-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full z-10 shadow">CUSTOMIZABLE</span>`;
    } else if (discount >= 10) {
      badge = `<span class="absolute top-2 left-2 bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full z-10 shadow">${discount}% OFF</span>`;
    }

    // ─── KEY FIX ──────────────────────────────────────────────────────────────
    // Resolve fallback here — the SINGLE source of truth for both add and remove.
    // addToWishlist reads d.variantId / d.sku directly from btn.dataset, so
    // whatever we write here is exactly what lands in the DB and what remove sends.
    // Result: add sends "VAR-1", remove reads "VAR-1" from the button → keys match.
    const resolvedVariantId = p.variantId || `VAR-${pid}`;
    const resolvedSku       = p.sku       || `PROD-${pid}`;

    const heartIcon = isWL
      ? `<i class="fa-solid fa-heart" style="color:#e39f32;font-size:14px;"></i>`
      : `<i class="fa-regular fa-heart" style="color:#9ca3af;font-size:14px;"></i>`;

    return `
      <div class="product-card bg-white h-[350px] border border-[#e39f32] rounded-xl overflow-hidden flex flex-col shadow-sm group cursor-pointer hover:-translate-y-1 hover:shadow-md transition-all duration-300"
           data-pid="${pid}">

        <div class="aspect-square bg-gray-100 relative overflow-hidden">
          <img src="${imageUrl}"
               alt="${name}"
               class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
               loading="lazy"
               onerror="this.src='${FALLBACK_IMG}'">
          ${badge}

          <button
            class="wl-btn absolute top-2 right-2 z-10 w-8 h-8 flex items-center justify-center rounded-full bg-white/80 backdrop-blur-sm shadow hover:bg-white transition-all duration-200"
            data-product-id="${pid}"
            data-product-name="${escapeHtml(p.productName || '')}"
            data-variant-id="${escapeHtml(resolvedVariantId)}"
            data-sku="${escapeHtml(resolvedSku)}"
            data-color="${escapeHtml(p.selectedColor || "")}"
            data-size="${escapeHtml(p.selectedSize   || "")}"
            data-price="${selling}"
            aria-label="${isWL ? "Remove from wishlist" : "Add to wishlist"}"
            title="${isWL ? "Remove from wishlist" : "Add to wishlist"}">
            ${heartIcon}
          </button>
        </div>

        <div class="p-3 flex-1 flex flex-col">
          <h3 class="font-medium text-gray-800 border-t border-gray-400 text-sm mb-1 line-clamp-2 min-h-[25px]">${name}</h3>

          ${color
            ? `<span class="text-xs text-gray-500 mb-1">Color: <span class="font-medium text-gray-700">${color}</span></span>`
            : ""}

          ${subCat
            ? `<span class="text-xs border border-[#fccd81] bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full w-fit mb-2">${subCat}</span>`
            : ""}

          <div class="mt-auto">
            <div class="flex items-baseline gap-2 flex-wrap">
              <span class="font-bold text-base" style="color:#1D3C4A;">₹${selling.toLocaleString("en-IN")}</span>
              ${mrp > selling
                ? `<span class="text-xs text-gray-400 line-through">₹${mrp.toLocaleString("en-IN")}</span>`
                : ""}
              ${discount > 0
                ? `<span class="text-xs font-semibold text-green-600">${discount}% off</span>`
                : ""}
            </div>
          </div>
        </div>

        <button
          class="cta-btn border-t border-[#e39f32] mt-auto w-full bg-gray-100 hover:bg-[#1D3C4A] hover:text-white transition-all duration-300 text-gray-800 text-sm py-2.5 rounded-b-xl flex items-center justify-center gap-2 font-medium"
          data-pid="${pid}">
          <i class="fas fa-bag-shopping text-xs" style="color:#e39f32;"></i>
          View Product
        </button>
      </div>
    `;
  }

  // ─── FILTER UI ────────────────────────────────────────────────────────────────
  function buildFilterUI(products) {
    if (!desktopFilterDiv) return;

    const colors = [...new Set(products.map(p => p.selectedColor).filter(Boolean))];

    const filterHTML = `
      <div class="space-y-5">

        <div class="filter-section border-b border-gray-100 pb-4">
          <button class="filter-toggle flex items-center justify-between w-full text-left mb-3"
                  onclick="this.nextElementSibling.classList.toggle('hidden'); this.querySelector('i').classList.toggle('rotate-180');">
            <h4 class="font-medium text-sm" style="color:#1D3C4A;">Price Range</h4>
            <i class="fas fa-chevron-down text-xs transition-transform duration-300" style="color:#e39f32;"></i>
          </button>
          <div class="filter-options space-y-2">
            ${buildPriceRadio("under500",  "Under ₹500")}
            ${buildPriceRadio("500-1000",  "₹500 – ₹1,000")}
            ${buildPriceRadio("1000-2000", "₹1,000 – ₹2,000")}
            ${buildPriceRadio("above2000", "Above ₹2,000")}
          </div>
        </div>

        ${colors.length > 0 ? `
        <div class="filter-section border-b border-gray-100 pb-4">
          <button class="filter-toggle flex items-center justify-between w-full text-left mb-3"
                  onclick="this.nextElementSibling.classList.toggle('hidden'); this.querySelector('i').classList.toggle('rotate-180');">
            <h4 class="font-medium text-sm" style="color:#1D3C4A;">Color</h4>
            <i class="fas fa-chevron-down text-xs transition-transform duration-300" style="color:#e39f32;"></i>
          </button>
          <div class="filter-options space-y-2">
            ${colors.map(c => buildColorRadio(c)).join("")}
          </div>
        </div>` : ""}

      </div>`;

    desktopFilterDiv.innerHTML = filterHTML;
    if (mobileFilterContent) mobileFilterContent.innerHTML = filterHTML;
  }

  function buildPriceRadio(value, label) {
    const checked = activeFilters.priceRange === value ? "checked" : "";
    return `
      <label class="flex items-center gap-2 text-sm cursor-pointer hover:bg-gray-50 p-1 rounded transition-colors">
        <input type="radio" name="priceRange" value="${value}" ${checked}
               class="w-4 h-4 cursor-pointer accent-[#e39f32]">
        <span class="text-gray-600">${label}</span>
      </label>`;
  }

  function buildColorRadio(colorName) {
    const checked = activeFilters.color === colorName ? "checked" : "";
    return `
      <label class="flex items-center gap-2 text-sm cursor-pointer hover:bg-gray-50 p-1 rounded transition-colors">
        <input type="radio" name="filterColor" value="${escapeHtml(colorName)}" ${checked}
               class="w-4 h-4 cursor-pointer accent-[#e39f32]">
        <span class="text-gray-600">${escapeHtml(colorName)}</span>
      </label>`;
  }

  function readFilters(container) {
    const root    = container || document;
    const priceEl = root.querySelector('input[name="priceRange"]:checked');
    const colorEl = root.querySelector('input[name="filterColor"]:checked');
    activeFilters.priceRange = priceEl ? priceEl.value : null;
    activeFilters.color      = colorEl ? colorEl.value : null;
  }

  function resetFilters() {
    activeFilters = { priceRange: null, color: null };
    buildFilterUI(currentPageProducts);
    applyAndRender();
  }

  // ─── BIND FILTER EVENTS ───────────────────────────────────────────────────────
  function bindFilterEvents() {
    applyFiltersBtn?.addEventListener("click", () => {
      readFilters(desktopFilterDiv);
      applyAndRender();
    });

    resetFiltersBtn?.addEventListener("click", resetFilters);

    closeMobile?.addEventListener("click", () => {
      mobileDrawer?.classList.add("opacity-0", "pointer-events-none");
      mobileDrawer?.querySelector("div")?.classList.remove("drawer-open");
    });

    mobileApply?.addEventListener("click", () => {
      readFilters(mobileFilterContent);
      buildFilterUI(currentPageProducts);
      applyAndRender();
      mobileDrawer?.classList.add("opacity-0", "pointer-events-none");
      mobileDrawer?.querySelector("div")?.classList.remove("drawer-open");
    });

    document.getElementById("mobileFilterToggle")?.addEventListener("click", () => {
      mobileDrawer?.classList.remove("opacity-0", "pointer-events-none");
      mobileDrawer?.querySelector("div")?.classList.add("drawer-open");
    });

    document.getElementById("emptyResetBtn")?.addEventListener("click", resetFilters);
  }

  // ─── PAGINATION ───────────────────────────────────────────────────────────────
  function renderPagination() {
    const container = document.getElementById("subCategoryPagination");
    if (!container) return;
    if (totalPages <= 1) { container.innerHTML = ""; return; }

    let html = `<div class="flex items-center justify-center gap-2 mt-8 flex-wrap">`;

    html += `<button
      class="px-4 py-2 rounded-full text-sm border transition-colors ${currentPage === 0 ? "border-gray-200 text-gray-300 cursor-not-allowed" : "border-gray-300 text-gray-700 hover:border-[#1D3C4A] hover:text-[#1D3C4A]"}"
      ${currentPage === 0 ? "disabled" : `onclick="window.subGoToPage(${currentPage - 1})"`}>← Prev</button>`;

    const sp = Math.max(0, currentPage - 2);
    const ep = Math.min(totalPages - 1, currentPage + 2);
    for (let i = sp; i <= ep; i++) {
      const active = i === currentPage;
      html += `<button
        class="w-9 h-9 rounded-full text-sm border transition-colors ${active ? "text-white border-[#1D3C4A]" : "border-gray-300 text-gray-700 hover:border-[#1D3C4A] hover:text-[#1D3C4A]"}"
        style="${active ? "background:#1D3C4A;" : ""}"
        onclick="window.subGoToPage(${i})">${i + 1}</button>`;
    }

    html += `<button
      class="px-4 py-2 rounded-full text-sm border transition-colors ${currentPage >= totalPages - 1 ? "border-gray-200 text-gray-300 cursor-not-allowed" : "border-gray-300 text-gray-700 hover:border-[#1D3C4A] hover:text-[#1D3C4A]"}"
      ${currentPage >= totalPages - 1 ? "disabled" : `onclick="window.subGoToPage(${currentPage + 1})"`}>Next →</button>`;

    html += `</div>`;
    container.innerHTML = html;
  }

  window.subGoToPage = function (page) {
    if (page < 0 || page >= totalPages || page === currentPage) return;
    window.scrollTo({ top: 0, behavior: "smooth" });
    activeFilters = { priceRange: null, color: null };
    fetchProducts(page);
  };

  // ─── SMALL HELPERS ────────────────────────────────────────────────────────────
  function updateProductCount(count) {
    const el = document.getElementById("productCount");
    if (el) el.textContent = `${count} product${count !== 1 ? "s" : ""}`;
  }

  function showSkeleton(show) {
    if (!skeleton || !grid) return;
    if (show) {
      if (!skeleton.innerHTML.trim()) {
        let html = "";
        for (let i = 0; i < 8; i++) {
          html += `
            <div class="rounded-xl overflow-hidden bg-white border border-gray-100 shadow-sm">
              <div class="skeleton-pulse aspect-square"></div>
              <div class="p-3 space-y-2">
                <div class="skeleton-pulse h-4 rounded w-3/4"></div>
                <div class="skeleton-pulse h-3 rounded w-1/2"></div>
                <div class="skeleton-pulse h-5 rounded w-2/3"></div>
              </div>
            </div>`;
        }
        skeleton.innerHTML = html;
      }
      skeleton.style.display = "grid";
      grid.classList.add("hidden");
    } else {
      skeleton.style.display = "none";
    }
  }

  function showError(msg) {
    if (!grid) return;
    grid.innerHTML = `
      <div class="col-span-full text-center py-16">
        <i class="far fa-frown text-5xl mb-4" style="color:#e39f32;"></i>
        <p class="text-gray-500 mt-3 font-lexend">${escapeHtml(msg)}</p>
        <a href="../index.html"
           class="mt-5 inline-block px-6 py-2.5 rounded-full text-sm font-medium text-white transition hover:opacity-90"
           style="background:#1D3C4A;">Back to Home</a>
      </div>`;
    grid.classList.remove("hidden");
    if (skeleton) skeleton.style.display = "none";
  }

  function hideError() {
    // Errors render inside the grid itself — nothing to clear separately
  }

  function showToast(msg) {
    console.log("[HSC] showToast:", msg);
    if (window.showGlobalToast) { window.showGlobalToast(msg); return; }
    if (!toast) return;
    const span = toast.querySelector("span");
    if (span) span.textContent = msg;
    toast.classList.add("show");
    clearTimeout(toast._t);
    toast._t = setTimeout(() => toast.classList.remove("show"), 2500);
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