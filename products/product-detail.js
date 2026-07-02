// // ═══════════════════════════════════════════════════════════════════════════
// //  ARTEZO LOGGING SYSTEM (Non-conflicting)
// // ═══════════════════════════════════════════════════════════════════════════

// window.artezoLog = {
//   info: (msg, ...args) => {
//     const formatted = msg.replace(/{}/g, () => {
//       const arg = args.shift();
//       return typeof arg === 'object' ? JSON.stringify(arg) : arg;
//     });
//     console.log(`%c[✅ INFO] ${formatted}`, 'color: #4CAF50; font-weight: bold; font-size: 12px;');
//   },
//   error: (msg, ...args) => {
//     const formatted = msg.replace(/{}/g, () => {
//       const arg = args.shift();
//       return typeof arg === 'object' ? JSON.stringify(arg) : arg;
//     });
//     console.error(`%c[❌ ERROR] ${formatted}`, 'color: #F44336; font-weight: bold; font-size: 12px;');
//   },
//   warn: (msg, ...args) => {
//     const formatted = msg.replace(/{}/g, () => {
//       const arg = args.shift();
//       return typeof arg === 'object' ? JSON.stringify(arg) : arg;
//     });
//     console.warn(`%c[⚠️ WARN] ${formatted}`, 'color: #FF9800; font-weight: bold; font-size: 12px;');
//   },
//   debug: (msg, ...args) => {
//     const formatted = msg.replace(/{}/g, () => {
//       const arg = args.shift();
//       return typeof arg === 'object' ? JSON.stringify(arg) : arg;
//     });
//     console.log(`%c[🔍 DEBUG] ${formatted}`, 'color: #2196F3; font-weight: normal; font-size: 11px;');
//   }
// };

// // Shorter alias
// const L = window.artezoLog;

// L.info("═══════════════════════════════════════════════════════════");
// L.info("  ARTEZO PRODUCT DETAILS PAGE INITIALIZED");
// L.info("═══════════════════════════════════════════════════════════");



// // ═══════════════════════════════════════════════════════════════════════════
// //  SHIPROCKET DYNAMIC SCRIPT INJECTION (WORKAROUND)
// // ═══════════════════════════════════════════════════════════════════════════

// L.info("Attempting Shiprocket script injection...");

// // Remove any existing script tag to avoid duplicates
// const existingScript = document.querySelector('script[src*="shiprocket-checkout"]');
// if (existingScript) {
//   L.warn("Removing existing Shiprocket script tag");
//   existingScript.remove();
// }

// // Create and inject new script
// const shiprocketScript = document.createElement('script');
// shiprocketScript.src = 'https://cdn.shiprocket.in/checkout/js/shiprocket-checkout.js';
// shiprocketScript.type = 'text/javascript';
// shiprocketScript.async = true;
// shiprocketScript.charset = 'UTF-8';

// shiprocketScript.onload = function () {
//   L.info("✅ Shiprocket script loaded successfully!");
//   window.shiprocketScriptLoaded = true;

//   // Verify window.Shiprocket exists
//   if (typeof window.Shiprocket !== "undefined") {
//     L.info("✅ window.Shiprocket is available");
//     L.info("  Methods: {}", Object.keys(window.Shiprocket).join(", "));
//   } else {
//     L.error("❌ Script loaded but window.Shiprocket is still undefined");
//   }
// };

// shiprocketScript.onerror = function () {
//   L.error("❌ Failed to load Shiprocket script");
//   L.error("Possible reasons:");
//   L.error("  1. CORS blocked the request");
//   L.error("  2. Network/internet issue");
//   L.error("  3. Shiprocket service down");
//   L.error("  Check Network tab for details");
// };

// // Append to head
// document.head.appendChild(shiprocketScript);
// L.debug("Shiprocket script injection initiated");


// // ═══════════════════════════════════════════════════════════════════════════
// //  SHIPROCKET SDK INITIALIZATION CHECKER
// // ═══════════════════════════════════════════════════════════════════════════
// ═══════════════════════════════════════════════════════════════════════════
//  SHIPROCKET HEADLESS CHECKOUT SDK LOADER
// ═══════════════════════════════════════════════════════════════════════════

// Load Shiprocket HeadlessCheckout SDK
(function loadShiprocketSDK() {
  // Check if already loaded
  if (typeof HeadlessCheckout !== 'undefined') {
    console.log('[SR] HeadlessCheckout SDK already loaded');
    return;
  }

  // Load CSS
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = 'https://checkout-ui.shiprocket.com/assets/styles/shopify.css';
  document.head.appendChild(link);

  // Load JS
  const script = document.createElement('script');
  script.src = 'https://checkout-ui.shiprocket.com/assets/js/channels/shopify.js';
  script.async = true;
  script.onload = () => {
    console.log('[SR] HeadlessCheckout SDK loaded successfully');
    window.shiprocketSDKLoaded = true;
  };
  script.onerror = () => {
    console.error('[SR] Failed to load HeadlessCheckout SDK');
    window.shiprocketSDKLoaded = false;
  };
  document.head.appendChild(script);
})();

// Helper to wait for SDK
function waitForShiprocketSDK(maxWaitMs = 5000) {
  return new Promise((resolve) => {
    if (typeof HeadlessCheckout !== 'undefined') {
      resolve(true);
      return;
    }
    const start = Date.now();
    const check = setInterval(() => {
      if (typeof HeadlessCheckout !== 'undefined') {
        clearInterval(check);
        resolve(true);
      } else if (Date.now() - start > maxWaitMs) {
        clearInterval(check);
        resolve(false);
      }
    }, 100);
  });
}

