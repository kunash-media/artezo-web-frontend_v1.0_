(function () {
  // ============================================================
  // BANNER API INTEGRATION
  // ============================================================

  var BASE_URL = "http://localhost:8085"; 
  
  // ── Trending patch state ───────────────────────────────────────────────────
  const TRENDING_WISHLIST_SET = new Set(); 
  const TRENDING_IN_FLIGHT    = new Set(); 
  const TRENDING_ADDED_TO_CART = new Set(); // For "Go to Cart" persistence

  // Load persisted "Go to Cart" state
  function loadAddedToCartState() {
    try {
      const saved = JSON.parse(localStorage.getItem("trendingAddedToCart") || "[]");
      saved.forEach(id => TRENDING_ADDED_TO_CART.add(Number(id)));
    } catch(e) {}
  }

  function saveAddedToCartState() {
    try {
      localStorage.setItem("trendingAddedToCart", JSON.stringify(Array.from(TRENDING_ADDED_TO_CART)));
    } catch(e) {}
  }

  // Simple Toast Notification
  function showToast(message, duration = 2500) {
    let toast = document.getElementById("custom-toast");
    if (!toast) {
      toast = document.createElement("div");
      toast.id = "custom-toast";
      toast.style.cssText = `
        position: fixed; bottom: 20px; left: 50%; transform: translateX(-50%);
        background: #1D3C4A; color: white; padding: 12px 24px;
        border-radius: 9999px; font-size: 14px; z-index: 9999;
        box-shadow: 0 10px 15px -3px rgba(0,0,0,0.3);
        display: none; align-items: center; gap: 8px;
      `;
      document.body.appendChild(toast);
    }
    toast.textContent = message;
    toast.style.display = "flex";
    setTimeout(() => { toast.style.display = "none"; }, duration);
  }

  function fetchBannerFromAPI(pageName) {
    return fetch(BASE_URL + "/api/banners/get-banner-by-name/" + pageName)
      .then(function (res) {
        if (!res.ok) {
          throw new Error("Banner API responded with status " + res.status);
        }
        return res.json();
      })
      .then(function (json) {
        var bannerData = json && json.data ? json.data : null;

        if (!bannerData || !bannerData.slides || bannerData.slides.length === 0) {
          console.warn("[Artezo] No banner slides returned from API. Using default static banners.");
          return null;
        }

        var pageId = bannerData.id;

        var mappedSlides = bannerData.slides.map(function (slide) {
          var slideId = slide.id;

          var mainImageUrl = "";
          var smallImageUrl = "";
          
          if (slide.leftMain && slide.leftMain.imageUrl) mainImageUrl = slide.leftMain.imageUrl;
          else if (slide.leftMain && slide.leftMain.image) mainImageUrl = slide.leftMain.image;
          else if (slide.mainImageUrl) mainImageUrl = slide.mainImageUrl;
          else if (slide.mainImage) mainImageUrl = slide.mainImage;
          else mainImageUrl = BASE_URL + "/api/banners/get-left-main-image/" + pageId + "/" + slideId;
          
          if (slide.rightTop && slide.rightTop.imageUrl) smallImageUrl = slide.rightTop.imageUrl;
          else if (slide.rightTop && slide.rightTop.image) smallImageUrl = slide.rightTop.image;
          else if (slide.smallImageUrl) smallImageUrl = slide.smallImageUrl;
          else if (slide.smallImage) smallImageUrl = slide.smallImage;
          else smallImageUrl = BASE_URL + "/api/banners/get-right-top-image/" + pageId + "/" + slideId;
          
          if (mainImageUrl && mainImageUrl.startsWith('/') && BASE_URL) mainImageUrl = BASE_URL + mainImageUrl;
          if (smallImageUrl && smallImageUrl.startsWith('/') && BASE_URL) smallImageUrl = BASE_URL + smallImageUrl;

          var overlayText = null;
          if (slide.leftMain && slide.leftMain.title) {
            overlayText = {
              title: slide.leftMain.title,
              subtitle: slide.leftMain.subtitle || ""
            };
          }

          var promoTitle = "";
          var promoDesc = "";
          if (slide.rightCard) {
            promoTitle = slide.rightCard.title || "";
            promoDesc = slide.rightCard.description || "";
          }

          return {
            mainImage: mainImageUrl,
            smallImage: smallImageUrl,
            overlayText: overlayText,
            promoTitle: promoTitle,
            promoDesc: promoDesc
          };
        });

        return mappedSlides;
      });
  }

  // =========================================================================
  // TRENDING PRODUCTS
  // =========================================================================

  function trendingGetUserId() {
    const direct = localStorage.getItem("userId");
    if (direct) return Number(direct);
    try { const u = JSON.parse(localStorage.getItem("user") || "{}"); if (u.id || u.userId) return Number(u.id || u.userId); } catch(_) {}
    try { const u = JSON.parse(localStorage.getItem("userData") || "{}"); if (u.id || u.userId) return Number(u.id || u.userId); } catch(_) {}
    return null;
  }

  function trendingAuthHeaders() {
    const token  = localStorage.getItem("authToken") || sessionStorage.getItem("authToken");
    const userId = trendingGetUserId();
    const h = { "Content-Type": "application/json" };
    if (token)  h["Authorization"] = `Bearer ${token}`;
    if (userId) h["X-User-Id"]     = String(userId);
    return h;
  }

  function trendingEsc(text) {
    if (!text) return "";
    const d = document.createElement("div");
    d.textContent = text;
    return d.innerHTML;
  }

  function trendingSlugify(text) {
    if (!text) return "product";
    return text.toString().toLowerCase().trim()
      .replace(/\s+/g, "-").replace(/[^\w\-]+/g, "")
      .replace(/\-\-+/g, "-").replace(/^-+/, "").replace(/-+$/, "");
  }

  function trendingSetHeart(btn, isWL) {
    if (!btn) return;
    const icon = btn.querySelector("i");
    if (!icon) return;
    icon.className = isWL ? "fa-solid fa-heart" : "fa-regular fa-heart";
    icon.style.color = isWL ? "#e39f32" : "#6b7280";
  }

  function trendingSyncHearts() {
    document.querySelectorAll(".trending-wl-btn[data-pid]").forEach(btn => {
      trendingSetHeart(btn, TRENDING_WISHLIST_SET.has(Number(btn.dataset.pid)));
    });
  }

  async function trendingLoadWishlist() {
    const userId = trendingGetUserId();
    if (!userId) return;
    try {
      const res  = await fetch(`${BASE_URL}/api/v1/wishlist?userId=${userId}`, { headers: trendingAuthHeaders() });
      if (!res.ok) return;
      const data = await res.json();
      if (!data.success || !Array.isArray(data.data)) return;
      data.data.forEach(wl => {
        (wl.items || []).forEach(item => {
          if (item.productId != null) TRENDING_WISHLIST_SET.add(Number(item.productId));
        });
      });
      trendingSyncHearts();
    } catch(err) {
      console.warn("[Trending] loadWishlist failed:", err.message);
    }
  }

  async function trendingToggleWishlist(btn) {
    const userId = trendingGetUserId();
    if (!userId) { showToast("Please log in to save items to your wishlist."); return; }
    const pid = Number(btn.dataset.pid);
    if (!pid || TRENDING_IN_FLIGHT.has(pid)) return;

    const wasWL = TRENDING_WISHLIST_SET.has(pid);
    const nowWL = !wasWL;
    nowWL ? TRENDING_WISHLIST_SET.add(pid) : TRENDING_WISHLIST_SET.delete(pid);
    trendingSetHeart(btn, nowWL);
    TRENDING_IN_FLIGHT.add(pid);

    try {
      if (nowWL) {
        const payload = {
          userId, wishlistName: "My Wishlist",
          productId: pid,
          variantId: btn.dataset.variantId || `VAR-${pid}`,
          sku: btn.dataset.sku || `PROD-${pid}`,
          selectedColor: btn.dataset.color || null,
          selectedSize: btn.dataset.size || null,
          titleName: btn.dataset.title || null,
          wishlistedPrice: Number(btn.dataset.price) || 0,
        };
        const res = await fetch(`${BASE_URL}/api/v1/wishlist/add`, { method: "POST", headers: trendingAuthHeaders(), body: JSON.stringify(payload) });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        showToast("Added to wishlist ♥");
      } else {
        const params = new URLSearchParams({ userId, productId: pid });
        if (btn.dataset.variantId) params.append("variantId", btn.dataset.variantId);
        const res = await fetch(`${BASE_URL}/api/v1/wishlist/remove?${params}`, { method: "DELETE", headers: trendingAuthHeaders() });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        showToast("Removed from wishlist");
      }
    } catch(err) {
      wasWL ? TRENDING_WISHLIST_SET.add(pid) : TRENDING_WISHLIST_SET.delete(pid);
      trendingSetHeart(btn, wasWL);
      showToast("Could not update wishlist. Please try again.");
    } finally {
      TRENDING_IN_FLIGHT.delete(pid);
    }
  }

  async function trendingAddToCart(btn) {
    const userId = trendingGetUserId();
    if (!userId) { showToast("Please log in to add items to cart."); return; }
    if (btn.dataset.adding === "true") return;
    btn.dataset.adding = "true";
    const orig = btn.innerHTML;
    btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin text-xs"></i> Adding…';
    btn.disabled  = true;
    const pid = Number(btn.dataset.pid);
    const payload = {
      userId,
      productId:     pid,
      variantId:     btn.dataset.variantId || `VAR-${pid}`,
      sku:           btn.dataset.sku       || `PROD-${pid}`,
      selectedColor: btn.dataset.color     || null,
      selectedSize:  btn.dataset.size      || null,
      titleName:     btn.dataset.title     || null,
      unitPrice:     Number(btn.dataset.price)    || 0,
      mrpPrice:      Number(btn.dataset.mrpPrice)  || 0,
      quantity: 1,
    };
    try {
      const res = await fetch(`${BASE_URL}/api/v1/cart/add`, { method: "POST", headers: trendingAuthHeaders(), body: JSON.stringify(payload) });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      showToast("Added to cart 🛒");
      
      TRENDING_ADDED_TO_CART.add(pid);
      saveAddedToCartState();

      btn.innerHTML          = '<i class="fa-solid fa-bag-shopping text-xs"></i> Go to Cart';
      btn.disabled           = false;
      btn.style.background   = "#e39f32";
      btn.style.color        = "#1D3C4A";
      btn.dataset.added      = "true";
    } catch(err) {
      showToast("Could not add to cart. Please try again.");
      btn.innerHTML      = orig;
      btn.disabled       = false;
    } finally {
      btn.dataset.adding = "false";
    }
  }

  function buildTrendingCard(p) {
    const pid      = Number(p.productPrimeId);
    const mrp      = p.currentMrpPrice     || 0;
    const selling  = p.currentSellingPrice || 0;
    const discount = mrp > 0 ? Math.round(((mrp - selling) / mrp) * 100) : 0;
    const isWL     = TRENDING_WISHLIST_SET.has(pid);
    const isOOS    = (p.currentStock != null && p.currentStock <= 0);
    const isAdded  = TRENDING_ADDED_TO_CART.has(pid);

    const imageUrl = p.mainImage
      ? (p.mainImage.startsWith("http") ? p.mainImage : `${BASE_URL}${p.mainImage}`)
      : "/Images/product_fallback/artezo_product_fallback_img.png";

    const resolvedVariantId = p.variantId  || `VAR-${pid}`;
    const resolvedSku       = p.currentSku || `PROD-${pid}`;

    let nameClean = (p.productName || "").toLowerCase().startsWith((p.brandName || "").toLowerCase())
      ? (p.productName || "").substring((p.brandName || "").length).trim()
      : (p.productName || "");
    const productUrl = `/products/product-detail.html?id=${pid}&sku=${resolvedSku}&brand=${trendingSlugify(p.brandName)}&category=${trendingSlugify(p.productCategory)}&product=${trendingSlugify(nameClean || p.productName)}`;

    return `
      <div class="w-[180px] sm:w-[200px] md:w-[230px] flex-shrink-0 ${isOOS ? "grayscale opacity-70" : ""}">
        <div class="bg-white rounded-xl overflow-hidden flex flex-col h-full transition hover:shadow-md">
          <div class="">

           <div class="trending-nav-img relative border border-gray-100 rounded-lg overflow-hidden bg-gray-50 cursor-pointer"
                data-href="${productUrl}">

              <img src="${imageUrl}"
                   class="w-full h-[140px] sm:h-[150px] md:h-[170px] object-cover"
                   alt="${trendingEsc(p.productName)}" loading="lazy"
                   onerror="this.src='/Images/product_fallback/artezo_product_fallback_img.png'"/>


              ${isOOS ? `<div class="absolute inset-0 flex items-center justify-center bg-black/30"><span class="bg-gray-800 text-white text-[10px] font-bold px-2 py-1 rounded-full">OUT OF STOCK</span></div>` : ""}
              
                            <button class="trending-wl-btn absolute top-2 right-2 w-7 h-7 sm:w-8 sm:h-8 bg-white rounded-full shadow flex items-center justify-center hover:scale-110 transition z-20 pointer-events-auto"
                data-pid="${pid}"
                data-variant-id="${trendingEsc(resolvedVariantId)}"
                data-sku="${trendingEsc(resolvedSku)}"
                data-color="${trendingEsc(p.selectedColor || "")}"
                data-size="${trendingEsc(p.selectedSize   || "")}"
                data-title="${trendingEsc(p.productName   || "")}"
                data-price="${selling}"
                title="${isWL ? "Remove from wishlist" : "Add to wishlist"}">
                <i class="${isWL ? "fa-solid fa-heart" : "fa-regular fa-heart"}" style="color:${isWL ? "#e39f32" : "#6b7280"};font-size:12px;"></i>
              </button>
            
            </div>
          </div>
          <div class="p-3 flex flex-col flex-grow justify-between">
            <div>
              <h3 class="text-xs sm:text-sm font-semibold text-[#1D3C4A] line-clamp-2 cursor-pointer hover:underline trending-nav-img"
    data-href="${productUrl}">${trendingEsc(p.productName)}</h3>

              <p class="text-[9px] sm:text-xs text-gray-500">${trendingEsc(p.productSubCategory || p.productCategory || "")}</p>
              <div class="flex items-center gap-2 mt-1 flex-wrap">
                <span class="text-[#1D3C4A] font-semibold text-xs sm:text-sm">₹${selling.toLocaleString("en-IN")}</span>
                ${mrp > selling ? `<span class="text-gray-400 line-through text-[9px] sm:text-xs">₹${mrp.toLocaleString("en-IN")}</span>` : ""}
                ${discount > 0 ? `<span class="text-green-600 text-[9px] sm:text-xs font-semibold">${discount}% OFF</span>` : ""}
              </div>
            </div>
            <button class="trending-cart-btn group mt-2 sm:mt-3 w-full bg-[#1D3C4A] text-white text-[10px] sm:text-sm py-1.5 sm:py-2 rounded-md hover:bg-[#E39F32] transition flex items-center justify-center gap-2"
              data-pid="${pid}"
              data-variant-id="${trendingEsc(resolvedVariantId)}"
              data-sku="${trendingEsc(resolvedSku)}"
              data-color="${trendingEsc(p.selectedColor || "")}"
              data-size="${trendingEsc(p.selectedSize   || "")}"
              data-title="${trendingEsc(p.productName   || "")}"
              data-price="${selling}"
              data-mrp-price="${mrp}"
              ${isOOS ? "disabled" : ""}>
              <i class="fa-solid fa-cart-shopping text-[#E39F32] group-hover:text-[#1D3C4A] transition text-[10px] sm:text-xs"></i>
              ${isAdded ? "Go to Cart" : (isOOS ? "Out of Stock" : "Add to Cart")}
            </button>
          </div>
        </div>
      </div>`;
  }

  function trendingSkeletonCard() {
    return `<div class="w-[180px] sm:w-[200px] md:w-[230px] flex-shrink-0"><div class="bg-white border border-gray-200 rounded-xl overflow-hidden"><div class="p-1"><div class="bg-gray-200 animate-pulse rounded-lg h-[140px] sm:h-[150px] md:h-[170px]"></div></div><div class="p-3 space-y-2"><div class="bg-gray-200 animate-pulse h-4 rounded w-3/4"></div><div class="bg-gray-200 animate-pulse h-3 rounded w-1/2"></div><div class="bg-gray-200 animate-pulse h-7 rounded w-full mt-2"></div></div></div></div>`;
  }

  function trendingInjectSkeletons() {
    ["trendingRow1", "trendingRow2"].forEach(id => {
      const inner = document.getElementById(id)?.querySelector(".flex.w-max");
      if (inner) inner.innerHTML = Array(5).fill(trendingSkeletonCard()).join("");
    });
  }

  // function trendingInjectCards(products) {
  //   const mid  = Math.ceil(products.length / 2);
  //   const row1 = products.slice(0, mid);
  //   const row2 = products.slice(mid);
  //   const inject = (id, prods) => {
  //     const inner = document.getElementById(id)?.querySelector(".flex.w-max");
  //     if (inner) inner.innerHTML = prods.map(buildTrendingCard).join("");
  //   };
  //   inject("trendingRow1", row1);
  //   inject("trendingRow2", row2);
  //   trendingSyncHearts();
  // }

    function trendingInjectCards(products) {
    if (!products || products.length === 0) {
      console.warn("[Trending] No products to render");
      return;
    }

    console.log(`[Trending] Total products received: ${products.length}`);

    // === SMART SPLIT LOGIC ===
    let row1Products = [];
    let row2Products = [];

    if (products.length <= 5) {
      // If few products → put ALL in Row 1 (better UX, no empty Row 2)
      row1Products = products;
      row2Products = [];
    } else {
      // If many products → split evenly
      const mid = Math.ceil(products.length / 2);
      row1Products = products.slice(0, mid);
      row2Products = products.slice(mid);
    }

    console.log(`[Trending] Row1: ${row1Products.length} | Row2: ${row2Products.length}`);

    const inject = (id, prods) => {
      const container = document.getElementById(id);
      if (!container) return;
      const inner = container.querySelector(".flex.w-max");
      if (inner) {
        inner.innerHTML = prods.map(buildTrendingCard).join("");
      }
    };

    inject("trendingRow1", row1Products);
    inject("trendingRow2", row2Products);

    // Hide Row 2 completely if empty
    const row2Section = document.getElementById("trendingRow2");
    if (row2Section) {
      row2Section.parentElement.style.display = row2Products.length > 0 ? "block" : "none";
    }

    trendingSyncHearts();
  }

  function wireTrendingDelegation() {
  ["trendingRow1", "trendingRow2"].forEach(id => {
    const row = document.getElementById(id);
    if (!row || row._trendingBound) return;
    row._trendingBound = true;

    row.addEventListener("click", function(e) {
      // Heart — must check first, before any navigation
      const heartBtn = e.target.closest(".trending-wl-btn");
      if (heartBtn) {
        e.stopImmediatePropagation();
        e.preventDefault();
        trendingToggleWishlist(heartBtn);
        return;
      }

      // Cart button
      const cartBtn = e.target.closest(".trending-cart-btn");
      if (cartBtn && !cartBtn.disabled) {
        e.stopImmediatePropagation();
        e.preventDefault();
        if (cartBtn.innerHTML.includes("Go to Cart") || cartBtn.dataset.added === "true") {
          window.location.href = "/Cart/cart.html";
          return;
        }
        trendingAddToCart(cartBtn);
        return;
      }

      // Image div or title — navigate via data-href (no inline onclick = no conflict)
      const navEl = e.target.closest(".trending-nav-img");
      if (navEl && navEl.dataset.href) {
        window.location.href = navEl.dataset.href;
      }
    });
  });
}

  async function fetchAndRenderTrending() {
    trendingInjectSkeletons();
    try {
      const res = await fetch(`${BASE_URL}/api/products/get-trending`, { headers: { "Content-Type": "application/json" } });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data     = await res.json();
      const products = data.content || [];
      if (!products.length) {
        ["trendingRow1","trendingRow2"].forEach(id => {
          const inner = document.getElementById(id)?.querySelector(".flex.w-max");
          if (inner) inner.innerHTML = `<p class="text-sm text-gray-400 px-4 py-6">No trending products at the moment.</p>`;
        });
        return;
      }
      trendingInjectCards(products);
      trendingLoadWishlist();
      console.info(`[Trending] ${products.length} product(s) loaded from API`);
    } catch(err) {
      console.warn("[Trending] API failed:", err.message);
      ["trendingRow1","trendingRow2"].forEach(id => {
        const inner = document.getElementById(id)?.querySelector(".flex.w-max");
        if (inner) inner.innerHTML = `<p class="text-sm text-gray-400 px-4 py-6">Could not load trending products.</p>`;
      });
    }
  }

  // ── Entry point ──────────────────────────────────────────────
  function init() {
    loadAddedToCartState();
    if (!window.artezoData) {
      console.warn("Waiting for data.js to load...");
      setTimeout(init, 50);
      return;
    }

    fetchBannerFromAPI("home")
      .then(function (apiSlides) {
        if (apiSlides && apiSlides.length > 0) {
          window.artezoData.bannerSlides = apiSlides;
          console.info("[Artezo] Banner loaded from API: " + apiSlides.length + " slide(s).");
        } else {
          console.info("[Artezo] Using default static banner slides from data.js.");
        }
      })
      .catch(function (err) {
        console.warn("[Artezo] Banner API fetch failed. Using default static banners. Error: " + err.message);
      })
      .finally(function () {
        renderApp();
        attachAllDynamicScripts();
      });
  }

  // ============================================================
  // renderApp() — FULL
  // ============================================================
  function renderApp() {
    const data = window.artezoData;
    const root = document.getElementById("app-root");
    if (!root) return;

    root.innerHTML = `
          <!-- Hero Section -->
          <section class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 relative">
            <div id="banner-slider" class="overflow-hidden relative rounded-2xl w-full">
              <div class="flex w-full transition-transform duration-700 ease-in-out" id="banner-slides-wrapper">
                ${data.bannerSlides
                  .map(
                    (slide, idx) => `
                  <div class="flex-none min-w-full w-full flex flex-col md:flex-row gap-4 md:gap-6">
                    <div class="w-full md:w-2/3 relative rounded-2xl border border-gray-300 overflow-hidden shadow-lg h-[220px] sm:h-[260px] md:h-[350px]">
                      <img src="${slide.mainImage}" class="w-full h-full object-cover" alt="banner" onerror="this.src=''" />
                      ${slide.overlayText ? `
                        <div class="absolute inset-0 bg-black/25 flex items-center justify-start p-4 sm:p-6 md:p-12">
                          <div class="text-white">
                            <h2 class="text-xl sm:text-2xl md:text-4xl lg:text-5xl font-zain font-bold">${slide.overlayText.title}</h2>
                            <p class="mt-2 md:mt-4 text-xs sm:text-sm md:text-lg font-lexend">${slide.overlayText.subtitle}</p>
                          </div>
                        </div>` : ""}
                    </div>
                    <div class="w-full md:w-1/3 flex flex-col gap-4 md:gap-2">
                      <div class="relative rounded-2xl overflow-hidden border border-gray-300 h-[160px] sm:h-[200px] md:h-[170px]">
                        <img src="${slide.smallImage}" class="w-full h-full object-cover" onerror="this.src=''" />
                      </div>
                      <div class="rounded-2xl border border-gray-300 p-4 sm:p-5 md:p-6 flex flex-col justify-center h-auto md:h-[170px]" style="background-color: #effffd; border-color: #e5e7eb">
                        <h3 class="flex items-center gap-2 font-lexend text-base sm:text-lg text-[#1D3C4A]">
                          <i class="fa-solid fa-tags text-[#e39f32]"></i>
                          ${slide.promoTitle}
                        </h3>
                        <p class="text-[#1D3C4A] mt-1 font-zain text-xs sm:text-sm">${slide.promoDesc}</p>
                      </div>
                    </div>
                  </div>
                `).join("")}
              </div>
              <div class="absolute bottom-3 sm:bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                ${data.bannerSlides.map((_, idx) => `<button class="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-white/50" data-slide="${idx}"></button>`).join("")}
              </div>
            </div>
          </section>

          <!-- Category Section -->
          <section class="pt-8 pb-6 bg-white">
            <div class="max-w-7xl mx-auto px-6">
              <div class="mb-12 text-center">
                <h2 class="text-4xl font-semibold font-zain text-[#1D3C4A]">Browse by Category</h2>
                <p class="text-gray-500 mt-2 font-lexend text-sm">Curated collections for every space</p>
              </div>
              <div class="grid grid-cols-2 md:grid-cols-4 gap-4 auto-rows-[140px] -mt-6">
                ${data.categories.map((cat) => `
                  <a href="${cat.link}" class="relative ${cat.spanClass} rounded-xl overflow-hidden group">
                    <img src="${cat.image}" class="w-full h-full object-cover transition duration-500 group-hover:scale-105" />
                    <div class="absolute inset-x-0 bottom-0 ${cat.gradientHeight} bg-gradient-to-t from-black to-transparent"></div>
                    <h3 class="absolute bottom-${cat.bottomOffset} left-4 text-white font-lexend ${cat.fontSize} font-semibold">${cat.name}</h3>
                  </a>
                `).join("")}
              </div>
            </div>
          </section>

          <!-- Discover Section -->
          <section class="py-12 px-3 sm:px-6 lg:px-8 bg-white">
            <div class="max-w-[1450px] mx-auto bg-teal-50 rounded-xl p-6 sm:p-8 -mt-6 md:-mt-4">
              <div class="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-6 gap-4">
                <div>
                  <h2 class="text-3xl md:text-4xl font-semibold text-[#1D3C4A] font-zain">${data.discover.title}</h2>
                  <p class="text-sm text-gray-500">${data.discover.subtitle}</p>
                </div>
                <button class="flex items-center gap-2 border border-gray-300 px-5 py-2.5 rounded-full text-sm hover:bg-white transition w-fit view-all-btn">
                  View All <i class="fa-solid fa-arrow-right text-xs"></i>
                </button>
              </div>
              <div class="relative">
                <button id="discoverPrevBtn" class="absolute -left-2 sm:-left-5 md:-left-6 top-1/2 -translate-y-1/2 bg-white shadow-lg p-3 rounded-full z-30 hover:scale-105 active:scale-95 transition flex items-center justify-center border border-gray-100">
                  <i class="fa-solid fa-chevron-left text-sm sm:text-base"></i>
                </button>
                <div id="discoverSlider" class="flex gap-4 sm:gap-6 overflow-x-auto scroll-smooth no-scrollbar pb-4 px-8 sm:px-12 md:px-10 snap-x snap-mandatory scrollbar-hide">
                  ${data.discover.products.map((prod) => `
                    <div class="min-w-[85%] sm:min-w-[47%] md:min-w-[31%] lg:min-w-[280px] xl:min-w-[300px] bg-white rounded-xl shadow-sm p-1 hover:shadow-md transition snap-start flex-shrink-0">
                      <div class="relative">
                        <img src="${prod.image}" class="rounded-lg h-[200px] sm:h-[220px] w-full object-cover" alt="${prod.title}" />
                        <button class="wishlist-btn absolute top-3 right-3 bg-white rounded-full w-9 h-9 flex items-center justify-center shadow hover:bg-gray-50 transition" data-product-id="${prod.id}">
                          <i class="fa-regular fa-heart text-gray-500 hover:text-red-500 transition"></i>
                        </button>
                      </div>
                      <div class="px-3 py-3">
                        <p class="text-sm text-gray-700 line-clamp-2 font-normal leading-tight">${prod.title}</p>
                        <div class="flex text-orange-400 text-sm mt-2">${prod.starsHtml}<span class="text-gray-500 ml-2 text-xs">(${prod.reviews})</span></div>
                        <div class="flex items-center gap-2 mt-2">
                          <span class="text-lg font-semibold text-[#1D3C4A]">${prod.price}</span>
                          <span class="text-sm line-through text-gray-400">${prod.originalPrice}</span>
                          <span class="text-green-600 text-sm font-medium">${prod.discount}</span>
                        </div>
                      </div>
                    </div>
                  `).join("")}
                </div>
                <button id="discoverNextBtn" class="absolute -right-2 sm:-right-5 md:-right-6 top-1/2 -translate-y-1/2 bg-white shadow-lg p-3 rounded-full z-30 hover:scale-105 active:scale-95 transition flex items-center justify-center border border-gray-100">
                  <i class="fa-solid fa-chevron-right text-sm sm:text-base"></i>
                </button>
              </div>
            </div>
          </section>

          <!-- DEAL SECTION -->
          <section class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 my-12 -mt-6">
            <div class="bg-[#efe3e1] rounded-lg p-6 sm:p-8">
              <div class="grid grid-cols-12 gap-6">
                <div class="col-span-12 lg:col-span-3 flex flex-col justify-center space-y-4">
                  <h2 class="text-3xl font-bold font-lexend text-[#1D3C4A] leading-snug">Exclusive Deals Across Categories</h2>
                  <p class="text-gray-500 text-sm">Shop now and save big!</p>
                  <div class="w-12 h-[2px] bg-gray-300"></div>
                  <p class="text-lg font-medium text-[#1D3C4A]">UPTO <span class="text-[#e39f32] font-semibold">60% OFF</span></p>
                </div>
                ${data.dealCategories.map((cat) => `
                  <div class="col-span-6 sm:col-span-4 lg:col-span-2 bg-white rounded-lg shadow-sm overflow-hidden">
                    <img src="${cat.image}" class="w-full h-44 object-cover" />
                    <div class="py-3 text-center text-sm font-medium">${cat.name}</div>
                  </div>
                `).join("")}
                ${data.dealCategoriesSecondRow.map((cat) => `
                  <div class="col-span-6 sm:col-span-6 lg:col-span-3 bg-white rounded-lg shadow-sm overflow-hidden">
                    <img src="${cat.image}" class="w-full h-44 object-cover" />
                    <div class="py-3 text-center text-sm font-medium">${cat.name}</div>
                  </div>
                `).join("")}
              </div>
            </div>
          </section>

          <!-- Top Rated Section -->
          <section class="top-rated-section py-8 bg-gray-50">
            <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div class="flex items-center justify-between mb-6">
                <div>
                  <h2 class="text-2xl sm:text-3xl font-semibold text-[#1D3C4A] font-zain">Best Sellers</h2>
                  <p class="text-gray-500 text-sm">Our most loved pieces chosen by customers</p>
                </div>
                <button class="border border-gray-300 px-5 py-2 rounded-full text-xs sm:text-sm hover:bg-white transition view-all-btn flex items-center gap-2">
                  View All <span class="text-base leading-none">→</span>
                </button>
              </div>
              <div class="relative">
                <button id="topRatedPrevBtn" class="absolute -left-2 sm:-left-5 md:-left-6 top-1/2 -translate-y-1/2 bg-white shadow-lg p-3 rounded-full z-30 hover:scale-105 active:scale-95 transition flex items-center justify-center border border-gray-100">
                  <i class="fa-solid fa-chevron-left text-sm sm:text-base"></i>
                </button>
                <div id="topRatedSlider" class="flex gap-4 sm:gap-6 overflow-x-auto scroll-smooth no-scrollbar pb-4 px-10 sm:px-14 md:px-12 snap-x snap-mandatory scrollbar-hide">
                  ${data.topRated.map((prod) => `
                    <div class="relative min-w-[86%] sm:min-w-[48%] md:min-w-[32%] lg:min-w-[260px] xl:min-w-[280px] bg-white rounded-xl shadow-sm hover:shadow-md transition flex-shrink-0 snap-start">
                      <button class="wishlist-btn absolute top-3 right-3 bg-white/90 backdrop-blur rounded-full w-9 h-9 flex items-center justify-center shadow-md hover:scale-110 transition z-20" data-product-id="${prod.id}">
                        <i class="fa-regular fa-heart text-gray-500"></i>
                      </button>
                      <!-- <div class="">
                        <div class="border border-gray-200 rounded-xl overflow-hidden h-[200px] sm:h-[210px] bg-gray-100">
                          <img src="${prod.image}" class="w-full h-full object-cover" alt="${prod.title}" />
                        </div>
                      </div> -->
                      <div class="px-3 pb-4 pt-2">
                        <h3 class="text-sm text-gray-700 line-clamp-2 font-medium leading-tight">${prod.title}</h3>
                        <div class="flex text-orange-500 text-sm mt-2">${prod.starsHtml}<span class="text-gray-400 ml-1.5">(${prod.reviews})</span></div>
                        <div class="flex items-center gap-2 mt-2">
                          <span class="font-semibold text-lg text-[#1D3C4A]">${prod.price}</span>
                          <span class="text-gray-400 line-through text-sm">${prod.originalPrice}</span>
                          <span class="text-green-600 text-sm font-medium">${prod.discount}</span>
                        </div>
                      </div>
                    </div>
                  `).join("")}
                </div>
                <button id="topRatedNextBtn" class="absolute -right-2 sm:-right-5 md:-right-6 top-1/2 -translate-y-1/2 bg-white shadow-lg p-3 rounded-full z-30 hover:scale-105 active:scale-95 transition flex items-center justify-center border border-gray-100">
                  <i class="fa-solid fa-chevron-right text-sm sm:text-base"></i>
                </button>
              </div>
            </div>
          </section>

          <!-- Corporate Banner -->
          <section class="py-8 px-4 sm:px-6 lg:px-8">
            <div class="max-w-7xl mx-auto">
              <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                ${data.corporateBanners.map((banner) => `
                  <a href="${banner.link}" class="relative block overflow-hidden rounded-2xl group">
                    <img src="${banner.image}" alt="${banner.title}" class="w-full h-[220px] sm:h-[260px] md:h-[280px] lg:h-[300px] object-cover transition duration-500 group-hover:scale-105" />
                    ${banner.showText ? `<div class="absolute top-6 left-6 text-[#1D3C4A]" style="text-shadow: 0 2px 6px rgba(0,0,0,0.5)"><h3 class="text-xl sm:text-2xl md:text-2xl lg:text-3xl font-lexend font-semibold">${banner.title}</h3><p class="text-sm sm:text-base md:text-base lg:text-base font-lexend mt-1 max-w-xs">${banner.subtitle}</p></div>` : ""}
                  </a>
                `).join("")}
              </div>
            </div>
          </section>

          <!-- Trending Products Section -->
          <section class="py-10 bg-gray-50">
            <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-10">
              <div class="flex items-center gap-4">
                <div class="w-1 h-10 bg-[#E39F32] rounded"></div>
                <div>
                  <h2 class="text-3xl sm:text-4xl font-zain font-extrabold text-[#1D3C4A]">Trending Products</h2>
                  <p class="text-sm text-gray-500">Popular picks customers love the most</p>
                </div>
              </div>
            </div>

            <!-- ROW - 1 -->
            <div class="relative max-w-7xl mx-auto">
              <button onclick="scrollRow('trendingRow1', -1)" class="absolute left-2 sm:-left-3 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-white shadow border flex items-center justify-center hover:bg-[#1D3C4A] hover:text-white transition">
                <i class="fa-solid fa-chevron-left"></i>
              </button>
              <button onclick="scrollRow('trendingRow1', 1)" class="absolute right-2 sm:-right-3 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-white shadow border flex items-center justify-center hover:bg-[#1D3C4A] hover:text-white transition">
                <i class="fa-solid fa-chevron-right"></i>
              </button>
              <div id="trendingRow1" class="overflow-x-auto scroll-smooth scrollbar-hide">
                <div class="flex gap-4 sm:gap-6 w-max p-3 sm:px-6"></div>
              </div>
            </div>
            
            <!-- ROW 2 (only show when needed) -->
            <div id="trendingRow2Container" class="relative max-w-7xl mx-auto mt-8">
              <button onclick="scrollRow('trendingRow2', -1)" class="absolute left-2 sm:-left-3 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-white shadow border flex items-center justify-center hover:bg-[#1D3C4A] hover:text-white transition">
                <i class="fa-solid fa-chevron-left"></i>
              </button>
              <button onclick="scrollRow('trendingRow2', 1)" class="absolute right-2 sm:-right-3 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-white shadow border flex items-center justify-center hover:bg-[#1D3C4A] hover:text-white transition">
                <i class="fa-solid fa-chevron-right"></i>
              </button>
              <div id="trendingRow2" class="overflow-x-auto scroll-smooth scrollbar-hide">
                <div class="flex gap-4 sm:gap-6 w-max px-4 sm:px-6"></div>
              </div>
            </div>
            
          </section>

          <!-- Services Section -->
          <section class="py-6 sm:py-8 md:py-10 px-4 sm:px-6 lg:px-8 mt-2 sm:mt-4 md:mt-6 bg-[url('./Images/servicebg.jfif')] bg-cover bg-center bg-no-repeat bg-fixed">
            <div class="max-w-7xl mx-auto">
              <div class="rounded-2xl sm:rounded-3xl bg-white/85 backdrop-blur-md shadow-md sm:shadow-lg px-4 sm:px-6 lg:px-8 py-5 sm:py-6 md:py-7">
                <div class="grid grid-cols-1 md:grid-cols-4 gap-4 sm:gap-5 lg:gap-6">
                  ${data.services.map((service) => `
                    <div class="flex items-center gap-3 sm:gap-4 px-3 sm:px-4 py-3 sm:py-4 border-b md:border-b-0 md:border-r border-[#1D3C4A]/30 group transition hover:scale-[1.02]">
                      <div class="flex-shrink-0 w-11 h-11 sm:w-12 sm:h-12 bg-[#e8f4f7] text-[#1D3C4A] rounded-xl flex items-center justify-center text-xl sm:text-2xl group-hover:bg-[#1D3C4A] group-hover:text-white transition-colors duration-200">
                        <i class="${service.icon}"></i>
                      </div>
                      <div>
                        <p class="text-sm sm:text-base font-semibold text-[#1D3C4A]">${service.title}</p>
                        <p class="text-xs sm:text-sm text-gray-600">${service.desc}</p>
                      </div>
                    </div>
                  `).join("")}
                </div>
              </div>
            </div>
          </section>

          <!-- Photo Frames Section -->
          <section class="py-6 sm:py-7 md:py-8 px-3 sm:px-5 lg:px-8 mt-1">
            <div class="mx-auto max-w-[1450px] w-full bg-gradient-to-br from-teal-50 via-white to-teal-100 rounded-lg sm:rounded-lg border border-teal-100/70 shadow-sm sm:shadow p-2 sm:p-5 md:p-6 lg:p-7">
              <div class="mb-3 sm:mb-4 md:mb-5">
                <h2 class="text-xl sm:text-2xl md:text-3xl lg:text-3.5xl font-semibold font-zain text-[#1D3C4A] tracking-tight">Photo <span class="text-[#e39f32]">Frames</span></h2>
                <p class="text-gray-600 text-xs sm:text-sm mt-1">Capture and frame your beautiful memories</p>
              </div>
              <div class="relative group">
                <button id="pfLeft" class="flex absolute -left-2 xs:-left-3 sm:-left-4 top-1/2 -translate-y-1/2 z-20 w-8 h-8 xs:w-9 xs:h-9 sm:w-10 sm:h-10 bg-white/95 backdrop-blur-sm border border-gray-200 rounded-full shadow-md items-center justify-center text-gray-700 hover:text-white hover:bg-[#1D3C4A] transition-all duration-200 opacity-70 hover:opacity-100 active:scale-95 -translate-x-1/2 sm:translate-x-0">
                  <i class="fa-solid fa-chevron-left text-base sm:text-lg"></i>
                </button>
                <div id="photoFramesContainer" class="flex gap-3 xs:gap-4 sm:gap-5 md:gap-6 overflow-x-auto pb-4 sm:pb-5 scroll-smooth snap-x snap-mandatory scrollbar-hide -mx-1 xs:-mx-2 sm:-mx-0 px-1 xs:px-2 sm:px-0">
                  ${data.photoFrames.map((frame) => `
                    <div class="flex-none min-w-[160px] xs:min-w-[170px] sm:min-w-[190px] md:min-w-[210px] lg:min-w-[225px] max-w-[180px] xs:max-w-[195px] sm:max-w-[220px] md:max-w-[240px] bg-white border border-gray-200/80 rounded-xl sm:rounded-2xl shadow-sm hover:shadow-md transition-all duration-200 snap-start">
                      <div class="relative aspect-[4/3] overflow-hidden rounded-t-xl bg-gray-50">
                        <img src="${frame.image}" class="w-full h-full object-cover transition-transform duration-500 hover:scale-105" loading="lazy" />
                        <button class="absolute top-2 right-2 w-7 h-7 sm:w-8 sm:h-8 bg-white/90 backdrop-blur-sm rounded-full shadow flex items-center justify-center text-gray-600 hover:text-red-500">
                          <i class="fa-regular fa-heart text-sm sm:text-base"></i>
                        </button>
                      </div>
                      <div class="p-2.5 sm:p-3">
                        <p class="text-[9px] xs:text-[10px] sm:text-xs text-gray-500 uppercase font-medium mb-1">${frame.category}</p>
                        <h3 class="text-xs sm:text-sm md:text-base font-medium text-[#1D3C4A] mb-1.5 sm:mb-2 line-clamp-2 min-h-[2.6em]">${frame.title}</h3>
                        <div class="flex items-center gap-2 flex-wrap">
                          <span class="text-sm sm:text-base md:text-lg font-bold text-[#1D3C4A]">${frame.price}</span>
                          <span class="text-xs sm:text-sm text-gray-500 line-through">${frame.originalPrice}</span>
                          <span class="text-xs sm:text-sm text-green-600 font-semibold">${frame.discount}% OFF</span>
                        </div>
                      </div>
                    </div>
                  `).join("")}
                </div>
                <button id="pfRight" class="flex absolute -right-2 xs:-right-3 sm:-right-4 top-1/2 -translate-y-1/2 z-20 w-8 h-8 xs:w-9 xs:h-9 sm:w-10 sm:h-10 bg-white/95 backdrop-blur-sm border border-gray-200 rounded-full shadow-md items-center justify-center text-gray-700 hover:text-white hover:bg-[#1D3C4A] transition-all duration-200 opacity-70 hover:opacity-100 active:scale-95 translate-x-1/2 sm:translate-x-0">
                  <i class="fa-solid fa-chevron-right text-base sm:text-lg"></i>
                </button>
              </div>
            </div>
          </section>

          <!-- DEALS BANNER -->
          <section class="mb-4 py-6 px-4 sm:px-6 lg:px-8">
            <div class="max-w-7xl mx-auto">
              <a href="/deals" class="block mb-4 sm:mb-6 lg:mb-8">
                <div class="w-full rounded-lg overflow-hidden">
                  <img src="${data.dealsBannerImage}" alt="Deals Banner" class="w-full h-auto object-cover object-center transition-transform duration-500 hover:scale-105">
                </div>
              </a>
            </div>
          </section>
        `;
  }

  // ============================================================
  // attachAllDynamicScripts
  // ============================================================
  function attachAllDynamicScripts() {
    // Banner slider
    const sliderWrapper = document.querySelector("#banner-slider");
    const slider = document.querySelector("#banner-slides-wrapper");
    const slides = document.querySelectorAll("#banner-slides-wrapper > div");
    const dots = document.querySelectorAll("#banner-slider [data-slide]");
    let currentSlide = 0, slideInterval;

    function goToSlide(index) {
      if (slider) {
        slider.style.transform = `translateX(-${index * 100}%)`;
        dots.forEach(dot => dot.classList.remove("bg-white"));
        if (dots[index]) dots[index].classList.add("bg-white");
        currentSlide = index;
      }
    }
    function startSlider() {
      if (slideInterval) clearInterval(slideInterval);
      slideInterval = setInterval(() => {
        let next = (currentSlide + 1) % slides.length;
        goToSlide(next);
      }, 3000);
    }
    function stopSlider() {
      clearInterval(slideInterval);
    }

    if (sliderWrapper) {
      sliderWrapper.addEventListener("mouseenter", stopSlider);
      sliderWrapper.addEventListener("mouseleave", startSlider);
    }
    if (slides.length) {
      goToSlide(0);
      startSlider();
    }
    dots.forEach(dot => dot.addEventListener("click", () => {
      let idx = parseInt(dot.dataset.slide);
      if (!isNaN(idx)) goToSlide(idx);
    }));

    // Discover slider
    const discoverSlider = document.getElementById("discoverSlider");
    const discPrev = document.getElementById("discoverPrevBtn");
    const discNext = document.getElementById("discoverNextBtn");
    if (discoverSlider && discPrev && discNext) {
      discPrev.onclick = () => discoverSlider.scrollBy({ left: -320, behavior: "smooth" });
      discNext.onclick = () => discoverSlider.scrollBy({ left: 320, behavior: "smooth" });
    }

    // Top Rated slider
    const topSlider = document.getElementById("topRatedSlider");
    const topPrev = document.getElementById("topRatedPrevBtn");
    const topNext = document.getElementById("topRatedNextBtn");
    if (topSlider && topPrev && topNext) {
      const scrollAmount = 284;
      topNext.onclick = () => topSlider.scrollBy({ left: scrollAmount, behavior: "smooth" });
      topPrev.onclick = () => topSlider.scrollBy({ left: -scrollAmount, behavior: "smooth" });
    }

    // Photo frames
    const pfContainer = document.getElementById("photoFramesContainer");
    const pfLeft = document.getElementById("pfLeft");
    const pfRight = document.getElementById("pfRight");
    if (pfContainer && pfLeft && pfRight) {
      pfLeft.onclick = () => pfContainer.scrollBy({ left: -220, behavior: "smooth" });
      pfRight.onclick = () => pfContainer.scrollBy({ left: 220, behavior: "smooth" });
    }

    // Trending scroll
    window.scrollRow = function (row, dir) {
      const cont = document.getElementById(row);
      if (cont) cont.scrollBy({ left: dir * 350, behavior: "smooth" });
    };

    wireTrendingDelegation();
    fetchAndRenderTrending();
  }

  init();
})();























