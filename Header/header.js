//======================================================================//
//                       version : 1.0.3                                //
//======================================================================//
// Updated on: 13 April 2026
// Changes:
// - Desktop authentication now matches Mobile flow (uses toggleLoginState())
// - Removed static "Sign In / Create Account" buttons from desktop dropdown
// - Unified auth logic using isUserLoggedIn() based on localStorage "userId"
// - Mobile functionality remains completely unchanged

function isUserLoggedIn() {
  return !!localStorage.getItem("userId");
}



let cartCount = 4;
let wishlistCount = 3;
let showingAllCategories = false;

// ─── Category Data (Fallback) ────────────────────────────────────────────────
const categoryData = {
  navCategories: [
    {
      categoryId: 1,
      productCategory: "Wall Decor",
      categoryPath: [],
      productCategoryRedirect: "../HomeCategory/homecategory.html",
      categoryPathRedirect: "../HomeSub/homesubcategory.html",
      trendingMark: false,
    },
    {
      categoryId: 2,
      productCategory: "Photo Frames",
      categoryPath: [
        "Wooden Frames",
        "Metal Frames",
        "Collage Frames",
        "Digital Frames",
      ],
      productCategoryRedirect: "../HomeCategory/homecategory.html",
      categoryPathRedirect: "../HomeSub/homesubcategory.html",
      trendingMark: false,
    },
    {
      categoryId: 3,
      productCategory: "Home Decor",
      categoryPath: ["Vases", "Candles", "Showpieces", "Fountains"],
      productCategoryRedirect: "../HomeCategory/homecategory.html",
      categoryPathRedirect: "../HomeSub/homesubcategory.html",
      trendingMark: false,
    },
    {
      categoryId: 4,
      productCategory: "Nameplates",
      categoryPath: [
        "Wooden Nameplates",
        "Metal Nameplates",
        "Acrylic Nameplates",
      ],
      productCategoryRedirect: "../HomeCategory/homecategory.html",
      categoryPathRedirect: "../HomeSub/homesubcategory.html",
      trendingMark: false,
    },
    {
      categoryId: 5,
      productCategory: "Corporate Gifting",
      categoryPath: [
        "Corporate Awards",
        "Customized Gifts",
        "Promotional Items",
      ],
      productCategoryRedirect: "../HomeCategory/homecategory.html",
      categoryPathRedirect: "../HomeSub/homesubcategory.html",
      trendingMark: false,
    },
    {
      categoryId: 6,
      productCategory: "Personalised Gifts",
      categoryPath: ["Photo Gifts", "Custom Name Gifts", "Occasion Special"],
      productCategoryRedirect: "../HomeCategory/homecategory.html",
      categoryPathRedirect: "../HomeSub/homesubcategory.html",
      trendingMark: false,
    },
    {
      categoryId: 7,
      productCategory: "Trophies and Mementos",
      categoryPath: ["Sports Trophies", "Corporate Awards", "Custom Mementos"],
      productCategoryRedirect: "../HomeCategory/homecategory.html",
      categoryPathRedirect: "../HomeSub/homesubcategory.html",
      trendingMark: false,
    },
    {
      categoryId: 8,
      productCategory: "Trending Products",
      categoryPath: ["Best Sellers", "New Arrivals", "Deals of the Day"],
      productCategoryRedirect: "../HomeCategory/homecategory.html",
      categoryPathRedirect: "../HomeSub/homesubcategory.html",
      trendingMark: true,
    },
  ],
};

// ─── Quick Access Links ──────────────────────────────────────────────────────
const quickAccessLinks = [
  {
    icon: "fa-user",
    label: "Account",
    url: "../Profile/profile.html",
    requiresAuth: true,
    guestUrl: "#",
    onClick: function () {
      if (!isUserLoggedIn()) {
        alert("Please sign in to view your account");
        return false;
      }
      return true;
    },
  },
  {
    icon: "fa-box",
    label: "My Orders",
    url: "../Myorders/orders.html",
    requiresAuth: true,
    guestUrl: "#",
    onClick: function () {
      if (!isUserLoggedIn()) {
        alert("Please sign in to view your orders");
        return false;
      }
      return true;
    },
  },
  {
    icon: "fa-phone",
    label: "Contact Us",
    url: "#",
    onClick: function () {
      window.open("https://wa.me/1234567890", "_blank");
      return false;
    },
  },
  {
    icon: "fa-info-circle",
    label: "About Us",
    url: "/about.html",
    onClick: function () {
      return true;
    },
  },
];


// Cache so we don't re-fetch on every menu open
const _catImageCache = {};

async function fetchCategoryThumbnail(categoryName, redirectUrl) {
  if (_catImageCache[categoryName]) return _catImageCache[categoryName];

  try {
    // Hit the same products API your category page uses
    const url = `http://localhost:8085/api/products/get-by-category?category=${encodeURIComponent(categoryName)}&page=0&size=1`;
    const res  = await fetch(url);
    if (!res.ok) throw new Error("no products");
    const data = await res.json();

    // Handle both paginated {content:[]} and plain array responses
    const products = data.content || data.data || data || [];
    const first    = Array.isArray(products) ? products[0] : null;

    if (first) {
      const img = first.mainImage || first.mainImageUrl || first.imageUrl || "";
      const full = img.startsWith("/") ? "http://localhost:8085" + img : img;
      if (full) { _catImageCache[categoryName] = full; return full; }
    }
  } catch(e) {
    // silent — fall through to static map
  }

  // Fallback: static categoryImages map
  const fallback = categoryImages[categoryName] || "";
  _catImageCache[categoryName] = fallback;
  return fallback;
}

// ─── Category Images ─────────────────────────────────────────────────────────
const categoryImages = {
  "Wall Decor":
    "https://cdn.shopify.com/s/files/1/0632/2526/6422/files/1_4345985e-c8a5-40af-9a03-0fcf35940ffc.jpg?v=1771484241&width=1728",
  "Photo Frames":
    "https://cdn.shopify.com/s/files/1/0632/2526/6422/files/ASFRP25405_3.jpg?v=1772760662&width=1728",
  "Home Decor":
    "https://m.media-amazon.com/images/S/shoppable-media-external-prod-iad-us-east-1/dc96db56-6f71-48d1-b4d5-af22a91e4d60/6b804-0a5f-4946-b7aa-22414c476._AC_._SX1200_SCLZZZZZZZ_.jpeg",
  Nameplates: "https://picsum.photos/id/200/600/600",
  "Corporate Gifting":
    "https://printo-s3.dietpixels.net/site/2025/Joining%20kit/1280/The-Onward-Box_1742898848.jpg?quality=70&format=webp&w=640",
  "Personalised Gifts":
    "https://static-assets-prod.fnp.com/images/pr/l/v20240104150045/personalised-photo-magnets_1.jpg",
  "Trophies and Mementos":
    "https://trophycreator.in/img/diamond-trophy-supplier-in-India-hm.jpg",
  "Trending Products": "https://picsum.photos/id/870/600/600",
};

// ─── Banner Images ────────────────────────────────────────────────────────────
const bannerImages = [
  "https://picsum.photos/id/1015/800/300",
  "https://picsum.photos/id/106/800/300",
  "https://picsum.photos/id/201/800/300",
];

async function fetchMobileBannerImages() {
  // 1. Already loaded by index.js → use it
  if (window.artezoData?.bannerSlides?.length > 0) {
    return window.artezoData.bannerSlides.map(
      s => s.mainImage || s.smallImage
    ).filter(Boolean);
  }
  // 2. Fetch directly from banner API
  try {
    const res  = await fetch("http://localhost:8085/api/banners/get-banner-by-name/home");
    if (!res.ok) throw new Error("banner api failed");
    const json = await res.json();
    const slides = json?.data?.slides || [];
    return slides.map(slide => {
      const url = slide.leftMain?.imageUrl || slide.leftMain?.image
                || slide.mainImageUrl     || slide.mainImage || "";
      return url.startsWith("/") ? "http://localhost:8085" + url : url;
    }).filter(Boolean);
  } catch(e) {
    console.warn("[MobileBanner] fetch failed:", e.message);
    return [];
  }
}

// ─── URL Builder Helpers ─────────────────────────────────────────────────────
function buildCategoryUrl(baseUrl, categoryName) {
  if (!baseUrl || baseUrl === "#") return "#";
  const separator = baseUrl.includes("?") ? "&" : "?";
  return `${baseUrl}${separator}category=${encodeURIComponent(categoryName)}`;
}

