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

function getMobileBannerImages() {
  if (
    window.artezoData &&
    window.artezoData.bannerSlides &&
    window.artezoData.bannerSlides.length > 0
  ) {
    return window.artezoData.bannerSlides.map(
      (slide) => slide.mainImage || slide.smallImage || bannerImages[0],
    );
  }
  return bannerImages;
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
function renderMobileNavigation(categories) {
  const mobileNav = document.querySelector(
    "#mobile-menu .flex-1.overflow-y-auto",
  );
  if (!mobileNav) return;

  const staticMobileGridHTML = `
    <a href="../HomeCategory/homecategory.html?category=Wall+Decor"
       class="flex flex-col items-center text-center group">
      <div class="relative w-full aspect-square bg-[#FFF9E5] rounded-2xl overflow-hidden mb-2 group-hover:shadow-md transition-shadow">
        <img src="https://cdn.shopify.com/s/files/1/0632/2526/6422/files/1_4345985e-c8a5-40af-9a03-0fcf35940ffc.jpg?v=1771484241&width=1728"
             alt="Wall Decor" class="w-full h-full object-cover">
      </div>
      <span class="text-xs font-medium text-gray-700 group-hover:text-accent">Wall Decor</span>
    </a>
    <a href="../HomeCategory/homecategory.html?category=Photo+Frames"
       class="flex flex-col items-center text-center group">
      <div class="relative w-full aspect-square bg-[#FFF9E5] rounded-2xl overflow-hidden mb-2 group-hover:shadow-md transition-shadow">
        <img src="https://cdn.shopify.com/s/files/1/0632/2526/6422/files/ASFRP25405_3.jpg?v=1772760662&width=1728"
             alt="Photo Frames" class="w-full h-full object-cover">
      </div>
      <span class="text-xs font-medium text-gray-700 group-hover:text-accent">Photo Frames</span>
    </a>
    <a href="../HomeCategory/homecategory.html?category=Home+Decor"
       class="flex flex-col items-center text-center group">
      <div class="relative w-full aspect-square bg-[#FFF9E5] rounded-2xl overflow-hidden mb-2 group-hover:shadow-md transition-shadow">
        <img src="https://m.media-amazon.com/images/S/shoppable-media-external-prod-iad-us-east-1/dc96db56-6f71-48d1-b4d5-af22a91e4d60/6b804-0a5f-4946-b7aa-22414c476._AC_._SX1200_SCLZZZZZZZ_.jpeg"
             alt="Home Decor" class="w-full h-full object-cover">
      </div>
      <span class="text-xs font-medium text-gray-700 group-hover:text-accent">Home Decor</span>
    </a>
    <a href="../HomeCategory/homecategory.html?category=Nameplates"
       class="flex flex-col items-center text-center group">
      <div class="relative w-full aspect-square bg-[#FFF9E5] rounded-2xl overflow-hidden mb-2 group-hover:shadow-md transition-shadow">
        <img src="https://picsum.photos/id/237/600/600"
             alt="Nameplates" class="w-full h-full object-cover">
      </div>
      <span class="text-xs font-medium text-gray-700 group-hover:text-accent">Nameplates</span>
    </a>
    <a href="../HomeCategory/homecategory.html?category=Corporate+Gifting"
       class="flex flex-col items-center text-center group">
      <div class="relative w-full aspect-square bg-[#FFF9E5] rounded-2xl overflow-hidden mb-2 group-hover:shadow-md transition-shadow">
        <img src="https://printo-s3.dietpixels.net/site/2025/Joining%20kit/1280/The-Onward-Box_1742898848.jpg?quality=70&format=webp&w=640"
             alt="Corporate Gifting" class="w-full h-full object-cover">
      </div>
      <span class="text-xs font-medium text-gray-700 group-hover:text-accent">Corporate Gifting</span>
    </a>
    <a href="../HomeCategory/homecategory.html?category=Personalised+Gifts"
       class="flex flex-col items-center text-center group">
      <div class="relative w-full aspect-square bg-[#FFF9E5] rounded-2xl overflow-hidden mb-2 group-hover:shadow-md transition-shadow">
        <img src="https://static-assets-prod.fnp.com/images/pr/l/v20240104150045/personalised-photo-magnets_1.jpg"
             alt="Personalised Gifts" class="w-full h-full object-cover">
      </div>
      <span class="text-xs font-medium text-gray-700 group-hover:text-accent">Personalised Gifts</span>
    </a>
  `;

  const mobileBannerImages = getMobileBannerImages();

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
    <div class="mb-6 px-4">
      <div class="relative">
        <input type="text" placeholder="Search for 'pillows'"
               class="w-full h-12 pl-12 pr-4 bg-gray-100 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-accent/50" />
        <div class="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
          <i class="fa-solid fa-magnifying-glass"></i>
        </div>
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
function openMobileMenu() {
  const menu = document.getElementById("mobile-menu");
  if (!menu) return;
  menu.classList.remove("translate-x-full");
  document.body.style.overflow = "hidden";
  showingAllCategories = false;
  renderMobileNavigation();
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
    renderMobileNavigation();
  } catch (err) {
    console.error("Failed to load categories, using fallback");
    renderDesktopNavigation(null);
    renderMobileNavigation();
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

// ─── Global Exports ──────────────────────────────────────────────────────────
window.openMobileMenu = openMobileMenu;
window.closeMobileMenu = closeMobileMenu;
window.showMobileSearch = showMobileSearch;
window.hideMobileSearch = hideMobileSearch;
window.toggleWishlist = toggleWishlist;
window.quickSearch = quickSearch;
window.logout = logout;
window.toggleCartPreview = toggleCartPreview;
window.toggleLoginState = toggleLoginState;
window.handleMobileProfileClick = handleMobileProfileClick; // NEW for mobile top bar Profile icon
// ─── Auto Start ──────────────────────────────────────────────────────────────
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", () => {
    if (!window.headerInitialized) {
      window.headerInitialized = true;
      initializeHeader();
    }
  });
} else {
  if (!window.headerInitialized) {
    window.headerInitialized = true;
    initializeHeader();
  }
}