// (function () {
//   // ============================================================
//   // BANNER API INTEGRATION
//   // ============================================================

//   var BASE_URL = "http://localhost:8085"; 
  
//   // ── Trending patch state ───────────────────────────────────────────────────
//   const TRENDING_WISHLIST_SET = new Set(); // Set<productId> — in-memory wishlist state
//   const TRENDING_IN_FLIGHT    = new Set(); // debounce guard — blocks double-tap

//   function fetchBannerFromAPI(pageName) {
//     return fetch(BASE_URL + "/api/banners/get-banner-by-name/" + pageName)
//       .then(function (res) {
//         if (!res.ok) {
//           throw new Error("Banner API responded with status " + res.status);
//         }
//         return res.json();
//       })
//       .then(function (json) {
//         // Backend wraps response in { data: BannerResponseDto, ... }
//         var bannerData = json && json.data ? json.data : null;

//         // If no banner data or no slides → return null so fallback is used
//         if (
//           !bannerData ||
//           !bannerData.slides ||
//           bannerData.slides.length === 0
//         ) {
//           console.warn(
//             "[Artezo] No banner slides returned from API. Using default static banners."
//           );
//           return null;
//         }

//         var pageId = bannerData.id;

//         var mappedSlides = bannerData.slides.map(function (slide) {
//           var slideId = slide.id;

