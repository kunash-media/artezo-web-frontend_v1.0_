// header.js
let isLoggedIn = true;
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
      categoryPathRedirect: "../HomeCategory/homecategory.html",
      trendingMark: false
    },
    {
      categoryId: 2,
      productCategory: "Photo Frames",
      categoryPath: ["Wooden Frames", "Metal Frames", "Collage Frames", "Digital Frames"],
      productCategoryRedirect: "/Product-Details/product-detail.html",
      categoryPathRedirect: "/Product-Details/product-detail.html",
      trendingMark: false
    },
    {
      categoryId: 3,
      productCategory: "Home Decor",
      categoryPath: ["Vases", "Candles", "Showpieces", "Fountains"],
      productCategoryRedirect: "#",
      categoryPathRedirect: "/products/product.html",
      trendingMark: false
    },
    {
      categoryId: 4,
      productCategory: "Nameplates",
      categoryPath: ["Wooden Nameplates", "Metal Nameplates", "Acrylic Nameplates"],
      productCategoryRedirect: "#",
      categoryPathRedirect: "/products/product.html",
      trendingMark: false
    },
    {
      categoryId: 5,
      productCategory: "Corporate Gifting",
      categoryPath: ["Corporate Awards", "Customized Gifts", "Promotional Items"],
      productCategoryRedirect: "#",
      categoryPathRedirect: "/products/product.html",
      trendingMark: false
    },
    {
      categoryId: 6,
      productCategory: "Personalised Gifts",
      categoryPath: ["Photo Gifts", "Custom Name Gifts", "Occasion Special"],
      productCategoryRedirect: "#",
      categoryPathRedirect: "/products/product.html",
      trendingMark: false
    },
    {
      categoryId: 7,
      productCategory: "Trophies and Mementos",
      categoryPath: ["Sports Trophies", "Corporate Awards", "Custom Mementos"],
      productCategoryRedirect: "#",
      categoryPathRedirect: "/products/product.html",
      trendingMark: false
    },
    {
      categoryId: 8,
      productCategory: "Trending Products",
      categoryPath: ["Best Sellers", "New Arrivals", "Deals of the Day"],
      productCategoryRedirect: "#",
      categoryPathRedirect: "/products/product.html",
      trendingMark: true
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
      if (!isLoggedIn) { alert("Please sign in to view your account"); return false; }
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
      if (!isLoggedIn) { alert("Please sign in to view your orders"); return false; }
      return true;
    },
  },
  {
    icon: "fa-phone",
    label: "Contact Us",
    url: "#",
    onClick: function () { window.open("https://wa.me/1234567890", "_blank"); return false; },
  },
  {
    icon: "fa-info-circle",
    label: "About Us",
    url: "/about.html",
    onClick: function () { return true; },
  },
];

// ─── Category Images ─────────────────────────────────────────────────────────
const categoryImages = {
  "Wall Decor": "https://cdn.shopify.com/s/files/1/0632/2526/6422/files/1_4345985e-c8a5-40af-9a03-0fcf35940ffc.jpg?v=1771484241&width=1728",
  "Photo Frames": "https://cdn.shopify.com/s/files/1/0632/2526/6422/files/ASFRP25405_3.jpg?v=1772760662&width=1728",
  "Home Decor": "https://m.media-amazon.com/images/S/shoppable-media-external-prod-iad-us-east-1/dc96db56-6f71-48d1-b4d5-af22a91e4d60/6b804-0a5f-4946-b7aa-22414c476._AC_._SX1200_SCLZZZZZZZ_.jpeg",
  "Nameplates": "data:image/webp;base64,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",
  "Corporate Gifting": "https://printo-s3.dietpixels.net/site/2025/Joining%20kit/1280/The-Onward-Box_1742898848.jpg?quality=70&format=webp&w=640",
  "Personalised Gifts": "https://static-assets-prod.fnp.com/images/pr/l/v20240104150045/personalised-photo-magnets_1.jpg",
  "Trophies and Mementos": "https://trophycreator.in/img/diamond-trophy-supplier-in-India-hm.jpg",
  "Trending Products": "https://picsum.photos/id/870/600/600",
  "abc": "https://picsum.photos/id/870/600/600",   // for your API test category
};