(function () {
  "use strict";

  // ─── CONFIG ────────────────────────────────────────────────────────────────
  const BASE_URL = "http://localhost:8085";
  const FALLBACK_IMG = "/Images/product_fallback/artezo_product_fallback_img.png";

  // Hardcoded userId until auth system is wired
  const USER_ID = localStorage.getItem('userId');
  // ─── CART STATE ───────────────────────────────────────────────────────────
  const addedToCartSet = new Set();
  const addedToWishlistSet = new Set();


  // ── Dual-dispatch: fires on both window AND document so any listener pattern works ──
  function dispatchCartEvent() { const e = 'cart:updated'; window.dispatchEvent(new CustomEvent(e)); document.dispatchEvent(new CustomEvent(e)); }
  function dispatchWishlistEvent() { const e = 'wishlist:updated'; window.dispatchEvent(new CustomEvent(e)); document.dispatchEvent(new CustomEvent(e)); }


  // Add this new function
  function syncCardCartStates() {
    document.querySelectorAll(".card-add-cart").forEach((btn) => {
      const pid = parseInt(btn.dataset.productId);
      if (addedToCartSet.has(pid)) {
        btn.innerHTML = '<i class="fa-solid fa-bag-shopping text-xs"></i> Go to Cart';
        btn.style.background = "#e39f32";
        btn.style.color = "#1D3C4A";
        btn.style.fontWeight = "600";
        btn.style.borderColor = "#e39f32";
        btn.dataset.added = "true";
      } else {
        // Revert if item was removed from cart externally
        if (btn.dataset.added === "true") {
          btn.innerHTML = "Add to Cart";
          btn.style.background = "";
          btn.style.color = "";
          btn.style.fontWeight = "";
          btn.style.borderColor = "";
          btn.dataset.added = "false";
        }
      }
    });
  }


  // ── SIMPLE LOGGING HELPER ──────────────────────────────────────────────
  const log = {
    info: (msg, ...args) => {
      const formatted = msg.replace(/{}/g, () => JSON.stringify(args.shift()));
      console.log(`%c[INFO] ${formatted}`, 'color: #4CAF50; font-weight: bold;');
    },
    error: (msg, ...args) => {
      const formatted = msg.replace(/{}/g, () => JSON.stringify(args.shift()));
      console.error(`%c[ERROR] ${formatted}`, 'color: #F44336; font-weight: bold;');
    },
    warn: (msg, ...args) => {
      const formatted = msg.replace(/{}/g, () => JSON.stringify(args.shift()));
      console.warn(`%c[WARN] ${formatted}`, 'color: #FF9800; font-weight: bold;');
    }
  };


  // ─── URL HELPERS ───────────────────────────────────────────────────────────
  function absUrl(path) {
    if (!path) return null;
    if (path.startsWith("http")) return path;
    return BASE_URL + path;
  }




  // ═══════════════════════════════════════════════════════════════════════════
  //  PATCH 3 — REVIEWS (COMPLETE: image + video, lightbox, aggregate)
  //  API fields used: customerName, rating, comment, imageUrl, videoUrl,
  //                   createdAt, approved
  //  Media endpoint pattern: BASE_URL + /api/reviews/{id}/media/image|video
  //  A review can have both image AND video simultaneously.
  // ═══════════════════════════════════════════════════════════════════════════

  async function fetchProductReviews(productPrimeId) {
    try {
      const res = await fetch(`${BASE_URL}/api/reviews/product/${productPrimeId}`, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      // Backend /product/{id} returns only approved per service impl,
      // but guard here too for safety — newest first
      return (Array.isArray(data) ? data : [])
        .filter((r) => r.approved === true)
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    } catch (err) {
      console.warn("[Reviews] fetch error:", err);
      return [];
    }
  }

  // ─── Build flat media list from all reviews ────────────────────────────────
  // Each entry: { type: "image"|"video", url, reviewId, customerName, reviewIdx }
  // One review can contribute TWO entries (image + video).
  function buildReviewMediaList(reviews) {
    const list = [];
    reviews.forEach((r, reviewIdx) => {
      if (r.imageUrl) {
        list.push({
          type: "image",
          url: `${BASE_URL}${r.imageUrl}`,
          reviewId: r.reviewId,
          customerName: r.customerName || "Customer",
          reviewIdx,
        });
      }
      if (r.videoUrl) {
        list.push({
          type: "video",
          url: `${BASE_URL}${r.videoUrl}`,
          reviewId: r.reviewId,
          customerName: r.customerName || "Customer",
          reviewIdx,
        });
      }
    });
    return list;
  }

  // ─── Main review section renderer ─────────────────────────────────────────
  async function fillReviews() {
    const sec = document.getElementById("socialSection");
    if (!sec) return;

    const reviews = await fetchProductReviews(safeProductData.productId);
    const mediaList = buildReviewMediaList(reviews);
    const total = reviews.length;
    const avgRating = total
      ? (reviews.reduce((s, r) => s + (r.rating || 0), 0) / total).toFixed(1)
      : "0.0";

    const starCounts = [5, 4, 3, 2, 1].map((star) => ({
      star,
      count: reviews.filter((r) => Math.round(r.rating) === star).length,
    }));

    let html = `
    <div class="mb-6">
      <h2 class="text-2xl md:text-3xl font-semibold font-zain text-[#1D3C4A]">
        Customer Reviews
      </h2>
    </div>`;

    if (!total) {
      html += `
      <div class="text-center py-16 border border-[#e5e7eb] rounded-2xl bg-white">
        <i class="fa-regular fa-star text-4xl text-gray-300 mb-3 block"></i>
        <p class="text-gray-400 font-lexend">No reviews yet. Be the first to review!</p>
      </div>`;
      sec.innerHTML = html;
      return;
    }

    // ── Aggregate block ────────────────────────────────────────────────────
    html += `
    <div class="flex flex-col sm:flex-row gap-6 bg-white border border-[#e5e7eb]
                rounded-2xl p-6 mb-6 shadow-sm">
      <div class="flex flex-col items-center justify-center min-w-[120px]
                  border-b sm:border-b-0 sm:border-r border-[#e5e7eb]
                  pb-4 sm:pb-0 sm:pr-6">
        <span class="text-5xl font-bold font-zain text-[#1D3C4A]">${avgRating}</span>
        <div class="flex text-[#e39f32] gap-0.5 mt-1 text-sm">
          ${renderStars(parseFloat(avgRating))}
        </div>
        <span class="text-xs text-gray-400 mt-1 font-lexend">
          ${total} review${total > 1 ? "s" : ""}
        </span>
      </div>
      <div class="flex-1 space-y-2">
        ${starCounts.map(({ star, count }) => {
      const pct = total ? Math.round((count / total) * 100) : 0;
      return `
            <div class="flex items-center gap-3">
              <span class="text-xs font-lexend text-[#1D3C4A] w-3 text-right shrink-0">${star}</span>
              <i class="fa-solid fa-star text-[#e39f32] text-[10px] shrink-0"></i>
              <div class="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                <div class="h-full bg-[#e39f32] rounded-full transition-all duration-500"
                     style="width:${pct}%"></div>
              </div>
              <span class="text-xs text-gray-400 font-lexend w-5 shrink-0">${count}</span>
            </div>`;
    }).join("")}
      </div>
    </div>`;

    // ── All media strip (images + videos combined) ─────────────────────────
    if (mediaList.length > 0) {
      html += `
      <div class="mb-6">
        <h3 class="text-sm font-semibold font-lexend text-[#1D3C4A] mb-3">
          Customer photos &amp; videos (${mediaList.length})
        </h3>
        <div class="flex gap-2 overflow-x-auto pb-2"
             style="scrollbar-width:thin;scrollbar-color:#e39f32 #f1f1f1">
          ${mediaList.map((item, idx) => {
        if (item.type === "video") {
          return `
                <div class="review-strip-media relative flex-shrink-0 h-20 w-20 rounded-xl
                            border border-[#e5e7eb] overflow-hidden cursor-pointer
                            hover:border-[#e39f32] transition-all group"
                     data-media-idx="${idx}">
                  <video src="${item.url}"
                         class="w-full h-full object-cover"
                         muted preload="metadata"></video>
                  <div class="absolute inset-0 flex items-center justify-center
                              bg-black/40 group-hover:bg-black/50 transition-all">
                    <i class="fa-solid fa-play text-white text-lg"></i>
                  </div>
                </div>`;
        }
        return `
              <img src="${item.url}"
                   class="review-strip-media flex-shrink-0 h-20 w-20 object-cover rounded-xl
                          border border-[#e5e7eb] cursor-pointer
                          hover:opacity-90 hover:border-[#e39f32] transition-all"
                   data-media-idx="${idx}"
                   alt="Review media"
                   onerror="this.parentElement?.remove()"/>`;
      }).join("")}
        </div>
      </div>`;
    }

    // ── Individual review cards ────────────────────────────────────────────
    html += `<div class="space-y-4">`;

    reviews.forEach((r) => {
      const name = escapeHtml(r.customerName || "Anonymous");
      const initials = name.slice(0, 2).toUpperCase();
      const rating = r.rating || 0;
      const comment = escapeHtml(r.comment || "");
      const dateStr = r.createdAt
        ? new Date(r.createdAt).toLocaleDateString("en-IN", {
          day: "numeric", month: "short", year: "numeric",
        })
        : "";

      // Find media indices for this review's image/video in the global mediaList
      const imgMediaIdx = mediaList.findIndex(
        (m) => m.type === "image" && m.reviewId === r.reviewId
      );
      const vidMediaIdx = mediaList.findIndex(
        (m) => m.type === "video" && m.reviewId === r.reviewId
      );

      html += `
      <div class="bg-white border border-[#e5e7eb] rounded-2xl p-5 hover:shadow-sm
                  transition-shadow">

        <!-- Reviewer header -->
        <div class="flex items-start gap-3 mb-3">
          <div class="w-10 h-10 rounded-full bg-[#1D3C4A] flex items-center justify-center
                      text-white text-sm font-semibold font-lexend flex-shrink-0">
            ${initials}
          </div>
          <div class="flex-1 min-w-0">
            <div class="flex items-center justify-between gap-2 flex-wrap">
              <span class="font-semibold font-lexend text-[#1D3C4A] text-sm">${name}</span>
              ${dateStr
          ? `<span class="text-xs text-gray-400 font-lexend">${dateStr}</span>`
          : ""}
            </div>
            <div class="flex items-center gap-1 mt-0.5">
              <div class="flex text-[#e39f32] text-xs gap-0.5">${renderStars(rating)}</div>
              <span class="text-xs text-gray-400 font-lexend">${rating}/5</span>
            </div>
          </div>
          <span class="flex items-center gap-1 text-[10px] font-lexend text-green-700
                       bg-green-50 border border-green-200 px-2 py-0.5 rounded-full flex-shrink-0">
            <i class="fa-solid fa-circle-check text-[9px]"></i> Verified
          </span>
        </div>

        <!-- Comment -->
        ${comment
          ? `<p class="text-sm text-[#1D3C4A]/80 font-lexend leading-relaxed mb-3">
               ${comment}
             </p>`
          : ""}

        <!-- Per-card media thumbnails -->
        ${(r.imageUrl || r.videoUrl) ? `
          <div class="flex gap-2 mt-2 flex-wrap">
            ${r.imageUrl && imgMediaIdx >= 0 ? `
              <img src="${BASE_URL}${r.imageUrl}"
                   class="review-card-media h-20 w-20 object-cover rounded-xl border
                          border-[#e5e7eb] cursor-pointer hover:opacity-90
                          hover:border-[#e39f32] transition-all"
                   data-media-idx="${imgMediaIdx}"
                   alt="Review image"
                   onerror="this.style.display='none'"/>
            ` : ""}
            ${r.videoUrl && vidMediaIdx >= 0 ? `
              <div class="review-card-media relative h-20 w-20 rounded-xl border
                          border-[#e5e7eb] overflow-hidden cursor-pointer
                          hover:border-[#e39f32] transition-all group"
                   data-media-idx="${vidMediaIdx}">
                <video src="${BASE_URL}${r.videoUrl}"
                       class="w-full h-full object-cover"
                       muted preload="metadata"></video>
                <div class="absolute inset-0 flex items-center justify-center
                            bg-black/40 group-hover:bg-black/50 transition-all">
                  <i class="fa-solid fa-play text-white text-base"></i>
                </div>
              </div>
            ` : ""}
          </div>` : ""}

      </div>`;
    });

    html += `</div>`; // close cards list

    sec.innerHTML = html;

    // Build and wire lightbox after DOM is ready
    if (mediaList.length > 0) {
      buildReviewLightbox(mediaList);
      wireReviewLightbox(mediaList);
    }
  }

  // ─── Lightbox builder ──────────────────────────────────────────────────────
  function buildReviewLightbox(mediaList) {
    // Remove stale instance if re-rendered
    document.getElementById("reviewLightbox")?.remove();

    const thumbsHTML = mediaList.map((item, idx) => {
      if (item.type === "video") {
        return `
        <div class="lb-thumb-wrap relative flex-shrink-0 h-12 w-12 rounded-lg overflow-hidden
                    cursor-pointer border-2 border-transparent hover:border-[#e39f32]
                    transition-all opacity-60"
             data-lb-idx="${idx}">
          <video src="${item.url}" class="w-full h-full object-cover"
                 muted preload="metadata"></video>
          <div class="absolute inset-0 flex items-center justify-center bg-black/40">
            <i class="fa-solid fa-play text-white text-[10px]"></i>
          </div>
        </div>`;
      }
      return `
      <img class="lb-thumb-wrap flex-shrink-0 h-12 w-12 object-cover rounded-lg
                  cursor-pointer border-2 border-transparent hover:border-[#e39f32]
                  transition-all opacity-60"
           src="${item.url}"
           data-lb-idx="${idx}"
           onerror="this.style.display='none'"/>`;
    }).join("");

    document.body.insertAdjacentHTML("beforeend", `
    <div id="reviewLightbox"
         class="fixed inset-0 z-[9999] hidden items-center justify-center"
         style="background:rgba(0,0,0,0.92)">

      <!-- Close -->
      <button id="lbClose"
              class="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/10
                     hover:bg-white/25 flex items-center justify-center
                     transition text-white z-10">
        <i class="fa-solid fa-xmark text-lg"></i>
      </button>

      <!-- Prev -->
      <button id="lbPrev"
              class="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full
                     bg-white/10 hover:bg-white/25 flex items-center justify-center
                     transition text-white z-10">
        <i class="fa-solid fa-chevron-left"></i>
      </button>

      <!-- Next -->
      <button id="lbNext"
              class="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full
                     bg-white/10 hover:bg-white/25 flex items-center justify-center
                     transition text-white z-10">
        <i class="fa-solid fa-chevron-right"></i>
      </button>

      <!-- Content area -->
      <div class="flex flex-col items-center gap-4 w-full max-w-xl px-16"
           id="lbContentArea">

        <!-- Media display -->
        <div id="lbMediaWrap"
             class="w-full flex items-center justify-center"
             style="max-height:65vh">
          <!-- Swapped by renderLightboxSlide() -->
        </div>

        <!-- Reviewer + counter -->
        <div class="text-center">
          <p id="lbReviewerName"
             class="text-white text-sm font-lexend font-medium"></p>
          <p id="lbCounter"
             class="text-white/50 text-xs font-lexend mt-0.5"></p>
        </div>

        <!-- Thumb strip inside lightbox -->
        <div id="lbThumbStrip"
             class="flex gap-2 overflow-x-auto max-w-full pb-1"
             style="scrollbar-width:thin;scrollbar-color:#e39f32 transparent">
          ${thumbsHTML}
        </div>

      </div>
    </div>`);
  }

  // ─── Lightbox wiring ───────────────────────────────────────────────────────
  function wireReviewLightbox(mediaList) {
    if (!mediaList.length) return;

    let currentIdx = 0;

    // ── Open / close ─────────────────────────────────────────────────────────
    function openLightbox(idx) {
      currentIdx = Math.max(0, Math.min(idx, mediaList.length - 1));
      const lb = document.getElementById("reviewLightbox");
      lb.classList.remove("hidden");
      lb.classList.add("flex");
      document.body.style.overflow = "hidden";
      renderSlide();
    }

    function closeLightbox() {
      const lb = document.getElementById("reviewLightbox");
      // Pause any playing video before closing
      lb.querySelector("video")?.pause();
      lb.classList.add("hidden");
      lb.classList.remove("flex");
      document.body.style.overflow = "";
    }

    // ── Render current slide ──────────────────────────────────────────────────
    function renderSlide() {
      const item = mediaList[currentIdx];
      const wrap = document.getElementById("lbMediaWrap");
      const nameEl = document.getElementById("lbReviewerName");
      const counterEl = document.getElementById("lbCounter");

      if (!wrap) return;

      // Pause any existing video before swapping
      wrap.querySelector("video")?.pause();

      // Swap media element
      if (item.type === "video") {
        wrap.innerHTML = `
        <video src="${item.url}"
               controls
               autoplay
               class="max-h-[65vh] max-w-full rounded-xl outline-none"
               style="background:#000">
        </video>`;
      } else {
        wrap.innerHTML = `
        <img src="${item.url}"
             alt="Review photo"
             class="max-h-[65vh] max-w-full object-contain rounded-xl"
             onerror="this.alt='Image unavailable'"/>`;
      }

      // Meta
      if (nameEl) nameEl.textContent = item.customerName;
      if (counterEl) counterEl.textContent = `${currentIdx + 1} / ${mediaList.length}`;

      // Sync thumb strip
      document.querySelectorAll(".lb-thumb-wrap").forEach((t, i) => {
        const isActive = i === currentIdx;
        t.classList.toggle("border-[#e39f32]", isActive);
        t.classList.toggle("opacity-100", isActive);
        t.classList.toggle("opacity-60", !isActive);
      });

      // Scroll active thumb into view
      document.querySelector(`.lb-thumb-wrap[data-lb-idx="${currentIdx}"]`)
        ?.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });

      // Prev / next visibility
      const prev = document.getElementById("lbPrev");
      const next = document.getElementById("lbNext");
      if (prev) prev.style.visibility = currentIdx === 0 ? "hidden" : "visible";
      if (next) next.style.visibility = currentIdx === mediaList.length - 1 ? "hidden" : "visible";
    }

    // ── Strip clicks (top media strip in review section) ─────────────────────
    document.querySelectorAll(".review-strip-media").forEach((el) => {
      el.addEventListener("click", () => openLightbox(parseInt(el.dataset.mediaIdx)));
    });

    // ── Per-card media clicks ─────────────────────────────────────────────────
    document.querySelectorAll(".review-card-media").forEach((el) => {
      el.addEventListener("click", () => openLightbox(parseInt(el.dataset.mediaIdx)));
    });

    // ── Lightbox controls ─────────────────────────────────────────────────────
    document.getElementById("lbClose")
      ?.addEventListener("click", closeLightbox);

    document.getElementById("lbPrev")
      ?.addEventListener("click", () => {
        if (currentIdx > 0) { currentIdx--; renderSlide(); }
      });

    document.getElementById("lbNext")
      ?.addEventListener("click", () => {
        if (currentIdx < mediaList.length - 1) { currentIdx++; renderSlide(); }
      });

    // ── Lightbox thumb strip ──────────────────────────────────────────────────
    document.getElementById("lbThumbStrip")
      ?.addEventListener("click", (e) => {
        const thumb = e.target.closest(".lb-thumb-wrap");
        if (thumb) openLightbox(parseInt(thumb.dataset.lbIdx));
      });

    // ── Backdrop click → close ────────────────────────────────────────────────
    document.getElementById("reviewLightbox")
      ?.addEventListener("click", (e) => {
        if (e.target.id === "reviewLightbox") closeLightbox();
      });

    // ── Keyboard nav ──────────────────────────────────────────────────────────
    document.addEventListener("keydown", (e) => {
      if (document.getElementById("reviewLightbox")?.classList.contains("hidden")) return;
      if (e.key === "ArrowLeft" && currentIdx > 0) { currentIdx--; renderSlide(); }
      if (e.key === "ArrowRight" && currentIdx < mediaList.length - 1) { currentIdx++; renderSlide(); }
      if (e.key === "Escape") closeLightbox();
    });
  }

  // ═══════════════════════════════════════════════════════════════════════════
  //  END PATCH 3
  // ═══════════════════════════════════════════════════════════════════════════





  //============================================================//
  //================ PATCH FUNCTIONS ADDED =====================//
  //============================================================//

  // ─── SEO URL PARSER ───────────────────────────────────────────────────────────
  function parseSEOURL() {
    const pathname = window.location.pathname;
    const searchParams = new URLSearchParams(window.location.search);

    // Extract ID from query params (always reliable)
    let productId = parseInt(searchParams.get('id')) || 0;

    // If no ID in query params, try to extract from path
    if (!productId) {
      const pathMatch = pathname.match(/\/products\/[^\/]+\/[^\/]+\/[^\/]+/);
      if (pathMatch) {
        const idFromQuery = searchParams.get('id');
        if (idFromQuery) productId = parseInt(idFromQuery);
      }
    }

    // Extract SEO data for meta tags
    const seoData = {
      brand: searchParams.get('brand') || extractFromPath(pathname, 1),
      category: searchParams.get('category') || extractFromPath(pathname, 2),
      product: searchParams.get('product') || extractFromPath(pathname, 3),
      sku: searchParams.get('sku'),
      variant: searchParams.get('variant')
    };

    function extractFromPath(path, index) {
      const parts = path.split('/').filter(p => p && p !== 'products');
      return parts[index] || '';
    }

    return { productId, seoData };
  }

  // ─── UPDATE SEO META TAGS ─────────────────────────────────────────────────────
  function updateSEOMetaTags(productData, seoData) {
    if (!productData) return;

    // Build clean title
    let title = `${productData.brandName} ${productData.productName}`;
    if (seoData.variant) {
      const variantName = seoData.variant.replace(/-/g, ' ');
      title += ` - ${variantName}`;
    }
    title += ` | Buy Online at Best Price in India`;
    document.title = title;

    // Meta description
    let metaDesc = document.querySelector('meta[name="description"]');
    if (!metaDesc) {
      metaDesc = document.createElement('meta');
      metaDesc.name = 'description';
      document.head.appendChild(metaDesc);
    }
    const price = productData.currentSellingPrice;
    const discount = productData.currentMrpPrice > price ?
      `${Math.round(((productData.currentMrpPrice - price) / productData.currentMrpPrice) * 100)}% off` : '';
    metaDesc.content = `Buy ${productData.brandName} ${productData.productName} online at best price. ${discount}. Free shipping. COD available. Shop now!`;

    // Meta keywords
    let metaKeywords = document.querySelector('meta[name="keywords"]');
    if (!metaKeywords) {
      metaKeywords = document.createElement('meta');
      metaKeywords.name = 'keywords';
      document.head.appendChild(metaKeywords);
    }
    const keywords = [
      productData.brandName,
      productData.productName,
      productData.productCategory,
      productData.productSubCategory,
      ...(productData.globalTags || [])
    ].filter(Boolean).join(', ');
    metaKeywords.content = keywords;

    // Canonical URL
    let canonical = document.querySelector('link[rel="canonical"]');
    if (!canonical) {
      canonical = document.createElement('link');
      canonical.rel = 'canonical';
      document.head.appendChild(canonical);
    }
    const canonicalUrl = `${window.location.origin}${window.location.pathname}?id=${productData.productId}`;
    canonical.href = canonicalUrl;

    // Open Graph tags
    let ogTitle = document.querySelector('meta[property="og:title"]');
    if (!ogTitle) {
      ogTitle = document.createElement('meta');
      ogTitle.setAttribute('property', 'og:title');
      document.head.appendChild(ogTitle);
    }
    ogTitle.setAttribute('content', title);

    let ogUrl = document.querySelector('meta[property="og:url"]');
    if (!ogUrl) {
      ogUrl = document.createElement('meta');
      ogUrl.setAttribute('property', 'og:url');
      document.head.appendChild(ogUrl);
    }
    ogUrl.setAttribute('content', canonicalUrl);
  }

  // ─── EXTRACT SEO PARAMETERS FROM URL ─────────────────────────────────────────
  function getSEOParameters() {
    const searchParams = new URLSearchParams(window.location.search);
    return {
      brand: searchParams.get('seo_brand'),
      product: searchParams.get('seo_product'),
      sku: searchParams.get('seo_sku'),
      variant: searchParams.get('seo_variant')
    };
  }



  // ─── GENERATE SEO URL FOR PRODUCT ────────────────────────────────────────────
  // function generateProductSEOUrl(product) {
  //     if (!product) return null;

  //     const brandSlug = slugify(product.brandName || "artezo");
  //     const productSlug = slugify(product.productName || "product");
  //     const sku = product.currentSku || `PROD-${product.productPrimeId}`;

  //     return `/product/${brandSlug}/${productSlug}/${sku}`;
  // }

  function generateProductSEOUrl(product) {
    if (!product) return null;

    const brandSlug = slugify(product.brandName || "artezo");
    const categorySlug = slugify(product.productCategory || "products");

    let cleanName = product.productName || "product";
    if (cleanName.toLowerCase().startsWith((product.brandName || "").toLowerCase())) {
      cleanName = cleanName.substring((product.brandName || "").length).trim();
    }
    // const productSlug = slugify(cleanName || product.productName);
    const sku = product.currentSku || `PROD-${product.productPrimeId}`;

    // Use file path so it works on Live Server + Hostinger without extra rewrite rules
    return `/products/product-detail.html?id=${product.productPrimeId}&sku=${sku}&brand=${brandSlug}&category=${categorySlug}`;
  }


  // ─── SLUGIFY HELPER (same as homeCategory) ───────────────────────────────────
  function slugify(text) {
    if (!text) return "product";
    return text
      .toString()
      .toLowerCase()
      .trim()
      .replace(/\s+/g, '-')
      .replace(/[^\w\-]+/g, '')
      .replace(/\-\-+/g, '-')
      .replace(/^-+/, '')
      .replace(/-+$/, '');
  }


  // ─── SEO URL PARSER ───────────────────────────────────────────────────────────
  function parseSEOUrdAndGetProductId() {
    const pathname = window.location.pathname;
    const searchParams = new URLSearchParams(window.location.search);

    // NEW FORMAT: /product/{id}/{brand}/{product-name}
    const seoMatch = pathname.match(/\/product\/(\d+)\/([^\/]+)\/([^\/]+)/);

    if (seoMatch) {
      const productId = parseInt(seoMatch[1]);
      const brandSlug = seoMatch[2];
      const productSlug = seoMatch[3];
      const variantId = searchParams.get('variant');

      console.log("[ProductDetail] SEO URL with ID detected:", { productId, brandSlug, productSlug, variantId });

      // Store for potential URL update later
      window.seoInfo = {
        productId: productId,
        brandSlug: brandSlug,
        // productSlug: productSlug,
        variantId: variantId
      };

      return productId;  // ← Return the ID directly!
    }

    // OLD FORMAT: ?id=123
    const id = parseInt(searchParams.get("id")) || 0;
    if (id) {
      console.log("[ProductDetail] Legacy URL detected with ID:", id);
      return id;
    }

    return 0;
  }

  // ─── FETCH PRODUCT BY SKU (for SEO URLs) ──────────────────────────────────────
  async function fetchProductBySKU(sku, variantId) {
    try {
      console.log("[ProductDetail] Fetching product by SKU:", sku);

      // Try multiple API endpoints
      let response = null;

      // Try 1: Direct SKU endpoint
      try {
        const res = await fetch(`${BASE_URL}/api/products/get-by-sku/${encodeURIComponent(sku)}`, {
          method: "GET",
          headers: { "Content-Type": "application/json" },
        });
        if (res.ok) response = res;
      } catch (e) { console.log("SKU endpoint failed, trying alternative..."); }

      // Try 2: Search by SKU as parameter
      if (!response) {
        const res = await fetch(`${BASE_URL}/api/products/search?sku=${encodeURIComponent(sku)}`, {
          method: "GET",
          headers: { "Content-Type": "application/json" },
        });
        if (res.ok) response = res;
      }

      // Try 3: Get all products and filter (fallback)
      if (!response) {
        console.log("Trying fallback: fetch all products and filter by SKU");
        const res = await fetch(`${BASE_URL}/api/products/get-all-active-products?page=0&size=100`, {
          method: "GET",
          headers: { "Content-Type": "application/json" },
        });
        if (res.ok) {
          const allProducts = await res.json();
          const content = allProducts.content || allProducts.data || [];
          const foundProduct = content.find(p =>
            p.currentSku === sku ||
            p.sku === sku ||
            p.productStrId === sku
          );
          if (foundProduct) {
            rawProduct = foundProduct;
            buildSafeProductData(rawProduct);
            if (variantId && rawProduct.availableVariants) {
              const targetVariant = rawProduct.availableVariants.find(v =>
                v.variantId === variantId || v.sku === variantId
              );
              if (targetVariant) currentVariant = targetVariant;
            }
            renderPage();
            updateCanonicalURL(sku, variantId);
            return;
          }
        }
      }

      if (!response || !response.ok) {
        throw new Error(`Product not found with SKU: ${sku}`);
      }

      rawProduct = await response.json();
      buildSafeProductData(rawProduct);

      if (variantId && rawProduct.availableVariants) {
        const targetVariant = rawProduct.availableVariants.find(v =>
          v.variantId === variantId || v.sku === variantId
        );
        if (targetVariant) currentVariant = targetVariant;
      }

      renderPage();
      updateCanonicalURL(sku, variantId);

    } catch (err) {
      console.error("[ProductDetail] SKU fetch error:", err);
      showFatalError(`Product not found. Please check the link or try again. (SKU: ${sku})`);
    }
  }


  // ─── UPDATE CANONICAL URL ─────────────────────────────────────────────────────
  function updateCanonicalURL(sku, variantId) {
    let canonicalUrl = window.location.origin + window.location.pathname;

    // Remove any existing canonical link
    const existingCanonical = document.querySelector('link[rel="canonical"]');
    if (existingCanonical) {
      existingCanonical.remove();
    }

    // Create new canonical link
    const canonicalLink = document.createElement('link');
    canonicalLink.rel = 'canonical';
    canonicalLink.href = canonicalUrl;
    document.head.appendChild(canonicalLink);

    // Also update Open Graph URL
    const ogUrl = document.querySelector('meta[property="og:url"]');
    if (ogUrl) {
      ogUrl.setAttribute('content', canonicalUrl);
    } else {
      const meta = document.createElement('meta');
      meta.setAttribute('property', 'og:url');
      meta.setAttribute('content', canonicalUrl);
      document.head.appendChild(meta);
    }
  }

  // ADD this new function:
  // FIND the entire rewriteURLToSEO function and REPLACE WITH:
  function rewriteURLToSEO(variantSku) {
    if (!safeProductData) return;

    const baseSku = safeProductData.currentSku || null;

    // Keep the REAL file path — no fake /products/ path that breaks refresh
    // and relative links. Only update query params for SEO signals.
    const params = new URLSearchParams({
      id: safeProductData.productId,
      sku: baseSku,
      brand: slugify(safeProductData.brandName),
      category: slugify(safeProductData.productCategory || "products"),
      // product: slugify(safeProductData.productName),
    });

    if (variantSku !== null) {
      params.set("variant", variantSku);
    }

    // Result: /Product-Details/product-detail.html?id=1&sku=ART-WPLATE-GLD&brand=artezo&...
    const newURL = `/products/product-detail.html?${params.toString()}`;
    history.replaceState({ productId: safeProductData.productId }, document.title, newURL);
    console.log("[ProductDetail] URL updated to:", newURL);
  }

  //================ Update meta tags for SEO =====================//

  function addStructuredData() {
    // Remove existing structured data
    const existingScript = document.querySelector('script[type="application/ld+json"]');
    if (existingScript) existingScript.remove();

    const structuredData = {
      "@context": "https://schema.org/",
      "@type": "Product",
      "name": safeProductData.productName,
      "image": safeProductData.mainImage,
      "description": safeProductData.aboutItem?.join(' ') || '',
      "sku": safeProductData.currentSku,
      "mpn": safeProductData.productStrId,
      "brand": {
        "@type": "Brand",
        "name": safeProductData.brandName
      },
      "offers": {
        "@type": "Offer",
        "url": window.location.href,
        "priceCurrency": "INR",
        "price": safeProductData.currentSellingPrice,
        "priceValidUntil": new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        "availability": safeProductData.currentStock > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
        "seller": {
          "@type": "Organization",
          "name": "Artezo"
        }
      },
      "aggregateRating": {
        "@type": "AggregateRating",
        "ratingValue": "4.5",
        "reviewCount": safeProductData.productReviews?.length || 50
      }
    };

    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.textContent = JSON.stringify(structuredData);
    document.head.appendChild(script);
  }


  //============================================//
  //================ PATCH END =================//
  //============================================//

  // ─── READ PRODUCT ID FROM URL ──────────────────────────────────────────────
  const urlParams = new URLSearchParams(window.location.search);
  const productPrimeId = parseInt(urlParams.get("id")) || 0;

  // ─── STATE ─────────────────────────────────────────────────────────────────
  let rawProduct = null;
  let safeProductData = null;
  let currentVariant = null;
  let transformedData = null;

  let currentCustomFields = {};
  let customFieldValues = {};


  // ─── INIT ──────────────────────────────────────────────────────────────────

  document.addEventListener("DOMContentLoaded", function () {

    const searchParams = new URLSearchParams(window.location.search);

    // Always read ?id= — works for both the real .html path and the SEO pretty URL
    const productId = parseInt(searchParams.get("id")) || 0;

    // Stash incoming SEO params so renderPage() can use them for meta tags
    window.currentSEOData = {
      brand: searchParams.get("brand") || "",
      category: searchParams.get("category") || "",
      product: searchParams.get("product") || "",
      sku: searchParams.get("sku") || "",
      variant: searchParams.get("variant") || "",
    };

    console.log("[ProductDetail] productId:", productId, "| seoData:", window.currentSEOData);

    if (productId > 0) {
      fetchProductFromAPI(productId);
    } else {
      showFatalError("No product found. Please check the link and try again.");
    }
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

      // If URL has ?variant=SKU, pre-select that variant before rendering
      const variantSkuFromUrl = new URLSearchParams(window.location.search).get("variant");
      if (variantSkuFromUrl && safeProductData.availableVariants?.length) {
        const match = safeProductData.availableVariants.find(
          v => v.sku === variantSkuFromUrl || v.variantId === variantSkuFromUrl
        );
        if (match) {
          currentVariant = match;
          console.log("[ProductDetail] Pre-selected variant from URL:", match.sku);
        }
      }

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

  //=======================================//
  //  Bought togather cart api
 //=======================================//
  async function apiAddMultipleToCart(payload) {
    const res = await fetch(`${BASE_URL}/api/v1/cart/add-multiple`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
  }

  async function loadCartItems() {
    let userId = localStorage.getItem("userId") || sessionStorage.getItem("userId");
    if (!userId) return;
    try {
      const res = await fetch(`${BASE_URL}/api/v1/cart?userId=${userId}`);
      if (!res.ok) return;
      const data = await res.json();
      if (!data.success || !data.data?.items) return;
      data.data.items.forEach(item => {
        if (item.productId) addedToCartSet.add(Number(item.productId));
      });
    } catch (err) {
      console.warn("[Cart] loadCartItems failed:", err);
    }
  }

  async function loadWishlistItems() {
    const userId = localStorage.getItem("userId") || sessionStorage.getItem("userId");
    if (!userId) return;
    try {
      const res = await fetch(`${BASE_URL}/api/v1/wishlist?userId=${userId}`);
      if (!res.ok) return;
      const data = await res.json();
      if (!data.success || !data.data?.items) return;
      data.data.items.forEach(item => {
        if (item.productId) addedToWishlistSet.add(Number(item.productId));
      });
    } catch (err) {
      console.warn("[Wishlist] loadWishlistItems failed:", err);
    }
  }

  function syncCardWishlistStates() {
    document.querySelectorAll(".product-card-clickable").forEach(card => {
      const pid = parseInt(card.dataset.productId);
      if (!pid) return;
      const btn = card.querySelector(".wishlist-icon-btn");
      const icon = btn?.querySelector("i");
      if (!btn || !icon) return;

      if (addedToWishlistSet.has(pid)) {
        icon.className = "fa-solid fa-heart text-red-500 text-xs";
        btn.classList.add("wishlisted");
      } else {
        icon.className = "fa-regular fa-heart text-[#1D3C4A] text-xs";
        btn.classList.remove("wishlisted");
      }
    });
  }

  async function apiAddToWishlist(payload) {
    const res = await fetch(`${BASE_URL}/api/v1/wishlist/add`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const text = await res.text();
    try { return text ? JSON.parse(text) : {}; } catch (_) { return {}; }
  }

  // ── PATCH: Wishlist icon sync ────────────────────────────────────────────────
  async function initWishlistIcon() {
    const btn = document.querySelector(".wishlist-icon-btn");
    if (!btn) return;

    // ── Resolve userId ─────────────────────────────────────────────────────────
    let userId = localStorage.getItem("userId") || sessionStorage.getItem("userId");
    if (!userId) {
      const rawUser = localStorage.getItem("user") || sessionStorage.getItem("user");
      if (rawUser) {
        try { const p = JSON.parse(rawUser); userId = p?.userId || p?.id || null; } catch (_) { }
      }
    }

    const productId = safeProductData?.productPrimeId
      || safeProductData?.productId
      || safeProductData?.id;

    if (!userId || !productId) return;

    // ── Check current wishlist state on load ───────────────────────────────────
    try {
      const res = await fetch(`${BASE_URL}/api/v1/wishlist/check?userId=${userId}&productId=${productId}`);
      if (res.ok) {
        const json = await res.json();
        setWishlistIcon(btn, json?.data === true);

        // dispatchWishlistEvent();

      }
    } catch (e) {
      console.warn("[Wishlist] Check failed:", e);
    }

    // ── Click: toggle add / remove ─────────────────────────────────────────────
    // ── Click: toggle add / remove ─────────────────────────────────────────────
    let wishlistBusy = false;
    btn.addEventListener("click", async (e) => {
      e.stopImmediatePropagation(); // block any other listener on this btn
      if (wishlistBusy) return;
      wishlistBusy = true;
      const isWishlisted = btn.classList.contains("wishlisted");

      if (isWishlisted) {
        // ── REMOVE ─────────────────────────────────────────────────────────────
        try {
          const variantId = getSelectedVariant()?.variantId || null;
          let url = `${BASE_URL}/api/v1/wishlist/remove?userId=${userId}&productId=${productId}`;
          if (variantId) url += `&variantId=${variantId}`;

          const res = await fetch(url, { method: "DELETE" });
          if (res.ok) {
            setWishlistIcon(btn, false);
            showToast("Removed from wishlist", "info");
            // Sync header wishlist count
            // document.dispatchEvent(new CustomEvent("wishlist:updated"));
            // window.dispatchEvent(new CustomEvent('wishlist:updated')); // ← ADD

            dispatchWishlistEvent();

          } else {
            showToast("Failed to remove from wishlist", "error");
          }
        } catch (e) {
          console.warn("[Wishlist] Remove failed:", e);
          showToast("Something went wrong", "error");
        } finally {
          wishlistBusy = false;
        }

      } else {
        // ── ADD ────────────────────────────────────────────────────────────────
        try {
          const variantId = getSelectedVariant()?.variantId || null;
          const params = new URLSearchParams({ userId, productId });
          if (variantId) params.append("variantId", variantId);

          const addUrl = `${BASE_URL}/api/v1/wishlist/add`;
          console.log("[Wishlist] ADD url:", addUrl);

          const selectedVariant = getSelectedVariant();
          const sellingPrice = selectedVariant?.price
            || safeProductData?.currentSellingPrice
            || null;
          const mrpPrice = selectedVariant?.mrp
            || safeProductData?.currentMrpPrice
            || null;

          //  const selectedVariant = getSelectedVariant();

          const body = {
            userId: Number(userId),
            productId: Number(productId),
            wishlistName: "My Wishlist",
            wishlistedPrice: selectedVariant?.price ?? safeProductData?.currentSellingPrice ?? null,
            mrpPrice: selectedVariant?.mrp ?? safeProductData?.currentMrpPrice ?? null,
            sku: selectedVariant?.sku || safeProductData?.currentSku || null,
            selectedColor: selectedVariant?.color || safeProductData?.selectedColor || null,
            selectedSize: selectedVariant?.size || null,
            titleName: selectedVariant?.titleName || safeProductData?.productName || null,
            productName: safeProductData?.productName || null,
            variantId: selectedVariant?.variantId || null
          };

          const res = await fetch(addUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body)
          });

          if (res.ok) {
            setWishlistIcon(btn, true);
            showToast("Added to wishlist", "success");
            console.log("[Wishlist] Dispatching wishlist:updated after ADD");
            window.dispatchEvent(new CustomEvent("wishlist:updated"));
          } else {
            const errText = await res.text();
            console.warn("[Wishlist] ADD failed:", res.status, errText);
            showToast("Failed to add to wishlist", "error");
          }
        } catch (e) {
          console.warn("[Wishlist] Add failed:", e);
          showToast("Something went wrong", "error");
        } finally {
          wishlistBusy = false;
        }
      }
    });
  }

  function setWishlistIcon(btn, isWishlisted) {
    const icon = btn.querySelector("i");
    if (!icon) return;
    if (isWishlisted) {
      icon.classList.remove("fa-regular");
      icon.classList.add("fa-solid");
      icon.style.color = "#e53e3e";
      btn.classList.add("wishlisted");
    } else {
      icon.classList.remove("fa-solid");
      icon.classList.add("fa-regular");
      icon.style.color = "";
      btn.classList.remove("wishlisted");
    }
  }
  // ── END PATCH ────────────────────────────────────────────────────────────────


  /**
   * Confirm Buy Now order after Shiprocket checkout callback.
   * Calls POST /api/orders/confirm-buynow with X-User-Id header.
   */
  async function apiConfirmBuyNow(payload) {
    log.debug("API Call: POST /api/orders/confirm-buynow");
    log.debug("Headers: X-User-Id = {}", USER_ID);
    log.debug("Payload: {}", JSON.stringify(payload, null, 2));

    try {
      const res = await fetch(`${BASE_URL}/api/orders/confirm-buynow`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-User-Id": USER_ID,
        },
        body: JSON.stringify(payload),
      });

      log.debug("API Response status: {}", res.status);

      if (!res.ok) {
        const errBody = await res.text().catch(() => "");
        log.error("API Error: {}", errBody);
        throw new Error(`HTTP ${res.status} — ${errBody}`);
      }

      const data = await res.json();
      log.info("✅ API call successful");
      log.debug("Response data: {}", data);

      return data;
    } catch (err) {
      log.error("❌ API call failed: {}", err.message);
      throw err;
    }
  }

  /**
   * Fetch addon products for "Bought Together".
   * Each product can have multiple addonKeys — we fire one request per unique key
   * and deduplicate by productPrimeId.
   */
  async function fetchAddonProducts(addonKeys) {
    if (!addonKeys || !addonKeys.length) return [];

    const seen = new Set();
    const results = [];

    await Promise.all(
      addonKeys.map(async (key) => {
        try {
          const res = await fetch(
            `${BASE_URL}/api/products/get-by-addon?addonKey=${encodeURIComponent(key)}&page=0&size=5`,
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
        productId: productId,
        category: category || "",
        subCategory: subCategory || "",
        userId: userId,
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
      variantId: v.variantId,
      color: v.color || "Default",
      sku: v.sku || null,
      price: v.price || productFallback.currentSellingPrice,
      mrp: v.mrp || productFallback.currentMrpPrice,
      stock: v.stock ?? productFallback.currentStock,
      // ── Media ──────────────────────────────────────────────────────────────
      // Variant mainImage: use variant's own, fall back to product mainImage, then fallback img
      mainImage: absUrl(v.mainImage) || absUrl(productFallback.mainImage) || FALLBACK_IMG,
      // Variant mockups: use variant's own array; null/empty → inherit product-level mockups
      mockupImages: Array.isArray(v.mockupImages) && v.mockupImages.length
        ? v.mockupImages.map((m) => absUrl(m)).filter(Boolean)
        : null,   // null = "inherit from product" — resolved in getVariantMedia()
      // Variant video (not in payload today but structurally supported)
      productVideoUrl: absUrl(v.productVideoUrl) || null,
      // ── Meta ───────────────────────────────────────────────────────────────
      size: v.size || "Standard",
      sizes: v.size ? [v.size] : [],
      titleName: v.titleName || v.color || "Default",
      name: v.productName || v.color || "Default",
      weight: v.weight,
      length: v.length,
      breadth: v.breadth,
      height: v.height,
      mfgDate: v.mfgDate,
    };
  }



  // PATCH 4 — Media resolver with proper merge logic
  // Rule: variant mainImage null → use product mainImage
  // Rule: mockups = variant mockups first, then product mockups (deduped)
  function getVariantMedia(variant) {
    if (!variant) return {
      mainImage: safeProductData?.mainImage || FALLBACK_IMG,
      mockupImages: safeProductData?.mockupImages || [],
      productVideoUrl: safeProductData?.productVideoUrl || null,
    };

    // Resolve main image
    const mainImage = variant.mainImage || safeProductData?.mainImage || FALLBACK_IMG;

    // Merge mockups: variant first, then product-level, deduped by URL
    const variantMockups = Array.isArray(variant.mockupImages) ? variant.mockupImages : [];
    const productMockups = safeProductData?.mockupImages || [];
    const seen = new Set();
    const mergedMockups = [];
    [...variantMockups, ...productMockups].forEach((url) => {
      if (url && !seen.has(url)) { seen.add(url); mergedMockups.push(url); }
    });

    return {
      mainImage,
      mockupImages: mergedMockups,
      productVideoUrl: variant.productVideoUrl || safeProductData?.productVideoUrl || null,
    };
  } 
  // END PATCH 4 media resolver

  function buildSafeProductData(p) {

    let customFields = [];

    let frameCount = null;
    let frameStructure = null;

    if (p.customFields) {
      try {
        const parsed = JSON.parse(p.customFields);

        // ── DEBUG LOG 1: raw parsed object ──────────────────────────────
        console.log("[DEBUG-1] parsed type:", typeof parsed);
        console.log("[DEBUG-2] is Array?:", Array.isArray(parsed));
        console.log("[DEBUG-3] parsed object:", parsed);
        // ────────────────────────────────────────────────────────────────

        if (Array.isArray(parsed)) {
          customFields = parsed;
          frameCount = null;
          frameStructure = null;

        } else if (parsed && typeof parsed === "object") {

          // ── DEBUG LOG 2: object keys and values ──────────────────────
          console.log("[DEBUG-4] object keys:", Object.keys(parsed));
          console.log("[DEBUG-5] parsed.frameCount:", parsed.frameCount);
          console.log("[DEBUG-6] parsed.frameCount type:", typeof parsed.frameCount);
          console.log("[DEBUG-7] parsed.frameStructure:", parsed.frameStructure);
          console.log("[DEBUG-8] parsed.fields length:", parsed.fields?.length);
          // ─────────────────────────────────────────────────────────────

          frameCount = parsed.frameCount || null;
          frameStructure = parsed.frameStructure || null;
          customFields = Array.isArray(parsed.fields) ? parsed.fields : [];

          // ── DEBUG LOG 3: after assignment ────────────────────────────
          console.log("[DEBUG-9] frameCount assigned:", frameCount);
          console.log("[DEBUG-10] frameStructure assigned:", frameStructure);
          // ─────────────────────────────────────────────────────────────
        }

      } catch (e) {
        console.warn("[ProductDetail] customFields parse error:", e);
      }
    }

    // ── 1. Normalise API variants first ───────────────────────────────────
    const variants = (p.availableVariants || []).map((v) =>
      normaliseVariant(v, p)
    );

    // ── 2. PATCH 4 — Synthesize base product as first variant ─────────────
    // Must be declared BEFORE safeProductData assignment so [baseVariant, ...variants]
    // reference below is valid. Base uses root-level product fields.
    const baseVariant = {
      variantId: p.variantId || null,
      color: p.selectedColor || "Default",
      sku: p.currentSku,
      price: p.currentSellingPrice,
      mrp: p.currentMrpPrice,
      stock: p.currentStock || 0,
      mainImage: absUrl(p.mainImage) || FALLBACK_IMG,
      mockupImages: null,                               // null = inherit product-level mockups
      productVideoUrl: absUrl(p.productVideoUrl) || null,
      size: p.productSize || "",
      sizes: p.productSize ? [p.productSize] : [],
      titleName: p.productName || "Artezo Product",
      name: p.selectedColor || "Default",
      weight: p.weight,
      length: p.length,
      breadth: p.breadth,
      height: p.height,
      mfgDate: null,
      isBase: true,
    };

    // ── 3. Full variant list = base first, then API variants ──────────────
    const allVariants = [baseVariant, ...variants];

    // ── 4. Build remaining data needed for safeProductData ────────────────
    const heroBanners = (p.heroBanners || []).map((b) => ({
      bannerId: b.bannerId,
      bannerImg: absUrl(b.bannerImg),
      imgDescription: b.imgDescription || "",
    }));

    const installationSteps = (p.installationSteps || []).map((s) => ({
      step: s.step,
      title: s.title,
      shortDescription: s.shortDescription,
      shortNote: s.shortNote,
      stepImage: absUrl(s.stepImage),
      videoUrl: absUrl(s.videoUrl),
    }));

    // Product-level mockups (fallback when variant has none)
    const mockupImages = (p.mockupImages || []).map((img) => absUrl(img)).filter(Boolean);

    const faqAns = p.faq || {};
    const availabeCoupons = p.availableCoupons || [];

    // ── 5. Assign safeProductData — baseVariant and allVariants are ready ─
    safeProductData = {
      productId: p.productPrimeId,
      productStrId: p.productStrId || String(p.productPrimeId),
      productName: p.productName,
      brandName: p.brandName || "Artezo",
      currentSku: p.currentSku,
      selectedColor: p.selectedColor || "",
      currentSellingPrice: p.currentSellingPrice,
      currentMrpPrice: p.currentMrpPrice,
      currentStock: p.currentStock || 0,
      mainImage: absUrl(p.mainImage) || FALLBACK_IMG,
      mockupImages,
      productVideoUrl: absUrl(p.productVideoUrl) || null,
      hero_banners: heroBanners,
      availableVariants: allVariants,          // base + API variants
      productSize: p.productSize || "",
      productReviews: p.productReviews || [],
      specifications: p.specifications || {},
      aboutItem: Array.isArray(p.aboutItem) ? p.aboutItem : [],
      description: Array.isArray(p.description) ? p.description : [],
      faqAns,
      additionalInfo: p.additionalInfo || {},
      installationSteps,
      availabeCoupons,
      isCustomizable: p.isCustomizable || false,
      customFields,

      // ── CUSTOMIZATION: Wire frame config ─────────────────────────────────
      // frameCount     : how many user photos this product needs
      //                  0 or null → no wire frame, just collect uploads silently
      //                  > 0       → show wire frame with live slot preview
      // frameStructure : how slots are arranged visually in the left panel
      //                  "grid-2"  → 2 slots side by side
      //                  "grid-3"  → 3 slots in a row
      //                  "grid-4"  → 2×2 grid
      //                  "stack-2" → 2 slots top/bottom
      //                  "single"  → 1 full-size slot
      //      null      → fallback to product image (no wire frame)
      frameCount,
      frameStructure,


      productCategory: p.productCategory,
      productSubCategory: p.productSubCategory,
      subcategory: p.productSubCategory,
      globalTags: p.globalTags || [],
      isExchange: p.isExchange,
      returnAvailable: p.returnAvailable,
      youtubeUrl: p.youtubeUrl || "",
      addonKeys: p.addonKeys || [],
      underTrendCategory: p.underTrendCategory || false,
      weight: p.weight,
      length: p.length,
      breadth: p.breadth,
      height: p.height,
      hsnCode: p.hsnCode,
      hasVariants: p.hasVariants,

    };

    // ── 6. Set initial active variant — always base first ─────────────────
    // currentVariant = allVariants[0];
        currentVariant = variants.length ? variants[0] : baseVariant;

    document.title = `Artezo · ${safeProductData.productName}`;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  //  RENDER PAGE
  // ═══════════════════════════════════════════════════════════════════════════

  function renderPage() {
    // Update SEO meta tags with the extracted data
    if (window.currentSEOData) {
      updateSEOMetaTags(safeProductData, window.currentSEOData);
    }

    //==== latest PATCH-1 =====//
    //Initialize lightbox
    initLightbox();
 
    // Store lightbox functions globally for onclick
    window.openLightbox = window.openLightbox || function () {};
    window.closeLightbox = window.closeLightbox || function () {};
    //==== latest patch end =======//


    // Rewrite browser URL to SEO format now that we have real product data.
    // Uses history.replaceState — no reload, back button still works.
    // The initial variant is the first variant's SKU (or null if no variants).
    const initialVariantSku = safeProductData.availableVariants?.[0]?.sku || null;
    rewriteURLToSEO(initialVariantSku);

    buildCompleteHTML();

   

    // === PATCH-2 Critical: Wait for DOM to be ready before building media gallery
    setTimeout(() => {
      const initialMedia = getVariantMedia(
        currentVariant || safeProductData.availableVariants[0],
      );
      buildMediaStrip(initialMedia); // ← Ensures desktop/mobile gallery initializes properly
 
      loadCartItems().then(() => {
        const pid = Number(safeProductData.productPrimeId);
        if (addedToCartSet.has(pid)) {
          document.querySelectorAll(".add-to-cart-btn").forEach((addBtn) => {
            addBtn.innerHTML = `<i class="fa-solid fa-bag-shopping"></i> <span class="text-sm whitespace-nowrap">Go to Cart</span>`;
            addBtn.style.background = "#e39f32";
            addBtn.style.color = "#1D3C4A";
            addBtn.style.fontWeight = "600";
            addBtn.style.borderColor = "#e39f32";
          });
        }
      });
 
      fillAccordion();
      fillInstallation();
      fillHeroBanner();
      fillStickyBar();
      setupEventListeners();
      initWishlistIcon();
 
      // Async fills
      fillBoughtTogether();
      fillRecentAndSuggestions();
      fillReviews();
 
      setTimeout(() => {
        setupVariantSelection();
        setupDynamicVariants();
 
        document
          .querySelectorAll(".add-to-cart-btn")
          .forEach((btn) => btn.addEventListener("click", handleAddToCart));
        
      // ── Buy Now event listener ──
      document.querySelectorAll(".buy-now-btn")
        .forEach((btn) => btn.addEventListener("click", handleBuyNow));
        
          document.querySelectorAll(".apply-coupon-btn").forEach((btn) =>
          btn.addEventListener("click", (e) => {
            e.preventDefault();
            const code = btn.dataset.couponCode;
            if (code) applyCoupon(code);
          }),
        );
      }, 100);
      
    }, 80); // Small delay ensures DOM elements exist

  }


  //====================================================//
  //      PATCH ADDED
  //=================================================/


  // ==================== SHARE FUNCTIONALITY ====================

  function setupShareFunctionality() {
    const shareButton = document.getElementById("shareButton");
    const sharePopup = document.getElementById("sharePopup");
 
    if (!shareButton || !sharePopup) return;
 
    // Get current product URL and details
    const currentUrl = window.location.href;
    const productName =
      safeProductData?.productName ||
      transformedData?.name ||
      "Check out this product";
    const productPrice = transformedData?.price
      ? `₹${transformedData.price}`
      : "";
    const productImage =
      transformedData?.mainImages?.[0]?.full ||
      safeProductData?.mainImage ||
      "";
 
    // Toggle popup
    shareButton.addEventListener("click", function (e) {
      e.stopPropagation();
      sharePopup.classList.toggle("hidden");
    });
 
    // Close popup when clicking outside
    document.addEventListener("click", function (e) {
      if (!shareButton.contains(e.target) && !sharePopup.contains(e.target)) {
        sharePopup.classList.add("hidden");
      }
    });
 
    // Handle share options
    document.querySelectorAll(".share-option").forEach((option) => {
      option.addEventListener("click", function (e) {
        e.stopPropagation();
        const shareType = this.dataset.shareType;
 
        switch (shareType) {
          case "link":
            copyToClipboard(currentUrl);
            showToast("Link copied to clipboard!", "success");
            break;
 
          case "email":
            const emailSubject = encodeURIComponent(`Check out ${productName}`);
            const emailBody = encodeURIComponent(
              `Hi,\n\nI thought you might be interested in this product:\n\n${productName}\n${productPrice ? `Price: ${productPrice}\n` : ""}${currentUrl}\n\nRegards`,
            );
            window.location.href = `mailto:?subject=${emailSubject}&body=${emailBody}`;
            break;
 
          case "whatsapp":
            const whatsappText = encodeURIComponent(
              `Check out ${productName}! ${productPrice ? `Price: ${productPrice} ` : ""}${currentUrl}`,
            );
            window.open(`https://wa.me/?text=${whatsappText}`, "_blank");
            break;
        }
 
        sharePopup.classList.add("hidden");
      });
    });
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
          <div class="px-4 py-2 text-center">
            <p class="text-sm tracking-[0.3em] text-gray-500 uppercase mb-4">
              ${escapeHtml(safeProductData.productCategory || "")}
            </p>
            <h1 class="text-3xl md:text-2xl font-zain font-semibold text-gray-900 leading-tight mb-4">
              ${escapeHtml(safeProductData.productName)}
            </h1>
          </div>
        </div>`;
    }
  }


  // ══════════════════════════════════════════════════════════════
  //  THUMBNAIL STRIP  —  shared builder used by both initial render + variant switch
  // 23/6 ---------------------- ui updates----------------------------
  //══════════════════════════════════════════════════════════════
 function buildMediaStrip(media) {
    const isMobile = window.innerWidth < 768;
 
    // Always cleanup previous state
    const displayArea = document.getElementById("mainDisplayArea");
    if (displayArea && !isMobile) {
      // Ensure main image exists for desktop
      if (!document.getElementById("mainProductImage")) {
        const img = document.createElement("img");
        img.id = "mainProductImage";
        img.className =
          "w-full h-full object-cover cursor-pointer transition-transform duration-300 hover:scale-105";
        img.onclick = () => window.openLightbox && window.openLightbox(0);
        displayArea.innerHTML = `<div class="relative w-full h-full overflow-hidden">${img.outerHTML}</div>`;
      }
    }
 
    if (isMobile) {
      buildMobileCarousel(media);
      return;
    }
 
    // Desktop logic...
    const desktopThumbContainer = document.getElementById("thumbContainer");
    const mainImg = document.getElementById("mainProductImage");
 
    if (!desktopThumbContainer || !mainImg) {
      console.warn("[Gallery] Desktop elements not found yet, retrying...");
      setTimeout(() => buildMediaStrip(media), 100);
      return;
    }
 
    // ... rest of your existing desktop code remains unchanged
 
    const mediaItems = [];
    mediaItems.push({ type: "image", url: media.mainImage || FALLBACK_IMG });
    if (media.productVideoUrl)
      mediaItems.push({ type: "video", url: media.productVideoUrl });
    (media.mockupImages || []).forEach((img) => {
      if (img) mediaItems.push({ type: "image", url: img });
    });
 
    /* Populate desktop vertical thumbs */
    desktopThumbContainer.innerHTML = mediaItems
      .map((item, idx) => {
        if (item.type === "video") {
          return `
                <div class="thumb-video-wrap relative w-full aspect-[4/3] rounded-2xl overflow-hidden border-2 cursor-pointer transition-all ${idx === 0 ? "border-[#e39f32]" : "border-transparent hover:border-[#e39f32]"}"
                     data-media-index="${idx}" data-media-type="video" data-media-url="${item.url}">
                  <video src="${item.url}" class="w-full h-full object-cover" muted preload="metadata"></video>
                  <div class="absolute inset-0 flex items-center justify-center bg-black/40">
                    <i class="fas fa-play text-white text-sm"></i>
                  </div>
                </div>`;
        }
        return `
            <img src="${item.url}"
                 data-media-index="${idx}" data-media-type="image" data-media-url="${item.url}"
                 class="w-full aspect-[4/3] object-cover rounded-sm cursor-pointer border-2 transition-all ${idx === 0 ? "border-[#e39f32]" : "border-transparent hover:border-[#e39f32]"}"/>`;
      })
      .join("");
 
    /* Set main image */
    setMainMedia(mediaItems[0], mainImg);
 
    /* Wire desktop thumb clicks — clean previous listeners if any */
    desktopThumbContainer
      .querySelectorAll("[data-media-index]")
      .forEach((thumb) => {
        // Remove old listeners to prevent duplicates
        const newThumb = thumb.cloneNode(true);
        thumb.parentNode.replaceChild(newThumb, thumb);
 
        newThumb.addEventListener("click", function () {
          const index = parseInt(this.dataset.mediaIndex);
          setMainMedia(mediaItems[index], mainImg);
          updateAllActiveStates(); // Ensure sync
        });
      });
  }


  // ══════════════════════════════════════════════════════════════
  //  THUMBNAIL STRIP  —  shared builder used by both initial render + variant switch
  // 23/6 ---------------------- ui updates----------------------------
  //══════════════════════════════════════════════════════════════
 function buildMediaStrip(media) {
    const isMobile = window.innerWidth < 768;
 
    // Always cleanup previous state
    const displayArea = document.getElementById("mainDisplayArea");
    if (displayArea && !isMobile) {
      // Ensure main image exists for desktop
      if (!document.getElementById("mainProductImage")) {
        const img = document.createElement("img");
        img.id = "mainProductImage";
        img.className =
          "w-full h-full object-cover cursor-pointer transition-transform duration-300 hover:scale-105";
        img.onclick = () => window.openLightbox && window.openLightbox(0);
        displayArea.innerHTML = `<div class="relative w-full h-full overflow-hidden">${img.outerHTML}</div>`;
      }
    }
 
    if (isMobile) {
      buildMobileCarousel(media);
      return;
    }
 
    // Desktop logic...
    const desktopThumbContainer = document.getElementById("thumbContainer");
    const mainImg = document.getElementById("mainProductImage");
 
    if (!desktopThumbContainer || !mainImg) {
      console.warn("[Gallery] Desktop elements not found yet, retrying...");
      setTimeout(() => buildMediaStrip(media), 100);
      return;
    }
 
    // ... rest of your existing desktop code remains unchanged
 
    const mediaItems = [];
    mediaItems.push({ type: "image", url: media.mainImage || FALLBACK_IMG });
    if (media.productVideoUrl)
      mediaItems.push({ type: "video", url: media.productVideoUrl });
    (media.mockupImages || []).forEach((img) => {
      if (img) mediaItems.push({ type: "image", url: img });
    });
 
    /* Populate desktop vertical thumbs */
    desktopThumbContainer.innerHTML = mediaItems
      .map((item, idx) => {
        if (item.type === "video") {
          return `
                <div class="thumb-video-wrap relative w-full aspect-[4/3] rounded-2xl overflow-hidden border-2 cursor-pointer transition-all ${idx === 0 ? "border-[#e39f32]" : "border-transparent hover:border-[#e39f32]"}"
                     data-media-index="${idx}" data-media-type="video" data-media-url="${item.url}">
                  <video src="${item.url}" class="w-full h-full object-cover" muted preload="metadata"></video>
                  <div class="absolute inset-0 flex items-center justify-center bg-black/40">
                    <i class="fas fa-play text-white text-sm"></i>
                  </div>
                </div>`;
        }
        return `
            <img src="${item.url}"
                 data-media-index="${idx}" data-media-type="image" data-media-url="${item.url}"
                 class="w-full aspect-[4/3] object-cover rounded-sm cursor-pointer border-2 transition-all ${idx === 0 ? "border-[#e39f32]" : "border-transparent hover:border-[#e39f32]"}"/>`;
      })
      .join("");
 
    /* Set main image */
    setMainMedia(mediaItems[0], mainImg);
 
    /* Wire desktop thumb clicks — clean previous listeners if any */
    desktopThumbContainer
      .querySelectorAll("[data-media-index]")
      .forEach((thumb) => {
        // Remove old listeners to prevent duplicates
        const newThumb = thumb.cloneNode(true);
        thumb.parentNode.replaceChild(newThumb, thumb);
 
        newThumb.addEventListener("click", function () {
          const index = parseInt(this.dataset.mediaIndex);
          setMainMedia(mediaItems[index], mainImg);
          updateAllActiveStates(); // Ensure sync
        });
      });
  }
 
 
//=================================================================================
  // 23/6 ---------------------- ui updates patch end ----------------------------
  //==================================================================================
 
  /** Swap the main display area between image and video. */
  function setMainMedia(item, container) {
    if (!container || !item) return;
 
    const displayArea = document.getElementById("mainDisplayArea");
    const img = container;
 
    if (item.type === "video") {
      // Hide image
      img.style.display = "none";
 
      // Check if video element exists
      let video = document.getElementById("mainProductVideo");
      if (!video) {
        video = document.createElement("video");
        video.id = "mainProductVideo";
        video.className = "w-full h-full object-cover";
        video.controls = true;
        video.muted = false;
        video.style.transition = "opacity 0.3s ease";
        displayArea?.querySelector(".relative")?.appendChild(video);
      }
 
      // Fade in video
      video.style.opacity = "0";
      video.src = item.url;
      video.style.display = "block";
 
      // Load and play
      video.load();
      video.play().catch(() => {});
 
      // Fade in after load
      video.oncanplay = () => {
        video.style.opacity = "1";
      };
 
      // Hide preview
      const preview = displayArea?.querySelector(".next-image-preview");
      if (preview) preview.style.display = "none";
    } else {
      // Hide video
      const video = document.getElementById("mainProductVideo");
      if (video) video.style.display = "none";
 
      // Fade transition for image
      img.style.opacity = "0";
      img.src = item.url;
      img.style.display = "block";
 
      // Fade in after load
      img.onload = () => {
        img.style.opacity = "1";
      };
      // If image is cached, load event might not fire
      setTimeout(() => {
        img.style.opacity = "1";
      }, 300);
    }
 
    // Update active states
    updateAllActiveStates();
  }
 
  function updateNextImagePreview() {
    const displayArea = document.getElementById("mainDisplayArea");
    if (!displayArea) return;
 
    // Remove existing preview
    const existingPreview = displayArea.querySelector(".next-image-preview");
    if (existingPreview) existingPreview.remove();
 
    // Get current media items
    const allThumbs = document.querySelectorAll(
      "#thumbContainer [data-media-index]",
    );
    const mainImg = document.getElementById("mainProductImage");
    if (!mainImg || allThumbs.length <= 1) return;
 
    // Find current index
    let currentIndex = 0;
    allThumbs.forEach((thumb, idx) => {
      const thumbUrl =
        thumb.dataset.mediaUrl || thumb.querySelector("img")?.src;
      if (thumbUrl === mainImg.src) {
        currentIndex = idx;
      }
    });
 
    // Check if there's a next image (only show for images, not videos)
    const nextThumb = allThumbs[currentIndex + 1];
    if (nextThumb && nextThumb.dataset.mediaType !== "video") {
      const nextUrl =
        nextThumb.dataset.mediaUrl || nextThumb.querySelector("img")?.src;
      if (nextUrl) {
        const preview = document.createElement("div");
        preview.className =
          "next-image-preview absolute right-0 top-0 h-full w-20 md:w-24 pointer-events-none";
        preview.innerHTML = `
        <div class="h-full w-full bg-gradient-to-l from-black/20 to-transparent">
          <img src="${nextUrl}"
               class="h-full w-full object-cover opacity-50"
               style="mask-image: linear-gradient(to left, rgba(0,0,0,0.6), transparent);"
               alt="Next image preview"/>
        </div>
        <div class="absolute right-2 top-1/2 -translate-y-1/2 bg-white/80 backdrop-blur-sm rounded-full w-8 h-8 flex items-center justify-center shadow-md">
          <i class="fa-solid fa-chevron-right text-xs text-gray-700"></i>
        </div>
      `;
        displayArea.appendChild(preview);
      }
    }
  }
 
  function updateAllActiveStates() {
    // Find current active index from desktop thumbs
    const desktopThumbs = document.querySelectorAll(
      "#thumbContainer [data-media-index]",
    );
    let activeIndex = 0;
    desktopThumbs.forEach((thumb, idx) => {
      if (thumb.classList.contains("border-[#e39f32]")) {
        activeIndex = idx;
      }
    });
 
    // Update mobile thumbs
    const mobileThumbs = document.querySelectorAll(
      "#mobileThumbContainer .mobile-thumb-item",
    );
    mobileThumbs.forEach((thumb, idx) => {
      thumb.classList.toggle("border-[#e39f32]", idx === activeIndex);
      thumb.classList.toggle("border-transparent", idx !== activeIndex);
    });
 
    // Update dots
    const dots = document.querySelectorAll("#mobileNavDots .mobile-nav-dot");
    dots.forEach((dot, idx) => {
      dot.classList.toggle("bg-[#E39F32]", idx === activeIndex);
      dot.classList.toggle("scale-110", idx === activeIndex);
      dot.classList.toggle("shadow-lg", idx === activeIndex);
      dot.classList.toggle("shadow-[#E39F32]/30", idx === activeIndex);
      dot.classList.toggle("bg-gray-300", idx !== activeIndex);
    });
  }
 
  //======================= lightbox=======================================
  // ─── LIGHTBOX SYSTEM ──────────────────────────────────────────────────────────
  // Add Lightbox HTML to DOM
 
  function addLightboxHTML() {
    if (document.getElementById("imageLightbox")) return;
 
    const lightboxHTML = `
    <div id="imageLightbox" class="fixed inset-0 z-[10000] hidden items-center justify-center bg-black/95 backdrop-blur-md"
         style="opacity:0; transition:opacity 0.3s cubic-bezier(0.4, 0, 0.2, 1);">
     
      <button id="lightboxClose"
              class="absolute top-4 right-4 z-20 w-12 h-12 rounded-full bg-white/10 hover:bg-white/20
                     flex items-center justify-center transition-all duration-300 text-white text-2xl
                     hover:scale-110 active:scale-95">
        <i class="fa-solid fa-xmark"></i>
      </button>
     
      <button id="lightboxPrev"
              class="absolute left-4 top-1/2 -translate-y-1/2 z-20 w-12 h-12 rounded-full
                     bg-white/10 hover:bg-white/20 flex items-center justify-center
                     transition-all duration-300 text-white text-xl hover:scale-110 active:scale-95">
        <i class="fa-solid fa-chevron-left"></i>
      </button>
     
      <button id="lightboxNext"
              class="absolute right-4 top-1/2 -translate-y-1/2 z-20 w-12 h-12 rounded-full
                     bg-white/10 hover:bg-white/20 flex items-center justify-center
                     transition-all duration-300 text-white text-xl hover:scale-110 active:scale-95">
        <i class="fa-solid fa-chevron-right"></i>
      </button>
     
      <div id="lightboxCounter" class="absolute bottom-20 left-1/2 -translate-x-1/2 text-white/70 text-sm font-lexend">
        1 / 1
      </div>
     
      <div class="relative w-full max-w-7xl max-h-[85vh] flex items-center justify-center p-4">
        <img id="lightboxImage"
             src=""
             alt="Product image"
             class="max-h-[80vh] max-w-full object-contain rounded-lg shadow-2xl transition-all duration-300"
             style="opacity:0; transform:scale(0.95);"/>
       
        <div id="lightboxLoader" class="absolute inset-0 flex items-center justify-center">
          <div class="w-12 h-12 border-4 border-white/20 border-t-white rounded-full animate-spin"></div>
        </div>
      </div>
     
      <div id="lightboxThumbs" class="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 overflow-x-auto max-w-[90vw] pb-2 px-4"
           style="scrollbar-width:thin; scrollbar-color:rgba(255,255,255,0.3) transparent;">
      </div>
    </div>
  `;
 
    document.body.insertAdjacentHTML("beforeend", lightboxHTML);
  }
 
  // Lightbox state
  let lightboxMediaItems = [];
  let currentLightboxIndex = 0;
 
  // Open lightbox
  window.openLightbox = function (index) {
    // Build media list from all thumbnails
    const allThumbs = document.querySelectorAll(
      "#thumbContainer [data-media-index]",
    );
    lightboxMediaItems = [];
 
    allThumbs.forEach((thumb) => {
      const type = thumb.dataset.mediaType || "image";
      const url = thumb.dataset.mediaUrl || thumb.querySelector("img")?.src;
      if (url) {
        lightboxMediaItems.push({ type, url });
      }
    });
 
    // If no thumbs, use main image
    if (lightboxMediaItems.length === 0) {
      const mainImg = document.getElementById("mainProductImage");
      if (mainImg) {
        lightboxMediaItems.push({ type: "image", url: mainImg.src });
      }
    }
 
    if (lightboxMediaItems.length === 0) return;
 
    currentLightboxIndex = Math.min(index, lightboxMediaItems.length - 1);
    renderLightbox(currentLightboxIndex);
 
    const lightbox = document.getElementById("imageLightbox");
    lightbox.style.display = "flex";
    document.body.style.overflow = "hidden";
 
    requestAnimationFrame(() => {
      lightbox.style.opacity = "1";
      const img = document.getElementById("lightboxImage");
      if (img) {
        img.style.opacity = "1";
        img.style.transform = "scale(1)";
      }
    });
  };
 
  // Close lightbox
  function closeLightbox() {
    const lightbox = document.getElementById("imageLightbox");
    lightbox.style.opacity = "0";
    document.body.style.overflow = "";
 
    setTimeout(() => {
      lightbox.style.display = "none";
      const img = document.getElementById("lightboxImage");
      if (img) {
        img.style.opacity = "0";
        img.style.transform = "scale(0.95)";
      }
      // Pause any video
      const video = document.querySelector("#lightboxVideo");
      if (video) video.pause();
    }, 300);
  }
 
  // Render lightbox slide
  function renderLightbox(index) {
    const item = lightboxMediaItems[index];
    if (!item) return;
 
    const img = document.getElementById("lightboxImage");
    const loader = document.getElementById("lightboxLoader");
    const counter = document.getElementById("lightboxCounter");
    const thumbStrip = document.getElementById("lightboxThumbs");
    const prevBtn = document.getElementById("lightboxPrev");
    const nextBtn = document.getElementById("lightboxNext");
 
    // Update counter
    if (counter) {
      counter.textContent = `${index + 1} / ${lightboxMediaItems.length}`;
    }
 
    // Show loader
    if (loader) loader.style.display = "flex";
 
    // Handle video
    let videoEl = document.querySelector("#lightboxVideo");
    if (item.type === "video") {
      img.style.display = "none";
      if (!videoEl) {
        videoEl = document.createElement("video");
        videoEl.id = "lightboxVideo";
        videoEl.controls = true;
        videoEl.autoplay = true;
        videoEl.className = "max-h-[80vh] max-w-full rounded-lg shadow-2xl";
        videoEl.style.backgroundColor = "#000";
        document.querySelector("#imageLightbox .relative").appendChild(videoEl);
      }
      videoEl.src = item.url;
      videoEl.style.display = "block";
      videoEl.load();
      videoEl.play().catch(() => {});
      if (loader) loader.style.display = "none";
    } else {
      if (videoEl) videoEl.style.display = "none";
      img.style.display = "block";
      img.src = item.url;
      img.onload = () => {
        if (loader) loader.style.display = "none";
        img.style.opacity = "1";
        img.style.transform = "scale(1)";
      };
      img.onerror = () => {
        if (loader) loader.style.display = "none";
        img.src =
          FALLBACK_IMG ||
          'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="%23666"%3E%3Cpath d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V5h14v14zM7 10h2v7H7zm4-3h2v10h-2zm4 6h2v4h-2z"/%3E%3C/svg%3E';
      };
    }
 
    // Update thumbnail strip
    if (thumbStrip) {
      thumbStrip.innerHTML = lightboxMediaItems
        .map((media, idx) => {
          if (media.type === "video") {
            return `
          <div class="flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 cursor-pointer
                      ${idx === index ? "border-[#E39F32]" : "border-transparent hover:border-white/50"}
                      relative bg-black/50" data-lb-index="${idx}">
            <video src="${media.url}" class="w-full h-full object-cover" muted preload="metadata"></video>
            <div class="absolute inset-0 flex items-center justify-center bg-black/30">
              <i class="fas fa-play text-white text-xs"></i>
            </div>
          </div>`;
          }
          return `
        <img src="${media.url}"
             class="flex-shrink-0 w-16 h-16 object-cover rounded-lg border-2 cursor-pointer
                    ${idx === index ? "border-[#E39F32]" : "border-transparent hover:border-white/50"}"
             data-lb-index="${idx}"
             onerror="this.style.display='none'"/>`;
        })
        .join("");
 
      // Add click listeners to thumbnails
      thumbStrip.querySelectorAll("[data-lb-index]").forEach((el) => {
        el.addEventListener("click", function () {
          const idx = parseInt(this.dataset.lbIndex);
          if (idx !== currentLightboxIndex) {
            currentLightboxIndex = idx;
            renderLightbox(currentLightboxIndex);
          }
        });
      });
 
      // Scroll active thumbnail into view
      const activeThumb = thumbStrip.querySelector(
        `[data-lb-index="${index}"]`,
      );
      if (activeThumb) {
        activeThumb.scrollIntoView({
          behavior: "smooth",
          inline: "center",
          block: "nearest",
        });
      }
    }
 
    // Update navigation visibility
    if (prevBtn) prevBtn.style.display = index === 0 ? "none" : "flex";
    if (nextBtn)
      nextBtn.style.display =
        index === lightboxMediaItems.length - 1 ? "none" : "flex";
  }
 
  // Wire lightbox controls
  function wireLightboxControls() {
    document
      .getElementById("lightboxClose")
      ?.addEventListener("click", closeLightbox);
 
    document
      .getElementById("lightboxPrev")
      ?.addEventListener("click", function (e) {
        e.stopPropagation();
        if (currentLightboxIndex > 0) {
          currentLightboxIndex--;
          renderLightbox(currentLightboxIndex);
        }
      });
 
    document
      .getElementById("lightboxNext")
      ?.addEventListener("click", function (e) {
        e.stopPropagation();
        if (currentLightboxIndex < lightboxMediaItems.length - 1) {
          currentLightboxIndex++;
          renderLightbox(currentLightboxIndex);
        }
      });
 
    // Keyboard controls
    document.addEventListener("keydown", function (e) {
      const lightbox = document.getElementById("imageLightbox");
      if (
        !lightbox ||
        lightbox.style.display === "none" ||
        lightbox.style.opacity === "0"
      )
        return;
 
      if (e.key === "Escape") {
        e.preventDefault();
        closeLightbox();
      }
      if (e.key === "ArrowLeft" && currentLightboxIndex > 0) {
        e.preventDefault();
        currentLightboxIndex--;
        renderLightbox(currentLightboxIndex);
      }
      if (
        e.key === "ArrowRight" &&
        currentLightboxIndex < lightboxMediaItems.length - 1
      ) {
        e.preventDefault();
        currentLightboxIndex++;
        renderLightbox(currentLightboxIndex);
      }
    });
 
    // Click outside image to close
    document
      .getElementById("imageLightbox")
      ?.addEventListener("click", function (e) {
        if (e.target === this) closeLightbox();
      });
  }
 
  // Initialize lightbox
  function initLightbox() {
    addLightboxHTML();
    wireLightboxControls();
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

  // ─── PATCH 4: AMAZON-STYLE VARIANT SELECTION ──────────────────────────────
  // Replaces both setupVariantSelection() and setupDynamicVariants().
  // Single unified handler — size pills filter color cards,
  // color card click updates all product display.

function setupVariantSelection() {
    const sizePills = document.querySelectorAll(".size-pill");
    const variantSection = document.getElementById("variantSection");
    if (!sizePills.length || !variantSection) return;
    // ── Wire size pills ────────────────────────────────────────────────────
    sizePills.forEach((pill) => {
      pill.addEventListener("click", function () {
        const selectedSize = this.dataset.size;
        // Update pill active state
        sizePills.forEach((pill) => {
          pill.addEventListener("click", function () {
            sizePills.forEach((p) => {
              p.className =
                "size-pill px-4 py-2 rounded-lg border-2 text-xs font-medium transition-all duration-200 rounded-xl border-gray-200 text-gray-600 hover:border-[#E6A62C]";
            });
            this.className =
              "size-pill px-4 py-2 rounded-lg border-2 text-xs font-medium transition-all duration-200 rounded-xl border-[#E6A62C] bg-[#1D3C4A] text-white shadow-sm";
            filterColorsBySize(this.dataset.size);
          });
        });
        // Update active size label
        const activeSizeLabel = document.getElementById("activeSizeLabel");
        if (activeSizeLabel) activeSizeLabel.textContent = selectedSize;
        // Show only cards matching this size
        const allCards = document.querySelectorAll(".variant-card");
        let firstVisible = null;
        allCards.forEach((card) => {
          const matches = card.dataset.size === selectedSize;
          card.style.display = matches ? "" : "none";
          if (matches && !firstVisible) firstVisible = card;
        });
        // Auto-select first visible color card
        if (firstVisible) firstVisible.click();
      });
    });
    // ── Wire color cards via delegation ───────────────────────────────────
    variantSection.addEventListener("click", function (e) {
      const card = e.target.closest(".variant-card");
      if (!card) return;
      // Active ring
      document.querySelectorAll(".variant-card").forEach((c) => {
        c.classList.remove("border-[#1D3C4A]", "shadow-md");
        c.classList.add("border-gray-200");
      });
      card.classList.add("border-[#1D3C4A]", "shadow-md");
      card.classList.remove("border-gray-200");
      // Find variant
      const variantId = card.dataset.variantId;
      const newVariant = safeProductData.availableVariants.find(
        (v) => v.variantId === variantId
      );
      if (!newVariant) return;
      currentVariant = newVariant;
      // Update active color label
      const activeColorLabel = document.getElementById("activeColorLabel");
      if (activeColorLabel) activeColorLabel.textContent = newVariant.color;
      // Full display update
      updateProductDisplay();
    });
    // ── Auto-trigger first size pill on init ──────────────────────────────
    if (sizePills[0]) sizePills[0].click();
  }


  function setupVariantSelection() {
    const sizePills = document.querySelectorAll(".size-pill");
    const variantSection = document.getElementById("variantSection");
    if (!sizePills.length || !variantSection) return;
    // ── Wire size pills (single listener each, no nested re-attachment) ───
    sizePills.forEach((pill) => {
      pill.addEventListener("click", function () {
        const selectedSize = this.dataset.size;
        // Update pill active state
        sizePills.forEach((p) => {
          p.className =
            "size-pill px-4 py-2 rounded-lg border-2 text-xs font-medium transition-all duration-200 rounded-xl border-gray-200 text-gray-600 hover:border-[#E6A62C]";
        });
        this.className =
          "size-pill px-4 py-2 rounded-lg border-2 text-xs font-medium transition-all duration-200 rounded-xl border-[#E6A62C] bg-[#1D3C4A] text-white shadow-sm";
        // Update active size label
        const activeSizeLabel = document.getElementById("activeSizeLabel");
        if (activeSizeLabel) activeSizeLabel.textContent = selectedSize;
        // Show only cards matching this size
        const allCards = document.querySelectorAll(".variant-card");
        let firstVisible = null;
        allCards.forEach((card) => {
          const matches = card.dataset.size === selectedSize;
          card.style.display = matches ? "" : "none";
          if (matches && !firstVisible) firstVisible = card;
        });
        // Auto-select first visible color card
        if (firstVisible) firstVisible.click();
      });
    });
    // ── Wire color cards via delegation ───────────────────────────────────
    variantSection.addEventListener("click", function (e) {
      const card = e.target.closest(".variant-card");
      if (!card) return;
      // Active ring — use ring-2 so it matches getSelectedVariant()'s query
      document.querySelectorAll(".variant-card").forEach((c) => {
        c.classList.remove("border-[#1D3C4A]", "shadow-md", "ring-1", "ring-[#1D3C4A]");
        c.classList.add("border-gray-200");
      });
      card.classList.add("border-[#1D3C4A]", "shadow-md", "ring-1", "ring-[#1D3C4A]");
      card.classList.remove("border-gray-200");
      // Find variant
      const variantId = card.dataset.variantId;
      const newVariant = safeProductData.availableVariants.find(
        (v) => v.variantId === variantId
      );
      if (!newVariant) return;
      currentVariant = newVariant;
      // Update active color label
      const activeColorLabel = document.getElementById("activeColorLabel");
      if (activeColorLabel) activeColorLabel.textContent = newVariant.color;
      // Full display update
      updateProductDisplay();
    });
    // ── Auto-trigger first size pill on init ──────────────────────────────
    if (sizePills[0]) sizePills[0].click();
  }

  // setupDynamicVariants is now a no-op — PATCH 4 handles everything above
  function setupDynamicVariants() { }
  // ─── END PATCH 4 VARIANT SELECTION ────────────────────────────────────────




  function syncStockUI(stock) {

    console.log("[syncStockUI] called with stock:", stock, "| isOOS:", !stock || stock <= 0);
    const isOOS = !stock || stock <= 0;
    const remaining = Math.max(0, stock || 0);

    // ── 1. CTA buttons (main + sticky bar) ──────────────────────────────────
    document.querySelectorAll(".add-to-cart-btn, .buy-now-btn").forEach((btn) => {
      btn.disabled = isOOS;
      btn.setAttribute("aria-disabled", String(isOOS));
      btn.classList.toggle("opacity-50", isOOS);
      btn.classList.toggle("cursor-not-allowed", isOOS);

      if (btn.classList.contains("add-to-cart-btn")) {
        const isCustom = safeProductData?.isCustomizable;
        btn.innerHTML = isOOS
          ? `<i class="fas fa-ban"></i><span class="text-sm ml-1">Out of Stock</span>`
          : isCustom
            ? `<i class="fas fa-sliders-h"></i><span class="text-sm ml-1">Customize</span>`
            : `<i class="fa-solid fa-cart-shopping"></i><span class="text-sm ml-1">Add to Cart</span>`;
      }
      // buy-now-btn has no text change — disable state alone is sufficient
    });

    // ── 2. Qty increase button ───────────────────────────────────────────────
    const incBtn = document.getElementById("increaseBtn");
    if (incBtn) {
      incBtn.disabled = isOOS;
      incBtn.classList.toggle("opacity-40", isOOS);
      incBtn.classList.toggle("cursor-not-allowed", isOOS);
    }

    // ── 3. stockInfo label ───────────────────────────────────────────────────
    const stockEl = document.getElementById("stockInfo");
    if (stockEl) {
      if (isOOS) {
        stockEl.textContent = "Out of stock";
        stockEl.className = "text-xs text-red-600 font-semibold";
      } else {
        // Re-read current qty from DOM to calculate remaining
        const qty = parseInt(document.getElementById("quantity")?.textContent || 1);
        const rem = stock - qty;
        stockEl.textContent = rem > 0 ? `Only ${rem} items left in stock` : "Out of stock";
        stockEl.className = rem > 0
          ? "text-xs text-green-600 font-semibold"
          : "text-xs text-red-600 font-semibold";
      }
    }
  }
  // ─── END PATCH 2 STOCK FUNCTION ───────────────────────────────────────────────

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
    const mrpEl = document.querySelector(".price-display")?.closest(".flex")
      ?.querySelector(".line-through");
    if (priceEl) priceEl.textContent = `₹${currentVariant.price.toLocaleString("en-IN")}`;
    if (mrpEl) mrpEl.textContent = `₹${currentVariant.mrp.toLocaleString("en-IN")}`;

    // Also update sticky bar price
    const stickyPrice = document.querySelector("#stickyBar .price-sticky");
    if (stickyPrice) stickyPrice.textContent = `₹${currentVariant.price.toLocaleString("en-IN")}`;

    // ── 3. Discount badge ──────────────────────────────────────────────────
    const discPct = calcDiscount(currentVariant.price, currentVariant.mrp);
    const discBadges = document.querySelectorAll(".discount-badge");
    discBadges.forEach((b) => {
      b.textContent = discPct > 0 ? `${discPct}% OFF` : "";
      b.style.display = discPct > 0 ? "" : "none";
    });
  
    // ── 4. Stock — delegate entirely to syncStockUI (PATCH 2) ─────────────
    syncStockUI(currentVariant.stock);

    // ── 5. SKU / Color label ───────────────────────────────────────────────
    const skuEl = document.getElementById("currentSkuLabel");
    if (skuEl) skuEl.textContent = `SKU: ${currentVariant.sku}`;

    const colorEl = document.getElementById("currentColorLabel");
    if (colorEl) colorEl.textContent = `Color: ${currentVariant.color}`;

    // ── 6. Update customization overlay preview if open ────────────────────
    const customPreview = document.getElementById("customPreviewImage");
    if (customPreview) customPreview.src = currentVariant.mainImage;
 
    // Update URL to reflect selected variant using the shared rewriteURLToSEO helper
    if (safeProductData && currentVariant) {
      const variantSku = currentVariant.sku || currentVariant.variantId || null;
      rewriteURLToSEO(variantSku);
    }

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

    const variant = getSelectedVariant();
    const quantity = parseInt(document.getElementById("quantity")?.textContent || 1);
    const payload = buildCartPayload(variant, quantity, null);
    const pid = Number(safeProductData.productPrimeId);

    // ── If already added → go to cart ──────────────────────────────────────
    if (addedToCartSet.has(pid)) {
      window.location.href = "/Cart/cart.html";
      return;
    }

    try {
      await apiAddToCart(payload);
      addedToCartSet.add(pid);
      showToast("Added to cart! 🛒", "success");
      // window.dispatchEvent(new CustomEvent('cart:updated'));
      dispatchCartEvent();

      // ── Update ALL add-to-cart buttons (main + sticky) ─────────────────
      document.querySelectorAll(".add-to-cart-btn").forEach(addBtn => {
        addBtn.innerHTML = `<i class="fa-solid fa-bag-shopping"></i> <span class="text-sm whitespace-nowrap">Go to Cart</span>`;
        addBtn.style.background = "#e39f32";
        addBtn.style.color = "#1D3C4A";
        addBtn.style.fontWeight = "600";
        addBtn.style.borderColor = "#e39f32";
      });
    } catch (err) {
      console.error("[Cart] add error:", err);
      showToast("Could not add to cart. Please try again.", "error");
    }
  }



// ═══════════════════════════════════════════════════════════════════════════
//  BUY NOW — SHIPROCKET HEADLESS CHECKOUT INTEGRATION
// ═══════════════════════════════════════════════════════════════════════════
async function handleBuyNow(e) {
  e.preventDefault();
  e.stopPropagation();

  console.log('[BuyNow] Initiated');

  // ── 1. CUSTOMIZABLE CHECK ──────────────────────────────────────────
  if (safeProductData?.isCustomizable) {
    console.log('[BuyNow] Customizable product — opening overlay');
    openCustomizationOverlay();
    return;
  }

  // ── 2. AUTH CHECK ──────────────────────────────────────────────────
  if (!USER_ID) {
    console.error('[BuyNow] User not authenticated');
    showToast('Please login to continue.', 'error');
    return;
  }

 // ── 3. VARIANT & QTY CHECK ────────────────────────────────────────
// console.log('[BuyNow-DEBUG] ── Variant resolution trace ──');
// console.log('[BuyNow-DEBUG] currentVariant (global):', JSON.stringify(currentVariant));
// console.log('[BuyNow-DEBUG] getSelectedVariant() returned:', JSON.stringify(getSelectedVariant()));
// console.log('[BuyNow-DEBUG] ring-2 card element:', document.querySelector("[data-variant-id].ring-2"));
// console.log('[BuyNow-DEBUG] ring-2 card data-variant-id:', document.querySelector("[data-variant-id].ring-2")?.dataset?.variantId);
// console.log('[BuyNow-DEBUG] safeProductData.productPrimeId:', safeProductData.productPrimeId);
// console.log('[BuyNow-DEBUG] safeProductData.availableVariants[0]:', JSON.stringify(safeProductData.availableVariants?.[0]));

 const variant = getSelectedVariant() 
  || safeProductData.availableVariants?.[0]  // ✅ fall back to the FIRST REAL variant, not productPrimeId
  || null;

// console.log('[BuyNow-DEBUG] FINAL resolved variant:', JSON.stringify(variant));
// console.log('[BuyNow-DEBUG] FINAL variant.variantId:', variant?.variantId, '| typeof:', typeof variant?.variantId);

 const quantity = parseInt(document.getElementById('quantity')?.textContent || 1);
const unitPrice = variant?.price || safeProductData.currentSellingPrice;

  if (safeProductData.hasVariants && !variant?.variantId) {
  console.error('[BuyNow] Product has variants but no real variantId resolved (got baseVariant/null):', variant);
  showToast('Please select a variant (color/size) before buying.', 'error');
  return;
}

if (variant?.stock <= 0) {
  showToast('Selected variant is out of stock.', 'error');
  return;
}

  // ── 4. CHECK SDK LOADED ────────────────────────────────────────────
  const sdkReady = await waitForShiprocketSDK(5000);
  if (!sdkReady || typeof HeadlessCheckout === 'undefined') {
    console.error('[BuyNow] Shiprocket SDK not loaded');
    showToast('Checkout system loading. Please try again in a moment.', 'error');
    return;
  }

  // ── 5. BUILD ORDER REFERENCE ──────────────────────────────────────
  const orderRef = 'ORD-' + Date.now() + '-' + 
                   Math.random().toString(36).slice(2, 6).toUpperCase();

  // ✅ NEW — store globally so handleBuyNowSuccess can retrieve it later
  window.__currentBuyNowOrderRef = orderRef;
  
  // ── 6. SHOW LOADING OVERLAY ───────────────────────────────────────
  showBuyNowOverlay();

  try {
    // ── 7. BUILD PAYLOAD WITH FALLBACK VARIANT ID ────────────────────
    // CRITICAL: Shiprocket requires variantId - never send null
    // Fallback chain: variantId → productPrimeId → productStrId → 'default'
   const variantId = variant?.variantId || null;   // ✅ real variant ID string, e.g. "150" — never productPrimeId

   const variantLabel = variant?.titleName 
      || variant?.color 
      || safeProductData.productName 
      || 'Default';

    const sku = variant?.sku 
      || safeProductData.currentSku 
      || safeProductData.productStrId 
      || 'SKU-DEFAULT';

    const payload = {
      orderRef: orderRef,
      productStrId: safeProductData.productStrId,
      productName: safeProductData.productName + ' — ' + variantLabel,
      variantId: variantId,   // ✅ real variant PK string, or null — never a fabricated substitute
      variantLabel: variantLabel,
      sku: sku,
      quantity: quantity,
      unitPrice: parseFloat(unitPrice),
      mrp: variant?.mrp || safeProductData.currentMrpPrice || unitPrice,
      imageUrl: variant?.mainImage || safeProductData.mainImage || '',
      redirectUrl: window.location.origin + '/Checkout/order-confirm.html',
    };
    console.log('[BuyNow] Payload with variantId:', payload);
    console.log('[BuyNow] variantId used:', variantId, '| Type:', typeof variantId);

    // ── 8. CALL BACKEND ───────────────────────────────────────────────
    const response = await fetch(`${BASE_URL}/api/shiprocket/access-token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-User-Id': USER_ID,
      },
      credentials: 'include',
      body: JSON.stringify(payload),
    });

    // ── 9. PARSE RESPONSE ─────────────────────────────────────────────
    let data;
    const responseText = await response.text();
    // console.log('[BuyNow] Raw response:', responseText);

    try {
      data = responseText ? JSON.parse(responseText) : {};
    } catch (parseError) {
      console.error('[BuyNow] Failed to parse JSON:', parseError);
      hideBuyNowOverlay();
      showToast('Checkout service error. Please try again.', 'error');
      return;
    }

    if (!response.ok) {
      console.error('[BuyNow] Token request failed:', response.status, data);
      hideBuyNowOverlay();
      
      // Show specific error messages
      let errorMessage = 'Failed to open checkout. Please try again.';
      if (response.status === 503) {
        errorMessage = 'Checkout service unavailable. Please try again shortly.';
      } else if (response.status === 500) {
        errorMessage = data?.error?.message || 'Server error. Please try again later.';
      } else if (response.status === 400 || response.status === 422) {
        errorMessage = data?.error?.message || 'Invalid product configuration. Please contact support.';
      }
      
      showToast(errorMessage, 'error');
      return;
    }

    // ── 10. EXTRACT TOKEN ─────────────────────────────────────────────
    const token = data?.result?.token || data.token || data.access_token || data.checkout_token;
    
    if (!token) {
      console.error('[BuyNow] No token in response:', data);
      hideBuyNowOverlay();
      showToast('Checkout configuration error. Please try again.', 'error');
      return;
    }

    console.log('[BuyNow] Token received successfully:', token);

    // ── 11. HIDE OVERLAY ──────────────────────────────────────────────
    hideBuyNowOverlay();

    // ── 12. LAUNCH HEADLESS CHECKOUT ──────────────────────────────────
    const checkoutEvent = new Event('checkout', { bubbles: true, cancelable: true });
    
    console.log('[BuyNow] Launching HeadlessCheckout');
    HeadlessCheckout.addToCart(checkoutEvent, token, {
      fallbackUrl: window.location.origin + '/checkout-cancelled',
      isInitiatedFromApp: false,
    });

  } catch (err) {
    console.error('[BuyNow] Error:', err);
    hideBuyNowOverlay();
    showToast('Something went wrong. Please try again.', 'error');
  }
}

  /**
   * FIXED handleBuyNowSuccess() — Maps Shiprocket callback → backend order confirmation
   */
  async function handleBuyNowSuccess(srData, variant, quantity, itemTotal) {
    L.info("═══════════════════════════════════════════════════════");
    L.info("  SHIPROCKET CHECKOUT SUCCESS (CALLBACK)");
    L.info("═══════════════════════════════════════════════════════");

     const orderRef = window.__currentBuyNowOrderRef || null; // ✅ NEW


    // Validate we have the required fields from Shiprocket
    if (!srData?.order_id || !srData?.payment_id) {
      L.error("❌ Shiprocket callback missing order_id or payment_id");
      showToast("Payment received but order reference incomplete. Please contact support with Payment ID: " + srData?.payment_id, "warning");
      return;
    }

    showToast("Payment verified! Processing your order...", "success");

    // Build payload to send to our backend for order persistence
    const confirmPayload = {
      shiprocketOrderId: String(srData.order_id),
      shiprocketShipmentId: String(srData.shipment_id || ""),
      razorpayPaymentId: String(srData.payment_id),
      amount: parseFloat(itemTotal),
      productStrId: safeProductData.productStrId,
      variantId: variant?.id || safeProductData.productPrimeId,
      quantity: parseInt(quantity),
      customerName: srData.customer_name || "",
      customerPhone: srData.customer_phone || "",
      customerEmail: srData.customer_email || "",
      shippingAddress1: srData.shipping_address || "",
      shippingAddress2: srData.shipping_address_2 || "",
      shippingCity: srData.shipping_city || "",
      shippingState: srData.shipping_state || "",
      shippingPincode: srData.shipping_pincode || ""
    };

    try {
      L.info("Confirming order with backend...");
      const response = await fetch('/api/orders/confirm-buynow', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-User-Id': USER_ID
        },
        body: JSON.stringify(confirmPayload)
      });

      const backendResult = await response.json();

      if (!response.ok) {
        L.error("Backend order confirmation failed: {}", response.status);
        L.error("Response: {}", JSON.stringify(backendResult));

        // Payment went through but order not saved — critical state
        showToast(
          "⚠️ Payment complete (ID: " + srData.payment_id + ") but order save failed. " +
          "Please contact support with this Payment ID. Your payment is safe.",
          "warning"
        );
        return;
      }

      L.info("✅ Order confirmed and saved in database");
      const orderStrId = backendResult?.data?.orderStrId || backendResult?.orderStrId;

      if (!orderStrId) {
        L.warn("Order saved but orderStrId not in response");
        showToast("Order placed successfully! 🎉", "success");
        setTimeout(() => {
          window.location.href = "/order-success.html";
        }, 1500);
        return;
      }

      showToast("Order placed successfully! 🎉", "success");

      // Redirect to order success page with order ID
      // setTimeout(() => {
      //   window.location.href = `/Order-Success/order-success.html?orderId=${encodeURIComponent(orderStrId)}`;
      // }, 1500);

    } catch (err) {
      L.error("❌ Order confirmation request failed: {}", err.message);
      showToast(
        "Payment complete but order sync failed. Contact support with Payment ID: " + srData.payment_id,
        "error"
      );
    }

    // after success + redirect, clean up:
  window.__currentBuyNowOrderRef = null; // ✅ NEW — avoid stale reuse on next Buy Now
  }




  /**
 * BUILDS THE PAYLOAD FOR BACKEND ORDER CONFIRMATION
 * Maps SR Checkout callback data → BuyNowConfirmRequest DTO
 * 
 * NOTE: Frontend sends ITEM TOTAL (pre-tax)
 *       Backend calculates tax, shipping, final amount
 *       This ensures consistent calculations
 */
  /**
   * BUILD BUYNOW CONFIRM REQUEST
   * Maps SR Checkout callback → Backend DTO
   */
  function buildBuyNowConfirmPayload(srData, variant, quantity, itemTotal, orderRef) {
    log.info("Building BuyNowConfirmRequest payload...");

    const payload = {
      orderRef: orderRef || null,
      shiprocketOrderId: srData.order_id ? String(srData.order_id) : null,
      shiprocketShipmentId: srData.shipment_id ? String(srData.shipment_id) : null,
      razorpayPaymentId: srData.payment_id || null,
      amount: itemTotal,

      productStrId: safeProductData.productStrId,
      variantId: variant?.variantId || null,   // ✅ real variant PK — no fallback to product-level IDs
      quantity: quantity,

      customerName: srData.customer_name || "",
      customerPhone: srData.customer_phone || "",
      customerEmail: srData.customer_email || "",

      shippingAddress1: srData.shipping_address || "",
      shippingAddress2: srData.shipping_address_2 || null,
      shippingCity: srData.shipping_city || "",
      shippingState: srData.shipping_state || "",
      shippingPincode: srData.shipping_pincode || "",
    };

    return payload;
}

  function buildCartPayload(variant, quantity, customFieldsJson) {

    // Ensure we have a valid variant
    const selectedVariant = variant || getSelectedVariant();

    return {
      userId: USER_ID,
      sessionId: null,
      productId: safeProductData.productId,
      variantId: variant?.variantId || null,
      sku: variant?.sku || safeProductData.currentSku,
      selectedColor: variant?.color || safeProductData.selectedColor,
      selectedSize: variant?.size || null,
      titleName: safeProductData?.productName || "Artezo Product",
      unitPrice: variant?.price || safeProductData.currentSellingPrice,
      mrpPrice: variant?.mrp || safeProductData.currentMrpPrice,
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

    const btn = e.currentTarget;
    const variant = getSelectedVariant();

    const payload = {
      userId: USER_ID,
      wishlistName: "My Wishlist",
      productId: safeProductData.productId,
      variantId: variant?.variantId || null,
      sku: variant?.sku || safeProductData.currentSku,
      selectedColor: variant?.color || safeProductData.selectedColor,
      selectedSize: variant?.size || null,
      titleName: safeProductData?.productName || "Artezo Product",
      wishlistedPrice: variant?.price || safeProductData.currentSellingPrice,
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
       <div id="customizationOverlay" class="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 hidden opacity-0 transition-all duration-300 flex items-center justify-center p-4">
        <div class="bg-white rounded-2xl w-full max-w-4xl h-[95vh] overflow-hidden shadow-2xl transform transition-all duration-300 scale-95 border border-[#e5e7eb] flex flex-col">
 
          <!-- HEADER -->
          <div class="sticky top-0 bg-gradient-to-b from-[#fff7d6] via-[#fffdf5] to-white border-b border-[#e5e7eb] px-3 sm:px-4 py-3 z-10 rounded-t-2xl shadow-sm">
              <div class="flex items-start justify-between gap-3">
 
                <div class="flex-1 min-w-0">

                  <h2 class="text-lg sm:text-xl font-semibold font-zain text-[#1D3C4A] leading-tight break-words mb-2">
                    ${escapeHtml(safeProductData.productName)}
                  </h2>

                  <div class="flex flex-wrap items-center gap-2">

                    <span class="text-xl sm:text-2xl font-bold font-lexend text-[#1D3C4A]">
                      ₹${safeProductData.currentSellingPrice.toLocaleString("en-IN")}
                    </span>

                    ${safeProductData.currentMrpPrice > safeProductData.currentSellingPrice
                    ? `
                    <span class="text-sm sm:text-base text-gray-400 font-lexend line-through">
                      ₹${safeProductData.currentMrpPrice.toLocaleString("en-IN")}
                    </span>`: ""}
                    ${discPct ? `
                    <span class="bg-[#e39f32] text-white text-xs font-semibold px-2 py-1 rounded-md">
                      ${discPct}% OFF
                    </span>` : ""      
                    }
                  </div>

              </div>
 
              <button
                id="closeCustomOverlayBtn"
                class="flex-shrink-0 w-8 h-8 flex items-center justify-center text-gray-400 hover:text-[#1D3C4A] hover:bg-gray-100 rounded-lg transition-all">
                <i class="fas fa-times text-lg"></i>
              </button>
            </div>
          </div>
 
          <!-- BODY -->
         <div class="flex-1 min-h-0 overflow-y-auto p-4 sm:p-6">
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-5 lg:gap-8">
 
      <!-- LEFT: Preview + Summary -->
      <div class="space-y-4">
        <!-- LEFT: Wire Frame OR Product Image + Summary -->
  <div class="space-y-4">
 
  ${
      // ── Decision: show wire frame OR product image ──────────────────────
      // Wire frame shown ONLY when both conditions met:
      //   1. frameCount > 0  (product needs user photos)
      //   2. frameStructure set  (we know how to lay them out)
      // Otherwise fall back to static product image
      safeProductData.frameCount > 0 && safeProductData.frameStructure
        ? `
        <!-- WIRE FRAME: empty slots, fills live when user uploads -->
        <div class="rounded-xl overflow-hidden border border-[#e5e7eb] bg-gray-50 p-3">
          <p class="text-xs text-gray-400 text-center mb-2 font-medium tracking-wide uppercase">
            Your Photo Preview
          </p>
          <!-- renderWireFrame() targets this container -->
          <div id="wireFrameContainer"
               data-frame-count="${safeProductData.frameCount}"
               data-frame-structure="${safeProductData.frameStructure}"
               class="w-full">
            <!-- slots injected by renderWireFrame() on overlay open -->
          </div>
        </div>
      `
        : `
        <!-- PRODUCT IMAGE: static, shown when no wire frame needed -->
        <div class="bg-gray-100 rounded-xl overflow-hidden aspect-square border border-[#e5e7eb] max-w-md mx-auto lg:max-w-none">
          <img id="customPreviewImage"
               src="${safeProductData.mainImage}"
               alt="Product preview"
               class="w-full h-full object-cover"
               onerror="this.src='${FALLBACK_IMG}'">
        </div>
      `
      }
 
    <!-- Customization Summary box (always shown) -->
    <div class="bg-gray-50 rounded-xl p-4 border border-[#e5e7eb]">
        <h3 class="font-semibold text-[#1D3C4A] mb-2">Customization Summary</h3>
        <div id="customSummary" class="text-sm text-gray-600 space-y-1 max-h-40 overflow-y-auto"></div>
        <div class="mt-3 pt-3 border-t border-[#e5e7eb]">
          <div class="flex justify-between items-center">
             <span class="font-semibold text-gray-700">Total Price</span> 
             <span id="customTotalPrice" class="text-2xl font-bold text-[#e39f32]">₹${safeProductData.currentSellingPrice.toLocaleString("en-IN")}</span>
          </div>
        </div>
      </div>
    
    </div>
    
  </div>

    <!-- RIGHT: Custom Fields -->
    <div class="space-y-6">
      <div id="customFieldsContainer"
      class="space-y-5  pr-1 sm:pr-2 custom-scrollbar">
      </div>

          <!-- WhatsApp Number -->
          <div class="bg-white border border-[#e5e7eb] rounded-xl p-5 shadow-sm">

              <div class="flex items-start gap-3">

                <div class="w-10 h-10 sm:w-12 sm:h-12 bg-green-100 rounded-xl flex items-center justify-center flex-shrink-0">
                  <i class="fab fa-whatsapp text-xl sm:text-2xl text-green-600"></i>
                </div>

                <div class="flex-1">

                  <h4 class="font-semibold text-gray-900">
                    WhatsApp Number
                  </h4>

                  <p class="text-sm text-gray-500 mt-1">
                    Enter your WhatsApp number so we can send you the preview of your customized design.
                  </p>

                  <div class="mt-4 flex items-center border border-[#e5e7eb] rounded-lg overflow-hidden focus-within:ring-1 focus-within:ring-green-500">

                    <span class="px-3 bg-gray-50 text-gray-600 text-sm border-r">
                      +91
                    </span>

                    <input
                      type="tel"
                      id="customerWhatsappNumber"
                      placeholder="Enter your WhatsApp number"
                      maxlength="10"
                      class="w-full px-3 py-2 outline-none text-sm"/>

                  </div>

                  <p class="text-xs text-gray-400 mt-2">
                    Our designer will send the customized design preview to this number before final processing.
                  </p>
                </div>
              </div>
            </div>
 
            <!-- IMPORTANT NOTE -->
              <div class="bg-orange-50 border border-orange-200 rounded-lg p-3 flex gap-3">
                  <i class="fas fa-exclamation-circle text-orange-600 mt-0.5 flex-shrink-0"></i>
 
                  <p class="text-xs text-gray-700 leading-relaxed">
                      <span class="font-semibold">Important:</span>
                      Customized products cannot be returned or exchanged after confirmation.
                      A design preview will be shared on WhatsApp for approval before production.
                  </p>
              </div>
              </div>  
            </div>
          </div>
 
          <!-- FOOTER -->
          <div class="sticky bottom-0 bg-white border-t border-[#e5e7eb] px-3 sm:px-5 py-3 flex flex-col sm:flex-row justify-end gap-2">
 
                <button id="cancelCustomBtn"
                  class="w-full sm:w-auto px-4 py-2 border border-[#e5e7eb] rounded-lg hover:bg-gray-50 transition text-sm font-medium text-[#1D3C4A]">
                  Cancel
                </button>
 
                <button id="addCustomizedToCartBtn"
                  class="w-full sm:w-auto px-4 py-2 bg-[#1D3C4A] text-white rounded-lg hover:opacity-90 transition text-sm font-medium flex items-center justify-center gap-1.5">
                  <i class="fas fa-cart-plus text-xs"></i>
                  Add to Cart
                </button>
 
                <button id="buyCustomizedNowBtn"
                  class="w-full sm:w-auto px-4 py-2 bg-[#e39f32] text-white rounded-lg hover:opacity-90 transition text-sm font-medium flex items-center justify-center gap-1.5">
                  <i class="fas fa-arrow-right text-xs"></i>
                  Buy Now
                </button>
 
            </div>
        </div>
      </div>`;

    document.body.insertAdjacentHTML("beforeend", overlayHTML);

    if (!document.getElementById("customizationStyles")) {
      const style = document.createElement("style");
      style.id = "customizationStyles";
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
      const fieldId = `custom_${field.fieldId}`;
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
                           focus:border-[#e39f32] focus:ring-1 focus:ring-[#e39f32] outline-none transition"
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
            const optId = `${fieldId}_opt_${i}`;
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
    // Track slot numbers across image fields (1st image input = slot 1, etc.)
    let imageSlotCounter = 0;

    // ── Wire up image upload preview ─────────────────────────────────────────
    container.querySelectorAll('input[type="file"]').forEach((fileInput) => {

      // REPLACE WITH:
      // ── Each image field gets its own slot number (1-based) ────────────────
      imageSlotCounter++;
      const thisSlotNumber = imageSlotCounter; // capture for closure

      const preview = document.getElementById(`${fileInput.id}_preview`);

      fileInput.addEventListener("change", function () {
        const file = this.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
          const dataUrl = e.target.result;

          // ── Show small inline preview below the upload box ─────────────
          if (preview) {
            preview.src = dataUrl;
            preview.style.display = "block";
          }

          // ── Store placeholder (NOT base64) — actual File read later ────
          // base64 kept out of customFieldValues to keep payload lean
          // getUploadedImageFiles() reads files[0] directly from input
          customFieldValues[this.name] = "[Image attached]";

          // ── WIRE FRAME MODE: fill the matching slot with live preview ───
          // frameCount > 0 + frameStructure set = wire frame is active
          if (safeProductData.frameCount > 0 && safeProductData.frameStructure) {
            fillWireFrameSlot(thisSlotNumber, dataUrl);
          } else {
            // ── NON-WIRE-FRAME MODE: update left panel product image ──────
            // Shows uploaded image in place of product image for reference
            const leftPreview = document.getElementById("customPreviewImage");
            if (leftPreview) leftPreview.src = dataUrl;
          }

          updateCustomizationPrice();
        };
        reader.readAsDataURL(file);
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



  function renderWireFrame() {
    // ── Guard: only run if wire frame container exists ──────────────────────
    const container = document.getElementById("wireFrameContainer");
    if (!container) return; // no wire frame mode → exit silently

    const frameCount = safeProductData.frameCount || 0;
    const frameStructure = safeProductData.frameStructure || "grid-2";

    // ── Nothing to render if no slots needed ───────────────────────────────
    if (frameCount === 0) return;

    // ── Slot HTML builder ───────────────────────────────────────────────────
    // Each slot = a dashed box with a camera icon + slot number
    // When user uploads, fillWireFrameSlot() replaces the icon with their image
    const buildSlot = (slotNum) => `
    <div id="wireSlot_${slotNum}"
         class="wire-slot relative bg-white border-2 border-dashed border-gray-300
                rounded-xl flex items-center justify-center overflow-hidden
                transition-all duration-300"
         style="min-height: 220px; min-width: 140px;">
      <!-- Empty state: camera icon + label -->
      <div class="wire-slot-empty flex flex-col items-center gap-1 text-gray-300 p-4">
        <i class="fas fa-camera text-3xl"></i>
        <span class="text-xs font-medium">Photo ${slotNum}</span>
      </div>
      <!-- Filled state: user's uploaded image (hidden until upload) -->
      <img id="wireSlotImg_${slotNum}"
           class="wire-slot-img absolute inset-0 w-full h-full object-cover hidden"
           alt="Slot ${slotNum} preview">
    </div>
  `;

    // ── Layout builder based on frameStructure ──────────────────────────────
    let layoutHTML = "";

    switch (frameStructure) {

      // ── grid-2: [ slot1 | slot2 ]  side by side ──────────────────────────
      case "grid-2":
        layoutHTML = `
        <div class="grid grid-cols-2 gap-2">
          ${buildSlot(1)}
          ${buildSlot(2)}
        </div>`;
        break;

      // ── grid-3: [ slot1 | slot2 | slot3 ]  3 equal columns ───────────────
      case "grid-3":
        layoutHTML = `
        <div class="grid grid-cols-3 gap-2">
          ${buildSlot(1)}
          ${buildSlot(2)}
          ${buildSlot(3)}
        </div>`;
        break;

      // ── grid-4: [ slot1 | slot2 ]  2×2 grid ──────────────────────────────
      //           [ slot3 | slot4 ]
      case "grid-4":
        layoutHTML = `
        <div class="grid grid-cols-2 gap-2">
          ${buildSlot(1)}
          ${buildSlot(2)}
          ${buildSlot(3)}
          ${buildSlot(4)}
        </div>`;
        break;

      // ── stack-2: slot1 on top, slot2 below ───────────────────────────────
      case "stack-2":
        layoutHTML = `
        <div class="flex flex-col gap-2">
          ${buildSlot(1)}
          ${buildSlot(2)}
        </div>`;
        break;

      // ── single: one full-width slot ───────────────────────────────────────
      case "single":
        layoutHTML = `
        <div class="w-full">
          ${buildSlot(1)}
        </div>`;
        break;

      // ── fallback: treat as grid-2 if unknown structure passed ─────────────
      default:
        layoutHTML = `
        <div class="grid grid-cols-2 gap-2">
          ${buildSlot(1)}
          ${buildSlot(2)}
        </div>`;
    }

    // ── Inject into container ───────────────────────────────────────────────
    container.innerHTML = layoutHTML;
  }


  // ═══════════════════════════════════════════════════════════════════════════
  //  PATCH 4 — fillWireFrameSlot()   [NEW FUNCTION]
  //  WHERE : Add right after renderWireFrame()
  //  WHAT  : Called when user uploads an image in a custom field
  //          Finds the matching wire frame slot and shows the uploaded image
  //
  //  slotNumber : 1-based index matching field order (1st image field = slot 1)
  //  imageDataUrl: base64 string from FileReader (for instant local preview)
  // ═══════════════════════════════════════════════════════════════════════════

  function fillWireFrameSlot(slotNumber, imageDataUrl) {
    // ── Guard: wire frame mode only ─────────────────────────────────────────
    const frameCount = safeProductData.frameCount || 0;
    if (frameCount === 0) return; // no wire frame → do nothing

    // ── Find the slot img element ───────────────────────────────────────────
    const slotImg = document.getElementById(`wireSlotImg_${slotNumber}`);
    const slotEmpty = document.querySelector(`#wireSlot_${slotNumber} .wire-slot-empty`);

    if (!slotImg) return; // slot doesn't exist for this number → skip

    // ── Fill the slot with uploaded image ──────────────────────────────────
    slotImg.src = imageDataUrl;
    slotImg.classList.remove("hidden");   // show the image
    if (slotEmpty) slotEmpty.classList.add("hidden"); // hide camera icon

    // ── Visual feedback: slot border turns gold when filled ─────────────────
    const slotBox = document.getElementById(`wireSlot_${slotNumber}`);
    if (slotBox) {
      slotBox.classList.remove("border-gray-300");
      slotBox.classList.add("border-[#e39f32]"); // gold border = uploaded ✅
    }
  }

  function updateCustomizationPrice() {
    let total = safeProductData.currentSellingPrice;
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

    customFieldValues = {};
    currentCustomFields = {};

    const customFields = safeProductData.customFields || [];
    if (customFields.length > 0) {
      buildCustomFieldsUI(customFields);

      // ── CUSTOMIZATION PATCH: render wire frame after fields are built ────
      // renderWireFrame() checks frameCount + frameStructure internally
      // Does nothing if frameCount is 0/null (non-wire-frame products)
      renderWireFrame();
    } else {
      const c = document.getElementById("customFieldsContainer");
      if (c) c.innerHTML =
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

    // Browser console mein paste karo after product loads:
    console.log("frameCount:", safeProductData.frameCount);
    console.log("frameStructure:", safeProductData.frameStructure);
    console.log("customFields:", safeProductData.customFields);


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


  // ═══════════════════════════════════════════════════════════════════════════
  //  PATCH 7 — validateCustomFields()   [NEW FUNCTION]
  //  WHERE : Add before addCustomizedToCart()
  //  WHAT  : Checks all required fields before submission
  //          Returns { valid: true } or { valid: false, message: "..." }
  // ═══════════════════════════════════════════════════════════════════════════

  function validateCustomFields() {
    // ── Loop through all custom fields and validate required ones ───────────
    for (const [fieldId, field] of Object.entries(currentCustomFields)) {
      if (!field.required) continue; // skip optional fields

      const inputType = field.inputType;

      if (inputType === "image") {
        // ── Image field: check if file input has a file selected ────────────
        const fileInput = document.getElementById(fieldId);
        if (!fileInput || !fileInput.files || fileInput.files.length === 0) {
          return {
            valid: false,
            message: `Please upload an image for "${field.fieldLabel || field.fieldName}"`,
          };
        }

      } else if (inputType === "radio") {
        // ── Radio field: check if any option selected ───────────────────────
        const checked = document.querySelector(
          `input[name="${field.fieldName}"]:checked`
        );
        if (!checked) {
          return {
            valid: false,
            message: `Please select an option for "${field.fieldLabel || field.fieldName}"`,
          };
        }

      } else if (inputType === "checkbox") {
        // ── Checkbox: skip — optional by nature even if marked required ──────
        continue;

      } else {
        // ── Text / number / textarea / dropdown ─────────────────────────────
        const el = document.getElementById(fieldId);
        const value = el ? el.value.trim() : "";
        if (!value) {
          return {
            valid: false,
            message: `Please fill in "${field.fieldLabel || field.fieldName}"`,
          };
        }
      }
    }

    // ── WhatsApp number: optional, but must be 10 digits if filled ──────────
    const waInput = document.getElementById("customerWhatsappNumber");
    if (waInput && waInput.value.trim()) {
      const digits = waInput.value.trim().replace(/\D/g, "");
      if (digits.length !== 10) {
        return {
          valid: false,
          message: "Please enter a valid 10-digit WhatsApp number",
        };
      }
    }

    // ── All validations passed ──────────────────────────────────────────────
    return { valid: true };
  }

  // ═══════════════════════════════════════════════════════════════════════════
  //  PATCH 8 — uploadCustomizationImage()   [NEW FUNCTION]
  //  WHERE : Add near addCustomizedToCart()
  //  WHAT  : Uploads a single File object to backend
  //          Returns assetUuid string on success, null on failure
  //          Called once per image field inside addCustomizedToCart()
  // ═══════════════════════════════════════════════════════════════════════════

  async function uploadCustomizationImage(imageFile) {
    try {
      const userId = USER_ID; // your existing helper

      // ── Build multipart form data ───────────────────────────────────────
      const formData = new FormData();
      formData.append("file", imageFile);
      if (userId) formData.append("userId", String(userId));

      // ── POST to upload endpoint ─────────────────────────────────────────
      // NOTE: Do NOT set Content-Type header manually
      // Browser automatically sets multipart/form-data with correct boundary
      const res = await fetch(`${BASE_URL}/api/v1/customize/upload-image`, {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.message || `Upload failed: HTTP ${res.status}`);
      }

      const data = await res.json();
      const assetUuid = data?.data?.assetUuid;

      if (!assetUuid) throw new Error("No assetUuid returned from upload");

      console.log("[Customize] Image uploaded successfully | assetUuid:", assetUuid);
      return assetUuid;

    } catch (err) {
      console.error("[Customize] Image upload error:", err.message);
      return null; // caller handles null as upload failure
    }
  }




  // ═══════════════════════════════════════════════════════════════════════════
  //  PATCH 9 — addCustomizedToCart()   [FULL REPLACE]
  //  WHERE : Replace existing addCustomizedToCart() entirely
  //  WHAT  : New multi-image flow:
  //            1. Validate required fields
  //            2. Upload all image files sequentially → collect assetUuids
  //            3. Build assetSlots array for backend
  //            4. Build customFieldsJson (text fields only, NO base64)
  //            5. POST to /api/v1/customize/add-to-cart
  //            6. On success: update cart badge, close overlay
  // ═══════════════════════════════════════════════════════════════════════════

  async function addCustomizedToCart() {
    const btn = document.getElementById("addCustomizedToCartBtn");

    try {
      // ── STEP 1: Validate all required custom fields ─────────────────────
      const validation = validateCustomFields();
      if (!validation.valid) {
        showToast(validation.message, "error");
        return;
      }

      // ── STEP 2: Show uploading state on button ──────────────────────────
      if (btn) {
        btn.disabled = true;
        btn.innerHTML = `<i class="fas fa-spinner fa-spin text-xs"></i> Uploading...`;
      }

      // ── STEP 3: Collect all image files from custom field inputs ────────
      // Returns: [{ slotNumber, fieldName, fieldId, file }, ...]
      const uploadedFiles = getUploadedImageFiles();

      // ── STEP 4: Upload each image sequentially → collect assetSlots ────
      // assetSlots = array backend expects: [{ slotNumber, assetUuid, fieldName }]
      const assetSlots = [];

      for (const fileEntry of uploadedFiles) {
        const uuid = await uploadCustomizationImage(fileEntry.file);

        if (!uuid) {
          // Upload failed for this slot — stop and show error
          showToast(
            `Failed to upload image for "${fileEntry.fieldName}". Please try again.`,
            "error"
          );
          return; // finally block will restore button
        }

        assetSlots.push({
          slotNumber: fileEntry.slotNumber,  // 1, 2, 3 ...
          assetUuid: uuid,                   // UUID from backend upload response
          fieldName: fileEntry.fieldName,    // "upload image", "upload image - 2"
        });
      }

      // ── STEP 5: Build customFieldsJson (text fields ONLY) ───────────────
      // Strip base64 / "[Image attached]" — images tracked via assetSlots
      const textOnlyFields = {};

      for (const [key, value] of Object.entries(customFieldValues)) {
        // Skip image placeholders — image data goes in assetSlots, not here
        if (typeof value === "string" && value.startsWith("data:image")) continue;
        if (value === "[Image attached]") continue;
        textOnlyFields[key] = value;
      }

      // ── STEP 6: Add frameCount to customFieldsJson for admin reference ──
      // Admin panel reads this to know how many images to expect
      if (safeProductData.frameCount) {
        textOnlyFields["frameCount"] = safeProductData.frameCount;
      }

      // ── STEP 7: Add frameStructure to customFieldsJson ──────────────────
      if (safeProductData.frameStructure) {
        textOnlyFields["frameStructure"] = safeProductData.frameStructure;
      }

      // ── STEP 8: WhatsApp number from dedicated input (if filled) ────────
      const waNumber = document.getElementById("customerWhatsappNumber")?.value?.trim();
      if (waNumber) {
        textOnlyFields["whatsappNumber"] = waNumber;
      }

      // ── STEP 9: Calculate final price from overlay total display ────────
      const totalText = document.getElementById("customTotalPrice")?.textContent || "";
      const finalPrice =
        parseInt(totalText.replace(/[^0-9]/g, ""), 10) ||
        safeProductData.currentSellingPrice;

      // ── STEP 10: Get selected variant and quantity ───────────────────────
      const variant = getSelectedVariant();
      const quantity = parseInt(
        document.getElementById("quantity")?.textContent || "1",
        10
      );

      // ── STEP 11: Update button to "Adding..." ────────────────────────────
      if (btn) {
        btn.innerHTML = `<i class="fas fa-spinner fa-spin text-xs"></i> Adding...`;
      }

      // ── STEP 12: Build final payload for /customize/add-to-cart ─────────
      const customPayload = {
        userId: USER_ID,
        sessionId: null,
        productId: safeProductData.productId,
        variantId: variant?.variantId || null,
        sku: variant?.sku || safeProductData.currentSku,
        selectedColor: variant?.color || safeProductData.selectedColor || null,
        selectedSize: variant?.size || safeProductData.productSize || null,
        productName: safeProductData.productName,
        titleName: safeProductData.productName,
        unitPrice: finalPrice,
        mrpPrice: safeProductData.currentMrpPrice,
        quantity: quantity,
        // Text-only fields: size selection, mobile number, frameCount etc.
        customFieldsJson: Object.keys(textOnlyFields).length > 0
          ? JSON.stringify(textOnlyFields)
          : null,
        // Image slots: [{ slotNumber:1, assetUuid:"uuid-1", fieldName:"upload image" }, ...]
        // Empty array if product has no image fields (text-only customization)
        assetSlots: assetSlots,
      };

      // ── STEP 13: POST to new customized cart endpoint ────────────────────
      // NOTE: This hits /customize/add-to-cart NOT /cart/add
      // Existing cart/add is completely untouched
      const res = await fetch(`${BASE_URL}/api/v1/customize/add-to-cart`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(customPayload),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.message || `HTTP ${res.status}`);
      }

      // ── STEP 14: Success — update UI ─────────────────────────────────────
      const pid = Number(safeProductData.productId);
      addedToCartSet.add(pid); // mark as added (prevents duplicate add)

      showToast("Customized product added to cart! 🛒", "success");
      dispatchCartEvent(); // fires CustomEvent → header badge updates

      // ── Update Add to Cart buttons → "Go to Cart" ───────────────────────
      document.querySelectorAll(".add-to-cart-btn").forEach((addBtn) => {
        addBtn.innerHTML = `<i class="fa-solid fa-bag-shopping"></i> <span class="text-sm whitespace-nowrap">Go to Cart</span>`;
        addBtn.style.background = "#e39f32";
        addBtn.style.color = "#1D3C4A";
        addBtn.style.fontWeight = "600";
        addBtn.style.borderColor = "#e39f32";
      });

      closeCustomizationOverlay(); // close overlay after success

    } catch (err) {
      console.error("[CustomCart] Add to cart error:", err);
      showToast(err.message || "Could not add to cart. Please try again.", "error");

    } finally {
      // ── Always restore button regardless of success/failure ─────────────
      if (btn) {
        btn.disabled = false;
        btn.innerHTML = `<i class="fas fa-cart-plus text-xs"></i> Add to Cart`;
      }
    }
  }



  // ═══════════════════════════════════════════════════════════════════════════
  //  PATCH 6 — getUploadedImageFiles()   [NEW FUNCTION]
  //  WHERE : Add near addCustomizedToCart()
  //  WHAT  : Collects all File objects from image inputs in the overlay
  //          Returns array of { slotNumber, fieldName, fieldId, file }
  //          slotNumber matches wire frame slots (1-based, image fields only)
  // ═══════════════════════════════════════════════════════════════════════════

  function getUploadedImageFiles() {
    const container = document.getElementById("customFieldsContainer");
    if (!container) return [];

    const fileInputs = container.querySelectorAll('input[type="file"]');
    const uploadedFiles = [];
    let slotCounter = 0;

    fileInputs.forEach((input) => {
      slotCounter++; // slot numbers are 1-based across image fields only

      // ── Only include inputs that actually have a file selected ──────────
      if (input.files && input.files.length > 0) {
        uploadedFiles.push({
          slotNumber: slotCounter,          // wire frame slot number
          fieldName: input.name,           // e.g. "upload image", "upload image - 2"
          fieldId: input.dataset.fieldId, // e.g. "custom_1", "custom_4"
          file: input.files[0],        // actual File object
        });
      }
    });

    // Returns: [{ slotNumber:1, fieldName:"upload image", file:File }, ...]
    return uploadedFiles;
  }


  // ═══════════════════════════════════════════════════════════════════════════
  // NEW FUNCTION — Upload image to backend, return assetUuid
  // Called from addCustomizedToCart() before cart add
  // ═══════════════════════════════════════════════════════════════════════════
  async function uploadCustomizationImage(imageFile) {
    try {
      const userId = USER_ID;
      const formData = new FormData();
      formData.append("file", imageFile);

      if (userId) formData.append("userId", userId);

      const res = await fetch(
        `${BASE_URL}/api/v1/customize/upload-image`, {
        method: "POST",
        body: formData,
        // Note: NO Content-Type header — browser sets multipart boundary automatically
      }
      );

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.message || `Upload failed: HTTP ${res.status}`);
      }

      const data = await res.json();
      const assetUuid = data?.data?.assetUuid;

      if (!assetUuid) throw new Error("No assetUuid in upload response");

      console.log("[Customize] Image uploaded | assetUuid:", assetUuid);
      return assetUuid;

    } catch (err) {
      console.error("[Customize] Upload error:", err);
      return null;
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // NEW FUNCTION — Validate required custom fields before submission
  // Returns { valid: true } or { valid: false, message: "..." }
  // ═══════════════════════════════════════════════════════════════════════════
  function validateCustomFields() {
    for (const [fieldId, field] of Object.entries(currentCustomFields)) {
      if (!field.required) continue;

      const inputType = field.inputType;

      if (inputType === "image") {
        // Check actual file input
        const fileInput = document.getElementById(fieldId);
        if (!fileInput || !fileInput.files || fileInput.files.length === 0) {
          return {
            valid: false,
            message: `Please upload an image for "${field.fieldLabel || field.fieldName}"`,
          };
        }

      } else if (inputType === "radio") {
        const checked = document.querySelector(
          `input[name="${field.fieldName}"]:checked`
        );
        if (!checked) {
          return {
            valid: false,
            message: `Please select an option for "${field.fieldLabel || field.fieldName}"`,
          };
        }

      } else if (inputType === "checkbox") {
        // Checkboxes are optional by nature — skip required check

      } else {
        const el = document.getElementById(fieldId);
        const value = el ? el.value.trim() : "";
        if (!value) {
          return {
            valid: false,
            message: `Please fill in "${field.fieldLabel || field.fieldName}"`,
          };
        }
      }
    }

    // WhatsApp number — optional but if filled must be 10 digits
    const waInput = document.getElementById("customerWhatsappNumber");
    if (waInput && waInput.value.trim()) {
      const digits = waInput.value.trim().replace(/\D/g, "");
      if (digits.length !== 10) {
        return {
          valid: false,
          message: "Please enter a valid 10-digit WhatsApp number",
        };
      }
    }

    return { valid: true };
  }

  //=========== patch end for customized cart ==========//

  // ═══════════════════════════════════════════════════════════════════════════
  //  PATCH 10 — buyCustomizedNow()   [FULL REPLACE]
  //  WHERE : Replace existing buyCustomizedNow() entirely
  //  WHAT  : Same flow as addCustomizedToCart() but redirects to checkout
  //          after successful cart add instead of just closing overlay
  // ═══════════════════════════════════════════════════════════════════════════

  async function buyCustomizedNow() {
    const btn = document.getElementById("buyCustomizedNowBtn");

    try {
      // ── STEP 1: Validate required fields (same as addCustomizedToCart) ──
      const validation = validateCustomFields();
      if (!validation.valid) {
        showToast(validation.message, "error");
        return;
      }

      // ── STEP 2: Show loading state ───────────────────────────────────────
      if (btn) {
        btn.disabled = true;
        btn.innerHTML = `<i class="fas fa-spinner fa-spin text-xs"></i> Processing...`;
      }

      // ── STEP 3–13: Exact same upload + cart add flow as addCustomizedToCart
      // (keeping DRY — call addCustomizedToCart logic inline)
      const uploadedFiles = getUploadedImageFiles();
      const assetSlots = [];

      for (const fileEntry of uploadedFiles) {
        const uuid = await uploadCustomizationImage(fileEntry.file);
        if (!uuid) {
          showToast(
            `Failed to upload image for "${fileEntry.fieldName}". Please try again.`,
            "error"
          );
          return;
        }
        assetSlots.push({
          slotNumber: fileEntry.slotNumber,
          assetUuid: uuid,
          fieldName: fileEntry.fieldName,
        });
      }

      const textOnlyFields = {};
      for (const [key, value] of Object.entries(customFieldValues)) {
        if (typeof value === "string" && value.startsWith("data:image")) continue;
        if (value === "[Image attached]") continue;
        textOnlyFields[key] = value;
      }
      if (safeProductData.frameCount) textOnlyFields["frameCount"] = safeProductData.frameCount;
      if (safeProductData.frameStructure) textOnlyFields["frameStructure"] = safeProductData.frameStructure;

      const waNumber = document.getElementById("customerWhatsappNumber")?.value?.trim();
      if (waNumber) textOnlyFields["whatsappNumber"] = waNumber;

      const totalText = document.getElementById("customTotalPrice")?.textContent || "";
      const finalPrice = parseInt(totalText.replace(/[^0-9]/g, ""), 10) || safeProductData.currentSellingPrice;
      const variant = getSelectedVariant();
      const quantity = parseInt(document.getElementById("quantity")?.textContent || "1", 10);

      const customPayload = {
        userId: USER_ID,
        sessionId: null,
        productId: safeProductData.productId,
        variantId: variant?.variantId || null,
        sku: variant?.sku || safeProductData.currentSku,
        selectedColor: variant?.color || safeProductData.selectedColor || null,
        selectedSize: variant?.size || safeProductData.productSize || null,
        productName: safeProductData.productName,
        titleName: safeProductData.productName,
        unitPrice: finalPrice,
        mrpPrice: safeProductData.currentMrpPrice,
        quantity: quantity,
        customFieldsJson: Object.keys(textOnlyFields).length > 0
          ? JSON.stringify(textOnlyFields)
          : null,
        assetSlots: assetSlots,
      };

      const res = await fetch(`${BASE_URL}/api/v1/customize/add-to-cart`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(customPayload),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.message || `HTTP ${res.status}`);
      }

      // ── STEP 14: Success → go directly to checkout ───────────────────────
      showToast("Redirecting to checkout...", "success");
      setTimeout(() => {
        // Replace with your actual checkout page path
        window.location.href = "/Checkout/checkout.html";
      }, 800);

    } catch (err) {
      console.error("[BuyNow] Error:", err);
      showToast(err.message || "Could not process. Please try again.", "error");

    } finally {
      // ── Always restore button ────────────────────────────────────────────
      if (btn) {
        btn.disabled = false;
        btn.innerHTML = `<i class="fas fa-arrow-right text-xs"></i> Buy Now`;
      }
    }
  }


  // ═══════════════════════════════════════════════════════════════════════════
  //  COUPON
  // ═══════════════════════════════════════════════════════════════════════════

  async function fetchUserCoupons() {
    try {
      // ── Resolve userId ───────────────────────────────────────────────────────
      let userId = localStorage.getItem("userId") || sessionStorage.getItem("userId");

      // Fallback: parse from stored user object
      if (!userId) {
        const rawUser = localStorage.getItem("user") || sessionStorage.getItem("user");
        if (rawUser) {
          try {
            const parsed = JSON.parse(rawUser);
            userId = parsed?.userId || parsed?.id || parsed?.user_id || null;
          } catch (_) { }
        }
      }

      // Fallback: decode JWT directly
      if (!userId) {
        const token = localStorage.getItem("token")
          || localStorage.getItem("jwtToken")
          || localStorage.getItem("authToken")
          || sessionStorage.getItem("token")
          || sessionStorage.getItem("jwtToken");
        if (token) {
          try {
            const payload = JSON.parse(atob(token.split(".")[1]));
            userId = payload?.userId || payload?.user_id || payload?.id || payload?.sub || null;
          } catch (_) { }
        }
      }

      // ── Resolve productPrimeId ───────────────────────────────────────────────
      const productPrimeId = safeProductData?.productPrimeId
        || safeProductData?.productId
        || safeProductData?.id;

      console.log("[Coupons] userId:", userId);
      console.log("[Coupons] productPrimeId:", productPrimeId);
      console.log("[Coupons] safeProductData keys:", safeProductData ? Object.keys(safeProductData) : "null");

      if (!userId || !productPrimeId) {
        console.warn("[Coupons] Skipping fetch — missing userId:", userId, "productPrimeId:", productPrimeId);
        return [];
      }

      const url = `${BASE_URL}/api/v1/coupons/get-by-product?userId=${userId}&productPrimeId=${productPrimeId}`;
      console.log("[Coupons] Fetching URL:", url);

      const res = await fetch(url);
      console.log("[Coupons] Response status:", res.status);

      if (!res.ok) {
        console.warn("[Coupons] Bad response:", res.status, res.statusText);
        return [];
      }

      const data = await res.json();
      console.log("[Coupons] Raw response:", data);

      return Array.isArray(data) ? data : [];
    } catch (e) {
      console.warn("[Coupons] Failed to fetch user coupons:", e);
      return [];
    }
  }
  // ── END PATCH ───────────────────────────────────────────────────────────────


  // ── PATCH: Build coupon card HTML (display-only, no apply btn) ──────────────
  function buildUserCouponCardHTML(coupon) {
    const now = new Date();
    // Parse validTo in IST context
    const validTo = coupon.validTo ? new Date(coupon.validTo) : null;

    let urgencyBadgeHTML = "";
    let timerHTML = "";

    if (validTo) {
      const diffMs = validTo - now;
      const diffHours = diffMs / (1000 * 60 * 60);
      const diffDays = diffMs / (1000 * 60 * 60 * 24);

      if (diffMs > 0 && diffDays <= 1) {
        // Under 1 day left — show live countdown timer
        const countdownId = `coupon-timer-${coupon.couponId}`;
        urgencyBadgeHTML = `
        <div class="flex items-center gap-1 mt-1.5 px-2 py-0.5 rounded-full bg-red-50 border border-red-200 w-fit animate-pulse">
          <i class="fa-solid fa-fire text-red-500 text-[9px]"></i>
          <span class="text-[9px] font-semibold text-red-600 uppercase tracking-wide">Grab your deal · Expiring soon!</span>
        </div>`;
        timerHTML = `
        <div class="mt-2 flex items-center gap-1.5">
          <span class="text-[10px] text-gray-500">Expires in:</span>
          <div class="flex items-center gap-[3px]" id="${countdownId}">
            <div class="bg-red-50 border border-red-200 px-1.5 py-[2px] rounded text-[11px] font-mono font-bold text-red-600 countdown-h">00</div>
            <span class="text-red-400 font-bold text-[10px]">:</span>
            <div class="bg-red-50 border border-red-200 px-1.5 py-[2px] rounded text-[11px] font-mono font-bold text-red-600 countdown-m">00</div>
            <span class="text-red-400 font-bold text-[10px]">:</span>
            <div class="bg-red-50 border border-red-200 px-1.5 py-[2px] rounded text-[11px] font-mono font-bold text-red-600 countdown-s">00</div>
          </div>
        </div>`;
      }
    }

    const discountLabel = coupon.discountType === "PERCENTAGE"
      ? `${coupon.discountValue}% OFF`
      : `₹${coupon.discountValue} OFF`;

    const minOrder = coupon.minOrderAmount
      ? `<p class="text-[10px] text-gray-400 mt-1">Min. Order: ₹${coupon.minOrderAmount.toLocaleString("en-IN")}</p>`
      : "";

    const maxDisc = coupon.maxDiscountAmount && coupon.discountType === "PERCENTAGE"
      ? `<p class="text-[10px] text-gray-400">Max. Discount: ₹${coupon.maxDiscountAmount.toLocaleString("en-IN")}</p>`
      : "";

    const freeShipping = coupon.freeShipping
      ? `<span class="inline-flex items-center gap-1 mt-1 text-[10px] bg-green-50 border border-green-200 text-green-700 px-2 py-0.5 rounded-full">
         <i class="fa-solid fa-truck text-[9px]"></i> Free Shipping Included
       </span>`
      : "";

    const alreadyUsed = coupon.couponUsed
      ? `<span class="inline-flex items-center gap-1 mt-1 text-[10px] bg-gray-100 border border-gray-200 text-gray-500 px-2 py-0.5 rounded-full">
         <i class="fa-solid fa-check text-[9px]"></i> Already Used
       </span>`
      : "";

    return `
    <div class="bg-gradient-to-br from-[#e39f32]/5 to-[#1D3C4A]/5 rounded-xl p-4 border border-gray-400 coupon-card"
         data-coupon-id="${coupon.couponId}"
         data-valid-to="${coupon.validTo || ""}">
      <div class="flex justify-between items-start gap-3">
        <div class="flex-1">
          <span class="text-xs text-[#e39f32] uppercase tracking-wide">Limited Time</span>
          ${urgencyBadgeHTML}
          <div class="font-lexend text-xl text-[#1D3C4A] mt-1">${discountLabel}</div>
          <p class="text-xs text-[#1D3C4A]/60 mt-1">${escapeHtml(coupon.description || "")}</p>
          ${minOrder}
          ${maxDisc}
          ${freeShipping}
          ${alreadyUsed}
          ${timerHTML}
        </div>
        <div class="bg-white px-3 py-2 rounded-lg border border-dashed border-[#e39f32] flex-shrink-0">
          <span class="font-mono text-sm text-[#1D3C4A]">${escapeHtml(coupon.couponCode)}</span>
        </div>
      </div>
      <div class="mt-3 flex items-center gap-1.5 text-[11px] text-[#1D3C4A]/60">
        <i class="fa-solid fa-cart-shopping text-[#e39f32] text-[10px]"></i>
        <span>Add to cart or Buy Now to avail this offer</span>
      </div>
    </div>`;
  }
  // ── END PATCH ───────────────────────────────────────────────────────────────


  // ── PATCH: Start live countdown timers for expiring coupons ─────────────────
  function startCouponCountdowns() {
    document.querySelectorAll(".coupon-card[data-valid-to]").forEach((card) => {
      const validToStr = card.getAttribute("data-valid-to");
      if (!validToStr) return;
      const validTo = new Date(validToStr);
      const timerId = card.querySelector("[id^='coupon-timer-']")?.id;
      if (!timerId) return;

      const tick = () => {
        const now = new Date();
        const diffMs = validTo - now;
        if (diffMs <= 0) {
          const el = document.getElementById(timerId);
          if (el) el.closest(".coupon-card")?.remove();
          return;
        }
        const h = String(Math.floor(diffMs / 3600000)).padStart(2, "0");
        const m = String(Math.floor((diffMs % 3600000) / 60000)).padStart(2, "0");
        const s = String(Math.floor((diffMs % 60000) / 1000)).padStart(2, "0");
        const wrap = document.getElementById(timerId);
        if (wrap) {
          wrap.querySelector(".countdown-h").textContent = h;
          wrap.querySelector(".countdown-m").textContent = m;
          wrap.querySelector(".countdown-s").textContent = s;
        }
      };

      tick();
      setInterval(tick, 1000);
    });
  }
  // ── END PATCH ───────────────────────────────────────────────────────────────




  //==== old depricated ======//
  function applyCoupon(couponCode) {
    const coupon = safeProductData.availabeCoupons?.find(
      (c) => c.couponCode === couponCode
    );
    if (!coupon) {
      showToast("Invalid coupon code", "error");
      return false;
    }

    const variant = getSelectedVariant();
    const price = variant?.price || safeProductData.currentSellingPrice;
    const discPct = parseFloat(coupon.discount);
    const saved = Math.round((price * discPct) / 100);
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
    let html = "";
    const full = Math.floor(rating);
    const half = rating - full >= 0.5 ? 1 : 0;
    const empty = max - full - half;
    for (let i = 0; i < full; i++)  html += '<i class="fa-solid fa-star"></i>';
    if (half) html += '<i class="fa-solid fa-star-half-alt"></i>';
    for (let i = 0; i < empty; i++) html += '<i class="fa-regular fa-star"></i>';
    return html;
  }

  function showToast(message, type = "info") {
    if (window.showGlobalToast) { window.showGlobalToast(message, type); return; }
    let toastEl = document.getElementById("pdToast");
    if (!toastEl) {
      toastEl = document.createElement("div");
      toastEl.id = "pdToast";
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
//  BUY NOW OVERLAY
// ═══════════════════════════════════════════════════════════════════════════

function showBuyNowOverlay() {
  // Remove any existing overlay first
  const existing = document.getElementById('buyNowOverlay');
  if (existing) existing.remove();

  const overlayHTML = `
    <div id="buyNowOverlay" class="fixed inset-0 bg-black/60 backdrop-blur-sm z-[2000] flex items-center justify-center">
      <div class="bg-white rounded-2xl p-8 max-w-sm w-full mx-4 shadow-2xl">
        <div class="text-center">
          <div class="flex justify-center mb-4">
            <div class="w-12 h-12 border-4 border-[#e39f32] border-t-transparent rounded-full animate-spin"></div>
          </div>
          <h3 class="text-lg font-semibold text-[#1D3C4A] mb-2" id="overlayTitle">Preparing your order…</h3>
          <p class="text-sm text-gray-500" id="overlaySub">Please wait a moment</p>
          <div class="mt-4 space-y-2 text-left">
            <div class="flex items-center gap-3 text-sm text-gray-400" id="step1">
              <span class="w-2 h-2 rounded-full bg-gray-300"></span>
              <span>Saving order details</span>
            </div>
            <div class="flex items-center gap-3 text-sm text-gray-400" id="step2">
              <span class="w-2 h-2 rounded-full bg-gray-300"></span>
              <span>Opening secure checkout</span>
            </div>
            <div class="flex items-center gap-3 text-sm text-gray-400" id="step3">
              <span class="w-2 h-2 rounded-full bg-gray-300"></span>
              <span>Redirecting to payment</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;

  document.body.insertAdjacentHTML('beforeend', overlayHTML);

  // Update step 1 to active
  const step1 = document.getElementById('step1');
  if (step1) {
    step1.querySelector('span:first-child').className = 'w-2 h-2 rounded-full bg-[#e39f32] animate-pulse';
    step1.className = 'flex items-center gap-3 text-sm text-[#1D3C4A] font-medium';
  }
}

function hideBuyNowOverlay() {
  const overlay = document.getElementById('buyNowOverlay');
  if (overlay) overlay.remove();
}

function updateOverlayStep(stepNumber, state) {
  // state: 'active', 'done'
  const step = document.getElementById('step' + stepNumber);
  if (!step) return;

  const dot = step.querySelector('span:first-child');
  if (state === 'active') {
    dot.className = 'w-2 h-2 rounded-full bg-[#e39f32] animate-pulse';
    step.className = 'flex items-center gap-3 text-sm text-[#1D3C4A] font-medium';
  } else if (state === 'done') {
    dot.className = 'w-2 h-2 rounded-full bg-green-500';
    step.className = 'flex items-center gap-3 text-sm text-green-600';
  }
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
      sku: v.sku,
      name: v.titleName || v.name,
      color: v.color,
      image: v.mainImage,
      price: v.price,
      mrp: v.mrp,
      stock: v.stock,
      size: v.size || "Standard",
      sizes: v.sizes || [],
    }));

    // Initial media list (product-level, before any variant selection)
    const initialMedia = getVariantMedia(currentVariant || { mainImage: safeProductData.mainImage, mockupImages: null, productVideoUrl: null });

    // Coupons HTML for offer overlay
    // Coupons HTML — overlay is lazy-loaded via fetchUserCoupons() on viewMoreBtn click
    // Static placeholder only; real cards injected by setupEventListeners patch

    // const firstCoupon  = safeProductData.availabeCoupons?.[0];
    const addCartText = safeProductData.isCustomizable ? "Customize" : "Add to Cart";
    const addCartIcon = safeProductData.isCustomizable
      ? '<i class="fas fa-sliders-h"></i>'
      : '<i class="fa-solid fa-cart-shopping"></i>';
    const buyNowText = safeProductData.isCustomizable ? "Customize & Buy" : "Buy Now";


    // Variant cards HTML
    // ─── PATCH 4: AMAZON-STYLE VARIANT SELECTOR ───────────────────────────────
    let variantCardsHTML = "";

    if (safeProductData.availableVariants.length > 1) {

      // ── Collect unique sizes preserving order (base first) ──────────────────
      const sizeOrder = [];
      safeProductData.availableVariants.forEach((v) => {
        if (v.size && !sizeOrder.includes(v.size)) sizeOrder.push(v.size);
      });

      // ── Size → variants map ──────────────────────────────────────────────────
      const sizeMap = {};
      sizeOrder.forEach((s) => {
        sizeMap[s] = safeProductData.availableVariants.filter((v) => v.size === s);
      });

      // ── Default: first size, first color of that size ───────────────────────
      const defaultSize = sizeOrder[0];
      const defaultVariant = sizeMap[defaultSize][0];

    variantCardsHTML = `
    <div class="mt-5 space-y-5" id="variantSection">

      <!-- SIZE SELECTOR -->
      <div>
        <div class="flex items-center gap-2 mb-2">
          <span class="text-sm font-semibold text-[#033E59]">Size</span>
          <div class="h-px bg-gray-200 flex-1"></div>
        </div>
       
        <div class="flex flex-wrap gap-2" id="sizePills">
          ${sizeOrder.map((size, idx) => `
            <button class="size-pill px-4 py-2 rounded-lg border-2 text-xs
                           font-medium transition-all duration-200 rounded-xl
                           ${idx === 0
          ? "border-[#E6A62C] bg-[#1D3C4A] text-white shadow-sm"
          : "border-gray-200 text-gray-600 hover:border-[#E6A62C]"}"
                    data-size="${escapeHtml(size)}">
              ${escapeHtml(size)}
            </button>`).join("")}
        </div>
      </div>

      <!-- COLOR / VARIANT CARDS -->
      <div>
        <p class="text-xs font-semibold font-lexend text-gray-500 uppercase
                  tracking-widest mb-2">
          Color:
          <span id="activeColorLabel" class="text-[#1D3C4A] normal-case tracking-normal
                                             text-sm ml-1">
            ${escapeHtml(defaultVariant.color)}
          </span>
        </p>
        <div class="flex flex-wrap gap-3" id="colorCards">
          ${safeProductData.availableVariants.map((v, idx) => {
            const thumbImg = v.mainImage || FALLBACK_IMG;
            const isDefault = idx === 0;
            return `
            <button class="variant-card group flex flex-col items-center gap-1.5
               rounded-xl border border-gray-400 transition-all duration-200
               w-[90px] cursor-pointer overflow-hidden
               ${isDefault
                ? "border-[#1D3C4A] shadow-md"
                : "border-gray-200 hover:border-[#1D3C4A]"}"
                  data-variant-id="${escapeHtml(v.variantId)}"
                  data-size="${escapeHtml(v.size || "")}"
                  style="${!isDefault ? "display:none" : ""}">

              <!-- Image fills full width, no padding -->
              <div class="w-full aspect-square overflow-hidden bg-gray-50">
                  <img src="${thumbImg}"
                      class="w-full h-full object-cover transition-transform
                              duration-300 group-hover:scale-105"
                      alt="${escapeHtml(v.color)}"
                      onerror="this.src='${FALLBACK_IMG}'"/>
              </div>

              <!-- Text section has its own padding -->
              <div class="w-full px-2 pb-2 flex flex-col items-center gap-0.5">
                  <span class="text-[10px] font-lexend text-center text-[#1D3C4A]
                              leading-tight line-clamp-2 w-full">
                      ${escapeHtml(v.color)}
                  </span>
                  <span class="text-[10px] font-lexend font-semibold text-[#e39f32]">
                      ₹${v.price.toLocaleString("en-IN")}
                  </span>
              </div>
          </button>`;
          }).join("")}
        </div>
      </div>

    </div>`;
    }
    // ─── END PATCH 4 VARIANT CARDS HTML ──────────────────────────────────────
    // Build the initial thumbnail list for the strip
    const initialThumbItems = buildThumbItemList(initialMedia);

    const root = document.getElementById("dynamicRoot");
    if (!root) return;

    // Store transformedData for accordion, social proof, etc.
    transformedData = {
      name: safeProductData.productName,
      brand: safeProductData.brandName,
      rating: 4.5,
      reviewCount: safeProductData.productReviews?.length || 0,
      price: safeProductData.currentSellingPrice,
      originalPrice: safeProductData.currentMrpPrice,
      discountPercent,
      stock: safeProductData.currentStock,

      // highlights:     Object.entries(safeProductData.specifications).map(([k, v]) => ({
      //   label:  k.split("_").map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" "),
      //   value:  v || "N/A",
      //   accent: k === "material",
      // })),

      // PATCH 1B — No fallback text; render empty string when no description exists
      description:
        [...safeProductData.aboutItem, ...safeProductData.description]
          .filter(Boolean)
          .map((item) => `<p>${escapeHtml(item)}</p>`)
          .join(""),

      specifications: Object.entries(safeProductData.specifications).map(([k, v]) => ({
        label: k.split("_").map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" "),
        value: v || "N/A",
      })),

      additionalInfo: [
        ...(safeProductData.aboutItem || [])
      ].filter(Boolean),

      faqs: Object.entries(safeProductData.faqAns).map(([q, a]) => ({ q, a })),
      stats: [
        { value: "5k+", label: "Happy Customers", stars: 5 },
        { value: "4.5", label: "Average Rating", stars: "4.5" },
        { value: "500+", label: "Verified Reviews", extra: "Trusted" },
        { value: "95%", label: "Recommend Us", progress: 95 },
      ],
      reviews: (safeProductData.productReviews?.filter((r) => r.approved) || []).map(
        (r) => ({
          name: r.reviewerName || "Anonymous",
          img: r.reviewerImage || "https://randomuser.me/api/portraits/lego/1.jpg",
          rating: r.rating || 4,
          location: r.location || "India",
          time: r.time || "recently",
          text: r.description || "Great product!",
          likes: r.likes || 0,
          verified: r.verified ?? true,
        })
      ),
      installSteps: safeProductData.installationSteps.map((step, idx) => ({
        step: step.step,
        title: step.title,
        desc: step.shortDescription,
        list: [step.shortNote || "Follow manufacturer guidelines"],
        time: idx === 0 ? "15–20 Minutes" : idx === 1 ? "Basic tools required" : "5 Minutes",
        img: step.stepImage || null,
        alt: step.title,
        videoUrl: step.videoUrl,
      })),
    };

    root.innerHTML = `
      <div class="grid grid-cols-1 md:grid-cols-12 gap-6 lg:gap-10 items-start px-2 md:px-0">
 
        <!-- LEFT: Images - Sticky on Desktop -->
        <div class="md:col-span-5">
          <div class="sticky top-20 md:top-24 lg:top-28 z-10">
      
            <!-- Desktop: Vertical Thumbnails + Main Image -->
            <div class="flex gap-3">
              <!-- Thumbnail strip - vertical on desktop -->
              <div class="flex-col gap-2 w-14 flex-shrink-0 hidden md:flex" id="thumbContainer">
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
                                  ${idx === 0 ? "border-[#e39f32]" : "border-transparent hover:border-[#e39f32]"}"/>
                    `;
            })
            .join("")}
        </div>
 
        <!-- Main Display Area - Enhanced with preview -->
        <div class="relative flex-1 h-[380px] md:h-[460px] lg:h-[470px] overflow-hidden rounded-xl border border-gray-100 bg-gray-50 group"
             id="mainDisplayArea">
         
          <div class="relative w-full h-full overflow-hidden">
            <img id="mainProductImage"
                 src="${initialThumbItems[0]?.type === "image" ? initialThumbItems[0].url : safeProductData.mainImage}"
                 alt="${escapeHtml(safeProductData.productName)}"
                 class="w-full h-full object-cover cursor-pointer transition-transform duration-300 hover:scale-105"
                 onerror="this.src='${FALLBACK_IMG}'"
                 onclick="window.openLightbox && window.openLightbox(0)"/>
           
            ${
              initialThumbItems.length > 1
                ? `
              <div class="next-image-preview absolute right-0 top-0 h-full w-20 md:w-24 pointer-events-none">
                <div class="h-full w-full bg-gradient-to-l from-black/20 to-transparent">
                  <img src="${initialThumbItems[1]?.url || initialThumbItems[0].url}"
                       class="h-full w-full object-cover opacity-50"
                       style="mask-image: linear-gradient(to left, rgba(0,0,0,0.6), transparent);"
                       alt="Next image preview"/>
                </div>
                <div class="absolute right-2 top-1/2 -translate-y-1/2 bg-white/80 backdrop-blur-sm rounded-full w-8 h-8 flex items-center justify-center shadow-md">
                  <i class="fa-solid fa-chevron-right text-xs text-gray-700"></i>
                </div>
              </div>
            `
                : ""
            }
          </div>
         
          ${
            discountPercent > 0
              ? `
            <span class="absolute top-3 left-3 z-10 bg-[#E6A62C] text-white text-[11px] font-semibold px-3 py-1 rounded-full shadow-md">
              ${discountPercent}% OFF
            </span>
          `
              : ""
          }
         
          <div class="absolute bottom-3 right-3 bg-black/50 backdrop-blur-sm text-white text-[10px] px-2 py-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center gap-1">
            <i class="fa-solid fa-expand text-[10px]"></i>
            <span>Click to enlarge</span>
          </div>
        </div>
      </div>
 
      <!-- Mobile: Horizontal Scrollable Thumbnails -->
      <div class="md:hidden mt-6">
        <!-- Enhanced Mobile Navigation Dots -->
        <div class="flex justify-center gap-3 mt-4" id="mobileNavDots">
          ${initialThumbItems
            .map(
              (_, idx) => `
              <button class="mobile-nav-dot w-3 h-3 rounded-full transition-all duration-300
                            ${idx === 0 ? "bg-[#E39F32] scale-110 shadow-lg shadow-[#E39F32]/30" : "bg-gray-300 hover:bg-gray-400"}"
                      data-index="${idx}"></button>
            `,
            )
            .join("")}
        </div>
      </div>
    </div>
  </div>

        <!-- RIGHT: Details -->
        <div class="md:col-span-7">
           <div class="md:pr-4 lg:pr-6 space-y-3 hide-scrollbar
                      md:max-h-[calc(100vh-120px)] md:overflow-y-auto">
 
            <!-- Product name + Trending badge -->
            <h1 class="text-xl md:text-2xl font-normal font-zain leading-tight text-[#033E59]">
              ${escapeHtml(safeProductData.productName)}${trendingBadgeHTML()}
            </h1>
 
            <!-- Rating + Brand + Share -->
            <div class="flex items-start justify-between gap-3 ">
              <div class="flex items-center gap-2 flex-wrap flex-1">
                <div class="flex text-amber-400 text-sm gap-0.5">${renderStars(0)}</div>
                <span class="text-sm font-lexend text-stone-600">${transformedData.reviewCount} reviews</span>
                <div class="flex items-center gap-2 px-2 py-0.5 rounded-full border"
                     style="background-color:#d6e8f9;border-color:#e5e7eb">
                  <span class="text-xs font-lexend font-semibold text-[#1D3C4A]">
                    Brand: ${escapeHtml(safeProductData.brandName)}
                  </span>
                </div>
              </div>
 
             <div class="flex items-center gap-2 flex-shrink-0">
              <!-- Wishlist Button -->
              <button class="wishlist-icon-btn w-9 h-9 rounded-full border border-stone-200 flex items-center justify-center hover:bg-stone-100 transition bg-white shadow-sm">
                <i class="fa-regular fa-heart text-[#033E59]"></i>
              </button>
   
    <!-- Share Button -->
      <!-- Share -->
                <div class="relative" id="shareContainer" style="z-index: 30;">
                  <button id="shareButton" class="w-9 h-9 rounded-full border border-stone-200 flex items-center justify-center hover:bg-stone-100 transition bg-white shadow-sm">
                    <i class="fa-solid fa-share-nodes text-[#033E59]"></i>
                  </button>
                  <div id="sharePopup" class="absolute right-0 mt-2 w-48 bg-white shadow-xl rounded-xl border p-2 z-40 hidden">
                    <div class="flex flex-col gap-1 text-sm">
                      <button class="share-option flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-yellow-50 w-full text-left" data-share-type="link">
                        <i class="fa-solid fa-link font-lexend text-[#E6A62C]"></i>Copy link
                      </button>
                      <button class="share-option flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-yellow-50 w-full text-left" data-share-type="whatsapp">
                        <i class="fa-brands fa-whatsapp font-lexend text-[#E6A62C]"></i>WhatsApp
                      </button>
                    </div>
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
          <!-- // Price + Coupon card -->
          <div class="max-w-[520px] p-2.5 rounded-2xl bg-gradient-to-br from-[#e39f32]/5 to-[#1D3C4A]/5 border border-[#e5e7eb] relative space-y-2 overflow-hidden">
          <div class="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-[#e39f32]/10 to-[#1D3C4A]/10 rounded-bl-full"></div>
          <div class="relative z-10 bg-white/85 backdrop-blur rounded-xl border border-[#e5e7eb] px-2.5 py-2 flex items-center justify-between gap-2.5 flex-wrap sm:flex-nowrap">
          <!-- LEFT: Price Section -->
          <div class="price-container flex flex-col sm:flex-row sm:items-end gap-1 sm:gap-2">
          <span class="text-lg md:text-xl font-bold text-[#1D3C4A] price-display">
                  ₹${safeProductData.currentSellingPrice.toLocaleString("en-IN")}
          </span>
          <div class="price-extras flex items-center gap-1.5 flex-wrap">
                  ${safeProductData.currentMrpPrice > safeProductData.currentSellingPrice ? `
          <span class="text-xs text-[#e39f32] line-through">₹${safeProductData.currentMrpPrice.toLocaleString("en-IN")}</span>
                    ${discountPercent > 0 ? `<span class="discount-badge bg-[#e39f32] text-white text-[8px] px-1.5 py-[2px] rounded-full">${discountPercent}% OFF</span>` : ""}
                  ` : ""}
          </div>
          </div>
          <div class="price-divider hidden sm:block w-px h-7 bg-[#e5e7eb]"></div>
          <!-- MIDDLE: Tax info badge -->
          <div class="tax-badge inline-flex items-center gap-1.5 w-fit px-2 py-0.5 rounded-full bg-[#e39f32]/10 border border-[#e39f32]/20 order-3 sm:order-none basis-full sm:basis-auto justify-center sm:justify-start">
          <i class="fa-solid fa-shield-check text-[9px] text-[#e39f32]"></i>
          <span class="text-[10px] font-medium text-[#1D3C4A]/80">Inclusive of all taxes</span>
          </div>
          <div class="price-divider hidden sm:block w-px h-7 bg-[#e5e7eb]"></div>
          <!-- RIGHT: Timer -->
          <div class="timer-section flex items-center gap-1 flex-shrink-0">
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
          
            <!-- ⭐ TEASER COUPON CARD ⭐ -->
          <div class="relative z-10 bg-[#FCF8F8] border border-[#e5e7eb] rounded-xl p-2.5 flex flex-col gap-2" id="teaserCouponCard" style="display:flex !important;">
          <div class="flex items-start justify-between gap-2.5">
          <div>
          <p class="text-[9px] tracking-wide text-[#e39f32] uppercase font-semibold">SPECIAL OFFER!!</p>
          <h3 class="text-base md:text-lg font-bold text-[#1D3C4A] leading-tight" id="teaserDiscountLabel">
          <span class="inline-block w-16 h-4 bg-gray-200 rounded animate-pulse"></span>
          </h3>
          <p class="text-[10px] text-gray-500" id="teaserDescription">
          <span class="inline-block w-28 h-3 bg-gray-100 rounded animate-pulse mt-1"></span>
          </p>
          </div>
          <div class="font-mono text-[10px] bg-white border border-[#e5e7eb] px-2 py-[2px] rounded-md text-[#1D3C4A] shadow-sm" id="teaserCouponCode">
                  ••••••
          </div>
          </div>
          <div class="flex gap-2">
          <button id="viewMoreBtn" class="flex-1 border border-[#e5e7eb] text-[#1D3C4A] text-xs py-1.5 rounded-lg hover:bg-[#e39f32]/5 transition flex items-center justify-center gap-1">
                  View Offers <i class="fa-solid fa-arrow-right text-[9px] text-[#e39f32]"></i>
          </button>
          </div>
          </div>
          </div>
          
          
            

          
          <!-- Offer Overlay (inline) -->
          <div id="offerOverlay" class="hidden fixed inset-0 bg-black/40 backdrop-blur-sm z-50 opacity-0 pointer-events-none flex items-center justify-center transition-opacity duration-300">
          <div id="offerModal" class="hidden flex flex-col bg-white w-full max-w-md mx-4 rounded-xl p-5 border border-[#e5e7eb] shadow-2xl scale-95 opacity-0 transition-all duration-300">
          <button id="closeOffersBtn" class="absolute top-4 right-4 text-[#e39f32] hover:text-[#1D3C4A] transition-colors text-xl">✕</button>
          <h3 class="text-[#1D3C4A] font-lexend text-lg mb-5 pb-2 border-b border-[#e5e7eb]">✨ Available Offers</h3>
          <div class="space-y-4 max-h-[60vh] overflow-y-auto pr-1">
          <div class="text-center py-4 text-gray-400 text-sm">
          <i class="fa-solid fa-ticket text-2xl mb-2 block text-[#e39f32]/40"></i>
                              Loading your offers…
          </div>
          </div>
          
                        </div>
          </div>

            <!-- Variant Cards -->
            ${variantCardsHTML}

           <!-- Quantity + Add to Cart + Buy Now -->
            <div class="mt-6 bg-white p-4 rounded-xl border border-[#e5e7eb] shadow-sm space-y-3">
              <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                <div class="flex items-center justify-between border border-[#e5e7eb] rounded-lg overflow-hidden h-12">
                  <button id="decreaseBtn" class="px-4 py-2 text-lg hover:bg-stone-50 w-1/3 border-r border-[#e5e7eb]">−</button>
                  <span id="quantity" class="text-sm text-center w-1/3 border-r border-[#e5e7eb] py-2">1</span>
                  <button id="increaseBtn" class="px-4 py-2 text-lg hover:bg-stone-50 w-1/3">+</button>
                </div>
                <button class="add-to-cart-btn h-12 flex items-center justify-center gap-2 border border-[#e5e7eb] rounded-lg bg-white text-[#1D3C4A] font-medium px-4 hover:bg-[#e39f32] hover:text-white transition"
                  ${addCartIcon}
                  <span class="text-sm whitespace-nowrap">${addCartText}</span>
                </button>
                <button class="buy-now-btn h-12 flex items-center justify-center gap-2 bg-[#1D3C4A] text-white rounded-lg font-medium px-4 hover:bg-[#e39f32] transition">
                  <i class="fa-solid fa-arrow-right"></i>
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
                     </a>` : ""}
              </div>
            </div>

           <!-- Delivery Strip -->
            <div class="flex flex-wrap md:flex-nowrap items-center justify-center md:justify-between gap-x-3 gap-y-2 text-[11px] text-[#1D3C4A] bg-[#faf8f4] border border-[#efe5d3] rounded-lg px-3 py-2">
            
              <div class="flex items-center gap-1 whitespace-nowrap">
            <i class="fa-solid fa-box text-[#e39f32] text-[10px]"></i>
            <span>24–48h Dispatch</span>
            </div>
            
              <div class="flex items-center gap-1 whitespace-nowrap">
            <i class="fa-solid fa-calendar-check text-[#e39f32] text-[10px]"></i>
            <span>4–7d Delivery</span>
            </div>
            
              <div class="flex items-center gap-1 whitespace-nowrap">
            <i class="fa-solid fa-hand-holding-dollar text-[#e39f32] text-[10px]"></i>
            <span>COD Available</span>
            </div>
            
              <div class="flex items-center gap-1 whitespace-nowrap">
            <i class="fa-solid fa-truck text-[#e39f32] text-[10px]"></i>
            <span>Free Shipping</span>
            </div>
            
              <div class="flex items-center gap-1 whitespace-nowrap">
            <i class="fa-solid fa-shield-halved text-[#e39f32] text-[10px]"></i>
            <span>Secure Payment</span>
            </div>
            
              <div class="flex items-center gap-1 whitespace-nowrap">
            <i class="fa-solid fa-rotate-left text-[#e39f32] text-[10px]"></i>
            <span>Easy Returns</span>
            </div>
            
            </div>

             <!-- Accordion placeholder -->
            <section class="max-w-4xl mx-auto pb-0 font-sans text-[#1D3C4A]">
              <div class="border border-[#e5e7eb] rounded-xl divide-y divide-[#e5e7eb] bg-white" id="accordionContainer"></div>
            </section>
            
            <!-- Bought Together placeholder (async filled) -->
            <section class="max-w-4xl mx-auto mt-4 mb-12 px-1" id="boughtTogetherSection">
              <h2 class="text-xl font-normal font-lexend text-[#1D3C4A] mb-5">Frequently Bought Together</h2>
              <div class="bg-[#1D3C4A]/5 border border-[#e5e7eb] rounded-2xl p-2 space-y-4" id="boughtTogether">
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
      <section id="recentSuggestionSection" class="max-w-7xl mx-auto px-4 sm:px-4 pt-8 lg:px-8"></section>`;

    // Wire up the initial thumb strip click handlers
    wireInitialThumbClicks(initialThumbItems);
    // Sync wishlist heart icon state
    // initWishlistIcon();

    // ── PATCH: Populate teaser coupon card async ─────────────────────────────
    fetchUserCoupons().then((coupons) => {
      const card = document.getElementById("teaserCouponCard");
      if (!card) return;

      if (!coupons.length) {
        card.style.display = "none";
        return;
      }

      const c = coupons[0];
      const discLabel = c.discountType === "PERCENTAGE"
        ? `${c.discountValue}% OFF`
        : `₹${c.discountValue} OFF`;

      const labelEl = document.getElementById("teaserDiscountLabel");
      const descEl = document.getElementById("teaserDescription");
      const codeEl = document.getElementById("teaserCouponCode");

      if (labelEl) labelEl.textContent = discLabel;
      if (descEl) descEl.textContent = c.description || "Special discount for you";
      if (codeEl) codeEl.textContent = c.couponCode;
    });
    // ── END PATCH ────────────────────────────────────────────────────────────
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
      const mainImg = document.getElementById("mainProductImage");
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

    let accHtml = "";

    // ── 1. About This Item (fromm payload aboutItem array) ─────────────────
    // Renders each bullet point as-is — no label transform, no fallback
    const aboutItems = (safeProductData.aboutItem || []).filter(Boolean);
    if (aboutItems.length > 0) {
      accHtml += `
        <div class="item">
         <button class="toggle w-full flex justify-between items-center px-4 py-2 text-left font-medium font-lexend">
            About This Item
            <span class="icon text-xl transition-transform duration-300">+</span>
          </button>
          <div class="content">
            <div class="px-6 pb-6 text-sm">
              <ul class="space-y-3">
                ${aboutItems.map((item) => `
                  <li class="flex items-start gap-2">
                    <div class="w-1.5 h-1.5 mt-2 rounded-full bg-[#e39f32] flex-shrink-0"></div>
                    <p class="text-[#1D3C4A]/80 leading-relaxed">${escapeHtml(item)}</p>
                  </li>`).join("")}
              </ul>
            </div>
          </div>
        </div>`;
    }

    // ── 2. Product Description (from payload description array) ────────────
    // Only render if at least one non-empty string exists
    const descItems = (safeProductData.description || []).filter(Boolean);
    if (descItems.length > 0) {
      const descHTML = descItems.map((d) => `<p>${escapeHtml(d)}</p>`).join("");
      accHtml += `
        <div class="item">
         <button class="toggle w-full flex justify-between items-center px-4 py-2 text-left font-medium font-lexend">
            Product Description
            <span class="icon text-xl transition-transform duration-300">+</span>
          </button>
          <div class="content">
            <div class="px-6 pb-6 text-sm text-[#1D3C4A]/80 leading-relaxed space-y-3">
              ${descHTML}
            </div>
          </div>
        </div>`;
    }

    // ── 3. Specifications (from payload specifications object) ─────────────
    // Keys rendered exactly as-is from payload — no transform, no split("_")
    const specEntries = Object.entries(safeProductData.specifications || {})
      .filter(([, v]) => v !== null && v !== undefined && v !== "");
    if (specEntries.length > 0) {
      accHtml += `
        <div class="item">
          <button class="toggle w-full flex justify-between items-center px-4 py-2 text-left font-medium font-lexend">
            Specifications
            <span class="icon text-xl transition-transform duration-300">+</span>
          </button>
          <div class="content">
            <div class="px-6 pb-6 text-sm">
              <div class="rounded-lg overflow-hidden bg-white border border-[#edf2f4] shadow-sm">
                <table class="w-full text-left border-collapse">
                  <tbody>
                    ${specEntries.map(([key, val], idx) => `
                      <tr class="${idx % 2 === 0
          ? "bg-white"
          : "bg-[#f8fbfc]"} border-b border-[#f1f5f7]
                          hover:bg-[#fff9f2] transition">
                        <td class="py-3 px-4 font-medium border-r border-[#f1f5f7]
                                   w-2/5 text-[#1D3C4A] text-xs uppercase tracking-wide">
                          ${escapeHtml(key)}
                        </td>
                        <td class="py-3 px-4 text-[#1D3C4A]/70">
                          ${escapeHtml(String(val))}
                        </td>
                      </tr>`).join("")}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>`;
    }

    // ── 4. Additional Information (from payload additionalInfo object) ──────
    // payload additionalInfo is Map<String,String> or null — render as table
    // NOT aboutItem — those are in section 1 above
    const addInfoEntries = Object.entries(safeProductData.additionalInfo || {})
      .filter(([, v]) => v !== null && v !== undefined && v !== "");
    if (addInfoEntries.length > 0) {
      accHtml += `
        <div class="item">
         <button class="toggle w-full flex justify-between items-center px-4 py-2 text-left font-medium font-lexend">
            Additional Information
            <span class="icon text-lg transition-transform duration-300">+</span>
          </button>
          <div class="content">
            <div class="px-6 pb-6 text-sm">
              <div class="rounded-lg overflow-hidden bg-white border border-[#edf2f4] shadow-sm">
                <table class="w-full text-left border-collapse">
                  <tbody>
                    ${addInfoEntries.map(([key, val], idx) => `
                      <tr class="${idx % 2 === 0
          ? "bg-white"
          : "bg-[#f8fbfc]"} border-b border-[#f1f5f7]
                          hover:bg-[#fff9f2] transition">
                        <td class="py-3 px-4 font-medium border-r border-[#f1f5f7]
                                   w-2/5 text-[#1D3C4A] text-xs uppercase tracking-wide">
                          ${escapeHtml(key)}
                        </td>
                        <td class="py-3 px-4 text-[#1D3C4A]/70">
                          ${escapeHtml(String(val))}
                        </td>
                      </tr>`).join("")}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>`;
    }

    // ── 5. FAQs (from payload faq object) ──────────────────────────────────
    // Keys = questions, values = answers — rendered exactly as-is
    const faqEntries = Object.entries(safeProductData.faqAns || {})
      .filter(([q, a]) => q && a);
    if (faqEntries.length > 0) {
      accHtml += `
        <div class="item">
         <button class="toggle w-full flex justify-between items-center px-4 py-2 text-left font-medium font-lexend">
            FAQs
            <span class="icon text-lg transition-transform duration-300">+</span>
          </button>
          <div class="content">
            <div class="px-6 pb-6 text-sm space-y-4">
              ${faqEntries.map(([q, a]) => `
                <div class="p-4 rounded-lg border border-[#eef3f6] bg-white shadow-sm">
                  <p class="font-medium text-[#1D3C4A] text-[14px]">
                    ${escapeHtml(q)}
                  </p>
                  <p class="mt-2 text-[#1D3C4A]/70 text-[13px] leading-relaxed">
                    ${escapeHtml(a)}
                  </p>
                </div>`).join("")}
            </div>
          </div>
        </div>`;
    }

    // ── Fallback: nothing to show ──────────────────────────────────────────
    if (!accHtml) {
      acc.style.display = "none";
      return;
    }

    acc.innerHTML = accHtml;

    // ── Accordion click handlers ───────────────────────────────────────────
    acc.querySelectorAll(".item").forEach((item) => {
      const btn = item.querySelector(".toggle");
      const content = item.querySelector(".content");
      const icon = item.querySelector(".icon");
      if (!btn || !content || !icon) return;

      btn.addEventListener("click", () => {
        // Close all others
        acc.querySelectorAll(".item").forEach((other) => {
          if (other === item) return;
          other.querySelector(".content")?.classList.remove("open");
          const otherIcon = other.querySelector(".icon");
          if (otherIcon) otherIcon.style.transform = "rotate(0deg)";
        });
        // Toggle this one
        content.classList.toggle("open");
        icon.style.transform = content.classList.contains("open")
          ? "rotate(45deg)"
          : "rotate(0deg)";
      });
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
    const div = document.getElementById("boughtTogether");
    const section = document.getElementById("boughtTogetherSection");
    if (!div) return;

    const addonProducts = await fetchAddonProducts(safeProductData.addonKeys);

    // PATCH 1C — Cap at 4 items max regardless of API response
    const cappedProducts = addonProducts.slice(0, 4);

    if (!addonProducts.length) {
      // Nothing to show — hide entire section cleanly
      if (section) section.style.display = "none";
      return;
    }

    if (section) section.style.display = "block";

    let html = cappedProducts
      .map((p) => {
        const img = absUrl(p.mainImage) || FALLBACK_IMG;
        const price = p.currentSellingPrice;
        const mrp = p.currentMrpPrice;
        const discPct = calcDiscount(price, mrp);
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
    const btn = document.getElementById("addToCartBtn");

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

    if (btn) {
      btn.addEventListener("click", () => handleBoughtTogetherAddToCart(cappedProducts));
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  //  BOUGHT TOGETHER — add current product + checked addons in one call
  // ═══════════════════════════════════════════════════════════════════════════
  async function handleBoughtTogetherAddToCart(addonProducts) {
    const btn = document.getElementById("addToCartBtn");
    const div = document.getElementById("boughtTogether");
    if (!div) return;

    const checkedBoxes = Array.from(div.querySelectorAll(".product-check:checked"));
    const checkedIds = checkedBoxes.map((c) => Number(c.dataset.productId));
    const checkedAddons = addonProducts.filter((p) => checkedIds.includes(p.productPrimeId));

    if (!checkedAddons.length) {
      showToast("Select at least one item", "error");
      return;
    }

    // ── Current product (same variant/quantity rules as single add-to-cart) ──
    const variant = getSelectedVariant();
    const quantity = parseInt(document.getElementById("quantity")?.textContent || 1);
    const currentProductPayload = buildCartPayload(variant, quantity, null);

    // ── Addon products: flat/base products, no variant split ────────────────
    const addonPayloads = checkedAddons.map((p) => ({
      userId: currentProductPayload.userId,
      sessionId: currentProductPayload.sessionId,
      productId: p.productPrimeId,
      variantId: null,
      sku: p.currentSku,
      selectedColor: p.selectedColor || null,
      selectedSize: p.productSize || null,
      titleName: p.productName,
      unitPrice: p.currentSellingPrice,
      mrpPrice: p.currentMrpPrice,
      quantity: 1,
      customFieldsJson: null,
    }));

    const items = [currentProductPayload, ...addonPayloads];

    const originalBtnHtml = btn ? btn.innerHTML : "";
    if (btn) {
      btn.disabled = true;
      btn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Adding...`;
    }

    try {
      const res = await apiAddMultipleToCart({ items });
      const failed = res?.data?.failedItems || res?.failedItems || [];

      if (failed.length) {
        showToast(`Added ${items.length - failed.length} of ${items.length} items. Some items could not be added.`, "error");
      } else {
        showToast("Added to cart! 🛒", "success");
      }

      dispatchCartEvent();

      // Keep current product's own add-to-cart button in sync, same as single-add flow
      const pid = Number(safeProductData.productPrimeId);
      addedToCartSet.add(pid);
      document.querySelectorAll(".add-to-cart-btn").forEach((addBtn) => {
        addBtn.innerHTML = `<i class="fa-solid fa-bag-shopping"></i> <span class="text-sm whitespace-nowrap">Go to Cart</span>`;
        addBtn.style.background = "#e39f32";
        addBtn.style.color = "#1D3C4A";
        addBtn.style.fontWeight = "600";
        addBtn.style.borderColor = "#e39f32";
      });
    } catch (err) {
      console.error("[BoughtTogether] add error:", err);
      showToast("Could not add items to cart. Please try again.", "error");
    } finally {
      if (btn) {
        btn.disabled = false;
        btn.innerHTML = originalBtnHtml;
      }
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  //  RECENT VIEWED + SUGGESTIONS
  //  FIX: Removed inline onclick from card div (caused event delegation failure).
  //       Cards now use event delegation on the section container — single
  //       listener handles navigation, wishlisting, and add-to-cart correctly
  //       without bubbling conflicts.
  // ═══════════════════════════════════════════════════════════════════════════

  // async function fillRecentAndSuggestions() {
  //   const [recentItems, suggestionItems] = await Promise.all([
  //     fetchRecentViewed(USER_ID),
  //     fetchSuggestions(
  //       safeProductData.productId,
  //       safeProductData.productCategory,
  //       safeProductData.productSubCategory,
  //       USER_ID
  //     ),
  //   ]);

  //   const section = document.getElementById("recentSuggestionSection");
  //   if (!section) return;

  //   let html = "";

  //   // ── Recently Viewed ────────────────────────────────────────────────────
  //   if (recentItems.length > 0) {
  //     html += `
  //       <div class="mb-0">
  //         <h2 class="text-2xl font-medium font-zain text-[#1D3C4A] mb-1">Recently Viewed</h2>
  //         <div class="w-12 h-1 bg-[#e39f32] rounded-full mb-5"></div>
  //         <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
  //           ${recentItems.map((p) => productCardHTML(p)).join("")}
  //         </div>
  //       </div>`;
  //   }

  //   // ── Suggestions ────────────────────────────────────────────────────────
  //   if (suggestionItems.length > 0) {
  //     html += `
  //       <div class="mb-0">
  //         <h2 class="text-2xl font-medium font-zain text-[#1D3C4A] mb-1">You May Also Like</h2>
  //         <div class="w-12 h-1 bg-[#e39f32] rounded-full mb-5"></div>
  //         <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
  //           ${suggestionItems.map((p) => productCardHTML(p)).join("")}
  //         </div>
  //       </div>`;
  //   }

  //   if (!html) {
  //     section.style.display = "none";
  //     return;
  //   }

  //   section.innerHTML = html;

  //   syncCardCartStates(); // sync states for freshly rendered cards
  //   syncCardWishlistStates();   // ← hearts sync on fresh card render too


  //   // ── Event delegation on section — handles card click, wishlist, add-to-cart ──
  //   // This replaces the broken inline onclick approach. One listener, no conflicts.
  //   section.addEventListener("click", async function (e) {
  //     const target = e.target;

  //     // ── Add to cart button ───────────────────────────────────────────────
  //     const cartBtn = target.closest(".card-add-cart");
  //     if (cartBtn) {
  //       e.stopPropagation();

  //       // ── Already added → redirect ──────────────────────────────────────
  //       if (cartBtn.dataset.added === "true") {
  //         window.location.href = "/Cart/cart.html";
  //         return;
  //       }

  //       const pid = parseInt(cartBtn.dataset.productId);
  //       const price = parseFloat(cartBtn.dataset.price);
  //       const sku = cartBtn.dataset.sku || "";
  //       if (!pid) return;
  //       const titleName = cartBtn.dataset.productName || "Artezo Product";
  //       const payload = {
  //         userId: USER_ID,
  //         sessionId: null,
  //         productId: pid,
  //         variantId: null,
  //         sku,
  //         selectedColor: "",
  //         selectedSize: null,
  //         titleName,                 // ← was missing entirely
  //         unitPrice: price,
  //         mrpPrice: price,
  //         quantity: 1,
  //         customFieldsJson: null,
  //       };
  //       try {
  //         await apiAddToCart(payload);
  //         addedToCartSet.add(pid);
  //         showToast("Added to cart! 🛒", "success");
  //         // window.dispatchEvent(new CustomEvent('cart:updated'));
  //         dispatchCartEvent();

  //         cartBtn.innerHTML = '<i class="fa-solid fa-bag-shopping text-xs"></i> Go to Cart';
  //         cartBtn.style.background = "#e39f32";
  //         cartBtn.style.color = "#1D3C4A";
  //         cartBtn.style.fontWeight = "600";
  //         cartBtn.style.borderColor = "#e39f32";
  //         cartBtn.dataset.added = "true";
  //       } catch (err) {
  //         showToast("Could not add to cart.", "error");
  //       }
  //       return;
  //     }

  //     // ── Wishlist icon button ─────────────────────────────────────────────
  //     const wishlistBtn = target.closest(".wishlist-icon-btn");
  //     if (wishlistBtn) {
  //       e.stopPropagation();
  //       const card = wishlistBtn.closest(".product-card-clickable"); // ← explicit class, not attr selector
  //       const pid = card ? parseInt(card.dataset.productId) : null;
  //       const price = card ? parseFloat(card.dataset.price) : 0;
  //       const sku = card ? (card.dataset.sku || "") : "";
  //       // Walk down to find the cart button which also carries the name
  //       const cartBtnInCard = card ? card.querySelector(".card-add-cart") : null;
  //       const productName = card?.dataset.productName
  //         || cartBtnInCard?.dataset.productName
  //         || "Artezo Premium Product";



  //       if (!pid) return;
  //       const titleName = card?.dataset.productName
  //         || card?.querySelector(".card-add-cart")?.dataset.productName
  //         || "Artezo Product";
  //       const payload = {
  //         userId: USER_ID,
  //         wishlistName: "My Wishlist",
  //         productId: pid,
  //         variantId: null,
  //         sku,
  //         selectedColor: "",
  //         selectedSize: null,
  //         titleName,                  // ← now correctly sourced
  //         wishlistedPrice: price,
  //         customFieldsJson: null,
  //       };
  //       try {
  //         await apiAddToWishlist(payload);
  //         const icon = wishlistBtn.querySelector("i");
  //         if (icon) {
  //           const isFilled = icon.classList.contains("fa-solid");
  //           icon.className = isFilled
  //             ? "fa-regular fa-heart text-[#1D3C4A] text-xs"
  //             : "fa-solid fa-heart text-red-500 text-xs";
  //         }

  //         // ── Keep set in sync ──────────────────────────────────────────
  //         if (isFilled) {
  //           addedToWishlistSet.delete(pid);
  //         } else {
  //           addedToWishlistSet.add(pid);
  //         }
  //         showToast("Wishlist updated ❤️", "info");
  //         // window.dispatchEvent(new CustomEvent('wishlist:updated'));
  //         dispatchWishlistEvent();
  //       } catch (err) {
  //         showToast("Could not update wishlist.", "error");
  //       }
  //       return;
  //     }

  //     // ── Card body click → navigate to product ───────────────────────────
  //     const card = target.closest(".product-card-clickable");
  //     if (card) {
  //       const url = card.dataset.productUrl;
  //       if (url) window.location.href = url;
  //     }
  //   });
  // }


async function fillRecentAndSuggestions() {
    const [recentItems, suggestionItems] = await Promise.all([
      fetchRecentViewed(USER_ID),
      fetchSuggestions(
        safeProductData.productId,
        safeProductData.productCategory,
        safeProductData.productSubCategory,
        USER_ID,
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
          <div class="slider-wrapper">
<button class="slider-arrow slider-prev">
<i class="fa-solid fa-chevron-left"></i>
</button>
 
  <div class="recent-mobile-slider grid md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">

    ${recentItems.map((p) => productCardHTML(p)).join("")}
</div>
 
  <button class="slider-arrow slider-next">
<i class="fa-solid fa-chevron-right"></i>
</button>
</div>
 
<div class="slider-wrapper">
<button class="slider-arrow slider-prev">
<i class="fa-solid fa-chevron-left"></i>
</button>
 
  <div class="recent-mobile-slider grid md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">

    ${suggestionItems.map((p) => productCardHTML(p)).join("")}
</div>
 
  <button class="slider-arrow slider-next">
<i class="fa-solid fa-chevron-right"></i>
</button>
</div>
 
        </div>`;
    }
 
    // ── Suggestions ────────────────────────────────────────────────────────
    if (suggestionItems.length > 0) {
      html += `
        <div>
          <h2 class="text-2xl font-medium font-zain text-[#1D3C4A] mb-1">You May Also Like</h2>
          <div class="w-12 h-1 bg-[#e39f32] rounded-full mb-5"></div>
        <div class="recent-mobile-slider grid md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            ${suggestionItems.map((p) => productCardHTML(p)).join("")}
          </div>
        </div>`;
    }
 
    if (!html) {
      section.style.display = "none";
      return;
    }
 
    section.innerHTML = html;
 
    // ── Event delegation on section — handles card click, wishlist, add-to-cart ──
    // This replaces the broken inline onclick approach. One listener, no conflicts.
    section.addEventListener("click", async function (e) {
      const target = e.target;
 
      // ── Add to cart button ───────────────────────────────────────────────
      const cartBtn = target.closest(".card-add-cart");
      if (cartBtn) {
        e.stopPropagation();
 
        // ── Already added → redirect ──────────────────────────────────────
        if (cartBtn.dataset.added === "true") {
          window.location.href = "/Cart/cart.html";
          return;
        }
 
        const pid = parseInt(cartBtn.dataset.productId);
        const price = parseFloat(cartBtn.dataset.price);
        const sku = cartBtn.dataset.sku || "";
        const productName = cartBtn.dataset.productName;

        if (!pid) return;
        const payload = {
          userId: USER_ID,
          sessionId: null,
          productId: pid,
          variantId: null,
          sku,
          unitPrice: price,
          mrpPrice: price,
          selectedSize: null,
          titleName: productName || "Artezo Premium Product",
          quantity: 1,
          customFieldsJson: null,
        };
        try {
          await apiAddToCart(payload);
          addedToCartSet.add(pid);
          showToast("Added to cart! 🛒", "success");
          window.dispatchEvent(new CustomEvent("cart:updated"));
 
          cartBtn.innerHTML =
            '<i class="fa-solid fa-bag-shopping text-xs"></i> Go to Cart';
          cartBtn.style.background = "#e39f32";
          cartBtn.style.color = "#1D3C4A";
          cartBtn.style.fontWeight = "600";
          cartBtn.style.borderColor = "#e39f32";
          cartBtn.dataset.added = "true";
        } catch (err) {
          showToast("Could not add to cart.", "error");
        }
        return;
      }
 
      // ── Wishlist icon button ─────────────────────────────────────────────
      const wishlistBtn = target.closest(".wishlist-icon-btn");
      if (wishlistBtn) {
        e.stopPropagation();
        const card = wishlistBtn.closest("[data-product-id]");
        const pid = card ? parseInt(card.dataset.productId) : null;
        const price = card ? parseFloat(card.dataset.price) : 0;
        const sku = card ? card.dataset.sku || null : null;
        const productName = card ? card.dataset.productName : "Artezo Premium Product";

        if (!pid) return;
        const payload = {
          userId: USER_ID,
          wishlistName: "My Wishlist",
          productId: pid,
          variantId: null,
          sku,
          selectedColor: "",
          selectedSize: null,
          titleName: productName,
          wishlistedPrice: price,
          customFieldsJson: null,
        };
        try {
          await apiAddToWishlist(payload);
          const icon = wishlistBtn.querySelector("i");
          if (icon) {
            const isFilled = icon.classList.contains("fa-solid");
            icon.className = isFilled
              ? "fa-regular fa-heart text-[#1D3C4A] text-xs"
              : "fa-solid fa-heart text-red-500 text-xs";
          }
          showToast("Wishlist updated ❤️", "info");
          window.dispatchEvent(new CustomEvent("wishlist:updated"));
        } catch (err) {
          showToast("Could not update wishlist.", "error");
        }
        return;
      }
 
      // ── Card body click → navigate to product ───────────────────────────
      const card = target.closest(".product-card-clickable");
      if (card) {
        const url = card.dataset.productUrl;
        if (url) window.location.href = url;
      }
    });
  }
 

  /**
   * Shared product card HTML for recent-viewed and suggestion grids.
   * FIX: Removed inline onclick. Navigation handled via event delegation
   * using data-product-url on a wrapper with class "product-card-clickable".
   * Wishlist and add-to-cart buttons use data-product-id for delegation lookup.
   */
  // function productCardHTML(p) {
  //   const img = absUrl(p.mainImage) || FALLBACK_IMG;
  //   const price = p.currentSellingPrice;
  //   const mrp = p.currentMrpPrice;
  //   const discPct = calcDiscount(price, mrp);
  //   // const url     = `../Product-Details/product-detail.html?id=${p.productPrimeId}`;

  //   // Generate SEO-friendly URL for product cards
  //   const url = generateProductSEOUrl(p) || `/products/product-detail.html?id=${p.productPrimeId}`;

  //   return `
  //     <div class="product-card-clickable group relative flex flex-col bg-white rounded-2xl border border-[#e5e7eb] shadow-sm
  //                 hover:shadow-md transition-all duration-300 hover:-translate-y-1 overflow-hidden cursor-pointer"
  //          data-product-id="${p.productPrimeId}"
  //          data-price="${price}"
  //          data-sku="${escapeHtml(p.currentSku || "")}"
  //          data-product-name="${escapeHtml(p.productName || "")}"
  //          data-product-url="${url}">
  //       ${discPct > 0
  //       ? `<span class="absolute top-2 left-2 z-10 bg-[#e39f32] text-white text-[9px] font-bold px-2 py-0.5 rounded-full">${discPct}% OFF</span>`
  //       : ""}
  //       <button class="wishlist-icon-btn absolute top-2 right-2 z-10 w-8 h-8 flex items-center justify-center
  //                      bg-white border border-[#e5e7eb] rounded-full shadow-sm hover:border-[#e39f32] transition-all"
  //               type="button">
  //         <i class="fa-regular fa-heart text-[#1D3C4A] text-xs"></i>
  //       </button>
  //       <div class="aspect-square overflow-hidden bg-gray-50">
  //         <img src="${img}" alt="${escapeHtml(p.productName)}"
  //              class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
  //              onerror="this.src='${FALLBACK_IMG}'"/>
  //       </div>
  //       <div class="flex flex-col flex-1 p-3">
  //         <h3 class="text-sm font-medium font-lexend text-[#1D3C4A] line-clamp-2 mb-1">${escapeHtml(p.productName)}</h3>
  //         <p class="text-xs text-gray-400 mb-1">${escapeHtml(p.productCategory || "")}</p>
  //         <div class="flex items-baseline gap-2 mb-3">
  //           <span class="text-sm font-semibold text-[#1D3C4A]">₹${price.toLocaleString("en-IN")}</span>
  //           ${mrp > price ? `<span class="text-xs text-gray-400 line-through">₹${mrp.toLocaleString("en-IN")}</span>` : ""}
  //         </div>
  //         <button class="card-add-cart mt-auto py-2 rounded-lg border border-[#1D3C4A] text-[#1D3C4A] text-xs
  //                        font-medium hover:bg-[#1D3C4A] hover:text-white transition"
  //                 type="button"
  //                 data-product-id="${p.productPrimeId}"
  //                 data-price="${price}"
  //                 data-product-name="${escapeHtml(p.productName || "")}"
  //                 data-sku="${escapeHtml(p.currentSku || "")}">Add to Cart</button>
  //       </div>
  //     </div>`;
  // }

    function productCardHTML(p) {
      const img = absUrl(p.mainImage) || FALLBACK_IMG;
      const price = p.currentSellingPrice;
      const productName = p.productName;
      const mrp = p.currentMrpPrice;
      const discPct = calcDiscount(price, mrp);

      // Generate SEO-friendly URL for product cards
      const url =
        generateProductSEOUrl(p) ||
        `/products/product-detail.html?id=${p.productPrimeId}`;

      // Check if product is already in cart
      const pid = Number(p.productPrimeId);
      const isAdded = addedToCartSet.has(pid);
      const isOOS = p.currentStock != null && p.currentStock <= 0;

      // Determine button styles based on state
      let buttonBgClass = "bg-[#1D3C4A]";
      let buttonTextClass = "text-white";
      let buttonHoverClass = "hover:bg-[#E39F32]";
      let iconColorClass = "text-[#E39F32] group-hover:text-[#1D3C4A]";
      let buttonText = "Add to Cart";
      let iconHtml = `<i class="fa-solid fa-cart-shopping ${iconColorClass} transition-colors duration-300 text-[10px]"></i>`;

      if (isOOS) {
        buttonText = "Out of Stock";
        buttonBgClass = "bg-gray-400";
        buttonHoverClass = "hover:bg-gray-400";
        iconHtml = `<i class="fa-solid fa-ban text-gray-200 text-[10px]"></i>`;
      } else if (isAdded) {
        buttonText = "Go to Cart";
        buttonBgClass = "bg-[#E39F32]"; // Yellow/Gold background
        buttonHoverClass = "hover:bg-[#d4892a]";
        buttonTextClass = "text-[#1D3C4A]";
        iconColorClass = "text-[#1D3C4A] group-hover:text-white";
        iconHtml = `<i class="fa-solid fa-bag-shopping ${iconColorClass} transition-colors duration-300 text-[10px]"></i>`;
      }

      return `
        <div class="product-card-clickable group relative flex flex-col bg-white rounded-2xl border border-[#e5e7eb] shadow-sm
              hover:shadow-md transition-all duration-300 hover:-translate-y-1 overflow-hidden cursor-pointer"
                    data-product-id="${p.productPrimeId}"
                    data-product-name="${escapeHtml(p.productName || "")}"
                    data-price="${price}"
                    data-sku="${escapeHtml(p.currentSku || "")}"
                    data-product-url="${url}">
          
          ${discPct > 0 ? `
          <span class="absolute top-2 left-2 z-10 bg-[#e39f32] text-white text-[9px] font-bold px-2 py-0.5 rounded-full">
                      ${discPct}% OFF
          </span> `: ""}
          <!-- Wishlist Button -->
          <button class="wishlist-icon-btn absolute top-2 right-2 z-10 w-8 h-8 flex items-center justify-center
                                bg-white border border-[#e5e7eb] rounded-full shadow-sm hover:border-[#e39f32] transition-all"
                          type="button">
          <i class="fa-regular fa-heart text-[#1D3C4A] text-xs"></i>
          </button>
          <!-- Product Image -->
          <div class="aspect-square overflow-hidden bg-gray-50">
          <img src="${img}" alt="${escapeHtml(p.productName)}"
                        class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        onerror="this.src='${FALLBACK_IMG}'"/>
          </div>
          <!-- Product Details -->
          <div class="flex flex-col flex-1 p-3">
          <h3 class="text-sm font-medium font-lexend text-[#1D3C4A] line-clamp-2 mb-1">
                      ${escapeHtml(p.productName)}
          </h3>
          <p class="text-xs text-gray-400 mb-1">${escapeHtml(p.productCategory || "")}</p>
          <!-- Price -->
          <div class="flex items-baseline gap-2 mb-3">
          <span class="text-sm font-semibold text-[#1D3C4A]">₹${price.toLocaleString("en-IN")}</span>
                      ${mrp > price ? `<span class="text-xs text-gray-400 line-through">₹${mrp.toLocaleString("en-IN")}</span>` : ""}
          </div>
          <!-- Add to Cart Button -->
          <button class="card-add-cart group w-full mt-auto ${buttonBgClass} ${buttonTextClass} py-2 rounded-lg
                                  flex items-center justify-center gap-2 text-xs font-medium
                                  ${buttonHoverClass} transition-all duration-300 ${isOOS ? "cursor-not-allowed opacity-50" : ""}"
                            type="button"
                            data-product-id="${p.productPrimeId}"
                            data-price="${price}"
                            data-product-name="${p.productName || ""}"
                            data-sku="${escapeHtml(p.currentSku || "")}"
                            ${isOOS ? "disabled" : ""}
                            ${isAdded ? 'data-added="true"' : ""}>
                      ${iconHtml}
            <span class="${isAdded ? "text-[#1D3C4A]" : "text-white"}">${buttonText}</span>
          </button>
      </div>
    </div>`;
  }
 
 

  // ═══════════════════════════════════════════════════════════════════════════
  //  SIMILAR PRODUCTS  (hides section when no data)
  // ═══════════════════════════════════════════════════════════════════════════

  // function fillSimilarProducts() {
  //   const sec = document.getElementById("similarSection");
  //   if (!sec) return;
  //   if (!transformedData.similarProducts?.length) {
  //     sec.style.display = "none";
  //     return;
  //   }
  //   sec.style.display = "block";
  //   // (existing render logic preserved verbatim — omitted for brevity since
  //   // similar products was never populated from API in the original code)
  // }

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
      if (stat.stars === 5) stars = `<i class="fa-solid fa-star"></i>`.repeat(5);
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

  // ─── PATCH 3: REVIEWS RENDERER ────────────────────────────────────────────────
  // Amazon-style layout:
  //   • Star aggregate breakdown at top
  //   • All review photos in a horizontal strip (click → lightbox)
  //   • Individual review cards below
  // Called async after renderPage() — does not block initial render.

  async function fillReviews() {
    const sec = document.getElementById("socialSection");
    if (!sec) return;

    const reviews = await fetchProductReviews(safeProductData.productId);

    // ── Aggregate stats ──────────────────────────────────────────────────────
    const total = reviews.length;
    const avgRating = total
      ? (reviews.reduce((s, r) => s + (r.rating || 0), 0) / total).toFixed(1)
      : "0.0";

    // Count per star level 5→1
    const starCounts = [5, 4, 3, 2, 1].map((star) => ({
      star,
      count: reviews.filter((r) => Math.round(r.rating) === star).length,
    }));

    // ── All images for top strip ─────────────────────────────────────────────
    const reviewsWithImages = reviews.filter((r) => r.imageUrl);

    // ── Build HTML ───────────────────────────────────────────────────────────
    let html = "";

    // Section heading
    html += `
    <div class="mb-3">
      <h2 class="text-2xl md:text-3xl font-semibold font-zain text-[#1D3C4A]">
        Customer Reviews
      </h2>
    </div>`;

    if (!total) {
      html += `
      <div class="text-center py-16 border border-[#e5e7eb] rounded-2xl bg-white">
        <i class="fa-regular fa-star text-4xl text-gray-300 mb-3 block"></i>
        <p class="text-gray-400 font-lexend">No reviews yet. Be the first to review!</p>
      </div>`;
      sec.innerHTML = html;
      return;
    }

    // ── Rating aggregate block ───────────────────────────────────────────────
    html += `
    <div class="flex flex-col sm:flex-row gap-6 bg-white border border-[#e5e7eb] rounded-2xl p-6 mb-6">

      <!-- Average score -->
      <div class="flex flex-col items-center justify-center min-w-[120px] border-b sm:border-b-0 sm:border-r border-[#e5e7eb] pb-4 sm:pb-0 sm:pr-6">
        <span class="text-5xl font-bold font-zain text-[#1D3C4A]">${avgRating}</span>
        <div class="flex text-[#e39f32] gap-0.5 mt-1">${renderStars(parseFloat(avgRating))}</div>
        <span class="text-xs text-gray-400 mt-1 font-lexend">${total} review${total > 1 ? "s" : ""}</span>
      </div>

      <!-- Star breakdown bars -->
      <div class="flex-1 space-y-2">
        ${starCounts.map(({ star, count }) => {
      const pct = total ? Math.round((count / total) * 100) : 0;
      return `
            <div class="flex items-center gap-3">
              <span class="text-xs font-lexend text-[#1D3C4A] w-4 text-right shrink-0">${star}</span>
              <i class="fa-solid fa-star text-[#e39f32] text-[10px] shrink-0"></i>
              <div class="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                <div class="h-full bg-[#e39f32] rounded-full transition-all duration-500"
                     style="width:${pct}%"></div>
              </div>
              <span class="text-xs text-gray-400 font-lexend w-6 shrink-0">${count}</span>
            </div>`;
    }).join("")}
      </div>

    </div>`;

    // ── All photos strip ─────────────────────────────────────────────────────
    if (reviewsWithImages.length > 0) {
      html += `
      <div class="mb-6">
        <h3 class="text-sm font-semibold font-lexend text-[#1D3C4A] mb-3">
          Photos from customers (${reviewsWithImages.length})
        </h3>
        <div class="flex gap-2 overflow-x-auto pb-2 review-photo-strip"
             style="scrollbar-width:thin;scrollbar-color:#e39f32 #f1f1f1">
          ${reviewsWithImages.map((r, idx) => `
            <img src="${BASE_URL}${r.imageUrl}"
                 class="review-strip-thumb h-20 w-20 object-cover rounded-xl border border-[#e5e7eb]
                        flex-shrink-0 cursor-pointer hover:opacity-90 hover:border-[#e39f32] transition-all"
                 data-review-idx="${idx}"
                 data-lightbox="review-photos"
                 alt="Review photo by ${escapeHtml(r.customerName || "customer")}"
                 onerror="this.style.display='none'"/>
          `).join("")}
        </div>
      </div>`;
    }

    // ── Individual review cards ──────────────────────────────────────────────
    html += `<div class="space-y-4" id="reviewCardsList">`;

    reviews.forEach((r) => {
      const name = escapeHtml(r.customerName || "Anonymous");
      const initials = name.slice(0, 2).toUpperCase();
      const rating = r.rating || 0;
      const comment = escapeHtml(r.comment || "");
      const dateStr = r.createdAt
        ? new Date(r.createdAt).toLocaleDateString("en-IN", {
          day: "numeric", month: "short", year: "numeric",
        })
        : "";

      html += `
      <div class="bg-white border border-[#e5e7eb] rounded-2xl p-5 hover:shadow-sm transition-shadow">

        <!-- Reviewer row -->
        <div class="flex items-start gap-3 mb-3">
          <!-- Avatar -->
          <div class="w-10 h-10 rounded-full bg-[#1D3C4A] flex items-center justify-center
                      text-white text-sm font-semibold font-lexend flex-shrink-0">
            ${initials}
          </div>
          <div class="flex-1 min-w-0">
            <div class="flex items-center justify-between gap-2 flex-wrap">
              <span class="font-semibold font-lexend text-[#1D3C4A] text-sm">${name}</span>
              ${r.createdAt
          ? `<span class="text-xs text-gray-400 font-lexend">${dateStr}</span>`
          : ""}
            </div>
            <!-- Stars -->
            <div class="flex items-center gap-1 mt-0.5">
              <div class="flex text-[#e39f32] text-xs gap-0.5">${renderStars(rating)}</div>
              <span class="text-xs text-gray-400 font-lexend">${rating}/5</span>
            </div>
          </div>
          <!-- Verified badge -->
          <span class="flex items-center gap-1 text-[10px] font-lexend text-green-700
                       bg-green-50 border border-green-200 px-2 py-0.5 rounded-full flex-shrink-0">
            <i class="fa-solid fa-circle-check text-[9px]"></i> Verified
          </span>
        </div>

        <!-- Comment -->
        ${comment
          ? `<p class="text-sm text-[#1D3C4A]/80 font-lexend leading-relaxed mb-3">${comment}</p>`
          : ""}

        <!-- Review image thumbnail (if present) -->
        ${r.imageUrl
          ? `<div class="mt-2">
               <img src="${BASE_URL}${r.imageUrl}"
                    class="h-24 w-24 object-cover rounded-xl border border-[#e5e7eb] cursor-pointer
                           hover:opacity-90 hover:border-[#e39f32] transition-all review-card-img"
                    data-full-src="${BASE_URL}${r.imageUrl}"
                    data-reviewer="${name}"
                    alt="Review image"
                    onerror="this.style.display='none'"/>
             </div>`
          : ""}

      </div>`;
    });

    html += `</div>`; // close reviewCardsList

    sec.innerHTML = html;

    // ── Wire lightbox ────────────────────────────────────────────────────────
    buildReviewLightbox(reviewsWithImages);
    wireReviewLightbox(reviewsWithImages);
  }
  // ─── END PATCH 3 RENDERER ─────────────────────────────────────────────────────


  // ─── PATCH 3: LIGHTBOX ────────────────────────────────────────────────────────
  function buildReviewLightbox(reviewsWithImages) {
    if (document.getElementById("reviewLightbox")) return;

    document.body.insertAdjacentHTML("beforeend", `
    <div id="reviewLightbox"
         class="fixed inset-0 z-[999] hidden flex items-center justify-center"
         style="background:rgba(0,0,0,0.88)">

      <!-- Close -->
      <button id="lbClose"
              class="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20
                     flex items-center justify-center transition text-white text-xl z-10">
        <i class="fa-solid fa-xmark"></i>
      </button>

      <!-- Prev -->
      <button id="lbPrev"
              class="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full
                     bg-white/10 hover:bg-white/25 flex items-center justify-center
                     transition text-white z-10">
        <i class="fa-solid fa-chevron-left"></i>
      </button>

      <!-- Next -->
      <button id="lbNext"
              class="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full
                     bg-white/10 hover:bg-white/25 flex items-center justify-center
                     transition text-white z-10">
        <i class="fa-solid fa-chevron-right"></i>
      </button>

      <!-- Main image -->
      <div class="flex flex-col items-center gap-4 max-w-lg w-full px-16">
        <img id="lbMainImg"
             src=""
             alt="Review photo"
             class="max-h-[70vh] max-w-full object-contain rounded-xl"/>
        <div class="text-center">
          <p id="lbReviewerName" class="text-white text-sm font-lexend font-medium"></p>
          <p id="lbCounter"      class="text-white/50 text-xs font-lexend mt-0.5"></p>
        </div>

        <!-- Thumbnail strip inside lightbox -->
        <div class="flex gap-2 overflow-x-auto max-w-full pb-1"
             id="lbThumbStrip"
             style="scrollbar-width:thin;scrollbar-color:#e39f32 transparent">
          ${reviewsWithImages.map((r, idx) => `
            <img src="${BASE_URL}${r.imageUrl}"
                 class="lb-thumb h-12 w-12 object-cover rounded-lg flex-shrink-0 cursor-pointer
                        border-2 border-transparent hover:border-[#e39f32] transition-all opacity-60"
                 data-lb-idx="${idx}"
                 onerror="this.style.display='none'"/>
          `).join("")}
        </div>
      </div>

    </div>
  `);
  }

  function wireReviewLightbox(reviewsWithImages) {
    if (!reviewsWithImages.length) return;

    let currentIdx = 0;

    function openLightbox(idx) {
      currentIdx = idx;
      renderLightboxSlide();
      document.getElementById("reviewLightbox").classList.remove("hidden");
      document.getElementById("reviewLightbox").classList.add("flex");
      document.body.style.overflow = "hidden";
    }

    function closeLightbox() {
      document.getElementById("reviewLightbox").classList.add("hidden");
      document.getElementById("reviewLightbox").classList.remove("flex");
      document.body.style.overflow = "";
    }

    function renderLightboxSlide() {
      const r = reviewsWithImages[currentIdx];
      const mainImg = document.getElementById("lbMainImg");
      const nameEl = document.getElementById("lbReviewerName");
      const counterEl = document.getElementById("lbCounter");

      if (mainImg) mainImg.src = `${BASE_URL}${r.imageUrl}`;
      if (nameEl) nameEl.textContent = r.customerName || "Customer";
      if (counterEl) counterEl.textContent = `${currentIdx + 1} / ${reviewsWithImages.length}`;

      // Highlight active thumb in strip
      document.querySelectorAll(".lb-thumb").forEach((t, i) => {
        t.classList.toggle("border-[#e39f32]", i === currentIdx);
        t.classList.toggle("opacity-100", i === currentIdx);
        t.classList.toggle("opacity-60", i !== currentIdx);
      });

      // Scroll active thumb into view
      const activeThumb = document.querySelector(`.lb-thumb[data-lb-idx="${currentIdx}"]`);
      activeThumb?.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });

      // Show/hide prev-next
      const prev = document.getElementById("lbPrev");
      const next = document.getElementById("lbNext");
      if (prev) prev.style.visibility = currentIdx === 0 ? "hidden" : "visible";
      if (next) next.style.visibility = currentIdx === reviewsWithImages.length - 1 ? "hidden" : "visible";
    }

    // ── Strip thumbnails in review section ──────────────────────────────────
    document.querySelectorAll(".review-strip-thumb").forEach((img) => {
      img.addEventListener("click", () => {
        openLightbox(parseInt(img.dataset.reviewIdx));
      });
    });

    // ── Individual card images ───────────────────────────────────────────────
    document.querySelectorAll(".review-card-img").forEach((img) => {
      img.addEventListener("click", () => {
        // Find index in reviewsWithImages by matching src
        const fullSrc = img.dataset.fullSrc;
        const idx = reviewsWithImages.findIndex(
          (r) => `${BASE_URL}${r.imageUrl}` === fullSrc
        );
        openLightbox(idx >= 0 ? idx : 0);
      });
    });

    // ── Lightbox controls ────────────────────────────────────────────────────
    document.getElementById("lbClose")?.addEventListener("click", closeLightbox);

    document.getElementById("lbPrev")?.addEventListener("click", () => {
      if (currentIdx > 0) { currentIdx--; renderLightboxSlide(); }
    });

    document.getElementById("lbNext")?.addEventListener("click", () => {
      if (currentIdx < reviewsWithImages.length - 1) { currentIdx++; renderLightboxSlide(); }
    });

    // Keyboard nav
    document.addEventListener("keydown", (e) => {
      const lb = document.getElementById("reviewLightbox");
      if (lb?.classList.contains("hidden")) return;
      if (e.key === "ArrowLeft" && currentIdx > 0) { currentIdx--; renderLightboxSlide(); }
      if (e.key === "ArrowRight" && currentIdx < reviewsWithImages.length - 1) { currentIdx++; renderLightboxSlide(); }
      if (e.key === "Escape") closeLightbox();
    });

    // Click backdrop to close
    document.getElementById("reviewLightbox")?.addEventListener("click", (e) => {
      if (e.target === document.getElementById("reviewLightbox")) closeLightbox();
    });

    // Lightbox strip thumbs
    document.querySelectorAll(".lb-thumb").forEach((thumb) => {
      thumb.addEventListener("click", () => {
        openLightbox(parseInt(thumb.dataset.lbIdx));
      });
    });
  }
  // ─── END PATCH 3 LIGHTBOX ────────────────────────────────────────────────────


  // ═══════════════════════════════════════════════════════════════════════════
  //  INSTALLATION
  // ═══════════════════════════════════════════════════════════════════════════

  function fillInstallation() {
    const sec = document.getElementById("installSection");
    if (!sec || !transformedData.installSteps?.length) return;

    let html = `
      <div class="max-w-6xl mx-auto px-4 space-y-10">
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
            <div class="absolute -top-4 ${even ? "-left-1" : "-right-1"} bg-[#e39f32] text-white text-sm px-4 py-1 rounded-full shadow">
              Step 0${step.step}
            </div>
          </div>
        </div>`;
    });

    // YouTube embed
    const ytUrl = safeProductData.youtubeUrl;
    if (ytUrl) {
      const ytMatch = ytUrl.match(/(?:v=|youtu\.be\/)([A-Za-z0-9_-]{11})/);
      const ytId = ytMatch ? ytMatch[1] : null;
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

    const addToCartButtonText = safeProductData.isCustomizable
      ? "Customize"
      : "Add to Cart";
    const addToCartButtonIcon = safeProductData.isCustomizable
      ? '<i class="fas fa-sliders-h"></i>'
      : '<i class="fas fa-cart-plus"></i>';
    const buyNowButtonText = safeProductData.isCustomizable
      ? "Customize & Buy"
      : "Buy Now";

    sticky.innerHTML = `
<div class="flex flex-wrap md:flex-nowrap items-center md:justify-center justify-between w-full gap-2 md:gap-4">

  <!-- Price -->
  <!-- <div class="flex items-center gap-2 whitespace-nowrap"> 
    <span class="font-medium font-lexend text-lg sm:text-xl" style="color:#e39f32">
      ₹${transformedData.price.toLocaleString()}
    </span>
  <span class="text-gray-500 line-through text-sm md:text-base 
bg-gray-100 px-2 py-0.5 rounded-md">
  ₹${transformedData.originalPrice.toLocaleString()}
</span>
  </div>-->

  <!-- Cart + Buy -->
 <div class="flex items-center justify-center gap-2 w-full">

  <!-- ADD TO CART -->
  <div class="flex-1 md:flex-none bg-[#E39F32] rounded-xl border border-[#1d3c4a] overflow-hidden">
    <button
      class="add-to-cart-btn w-full md:min-w-[190px] px-4 md:px-6 py-3 rounded-xl text-sm md:text-base font-medium font-lexend flex items-center justify-center gap-2 transition-all duration-300 hover:bg-[#1D3C4A]/10"
      style="color:#1d3c4a"
    >
      <i class="fas fa-cart-plus text-xs md:text-sm"></i>
      Add to Cart
    </button>
  </div>

  <!-- BUY NOW -->
  <div class="flex-1 md:flex-none bg-white rounded-xl border border-gray-300 overflow-hidden">
    <button
      class="buy-now-btn w-full md:min-w-[190px] px-4 md:px-6 py-3 rounded-xl text-sm md:text-base font-medium font-lexend flex items-center justify-center gap-2 transition-all duration-300 hover:bg-gray-50"
      style="color:#1d3c4a"
    >
      Buy Now
      <i class="fas fa-arrow-right text-xs md:text-sm"></i>
    </button>
  </div>

</div>

  <!-- WhatsApp Video Button -->
 <!-- <a href="https://wa.me/+919876543210?text=Hi%2C%20I%27m%20interested%20in%20this%20product.%20Can%20you%20please%20send%20live%20product%20videos%3F"
  target="_blank"
  class="w-full md:w-auto mt-1 md:mt-0 px-4 py-2 rounded-full text-sm md:text-base font-medium font-lexend flex items-center justify-center gap-2 bg-green-600 text-white">
    <i class="fab fa-whatsapp text-sm"></i>
    Get Live Product Video
  </a> -->

</div>
`;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  //  EVENT LISTENERS
  // ═══════════════════════════════════════════════════════════════════════════

  function setupEventListeners() {
    // Share button
      setTimeout(() => {
      const shareBtn = document.getElementById("shareButton");
      const sharePopup = document.getElementById("sharePopup");
 
      if (!shareBtn || !sharePopup) return;
 
      shareBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        sharePopup.classList.toggle("hidden");
      });
 
      document.addEventListener("click", (e) => {
        if (!shareBtn.contains(e.target) && !sharePopup.contains(e.target)) {
          sharePopup.classList.add("hidden");
        }
      });
 
      // Dynamic product details
      const productUrl = window.location.href;
      const productName =
        safeProductData?.productName ||
        document.title ||
        "Check out this product";
 
      // All share options
      sharePopup.querySelectorAll(".share-option").forEach((btn) => {
        btn.addEventListener("click", async () => {
          const shareType = btn.dataset.shareType;
 
          switch (shareType) {
            case "link":
              try {
                await navigator.clipboard.writeText(productUrl);
                showToast("Product link copied!", "success");
                sharePopup.classList.add("hidden");
              } catch (err) {
                console.error(err);
                showToast("Failed to copy link", "error");
              }
              break;
 
            case "whatsapp":
              const whatsappText = `${productName}\n\n${productUrl}`;
 
              window.open(
                `https://wa.me/?text=${encodeURIComponent(whatsappText)}`,
                "_blank",
              );
 
              sharePopup.classList.add("hidden");
              break;
 
            default:
              break;
          }
        });
      });
    }, 100);

    // Quantity
    // ── Quantity — PATCH 2: qty only manages count; stock label via syncStockUI ──
    let qty = 1;
    const qtyEl = document.getElementById("quantity");

    function getStock() {
      return (getSelectedVariant()?.stock ?? safeProductData.currentStock) || 0;
    }

    function updateQtyUI() {
      if (qtyEl) qtyEl.textContent = qty;
      // Delegate ALL stock-related DOM to syncStockUI — single owner
      syncStockUI(getStock());
    }

    document.getElementById("increaseBtn")?.addEventListener("click", () => {
      const stock = getStock();
      if (stock <= 0) return;           // OOS guard — belt-and-suspenders
      if (qty < stock) { qty++; updateQtyUI(); }
    });
    document.getElementById("decreaseBtn")?.addEventListener("click", () => {
      if (qty > 1) { qty--; updateQtyUI(); }
    });
    updateQtyUI();
    // ── END PATCH 2 qty block ────────────────────────────────────────────────

    // Countdown timer
    function updateTimer() {
      const h = document.getElementById("timerHours");
      const m = document.getElementById("timerMinutes");
      const s = document.getElementById("timerSeconds");
      if (!h || !m || !s) return;
      let hours = parseInt(h.textContent) || 0;
      let mins = parseInt(m.textContent) || 0;
      let secs = parseInt(s.textContent) || 0;
      if (secs > 0) secs--;
      else if (mins > 0) { mins--; secs = 59; }
      else if (hours > 0) { hours--; mins = 59; secs = 59; }
      s.textContent = secs.toString().padStart(2, "0");
      m.textContent = mins.toString().padStart(2, "0");
      h.textContent = hours.toString().padStart(2, "0");
    }
    setInterval(updateTimer, 1000);

    // Offer overlay
    const overlay = document.getElementById("offerOverlay");
    const modal = document.getElementById("offerModal");

    const viewBtn = document.getElementById("viewMoreBtn");


    const closeBtn = document.getElementById("closeOffersBtn");

    if (overlay && modal && viewBtn && closeBtn) {
      let userCouponsLoaded = false;

      viewBtn.addEventListener("click", async (e) => {
        e.preventDefault();
        overlay.classList.remove("hidden", "opacity-0", "pointer-events-none");
        overlay.classList.add("flex", "opacity-100");
        modal.classList.remove("hidden", "scale-95", "opacity-0");
        modal.classList.add("flex", "scale-100", "opacity-100");
        document.body.classList.add("overflow-hidden");

        // ── PATCH: Lazy-load user coupons on first open ──────────────────────
        if (!userCouponsLoaded) {
          const couponListEl = modal.querySelector(".space-y-4");
          if (couponListEl) {
            couponListEl.innerHTML = `
              <div class="flex flex-col gap-3">
                ${[1, 2].map(() => `
                  <div class="rounded-xl p-4 border border-[#e5e7eb] bg-white space-y-2 animate-pulse">
                    <div class="h-3 bg-gray-200 rounded w-1/3"></div>
                    <div class="h-5 bg-gray-200 rounded w-1/2"></div>
                    <div class="h-3 bg-gray-200 rounded w-2/3"></div>
                  </div>`).join("")}
              </div>`;

            const coupons = await fetchUserCoupons();
            userCouponsLoaded = true;

            if (!coupons.length) {
              couponListEl.innerHTML = `
                <div class="text-center py-8 text-gray-400">
                  <i class="fa-regular fa-face-sad-tear text-3xl mb-2 block"></i>
                  <p class="text-sm">No coupons available for your account</p>
                </div>`;
              return;
            }

            couponListEl.innerHTML = coupons.map(buildUserCouponCardHTML).join("");

            // Wire copy buttons inside modal
            // couponListEl.querySelectorAll(".copy-coupon-btn").forEach((btn) => {
            //   btn.addEventListener("click", (e) => {
            //     e.preventDefault();
            //     const code = btn.dataset.couponCode;
            //     if (code) {
            //       navigator.clipboard?.writeText(code).then(() =>
            //         showToast(`Copied: ${code}`, "success")
            //       );
            //     }
            //   });
            // });

            // Start countdown tickers for ≤1 day coupons
            startCouponCountdowns();
          }
        }
        // ── END PATCH ────────────────────────────────────────────────────────
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
          <a href="/index.html"
             class="mt-6 inline-block px-8 py-3 rounded-full text-sm font-medium text-white transition hover:opacity-90"
             style="background:#1D3C4A;">Back to Home</a>
        </div>`;
    }
  }

  //Patch -3
  function buildMobileCarousel(media) {
    const displayArea = document.getElementById("mainDisplayArea");
    const dotsContainer = document.getElementById("mobileNavDots");
    if (!displayArea) return;
 
    /* Build ordered media list */
    const mediaItems = [];
    mediaItems.push({ type: "image", url: media.mainImage || FALLBACK_IMG });
    if (media.productVideoUrl) {
      mediaItems.push({ type: "video", url: media.productVideoUrl });
    }
    (media.mockupImages || []).forEach((img) => {
      if (img) mediaItems.push({ type: "image", url: img });
    });
 
    /* Store globally for lightbox access */
    window._carouselMediaItems = mediaItems;
 
    /* ── Build carousel track HTML ──────────────────────────── */
    const slidesHTML = mediaItems
      .map((item, idx) => {
        if (item.type === "video") {
          return `
        <div class="carousel-slide" data-slide-idx="${idx}">
          <video src="${item.url}"
                 class="w-full h-full object-cover"
                 muted preload="metadata"
                 playsinline></video>
          <div class="carousel-video-overlay">
            <i class="fas fa-play"></i>
          </div>
        </div>`;
        }
        return `
      <div class="carousel-slide" data-slide-idx="${idx}">
        <img src="${item.url}"
             alt="Product image ${idx + 1}"
             loading="${idx === 0 ? "eager" : "lazy"}"
             onerror="this.src='${FALLBACK_IMG}'"
             style="width:100%;height:100%;object-fit:cover;display:block;"/>
      </div>`;
      })
      .join("");
 
    /* Tap hint badge */
    const tapHintHTML = `
    <div id="mobileTapHint">
      <i class="fas fa-expand" style="font-size:10px;"></i>
      Tap to expand
    </div>`;
 
    /* Discount badge — preserve from original render */
    const existingBadge = displayArea.querySelector(".absolute.top-3.left-3");
    const badgeHTML = existingBadge ? existingBadge.outerHTML : "";
 
    /* Inject into displayArea */
    displayArea.innerHTML = `
    <div id="carouselTrack" style="display:flex;height:100%;will-change:transform;">
      ${slidesHTML}
    </div>
    ${badgeHTML}
    ${tapHintHTML}
  `;
 
    /* ── Build pill dots ─────────────────────────────────────── */
    if (dotsContainer) {
      dotsContainer.innerHTML = mediaItems
        .map(
          (_, idx) => `
      <button class="mobile-nav-dot${idx === 0 ? " active-dot" : ""}"
              data-index="${idx}"
              aria-label="Go to image ${idx + 1}"></button>
    `,
        )
        .join("");
    }
 
    /* ── Init carousel state ─────────────────────────────────── */
    let currentIdx = 0;
    const track = document.getElementById("carouselTrack");
    const slides = track
      ? Array.from(track.querySelectorAll(".carousel-slide"))
      : [];
    const dots = dotsContainer
      ? Array.from(dotsContainer.querySelectorAll(".mobile-nav-dot"))
      : [];
 
    function getSlideWidth() {
      const containerW = displayArea.offsetWidth;
      return containerW * 0.92 + 8;
    }
 
    function goToSlide(idx, animate = true) {
      if (!track || idx < 0 || idx >= mediaItems.length) return;
      currentIdx = idx;
 
      if (!animate) {
        track.style.transition = "none";
      } else {
        track.style.transition =
          "transform 0.38s cubic-bezier(0.25,0.46,0.45,0.94)";
      }
 
      /* For last slide, snap so it fills full width */
      const offset =
        idx < mediaItems.length - 1
          ? idx * getSlideWidth()
          : track.scrollWidth - displayArea.offsetWidth;
 
      track.style.transform = `translateX(-${offset}px)`;
 
      /* Update dots */
      dots.forEach((dot, i) => {
        dot.classList.toggle("active-dot", i === idx);
      });
 
      /* Show tap hint briefly on first image */
      if (idx === 0) {
        displayArea.classList.add("show-hint");
        setTimeout(() => displayArea.classList.remove("show-hint"), 2200);
      }
    }
 
    /* ── Dot click handler ───────────────────────────────────── */
    dots.forEach((dot) => {
      dot.addEventListener("click", () => {
        goToSlide(parseInt(dot.dataset.index));
      });
    });
 
    /* ── Touch/swipe handler ─────────────────────────────────── */
    let touchStartX = 0;
    let touchStartY = 0;
    let touchStartT = 0;
    let isDragging = false;
    let isScrolling =
      null; /* null = undecided, true = vertical scroll, false = horiz swipe */
    let dragOffsetX = 0;
 
    function getBaseOffset() {
      return currentIdx < mediaItems.length - 1
        ? currentIdx * getSlideWidth()
        : track.scrollWidth - displayArea.offsetWidth;
    }
 
    displayArea.addEventListener(
      "touchstart",
      (e) => {
        touchStartX = e.touches[0].clientX;
        touchStartY = e.touches[0].clientY;
        touchStartT = Date.now();
        isDragging = true;
        isScrolling = null;
        dragOffsetX = 0;
        track.style.transition = "none"; /* disable animation during drag */
      },
      { passive: true },
    );
 
    displayArea.addEventListener(
      "touchmove",
      (e) => {
        if (!isDragging) return;
 
        const dx = e.touches[0].clientX - touchStartX;
        const dy = e.touches[0].clientY - touchStartY;
 
        /* Decide on first significant movement whether user is scrolling or swiping */
        if (isScrolling === null && (Math.abs(dx) > 5 || Math.abs(dy) > 5)) {
          isScrolling = Math.abs(dy) > Math.abs(dx);
        }
 
        if (isScrolling) return; /* let vertical scroll happen naturally */
 
        e.preventDefault(); /* prevent page scroll when swiping horizontally */
        dragOffsetX = dx;
 
        /* Live-drag feedback: translate track in real time */
        const base = getBaseOffset();
        track.style.transform = `translateX(${-(base - dx)}px)`;
      },
      { passive: false },
    );
 
    displayArea.addEventListener(
      "touchend",
      (e) => {
        if (!isDragging || isScrolling) {
          isDragging = false;
          return;
        }
        isDragging = false;
 
        const elapsed = Date.now() - touchStartT;
        const velocity = Math.abs(dragOffsetX) / elapsed; /* px/ms */
 
        /* Swipe threshold: 60px or fast flick (>0.3 px/ms) */
        const threshold = 60;
        const isFlick = velocity > 0.3;
 
        if (
          (dragOffsetX < -threshold || (dragOffsetX < 0 && isFlick)) &&
          currentIdx < mediaItems.length - 1
        ) {
          goToSlide(currentIdx + 1);
        } else if (
          (dragOffsetX > threshold || (dragOffsetX > 0 && isFlick)) &&
          currentIdx > 0
        ) {
          goToSlide(currentIdx - 1);
        } else {
          goToSlide(currentIdx); /* snap back */
        }
      },
      { passive: true },
    );
 
    /* ── Tap to open lightbox ────────────────────────────────── */
    displayArea.addEventListener("click", (e) => {
      /* Only open lightbox if it wasn't a swipe */
      if (Math.abs(dragOffsetX) < 8) {
        openMobileLightbox(currentIdx);
      }
    });
 
    /* ── Wire video play overlays ────────────────────────────── */
    slides.forEach((slide, idx) => {
      const overlay = slide.querySelector(".carousel-video-overlay");
      const video = slide.querySelector("video");
      if (overlay && video) {
        overlay.addEventListener("click", (e) => {
          e.stopPropagation();
          if (video.paused) {
            video.play();
            overlay.style.display = "none";
          }
        });
        video.addEventListener("pause", () => {
          overlay.style.display = "flex";
        });
        video.addEventListener("ended", () => {
          overlay.style.display = "flex";
        });
      }
    });
 
    /* ── Initial state ───────────────────────────────────────── */
    goToSlide(0, false);
 
    /* Show tap hint on load after short delay */
    setTimeout(() => {
      displayArea.classList.add("show-hint");
      setTimeout(() => displayArea.classList.remove("show-hint"), 2200);
    }, 800);
 
    /* Expose goToSlide for dot navigation */
    window._carouselGoToSlide = goToSlide;
  }

    function buildMobileLightbox(mediaItems) {
    /* Remove stale instance if variant changed */
    document.getElementById("mobileLightbox")?.remove();
 
    const thumbsHTML = mediaItems
      .map((item, idx) => {
        if (item.type === "video") {
          return `
        <div class="lb-thumb lb-thumb-video${idx === 0 ? " lb-active" : ""}"
             data-lb-idx="${idx}"
             style="position:relative;width:48px;height:48px;border-radius:6px;overflow:hidden;
                    flex-shrink:0;cursor:pointer;border:2px solid transparent;
                    opacity:${idx === 0 ? 1 : 0.55};transition:opacity 0.2s,border-color 0.2s;">
          <video src="${item.url}" style="width:100%;height:100%;object-fit:cover;" muted preload="metadata"></video>
          <div style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,0.4);">
            <i class="fas fa-play" style="color:#fff;font-size:12px;"></i>
          </div>
        </div>`;
        }
        return `
      <img class="lb-thumb${idx === 0 ? " lb-active" : ""}"
           src="${item.url}"
           data-lb-idx="${idx}"
           alt="Thumbnail ${idx + 1}"
           onerror="this.style.display='none'"
           style="flex-shrink:0;width:48px;height:48px;border-radius:6px;object-fit:cover;
                  border:2px solid ${idx === 0 ? "#e39f32" : "transparent"};
                  opacity:${idx === 0 ? 1 : 0.55};cursor:pointer;
                  transition:opacity 0.2s,border-color 0.2s;"/>`;
      })
      .join("");
 
    const slidesHTML = mediaItems
      .map((item, idx) => {
        if (item.type === "video") {
          return `
        <div class="lb-slide" data-lb-slide="${idx}">
          <video src="${item.url}" controls playsinline
                 style="max-width:100%;max-height:78vh;object-fit:contain;border-radius:4px;background:#000;">
          </video>
        </div>`;
        }
        return `
      <div class="lb-slide" data-lb-slide="${idx}">
        <img src="${item.url}"
             alt="Product image ${idx + 1}"
             onerror="this.src='${FALLBACK_IMG}'"
             style="max-width:100%;max-height:78vh;object-fit:contain;border-radius:4px;"/>
      </div>`;
      })
      .join("");
 
    const lbHTML = `
    <div id="mobileLightbox">
 
      <!-- Top bar: counter + close -->
      <div id="lbTopBar">
        <span id="lbCounter" style="color:rgba(255,255,255,0.85);font-size:13px;font-family:Lexend,sans-serif;">
          1 / ${mediaItems.length}
        </span>
        <button id="lbCloseBtn" aria-label="Close fullscreen view">
          <i class="fas fa-times"></i>
        </button>
      </div>
 
      <!-- Slide track -->
      <div style="width:100%;overflow:hidden;height:80vh;">
        <div id="lbTrack">
          ${slidesHTML}
        </div>
      </div>
 
      <!-- Bottom thumbnail row -->
      <div id="lbThumbRow">
        ${thumbsHTML}
      </div>
 
    </div>`;
 
    document.body.insertAdjacentHTML("beforeend", lbHTML);
  }
 
  /* ─────────────────────────────────────────────────────────────
     PATCH JS-4: openMobileLightbox() / closeMobileLightbox()
     ───────────────────────────────────────────────────────────── */
  function openMobileLightbox(startIdx) {
    /* Only on mobile */
    if (window.innerWidth >= 768) {
      /* Desktop uses existing openLightbox() */
      if (typeof window.openLightbox === "function") {
        window.openLightbox(startIdx);
      }
      return;
    }
 
    const mediaItems = window._carouselMediaItems || [];
    if (!mediaItems.length) return;
 
    /* Build lightbox if not already in DOM, or rebuild if variant changed */
    if (!document.getElementById("mobileLightbox")) {
      buildMobileLightbox(mediaItems); /* PATCH JS-3 */
    }
 
    const lb = document.getElementById("mobileLightbox");
    const lbTrack = document.getElementById("lbTrack");
    const lbCounter = document.getElementById("lbCounter");
    const closeBtn = document.getElementById("lbCloseBtn");
    const thumbRow = document.getElementById("lbThumbRow");
 
    if (!lb || !lbTrack) return;
 
    let lbCurrentIdx = startIdx;
 
    function getLbSlideWidth() {
      return lb.offsetWidth; /* each lb-slide is 100% width */
    }
 
    function goToLbSlide(idx, animate = true) {
      if (idx < 0 || idx >= mediaItems.length) return;
      lbCurrentIdx = idx;
 
      lbTrack.style.transition = animate
        ? "transform 0.35s cubic-bezier(0.25,0.46,0.45,0.94)"
        : "none";
      lbTrack.style.transform = `translateX(-${idx * getLbSlideWidth()}px)`;
 
      /* Counter */
      if (lbCounter)
        lbCounter.textContent = `${idx + 1} / ${mediaItems.length}`;
 
      /* Thumbs */
      if (thumbRow) {
        thumbRow
          .querySelectorAll(".lb-thumb, .lb-thumb-video")
          .forEach((t, i) => {
            const isActive = i === idx;
            t.style.borderColor = isActive ? "#e39f32" : "transparent";
            t.style.opacity = isActive ? "1" : "0.55";
          });
        /* Scroll active thumb into view */
        const activeThumb = thumbRow.querySelector(`[data-lb-idx="${idx}"]`);
        if (activeThumb) {
          activeThumb.scrollIntoView({
            behavior: "smooth",
            inline: "center",
            block: "nearest",
          });
        }
      }
    }
 
    /* Open */
    lb.classList.add("lb-open");
    document.body.style.overflow = "hidden";
    goToLbSlide(lbCurrentIdx, false);
 
    /* ── Lightbox touch/swipe ────────────────────────────────── */
    let lbTouchStartX = 0;
    let lbTouchStartT = 0;
    let lbDragX = 0;
 
    function lbTouchStart(e) {
      lbTouchStartX = e.touches[0].clientX;
      lbTouchStartT = Date.now();
      lbDragX = 0;
      lbTrack.style.transition = "none";
    }
 
    function lbTouchMove(e) {
      lbDragX = e.touches[0].clientX - lbTouchStartX;
      const base = lbCurrentIdx * getLbSlideWidth();
      lbTrack.style.transform = `translateX(${-(base - lbDragX)}px)`;
    }
 
    function lbTouchEnd() {
      const elapsed = Date.now() - lbTouchStartT;
      const velocity = Math.abs(lbDragX) / elapsed;
      const threshold = 50;
 
      if (
        (lbDragX < -threshold || velocity > 0.3) &&
        lbCurrentIdx < mediaItems.length - 1
      ) {
        goToLbSlide(lbCurrentIdx + 1);
      } else if (
        (lbDragX > threshold || (lbDragX > 0 && velocity > 0.3)) &&
        lbCurrentIdx > 0
      ) {
        goToLbSlide(lbCurrentIdx - 1);
      } else {
        goToLbSlide(lbCurrentIdx);
      }
    }
 
    lbTrack.addEventListener("touchstart", lbTouchStart, { passive: true });
    lbTrack.addEventListener("touchmove", lbTouchMove, { passive: true });
    lbTrack.addEventListener("touchend", lbTouchEnd, { passive: true });
 
    /* ── Thumb clicks ────────────────────────────────────────── */
    if (thumbRow) {
      thumbRow.querySelectorAll("[data-lb-idx]").forEach((thumb) => {
        thumb.addEventListener("click", () => {
          goToLbSlide(parseInt(thumb.dataset.lbIdx));
        });
      });
    }
 
    /* ── Close handlers ──────────────────────────────────────── */
    function closeMobileLightbox() {
      lb.classList.remove("lb-open");
      document.body.style.overflow = "";
 
      /* Pause any playing video */
      lb.querySelectorAll("video").forEach((v) => v.pause());
 
      /* Remove event listeners to avoid duplication on reopen */
      lbTrack.removeEventListener("touchstart", lbTouchStart);
      lbTrack.removeEventListener("touchmove", lbTouchMove);
      lbTrack.removeEventListener("touchend", lbTouchEnd);
    }
 
    if (closeBtn) {
      /* Remove old listeners before adding new one */
      closeBtn.replaceWith(closeBtn.cloneNode(true));
      document
        .getElementById("lbCloseBtn")
        .addEventListener("click", closeMobileLightbox);
    }
 
    /* Keyboard (for accessibility, even on mobile) */
    function lbKeyHandler(e) {
      if (!lb.classList.contains("lb-open")) return;
      if (e.key === "Escape") {
        closeMobileLightbox();
        document.removeEventListener("keydown", lbKeyHandler);
      }
      if (e.key === "ArrowRight") goToLbSlide(lbCurrentIdx + 1);
      if (e.key === "ArrowLeft") goToLbSlide(lbCurrentIdx - 1);
    }
    document.addEventListener("keydown", lbKeyHandler);
  }

  /* ─────────────────────────────────────────────────────────────
     PATCH JS-5: wireInitialThumbClicks() REPLACEMENT
     ───────────────────────────────────────────────────────────── */
  function wireInitialThumbClicks(mediaItems) {
    /* ── Mobile: carousel already built in buildCompleteHTML flow ─ */
    if (window.innerWidth < 768) {
      const initialMedia = {
        mainImage: (mediaItems[0] && mediaItems[0].url) || FALLBACK_IMG,
        productVideoUrl:
          mediaItems.find((i) => i.type === "video")?.url || null,
        mockupImages: mediaItems
          .filter((i) => i.type === "image")
          .slice(1)
          .map((i) => i.url),
      };
      buildMobileCarousel(initialMedia);
      return;
    }
 
    /* ── Desktop: ORIGINAL code ──────────────── */
    setTimeout(() => {
      const desktopThumbContainer = document.getElementById("thumbContainer");
      const mobileThumbContainer = document.getElementById(
        "mobileThumbContainer",
      );
      const mainImg = document.getElementById("mainProductImage");
      const scrollContainer = document.getElementById("thumbScrollContainer");
      const leftBtn = document.getElementById("thumbScrollLeft");
      const rightBtn = document.getElementById("thumbScrollRight");
 
      if (!desktopThumbContainer || !mainImg) return;
 
      if (scrollContainer && leftBtn && rightBtn) {
        const updateButtons = () => {
          const scrollLeft = scrollContainer.scrollLeft;
          const maxScroll =
            scrollContainer.scrollWidth - scrollContainer.clientWidth;
          leftBtn.disabled = scrollLeft <= 1;
          rightBtn.disabled = maxScroll - scrollLeft <= 1;
        };
 
        leftBtn.addEventListener("click", () => {
          scrollContainer.scrollBy({ left: -160, behavior: "smooth" });
          setTimeout(updateButtons, 200);
        });
        rightBtn.addEventListener("click", () => {
          scrollContainer.scrollBy({ left: 160, behavior: "smooth" });
          setTimeout(updateButtons, 200);
        });
        scrollContainer.addEventListener("scroll", updateButtons);
        window.addEventListener("resize", updateButtons);
        setTimeout(updateButtons, 100);
      }
 
      desktopThumbContainer
        .querySelectorAll("[data-media-index]")
        .forEach((thumb) => {
          thumb.addEventListener("click", function () {
            const index = parseInt(this.dataset.mediaIndex);
            const item = mediaItems[index];
            if (item) {
              setMainMedia(item, mainImg);
              updateActiveStates(index);
            }
          });
        });
 
      if (mobileThumbContainer) {
        mobileThumbContainer
          .querySelectorAll(".mobile-thumb-item")
          .forEach((thumb) => {
            thumb.addEventListener("click", function () {
              const index = parseInt(this.dataset.mediaIndex);
              const item = mediaItems[index];
              if (item) {
                setMainMedia(item, mainImg);
                updateActiveStates(index);
              }
            });
          });
      }
 
      const mobileNavDots = document.getElementById("mobileNavDots");
      if (mobileNavDots) {
        mobileNavDots.querySelectorAll(".mobile-nav-dot").forEach((dot) => {
          dot.addEventListener("click", function () {
            const index = parseInt(this.dataset.index);
            const item = mediaItems[index];
            if (item) {
              setMainMedia(item, mainImg);
              updateActiveStates(index);
              if (mobileThumbContainer && scrollContainer) {
                const thumb = mobileThumbContainer.querySelector(
                  `.mobile-thumb-item[data-media-index="${index}"]`,
                );
                if (thumb)
                  thumb.scrollIntoView({
                    behavior: "smooth",
                    inline: "center",
                    block: "nearest",
                  });
              }
            }
          });
        });
      }
 
      function updateActiveStates(activeIndex) {
        desktopThumbContainer
          .querySelectorAll("[data-media-index]")
          .forEach((el) => {
            const idx = parseInt(el.dataset.mediaIndex);
            el.classList.toggle("border-[#e39f32]", idx === activeIndex);
            el.classList.toggle("border-transparent", idx !== activeIndex);
          });
        if (mobileThumbContainer) {
          mobileThumbContainer
            .querySelectorAll(".mobile-thumb-item")
            .forEach((el) => {
              const idx = parseInt(el.dataset.mediaIndex);
              el.classList.toggle("border-[#e39f32]", idx === activeIndex);
              el.classList.toggle("border-transparent", idx !== activeIndex);
            });
        }
        if (mobileNavDots) {
          mobileNavDots
            .querySelectorAll(".mobile-nav-dot")
            .forEach((el, idx) => {
              el.classList.toggle("bg-[#E39F32]", idx === activeIndex);
              el.classList.toggle("scale-125", idx === activeIndex);
              el.classList.toggle("bg-gray-300", idx !== activeIndex);
            });
        }
      }
 
      updateActiveStates(0);
    }, 50);
  }

   /* ─────────────────────────────────────────────────────────────
     PATCH JS-6: Rebuild carousel on window resize
     ───────────────────────────────────────────────────────────── */
  (function initResizeHandler() {
    let resizeTimer = null;
    let lastWasMobile = window.innerWidth < 768;
 
    window.addEventListener("resize", () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
        const isMobileNow = window.innerWidth < 768;
        if (isMobileNow !== lastWasMobile) {
          lastWasMobile = isMobileNow;
          /* Rebuild gallery for current breakpoint */
          if (window._carouselMediaItems) {
            const media = {
              mainImage: window._carouselMediaItems[0]?.url || FALLBACK_IMG,
              productVideoUrl:
                window._carouselMediaItems.find((i) => i.type === "video")
                  ?.url || null,
              mockupImages: window._carouselMediaItems
                .filter((i) => i.type === "image")
                .slice(1)
                .map((i) => i.url),
            };
            buildMediaStrip(media);
          }
        }
      }, 250);
    });
  })();
 
  // ─── ROBUST GALLERY RESIZE & CLEANUP HANDLER ─────────────────────────────
  (function setupRobustGalleryResize() {
    let resizeTimeout = null;
    let previousWidth = window.innerWidth;
 
    function cleanupMobileCarousel() {
      const displayArea = document.getElementById("mainDisplayArea");
      if (!displayArea) return;
 
      // Remove mobile carousel elements
      const track = document.getElementById("carouselTrack");
      if (track) track.remove();
 
      // Remove any leftover mobile-specific elements
      displayArea
        .querySelectorAll(".carousel-slide, #mobileTapHint")
        .forEach((el) => el.remove());
 
      // Restore main image element if missing
      let mainImg = document.getElementById("mainProductImage");
      if (!mainImg) {
        mainImg = document.createElement("img");
        mainImg.id = "mainProductImage";
        mainImg.className =
          "w-full h-full object-cover cursor-pointer transition-transform duration-300 hover:scale-105";
        mainImg.onclick = () => window.openLightbox && window.openLightbox(0);
        const wrapper = document.createElement("div");
        wrapper.className = "relative w-full h-full overflow-hidden";
        wrapper.appendChild(mainImg);
        displayArea.innerHTML = "";
        displayArea.appendChild(wrapper);
      }
    }
 
    window.addEventListener("resize", () => {
      clearTimeout(resizeTimeout);
 
      resizeTimeout = setTimeout(() => {
        if (!safeProductData || !currentVariant) return;
 
        const currentWidth = window.innerWidth;
        const isMobileNow = currentWidth < 768;
        const wasMobile = previousWidth < 768;
 
        if (
          isMobileNow !== wasMobile ||
          Math.abs(currentWidth - previousWidth) > 150
        ) {
          console.log(
            `[Gallery] Resize: ${wasMobile ? "Mobile" : "Desktop"} → ${isMobileNow ? "Mobile" : "Desktop"}`,
          );
 
          // Cleanup before rebuild
          if (!isMobileNow) cleanupMobileCarousel();
 
          const media = getVariantMedia(currentVariant);
          buildMediaStrip(media);
 
          previousWidth = currentWidth;
        }
      }, 180); // Debounced
    });
 
    // Initial run after load
    setTimeout(() => {
      const media = getVariantMedia(currentVariant);
      buildMediaStrip(media);
    }, 300);
  })();
 


  // Add once during init / at bottom of your script
  ["cart:updated", "cart:itemRemoved"].forEach(evt => {
    window.addEventListener(evt, async () => {
      await loadCartItems();   // refresh addedToCartSet
      syncCardCartStates();    // revert any removed items
    });
    document.addEventListener(evt, async () => {
      await loadCartItems();
      syncCardCartStates();
    });
  });


  // ═══════════════════════════════════════════════════════════════════════════
//  HANDLE SHIPROCKET RETURN PARAMETERS
//  SR appends ?oid=xxx&ost=SUCCESS when customer completes payment
// ═══════════════════════════════════════════════════════════════════════════

(function handleShiprocketReturn() {
  const params = new URLSearchParams(window.location.search);
  const orderId = params.get('oid');
  const status = params.get('ost');

  if (orderId && status === 'SUCCESS') {
    console.log('[SR] Order confirmed — SR oid:', orderId);
    showToast('🎉 Order placed successfully!', 'success');
    
    // Optionally redirect to order success page
    // setTimeout(() => {
    //   window.location.href = `/Order-Success/order-success.html?orderId=${orderId}`;
    // }, 2000);
  }

  if (status === 'FAILED') {
    showToast('Payment failed. Please try again.', 'error');
  }
})();

})();