//           // Try to get image URLs directly from the slide data first
//           var mainImageUrl = "";
//           var smallImageUrl = "";
          
//           // Check for main image in various possible locations
//           if (slide.leftMain && slide.leftMain.imageUrl) {
//             mainImageUrl = slide.leftMain.imageUrl;
//           } else if (slide.leftMain && slide.leftMain.image) {
//             mainImageUrl = slide.leftMain.image;
//           } else if (slide.mainImageUrl) {
//             mainImageUrl = slide.mainImageUrl;
//           } else if (slide.mainImage) {
//             mainImageUrl = slide.mainImage;
//           } else {
//             // Fallback to the endpoint URL
//             mainImageUrl = BASE_URL + "/api/banners/get-left-main-image/" + pageId + "/" + slideId;
//           }
          
//           // Check for small image in various possible locations
//           if (slide.rightTop && slide.rightTop.imageUrl) {
//             smallImageUrl = slide.rightTop.imageUrl;
//           } else if (slide.rightTop && slide.rightTop.image) {
//             smallImageUrl = slide.rightTop.image;
//           } else if (slide.smallImageUrl) {
//             smallImageUrl = slide.smallImageUrl;
//           } else if (slide.smallImage) {
//             smallImageUrl = slide.smallImage;
//           } else {
//             // Fallback to the endpoint URL
//             smallImageUrl = BASE_URL + "/api/banners/get-right-top-image/" + pageId + "/" + slideId;
//           }
          