// AFTER
// ─── Banner Images ───────────────────────────────────────────────────────────
// Old static array kept for safety/fallback (will be overridden when data is available)
const bannerImages = [
  "https://picsum.photos/id/1015/800/300",
  "https://picsum.photos/id/106/800/300",
  "https://picsum.photos/id/201/800/300",
];

// NEW: Helper to extract FIRST banner from each hero slide (mainImage preferred)
function getMobileBannerImages() {
  if (window.artezoData && window.artezoData.bannerSlides && window.artezoData.bannerSlides.length > 0) {
    return window.artezoData.bannerSlides.map(slide => slide.mainImage || slide.smallImage || bannerImages[0]);
  }
  return bannerImages; // fallback to old static images if data not loaded yet
}
// comment: Reuses exact same data source as desktop hero. Takes only the first (main) banner per slide for mobile consistency. Safe fallback prevents blank banners.


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

        const response = await fetch("http://localhost:8085/api/v1/custom-categories/get-all-categories", {
          method: "GET",
          headers: { "Content-Type": "application/json" },
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (!response.ok) throw new Error(`HTTP error: ${response.status}`);

        const data = await response.json();
        const approvedCategories = data.filter((cat) => cat.approved === true);

        if (!approvedCategories || approvedCategories.length === 0) throw new Error("Empty response");

        return approvedCategories;
      } catch (error) {
        console.warn(`Category fetch attempt ${attempt} failed:`, error.message);
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
    const hasSubcategories = category.categoryPath && category.categoryPath.length > 0;
    const badge = (category.trendingMark === true || category.trending === true) ? ` ${trendingBadgeHTML()}` : "";

    if (hasSubcategories) {
      navHTML += `
        <div class="relative group">
          <a href="${category.productCategoryRedirect || "#"}" class="hover:text-accent transition-colors whitespace-nowrap inline-flex items-center gap-1">
            ${category.productCategory}${badge}
            <i class="fa-solid fa-chevron-down text-[10px] group-hover:rotate-180 transition-transform"></i>
          </a>
          <div class="absolute left-0 top-full invisible group-hover:visible opacity-0 group-hover:opacity-100 transition-all duration-200 z-50">
            <div class="bg-white rounded-lg shadow-xl border border-gray-100 py-4 flex ${category.categoryPath.length <= 4 ? "flex-col gap-1 min-w-[200px]" : "gap-3 min-w-[480px]"}">
              ${category.categoryPath.length <= 4 
                ? category.categoryPath.map((subcat) => `
                    <a href="${category.categoryPathRedirect || "#"}" class="flex items-center gap-2 px-5 py-2 text-sm hover:bg-zinc-50 hover:text-accent transition-colors">
                      <i class="fa-solid fa-tag text-[#E39F32] w-4"></i><span>${subcat}</span>
                    </a>`).join("")
                : (() => {
                    const mid = Math.ceil(category.categoryPath.length / 2);
                    const left = category.categoryPath.slice(0, mid);
                    const right = category.categoryPath.slice(mid);
                    return `
                      <div class="flex-1 flex flex-col gap-1">${left.map((subcat) => `
                        <a href="${category.categoryPathRedirect || "#"}" class="flex items-center gap-2 px-5 py-2.5 text-sm hover:bg-zinc-50 hover:text-accent transition-colors">
                          <i class="fa-solid fa-tag text-[#E39F32] w-4"></i><span>${subcat}</span>
                        </a>`).join("")}</div>
                      <div class="w-px bg-gray-200"></div>
                      <div class="flex-1 flex flex-col gap-1">${right.map((subcat) => `
                        <a href="${category.categoryPathRedirect || "#"}" class="flex items-center gap-2 px-5 py-2.5 text-sm hover:bg-zinc-50 hover:text-accent transition-colors">
                          <i class="fa-solid fa-tag text-[#E39F32] w-4"></i><span>${subcat}</span>
                        </a>`).join("")}</div>`;
                  })()
              }
            </div>
          </div>
        </div>`;
    } else {
      navHTML += `
        <a href="${category.productCategoryRedirect || "#"}" class="hover:text-accent transition-colors whitespace-nowrap inline-flex items-center gap-1">
          ${category.productCategory}${badge}
        </a>`;
    }
  });

  navContainer.innerHTML = navHTML;
}