// // header.js
// let isLoggedIn = true;
// let cartCount = 4;
// let wishlistCount = 3;
// let showingAllCategories = false; // Track if showing all categories

// // Category data - Static JSON for now (will be replaced with API call)
// const categoryData = {
//   navCategories: [
//     {
//       categoryId: 1,
//       productCategory: "Wall Decor",
//       categoryPath: [],
//       productCategoryRedirect: "../HomeCategory/homecategory.html",
//       categoryPathRedirect: "../HomeCategory/homecategory.html",
//     },
//     {
//       categoryId: 2,
//       productCategory: "Photo Frames",
//       categoryPath: [
//         "Wooden Frames",
//         "Metal Frames",
//         "Collage Frames",
//         "Digital Frames",
//       ],
//       productCategoryRedirect: "/Product-Details/product-detail.html",
//       categoryPathRedirect: "/Product-Details/product-detail.html",
//     },
//     {
//       categoryId: 3,
//       productCategory: "Home Decor",
//       categoryPath: ["Vases", "Candles", "Showpieces", "Fountains"],
//       productCategoryRedirect: "#",
//       categoryPathRedirect: "/products/product.html",
//     },
//     {
//       categoryId: 4,
//       productCategory: "Nameplates",
//       categoryPath: [
//         "Wooden Nameplates",
//         "Metal Nameplates",
//         "Acrylic Nameplates",
//       ],
//       productCategoryRedirect: "#",
//       categoryPathRedirect: "/products/product.html",
//     },
//     {
//       categoryId: 5,
//       productCategory: "Corporate Gifting",
//       categoryPath: [
//         "Corporate Awards",
//         "Customized Gifts",
//         "Promotional Items",
//       ],
//       productCategoryRedirect: "#",
//       categoryPathRedirect: "/products/product.html",
//     },
//     {
//       categoryId: 6,
//       productCategory: "Personalised Gifts",
//       categoryPath: ["Photo Gifts", "Custom Name Gifts", "Occasion Special"],
//       productCategoryRedirect: "#",
//       categoryPathRedirect: "/products/product.html",
//     },
//     {
//       categoryId: 7,
//       productCategory: "Trophies and Mementos",
//       categoryPath: ["Sports Trophies", "Corporate Awards", "Custom Mementos"],
//       productCategoryRedirect: "#",
//       categoryPathRedirect: "/products/product.html",
//     },
//     {
//       categoryId: 8,
//       productCategory: "Trending Products",
//       categoryPath: ["Best Sellers", "New Arrivals", "Deals of the Day"],
//       productCategoryRedirect: "#",
//       categoryPathRedirect: "/products/product.html",
//     },
//   ],
// };

// // Quick access links data
// const quickAccessLinks = [
//   {
//     icon: "fa-user",
//     label: "Account",
//     url: "../Profile/profile.html",
//     requiresAuth: true,
//     guestUrl: "#",
//     onClick: function () {
//       if (!isLoggedIn) {
//         alert("Please sign in to view your account");
//         return false;
//       }
//       return true;
//     },
//   },
//   {
//     icon: "fa-box",
//     label: "My Orders",
//     url: "../Myorders/orders.html",
//     requiresAuth: true,
//     guestUrl: "#",
//     onClick: function () {
//       if (!isLoggedIn) {
//         alert("Please sign in to view your orders");
//         return false;
//       }
//       return true;
//     },
//   },
//   {
//     icon: "fa-phone",
//     label: "Contact Us",
//     url: "#",
//     onClick: function () {
//       window.open("https://wa.me/1234567890", "_blank");
//       return false;
//     },
//   },
//   {
//     icon: "fa-info-circle",
//     label: "About Us",
//     url: "/about.html",
//     onClick: function () {
//       return true;
//     },
//   },
// ];

// // Category images mapping
// const categoryImages = {
//   "Wall Decor":
//     "https://cdn.shopify.com/s/files/1/0632/2526/6422/files/1_4345985e-c8a5-40af-9a03-0fcf35940ffc.jpg?v=1771484241&width=1728",
//   "Photo Frames":
//     "https://cdn.shopify.com/s/files/1/0632/2526/6422/files/ASFRP25405_3.jpg?v=1772760662&width=1728",
//   "Home Decor":
//     "https://m.media-amazon.com/images/S/shoppable-media-external-prod-iad-us-east-1/dc96db56-6f71-48d1-b4d5-af22a91e4d60/6b804-0a5f-4946-b7aa-22414c476._AC_._SX1200_SCLZZZZZZZ_.jpeg",
//   Nameplates:
//     "https://housenama.com/cdn/shop/files/veli-red-2.jpg?v=1766609828&width=1100",
//   "Corporate Gifting":
//     "https://printo-s3.dietpixels.net/site/2025/Joining%20kit/1280/The-Onward-Box_1742898848.jpg?quality=70&format=webp&w=640",
//   "Personalised Gifts":
//     "https://static-assets-prod.fnp.com/images/pr/l/v20240104150045/personalised-photo-magnets_1.jpg",
//   "Trophies and Mementos":
//     "https://trophycreator.in/img/diamond-trophy-supplier-in-India-hm.jpg",
//   "Trending Products":
//     "https://m.media-amazon.com/images/S/influencer-profile-image-prod/logo/influencer-0c420a42_1630818633966_original._CR396%2C159%2C289%2C289_._US500_SCLZZZZZZZ_.jpeg",
// };