//           // Ensure URLs are absolute if they start with /
//           if (mainImageUrl && mainImageUrl.startsWith('/') && BASE_URL) {
//             mainImageUrl = BASE_URL + mainImageUrl;
//           }
//           if (smallImageUrl && smallImageUrl.startsWith('/') && BASE_URL) {
//             smallImageUrl = BASE_URL + smallImageUrl;
//           }

//           // overlayText: use leftMain title as the heading if present
//           var overlayText = null;
//           if (slide.leftMain && slide.leftMain.title) {
//             overlayText = {
//               title: slide.leftMain.title,
//               subtitle: slide.leftMain.subtitle || ""
//             };
//           }

//           // promoTitle / promoDesc come from rightCard
//           var promoTitle = "";
//           var promoDesc = "";
          
//           if (slide.rightCard) {
//             promoTitle = slide.rightCard.title || "";
//             promoDesc = slide.rightCard.description || "";
//           }

//           console.log("[Artezo] Slide " + slideId + " mainImage:", mainImageUrl);
//           console.log("[Artezo] Slide " + slideId + " smallImage:", smallImageUrl);

//           return {
//             mainImage: mainImageUrl,
//             smallImage: smallImageUrl,
//             overlayText: overlayText,
//             promoTitle: promoTitle,
//             promoDesc: promoDesc
//           };
//         });