function buildSubCategoryUrl(baseUrl, subCategoryName) {
  if (!baseUrl || baseUrl === "#") return "#";
  const separator = baseUrl.includes("?") ? "&" : "?";
  return `${baseUrl}${separator}subCategory=${encodeURIComponent(subCategoryName)}`;
}

// ─── Trending Badge Styles ───────────────────────────────────────────────────
function injectTrendingStyles() {
  if (document.getElementById("trending-badge-styles")) return;

  const style = document.createElement("style");
  style.id = "trending-badge-styles";
  style.textContent = `
    @keyframes trendingPulse {
      0%, 100% { box-shadow: 0 0 0 0 rgba(220, 38, 38, 0.6); }
      50% { box-shadow: 0 0 0 6px rgba(220, 38, 38, 0); }
    }
    @keyframes trendingFlicker {
      0%, 100% { opacity: 1; }
      45% { opacity: 0.7; }
      55% { opacity: 1; }
    }
    .trending-badge {
      display: inline-flex;
      text-align: center;
      align-items: center;
      gap: 2px;
      font-size: 10px;
      font-weight: 600;
      letter-spacing: 0.05em;
      text-transform: uppercase;
      color: #D89F34;
      background: #f8f8f8;
      border: 2px solid #D89F34;
      border-radius: 9999px;
      padding: 3px 3px 3px 6px;
      vertical-align: middle;
      animation: trendingPulse 2s ease-in-out infinite;
      white-space: nowrap;
      box-shadow: 0 2px 4px rgba(0,0,0,0.2);
    }
    .trending-badge .fire-icon {
      font-size: 10px;
      animation: trendingFlicker 1.2s ease-in-out infinite;
    }
    .trending-card-badge {
      position: absolute;
      top: 8px;
      right: 8px;
      display: inline-flex;
      align-items: center;
      gap: 3px;
      font-size: 9px;
      font-weight: 800;
      letter-spacing: 0.05em;
      text-transform: uppercase;
      color: #fff;
      background: linear-gradient(135deg, #dc2626, #ef4444);
      border-radius: 9999px;
      padding: 2px 8px;
      animation: trendingPulse 2s ease-in-out infinite;
      pointer-events: none;
      box-shadow: 0 2px 6px rgba(220,38,38,0.4);
    }
    .trending-card-badge .fire-icon {
      font-size: 11px;
      animation: trendingFlicker 1.2s ease-in-out infinite;
    }
  `;
  document.head.appendChild(style);
}

// ─── Cached Category Fetch ───────────────────────────────────────────────────
let _categoriesPromise = null;

function getCategoriesPromise() {
  if (_categoriesPromise) return _categoriesPromise;

  _categoriesPromise = (async function fetchCategories() {
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000);

        const response = await fetch(
          "http://localhost:8085/api/v1/custom-categories/get-all-categories",
          {
            method: "GET",
            headers: { "Content-Type": "application/json" },
            signal: controller.signal,
          },
        );

        clearTimeout(timeoutId);

        if (!response.ok) throw new Error(`HTTP error: ${response.status}`);

        const data = await response.json();
        const approvedCategories = data.filter((cat) => cat.approved === true);

        if (!approvedCategories || approvedCategories.length === 0)
          throw new Error("Empty response");

        return approvedCategories;
      } catch (error) {
        console.warn(
          `Category fetch attempt ${attempt} failed:`,
          error.message,
        );
        if (attempt === 3) {
          console.error("All retries exhausted. Using fallback categories.");
          _categoriesPromise = null;
          return categoryData.navCategories;
        }
        await new Promise((res) => setTimeout(res, 1000 * attempt));
      }
    }
  })();

  return _categoriesPromise;
}

function fetchCategories() {
  return getCategoriesPromise();
}

// ─── Trending Helpers ────────────────────────────────────────────────────────
function trendingBadgeHTML() {
  return `<span class="trending-badge"><span class="fire-icon">🔥</span>Top Trends</span>`;
}

function trendingCardBadgeHTML() {
  return `<span class="trending-card-badge"><span class="fire-icon">🔥</span>Top Trends</span>`;
}

// ─── Desktop Navigation ──────────────────────────────────────────────────────
function renderDesktopNavigation(categories) {
  const navContainer = document.querySelector(".md\\:block nav");
  if (!navContainer) return;

  categories = categories || categoryData.navCategories;

  let navHTML = "";

  categories.forEach((category) => {
    const hasSubcategories =
      category.categoryPath && category.categoryPath.length > 0;
    const badge =
      category.trendingMark === true || category.trending === true
        ? ` ${trendingBadgeHTML()}`
        : "";

    const mainCatUrl = buildCategoryUrl(
      category.productCategoryRedirect || "#",
      category.productCategory,
    );

    if (hasSubcategories) {
      navHTML += `
        <div class="relative group">
          <a href="${mainCatUrl}"
             class="hover:text-accent transition-colors whitespace-nowrap inline-flex items-center gap-1">
            ${category.productCategory}${badge}
            <i class="fa-solid fa-chevron-down text-[10px] group-hover:rotate-180 transition-transform"></i>
          </a>
          <div class="absolute left-0 top-full invisible group-hover:visible opacity-0 group-hover:opacity-100 transition-all duration-200 z-50">
            <div class="bg-white rounded-lg shadow-xl border border-gray-100 py-4 flex ${category.categoryPath.length <= 4 ? "flex-col gap-1 min-w-[200px]" : "gap-3 min-w-[480px]"}">
              ${
                category.categoryPath.length <= 4
                  ? category.categoryPath
                      .map((subcat) => {
                        const subUrl = buildSubCategoryUrl(
                          category.categoryPathRedirect || "#",
                          subcat,
                        );
                        return `
                    <a href="${subUrl}"
                       class="flex items-center gap-2 px-5 py-2 text-sm hover:bg-zinc-50 hover:text-accent transition-colors">
                      <i class="fa-solid fa-tag text-[#E39F32] w-4"></i><span>${subcat}</span>
                    </a>`;
                      })
                      .join("")
                  : (() => {
                      const mid = Math.ceil(category.categoryPath.length / 2);
                      const left = category.categoryPath.slice(0, mid);
                      const right = category.categoryPath.slice(mid);
                      const renderSubLink = (subcat) => {
                        const subUrl = buildSubCategoryUrl(
                          category.categoryPathRedirect || "#",
                          subcat,
                        );
                        return `
                        <a href="${subUrl}"
                           class="flex items-center gap-2 px-5 py-2.5 text-sm hover:bg-zinc-50 hover:text-accent transition-colors">
                          <i class="fa-solid fa-tag text-[#E39F32] w-4"></i><span>${subcat}</span>
                        </a>`;
                      };
                      return `
                      <div class="flex-1 flex flex-col gap-1">${left.map(renderSubLink).join("")}</div>
                      <div class="w-px bg-gray-200"></div>
                      <div class="flex-1 flex flex-col gap-1">${right.map(renderSubLink).join("")}</div>`;
                    })()
              }
            </div>
          </div>
        </div>`;
    } else {
      navHTML += `
        <a href="${mainCatUrl}"
           class="hover:text-accent transition-colors whitespace-nowrap inline-flex items-center gap-1">
          ${category.productCategory}${badge}
        </a>`;
    }
  });

  navContainer.innerHTML = navHTML;
}

// ─── Quick Access ────────────────────────────────────────────────────────────
function renderQuickAccessLinks() {
  const html = quickAccessLinks
    .map((link) => {
      const url =
        link.requiresAuth && !isUserLoggedIn()
          ? link.guestUrl || "#"
          : link.url;
      return `
      <a href="${url}" class="quick-access-link flex flex-col items-center gap-2 p-3 bg-gray-50 rounded-xl hover:bg-accent/10 transition-colors group"
         data-label="${link.label}" onclick="return handleQuickAccessClick(event, '${link.label}')">
        <i class="fa-solid ${link.icon} text-xl text-primary group-hover:text-accent"></i>
        <span class="text-xs font-medium text-gray-700 group-hover:text-accent">${link.label}</span>
      </a>`;
    })
    .join("");

  return `
    <div class="mt-8 pt-4">
      <h3 class="text-sm font-semibold text-gray-500 mb-4 px-4">QUICK ACCESS</h3>
      <div class="grid grid-cols-4 gap-2 px-4">${html}</div>
    </div>`;
}