// // Banner images for carousel
// const bannerImages = [
//   "https://t3.ftcdn.net/jpg/05/07/79/68/360_F_507796863_XOctjfN6VIiHa79bFj7GCg92P9TpELIe.jpg",
//   "https://edit.org/editor/json/2022/01/07/2/c/2cb92d9336336c43f39a4567288ac342.webp",
//   "https://www.shutterstock.com/shutterstock/photos/2477506075/display_1500/stock-vector-banner-design-with-cozy-sofa-armchair-chair-interior-decor-elements-interior-design-home-decor-2477506075.jpg",
// ];

// // Fallback static menu
// const fallbackCategories = [
//   "Photo Frames",
//   "Wall Decor",
//   "Home Decor",
//   "Nameplates",
//   "Corporate Gifting",
//   "Personalised Gifts",
//   "Trophies and Mementos",
//   "Trending Products",
// ];

// // Function to fetch categories from API
// async function fetchCategories({ retries = 3, retryDelay = 1000 } = {}) {
//   for (let attempt = 1; attempt <= retries; attempt++) {
//     try {
//       const controller = new AbortController();
//       const timeoutId = setTimeout(() => controller.abort(), 5000); // 5s timeout

//       const response = await fetch(
//         "http://localhost:8085/api/v1/custom-categories/get-all-categories",
//         {
//           method: "GET",
//           headers: { "Content-Type": "application/json" },
//           signal: controller.signal,
//         }
//       );

//       clearTimeout(timeoutId);

//       if (!response.ok) throw new Error(`HTTP error: ${response.status}`);

//       const data = await response.json();
//       const approvedCategories = data.filter((cat) => cat.approved === true);

//       if (!approvedCategories || approvedCategories.length === 0) {
//         throw new Error("Empty categories response");
//       }

//       return approvedCategories; // ✅ Success
//     } catch (error) {
//       const isLastAttempt = attempt === retries;
//       console.warn(`fetchCategories attempt ${attempt} failed:`, error.message);

//       if (!isLastAttempt) {
//         await new Promise((res) => setTimeout(res, retryDelay * attempt)); // exponential backoff
//         continue;
//       }

//       // ✅ All retries exhausted — use fallback and trigger UI update
//       console.error("All retries failed. Using fallback categories.");
//       const fallback = categoryData.navCategories;
//       renderCategories(fallback); // 👈 explicitly re-render with fallback
//       return fallback;
//     }
//   }
// }

// // Function to render desktop navigation
// function renderDesktopNavigation(categories) {
//   const navContainer = document.querySelector(".md\\:block nav");
//   if (!navContainer) return;

//   if (!categories || categories.length === 0) {
//     navContainer.innerHTML = fallbackCategories
//       .map(
//         (cat) =>
//           `<a href="#" class="hover:text-accent transition-colors whitespace-nowrap">${cat}</a>`,
//       )
//       .join("");
//     return;
//   }

//   let navHTML = "";

//   categories.forEach((category) => {
//     const hasSubcategories =
//       category.categoryPath && category.categoryPath.length > 0;

//     if (hasSubcategories) {
//       navHTML += `
//         <div class="relative group">
//           <a href="${category.productCategoryRedirect || "#"}"
//              class="hover:text-accent transition-colors whitespace-nowrap inline-flex items-center gap-1">
//             ${category.productCategory}
//             <i class="fa-solid fa-chevron-down text-[10px] group-hover:rotate-180 transition-transform"></i>
//           </a>
//           <div class="absolute left-0 top-full invisible group-hover:visible opacity-0 group-hover:opacity-100 transition-all duration-200 z-50">
//             <div class="bg-white rounded-lg shadow-xl border border-gray-100 py-4 flex ${
//               category.categoryPath.length <= 4
//                 ? "flex-col gap-1 min-w-[200px]"
//                 : "gap-3 min-w-[480px]"
//             }">
//               ${
//                 category.categoryPath.length <= 4
//                   ? category.categoryPath
//                       .map(
//                         (subcat) => `
//                         <a href="${category.categoryPathRedirect || "#"}"
//                            class="flex items-center gap-2 px-5 py-2 text-sm hover:bg-zinc-50 hover:text-accent transition-colors">
//                           <i class="fa-solid fa-tag text-[#E39F32] w-4"></i>
//                           <span>${subcat}</span>
//                         </a>
//                       `,
//                       )
//                       .join("")
//                   : (() => {
//                       const mid = Math.ceil(category.categoryPath.length / 2);
//                       const left = category.categoryPath.slice(0, mid);
//                       const right = category.categoryPath.slice(mid);

//                       const createColumn = (items) =>
//                         items
//                           .map(
//                             (subcat) => `
//                               <a href="${category.categoryPathRedirect || "#"}"
//                                  class="flex items-center gap-2 px-5 py-2.5 text-sm hover:bg-zinc-50 hover:text-accent transition-colors">
//                                 <i class="fa-solid fa-tag text-[#E39F32] w-4"></i>
//                                 <span>${subcat}</span>
//                               </a>
//                             `,
//                           )
//                           .join("");