//         return mappedSlides;
//       });
//   }



//   // =========================================================================
//   // TRENDING PRODUCTS — API fetch + wishlist + cart
//   // =========================================================================

//   // Resolve userId from localStorage (matches existing pattern in codebase)
//   function trendingGetUserId() {
//     const direct = localStorage.getItem("userId");
//     if (direct) return Number(direct);
//     try { const u = JSON.parse(localStorage.getItem("user") || "{}"); if (u.id || u.userId) return Number(u.id || u.userId); } catch(_) {}
//     try { const u = JSON.parse(localStorage.getItem("userData") || "{}"); if (u.id || u.userId) return Number(u.id || u.userId); } catch(_) {}
//     return null;
//   }

//   // Auth headers — JWT + X-User-Id (required by Spring Security filter)
//   function trendingAuthHeaders() {
//     const token  = localStorage.getItem("authToken") || sessionStorage.getItem("authToken");
//     const userId = trendingGetUserId();
//     const h = { "Content-Type": "application/json" };
//     if (token)  h["Authorization"] = `Bearer ${token}`;
//     if (userId) h["X-User-Id"]     = String(userId);
//     return h;
//   }

//   // Escape HTML — prevents XSS from server strings
//   function trendingEsc(text) {
//     if (!text) return "";
//     const d = document.createElement("div");
//     d.textContent = text;
//     return d.innerHTML;
//   }

//   // Slugify — SEO product URLs (matches homecategory.js pattern)
//   function trendingSlugify(text) {
//     if (!text) return "product";
//     return text.toString().toLowerCase().trim()
//       .replace(/\s+/g, "-").replace(/[^\w\-]+/g, "")
//       .replace(/\-\-+/g, "-").replace(/^-+/, "").replace(/-+$/, "");
//   }

//   // Set heart icon state — filled gold or outline grey
//   function trendingSetHeart(btn, isWL) {
//     if (!btn) return;
//     const icon = btn.querySelector("i");
//     if (!icon) return;
//     icon.className = isWL ? "fa-solid fa-heart" : "fa-regular fa-heart";
//     icon.style.color = isWL ? "#e39f32" : "#6b7280";
//     btn.title = isWL ? "Remove from wishlist" : "Add to wishlist";
//   }

//   // Sync all trending heart buttons to current TRENDING_WISHLIST_SET
//   function trendingSyncHearts() {
//     document.querySelectorAll(".trending-wl-btn[data-pid]").forEach(btn => {
//       trendingSetHeart(btn, TRENDING_WISHLIST_SET.has(Number(btn.dataset.pid)));
//     });
//   }

//   // Load wishlist once — populate Set — sync hearts after render
//   async function trendingLoadWishlist() {
//     const userId = trendingGetUserId();
//     if (!userId) return;
//     try {
//       const res  = await fetch(`${BASE_URL}/api/v1/wishlist?userId=${userId}`, { headers: trendingAuthHeaders() });
//       if (!res.ok) return;
//       const data = await res.json();
//       if (!data.success || !Array.isArray(data.data)) return;
//       data.data.forEach(wl => {
//         (wl.items || []).forEach(item => {
//           if (item.productId != null) TRENDING_WISHLIST_SET.add(Number(item.productId));
//         });
//       });
//       trendingSyncHearts();
//     } catch(err) {
//       console.warn("[Trending] loadWishlist failed (non-fatal):", err.message);
//     }
//   }

//   // Toggle wishlist — optimistic UI + rollback on failure
//   async function trendingToggleWishlist(btn) {
//     const userId = trendingGetUserId();
//     if (!userId) { showToast("Please log in to save items to your wishlist."); return; }
//     const pid = Number(btn.dataset.pid);
//     if (!pid || TRENDING_IN_FLIGHT.has(pid)) return;

//     const wasWL = TRENDING_WISHLIST_SET.has(pid);
//     const nowWL = !wasWL;
//     nowWL ? TRENDING_WISHLIST_SET.add(pid) : TRENDING_WISHLIST_SET.delete(pid);
//     trendingSetHeart(btn, nowWL);
//     TRENDING_IN_FLIGHT.add(pid);

//     try {
//       if (nowWL) {
//         const payload = {
//           userId, wishlistName: "My Wishlist",
//           productId: pid,
//           variantId:       btn.dataset.variantId || `VAR-${pid}`,
//           sku:             btn.dataset.sku        || `PROD-${pid}`,
//           selectedColor:   btn.dataset.color      || null,
//           selectedSize:    btn.dataset.size        || null,
//           titleName:       btn.dataset.title       || null,
//           wishlistedPrice: Number(btn.dataset.price) || 0,
//           customFieldsJson: null,
//         };
//         const res = await fetch(`${BASE_URL}/api/v1/wishlist/add`, { method: "POST", headers: trendingAuthHeaders(), body: JSON.stringify(payload) });
//         if (!res.ok) throw new Error(`HTTP ${res.status}`);
//         showToast("Added to wishlist ♥");
//       } else {
//         const params = new URLSearchParams({ userId, productId: pid });
//         if (btn.dataset.variantId) params.append("variantId", btn.dataset.variantId);
//         const res = await fetch(`${BASE_URL}/api/v1/wishlist/remove?${params}`, { method: "DELETE", headers: trendingAuthHeaders() });
//         if (!res.ok) throw new Error(`HTTP ${res.status}`);
//         showToast("Removed from wishlist");
//       }
//     } catch(err) {
//       wasWL ? TRENDING_WISHLIST_SET.add(pid) : TRENDING_WISHLIST_SET.delete(pid);
//       trendingSetHeart(btn, wasWL);
//       showToast("Could not update wishlist. Please try again.");
//     } finally {
//       TRENDING_IN_FLIGHT.delete(pid);
//     }
//   }

//   // Add to cart — on success flip btn to "Go to Cart"
//   async function trendingAddToCart(btn) {
//     const userId = trendingGetUserId();
//     if (!userId) { showToast("Please log in to add items to cart."); return; }
//     if (btn.dataset.adding === "true") return;
//     btn.dataset.adding = "true";
//     const orig = btn.innerHTML;
//     btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin text-xs"></i> Adding…';
//     btn.disabled  = true;
//     const pid = Number(btn.dataset.pid);
//     const payload = {
//       userId, sessionId: null,
//       productId:     pid,
//       variantId:     btn.dataset.variantId || `VAR-${pid}`,
//       sku:           btn.dataset.sku       || `PROD-${pid}`,
//       selectedColor: btn.dataset.color     || null,
//       selectedSize:  btn.dataset.size      || null,
//       titleName:     btn.dataset.title     || null,
//       unitPrice:     Number(btn.dataset.price)    || 0,
//       mrpPrice:      Number(btn.dataset.mrpPrice)  || 0,
//       quantity: 1, customFieldsJson: null,
//     };
//     try {
//       const res = await fetch(`${BASE_URL}/api/v1/cart/add`, { method: "POST", headers: trendingAuthHeaders(), body: JSON.stringify(payload) });
//       if (!res.ok) throw new Error(`HTTP ${res.status}`);
//       showToast("Added to cart 🛒");
//       btn.innerHTML          = '<i class="fa-solid fa-bag-shopping text-xs"></i> Go to Cart';
//       btn.disabled           = false;
//       btn.style.background   = "#e39f32";
//       btn.style.color        = "#1D3C4A";
//       btn.dataset.adding     = "false";
//       btn.dataset.added      = "true";
//     } catch(err) {
//       showToast("Could not add to cart. Please try again.");
//       btn.innerHTML      = orig;
//       btn.disabled       = false;
//       btn.dataset.adding = "false";
//     }
//   }

//   // Build card HTML — exact same visual as renderTrendingCard, live API data
//   function buildTrendingCard(p) {
//     const pid      = Number(p.productPrimeId);
//     const mrp      = p.currentMrpPrice     || 0;
//     const selling  = p.currentSellingPrice || 0;
//     const discount = mrp > 0 ? Math.round(((mrp - selling) / mrp) * 100) : 0;
//     const isWL     = TRENDING_WISHLIST_SET.has(pid);
//     const isOOS    = (p.currentStock != null && p.currentStock <= 0);

//     const imageUrl = p.mainImage
//       ? (p.mainImage.startsWith("http") ? p.mainImage : `${BASE_URL}${p.mainImage}`)
//       : "/Images/product_fallback/artezo_product_fallback_img.png";

//     const resolvedVariantId = p.variantId  || `VAR-${pid}`;
//     const resolvedSku       = p.currentSku || `PROD-${pid}`;

//     let nameClean = (p.productName || "").toLowerCase().startsWith((p.brandName || "").toLowerCase())
//       ? (p.productName || "").substring((p.brandName || "").length).trim()
//       : (p.productName || "");
//     const productUrl = `/products/product-detail.html?id=${pid}&sku=${resolvedSku}&brand=${trendingSlugify(p.brandName)}&category=${trendingSlugify(p.productCategory)}&product=${trendingSlugify(nameClean || p.productName)}`;

//     return `
//       <div class="w-[180px] sm:w-[200px] md:w-[230px] flex-shrink-0 ${isOOS ? "grayscale opacity-70" : ""}">
//         <div class="bg-white border border-gray-200 rounded-xl overflow-hidden flex flex-col h-full transition hover:shadow-md">
//           <div class="p-1">
//             <div class="relative border border-gray-100 rounded-lg overflow-hidden bg-gray-50 cursor-pointer"
//                  onclick="window.location.href='${productUrl}'">
//               <img src="${imageUrl}"
//                    class="w-full h-[140px] sm:h-[150px] md:h-[170px] object-cover"
//                    alt="${trendingEsc(p.productName)}" loading="lazy"
//                    onerror="this.src='/Images/product_fallback/artezo_product_fallback_img.png'"/>
//               ${isOOS ? `<div class="absolute inset-0 flex items-center justify-center bg-black/30"><span class="bg-gray-800 text-white text-[10px] font-bold px-2 py-1 rounded-full">OUT OF STOCK</span></div>` : ""}
//               <button class="trending-wl-btn absolute top-2 right-2 w-7 h-7 sm:w-8 sm:h-8 bg-white rounded-full shadow flex items-center justify-center hover:scale-110 transition z-10"
//                 data-pid="${pid}"
//                 data-variant-id="${trendingEsc(resolvedVariantId)}"
//                 data-sku="${trendingEsc(resolvedSku)}"
//                 data-color="${trendingEsc(p.selectedColor || "")}"
//                 data-size="${trendingEsc(p.selectedSize   || "")}"
//                 data-title="${trendingEsc(p.productName   || "")}"
//                 data-price="${selling}"
//                 title="${isWL ? "Remove from wishlist" : "Add to wishlist"}">
//                 <i class="${isWL ? "fa-solid fa-heart" : "fa-regular fa-heart"}" style="color:${isWL ? "#e39f32" : "#6b7280"};font-size:12px;"></i>
//               </button>
//             </div>
//           </div>
//           <div class="p-3 flex flex-col flex-grow justify-between">
//             <div>
//               <h3 class="text-xs sm:text-sm font-semibold text-[#1D3C4A] line-clamp-2 cursor-pointer hover:underline"
//                   onclick="window.location.href='${productUrl}'">${trendingEsc(p.productName)}</h3>
//               <p class="text-[9px] sm:text-xs text-gray-500">${trendingEsc(p.productSubCategory || p.productCategory || "")}</p>
//               <div class="flex items-center gap-2 mt-1 flex-wrap">
//                 <span class="text-[#1D3C4A] font-semibold text-xs sm:text-sm">₹${selling.toLocaleString("en-IN")}</span>
//                 ${mrp > selling ? `<span class="text-gray-400 line-through text-[9px] sm:text-xs">₹${mrp.toLocaleString("en-IN")}</span>` : ""}
//                 ${discount > 0 ? `<span class="text-green-600 text-[9px] sm:text-xs font-semibold">${discount}% OFF</span>` : ""}
//               </div>
//             </div>
//             <button class="trending-cart-btn group mt-2 sm:mt-3 w-full bg-[#1D3C4A] text-white text-[10px] sm:text-sm py-1.5 sm:py-2 rounded-md hover:bg-[#E39F32] transition flex items-center justify-center gap-2"
//               data-pid="${pid}"
//               data-variant-id="${trendingEsc(resolvedVariantId)}"
//               data-sku="${trendingEsc(resolvedSku)}"
//               data-color="${trendingEsc(p.selectedColor || "")}"
//               data-size="${trendingEsc(p.selectedSize   || "")}"
//               data-title="${trendingEsc(p.productName   || "")}"
//               data-price="${selling}"
//               data-mrp-price="${mrp}"
//               ${isOOS ? "disabled" : ""}>
//               <i class="fa-solid fa-cart-shopping text-[#E39F32] group-hover:text-[#1D3C4A] transition text-[10px] sm:text-xs"></i>
//               ${isOOS ? "Out of Stock" : "Add to Cart"}
//             </button>
//           </div>
//         </div>
//       </div>`;
//   }