// ─── Quick Access ────────────────────────────────────────────────────────────
function renderQuickAccessLinks() {
  const html = quickAccessLinks.map(link => {
    const url = link.requiresAuth && !isLoggedIn ? link.guestUrl || "#" : link.url;
    return `
      <a href="${url}" class="quick-access-link flex flex-col items-center gap-2 p-3 bg-gray-50 rounded-xl hover:bg-accent/10 transition-colors group"
         data-label="${link.label}" onclick="return handleQuickAccessClick(event, '${link.label}')">
        <i class="fa-solid ${link.icon} text-xl text-primary group-hover:text-accent"></i>
        <span class="text-xs font-medium text-gray-700 group-hover:text-accent">${link.label}</span>
      </a>`;
  }).join("");

  return `
    <div class="mt-8 pt-4">
      <h3 class="text-sm font-semibold text-gray-500 mb-4 px-4">QUICK ACCESS</h3>
      <div class="grid grid-cols-4 gap-2 px-4">${html}</div>
    </div>`;
}

window.handleQuickAccessClick = function (event, label) {
  const link = quickAccessLinks.find(l => l.label === label);
  if (link && link.onClick) return link.onClick();
  return true;
};

// ─── Mobile Navigation - After Update  ───────────────────────────────────────────────────────
function renderMobileNavigation(categories) {
  const mobileNav = document.querySelector("#mobile-menu .flex-1.overflow-y-auto");
  if (!mobileNav) return;

  // STATIC CATEGORIES FOR MOBILE - Hardcoded HTML
  // This replaces the dynamic grid. Desktop remains unaffected.
  const staticMobileGridHTML = `
    <a href="../HomeCategory/homecategory.html" class="flex flex-col items-center text-center group">
      <div class="relative w-full aspect-square bg-[#FFF9E5] rounded-2xl overflow-hidden mb-2 group-hover:shadow-md transition-shadow">
        <img src="https://cdn.shopify.com/s/files/1/0632/2526/6422/files/1_4345985e-c8a5-40af-9a03-0fcf35940ffc.jpg?v=1771484241&width=1728" 
             alt="Wall Decor" class="w-full h-full object-cover">
      </div>
      <span class="text-xs font-medium text-gray-700 group-hover:text-accent">Wall Decor</span>
    </a>

    <a href="/Product-Details/product-detail.html" class="flex flex-col items-center text-center group">
      <div class="relative w-full aspect-square bg-[#FFF9E5] rounded-2xl overflow-hidden mb-2 group-hover:shadow-md transition-shadow">
        <img src="https://cdn.shopify.com/s/files/1/0632/2526/6422/files/ASFRP25405_3.jpg?v=1772760662&width=1728" 
             alt="Photo Frames" class="w-full h-full object-cover">
      </div>
      <span class="text-xs font-medium text-gray-700 group-hover:text-accent">Photo Frames</span>
    </a>

    <a href="#" class="flex flex-col items-center text-center group">
      <div class="relative w-full aspect-square bg-[#FFF9E5] rounded-2xl overflow-hidden mb-2 group-hover:shadow-md transition-shadow">
        <img src="https://m.media-amazon.com/images/S/shoppable-media-external-prod-iad-us-east-1/dc96db56-6f71-48d1-b4d5-af22a91e4d60/6b804-0a5f-4946-b7aa-22414c476._AC_._SX1200_SCLZZZZZZZ_.jpeg" 
             alt="Home Decor" class="w-full h-full object-cover">
      </div>
      <span class="text-xs font-medium text-gray-700 group-hover:text-accent">Home Decor</span>
    </a>

    <a href="#" class="flex flex-col items-center text-center group">
      <div class="relative w-full aspect-square bg-[#FFF9E5] rounded-2xl overflow-hidden mb-2 group-hover:shadow-md transition-shadow">
        <img src="https://picsum.photos/id/237/600/600" 
             alt="Nameplates" class="w-full h-full object-cover">
      </div>
      <span class="text-xs font-medium text-gray-700 group-hover:text-accent">Nameplates</span>
    </a>

    <a href="#" class="flex flex-col items-center text-center group">
      <div class="relative w-full aspect-square bg-[#FFF9E5] rounded-2xl overflow-hidden mb-2 group-hover:shadow-md transition-shadow">
        <img src="https://printo-s3.dietpixels.net/site/2025/Joining%20kit/1280/The-Onward-Box_1742898848.jpg?quality=70&format=webp&w=640" 
             alt="Corporate Gifting" class="w-full h-full object-cover">
      </div>
      <span class="text-xs font-medium text-gray-700 group-hover:text-accent">Corporate Gifting</span>
    </a>

    <a href="#" class="flex flex-col items-center text-center group">
      <div class="relative w-full aspect-square bg-[#FFF9E5] rounded-2xl overflow-hidden mb-2 group-hover:shadow-md transition-shadow">
        <img src="https://static-assets-prod.fnp.com/images/pr/l/v20240104150045/personalised-photo-magnets_1.jpg" 
             alt="Personalised Gifts" class="w-full h-full object-cover">
      </div>
      <span class="text-xs font-medium text-gray-700 group-hover:text-accent">Personalised Gifts</span>
    </a>
  `;

  // AFTER (inside renderMobileNavigation)
  // Use shared hero data - only first banner from each slide
  const mobileBannerImages = getMobileBannerImages();

  const carouselHTML = `
    <div class="mt-8">
      <div class="relative">
        <div id="banner-carousel" class="overflow-hidden rounded-xl">
          <div id="carousel-track" class="flex transition-transform duration-500 ease-in-out">
            ${mobileBannerImages.map((img, i) => `
              <div class="w-full flex-shrink-0 px-1">
                <img src="${img}" alt="Banner ${i+1}" class="w-full h-32 object-cover rounded-xl">
              </div>`).join("")}
          </div>
        </div>
        <div class="flex justify-center gap-2 mt-4">
          ${mobileBannerImages.map((_, i) => `<button class="carousel-dot w-2 h-2 rounded-full bg-gray-300 transition-colors" data-index="${i}"></button>`).join("")}
        </div>
      </div>
    </div>`;
  // comment: Now pulls from the same artezoData.bannerSlides as desktop hero. Uses only mainImage (first banner) per slide. Keeps exact same carousel structure and initBannerCarousel() call. No impact on desktop or other features.


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

    <!-- STATIC CATEGORIES GRID FOR MOBILE -->
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

  dots.forEach(dot => dot.addEventListener("click", () => {
    updateCarousel(parseInt(dot.dataset.index));
    resetAutoplay();
  }));

  const startAutoplay = () => { 
    stopAutoplay(); 
    autoplayInterval = setInterval(() => updateCarousel(currentIndex + 1), 3000); 
  };
  const stopAutoplay = () => { if (autoplayInterval) clearInterval(autoplayInterval); };
  const resetAutoplay = () => { stopAutoplay(); startAutoplay(); };

  track.addEventListener("touchstart", e => {
    touchStartX = e.changedTouches[0].screenX;
    stopAutoplay();
  });

  track.addEventListener("touchend", e => {
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
  document.querySelectorAll("#cart-count, #mobile-cart-count").forEach(el => {
    if (el) el.textContent = cartCount;
  });
  alert(`🛒 Cart updated! You have ${cartCount} items (demo)`);
}

// ─── Account Dropdown ────────────────────────────────────────────────────────
function renderAccountDropdown() {
  const dropdown = document.getElementById("account-dropdown");
  const avatar = document.getElementById("account-avatar");
  const nameEl = document.getElementById("account-name-mobile");

  if (!dropdown || !avatar) return;

  if (isLoggedIn) {
    dropdown.innerHTML = `
      <div class="px-6 py-6 border-b">
        <div class="flex gap-4">
          <img src="https://picsum.photos/id/64/64" class="w-14 h-14 rounded-2xl object-cover ring-2 ring-accent/30">
          <div class="flex-1">
            <div class="font-semibold text-xl">Shreya Sharma</div>
            <div class="text-gray-500 text-sm">shreya.pune@gmail.com</div>
          </div>
        </div>
      </div>
      <div class="py-2">
        <a href="../Profile/profile.html" class="flex items-center gap-x-4 px-7 py-4 hover:bg-zinc-50 text-sm"><i class="fa-solid fa-user w-5 text-gray-400"></i><span>My Profile</span></a>
        <a href="../Myorders/orders.html" class="flex items-center gap-x-4 px-7 py-4 hover:bg-zinc-50 text-sm"><i class="fa-solid fa-box w-5 text-gray-400"></i><span>My Orders</span></a>
        <a href="../Wishlist/wishlist.html" class="flex items-center gap-x-4 px-7 py-4 hover:bg-zinc-50 text-sm"><i class="fa-solid fa-heart w-5 text-gray-400"></i><span>Wishlist</span></a>
      </div>
      <div class="border-t mx-4 my-2"></div>
      <a href="#" onclick="logout(); return false;" class="w-full text-left flex items-center gap-x-4 px-7 py-4 text-red-600 hover:bg-red-50 text-sm">
        <i class="fa-solid fa-arrow-right-from-bracket"></i><span>Logout</span>
      </a>`;
    avatar.innerHTML = `<img src="https://picsum.photos/id/64/32" class="w-full h-full object-cover">`;
    if (nameEl) nameEl.textContent = "Shreya";
  } else {
    dropdown.innerHTML = `
      <div class="p-8 space-y-4">
        <button onclick="login()" class="w-full py-4 bg-primary hover:bg-primary/90 text-white rounded-3xl font-semibold">Sign In</button>
        <button onclick="signup()" class="w-full py-4 border border-primary text-primary rounded-3xl font-semibold">Create New Account</button>
      </div>`;
    avatar.innerHTML = `<i class="fa-solid fa-user text-2xl"></i>`;
    if (nameEl) nameEl.textContent = "";
  }
}

function toggleAccountDropdown() {
  document.getElementById("account-dropdown")?.classList.toggle("hidden");
  document.getElementById("search-suggestions")?.classList.add("hidden");
}

// ─── Auth Helpers ────────────────────────────────────────────────────────────
// AFTER
function _afterAuthChange() {
  renderAccountDropdown();
  // Mobile is static now → only update account dropdown
  // No need to re-render mobile categories on login/logout
}
function login() { 
  isLoggedIn = true;  
  _afterAuthChange(); 
  document.getElementById("account-dropdown")?.classList.remove("hidden"); 
}

function signup() { 
  alert("Redirecting to signup page... (demo)"); 
}

function logout() { 
  isLoggedIn = false; 
  _afterAuthChange(); 
  document.getElementById("account-dropdown")?.classList.add("hidden"); 
}

// ─── Wishlist ────────────────────────────────────────────────────────────────
function toggleWishlist() {
  wishlistCount = wishlistCount === 3 ? 4 : 3;
  const els = document.querySelectorAll("#wishlist-count, #mobile-wishlist-count");
  els.forEach(el => { if (el) el.textContent = wishlistCount; });
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
// AFTER
function openMobileMenu() {
  const menu = document.getElementById("mobile-menu");
  if (!menu) return;
  menu.classList.remove("translate-x-full");
  document.body.style.overflow = "hidden";
  showingAllCategories = false;
  
  // Safe call - getMobileBannerImages handles missing data gracefully
  renderMobileNavigation();
  // comment: No change to logic. The helper in Change 1 ensures banners load correctly even if artezoData arrives slightly late (common on homepage → menu open).
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

function initMobileMenu() {
  document.getElementById("hamburger-btn")?.addEventListener("click", (e) => {
    e.preventDefault(); e.stopPropagation(); openMobileMenu();
  });

  document.getElementById("close-menu-btn")?.addEventListener("click", (e) => {
    e.preventDefault(); e.stopPropagation(); closeMobileMenu();
  });

  document.getElementById("mobile-search-btn")?.addEventListener("click", (e) => {
    e.preventDefault(); showMobileSearch();
  });

  document.querySelector("#mobile-search-overlay button")?.addEventListener("click", hideMobileSearch);

  document.getElementById("mobile-menu")?.addEventListener("click", (e) => {
    if (e.target.id === "mobile-menu") closeMobileMenu();
  });
}

// ─── Click Outside ───────────────────────────────────────────────────────────
function handleClickOutside(e) {
  if (!document.getElementById("account-wrapper")?.contains(e.target)) {
    document.getElementById("account-dropdown")?.classList.add("hidden");
  }
  if (!document.getElementById("desktop-search-container")?.contains(e.target)) {
    document.getElementById("search-suggestions")?.classList.add("hidden");
  }
}

// ─── Initialize Categories ───────────────────────────────────────────────────
// AFTER
async function initializeCategories() {
  try {
    const categories = await fetchCategories();
    renderDesktopNavigation(categories);
    // Mobile categories are now static → do not pass categories or call renderMobileNavigation here
    renderMobileNavigation();   // call without argument (uses static HTML)
  } catch (err) {
    console.error("Failed to load categories, using fallback");
    renderDesktopNavigation(null);
    renderMobileNavigation();   // still render static mobile
  }
}

// ─── Typing Animation ────────────────────────────────────────────────────────
function initTypingAnimation() {
  const phrases = [
    "Search for photoframes…",
    "Search for curtains…",
    "Search for home decor…",
    "Search for deals…",
    "Search for new arrivals…"
  ];
  let phraseIndex = 0, charIndex = 0, isDeleting = false, timeout;
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
    if (input.value === "") { charIndex = 0; type(); }
  });

  type();
}


// ───────Typing animation for navbar ──────────────────────────────────────────────
const typingData = [
  { icon: "fa-store", text: "Welcome to Artezo Store" },
  { icon: "fa-couch", text: "Elevate Your Home Decor" },
  { icon: "fa-image", text: "Crafted for Every Space" },
  { icon: "fa-gift", text: "Create a Home You Love" },
];

let textIndex = 0;
let charIndex = 0;
let isDeleting = false;
let typingTimeout;

// AFTER - update
function typeEffect() {
  const typingTextEl = document.getElementById("typing-text");
  const typingIconEl = document.getElementById("typing-icon");

  if (!typingTextEl || !typingIconEl) {
    console.warn("Typing elements missing - skipping animation");
    return;
  }

  const currentItem = typingData[textIndex];

  // Update icon only when starting a new phrase
  if (charIndex === 0) {
    typingIconEl.innerHTML = `<i class="fa-solid ${currentItem.icon} mr-2"></i>`;
  }

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
    speed = 2000;        // pause at end of phrase
    isDeleting = true;
  } else if (isDeleting && charIndex === 0) {
    isDeleting = false;
    textIndex = (textIndex + 1) % typingData.length;
    speed = 600;
  }

  clearTimeout(typingTimeout);
  typingTimeout = setTimeout(typeEffect, speed);
}

// NEW FUNCTION - Add this right after the typeEffect() function
function initTypingAnimationForTopBar() {
  const typingTextEl = document.getElementById("typing-text");
  const typingIconEl = document.getElementById("typing-icon");

  if (!typingTextEl || !typingIconEl) {
    console.warn("Typing elements not found in DOM");
    return;
  }

  // Reset state in case of re-init
  textIndex = 0;
  charIndex = 0;
  isDeleting = false;

  // Start the animation
  typeEffect();

  // Optional: Pause when user hovers over the bar
  const topBar = document.querySelector(".bg-primary.font-zain");
  if (topBar) {
    topBar.addEventListener("mouseenter", () => {
      clearTimeout(typingTimeout);
    });
    topBar.addEventListener("mouseleave", () => {
      typeEffect();
    });
  }
}


// ─── Main Header Initialization ──────────────────────────────────────────────
async function initializeHeader() {
  console.log("Initializing header...");

  injectTrendingStyles();   // ← Important: Inject styles first

// AFTER- update categories initialization to use the new cached fetch function
await initializeCategories();

// === FIXED TYPING ANIMATION ===
initTypingAnimationForTopBar();   // ← New wrapper to call the correct function
renderAccountDropdown();
initMobileMenu();

  document.getElementById("cart-btn")?.addEventListener("click", toggleCartPreview);
  document.getElementById("mobile-cart-btn")?.addEventListener("click", toggleCartPreview);
  document.getElementById("account-btn")?.addEventListener("click", toggleAccountDropdown);
  document.addEventListener("click", handleClickOutside);

  // AFTER - update recent searches (demo static data for now)
const recentList = document.getElementById("recent-list");
if (recentList) {
  recentList.innerHTML = ["Photoframes", "curtains", "wall paintings"].map(term => `
    <div onclick="quickSearch(this)" class="px-4 py-3 hover:bg-zinc-50 border rounded-full cursor-pointer flex justify-between font-lexend font-normal text-sm">
      <span>${term}</span>
    </div>`).join("");
}

// === NEW CODE: Add this right after the recentList block ===
const searchInput = document.getElementById("search-input");
const searchSuggestions = document.getElementById("search-suggestions");
const desktopSearchContainer = document.getElementById("desktop-search-container");

if (searchInput && searchSuggestions) {
  // Show dropdown on focus or when user starts typing
  function showSearchDropdown() {
    searchSuggestions.classList.remove("hidden");
  }

  // Hide when clicking outside (already partially there, but ensure it works)
  searchInput.addEventListener("focus", showSearchDropdown);
  searchInput.addEventListener("input", () => {
    if (searchInput.value.trim().length > 0) {
      showSearchDropdown();
    }
  });

  // Optional: Hide on Escape key
  searchInput.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      searchSuggestions.classList.add("hidden");
    }
  });
}

  console.log("%c ✅ Artezo Store Header initialized successfully", "color:#E39F32; font-weight:600");
}

// ─── Global Exports ──────────────────────────────────────────────────────────
window.openMobileMenu = openMobileMenu;
window.closeMobileMenu = closeMobileMenu;
window.showMobileSearch = showMobileSearch;
window.hideMobileSearch = hideMobileSearch;
window.toggleWishlist = toggleWishlist;
window.quickSearch = quickSearch;
window.login = login;
window.signup = signup;
window.logout = logout;
window.toggleViewAllCategoriesFromMenu = toggleViewAllCategoriesFromMenu;
window.toggleCartPreview = toggleCartPreview;

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