//                       return `
//                         <div class="flex-1 flex flex-col gap-1">${createColumn(left)}</div>
//                         <div class="w-px bg-gray-200"></div>
//                         <div class="flex-1 flex flex-col gap-1">${createColumn(right)}</div>
//                       `;
//                     })()
//               }
//             </div>
//           </div>
//         </div>
//       `;
//     } else {
//       navHTML += `
//         <a href="${category.productCategoryRedirect || "#"}"
//            class="hover:text-accent transition-colors whitespace-nowrap">
//           ${category.productCategory}
//         </a>
//       `;
//     }
//   });

//   navContainer.innerHTML = navHTML;
// }

// // Function to render quick access links
// function renderQuickAccessLinks() {
//   const quickAccessHTML = quickAccessLinks
//     .map((link) => {
//       const url =
//         link.requiresAuth && !isLoggedIn ? link.guestUrl || "#" : link.url;
//       const iconClass = link.icon;

//       return `
//       <a href="${url}"
//          class="quick-access-link flex flex-col items-center gap-2 p-3 bg-gray-50 rounded-xl hover:bg-accent/10 transition-colors group"
//          data-label="${link.label}"
//          onclick="return handleQuickAccessClick(event, '${link.label}')">
//         <i class="fa-solid ${iconClass} text-xl text-primary group-hover:text-accent"></i>
//         <span class="text-xs font-medium text-gray-700 group-hover:text-accent">${link.label}</span>
//       </a>
//     `;
//     })
//     .join("");

//   return `
//     <!-- Quick Access Section -->
//     <div class="mt-8 pt-4">
//       <h3 class="text-sm font-semibold text-gray-500 mb-4 px-4">QUICK ACCESS</h3>
//       <div class="grid grid-cols-4 gap-2 px-4">
//         ${quickAccessHTML}
//       </div>
//     </div>
//   `;
// }

// // Handle quick access link clicks
// window.handleQuickAccessClick = function (event, label) {
//   const link = quickAccessLinks.find((l) => l.label === label);
//   if (link && link.onClick) {
//     return link.onClick();
//   }
//   return true;
// };

// // Function to toggle view all categories - FIXED VERSION
// function toggleViewAllCategoriesFromMenu() {
//   console.log(
//     "Toggle view all categories clicked. Current state:",
//     showingAllCategories,
//   );

//   // Toggle the state
//   showingAllCategories = !showingAllCategories;
//   console.log("New state:", showingAllCategories);

//   // Fetch categories and re-render
//   fetchCategories()
//     .then((categories) => {
//       if (!categories || categories.length === 0) {
//         categories = fallbackCategories.map((cat) => ({
//           productCategory: cat,
//           productCategoryRedirect: "#",
//         }));
//       }
//       renderMobileNavigation(categories);
//     })
//     .catch((error) => {
//       console.error("Error fetching categories:", error);
//       // Fallback to static categories
//       const fallback = fallbackCategories.map((cat) => ({
//         productCategory: cat,
//         productCategoryRedirect: "#",
//       }));
//       renderMobileNavigation(fallback);
//     });
// }

// // Function to render mobile navigation - Updated with view all functionality and quick access
// function renderMobileNavigation(categories) {
//   const mobileNav = document.querySelector(
//     "#mobile-menu .flex-1.overflow-y-auto",
//   );
//   if (!mobileNav) {
//     console.log("Mobile nav container not found");
//     return;
//   }

//   console.log("Rendering mobile navigation with categories:", categories);
//   console.log("Showing all categories:", showingAllCategories);

//   if (!categories || categories.length === 0) {
//     categories = fallbackCategories.map((cat) => ({
//       productCategory: cat,
//       productCategoryRedirect: "#",
//     }));
//   }

//   // Determine which categories to show
//   const categoriesToShow = showingAllCategories
//     ? categories
//     : categories.slice(0, 6);

//   // Create categories grid HTML with images
//   let categoriesGridHTML = "";

//   categoriesToShow.forEach((category) => {
//     const categoryName =
//       typeof category === "string" ? category : category.productCategory;
//     const categoryLink =
//       typeof category === "string"
//         ? "#"
//         : category.productCategoryRedirect || "#";
//     const imageUrl = categoryImages[categoryName] || categoryImages["default"];

//     categoriesGridHTML += `
//       <a href="${categoryLink}" class="flex flex-col items-center text-center group">
//         <div class="w-full aspect-square bg-[#FFF9E5] rounded-2xl overflow-hidden mb-2 group-hover:shadow-md transition-shadow">
//           <img src="${imageUrl}"
//                alt="${categoryName}"
//                class="w-full h-full object-cover">
//         </div>
//         <span class="text-xs font-medium text-gray-700 group-hover:text-accent">${categoryName}</span>
//       </a>
//     `;
//   });

//   // Create carousel HTML
//   const carouselHTML = `
//     <!-- Banner Carousel Section -->
//     <div class="mt-8">
//       <div class="relative">
//         <!-- Carousel Container -->
//         <div id="banner-carousel" class="overflow-hidden rounded-xl">
//           <div id="carousel-track" class="flex transition-transform duration-500 ease-in-out">
//             ${bannerImages
//               .map(
//                 (img, index) => `
//               <div class="w-full flex-shrink-0 px-1">
//                 <img src="${img}"
//                      alt="Banner ${index + 1}"
//                      class="w-full h-32 object-cover rounded-xl">
//               </div>
//             `,
//               )
//               .join("")}
//           </div>
//         </div>