window.handleQuickAccessClick = function (event, label) {
  const link = quickAccessLinks.find((l) => l.label === label);
  if (link && link.onClick) return link.onClick();
  return true;
};

// ─── Mobile Navigation ───────────────────────────────────────────────────────
async  function renderMobileNavigation(categories) {
  const mobileNav = document.querySelector(
    "#mobile-menu .flex-1.overflow-y-auto",
  );
  if (!mobileNav) return;

 // Build mobile category grid from API categories (same source as desktop nav)
// Falls back to categoryData.navCategories if API failed
const mobileCats = categories || categoryData.navCategories;

// Fetch all category thumbnails in parallel before rendering
const catImgResolved = await Promise.all(
  mobileCats.map(cat => fetchCategoryThumbnail(cat.productCategory || ""))
);

const staticMobileGridHTML = mobileCats.map((cat, idx) => {
  const name = cat.productCategory || "";
  const url  = buildCategoryUrl(cat.productCategoryRedirect || "#", name);
  const img  = catImgResolved[idx] || "";

  return `
    <a href="${url}" class="flex flex-col items-center text-center group">
      <div class="w-full aspect-square bg-gray-100 rounded-2xl overflow-hidden mb-2 group-hover:shadow-md transition-shadow">
        ${img
          ? `<img src="${img}" alt="${name}" class="w-full h-full object-cover"
                  onerror="this.style.display='none'">`
          : `<div class="w-full h-full flex items-center justify-center text-gray-300 text-2xl">
               <i class="fa-solid fa-image"></i>
             </div>`
        }
      </div>
      <span class="text-xs font-medium text-gray-700 group-hover:text-accent line-clamp-2 leading-tight">${name}</span>
    </a>`;
}).join("");

  const mobileBannerImages = await fetchMobileBannerImages();

  const carouselHTML = `
    <div class="mt-8">
      <div class="relative">
        <div id="banner-carousel" class="overflow-hidden rounded-xl">
          <div id="carousel-track" class="flex transition-transform duration-500 ease-in-out">
            ${mobileBannerImages
              .map(
                (img, i) => `
              <div class="w-full flex-shrink-0 px-1">
                <img src="${img}" alt="Banner ${i + 1}" class="w-full h-32 object-cover rounded-xl">
              </div>`,
              )
              .join("")}
          </div>
        </div>
        <div class="flex justify-center gap-2 mt-4">
          ${mobileBannerImages.map((_, i) => `<button class="carousel-dot w-2 h-2 rounded-full bg-gray-300 transition-colors" data-index="${i}"></button>`).join("")}
        </div>
      </div>
    </div>`;

  mobileNav.innerHTML = `
    <div class="mb-4 px-4">
  <div class="relative">
    <input id="hamburger-search-input" type="text" placeholder="Search products…"
           class="w-full h-12 pl-12 pr-4 bg-gray-100 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-accent/50" />
    <div class="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
      <i class="fa-solid fa-magnifying-glass"></i>
    </div>
  </div>
  <!-- Results drop in here -->
  <div id="hamburger-search-results"
       class="hidden mt-2 bg-white rounded-2xl shadow-xl border border-gray-100 max-h-[50vh] overflow-y-auto">
  </div>
</div>
    <div class="mb-4 px-4">
      <h2 class="text-lg font-semibold text-gray-900">All Categories</h2>
    </div>
    <div class="grid grid-cols-3 gap-4 px-4">
      ${staticMobileGridHTML}
    </div>
    ${carouselHTML}
    ${renderQuickAccessLinks()}
  `;

  setTimeout(initBannerCarousel, 150);
  // Wire hamburger menu search after DOM is injected
  setTimeout(initHamburgerSearch, 50);
}

// ─── Banner Carousel ─────────────────────────────────────────────────────────
let touchStartX = 0;

function initBannerCarousel() {
  const track = document.getElementById("carousel-track");
  const dots = document.querySelectorAll(".carousel-dot");
  if (!track || dots.length === 0) return;

  let currentIndex = 0;
  const totalSlides = dots.length;
  let autoplayInterval;

  function updateCarousel(index) {
    index = (index + totalSlides) % totalSlides;
    track.style.transform = `translateX(-${index * 100}%)`;
    dots.forEach((dot, i) => {
      dot.classList.toggle("bg-accent", i === index);
      dot.classList.toggle("bg-gray-300", i !== index);
    });
    currentIndex = index;
  }

  dots.forEach((dot) =>
    dot.addEventListener("click", () => {
      updateCarousel(parseInt(dot.dataset.index));
      resetAutoplay();
    }),
  );

  const startAutoplay = () => {
    stopAutoplay();
    autoplayInterval = setInterval(
      () => updateCarousel(currentIndex + 1),
      3000,
    );
  };
  const stopAutoplay = () => {
    if (autoplayInterval) clearInterval(autoplayInterval);
  };
  const resetAutoplay = () => {
    stopAutoplay();
    startAutoplay();
  };

  track.addEventListener("touchstart", (e) => {
    touchStartX = e.changedTouches[0].screenX;
    stopAutoplay();
  });

  track.addEventListener("touchend", (e) => {
    const diff = touchStartX - e.changedTouches[0].screenX;
    if (Math.abs(diff) > 50) updateCarousel(currentIndex + (diff > 0 ? 1 : -1));
    startAutoplay();
  });

  track.addEventListener("mouseenter", stopAutoplay);
  track.addEventListener("mouseleave", startAutoplay);

  updateCarousel(0);
  startAutoplay();
}

// ─── Cart Preview ────────────────────────────────────────────────────────────
function toggleCartPreview() {
  cartCount = cartCount === 4 ? 5 : 4;
  document.querySelectorAll("#cart-count, #mobile-cart-count").forEach((el) => {
    if (el) el.textContent = cartCount;
  });
  alert(`🛒 Cart updated! You have ${cartCount} items (demo)`);
}

// ─── Account Dropdown ────────────────────────────────────────────────────────
// ─── Account Dropdown ────────────────────────────────────────────────────────
function renderAccountDropdown() {
  const dropdown = document.getElementById("account-dropdown");
  const avatar = document.getElementById("account-avatar");
  const nameEl = document.getElementById("account-name-mobile");

  if (!dropdown || !avatar) return;

  const user = UserAuth.getCurrentUser();
  const isLoggedIn = !!(user && user.userId);

  if (isLoggedIn) {
    dropdown.innerHTML = `
      <div class="py-2">

        <a href="../Profile/profile.html"
           class="flex items-center gap-x-4 px-7 py-4 hover:bg-zinc-50 text-sm">
          <i class="fa-solid fa-user w-5 text-gray-400"></i>
          <span>My Profile</span>
        </a>

        <a href="../Myorders/orders.html"
           class="flex items-center gap-x-4 px-7 py-4 hover:bg-zinc-50 text-sm">
          <i class="fa-solid fa-box w-5 text-gray-400"></i>
          <span>My Orders</span>
        </a>

        <a href="../Wishlist/wishlist.html"
           class="flex items-center gap-x-4 px-7 py-4 hover:bg-zinc-50 text-sm">
          <i class="fa-solid fa-heart w-5 text-gray-400"></i>
          <span>Wishlist</span>
        </a>

      </div>

      <div class="border-t mx-4 my-2"></div>

      <a href="#"
         onclick="showLogoutOverlay(); return false;"
         class="w-full text-left flex items-center gap-x-4 px-7 py-4 text-red-600 hover:bg-red-50 text-sm">
        <i class="fa-solid fa-arrow-right-from-bracket"></i>
        <span>Logout</span>
      </a>
    `;

    // Avatar icon
    avatar.innerHTML = `
      <div class="w-full h-full flex items-center justify-center bg-accent/10 text-accent rounded-full">
        <i class="fa-solid fa-user text-xl"></i>
      </div>
    `;

    if (nameEl) nameEl.textContent = "";
  } else {
    dropdown.innerHTML = `
      <div class="p-10 text-center">
        <i class="fa-solid fa-user text-5xl text-gray-300 mb-4"></i>
        <p class="text-gray-500 text-sm">
          Sign in to access your account, orders & wishlist
        </p>
      </div>
    `;

    avatar.innerHTML = `<i class="fa-solid fa-user text-2xl"></i>`;

    if (nameEl) nameEl.textContent = "";
  }
}

//Now redirects to login if not logged in (matches mobile)
function toggleAccountDropdown() {
  if (!isUserLoggedIn()) {
    toggleLoginState();
    return;
  }

  document.getElementById("account-dropdown")?.classList.toggle("hidden");
  document.getElementById("search-suggestions")?.classList.add("hidden");
}