//   // Skeleton card shown while API loads
//   function trendingSkeletonCard() {
//     return `<div class="w-[180px] sm:w-[200px] md:w-[230px] flex-shrink-0"><div class="bg-white border border-gray-200 rounded-xl overflow-hidden"><div class="p-1"><div class="bg-gray-200 animate-pulse rounded-lg h-[140px] sm:h-[150px] md:h-[170px]"></div></div><div class="p-3 space-y-2"><div class="bg-gray-200 animate-pulse h-4 rounded w-3/4"></div><div class="bg-gray-200 animate-pulse h-3 rounded w-1/2"></div><div class="bg-gray-200 animate-pulse h-7 rounded w-full mt-2"></div></div></div></div>`;
//   }

//   // Inject skeletons while fetching
//   function trendingInjectSkeletons() {
//     ["trendingRow1", "trendingRow2"].forEach(id => {
//       const inner = document.getElementById(id)?.querySelector(".flex.w-max");
//       if (inner) inner.innerHTML = Array(5).fill(trendingSkeletonCard()).join("");
//     });
//   }

//   // Inject live cards — split products evenly across row1 / row2
//   function trendingInjectCards(products) {
//     const mid  = Math.ceil(products.length / 2);
//     const row1 = products.slice(0, mid);
//     const row2 = products.length > 1 ? products.slice(mid) : products;
//     const inject = (id, prods) => {
//       const inner = document.getElementById(id)?.querySelector(".flex.w-max");
//       if (inner) inner.innerHTML = prods.map(buildTrendingCard).join("");
//     };
//     inject("trendingRow1", row1);
//     inject("trendingRow2", row2);
//     trendingSyncHearts();
//   }

//   // Event delegation — one listener per row, handles hearts + cart
//   function wireTrendingDelegation() {
//     ["trendingRow1", "trendingRow2"].forEach(id => {
//       const row = document.getElementById(id);
//       if (!row || row._trendingBound) return;
//       row._trendingBound = true;
//       row.addEventListener("click", function(e) {
//         const heartBtn = e.target.closest(".trending-wl-btn");
//         if (heartBtn) { e.stopPropagation(); e.preventDefault(); trendingToggleWishlist(heartBtn); return; }
//         const cartBtn = e.target.closest(".trending-cart-btn");
//         if (cartBtn && !cartBtn.disabled) {
//           e.stopPropagation();
//           if (cartBtn.dataset.added === "true") { window.location.href = "/Cart/cart.html"; return; }
//           trendingAddToCart(cartBtn);
//         }
//       });
//     });
//   }

//   // Fetch trending products from API — graceful fallback on any failure
//   async function fetchAndRenderTrending() {
//     trendingInjectSkeletons();
//     try {
//       const res = await fetch(`${BASE_URL}/api/products/get-trending`, { headers: { "Content-Type": "application/json" } });
//       if (!res.ok) throw new Error(`HTTP ${res.status}`);
//       const data     = await res.json();
//       const products = data.content || [];
//       if (!products.length) {
//         ["trendingRow1","trendingRow2"].forEach(id => {
//           const inner = document.getElementById(id)?.querySelector(".flex.w-max");
//           if (inner) inner.innerHTML = `<p class="text-sm text-gray-400 px-4 py-6">No trending products at the moment.</p>`;
//         });
//         return;
//       }
//       trendingInjectCards(products);
//       trendingLoadWishlist(); // non-blocking — syncs hearts after wishlist loads
//       console.info(`[Trending] ${products.length} product(s) loaded from API`);
//     } catch(err) {
//       console.warn("[Trending] API failed (non-fatal):", err.message);
//       ["trendingRow1","trendingRow2"].forEach(id => {
//         const inner = document.getElementById(id)?.querySelector(".flex.w-max");
//         if (inner) inner.innerHTML = `<p class="text-sm text-gray-400 px-4 py-6">Could not load trending products.</p>`;
//       });
//     }
//   }
//   // =========================================================================
//   // END TRENDING PATCH
//   // =========================================================================


//   // ── Entry point ──────────────────────────────────────────────
//   function init() {
//     if (!window.artezoData) {
//       console.warn("Waiting for data.js to load...");
//       setTimeout(init, 50);
//       return;
//     }

//     // Attempt to load banner from API; on any failure fall back to static data
//     fetchBannerFromAPI("home")
//       .then(function (apiSlides) {
//         if (apiSlides && apiSlides.length > 0) {
//           // ✅ API returned valid slides → override only the bannerSlides key
//           window.artezoData.bannerSlides = apiSlides;
//           console.info(
//             "[Artezo] Banner loaded from API: " + apiSlides.length + " slide(s)."
//           );
//         } else {
//           // ✅ No slides from API → keep existing static bannerSlides untouched
//           console.info(
//             "[Artezo] Using default static banner slides from data.js."
//           );
//         }
//       })
//       .catch(function (err) {
//         // ✅ Network error / API down → keep existing static bannerSlides untouched
//         console.warn(
//           "[Artezo] Banner API fetch failed. Using default static banners. Error: " +
//             err.message
//         );
//       })
//       .finally(function () {
//         // ✅ Always render the app — with API data or fallback data
//         renderApp();
//         attachAllDynamicScripts();
//       });
//   }

//   // ============================================================
//   // EXISTING renderApp() — NOT A SINGLE LINE CHANGED
//   // ============================================================
//   function renderApp() {
//     const data = window.artezoData;
//     const root = document.getElementById("app-root");
//     if (!root) return;

//     // Build entire HTML structure using static data
//     root.innerHTML = `
//           <!-- Hero Section -->
//           <section class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 relative">
//             <div id="banner-slider" class="overflow-hidden relative rounded-2xl w-full">
//               <div class="flex w-full transition-transform duration-700 ease-in-out" id="banner-slides-wrapper">
//                 ${data.bannerSlides
//                   .map(
//                     (slide, idx) => `
//                   <div class="flex-none min-w-full w-full flex flex-col md:flex-row gap-4 md:gap-6">
//                     <div class="w-full md:w-2/3 relative rounded-2xl border border-gray-300 overflow-hidden shadow-lg h-[220px] sm:h-[260px] md:h-[350px]">
//                       <img src="${slide.mainImage}" class="w-full h-full object-cover" alt="banner" onerror="this.src=''" />
//                       ${
//                         slide.overlayText
//                           ? `
//                         <div class="absolute inset-0 bg-black/25 flex items-center justify-start p-4 sm:p-6 md:p-12">
//                           <div class="text-white">
//                             <h2 class="text-xl sm:text-2xl md:text-4xl lg:text-5xl font-zain font-bold">${slide.overlayText.title}</h2>
//                             <p class="mt-2 md:mt-4 text-xs sm:text-sm md:text-lg font-lexend">${slide.overlayText.subtitle}</p>
//                           </div>
//                         </div>
//                       `
//                           : ""
//                       }
//                     </div>
//                     <div class="w-full md:w-1/3 flex flex-col gap-4 md:gap-2">
//                       <div class="relative rounded-2xl overflow-hidden border border-gray-300 h-[160px] sm:h-[200px] md:h-[170px]">
//                         <img src="${slide.smallImage}" class="w-full h-full object-cover" onerror="this.src=''" />
//                       </div>
//                       <div class="rounded-2xl border border-gray-300 p-4 sm:p-5 md:p-6 flex flex-col justify-center h-auto md:h-[170px]" style="background-color: #effffd; border-color: #e5e7eb">
//                         <h3 class="flex items-center gap-2 font-lexend text-base sm:text-lg text-[#1D3C4A]">
//                           <i class="fa-solid fa-tags text-[#e39f32]"></i>
//                           ${slide.promoTitle}
//                         </h3>
//                         <p class="text-[#1D3C4A] mt-1 font-zain text-xs sm:text-sm">${slide.promoDesc}</p>
//                       </div>
//                     </div>
//                   </div>
//                 `,
//                   )
//                   .join("")}
//               </div>
//               <div class="absolute bottom-3 sm:bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
//                 ${data.bannerSlides.map((_, idx) => `<button class="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-white/50" data-slide="${idx}"></button>`).join("")}
//               </div>
//             </div>
//           </section>

//           <!-- Category Section -->
//           <section class="pt-8 pb-6 bg-white">
//             <div class="max-w-7xl mx-auto px-6">
//               <div class="mb-12 text-center">
//                 <h2 class="text-4xl font-semibold font-zain text-[#1D3C4A]">Browse by Category</h2>
//                 <p class="text-gray-500 mt-2 font-lexend text-sm">Curated collections for every space</p>
//               </div>
//               <div class="grid grid-cols-2 md:grid-cols-4 gap-4 auto-rows-[140px] -mt-6">
//                 ${data.categories
//                   .map(
//                     (cat) => `
//                   <a href="${cat.link}" class="relative ${cat.spanClass} rounded-xl overflow-hidden group">
//                     <img src="${cat.image}" class="w-full h-full object-cover transition duration-500 group-hover:scale-105" />
//                     <div class="absolute inset-x-0 bottom-0 ${cat.gradientHeight} bg-gradient-to-t from-black to-transparent"></div>
//                     <h3 class="absolute bottom-${cat.bottomOffset} left-4 text-white font-lexend ${cat.fontSize} font-semibold">${cat.name}</h3>
//                   </a>
//                 `,
//                   )
//                   .join("")}
//               </div>
//             </div>
//           </section>

//           <!-- Discover Section -->
//          <section class="py-12 px-3 sm:px-6 lg:px-8 bg-white">
//   <div class="max-w-[1450px] mx-auto bg-teal-50 rounded-xl p-6 sm:p-8 -mt-6 md:-mt-4">
   
//     <div class="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-6 gap-4">
//       <div>
//         <h2 class="text-3xl md:text-4xl font-semibold text-[#1D3C4A] font-zain">${data.discover.title}</h2>
//         <p class="text-sm text-gray-500">${data.discover.subtitle}</p>
//       </div>
//       <button class="flex items-center gap-2 border border-gray-300 px-5 py-2.5 rounded-full text-sm hover:bg-white transition w-fit view-all-btn">
//         View All
//         <i class="fa-solid fa-arrow-right text-xs"></i>
//       </button>
//     </div>

//     <div class="relative">
//       <!-- Previous Button - Slightly outside -->
//       <button id="discoverPrevBtn" 
//         class="absolute -left-2 sm:-left-5 md:-left-6 top-1/2 -translate-y-1/2 bg-white shadow-lg p-3 rounded-full z-30 hover:scale-105 active:scale-95 transition flex items-center justify-center border border-gray-100">
//         <i class="fa-solid fa-chevron-left text-sm sm:text-base"></i>
//       </button>