//         <!-- Navigation Dots -->
//         <div class="flex justify-center gap-2 mt-4">
//           ${bannerImages
//             .map(
//               (_, index) => `
//             <button class="carousel-dot w-2 h-2 rounded-full bg-gray-300 transition-colors" data-index="${index}"></button>
//           `,
//             )
//             .join("")}
//         </div>
//       </div>
//     </div>
//   `;

//   // Get quick access HTML
//   const quickAccessHTML = renderQuickAccessLinks();

//   // Complete mobile navigation HTML - FIXED BUTTON WITH ONCLICK
//   const mobileNavHTML = `
//     <!-- Search Bar inside menu -->
//     <div class="mb-6 px-4">
//       <div class="relative">
//         <input type="text"
//             placeholder="Search for 'pillows'"
//             class="w-full h-12 pl-12 pr-4 bg-gray-100 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-accent/50" />
//         <div class="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
//           <i class="fa-solid fa-magnifying-glass"></i>
//         </div>
//       </div>
//     </div>

//     <!-- All Categories Title -->
//     <div class="mb-4 px-4">
//       <h2 class="text-lg font-semibold text-gray-900">All Categories</h2>
//     </div>

//     <!-- Categories Grid -->
//     <div class="grid grid-cols-3 gap-4 px-4">
//       ${categoriesGridHTML}
//     </div>

//     <!-- View All Categories Link - FIXED BUTTON -->
//     <div class="mt-6 text-center">
//       <a href="javascript:void(0);" onclick="toggleViewAllCategoriesFromMenu(); return false;" class="view-all-categories-btn inline-flex items-center gap-2 text-accent font-medium hover:gap-3 transition-all cursor-pointer">
//         <span>${showingAllCategories ? "Show Less Categories" : "View All Categories"}</span>
//         <i class="fa-solid ${showingAllCategories ? "fa-arrow-up" : "fa-arrow-right"} text-sm"></i>
//       </a>
//     </div>

//     ${carouselHTML}
//     ${quickAccessHTML}
//   `;

//   mobileNav.innerHTML = mobileNavHTML;

//   // Reinitialize carousel after rendering
//   setTimeout(initBannerCarousel, 100);
// }

// // Banner Carousel Functionality
// function initBannerCarousel() {
//   const track = document.getElementById("carousel-track");
//   const dots = document.querySelectorAll(".carousel-dot");

//   if (!track || dots.length === 0) return;

//   let currentIndex = 0;
//   const totalSlides = dots.length;
//   let autoplayInterval;
//   let touchStartX = 0;
//   let touchEndX = 0;

//   // Function to update carousel position
//   function updateCarousel(index) {
//     index = (index + totalSlides) % totalSlides;

//     track.style.transform = `translateX(-${index * 100}%)`;

//     dots.forEach((dot, i) => {
//       if (i === index) {
//         dot.classList.remove("bg-gray-300");
//         dot.classList.add("bg-accent");
//       } else {
//         dot.classList.remove("bg-accent");
//         dot.classList.add("bg-gray-300");
//       }
//     });

//     currentIndex = index;
//   }

//   // Function to go to next slide
//   function nextSlide() {
//     updateCarousel(currentIndex + 1);
//   }

//   // Add click handlers to dots
//   dots.forEach((dot) => {
//     dot.addEventListener("click", () => {
//       const index = parseInt(dot.getAttribute("data-index"));
//       updateCarousel(index);
//       resetAutoplay();
//     });
//   });

//   // Autoplay functions
//   function startAutoplay() {
//     stopAutoplay();
//     autoplayInterval = setInterval(nextSlide, 3000);
//   }

//   function stopAutoplay() {
//     if (autoplayInterval) {
//       clearInterval(autoplayInterval);
//     }
//   }

//   function resetAutoplay() {
//     stopAutoplay();
//     startAutoplay();
//   }

//   // Touch events for mobile swipe
//   track.addEventListener("touchstart", (e) => {
//     touchStartX = e.changedTouches[0].screenX;
//     stopAutoplay();
//   });

//   track.addEventListener("touchend", (e) => {
//     touchEndX = e.changedTouches[0].screenX;
//     const diff = touchStartX - touchEndX;

//     if (Math.abs(diff) > 50) {
//       if (diff > 0) {
//         updateCarousel(currentIndex + 1);
//       } else {
//         updateCarousel(currentIndex - 1);
//       }
//     }

//     startAutoplay();
//   });

//   // Pause on hover
//   track.addEventListener("mouseenter", stopAutoplay);
//   track.addEventListener("mouseleave", startAutoplay);

//   // Initialize
//   updateCarousel(0);
//   startAutoplay();

//   // Clean up on menu close
//   const closeBtn = document.getElementById("close-menu-btn");
//   if (closeBtn) {
//     closeBtn.addEventListener("click", stopAutoplay);
//   }
// }

// // Initialize categories
// async function initializeCategories() {
//   try {
//     const categories = await fetchCategories();
//     renderDesktopNavigation(categories);
//     renderMobileNavigation(categories);
//   } catch (error) {
//     console.error("Failed to load categories:", error);
//     renderDesktopNavigation(null);
//     renderMobileNavigation(null);
//   }
// }

// function initTypingAnimation() {
//   const phrases = [
//     "Search for photoframes…",
//     "Search for curtains…",
//     "Search for home decor…",
//     "Search for deals…",
//     "Search for new arrivals…",
//   ];