// ─── Auth Helpers ────────────────────────────────────────────────────────────
function _afterAuthChange() {
  renderAccountDropdown();
}

// Removed login() and signup() - no longer needed for desktop
// Update the logout function
function logout() {
  localStorage.removeItem("userId");
  localStorage.removeItem("token");
  _afterAuthChange();
  document.getElementById("account-dropdown")?.classList.add("hidden");

  //Redirect to home page after logout
  window.location.href = "/index.html";
}

// Add a wrapper function that shows the overlay first
window.initiateLogout = function () {
  if (typeof showLogoutOverlay === "function") {
    showLogoutOverlay("Are you sure you want to logout?");
  } else {
    // Fallback to direct logout if overlay not available
    logout();
  }
};
// ─── Wishlist ────────────────────────────────────────────────────────────────
function toggleWishlist() {
  wishlistCount = wishlistCount === 3 ? 4 : 3;
  const els = document.querySelectorAll(
    "#wishlist-count, #mobile-wishlist-count",
  );
  els.forEach((el) => {
    if (el) el.textContent = wishlistCount;
  });
  alert("❤️ Added to Wishlist (demo)");
}

// ─── Search Helpers ──────────────────────────────────────────────────────────
function quickSearch(el) {
  const term = el.textContent.trim();
  const input = document.getElementById("search-input");
  if (input) input.value = term;
  document.getElementById("search-suggestions")?.classList.add("hidden");
  setTimeout(() => alert(`🔍 Searching for "${term}"... (demo)`), 300);
}

// ─── Mobile Menu ─────────────────────────────────────────────────────────────
// function openMobileMenu() {
//   const menu = document.getElementById("mobile-menu");
//   if (!menu) return;
//   menu.classList.remove("translate-x-full");
//   document.body.style.overflow = "hidden";
//   showingAllCategories = false;
//   renderMobileNavigation();
// }


function openMobileMenu() {
  const menu = document.getElementById("mobile-menu");
  if (!menu) return;
  menu.classList.remove("translate-x-full");
  document.body.style.overflow = "hidden";
  showingAllCategories = false;
  // Pass already-fetched categories so grid uses API data, not fallback
  getCategoriesPromise().then(cats => renderMobileNavigation(cats));
}


function closeMobileMenu() {
  const menu = document.getElementById("mobile-menu");
  if (menu) {
    menu.classList.add("translate-x-full");
    document.body.style.overflow = "";
  }
}

function showMobileSearch() {
  document.getElementById("mobile-search-overlay")?.classList.remove("hidden");
}

function hideMobileSearch() {
  document.getElementById("mobile-search-overlay")?.classList.add("hidden");
}

// ─── Mobile Menu ─────────────────────────────────────────────────────────────
function initMobileMenu() {
  // Hamburger
  document.getElementById("hamburger-btn")?.addEventListener("click", (e) => {
    e.preventDefault();
    e.stopPropagation();
    openMobileMenu();
  });

  // Close menu
  document.getElementById("close-menu-btn")?.addEventListener("click", (e) => {
    e.preventDefault();
    e.stopPropagation();
    closeMobileMenu();
  });

  // Mobile search
  document
    .getElementById("mobile-search-btn")
    ?.addEventListener("click", (e) => {
      e.preventDefault();
      showMobileSearch();
    });

  // Mobile cart
  document
    .getElementById("mobile-cart-btn")
    ?.addEventListener("click", toggleCartPreview);

  // NEW: Mobile Profile icon in top bar
  // Mobile Profile Button
  const mobileProfileBtn = document.getElementById("mobile-profile-btn");
  if (mobileProfileBtn) {
    mobileProfileBtn.addEventListener("click", handleMobileProfileClick);
  }

  // Close mobile menu when tapping outside
  document.getElementById("mobile-menu")?.addEventListener("click", (e) => {
    if (e.target.id === "mobile-menu") closeMobileMenu();
  });

  // Mobile search overlay close
  document
    .querySelector("#mobile-search-overlay button")
    ?.addEventListener("click", hideMobileSearch);
}

// ─── Update Mobile Footer Button ─────────────────────────────────────
function updateMobileLoginButton() {
  const btn = document.getElementById("mobile-login-btn");
  if (!btn) return;

  btn.innerText = isUserLoggedIn() ? "My Account" : "Sign In / Join";
}

// ─── Toggle function ─────────────────────────────────────────────────────
function toggleLoginState() {
  if (isUserLoggedIn()) {
    window.location.href = "../Profile/profile.html";
  } else {
    window.location.href = "../LoginPage/login.html";
  }
}

// ─── Mobile Top Bar Profile Icon Handler(NEW - 13 April 2026) ───────────────
let mobileProfileDropdownOpen = false;
let mobileProfileDropdownElement = null;

window.handleMobileProfileClick = function (e) {
  if (e && typeof e.preventDefault === "function") {
    e.preventDefault();
    e.stopImmediatePropagation();
  }

  if (!isUserLoggedIn()) {
    toggleLoginState();
    return false;
  }

  toggleMobileProfileDropdown();
  return false;
};

function toggleMobileProfileDropdown() {
  if (!mobileProfileDropdownElement) {
    mobileProfileDropdownElement = document.createElement("div");
    mobileProfileDropdownElement.id = "mobile-profile-dropdown";
    mobileProfileDropdownElement.className = `
      absolute right-4 top-16 w-64 bg-white rounded-2xl shadow-2xl border border-gray-100 py-2 z-[999]
      transition-all duration-200 origin-top-right scale-95 opacity-0 hidden
    `;

    mobileProfileDropdownElement.innerHTML = `
      <div class="py-1">
        <a href="../Profile/profile.html" class="flex items-center gap-x-3 px-5 py-3.5 hover:bg-zinc-50 text-sm font-medium text-gray-700">
          <i class="fa-solid fa-user w-5 text-gray-400"></i>
          <span>My Profile</span>
        </a>
        <a href="../Myorders/orders.html" class="flex items-center gap-x-3 px-5 py-3.5 hover:bg-zinc-50 text-sm font-medium text-gray-700">
          <i class="fa-solid fa-box w-5 text-gray-400"></i>
          <span>My Orders</span>
        </a>
        <div class="border-t border-gray-100 my-1 mx-4"></div>
        <button onclick="performLogout()" 
                class="w-full flex items-center gap-x-3 px-5 py-3.5 hover:bg-red-50 text-sm font-medium text-red-600 text-left">
          <i class="fa-solid fa-arrow-right-from-bracket w-5"></i>
          <span>Logout</span>
        </button>
      </div>
    `;

    document.body.appendChild(mobileProfileDropdownElement);
    document.addEventListener(
      "click",
      closeMobileProfileDropdownOnOutsideClick,
      false,
    );
  }

  const dropdown = mobileProfileDropdownElement;

  if (mobileProfileDropdownOpen) {
    dropdown.style.transform = "scale(0.95)";
    dropdown.style.opacity = "0";
    setTimeout(() => dropdown.classList.add("hidden"), 180);
  } else {
    const btnRect = document
      .getElementById("mobile-profile-btn")
      .getBoundingClientRect();
    dropdown.style.top = `${btnRect.bottom + 8}px`;
    dropdown.style.right = `${window.innerWidth - btnRect.right - 8}px`;

    dropdown.classList.remove("hidden");
    requestAnimationFrame(() => {
      dropdown.style.transform = "scale(1)";
      dropdown.style.opacity = "1";
    });
  }

  mobileProfileDropdownOpen = !mobileProfileDropdownOpen;
}

function closeMobileProfileDropdownOnOutsideClick(e) {
  const dropdown = mobileProfileDropdownElement;
  const btn = document.getElementById("mobile-profile-btn");
  if (!dropdown || !btn) return;

  if (!dropdown.contains(e.target) && !btn.contains(e.target)) {
    if (mobileProfileDropdownOpen) {
      dropdown.style.transform = "scale(0.95)";
      dropdown.style.opacity = "0";
      setTimeout(() => dropdown.classList.add("hidden"), 180);
      mobileProfileDropdownOpen = false;
    }
  }
}