//       <!-- Slider -->
//       <div id="discoverSlider" 
//         class="flex gap-4 sm:gap-6 overflow-x-auto scroll-smooth no-scrollbar pb-4 px-8 sm:px-12 md:px-10 snap-x snap-mandatory scrollbar-hide">
        
//         ${data.discover.products
//           .map(
//             (prod) => `
//           <div class="min-w-[85%] sm:min-w-[47%] md:min-w-[31%] lg:min-w-[280px] xl:min-w-[300px] 
//                       bg-white rounded-xl shadow-sm p-1 hover:shadow-md transition snap-start flex-shrink-0">
           
//             <!-- IMAGE + WISHLIST -->
//             <div class="relative">
//               <img src="${prod.image}" 
//                    class="rounded-lg h-[200px] sm:h-[220px] w-full object-cover" 
//                    alt="${prod.title}" />
              
//               <!-- Wishlist Button -->
//               <button
//                 class="wishlist-btn absolute top-3 right-3 bg-white rounded-full w-9 h-9 flex items-center justify-center shadow hover:bg-gray-50 transition"
//                 data-product-id="${prod.id}"
//                 data-product-name="${prod.title}"
//                 data-price="${prod.price}"
//                 data-image="${prod.image}"
//               >
//                 <i class="fa-regular fa-heart text-gray-500 hover:text-red-500 transition"></i>
//               </button>
//             </div>

//             <div class="px-3 py-3">
//               <p class="text-sm text-gray-700 line-clamp-2 font-normal leading-tight">${prod.title}</p>
              
//               <div class="flex text-orange-400 text-sm mt-2">
//                 ${prod.starsHtml}
//                 <span class="text-gray-500 ml-2 text-xs">(${prod.reviews})</span>
//               </div>

//               <div class="flex items-center gap-2 mt-2">
//                 <span class="text-lg font-semibold text-[#1D3C4A]">${prod.price}</span>
//                 <span class="text-sm line-through text-gray-400">${prod.originalPrice}</span>
//                 <span class="text-green-600 text-sm font-medium">${prod.discount}</span>
//               </div>
//             </div>
//           </div>
//         `,
//           )
//           .join("")}
//       </div>

//       <!-- Next Button - Slightly outside -->
//       <button id="discoverNextBtn" 
//         class="absolute -right-2 sm:-right-5 md:-right-6 top-1/2 -translate-y-1/2 bg-white shadow-lg p-3 rounded-full z-30 hover:scale-105 active:scale-95 transition flex items-center justify-center border border-gray-100">
//         <i class="fa-solid fa-chevron-right text-sm sm:text-base"></i>
//       </button>
//     </div>
//   </div>
// </section>

//           <!-- DEAL SECTION (grid) -->
//           <section class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 my-12 -mt-6">
//             <div class="bg-[#efe3e1] rounded-lg p-6 sm:p-8">
//               <div class="grid grid-cols-12 gap-6">
//                 <div class="col-span-12 lg:col-span-3 flex flex-col justify-center space-y-4">
//                   <h2 class="text-3xl font-bold font-lexend text-[#1D3C4A] leading-snug">Exclusive Deals Across Categories</h2>
//                   <p class="text-gray-500 text-sm">Shop now and save big!</p>
//                   <div class="w-12 h-[2px] bg-gray-300"></div>
//                   <p class="text-lg font-medium text-[#1D3C4A]">UPTO <span class="text-[#e39f32] font-semibold">60% OFF</span></p>
//                 </div>
//                 ${data.dealCategories
//                   .map(
//                     (cat) => `
//                   <div class="col-span-6 sm:col-span-4 lg:col-span-2 bg-white rounded-lg shadow-sm overflow-hidden">
//                     <img src="${cat.image}" class="w-full h-44 object-cover" />
//                     <div class="py-3 text-center text-sm font-medium">${cat.name}</div>
//                   </div>
//                 `,
//                   )
//                   .join("")}
//                 ${data.dealCategoriesSecondRow
//                   .map(
//                     (cat) => `
//                   <div class="col-span-6 sm:col-span-6 lg:col-span-3 bg-white rounded-lg shadow-sm overflow-hidden">
//                     <img src="${cat.image}" class="w-full h-44 object-cover" />
//                     <div class="py-3 text-center text-sm font-medium">${cat.name}</div>
//                   </div>
//                 `,
//                   )
//                   .join("")}
//               </div>
//             </div>
//           </section>

//     <!-- Top Rated / Best Sellers Section -->
// <section class="top-rated-section py-8 bg-gray-50">
//   <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

//     <div class="flex items-center justify-between mb-6">
//       <div>
//         <h2 class="text-2xl sm:text-3xl font-semibold text-[#1D3C4A] font-zain">
//           Best Sellers
//         </h2>
//         <p class="text-gray-500 text-sm">
//           Our most loved pieces chosen by customers
//         </p>
//       </div>

//       <button class="border border-gray-300 px-5 py-2 rounded-full text-xs sm:text-sm hover:bg-white transition view-all-btn flex items-center gap-2">
//         View All
//         <span class="text-base leading-none">→</span>
//       </button>
//     </div>

//     <div class="relative">

//       <!-- PREV BUTTON -->
//       <button
//         id="topRatedPrevBtn"
//         class="absolute -left-2 sm:-left-5 md:-left-6 top-1/2 -translate-y-1/2 bg-white shadow-lg p-3 rounded-full z-30 hover:scale-105 active:scale-95 transition flex items-center justify-center border border-gray-100">
//         <i class="fa-solid fa-chevron-left text-sm sm:text-base"></i>
//       </button>

//       <!-- SLIDER -->
//       <div
//         id="topRatedSlider"
//         class="flex gap-4 sm:gap-6 overflow-x-auto scroll-smooth no-scrollbar pb-4 px-10 sm:px-14 md:px-12 snap-x snap-mandatory scrollbar-hide">

//         ${data.topRated
//           .map(
//             (prod) => `
        
//         <div class="relative min-w-[86%] sm:min-w-[48%] md:min-w-[32%] lg:min-w-[260px] xl:min-w-[280px] 
//                     bg-white rounded-xl shadow-sm hover:shadow-md transition flex-shrink-0 snap-start">

//           <!-- WISHLIST BUTTON -->
//           <button 
//             class="wishlist-btn absolute top-3 right-3 bg-white/90 backdrop-blur rounded-full w-9 h-9 flex items-center justify-center shadow-md hover:scale-110 transition z-20"
//             data-product-id="${prod.id}"
//             data-product-name="${prod.title}"
//             data-price="${prod.price}"
//             data-image="${prod.image}"
//           >
//             <i class="fa-regular fa-heart text-gray-500"></i>
//           </button>

//           <div class="p-1">
//             <div class="border border-gray-200 rounded-xl overflow-hidden h-[200px] sm:h-[210px] bg-gray-100">
//               <img src="${prod.image}" 
//                    class="w-full h-full object-cover" 
//                    alt="${prod.title}" />
//             </div>
//           </div>

//           <div class="px-3 pb-4 pt-2">
//             <h3 class="text-sm text-gray-700 line-clamp-2 font-medium leading-tight">${prod.title}</h3>

//             <div class="flex text-orange-500 text-sm mt-2">
//               ${prod.starsHtml}
//               <span class="text-gray-400 ml-1.5">(${prod.reviews})</span>
//             </div>

//             <div class="flex items-center gap-2 mt-2">
//               <span class="font-semibold text-lg text-[#1D3C4A]">${prod.price}</span>
//               <span class="text-gray-400 line-through text-sm">${prod.originalPrice}</span>
//               <span class="text-green-600 text-sm font-medium">${prod.discount}</span>
//             </div>
//           </div>

//         </div>

//         `,
//           )
//           .join("")}

//       </div>

//           <!-- NEXT BUTTON -->
//           <button
//             id="topRatedNextBtn"
//             class="absolute -right-2 sm:-right-5 md:-right-6 top-1/2 -translate-y-1/2 bg-white shadow-lg p-3 rounded-full z-30 hover:scale-105 active:scale-95 transition flex items-center justify-center border border-gray-100">
//             <i class="fa-solid fa-chevron-right text-sm sm:text-base"></i>
//           </button>

//         </div>
//       </div>
//     </section>

//           <!-- Banner Section (Corporate Gifting) -->
//           <section class="py-8 px-4 sm:px-6 lg:px-8">
//             <div class="max-w-7xl mx-auto">
//               <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
//                 ${data.corporateBanners
//                   .map(
//                     (banner) => `
//                   <a href="${banner.link}" class="relative block overflow-hidden rounded-2xl group">
//                     <img src="${banner.image}" alt="${banner.title}" class="w-full h-[220px] sm:h-[260px] md:h-[280px] lg:h-[300px] object-cover transition duration-500 group-hover:scale-105" />
//                     ${banner.showText ? `<div class="absolute top-6 left-6 text-[#1D3C4A]" style="text-shadow: 0 2px 6px rgba(0,0,0,0.5)"><h3 class="text-xl sm:text-2xl md:text-2xl lg:text-3xl font-lexend font-semibold">${banner.title}</h3><p class="text-sm sm:text-base md:text-base lg:text-base font-lexend mt-1 max-w-xs">${banner.subtitle}</p></div>` : ""}
//                   </a>
//                 `,
//                   )
//                   .join("")}
//               </div>
//             </div>
//           </section>

//           <!-- Trending Products Section -->
//          <!-- Trending Products Section -->
// <section class="py-10 bg-gray-50">

//   <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-10">
//     <div class="flex items-center gap-4">
//       <div class="w-1 h-10 bg-[#E39F32] rounded"></div>

//       <div>
//         <h2 class="text-3xl sm:text-4xl font-zain font-extrabold text-[#1D3C4A]">
//           Trending Products
//         </h2>

//         <p class="text-sm text-gray-500">
//           Popular picks customers love the most
//         </p>
//       </div>
//     </div>
//   </div>

//   <!-- ROW 1 -->
//   <div class="relative max-w-7xl mx-auto">

//     <button onclick="scrollRow('trendingRow1', -1)"
//       class="absolute left-2 sm:-left-3 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-white shadow border flex items-center justify-center hover:bg-[#1D3C4A] hover:text-white transition">
//       <i class="fa-solid fa-chevron-left"></i>
//     </button>

//     <button onclick="scrollRow('trendingRow1', 1)"
//       class="absolute right-2 sm:-right-3 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-white shadow border flex items-center justify-center hover:bg-[#1D3C4A] hover:text-white transition">
//       <i class="fa-solid fa-chevron-right"></i>
//     </button>

//     <div id="trendingRow1" class="overflow-x-auto scroll-smooth scrollbar-hide">
//       <div class="flex gap-4 sm:gap-6 w-max px-4 sm:px-6">

//         ${data.trendingProducts.row1
//           .map((prod) => renderTrendingCard(prod))
//           .join("")}

//       </div>
//     </div>
//   </div>


//   <!-- ROW 2 -->
//   <div class="relative max-w-7xl mx-auto mt-8">

//     <button onclick="scrollRow('trendingRow2', -1)"
//       class="absolute left-2 sm:-left-3 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-white shadow border flex items-center justify-center hover:bg-[#1D3C4A] hover:text-white transition">
//       <i class="fa-solid fa-chevron-left"></i>
//     </button>

//     <button onclick="scrollRow('trendingRow2', 1)"
//       class="absolute right-2 sm:-right-3 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-white shadow border flex items-center justify-center hover:bg-[#1D3C4A] hover:text-white transition">
//       <i class="fa-solid fa-chevron-right"></i>
//     </button>

//     <div id="trendingRow2" class="overflow-x-auto scroll-smooth scrollbar-hide">
//       <div class="flex gap-4 sm:gap-6 w-max px-4 sm:px-6">

//         ${data.trendingProducts.row2
//           .map((prod) => renderTrendingCard(prod))
//           .join("")}

//       </div>
//     </div>
//   </div>

// </section>