//   let phraseIndex = 0;
//   let charIndex = 0;
//   let isDeleting = false;
//   let timeout;

//   const input = document.getElementById("search-input");
//   if (!input) return;

//   function type() {
//     const currentPhrase = phrases[phraseIndex];

//     if (isDeleting) {
//       input.placeholder = currentPhrase.substring(0, charIndex - 1);
//       charIndex--;
//     } else {
//       input.placeholder = currentPhrase.substring(0, charIndex + 1);
//       charIndex++;
//     }

//     if (!isDeleting && charIndex === currentPhrase.length) {
//       isDeleting = true;
//       timeout = setTimeout(type, 1800);
//       return;
//     }

//     if (isDeleting && charIndex === 0) {
//       isDeleting = false;
//       phraseIndex = (phraseIndex + 1) % phrases.length;
//       timeout = setTimeout(type, 400);
//       return;
//     }

//     const speed = isDeleting ? 35 : 65;
//     timeout = setTimeout(type, speed);
//   }

//   input.addEventListener("focus", () => {
//     clearTimeout(timeout);
//     input.placeholder = "What are you looking for?";
//   });

//   input.addEventListener("blur", () => {
//     if (input.value === "") {
//       charIndex = 0;
//       type();
//     }
//   });

//   type();
// }

// function renderAccountDropdown() {
//   const dropdown = document.getElementById("account-dropdown");
//   const avatarContainer = document.getElementById("account-avatar");
//   const nameEl = document.getElementById("account-name-mobile");

//   if (!dropdown || !avatarContainer) return;

//   dropdown.innerHTML = "";

//   if (isLoggedIn) {
//     dropdown.innerHTML = `
//       <div class="px-6 py-6 border-b">
//         <div class="flex gap-4">
//           <img src="https://picsum.photos/id/64/64"
//                class="w-14 h-14 rounded-2xl object-cover ring-2 ring-accent/30">
//           <div class="flex-1">
//             <div class="font-semibold text-xl">Shreya Sharma</div>
//             <div class="text-gray-500 text-sm">shreya.pune@gmail.com</div>
//           </div>
//         </div>
//       </div>

//       <div class="py-2">
//         <a href="../Profile/profile.html" class="flex items-center gap-x-4 px-7 py-4 hover:bg-zinc-50 text-sm">
//           <i class="fa-solid fa-user w-5 text-gray-400"></i>
//           <span>My Profile</span>
//         </a>
//         <a href="../Myorders/orders.html" class="flex items-center gap-x-4 px-7 py-4 hover:bg-zinc-50 text-sm">
//           <i class="fa-solid fa-box w-5 text-gray-400"></i>
//           <span>My Orders</span>
//         </a>
//         <a href="../Wishlist/wishlist.html" class="flex items-center gap-x-4 px-7 py-4 hover:bg-zinc-50 text-sm">
//           <i class="fa-solid fa-heart w-5 text-gray-400"></i>
//           <span>Wishlist</span>
//         </a>
//       </div>

//       <div class="border-t mx-4 my-2"></div>

//    <a href="../Auth/auth-modal.html"
//    class="w-full text-left flex items-center gap-x-4 px-7 py-4 text-red-600 hover:bg-red-50 text-sm">
//   <i class="fa-solid fa-arrow-right-from-bracket"></i>
//   <span>Logout</span>
// </a>
//     `;

//     if (avatarContainer) {
//       avatarContainer.innerHTML = `<img src="https://picsum.photos/id/64/32" class="w-full h-full object-cover">`;
//     }
//     if (nameEl) nameEl.textContent = "Shreya";
//   } else {
//     dropdown.innerHTML = `
//       <div class="p-8 space-y-4">
//         <button onclick="login()"
//                 class="w-full py-4 bg-primary hover:bg-primary/90 text-white rounded-3xl font-semibold transition-colors">
//           Sign In
//         </button>
//         <button onclick="signup()"
//                 class="w-full py-4 border border-primary text-primary rounded-3xl font-semibold">
//           Create New Account
//         </button>

//         <div class="pt-6 text-center space-y-4 text-sm">
//           <a href="#" class="block text-gray-600 hover:text-primary">Track Your Order</a>
//           <a href="#" class="block text-gray-600 hover:text-primary">Need Help?</a>
//         </div>
//       </div>
//     `;

//     if (avatarContainer) {
//       avatarContainer.innerHTML = `<i class="fa-solid fa-user text-2xl"></i>`;
//     }
//     if (nameEl) nameEl.textContent = "";
//   }
// }

// function toggleAccountDropdown() {
//   const dd = document.getElementById("account-dropdown");
//   if (dd) {
//     dd.classList.toggle("hidden");
//   }
//   const searchSuggestions = document.getElementById("search-suggestions");
//   if (searchSuggestions) {
//     searchSuggestions.classList.add("hidden");
//   }
// }

// function toggleWishlist() {
//   wishlistCount = wishlistCount === 3 ? 4 : 3;
//   const wishlistEl = document.getElementById("wishlist-count");
//   const mobileWishlistEl = document.getElementById("mobile-wishlist-count");

//   if (wishlistEl) wishlistEl.textContent = wishlistCount;
//   if (mobileWishlistEl) mobileWishlistEl.textContent = wishlistCount;

//   alert("❤️ Added to Wishlist (demo)");
// }