window.performLogout = function () {
  // Close the mobile dropdown first
  if (mobileProfileDropdownElement) {
    mobileProfileDropdownElement.remove();
    mobileProfileDropdownElement = null;
  }
  mobileProfileDropdownOpen = false;

  // Show the global logout overlay instead of confirm()
  if (typeof showLogoutOverlay === "function") {
    showLogoutOverlay("Are you sure you want to logout?");
  } else {
    // Fallback in case auth.js hasn't loaded
    console.warn("showLogoutOverlay not available, using fallback");
    if (confirm("Are you sure you want to logout?")) {
      logout();
    }
  }
};

// Add this function after window.performLogout
window.handleDesktopLogout = function () {
  // Close the desktop dropdown first
  const dropdown = document.getElementById("account-dropdown");
  if (dropdown) {
    dropdown.classList.add("hidden");
  }

  // Show the global logout overlay
  if (typeof showLogoutOverlay === "function") {
    showLogoutOverlay("Are you sure you want to logout?");
  } else {
    // Fallback
    if (confirm("Are you sure you want to logout?")) {
      logout();
    }
  }
};

// Initialize on every page
document.addEventListener("DOMContentLoaded", () => {
  updateMobileLoginButton();
});

document.addEventListener("visibilitychange", () => {
  if (document.visibilityState === "visible") {
    updateMobileLoginButton();
  }
});

setTimeout(updateMobileLoginButton, 300);
setTimeout(updateMobileLoginButton, 500);

// ─── Click Outside ───────────────────────────────────────────────────────────
function handleClickOutside(e) {
  if (!document.getElementById("account-wrapper")?.contains(e.target)) {
    document.getElementById("account-dropdown")?.classList.add("hidden");
  }
  if (
    !document.getElementById("desktop-search-container")?.contains(e.target)
  ) {
    document.getElementById("search-suggestions")?.classList.add("hidden");
  }

  // Close mobile profile dropdown when clicking outside
  const mobileDropdown = document.getElementById("mobile-profile-dropdown");
  if (mobileDropdown && !mobileDropdown.contains(e.target)) {
    mobileDropdown.style.transform = "scale(0.95)";
    mobileDropdown.style.opacity = "0";
    setTimeout(() => {
      if (mobileDropdown) mobileDropdown.classList.add("hidden");
    }, 180);
    mobileProfileDropdownOpen = false;
  }
}

// ─── Initialize Categories ───────────────────────────────────────────────────
async function initializeCategories() {
  try {
    const categories = await fetchCategories();
    renderDesktopNavigation(categories);
    renderMobileNavigation(categories);
  } catch (err) {
    console.error("Failed to load categories, using fallback");
    renderDesktopNavigation(null);
    renderMobileNavigation(null);
  }
}

// ─── Typing Animation & Top Bar Animation (unchanged) ────────────────────────
function initTypingAnimation() {
  const phrases = [
    "Search for photoframes…",
    "Search for curtains…",
    "Search for home decor…",
    "Search for deals…",
    "Search for new arrivals…",
  ];
  let phraseIndex = 0,
    charIndex = 0,
    isDeleting = false,
    timeout;
  const input = document.getElementById("search-input");
  if (!input) return;

  function type() {
    const current = phrases[phraseIndex];
    input.placeholder = isDeleting
      ? current.substring(0, charIndex - 1)
      : current.substring(0, charIndex + 1);
    isDeleting ? charIndex-- : charIndex++;
    if (!isDeleting && charIndex === current.length) {
      isDeleting = true;
      timeout = setTimeout(type, 1800);
      return;
    }
    if (isDeleting && charIndex === 0) {
      isDeleting = false;
      phraseIndex = (phraseIndex + 1) % phrases.length;
      timeout = setTimeout(type, 400);
      return;
    }
    timeout = setTimeout(type, isDeleting ? 35 : 65);
  }

  input.addEventListener("focus", () => {
    clearTimeout(timeout);
    input.placeholder = "What are you looking for?";
  });
  input.addEventListener("blur", () => {
    if (input.value === "") {
      charIndex = 0;
      type();
    }
  });
  type();
}

const typingData = [
  { icon: "fa-store", text: "Welcome to Artezo Store" },
  { icon: "fa-couch", text: "Elevate Your Home Decor" },
  { icon: "fa-image", text: "Crafted for Every Space" },
  { icon: "fa-gift", text: "Create a Home You Love" },
];

let textIndex = 0,
  charIndex = 0,
  isDeleting = false,
  typingTimeout;

function typeEffect() {
  const typingTextEl = document.getElementById("typing-text");
  const typingIconEl = document.getElementById("typing-icon");
  if (!typingTextEl || !typingIconEl) return;

  const currentItem = typingData[textIndex];
  if (charIndex === 0)
    typingIconEl.innerHTML = `<i class="fa-solid ${currentItem.icon} mr-2"></i>`;

  const currentText = currentItem.text;
  if (isDeleting) {
    typingTextEl.textContent = currentText.substring(0, charIndex - 1);
    charIndex--;
  } else {
    typingTextEl.textContent = currentText.substring(0, charIndex + 1);
    charIndex++;
  }

  let speed = isDeleting ? 40 : 100;
  if (!isDeleting && charIndex === currentText.length) {
    speed = 2000;
    isDeleting = true;
  } else if (isDeleting && charIndex === 0) {
    isDeleting = false;
    textIndex = (textIndex + 1) % typingData.length;
    speed = 600;
  }

  clearTimeout(typingTimeout);
  typingTimeout = setTimeout(typeEffect, speed);
}

function initTypingAnimationForTopBar() {
  const typingTextEl = document.getElementById("typing-text");
  const typingIconEl = document.getElementById("typing-icon");
  if (!typingTextEl || !typingIconEl) return;

  textIndex = 0;
  charIndex = 0;
  isDeleting = false;
  typeEffect();

  const topBar = document.querySelector(".bg-primary.font-zain");
  if (topBar) {
    topBar.addEventListener("mouseenter", () => clearTimeout(typingTimeout));
    topBar.addEventListener("mouseleave", () => typeEffect());
  }
}

// ─── Main Header Initialization ──────────────────────────────────────────────
async function initializeHeader() {
  console.log("Initializing header...");

  injectTrendingStyles();
  await initializeCategories();
  initTypingAnimationForTopBar();
  renderAccountDropdown();
  initMobileMenu();
  initMobileSearchFeature(); // ← add this line


  document
    .getElementById("cart-btn")
    ?.addEventListener("click", toggleCartPreview);
  document
    .getElementById("mobile-cart-btn")
    ?.addEventListener("click", toggleCartPreview);
  document
    .getElementById("account-btn")
    ?.addEventListener("click", toggleAccountDropdown);
  document.addEventListener("click", handleClickOutside);

  const recentList = document.getElementById("recent-list");
  if (recentList) {
    recentList.innerHTML = ["Photoframes", "curtains", "wall paintings"]
      .map(
        (term) => `
      <div onclick="quickSearch(this)" class="px-4 py-3 hover:bg-zinc-50 border rounded-full cursor-pointer flex justify-between font-lexend font-normal text-sm">
        <span>${term}</span>
      </div>`,
      )
      .join("");
  }

  const searchInput = document.getElementById("search-input");
  const searchSuggestions = document.getElementById("search-suggestions");

  if (searchInput && searchSuggestions) {
    function showSearchDropdown() {
      searchSuggestions.classList.remove("hidden");
    }
    searchInput.addEventListener("focus", showSearchDropdown);
    searchInput.addEventListener("input", () => {
      if (searchInput.value.trim().length > 0) showSearchDropdown();
    });
    searchInput.addEventListener("keydown", (e) => {
      if (e.key === "Escape") searchSuggestions.classList.add("hidden");
    });
  }

  console.log(
    "%c ✅ Artezo Store Header initialized successfully (v1.0.3)",
    "color:#E39F32; font-weight:600",
  );
}

// Force refresh user data after login
setTimeout(() => {
  renderAccountDropdown();
}, 500);


// ==================== CART & WISHLIST COUNT SYNC ====================

console.log("=== ArtezoCountSync LOADED from header.js ===");

const BASE_URL_HEADER = "http://localhost:8085";
const POLL_MS = 60000;

const BADGES = {
    cart: ["cart-count-badge", "mobile-cart-count"],
    wishlist: ["wishlist-count-badge", "mobile-wishlist-count"]
};

let pollTimer = null;

function setBadge(type, count) {
    const display = count > 99 ? "99+" : String(count);
    BADGES[type].forEach(id => {
        const el = document.getElementById(id);
        if (!el) {
            console.warn(`[CountSync] Badge element not found: #${id}`);
            return;
        }
        el.textContent = display;
        el.style.display = (count === 0) ? "none" : "flex";
    });
}