//           <!-- Services Section -->
//           <section class="py-6 sm:py-8 md:py-10 px-4 sm:px-6 lg:px-8 mt-2 sm:mt-4 md:mt-6 bg-[url('./Images/servicebg.jfif')] bg-cover bg-center bg-no-repeat bg-fixed">
//             <div class="max-w-7xl mx-auto"><div class="rounded-2xl sm:rounded-3xl bg-white/85 backdrop-blur-md shadow-md sm:shadow-lg px-4 sm:px-6 lg:px-8 py-5 sm:py-6 md:py-7"><div class="grid grid-cols-1 md:grid-cols-4 gap-4 sm:gap-5 lg:gap-6">${data.services
//               .map(
//                 (service) => `
//               <div class="flex items-center gap-3 sm:gap-4 px-3 sm:px-4 py-3 sm:py-4 border-b md:border-b-0 md:border-r border-[#1D3C4A]/30 group transition hover:scale-[1.02]">
//                 <div class="flex-shrink-0 w-11 h-11 sm:w-12 sm:h-12 bg-[#e8f4f7] text-[#1D3C4A] rounded-xl flex items-center justify-center text-xl sm:text-2xl group-hover:bg-[#1D3C4A] group-hover:text-white transition-colors duration-200"><i class="${service.icon}"></i></div>
//                 <div><p class="text-sm sm:text-base font-semibold text-[#1D3C4A]">${service.title}</p><p class="text-xs sm:text-sm text-gray-600">${service.desc}</p></div>
//               </div>
//             `,
//               )
//               .join("")}</div></div></div>
//           </section>

//           <!-- Photo Frames Section -->
//           <section class="py-6 sm:py-7 md:py-8 px-3 sm:px-5 lg:px-8 mt-1">
//   <div class="mx-auto max-w-[1450px] w-full bg-gradient-to-br from-teal-50 via-white to-teal-100 rounded-lg sm:rounded-lg border border-teal-100/70 shadow-sm sm:shadow p-2 sm:p-5 md:p-6 lg:p-7">
    
//     <div class="mb-3 sm:mb-4 md:mb-5">
//       <h2 class="text-xl sm:text-2xl md:text-3xl lg:text-3.5xl font-semibold font-zain text-[#1D3C4A] tracking-tight">
//         Photo <span class="text-[#e39f32]">Frames</span>
//       </h2>
//       <p class="text-gray-600 text-xs sm:text-sm mt-1">
//         Capture and frame your beautiful memories
//       </p>
//     </div>

//     <div class="relative group">

//       <!-- LEFT BUTTON -->
//       <button id="pfLeft"
//         class="flex absolute -left-2 xs:-left-3 sm:-left-4 top-1/2 -translate-y-1/2 z-20 w-8 h-8 xs:w-9 xs:h-9 sm:w-10 sm:h-10 bg-white/95 backdrop-blur-sm border border-gray-200 rounded-full shadow-md items-center justify-center text-gray-700 hover:text-white hover:bg-[#1D3C4A] transition-all duration-200 opacity-70 hover:opacity-100 active:scale-95 -translate-x-1/2 sm:translate-x-0">
//         <i class="fa-solid fa-chevron-left text-base sm:text-lg"></i>
//       </button>

//       <!-- PRODUCTS -->
//       <div id="photoFramesContainer"
//         class="flex gap-3 xs:gap-4 sm:gap-5 md:gap-6 overflow-x-auto pb-4 sm:pb-5 scroll-smooth snap-x snap-mandatory scrollbar-hide -mx-1 xs:-mx-2 sm:-mx-0 px-1 xs:px-2 sm:px-0">

//         ${data.photoFrames
//           .map(
//             (frame) => `
        
//         <div class="flex-none min-w-[160px] xs:min-w-[170px] sm:min-w-[190px] md:min-w-[210px] lg:min-w-[225px] max-w-[180px] xs:max-w-[195px] sm:max-w-[220px] md:max-w-[240px] bg-white border border-gray-200/80 rounded-xl sm:rounded-2xl shadow-sm hover:shadow-md transition-all duration-200 snap-start">

//           <div class="relative aspect-[4/3] overflow-hidden rounded-t-xl bg-gray-50">

//             <img src="${frame.image}" 
//             class="w-full h-full object-cover transition-transform duration-500 hover:scale-105" 
//             loading="lazy" />

//             <button class="absolute top-2 right-2 w-7 h-7 sm:w-8 sm:h-8 bg-white/90 backdrop-blur-sm rounded-full shadow flex items-center justify-center text-gray-600 hover:text-red-500">
//               <i class="fa-regular fa-heart text-sm sm:text-base"></i>
//             </button>

//           </div>

//           <div class="p-2.5 sm:p-3">

//             <p class="text-[9px] xs:text-[10px] sm:text-xs text-gray-500 uppercase font-medium mb-1">
//               ${frame.category}
//             </p>

//             <h3 class="text-xs sm:text-sm md:text-base font-medium text-[#1D3C4A] mb-1.5 sm:mb-2 line-clamp-2 min-h-[2.6em]">
//               ${frame.title}
//             </h3>

//             <div class="flex items-center gap-2 flex-wrap">

//               <span class="text-sm sm:text-base md:text-lg  font-bold text-[#1D3C4A]">
//                 ${frame.price}
//               </span>

//               <span class="text-xs sm:text-sm text-gray-500 line-through">
//                 ${frame.originalPrice}
//               </span>

//               <span class="text-xs sm:text-sm text-green-600 font-semibold">
//                 ${frame.discount}% OFF
//               </span>

//             </div>

//           </div>

//         </div>

//         `,
//           )
//           .join("")}

//       </div>

//       <!-- RIGHT BUTTON -->
//       <button id="pfRight"
//         class="flex absolute -right-2 xs:-right-3 sm:-right-4 top-1/2 -translate-y-1/2 z-20 w-8 h-8 xs:w-9 xs:h-9 sm:w-10 sm:h-10 bg-white/95 backdrop-blur-sm border border-gray-200 rounded-full shadow-md items-center justify-center text-gray-700 hover:text-white hover:bg-[#1D3C4A] transition-all duration-200 opacity-70 hover:opacity-100 active:scale-95 translate-x-1/2 sm:translate-x-0">
//         <i class="fa-solid fa-chevron-right text-base sm:text-lg"></i>
//       </button>

//     </div>

//   </div>
// </section>

//           <!-- DEALS BANNER -->
// <section class="mb-4 py-6 px-4 sm:px-6 lg:px-8">
//   <div class="max-w-7xl mx-auto">
    
//     <a href="/deals" class="block mb-4 sm:mb-6 lg:mb-8">
      
//       <div class="w-full rounded-lg overflow-hidden">
        
//         <img 
//           src="${data.dealsBannerImage}" 
//           alt="Deals Banner"
//           class="w-full h-auto object-cover object-center transition-transform duration-500 hover:scale-105"
//         >
      
//       </div>

//     </a>

//   </div>
// </section>
//         `;
//   }

//   // ============================================================
//   // EXISTING renderTrendingCard() — NOT A SINGLE LINE CHANGED
//   // ============================================================
//   function renderTrendingCard(prod) {
//     return `
//   <div class="w-[180px] sm:w-[200px] md:w-[230px] flex-shrink-0">

//     <div class="bg-white border border-gray-200 rounded-xl overflow-hidden flex flex-col h-full transition hover:shadow-md">

//       <!-- Image -->
//       <div class="p-1">
//         <div class="relative border border-gray-100 rounded-lg overflow-hidden bg-gray-50">

//           <img src="${prod.image}" 
//                class="w-full h-[140px] sm:h-[150px] md:h-[170px] object-cover"/>

//           <!-- Wishlist -->
//           <button class="absolute top-2 right-2 w-7 h-7 sm:w-8 sm:h-8 bg-white rounded-full shadow flex items-center justify-center hover:text-red-500 hover:scale-110 transition">
//             <i class="fa-regular fa-heart text-[10px] sm:text-sm"></i>
//           </button>

//         </div>
//       </div>

//       <!-- Content -->
//       <div class="p-3 flex flex-col flex-grow justify-between">

//         <div>
//           <h3 class="text-xs sm:text-sm font-semibold text-[#1D3C4A] line-clamp-2">
//             ${prod.title}
//           </h3>

//           <p class="text-[9px] sm:text-xs text-gray-500">
//             ${prod.category}
//           </p>

//           <!-- Price -->
//           <div class="flex items-center gap-2 mt-1 flex-wrap">

//             <span class="text-[#1D3C4A] font-semibold text-xs sm:text-sm">
//               ${prod.price}
//             </span>

//             <span class="text-gray-400 line-through text-[9px] sm:text-xs">
//               ${prod.originalPrice}
//             </span>

//             <span class="text-green-600 text-[9px] sm:text-xs font-semibold">
//               ${prod.discountPercent}% OFF
//             </span>

//           </div>
//         </div>

//         <!-- Add to Cart -->
//         <button class="group mt-2 sm:mt-3 w-full bg-[#1D3C4A] text-white text-[10px] sm:text-sm py-1.5 sm:py-2 rounded-md hover:bg-[#E39F32] transition flex items-center justify-center gap-2">

//           <i class="fa-solid fa-cart-shopping text-[#E39F32] group-hover:text-[#1D3C4A] transition"></i>
//           Add to Cart

//         </button>

//       </div>

//     </div>

//   </div>
//   `;
//   }

//   // ============================================================
//   // EXISTING attachAllDynamicScripts() — NOT A SINGLE LINE CHANGED
//   // ============================================================
//   function attachAllDynamicScripts() {
//     // Banner slider logic
//     const sliderWrapper = document.querySelector("#banner-slider");
//     const slider = document.querySelector("#banner-slides-wrapper");
//     const slides = document.querySelectorAll("#banner-slides-wrapper > div");
//     const dots = document.querySelectorAll("#banner-slider [data-slide]");
//     let currentSlide = 0,
//       slideInterval;
//     function goToSlide(index) {
//       if (slider) {
//         slider.style.transform = `translateX(-${index * 100}%)`;
//         dots.forEach((dot) => dot.classList.remove("bg-white"));
//         if (dots[index]) dots[index].classList.add("bg-white");
//         currentSlide = index;
//       }
//     }
//     function startSlider() {
//       if (slideInterval) clearInterval(slideInterval);
//       slideInterval = setInterval(() => {
//         let next = (currentSlide + 1) % slides.length;
//         goToSlide(next);
//       }, 3000);
//     }
//     function stopSlider() {
//       clearInterval(slideInterval);
//     }
//     if (sliderWrapper) {
//       sliderWrapper.addEventListener("mouseenter", stopSlider);
//       sliderWrapper.addEventListener("mouseleave", startSlider);
//     }
//     if (slides.length) {
//       goToSlide(0);
//       startSlider();
//     }
//     dots.forEach((dot) =>
//       dot.addEventListener("click", () => {
//         let idx = parseInt(dot.dataset.slide);
//         if (!isNaN(idx)) goToSlide(idx);
//       }),
//     );

//     // Discover slider
//     const discoverSlider = document.getElementById("discoverSlider");
//     const discPrev = document.getElementById("discoverPrevBtn");
//     const discNext = document.getElementById("discoverNextBtn");
//     if (discoverSlider && discPrev && discNext) {
//       discPrev.onclick = () =>
//         discoverSlider.scrollBy({ left: -320, behavior: "smooth" });
//       discNext.onclick = () =>
//         discoverSlider.scrollBy({ left: 320, behavior: "smooth" });
//     }

//     // Top Rated slider
//     const topSlider = document.getElementById("topRatedSlider");
//     const topPrev = document.getElementById("topRatedPrevBtn");
//     const topNext = document.getElementById("topRatedNextBtn");
//     if (topSlider && topPrev && topNext) {
//       const scrollAmount = 284;
//       topNext.onclick = () =>
//         topSlider.scrollBy({ left: scrollAmount, behavior: "smooth" });
//       topPrev.onclick = () =>
//         topSlider.scrollBy({ left: -scrollAmount, behavior: "smooth" });
//     }

//     // Photo frames scroll
//     const pfContainer = document.getElementById("photoFramesContainer");
//     const pfLeft = document.getElementById("pfLeft");
//     const pfRight = document.getElementById("pfRight");
//     if (pfContainer && pfLeft && pfRight) {
//       pfLeft.onclick = () =>
//         pfContainer.scrollBy({ left: -220, behavior: "smooth" });
//       pfRight.onclick = () =>
//         pfContainer.scrollBy({ left: 220, behavior: "smooth" });
//     }

//     // Trending rows scroll
//     window.scrollRow = function (row, dir) {
//       const cont = document.getElementById(row);
//       if (cont) cont.scrollBy({ left: dir * 350, behavior: "smooth" });
//     };

//     // ── Trending: wire delegation (idempotent) ─────────────────────────────
//     wireTrendingDelegation();
//     fetchAndRenderTrending();

//   }

//   init();
// })();