// function quickSearch(el) {
//   const term = el.textContent.trim();
//   const searchInput = document.getElementById("search-input");
//   if (searchInput) {
//     searchInput.value = term;
//   }
//   const suggestions = document.getElementById("search-suggestions");
//   if (suggestions) {
//     suggestions.classList.add("hidden");
//   }
//   setTimeout(() => {
//     alert(`🔍 Searching for "${term}"... (demo)`);
//   }, 300);
// }

// function clearRecentSearches() {
//   const list = document.getElementById("recent-list");
//   if (list) {
//     list.innerHTML =
//       '<div class="text-gray-400 text-sm py-8 text-center">No recent searches</div>';
//   }
// }

// function login() {
//   isLoggedIn = true;
//   renderAccountDropdown();
//   // Re-render mobile navigation to update quick access links
//   fetchCategories().then((categories) => {
//     if (!categories || categories.length === 0) {
//       categories = fallbackCategories.map((cat) => ({
//         productCategory: cat,
//         productCategoryRedirect: "#",
//       }));
//     }
//     renderMobileNavigation(categories);
//   });
//   const dropdown = document.getElementById("account-dropdown");
//   if (dropdown) dropdown.classList.remove("hidden");
// }

// function signup() {
//   alert("Redirecting to signup page... (demo)");
// }

// function logout() {
//   isLoggedIn = false;
//   renderAccountDropdown();
//   // Re-render mobile navigation to update quick access links
//   fetchCategories().then((categories) => {
//     if (!categories || categories.length === 0) {
//       categories = fallbackCategories.map((cat) => ({
//         productCategory: cat,
//         productCategoryRedirect: "#",
//       }));
//     }
//     renderMobileNavigation(categories);
//   });
//   const dropdown = document.getElementById("account-dropdown");
//   if (dropdown) dropdown.classList.add("hidden");
// }

// function toggleLoginState() {
//   isLoggedIn = !isLoggedIn;
//   renderAccountDropdown();
//   // Re-render mobile navigation to update quick access links
//   fetchCategories().then((categories) => {
//     if (!categories || categories.length === 0) {
//       categories = fallbackCategories.map((cat) => ({
//         productCategory: cat,
//         productCategoryRedirect: "#",
//       }));
//     }
//     renderMobileNavigation(categories);
//   });
//   alert(isLoggedIn ? "✅ Logged in as Shreya" : "👋 Logged out");
// }

// // Mobile Menu Controls
// function openMobileMenu() {
//   console.log("Opening mobile menu");
//   const mobileMenu = document.getElementById("mobile-menu");
//   if (mobileMenu) {
//     mobileMenu.classList.remove("translate-x-full");
//     document.body.style.overflow = "hidden";
//     // Reset view to show first 6 categories when menu opens
//     showingAllCategories = false;
//     // Re-render with current categories
//     fetchCategories().then((categories) => {
//       if (!categories || categories.length === 0) {
//         categories = fallbackCategories.map((cat) => ({
//           productCategory: cat,
//           productCategoryRedirect: "#",
//         }));
//       }
//       renderMobileNavigation(categories);
//     });
//     // Initialize carousel when menu opens
//     setTimeout(initBannerCarousel, 100);
//   } else {
//     console.error("Mobile menu element not found!");
//   }
// }

// function closeMobileMenu() {
//   console.log("Closing mobile menu");
//   const mobileMenu = document.getElementById("mobile-menu");
//   if (mobileMenu) {
//     mobileMenu.classList.add("translate-x-full");
//     document.body.style.overflow = "";
//   }
// }

// function showMobileSearch() {
//   const overlay = document.getElementById("mobile-search-overlay");
//   if (overlay) {
//     overlay.classList.remove("hidden");
//     const input = document.getElementById("mobile-search-input");
//     if (input) input.focus();
//   }
// }

// function hideMobileSearch() {
//   const overlay = document.getElementById("mobile-search-overlay");
//   if (overlay) {
//     overlay.classList.add("hidden");
//   }
// }

// // Initialize mobile menu event listeners
// function initMobileMenu() {
//   console.log("Initializing mobile menu...");

//   const hamburgerBtn = document.getElementById("hamburger-btn");
//   if (hamburgerBtn) {
//     hamburgerBtn.removeEventListener("click", openMobileMenu);
//     hamburgerBtn.addEventListener("click", function (e) {
//       e.preventDefault();
//       e.stopPropagation();
//       openMobileMenu();
//     });
//   }

//   const closeMenuBtn = document.getElementById("close-menu-btn");
//   if (closeMenuBtn) {
//     closeMenuBtn.removeEventListener("click", closeMobileMenu);
//     closeMenuBtn.addEventListener("click", function (e) {
//       e.preventDefault();
//       e.stopPropagation();
//       closeMobileMenu();
//     });
//   }

//   const mobileSearchBtn = document.getElementById("mobile-search-btn");
//   if (mobileSearchBtn) {
//     mobileSearchBtn.addEventListener("click", function (e) {
//       e.preventDefault();
//       showMobileSearch();
//     });
//   }

//   const closeSearchBtn = document.querySelector(
//     "#mobile-search-overlay button",
//   );
//   if (closeSearchBtn) {
//     closeSearchBtn.addEventListener("click", hideMobileSearch);
//   }

//   const mobileMenu = document.getElementById("mobile-menu");
//   if (mobileMenu) {
//     mobileMenu.addEventListener("click", function (e) {
//       if (e.target === mobileMenu) {
//         closeMobileMenu();
//       }
//     });
//   }