// ─── Count Sync — Event-driven, no polling ───────────────────────────────────
// Strategy:
//   1. Fetch once on load
//   2. Re-fetch on cart:updated / wishlist:updated events (fired by your pages)
//   3. Fallback: ONE refresh on tab focus (if data is stale > 5 min)
//   4. NO setInterval — eliminates 429 entirely

const COUNT_STALE_MS  = 5 * 60 * 1000; // 5 minutes — consider counts stale after this
const COUNT_COOLDOWN_MS = 3000;         // minimum gap between two syncs (debounce)

let lastSyncTime   = 0;   // timestamp of last successful sync
let syncInFlight   = false; // prevent concurrent fetches
let syncDebounceTimer = null;

// Core fetch — called max once per COUNT_COOLDOWN_MS
function syncCounts() {
    const userId = localStorage.getItem('userId');
    if (!userId) return;

    // Debounce: if called rapidly (e.g. two events fire together), wait a tick
    clearTimeout(syncDebounceTimer);
    syncDebounceTimer = setTimeout(_doSyncCounts, 300);
}

async function _doSyncCounts() {
    if (syncInFlight) return; // already fetching, skip

    const userId = localStorage.getItem('userId');
    if (!userId) return;

    const now = Date.now();

    // Cooldown guard: never fire more than once per COUNT_COOLDOWN_MS
    if (now - lastSyncTime < COUNT_COOLDOWN_MS) {
        console.log('[CountSync] Cooldown active — skipping');
        return;
    }

    syncInFlight = true;

    const token = localStorage.getItem('token');
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers.Authorization = `Bearer ${token}`;

    try {
        const [cartRes, wishlistRes] = await Promise.allSettled([
            fetch(`${BASE_URL_HEADER}/api/v1/cart/count?userId=${userId}`, { headers }),
            fetch(`${BASE_URL_HEADER}/api/v1/wishlist/count?userId=${userId}`, { headers })
        ]);

        if (cartRes.status === 'fulfilled') {
            if (cartRes.value.status === 429) {
                console.warn('[CountSync] Cart count rate limited — will retry on next event');
            } else if (cartRes.value.ok) {
                const data = await cartRes.value.json();
                if (data.success) setBadge('cart', data.data?.count || 0);
            }
        }

        if (wishlistRes.status === 'fulfilled') {
            if (wishlistRes.value.status === 429) {
                console.warn('[CountSync] Wishlist count rate limited — will retry on next event');
            } else if (wishlistRes.value.ok) {
                const data = await wishlistRes.value.json();
                if (data.success) setBadge('wishlist', data.data?.count || 0);
            }
        }

        lastSyncTime = Date.now();

    } catch (err) {
        console.error('[CountSync] Fetch error:', err);
    } finally {
        syncInFlight = false;
    }
}

// ─── Trigger on tab becoming visible (stale check, not always) ───────────────
document.addEventListener('visibilitychange', () => {
    if (document.visibilityState !== 'visible') return;
    const stale = Date.now() - lastSyncTime > COUNT_STALE_MS;
    if (stale) {
        console.log('[CountSync] Tab focused, counts stale — refreshing');
        syncCounts();
    }
});

// ─── Initial fetch on load ────────────────────────────────────────────────────
function startCountSync() {
    // NO setInterval — just one fetch on start
    syncCounts();
}

document.addEventListener('DOMContentLoaded', () => {
    startCountSync();
});

// ─── Re-sync on cart/wishlist mutations (fired by cart.js, wishlist.js etc.) ──
window.addEventListener('cart:updated',     () => syncCounts());
window.addEventListener('wishlist:updated', () => syncCounts());

// ─── Global export so any page can trigger a manual refresh ──────────────────
window.refreshCartWishlistCount = syncCounts;


//========================================= END  ===============================================//



// ═══════════════════════════════════════════════════════════════
//  LIVE SEARCH AUTOCOMPLETE  —  INTEGRATED VERSION
//  Depends on: #search-input, #search-suggestions (already in DOM)
//  API: GET /api/products/search?keyword=xxx&limit=8
// ═══════════════════════════════════════════════════════════════

console.log('🔍 Live Search script loading...');

// Config
const SEARCH_API_BASE = 'http://localhost:8085/api/products/search';
const SEARCH_DEBOUNCE_MS = 300;
const SEARCH_MIN_CHARS = 2;
const SEARCH_MAX_RESULTS = 8;
const SEARCH_DETAIL_BASE = '/products/product-detail.html';

// DOM refs
let searchInput = document.getElementById('search-input');
let suggestions = document.getElementById('search-suggestions');

// State
let searchDebounceTimer = null;
let searchActiveIndex = -1;
let searchLastKeyword = '';
let searchCurrentResults = [];

// Helper functions
function formatPrice(price) {
    if (price == null) return '';
    return '₹' + Number(price).toLocaleString('en-IN');
}

function highlightMatch(text, keyword) {
    if (!keyword || !text) return text || '';
    const escaped = keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`(${escaped})`, 'gi');
    return text.replace(regex, '<mark class="artezo-hl">$1</mark>');
}

function getDiscountPct(selling, mrp) {
    if (!mrp || !selling || mrp <= selling) return null;
    return Math.round(((mrp - selling) / mrp) * 100);
}

function showSearchSuggestions() { 
    if (suggestions) suggestions.classList.remove('hidden'); 
}

function hideSearchSuggestions() {
    if (suggestions) suggestions.classList.add('hidden');
    searchActiveIndex = -1;
}

function updateActiveClass() {
    if (!suggestions) return;
    suggestions.querySelectorAll('.artezo-suggestion-item').forEach((el, i) => {
        el.classList.toggle('is-active', i === searchActiveIndex);
    });
}

function attachHoverSync() {
    if (!suggestions) return;
    suggestions.querySelectorAll('.artezo-suggestion-item').forEach(el => {
        el.addEventListener('mouseenter', () => {
            searchActiveIndex = parseInt(el.dataset.index, 10);
            updateActiveClass();
        });
    });
}

function renderSearchResults(results, keyword) {
    searchCurrentResults = results;
    searchActiveIndex = -1;

    if (!results.length) {
        suggestions.innerHTML = `
            <div class="px-5 py-8 text-center text-sm text-gray-400 font-lexend">
                No products found for <strong class="text-primary">"${keyword}"</strong>
            </div>`;
        showSearchSuggestions();
        return;
    }

    const items = results.map((p, i) => {
        const discount = getDiscountPct(p.currentSellingPrice, p.currentMrpPrice);
        const discBadge = discount
            ? `<span class="ml-1 text-[10px] bg-green-100 text-green-700 font-semibold px-1.5 py-0.5 rounded-full">${discount}% off</span>`
            : '';
        const mrpHtml = (p.currentMrpPrice && p.currentMrpPrice > p.currentSellingPrice)
            ? `<span class="line-through text-gray-400 text-[11px] ml-1">${formatPrice(p.currentMrpPrice)}</span>`
            : '';
        const highlighted = highlightMatch(p.productName, keyword);
        
        const imageUrl = p.mainImageUrl || `http://localhost:8085/api/products/${p.productPrimeId}/main`;

        return `
            <div
                class="artezo-suggestion-item flex items-center gap-3 px-5 py-3 cursor-pointer hover:bg-zinc-50 transition-colors"
                data-index="${i}"
                data-id="${p.productPrimeId}"
                onmousedown="event.preventDefault()"
                onclick="window.__artezoGoProduct(${p.productPrimeId})">
                <div class="w-12 h-12 flex-shrink-0 rounded-xl overflow-hidden border border-gray-100 bg-zinc-50">
                    <img
                        src="${imageUrl}"
                        alt="${p.productName}"
                        class="w-full h-full object-cover"
                        onerror="this.style.display='none'"
                    />
                </div>
                <div class="flex-1 min-w-0">
                    <p class="text-sm font-lexend text-gray-800 truncate leading-tight">
                        ${highlighted}
                    </p>
                    ${p.brandName ? `<p class="text-[11px] text-gray-400 mt-0.5">${p.brandName}</p>` : ''}
                    <div class="flex items-center mt-1">
                        <span class="text-sm font-semibold text-primary font-lexend">
                            ${formatPrice(p.currentSellingPrice)}
                        </span>
                        ${mrpHtml}
                        ${discBadge}
                    </div>
                </div>
                <i class="fa-solid fa-chevron-right text-[10px] text-gray-300 flex-shrink-0"></i>
            </div>`;
    }).join('');

    const viewAllHtml = `
        <div class="px-5 py-2.5 border-t border-gray-100">
           <!-- <button
                class="w-full text-center text-xs font-medium font-lexend text-accent hover:text-primary transition-colors py-1"
                onmousedown="event.preventDefault()"
                onclick="window.__artezoGoSearch('${keyword}')">
                View all results for "<span class="font-semibold">${keyword}</span>"
                <i class="fa-solid fa-arrow-right text-[10px] ml-1"></i>
            </button> -->
        </div>`;

    suggestions.innerHTML = `
        <style>
            .artezo-hl { background: transparent; color: #E6A62C; font-weight: 600; padding: 0; }
            .artezo-suggestion-item.is-active { background-color: #f4f4f5; }
        </style>
        <div class="py-2">${items}</div>
        ${viewAllHtml}`;

    showSearchSuggestions();
    attachHoverSync();
}

