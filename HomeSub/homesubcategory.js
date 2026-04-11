// homesubcategory.js
// Reads ?subCategory= from URL → fetches /api/products/get-by-sub-category → renders product cards
// All static ProductDatabase / dummy product logic has been removed.

(function () {
  "use strict";

  // ─── CONFIG ─────────────────────────────────────────────────────────────────
  const BASE_URL = "http://localhost:8085";
  const PAGE_SIZE = 12;

  // ─── STATE ───────────────────────────────────────────────────────────────────
  let currentSubCategory = "";
  let currentPage = 0;
  let totalPages = 0;
  let totalElements = 0;
  let isLoading = false;

  // Active UI filters (client-side, applied to fetched page data)
  let activeFilters = {
    priceRange: null,
    color: null,
  };

  // All products on the current fetched page (used for client-side filter pass)
  let currentPageProducts = [];

  // ─── DOM REFS ────────────────────────────────────────────────────────────────
  const grid = document.getElementById("productGrid");
  const skeleton = document.getElementById("skeletonGrid");
  const emptyState = document.getElementById("emptyState");
  const toast = document.getElementById("toast");
  const desktopFilterDiv = document.getElementById("desktopFilterContainer");
  const mobileFilterContent = document.getElementById("mobileFilterContent");
  const mobileDrawer = document.getElementById("mobileFilterDrawer");
  const closeMobile = document.getElementById("closeMobileFilter");
  const mobileApply = document.getElementById("mobileApplyFilters");
  const resetFiltersBtn = document.getElementById("resetFiltersBtn");
  const applyFiltersBtn = document.getElementById("applyFiltersBtn");
  const tabsContainer = document.getElementById("subcategoryTabs");

  // ─── INIT ────────────────────────────────────────────────────────────────────
  function init() {
    const params = new URLSearchParams(window.location.search);
    currentSubCategory = params.get("subCategory") || "";

    if (!currentSubCategory) {
      showError("No subcategory selected. Please navigate from the menu.");
      return;
    }

    // Update page header elements
    updatePageHeader(currentSubCategory);

    // Wire filter + mobile drawer event listeners
    bindFilterEvents();

    fetchProducts(0);
  }

  // ─── UPDATE PAGE HEADER ──────────────────────────────────────────────────────
  function updatePageHeader(subCategoryName) {
    document.title = `${subCategoryName} — Artezo Store`;

    const titleEl = document.getElementById("categoryTitle");
    if (titleEl) titleEl.textContent = subCategoryName;

    const descEl = document.getElementById("categoryDescription");
    if (descEl) descEl.textContent = `Browse our collection of ${subCategoryName}.`;

    const breadcrumbEl = document.getElementById("breadcrumbSub");
    if (breadcrumbEl) breadcrumbEl.textContent = subCategoryName;

    // Hide the subcategory tabs row — they were driven by static data;
    // with the API flow each subCategory is its own page load.
    if (tabsContainer) tabsContainer.style.display = "none";
  }

  // ─── FETCH PRODUCTS ──────────────────────────────────────────────────────────
  async function fetchProducts(page) {
    if (isLoading) return;
    isLoading = true;

    showSkeleton(true);
    hideError();

    try {
      const url =
        `${BASE_URL}/api/products/get-by-sub-category` +
        `?subCategory=${encodeURIComponent(currentSubCategory)}` +
        `&page=${page}&size=${PAGE_SIZE}`;

      const res = await fetch(url, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const data = await res.json();

      currentPage = data.page?.number ?? page;
      totalPages = data.page?.totalPages ?? 1;
      totalElements = data.page?.totalElements ?? 0;
      currentPageProducts = data.content || [];

      showSkeleton(false);

      // Build filter UI from the fetched products' data
      buildFilterUI(currentPageProducts);

      // Apply any active client-side filters and render
      applyAndRender();
      renderPagination();
      updateProductCount(totalElements);

    } catch (err) {
      console.error("[HomeSubcategory] Fetch error:", err);
      showSkeleton(false);
      showError(`Could not load products for "${currentSubCategory}". Please try again.`);
    } finally {
      isLoading = false;
    }
  }

  // ─── CLIENT-SIDE FILTER + RENDER ────────────────────────────────────────────
  function applyAndRender() {
    let filtered = [...currentPageProducts];

    // Price range filter
    if (activeFilters.priceRange) {
      const range = activeFilters.priceRange;
      filtered = filtered.filter(p => {
        const price = p.currentSellingPrice || 0;
        if (range === "under500")    return price < 500;
        if (range === "500-1000")    return price >= 500 && price <= 1000;
        if (range === "1000-2000")   return price >= 1000 && price <= 2000;
        if (range === "above2000")   return price > 2000;
        return true;
      });
    }

    // Color filter
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
      if (emptyState) emptyState.classList.remove("hidden");
      return;
    }

    if (emptyState) emptyState.classList.add("hidden");
    grid.classList.remove("hidden");

    grid.innerHTML = products.map(p => buildProductCard(p)).join("");
  }

  // ─── BUILD PRODUCT CARD ──────────────────────────────────────────────────────
  function buildProductCard(p) {
    const mrp = p.currentMrpPrice || 0;
    const selling = p.currentSellingPrice || 0;

    // Strict integer discount — no lossy conversion, no floating point shown
    const discount = mrp > 0
      ? Math.round(((mrp - selling) / mrp) * 100)
      : 0;

    // Prefix relative image paths with the base URL
    const imageUrl = p.mainImage
      ? (p.mainImage.startsWith("http") ? p.mainImage : `${BASE_URL}${p.mainImage}`)
      : "place holder img";

    const name = escapeHtml(p.productName || "Unnamed Product");
    const color = escapeHtml(p.selectedColor || "");
    const subCat = escapeHtml(p.productSubCategory || "");

    // Badge: customizable > discount
    let badge = "";
    if (p.isCustomizable) {
      badge = `<span class="absolute top-2 left-2 bg-purple-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full z-10 shadow">CUSTOMIZABLE</span>`;
    } else if (discount >= 10) {
      badge = `<span class="absolute top-2 left-2 bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full z-10 shadow">${discount}% OFF</span>`;
    }

    return `
      <div class="bg-white border border-gray-200 rounded-xl overflow-hidden flex flex-col shadow-sm group cursor-pointer hover:-translate-y-1 hover:shadow-md transition-all duration-300"
           data-id="${p.productPrimeId}"
           onclick="window.location.href='../Product-Details/product-detail.html?id=${p.productPrimeId}'">

        <!-- Image -->
        <div class="aspect-square bg-gray-100 relative overflow-hidden">
          <img src="${imageUrl}"
               alt="${name}"
               class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
               loading="lazy"
               onerror="this.src=''">
          ${badge}
        </div>

        <!-- Info -->
        <div class="p-3 flex-1 flex flex-col">
          <h3 class="font-medium text-gray-800 text-sm mb-1 line-clamp-2 min-h-[40px]">${name}</h3>

          <!-- Color -->
          ${color
            ? `<span class="text-xs text-gray-500 mb-1">Color: <span class="font-medium text-gray-700">${color}</span></span>`
            : ""}

          <!-- Sub-category chip -->
          ${subCat
            ? `<span class="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full w-fit mb-2">${subCat}</span>`
            : ""}

          <!-- Pricing — always at bottom -->
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

        <!-- CTA -->
        <button
          class="add-cart-btn mt-auto w-full bg-gray-100 hover:bg-[#1D3C4A] hover:text-white transition-all duration-300 text-gray-800 text-sm py-2.5 rounded-b-xl border-t border-gray-100 flex items-center justify-center gap-2 font-medium"
          onclick="event.stopPropagation(); window.location.href='../Product-Details/product-detail.html?id=${p.productPrimeId}'">
          <i class="fas fa-bag-shopping text-xs" style="color:#e39f32;"></i>
          View Product
        </button>
      </div>
    `;
  }

  // ─── FILTER UI ───────────────────────────────────────────────────────────────
  function buildFilterUI(products) {
    if (!desktopFilterDiv) return;

    // Derive unique colors from current page products
    const colors = [...new Set(
      products.map(p => p.selectedColor).filter(Boolean)
    )];

    const filterHTML = `
      <div class="space-y-5">

        <!-- Price Range -->
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

        <!-- Color -->
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

      </div>
    `;

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
    const root = container || document;
    const priceEl = root.querySelector('input[name="priceRange"]:checked');
    const colorEl = root.querySelector('input[name="filterColor"]:checked');
    activeFilters.priceRange = priceEl ? priceEl.value : null;
    activeFilters.color = colorEl ? colorEl.value : null;
  }

  function resetFilters() {
    activeFilters = { priceRange: null, color: null };
    buildFilterUI(currentPageProducts);
    applyAndRender();
  }

  // ─── BIND EVENTS ─────────────────────────────────────────────────────────────
  function bindFilterEvents() {
    if (applyFiltersBtn) {
      applyFiltersBtn.addEventListener("click", () => {
        readFilters(desktopFilterDiv);
        applyAndRender();
      });
    }

    if (resetFiltersBtn) {
      resetFiltersBtn.addEventListener("click", resetFilters);
    }

    if (closeMobile && mobileDrawer) {
      closeMobile.addEventListener("click", () => {
        mobileDrawer.classList.add("opacity-0", "pointer-events-none");
        mobileDrawer.querySelector("div")?.classList.remove("drawer-open");
      });
    }

    if (mobileApply && mobileFilterContent) {
      mobileApply.addEventListener("click", () => {
        readFilters(mobileFilterContent);
        buildFilterUI(currentPageProducts); // re-sync desktop
        applyAndRender();
        mobileDrawer?.classList.add("opacity-0", "pointer-events-none");
        mobileDrawer?.querySelector("div")?.classList.remove("drawer-open");
      });
    }

    // Mobile filter toggle button (if present in HTML)
    const mobileToggle = document.getElementById("mobileFilterToggle");
    if (mobileToggle && mobileDrawer) {
      mobileToggle.addEventListener("click", () => {
        mobileDrawer.classList.remove("opacity-0", "pointer-events-none");
        mobileDrawer.querySelector("div")?.classList.add("drawer-open");
      });
    }

    // Empty state reset
    const emptyReset = document.getElementById("emptyResetBtn");
    if (emptyReset) emptyReset.addEventListener("click", resetFilters);
  }

  // ─── PAGINATION ──────────────────────────────────────────────────────────────
  function renderPagination() {
    const container = document.getElementById("subCategoryPagination");
    if (!container) return;

    if (totalPages <= 1) {
      container.innerHTML = "";
      return;
    }

    let html = `<div class="flex items-center justify-center gap-2 mt-8 flex-wrap">`;

    html += `<button
      class="px-4 py-2 rounded-full text-sm border transition-colors ${currentPage === 0 ? "border-gray-200 text-gray-300 cursor-not-allowed" : "border-gray-300 text-gray-700 hover:border-[#1D3C4A] hover:text-[#1D3C4A]"}"
      ${currentPage === 0 ? "disabled" : `onclick="window.subGoToPage(${currentPage - 1})"`}>
      ← Prev
    </button>`;

    const startPage = Math.max(0, currentPage - 2);
    const endPage = Math.min(totalPages - 1, currentPage + 2);

    for (let i = startPage; i <= endPage; i++) {
      const isActive = i === currentPage;
      html += `<button
        class="w-9 h-9 rounded-full text-sm border transition-colors ${isActive ? "text-white border-[#1D3C4A]" : "border-gray-300 text-gray-700 hover:border-[#1D3C4A] hover:text-[#1D3C4A]"}"
        style="${isActive ? "background:#1D3C4A;" : ""}"
        onclick="window.subGoToPage(${i})">
        ${i + 1}
      </button>`;
    }

    html += `<button
      class="px-4 py-2 rounded-full text-sm border transition-colors ${currentPage >= totalPages - 1 ? "border-gray-200 text-gray-300 cursor-not-allowed" : "border-gray-300 text-gray-700 hover:border-[#1D3C4A] hover:text-[#1D3C4A]"}"
      ${currentPage >= totalPages - 1 ? "disabled" : `onclick="window.subGoToPage(${currentPage + 1})"`}>
      Next →
    </button>`;

    html += `</div>`;
    container.innerHTML = html;
  }

  window.subGoToPage = function (page) {
    if (page < 0 || page >= totalPages || page === currentPage) return;
    window.scrollTo({ top: 0, behavior: "smooth" });
    activeFilters = { priceRange: null, color: null }; // reset on page change
    fetchProducts(page);
  };

  // ─── PRODUCT COUNT ────────────────────────────────────────────────────────────
  function updateProductCount(count) {
    // homesubcategory.html doesn't have a dedicated count span in the original,
    // but we wire it up in case one is added.
    const el = document.getElementById("productCount");
    if (el) el.textContent = `${count} product${count !== 1 ? "s" : ""}`;
  }

  // ─── SKELETON ────────────────────────────────────────────────────────────────
  function showSkeleton(show) {
    if (!skeleton || !grid) return;

    if (show) {
      // Build skeleton cards if empty
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

  // ─── ERROR ───────────────────────────────────────────────────────────────────
  function showError(msg) {
    if (!grid) return;
    grid.innerHTML = `
      <div class="col-span-full text-center py-16">
        <i class="far fa-frown text-5xl mb-4" style="color:#e39f32;"></i>
        <p class="text-gray-500 mt-3 font-lexend">${escapeHtml(msg)}</p>
        <a href="../index.html"
           class="mt-5 inline-block px-6 py-2.5 rounded-full text-sm font-medium text-white transition hover:opacity-90"
           style="background:#1D3C4A;">
          Back to Home
        </a>
      </div>`;
    grid.classList.remove("hidden");
    if (skeleton) skeleton.style.display = "none";
  }

  function hideError() {
    // Errors are rendered inside the grid itself
  }

  // ─── TOAST ───────────────────────────────────────────────────────────────────
  function showToast(msg) {
    if (!toast) return;
    const span = toast.querySelector("span");
    if (span) span.textContent = msg;
    toast.classList.add("show");
    setTimeout(() => toast.classList.remove("show"), 2000);
  }

  // ─── UTILS ───────────────────────────────────────────────────────────────────
  function escapeHtml(text) {
    if (!text) return "";
    const d = document.createElement("div");
    d.textContent = text;
    return d.innerHTML;
  }

  // ─── START ───────────────────────────────────────────────────────────────────
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }

})();