//   // Fallback click handler for view all categories button
//   document.addEventListener("click", function (e) {
//     const viewAllBtn = e.target.closest(".view-all-categories-btn");
//     if (viewAllBtn) {
//       e.preventDefault();
//       console.log("View all categories clicked via delegation");
//       toggleViewAllCategoriesFromMenu();
//     }
//   });
// }

// // Click outside handlers
// function handleClickOutside(e) {
//   const accountWrapper = document.getElementById("account-wrapper");
//   if (accountWrapper && !accountWrapper.contains(e.target)) {
//     const dropdown = document.getElementById("account-dropdown");
//     if (dropdown) dropdown.classList.add("hidden");
//   }

//   const searchContainer = document.getElementById("desktop-search-container");
//   if (searchContainer && !searchContainer.contains(e.target)) {
//     const suggestions = document.getElementById("search-suggestions");
//     if (suggestions) suggestions.classList.add("hidden");
//   }
// }

// // Typing animation for navbar
// const typingData = [
//   { icon: "fa-store", text: "Welcome to Artezo Store" },
//   { icon: "fa-couch", text: "Elevate Your Home Decor" },
//   { icon: "fa-image", text: "Crafted for Every Space" },
//   { icon: "fa-gift", text: "Create a Home You Love" },
// ];

// let textIndex = 0;
// let charIndex = 0;
// let isDeleting = false;
// let typingTimeout;

// function typeEffect() {
//   const typingTextEl = document.getElementById("typing-text");
//   const typingIconEl = document.getElementById("typing-icon");

//   if (!typingTextEl || !typingIconEl) return;

//   const currentItem = typingData[textIndex];

//   if (charIndex === 0 || (isDeleting === false && charIndex === 1)) {
//     typingIconEl.innerHTML = `<i class="fa-solid ${currentItem.icon} mr-2"></i>`;
//   }

//   const currentText = currentItem.text;

//   if (isDeleting) {
//     typingTextEl.textContent = currentText.substring(0, charIndex - 1);
//     charIndex--;
//   } else {
//     typingTextEl.textContent = currentText.substring(0, charIndex + 1);
//     charIndex++;
//   }

//   let speed = isDeleting ? 40 : 100;

//   if (!isDeleting && charIndex === currentText.length) {
//     speed = 2000;
//     isDeleting = true;
//   } else if (isDeleting && charIndex === 0) {
//     isDeleting = false;
//     textIndex = (textIndex + 1) % typingData.length;
//     speed = 500;
//   }

//   clearTimeout(typingTimeout);
//   typingTimeout = setTimeout(typeEffect, speed);
// }

// // Main initialization function
// async function initializeHeader() {
//   console.log("Initializing header...");

//   await initializeCategories();
//   initTypingAnimation();

//   setTimeout(() => {
//     typeEffect();
//   }, 100);

//   renderAccountDropdown();

//   const searchInput = document.getElementById("search-input");
//   if (searchInput) {
//     searchInput.addEventListener("focus", () => {
//       const suggestions = document.getElementById("search-suggestions");
//       if (suggestions) suggestions.classList.remove("hidden");
//     });
//   }

//   initMobileMenu();

//   const cartBtn = document.getElementById("cart-btn");
//   if (cartBtn) {
//     cartBtn.addEventListener("click", toggleCartPreview);
//   }

//   const mobileCartBtn = document.getElementById("mobile-cart-btn");
//   if (mobileCartBtn) {
//     mobileCartBtn.addEventListener("click", toggleCartPreview);
//   }

//   const accountBtn = document.getElementById("account-btn");
//   if (accountBtn) {
//     accountBtn.addEventListener("click", toggleAccountDropdown);
//   }

//   document.addEventListener("click", handleClickOutside);

//   const recentHTML = `
//     <div onclick="quickSearch(this)" class="px-4 py-3 hover:bg-zinc-50 border rounded-full cursor-pointer flex justify-between font-lexend font-normal text-sm">
//       <span>Photoframes</span>
//     </div>
//     <div onclick="quickSearch(this)" class="px-4 py-3 hover:bg-zinc-50 border rounded-full cursor-pointer flex justify-between font-lexend font-normal text-sm">
//       <span>curtains</span>
//     </div>
//     <div onclick="quickSearch(this)" class="px-4 py-3 hover:bg-zinc-50 border rounded-full cursor-pointer flex justify-between font-lexend font-normal text-sm">
//       <span>wall paintings</span>
//     </div>
//   `;

//   const recentList = document.getElementById("recent-list");
//   if (recentList) {
//     recentList.innerHTML = recentHTML;
//   }

//   console.log(
//     "%c Artezo Store Header initialized successfully",
//     "color:#E39F32; font-weight:600",
//   );
// }

// // Make functions globally available
// window.openMobileMenu = openMobileMenu;
// window.closeMobileMenu = closeMobileMenu;
// window.showMobileSearch = showMobileSearch;
// window.hideMobileSearch = hideMobileSearch;
// window.toggleWishlist = toggleWishlist;
// window.quickSearch = quickSearch;
// window.clearRecentSearches = clearRecentSearches;
// window.login = login;
// window.signup = signup;
// window.logout = logout;
// window.toggleLoginState = toggleLoginState;
// window.toggleViewAllCategoriesFromMenu = toggleViewAllCategoriesFromMenu;

// // Auto start when page loads
// if (document.readyState === "loading") {
//   document.addEventListener("DOMContentLoaded", initializeHeader);
// } else {
//   initializeHeader();
// }