function renderSearchLoading() {
    suggestions.innerHTML = `
        <div class="px-5 py-6 flex items-center justify-center gap-2 text-sm text-gray-400 font-lexend">
            <svg class="animate-spin h-4 w-4 text-accent" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"></path>
            </svg>
            Searching…
        </div>`;
    showSearchSuggestions();
}

async function fetchSearchSuggestions(keyword) {
    try {
        const url = `${SEARCH_API_BASE}?keyword=${encodeURIComponent(keyword)}&limit=${SEARCH_MAX_RESULTS}`;
        console.log('[Search] Fetching:', url);
        const response = await fetch(url, { 
            method: 'GET', 
            headers: { 'Content-Type': 'application/json' } 
        });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const data = await response.json();
        console.log('[Search] Results:', data.length);
        return data;
    } catch (err) {
        console.warn('[Search] fetch failed:', err);
        return null;
    }
}

// Keyboard navigation
function handleSearchKeydown(e) {
    const items = suggestions.querySelectorAll('.artezo-suggestion-item');
    if (!items.length) return;

    if (e.key === 'ArrowDown') {
        e.preventDefault();
        searchActiveIndex = Math.min(searchActiveIndex + 1, items.length - 1);
        updateActiveClass();
    } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        searchActiveIndex = Math.max(searchActiveIndex - 1, 0);
        updateActiveClass();
    } else if (e.key === 'Enter') {
        e.preventDefault();
        if (searchActiveIndex >= 0 && searchCurrentResults[searchActiveIndex]) {
            window.__artezoGoProduct(searchCurrentResults[searchActiveIndex].productPrimeId);
        } else {
            window.__artezoGoSearch(searchInput.value.trim());
        }
    } else if (e.key === 'Escape') {
        hideSearchSuggestions();
    }
}

// Input handler
function handleSearchInput(e) {
    const keyword = e.target.value.trim();
    clearTimeout(searchDebounceTimer);

    if (keyword.length < SEARCH_MIN_CHARS) {
        hideSearchSuggestions();
        searchLastKeyword = '';
        return;
    }

    if (keyword === searchLastKeyword) return;

    renderSearchLoading();

    searchDebounceTimer = setTimeout(async () => {
        searchLastKeyword = keyword;
        const results = await fetchSearchSuggestions(keyword);

        if (searchInput.value.trim() !== keyword) return;

        if (results === null) {
            hideSearchSuggestions();
            return;
        }

        renderSearchResults(results, keyword);
    }, SEARCH_DEBOUNCE_MS);
}

// Initialize search functionality
function initSearchFeature() {
    searchInput = document.getElementById('search-input');
    suggestions = document.getElementById('search-suggestions');
    
    if (!searchInput || !suggestions) {
        console.warn('[Search] Elements not found, will retry');
        setTimeout(initSearchFeature, 500);
        return;
    }
    
    console.log('[Search] Initializing...');
    
    // Remove any existing listeners by cloning
    const newSearchInput = searchInput.cloneNode(true);
    searchInput.parentNode.replaceChild(newSearchInput, searchInput);
    searchInput = document.getElementById('search-input');
    
    // Add event listeners
    searchInput.addEventListener('input', handleSearchInput);
    searchInput.addEventListener('keydown', handleSearchKeydown);
    searchInput.addEventListener('focus', () => {
        if (searchInput.value.trim().length >= SEARCH_MIN_CHARS && searchCurrentResults.length) {
            showSearchSuggestions();
        }
    });
    
    // Click outside to close
    document.addEventListener('click', (e) => {
        const container = document.getElementById('desktop-search-container');
        if (container && !container.contains(e.target)) {
            hideSearchSuggestions();
        }
    });
    
    console.log('[Search] ✅ Initialized successfully');
}

// ═══════════════════════════════════════════════════════════════
//  MOBILE LIVE SEARCH  — mirrors desktop search exactly
//  Target: #mobile-search-input inside #mobile-search-overlay
// ═══════════════════════════════════════════════════════════════
function initMobileSearchFeature() {
  const overlay = document.getElementById("mobile-search-overlay");
  const input   = document.getElementById("mobile-search-input");
  if (!input || !overlay) return;

  // Create results container inside the overlay, below the search box
  let results = document.getElementById("mobile-overlay-search-results");
  if (!results) {
    results = document.createElement("div");
    results.id = "mobile-overlay-search-results";
    results.className = "w-full mt-3 bg-white rounded-2xl shadow-xl border border-gray-100 max-h-[55vh] overflow-y-auto hidden";
    // Insert after the white search pill div
    input.closest(".bg-white.rounded-3xl").insertAdjacentElement("afterend", results);
  }

  let debounceTimer  = null;
  let lastKeyword    = "";
  let activeIndex    = -1;
  let currentResults = [];

  function showResults() { results.classList.remove("hidden"); }
  function hideResults() { results.classList.add("hidden"); activeIndex = -1; }

  function updateActive() {
    results.querySelectorAll(".artezo-suggestion-item").forEach((el, i) => {
      el.classList.toggle("is-active", i === activeIndex);
    });
  }

  function renderResults(data, keyword) {
    currentResults = data;
    activeIndex = -1;

    if (!data.length) {
      results.innerHTML = `
        <div class="px-5 py-8 text-center text-sm text-gray-400 font-lexend">
          No products found for <strong class="text-primary">"${keyword}"</strong>
        </div>`;
      showResults();
      return;
    }

    const items = data.map((p, i) => {
      const discount   = getDiscountPct(p.currentSellingPrice, p.currentMrpPrice);
      const discBadge  = discount
        ? `<span class="ml-1 text-[10px] bg-green-100 text-green-700 font-semibold px-1.5 py-0.5 rounded-full">${discount}% off</span>`
        : "";
      const mrpHtml = (p.currentMrpPrice && p.currentMrpPrice > p.currentSellingPrice)
        ? `<span class="line-through text-gray-400 text-[11px] ml-1">${formatPrice(p.currentMrpPrice)}</span>`
        : "";
      const highlighted = highlightMatch(p.productName, keyword);
      const imageUrl    = p.mainImageUrl
        || (p.mainImage?.startsWith("/") ? "http://localhost:8085" + p.mainImage : p.mainImage)
        || `http://localhost:8085/api/products/${p.productPrimeId}/main`;

      return `
        <div class="artezo-suggestion-item flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-zinc-50 transition-colors"
             data-index="${i}"
             onmousedown="event.preventDefault()"
             onclick="hideMobileSearch(); window.__artezoGoProduct(${p.productPrimeId})">
          <div class="w-12 h-12 flex-shrink-0 rounded-xl overflow-hidden border border-gray-100 bg-zinc-50">
            <img src="${imageUrl}" alt="${p.productName}" class="w-full h-full object-cover"
                 onerror="this.style.display='none'" />
          </div>
          <div class="flex-1 min-w-0">
            <p class="text-sm font-lexend text-gray-800 truncate leading-tight">${highlighted}</p>
            ${p.brandName ? `<p class="text-[11px] text-gray-400 mt-0.5">${p.brandName}</p>` : ""}
            <div class="flex items-center mt-1 flex-wrap gap-1">
              <span class="text-sm font-semibold text-primary">${formatPrice(p.currentSellingPrice)}</span>
              ${mrpHtml}${discBadge}
            </div>
          </div>
          <i class="fa-solid fa-chevron-right text-[10px] text-gray-300 flex-shrink-0"></i>
        </div>`;
    }).join("");

    results.innerHTML = `
      <style>
        .artezo-hl{background:transparent;color:#E6A62C;font-weight:600;padding:0}
        .artezo-suggestion-item.is-active{background-color:#f4f4f5}
      </style>
      <div class="py-1">${items}</div>`;
    showResults();

    results.querySelectorAll(".artezo-suggestion-item").forEach(el => {
      el.addEventListener("mouseenter", () => {
        activeIndex = parseInt(el.dataset.index, 10);
        updateActive();
      });
    });
  }

  // ── Input handler ──────────────────────────────────────────────
  input.addEventListener("input", (e) => {
    const keyword = e.target.value.trim();
    clearTimeout(debounceTimer);

    if (keyword.length < SEARCH_MIN_CHARS) { hideResults(); lastKeyword = ""; return; }
    if (keyword === lastKeyword) return;

    results.innerHTML = `
      <div class="px-5 py-5 flex items-center justify-center gap-2 text-sm text-gray-400">
        <svg class="animate-spin h-4 w-4 text-accent" xmlns="http://www.w3.org/2000/svg"
             fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
        </svg>
        Searching…
      </div>`;
    showResults();

    debounceTimer = setTimeout(async () => {
      lastKeyword = keyword;
      const data = await fetchSearchSuggestions(keyword);
      if (input.value.trim() !== keyword) return; // stale
      if (data === null) { hideResults(); return; }
      renderResults(data, keyword);
    }, SEARCH_DEBOUNCE_MS);
  });

  // ── Keyboard nav ───────────────────────────────────────────────
  input.addEventListener("keydown", (e) => {
    const items = results.querySelectorAll(".artezo-suggestion-item");
    if (e.key === "ArrowDown") {
      e.preventDefault();
      activeIndex = Math.min(activeIndex + 1, items.length - 1);
      updateActive();
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      activeIndex = Math.max(activeIndex - 1, 0);
      updateActive();
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (activeIndex >= 0 && currentResults[activeIndex]) {
        hideMobileSearch();
        window.__artezoGoProduct(currentResults[activeIndex].productPrimeId);
      }
    } else if (e.key === "Escape") {
      hideMobileSearch();
    }
  });

  // ── Clear results when overlay is hidden ───────────────────────
  // Patch hideMobileSearch to also reset state
  const _origHide = window.hideMobileSearch;
  window.hideMobileSearch = function () {
    hideResults();
    input.value = "";
    lastKeyword = "";
    if (_origHide) _origHide();
  };
}



