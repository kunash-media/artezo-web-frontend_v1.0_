// homecategory.js
// Wishlist: single fetch on load → in-memory Set → optimistic UI → event delegation

(function () {
  "use strict";

  // ─── CONFIG ──────────────────────────────────────────────────────────────────
  const BASE_URL     = "http://localhost:8085";
  const FALLBACK_IMG = "/Images/product_fallback/artezo_product_fallback_img.png";
  const PAGE_SIZE    = 12;

  // ─── WISHLIST STATE ───────────────────────────────────────────────────────────
  const wishlistSet = new Set();  // Set<productId (number)>
  const inFlight    = new Set();  // debounce guard

  // ─── PRODUCT STATE ────────────────────────────────────────────────────────────
  let currentCategory = "";
  let currentPage     = 0;
  let totalPages      = 0;
  let totalElements   = 0;
  let isLoading       = false;

  // ─── GET USER ID ─────────────────────────────────────────────────────────────
  function getUserId() {
    console.group("[HC] getUserId() — scanning localStorage");

    if (localStorage.length === 0) {
      console.warn("[HC] localStorage is EMPTY");
    } else {
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        console.log(`[HC]   key="${k}"  raw value=`, localStorage.getItem(k));
      }
    }

    // Strategy 1: plain value stored under key "userId"
    const directId = localStorage.getItem("userId");
    if (directId) {
      const id = Number(directId);
      console.log(`[HC] Strategy 1 hit — key "userId" = "${directId}", parsed = ${id}`);
      console.groupEnd();
      return id;
    }

    // Strategy 2: JSON object stored under key "user"
    const userRaw = localStorage.getItem("user");
    if (userRaw) {
      try {
        const parsed = JSON.parse(userRaw);
        console.log('[HC] Strategy 2 — key "user" parsed:', parsed);
        const id = parsed.id || parsed.userId || parsed.user_id || null;
        if (id) {
          console.log("[HC] Strategy 2 hit — id field =", id);
          console.groupEnd();
          return Number(id);
        }
        console.warn("[HC] Strategy 2 — object has no id/userId/user_id field");
      } catch (err) {
        console.warn('[HC] Strategy 2 — key "user" is not valid JSON:', userRaw, err);
      }
    }

    // Strategy 3: JSON object stored under key "userData"
    const userDataRaw = localStorage.getItem("userData");
    if (userDataRaw) {
      try {
        const parsed = JSON.parse(userDataRaw);
        console.log('[HC] Strategy 3 — key "userData" parsed:', parsed);
        const id = parsed.id || parsed.userId || null;
        if (id) {
          console.log("[HC] Strategy 3 hit — id =", id);
          console.groupEnd();
          return Number(id);
        }
      } catch (err) {
        console.warn('[HC] Strategy 3 — userData not valid JSON', err);
      }
    }

    console.error("[HC] getUserId() FAILED — userId not found in localStorage under any known key. API will be skipped.");
    console.groupEnd();
    return null;
  }

  // ─── INIT ─────────────────────────────────────────────────────────────────────
  async function init() {
    console.log("[HC] ========== init() start ==========");
    const params = new URLSearchParams(window.location.search);
    currentCategory = params.get("category") || "";
    console.log("[HC] category from URL:", currentCategory || "(none)");

    if (!currentCategory) {
      showError("No category selected. Please navigate from the menu.");
      return;
    }

    updatePageTitle(currentCategory);
    wireGridDelegation();

    console.log("[HC] Starting parallel fetch: products + wishlist");
    await Promise.all([loadWishlist(), fetchProducts(0)]);
    console.log("[HC] ========== init() complete ==========");
  }

  // ─── EVENT DELEGATION ─────────────────────────────────────────────────────────
  let delegationWired = false;
  function wireGridDelegation() {
    if (delegationWired) {
      console.log("[HC] wireGridDelegation() — already wired, skipping");
      return;
    }
    const grid = document.getElementById("categoryProductGrid");
    if (!grid) {
      console.error("[HC] wireGridDelegation() — #categoryProductGrid NOT in DOM yet, cannot wire");
      return;
    }
    delegationWired = true;
    console.log("[HC] wireGridDelegation() — listener attached to #categoryProductGrid ✅");

    grid.addEventListener("click", function (e) {
      console.log("[HC] grid click fired —", "target:", e.target.tagName, e.target.className);

      // Heart button or the <i> icon child inside it
      const heartBtn = e.target.closest(".wl-btn");
      if (heartBtn) {
        console.log("[HC] 💛 .wl-btn matched — stopping propagation, calling handleHeartClick");
        e.stopPropagation();
        e.preventDefault();
        handleHeartClick(heartBtn);
        return;
      }

      // "View Product" CTA button
      const ctaBtn = e.target.closest(".cta-btn");
      if (ctaBtn) {
        console.log("[HC] .cta-btn matched, pid:", ctaBtn.dataset.pid);
        e.stopPropagation();
        if (ctaBtn.dataset.pid) navigateToProduct(ctaBtn.dataset.pid);
        return;
      }

      // Card body — navigate to detail
      const card = e.target.closest(".product-card");
      if (card) {
        console.log("[HC] .product-card matched, pid:", card.dataset.pid);
        if (card.dataset.pid) navigateToProduct(card.dataset.pid);
      }
    });
  }

  function navigateToProduct(pid) {
    console.log("[HC] navigating to product id:", pid);
    window.location.href = `../Product-Details/product-detail.html?id=${pid}`;
  }

  // ─── HEART CLICK HANDLER ──────────────────────────────────────────────────────
  async function handleHeartClick(btn) {
    console.group("[HC] handleHeartClick()");
    console.log("[HC] btn.dataset:", { ...btn.dataset });

    const userId = getUserId();
    console.log("[HC] userId:", userId, " (type:", typeof userId, ")");

    if (!userId) {
      console.error("[HC] ❌ No userId found — toast shown, API NOT called");
      showToast("Please log in to save items to your wishlist.");
      console.groupEnd();
      return;
    }

    const productId = Number(btn.dataset.productId);
    console.log("[HC] productId:", productId);

    if (!productId || isNaN(productId)) {
      console.error("[HC] ❌ productId is invalid:", btn.dataset.productId);
      console.groupEnd();
      return;
    }

    if (inFlight.has(productId)) {
      console.warn("[HC] ⏳ Already in-flight for productId:", productId, "— ignoring");
      console.groupEnd();
      return;
    }

    const wasWishlisted = wishlistSet.has(productId);
    const nowWishlisted = !wasWishlisted;
    console.log(`[HC] Toggle: wasWishlisted=${wasWishlisted} → nowWishlisted=${nowWishlisted}`);

    // Optimistic update — instant UI feedback before API responds
    nowWishlisted ? wishlistSet.add(productId) : wishlistSet.delete(productId);
    setHeartState(btn, nowWishlisted);
    console.log("[HC] wishlistSet after optimistic update:", [...wishlistSet]);

    inFlight.add(productId);

    try {
      if (nowWishlisted) {
        console.log("[HC] 🔼 Calling addToWishlist — userId:", userId, "productId:", productId);
        await addToWishlist(userId, productId, btn.dataset);
        console.log("[HC] ✅ addToWishlist SUCCESS");
        showToast("Added to wishlist ♥");
      } else {
        // data-variant-id on the button already holds the resolved fallback
        // (same value stored in DB during add) — safe to pass directly.
        console.log("[HC] 🔽 Calling removeFromWishlist — userId:", userId, "productId:", productId, "variantId:", btn.dataset.variantId);
        await removeFromWishlist(userId, productId, btn.dataset.variantId);
        console.log("[HC] ✅ removeFromWishlist SUCCESS");
        showToast("Removed from wishlist");
      }
    } catch (err) {
      console.error("[HC] ❌ API call failed — rolling back optimistic update. Error:", err);
      wasWishlisted ? wishlistSet.add(productId) : wishlistSet.delete(productId);
      setHeartState(btn, wasWishlisted);
      showToast("Could not update wishlist. Please try again.");
    } finally {
      inFlight.delete(productId);
      console.log("[HC] inFlight cleared. Remaining:", [...inFlight]);
      console.groupEnd();
    }
  }

  // ─── WISHLIST: LOAD ONCE ──────────────────────────────────────────────────────
  async function loadWishlist() {
    console.group("[HC] loadWishlist()");
    const userId = getUserId();

    if (!userId) {
      console.warn("[HC] loadWishlist — no userId, skipping fetch");
      console.groupEnd();
      return;
    }

    const url = `${BASE_URL}/api/v1/wishlist?userId=${encodeURIComponent(userId)}`;
    console.log("[HC] GET", url);

    try {
      const res = await fetch(url, { headers: { "Content-Type": "application/json" } });
      console.log("[HC] loadWishlist status:", res.status, res.statusText);

      if (!res.ok) {
        console.error("[HC] loadWishlist HTTP error:", res.status);
        console.groupEnd();
        return;
      }

      const data = await res.json();
      console.log("[HC] loadWishlist response body:", data);

      if (!data.success || !Array.isArray(data.data)) {
        console.warn("[HC] loadWishlist — unexpected response shape:", data);
        console.groupEnd();
        return;
      }

      data.data.forEach(wl => {
        (wl.items || []).forEach(item => {
          if (item.productId != null) wishlistSet.add(Number(item.productId));
        });
      });

      console.log("[HC] wishlistSet populated:", [...wishlistSet]);
      syncHeartIcons();
    } catch (err) {
      console.error("[HC] loadWishlist EXCEPTION:", err);
    }

    console.groupEnd();
  }

  function syncHeartIcons() {
    const btns = document.querySelectorAll(".wl-btn[data-product-id]");
    console.log(`[HC] syncHeartIcons — updating ${btns.length} heart buttons`);
    btns.forEach(btn => {
      const pid = Number(btn.dataset.productId);
      setHeartState(btn, wishlistSet.has(pid));
    });
  }

  // ─── WISHLIST API ─────────────────────────────────────────────────────────────
  async function addToWishlist(userId, productId, d) {
    // sku and variantId are NOT NULL in DB.
    // The resolved fallback values here MUST match what is written into
    // data-variant-id / data-sku on the card button (see buildProductCard).
    // Keeping the fallback logic in one place (resolveVariantId / resolveSku)
    // ensures add and remove always use the identical key.
    const sku       = d.sku       || `PROD-${productId}`;
    const variantId = d.variantId || `VAR-${productId}`;

    const payload = {
      userId:           Number(userId),
      wishlistName:     "My Wishlist",
      productId:        Number(productId),
      variantId,
      sku,
      selectedColor:    d.color     || null,
      selectedSize:     d.size      || null,
      titleName:        d.title     || null,
      wishlistedPrice:  Number(d.price) || 0,
      customFieldsJson: null,
    };

    const url = `${BASE_URL}/api/v1/wishlist/add`;
    console.log("[HC] POST", url);
    console.log("[HC] addToWishlist payload:", JSON.stringify(payload, null, 2));

    const res = await fetch(url, {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify(payload),
    });

    console.log("[HC] addToWishlist response status:", res.status, res.statusText);

    if (!res.ok) {
      const errBody = await res.text().catch(() => "(could not read body)");
      console.error("[HC] addToWishlist error response body:", errBody);
      throw new Error(`HTTP ${res.status}`);
    }

    const json = await res.json().catch(() => null);
    console.log("[HC] addToWishlist success response:", json);
  }

  async function removeFromWishlist(userId, productId, variantId) {
    // variantId here is already the resolved value from data-variant-id
    // (e.g. "VAR-1" not ""), so it matches the DB row exactly.
    const params = new URLSearchParams({
      userId:    Number(userId),
      productId: Number(productId),
    });
    if (variantId) params.append("variantId", variantId);

    const url = `${BASE_URL}/api/v1/wishlist/remove?${params.toString()}`;
    console.log("[HC] DELETE", url);

    const res = await fetch(url, { method: "DELETE" });
    console.log("[HC] removeFromWishlist response status:", res.status, res.statusText);

    if (!res.ok) {
      const errBody = await res.text().catch(() => "(could not read body)");
      console.error("[HC] removeFromWishlist error response body:", errBody);
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
    console.log("[HC] fetchProducts GET", url);

    try {
      const res  = await fetch(url, { headers: { "Content-Type": "application/json" } });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();

      currentPage   = data.page?.number       ?? page;
      totalPages    = data.page?.totalPages    ?? 1;
      totalElements = data.page?.totalElements ?? 0;

      console.log(`[HC] fetchProducts OK — ${totalElements} products, page ${currentPage + 1}/${totalPages}`);

      showSkeleton(false);
      renderProducts(data.content || []);
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
    console.log(`[HC] renderProducts — ${products.length} cards written to DOM`);

    syncHeartIcons();
    wireGridDelegation();
  }

  // ─── BUILD CARD ───────────────────────────────────────────────────────────────
  function buildProductCard(p) {
    const mrp       = p.currentMrpPrice     || 0;
    const selling   = p.currentSellingPrice || 0;
    const discount  = mrp > 0 ? Math.round(((mrp - selling) / mrp) * 100) : 0;
    const pid       = Number(p.productPrimeId);
    const isWL      = wishlistSet.has(pid);

    const imageUrl = p.mainImage
      ? (p.mainImage.startsWith("http") ? p.mainImage : `${BASE_URL}${p.mainImage}`)
      : FALLBACK_IMG;

    const name        = escapeHtml(p.productName        || "Unnamed Product");
    const color       = escapeHtml(p.selectedColor      || "");
    const subCategory = escapeHtml(p.productSubCategory || "");

    const discountBadge = discount > 0
      ? `<span class="absolute top-2 left-2 bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full z-10 shadow">${discount}% OFF</span>`
      : "";
    const topBadge = p.isCustomizable
      ? `<span class="absolute top-2 left-2 bg-purple-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full z-10 shadow">CUSTOMIZABLE</span>`
      : discountBadge;

    // ─── KEY FIX ──────────────────────────────────────────────────────────────
    // Resolve the SAME fallback values that addToWishlist sends to the DB.
    // Writing these resolved values into data-* attrs guarantees that the
    // removeFromWishlist call reads "VAR-1" (not "") and matches the DB row.
    // Rule: fallback logic lives here once — addToWishlist reads from d.variantId
    // / d.sku which are already resolved, so add and remove are always in sync.
    const resolvedVariantId = p.variantId || `VAR-${pid}`;
    const resolvedSku       = p.sku       || `PROD-${pid}`;

    const heartIcon = isWL
      ? `<i class="fa-solid fa-heart" style="color:#e39f32;font-size:14px;"></i>`
      : `<i class="fa-regular fa-heart" style="color:#9ca3af;font-size:14px;"></i>`;

    return `
      <div class="product-card bg-white rounded-xl h-[350px] border border-[#fccd81] overflow-hidden shadow-sm hover:-translate-y-1 hover:shadow-md transition-all duration-300 flex flex-col cursor-pointer group"
           data-pid="${pid}">

        <div class="relative aspect-square bg-gray-50 overflow-hidden">
          <img src="${imageUrl}" alt="${name}"
               class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
               loading="lazy"
               onerror="this.src='${FALLBACK_IMG}'">
          ${topBadge}

          <button
            class="wl-btn absolute top-2 right-2 z-10 w-8 h-8 flex items-center justify-center rounded-full bg-white/80 backdrop-blur-sm shadow hover:bg-white transition-all duration-200"
            data-product-id="${pid}"
            data-variant-id="${escapeHtml(resolvedVariantId)}"
            data-sku="${escapeHtml(resolvedSku)}"
            data-color="${escapeHtml(p.selectedColor  || "")}"
            data-size="${escapeHtml(p.selectedSize    || "")}"
            data-title="${escapeHtml(p.titleName      || "")}"
            data-price="${selling}"
            aria-label="${isWL ? "Remove from wishlist" : "Add to wishlist"}"
            title="${isWL ? "Remove from wishlist" : "Add to wishlist"}">
            ${heartIcon}
          </button>
        </div>

        <div class="p-3 flex flex-col flex-1">
          <h3 class="text-sm font-medium text-gray-800 line-clamp-2 border-t border-gray-400 min-h-[25px] mb-1">${name}</h3>
          ${color ? `<span class="text-xs text-gray-500 mb-2">Color: <span class="text-gray-700 font-medium">${color}</span></span>` : ""}
          ${subCategory ? `<span class="text-xs bg-gray-100 border border-[#fccd81] text-gray-600 px-2 py-0.5 rounded-full w-fit mb-2">${subCategory}</span>` : ""}
          <div class="mt-auto">
            <div class="flex items-baseline gap-2 flex-wrap">
              <span class="text-base font-bold" style="color:#1D3C4A;">₹${selling.toLocaleString("en-IN")}</span>
              ${mrp > selling ? `<span class="text-xs text-gray-400 line-through">₹${mrp.toLocaleString("en-IN")}</span>` : ""}
              ${discount > 0 ? `<span class="text-xs font-semibold text-green-600">${discount}% off</span>` : ""}
            </div>
          </div>
        </div>

        <button
          class="cta-btn w-full py-2.5 border-t border-[#fccd81] text-sm font-medium bg-gray-50 hover:bg-[#1D3C4A] hover:text-white transition-colors duration-200 flex items-center justify-center gap-2"
          data-pid="${pid}">
          <i class="fa-solid fa-bag-shopping text-xs" style="color:#e39f32;"></i>
          View Product
        </button>
      </div>
    `;
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
    console.log("[HC] showToast:", message);
    if (window.showGlobalToast) { window.showGlobalToast(message); return; }
    let t = document.getElementById("pdToast");
    if (!t) {
      t           = document.createElement("div");
      t.id        = "pdToast";
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