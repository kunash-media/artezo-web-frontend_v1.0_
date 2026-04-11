// homecategory.js
// Reads ?category= from URL → fetches /api/products/get-by-category → renders product cards

(function () {
  "use strict";

  // ─── CONFIG ─────────────────────────────────────────────────────────────────
  const BASE_URL = "http://localhost:8085";
  const PAGE_SIZE = 12;

  // ─── STATE ───────────────────────────────────────────────────────────────────
  let currentCategory = "";
  let currentPage = 0;
  let totalPages = 0;
  let totalElements = 0;
  let isLoading = false;

  // ─── INIT ────────────────────────────────────────────────────────────────────
  function init() {
    const params = new URLSearchParams(window.location.search);
    currentCategory = params.get("category") || "";

    if (!currentCategory) {
      showError("No category selected. Please navigate from the menu.");
      return;
    }

    // Update page title elements if they exist in homecategory.html
    updatePageTitle(currentCategory);

    fetchProducts(0);
  }

  // ─── UPDATE PAGE TITLE ───────────────────────────────────────────────────────
  function updatePageTitle(categoryName) {
    // Update browser tab title
    document.title = `${categoryName} — Artezo Store`;

    // Update any h1/heading elements that show the category name
    const titleEls = document.querySelectorAll(
      "[data-category-title], #categoryPageTitle, #heroTitle"
    );
    titleEls.forEach(el => { el.textContent = categoryName; });

    // Update breadcrumb if present
    const breadcrumbEl = document.querySelector(
      "[data-category-breadcrumb], #categoryBreadcrumb"
    );
    if (breadcrumbEl) breadcrumbEl.textContent = categoryName;
  }

  // ─── FETCH PRODUCTS ──────────────────────────────────────────────────────────
  async function fetchProducts(page) {
    if (isLoading) return;
    isLoading = true;

    showSkeleton(true);
    hideError();

    try {
      const url = `${BASE_URL}/api/products/get-by-category?category=${encodeURIComponent(currentCategory)}&page=${page}&size=${PAGE_SIZE}`;

      const res = await fetch(url, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const data = await res.json();

      currentPage = data.page?.number ?? page;
      totalPages = data.page?.totalPages ?? 1;
      totalElements = data.page?.totalElements ?? 0;

      const products = data.content || [];

      showSkeleton(false);
      renderProducts(products);
      renderPagination();
      updateProductCount(totalElements);

    } catch (err) {
      console.error("[HomeCategory] Fetch error:", err);
      showSkeleton(false);
      showError(`Could not load products for "${currentCategory}". Please try again.`);
    } finally {
      isLoading = false;
    }
  }

  // ─── RENDER PRODUCTS ─────────────────────────────────────────────────────────
  function renderProducts(products) {
    const grid = document.getElementById("categoryProductGrid");
    const emptyState = document.getElementById("categoryEmptyState");

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

    // Strict integer discount — no lossy conversion
    const discount = mrp > 0
      ? Math.round(((mrp - selling) / mrp) * 100)
      : 0;

    // Prefix relative image paths with the base URL
    const imageUrl = p.mainImage
      ? (p.mainImage.startsWith("http") ? p.mainImage : `${BASE_URL}${p.mainImage}`)
      : "https://via.placeholder.com/400x400?text=No+Image";

    const name = escapeHtml(p.productName || "Unnamed Product");
    const color = escapeHtml(p.selectedColor || "");
    const subCategory = escapeHtml(p.productSubCategory || "");

    // Discount badge — only show if discount > 0
    const discountBadge = discount > 0
      ? `<span class="absolute top-2 left-2 bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full z-10 shadow">${discount}% OFF</span>`
      : "";

    // Customizable badge overrides discount badge
    const topBadge = p.isCustomizable
      ? `<span class="absolute top-2 left-2 bg-purple-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full z-10 shadow">CUSTOMIZABLE</span>`
      : discountBadge;

    return `
      <div class="bg-white rounded-xl border border-gray-100 overflow-hidden shadow-sm hover:-translate-y-1 hover:shadow-md transition-all duration-300 flex flex-col cursor-pointer group"
           onclick="window.location.href='../Product-Details/product-detail.html?id=${p.productPrimeId}'">

        <!-- Image -->
        <div class="relative aspect-square bg-gray-50 overflow-hidden">
          <img src="${imageUrl}"
               alt="${name}"
               class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
               loading="lazy"
               onerror="this.src='https://via.placeholder.com/400x400?text=No+Image'">
          ${topBadge}
        </div>

        <!-- Info -->
        <div class="p-3 flex flex-col flex-1">
          <!-- Name -->
          <h3 class="text-sm font-medium text-gray-800 line-clamp-2 min-h-[40px] mb-2">${name}</h3>

          <!-- Color chip -->
          ${color ? `<span class="text-xs text-gray-500 mb-2">Color: <span class="text-gray-700 font-medium">${color}</span></span>` : ""}

          <!-- Sub-category chip -->
          ${subCategory ? `<span class="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full w-fit mb-2">${subCategory}</span>` : ""}

          <!-- Pricing -->
          <div class="mt-auto">
            <div class="flex items-baseline gap-2 flex-wrap">
              <span class="text-base font-bold" style="color:#1D3C4A;">₹${selling.toLocaleString("en-IN")}</span>
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
          class="w-full py-2.5 text-sm font-medium bg-gray-50 hover:bg-[#1D3C4A] hover:text-white border-t border-gray-100 transition-colors duration-200 flex items-center justify-center gap-2"
          onclick="event.stopPropagation(); window.location.href='../Product-Details/product-detail.html?id=${p.productPrimeId}'">
          <i class="fa-solid fa-bag-shopping text-xs" style="color:#e39f32;"></i>
          View Product
        </button>
      </div>
    `;
  }

  // ─── RENDER PAGINATION ───────────────────────────────────────────────────────
  function renderPagination() {
    const container = document.getElementById("categoryPagination");
    if (!container) return;

    if (totalPages <= 1) {
      container.innerHTML = "";
      return;
    }

    let html = `<div class="flex items-center justify-center gap-2 mt-8 flex-wrap">`;

    // Prev button
    html += `<button
      class="px-4 py-2 rounded-full text-sm border transition-colors ${currentPage === 0 ? "border-gray-200 text-gray-300 cursor-not-allowed" : "border-gray-300 text-gray-700 hover:border-[#1D3C4A] hover:text-[#1D3C4A]"}"
      ${currentPage === 0 ? "disabled" : `onclick="window.goToPage(${currentPage - 1})"`}>
      ← Prev
    </button>`;

    // Page numbers — show at most 5 around current
    const startPage = Math.max(0, currentPage - 2);
    const endPage = Math.min(totalPages - 1, currentPage + 2);

    for (let i = startPage; i <= endPage; i++) {
      const isActive = i === currentPage;
      html += `<button
        class="w-9 h-9 rounded-full text-sm border transition-colors ${isActive ? "text-white border-[#1D3C4A]" : "border-gray-300 text-gray-700 hover:border-[#1D3C4A] hover:text-[#1D3C4A]"}"
        style="${isActive ? "background:#1D3C4A;" : ""}"
        onclick="window.goToPage(${i})">
        ${i + 1}
      </button>`;
    }

    // Next button
    html += `<button
      class="px-4 py-2 rounded-full text-sm border transition-colors ${currentPage >= totalPages - 1 ? "border-gray-200 text-gray-300 cursor-not-allowed" : "border-gray-300 text-gray-700 hover:border-[#1D3C4A] hover:text-[#1D3C4A]"}"
      ${currentPage >= totalPages - 1 ? "disabled" : `onclick="window.goToPage(${currentPage + 1})"`}>
      Next →
    </button>`;

    html += `</div>`;
    container.innerHTML = html;
  }

  // ─── PAGE NAVIGATION ─────────────────────────────────────────────────────────
  window.goToPage = function (page) {
    if (page < 0 || page >= totalPages || page === currentPage) return;
    window.scrollTo({ top: 0, behavior: "smooth" });
    fetchProducts(page);
  };

  // ─── UPDATE PRODUCT COUNT ────────────────────────────────────────────────────
  function updateProductCount(count) {
    const countEl = document.getElementById("categoryProductCount");
    if (countEl) {
      countEl.textContent = `${count} product${count !== 1 ? "s" : ""}`;
    }
  }

  // ─── SKELETON ────────────────────────────────────────────────────────────────
  function showSkeleton(show) {
    const skeleton = document.getElementById("categorySkeletonGrid");
    const grid = document.getElementById("categoryProductGrid");

    if (skeleton) skeleton.style.display = show ? "grid" : "none";
    if (grid) {
      if (show) grid.classList.add("hidden");
    }
  }

  // ─── ERROR ───────────────────────────────────────────────────────────────────
  function showError(msg) {
    const el = document.getElementById("categoryError");
    if (!el) return;
    el.textContent = msg;
    el.classList.remove("hidden");
  }

  function hideError() {
    const el = document.getElementById("categoryError");
    if (el) el.classList.add("hidden");
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