// ═══════════════════════════════════════════════════════════════
//  HAMBURGER MENU SEARCH  — live search inside mobile side menu
//  Target: #hamburger-search-input / #hamburger-search-results
// ═══════════════════════════════════════════════════════════════
function initHamburgerSearch() {
  const input   = document.getElementById("hamburger-search-input");
  const results = document.getElementById("hamburger-search-results");
  if (!input || !results) return;

  let debounceTimer   = null;
  let lastKeyword     = "";
  let activeIndex     = -1;
  let currentResults  = [];

  function showResults() { results.classList.remove("hidden"); }
  function hideResults() { results.classList.add("hidden"); activeIndex = -1; }

  function updateActive() {
    results.querySelectorAll(".artezo-suggestion-item").forEach((el, i) => {
      el.classList.toggle("is-active", i === activeIndex);
    });
  }

  function renderResults(data, keyword) {
    currentResults = data;
    activeIndex = -1;

    if (!data.length) {
      results.innerHTML = `
        <div class="px-5 py-8 text-center text-sm text-gray-400 font-lexend">
          No products found for <strong class="text-primary">"${keyword}"</strong>
        </div>`;
      showResults();
      return;
    }

    const items = data.map((p, i) => {
      const discount = getDiscountPct(p.currentSellingPrice, p.currentMrpPrice);
      const discBadge = discount
        ? `<span class="ml-1 text-[10px] bg-green-100 text-green-700 font-semibold px-1.5 py-0.5 rounded-full">${discount}% off</span>`
        : "";
      const mrpHtml = (p.currentMrpPrice && p.currentMrpPrice > p.currentSellingPrice)
        ? `<span class="line-through text-gray-400 text-[11px] ml-1">${formatPrice(p.currentMrpPrice)}</span>`
        : "";
      const highlighted = highlightMatch(p.productName, keyword);
      const imageUrl = p.mainImageUrl || `http://localhost:8085/api/products/${p.productPrimeId}/main`;

      return `
        <div class="artezo-suggestion-item flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-zinc-50 transition-colors"
             data-index="${i}"
             onmousedown="event.preventDefault()"
             onclick="closeMobileMenu(); window.__artezoGoProduct(${p.productPrimeId})">
          <div class="w-11 h-11 flex-shrink-0 rounded-xl overflow-hidden border border-gray-100 bg-zinc-50">
            <img src="${imageUrl}" alt="${p.productName}" class="w-full h-full object-cover"
                 onerror="this.style.display='none'" />
          </div>
          <div class="flex-1 min-w-0">
            <p class="text-sm font-lexend text-gray-800 truncate leading-tight">${highlighted}</p>
            ${p.brandName ? `<p class="text-[11px] text-gray-400 mt-0.5">${p.brandName}</p>` : ""}
            <div class="flex items-center mt-0.5 flex-wrap gap-1">
              <span class="text-sm font-semibold text-primary">${formatPrice(p.currentSellingPrice)}</span>
              ${mrpHtml}${discBadge}
            </div>
          </div>
          <i class="fa-solid fa-chevron-right text-[10px] text-gray-300"></i>
        </div>`;
    }).join("");

    results.innerHTML = `
      <style>
        .artezo-hl{background:transparent;color:#E6A62C;font-weight:600;padding:0}
        .artezo-suggestion-item.is-active{background-color:#f4f4f5}
      </style>
      <div class="py-1">${items}</div>`;
    showResults();

    results.querySelectorAll(".artezo-suggestion-item").forEach(el => {
      el.addEventListener("mouseenter", () => {
        activeIndex = parseInt(el.dataset.index, 10);
        updateActive();
      });
    });
  }

  input.addEventListener("input", (e) => {
    const keyword = e.target.value.trim();
    clearTimeout(debounceTimer);

    if (keyword.length < SEARCH_MIN_CHARS) { hideResults(); lastKeyword = ""; return; }
    if (keyword === lastKeyword) return;

    // Loading state
    results.innerHTML = `
      <div class="px-5 py-5 flex items-center justify-center gap-2 text-sm text-gray-400">
        <svg class="animate-spin h-4 w-4 text-accent" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"></path>
        </svg>
        Searching…
      </div>`;
    showResults();

    debounceTimer = setTimeout(async () => {
      lastKeyword = keyword;
      const data = await fetchSearchSuggestions(keyword); // reuses desktop fetch
      if (input.value.trim() !== keyword) return; // stale
      if (data === null) { hideResults(); return; }
      renderResults(data, keyword);
    }, SEARCH_DEBOUNCE_MS);
  });

  input.addEventListener("keydown", (e) => {
    const items = results.querySelectorAll(".artezo-suggestion-item");
    if (!items.length) return;
    if (e.key === "ArrowDown") { e.preventDefault(); activeIndex = Math.min(activeIndex + 1, items.length - 1); updateActive(); }
    else if (e.key === "ArrowUp") { e.preventDefault(); activeIndex = Math.max(activeIndex - 1, 0); updateActive(); }
    else if (e.key === "Enter" && activeIndex >= 0 && currentResults[activeIndex]) {
      e.preventDefault();
      closeMobileMenu();
      window.__artezoGoProduct(currentResults[activeIndex].productPrimeId);
    } else if (e.key === "Escape") { hideResults(); }
  });
}

// Navigation handlers
window.__artezoGoProduct = function (productPrimeId) {
    hideSearchSuggestions();
    window.location.href = `${SEARCH_DETAIL_BASE}?id=${productPrimeId}`;
};

window.__artezoGoSearch = function (keyword) {
    hideSearchSuggestions();
    if (searchInput) searchInput.value = keyword;
    // Redirect to search results page or trigger search
    window.location.href = `${SEARCH_DETAIL_BASE}?search=${encodeURIComponent(keyword)}`;
};

// Initialize after DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initSearchFeature);
} else {
    initSearchFeature();
    // ── Wire mobile search overlay input to same live search ──
    initMobileSearchFeature();
}

