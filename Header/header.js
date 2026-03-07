// header.js
let isLoggedIn = true;
let cartCount = 4;
let wishlistCount = 3;

// Category data - Static JSON for now (will be replaced with API call)
const categoryData = {
  navCategories: [
    {
      categoryId: 1,
      productCategory: "Photo Frames",
      categoryPath: [
        "Wooden Frames",
        "Metal Frames",
        "Collage Frames",
        "Digital Frames",
        "Wooden Frames",
        "Metal Frames",
        "Collage Frames",
        "Digital Frames",
      ],
      productCategoryRedirect: "/Product-Details/product-detail.html",
      categoryPathRedirect: "/Product-Details/product-detail.html",
    },
    {
      categoryId: 2,
      productCategory: "Wall Decor",
      categoryPath: [
        "Wall Paintings",
        "Wall Shelves",
        "Wall Clocks",
        "Mirrors",
      ],
      productCategoryRedirect: "Product-Details/product-detail.html",
      categoryPathRedirect: "Product-Details/product-detail.html",
    },
    {
      categoryId: 3,
      productCategory: "Home Decor",
      categoryPath: ["Vases", "Candles", "Showpieces", "Fountains"],
      productCategoryRedirect: "#",
      categoryPathRedirect: "/products/product.html",
    },
    {
      categoryId: 4,
      productCategory: "Nameplates",
      categoryPath: [
        "Wooden Nameplates",
        "Metal Nameplates",
        "Acrylic Nameplates",
      ],
      productCategoryRedirect: "#",
      categoryPathRedirect: "/products/product.html",
    },
    {
      categoryId: 5,
      productCategory: "Corporate Gifting",
      categoryPath: [
        "Corporate Awards",
        "Customized Gifts",
        "Promotional Items",
      ],
      productCategoryRedirect: "#",
      categoryPathRedirect: "/products/product.html",
    },
    {
      categoryId: 6,
      productCategory: "Personalised Gifts",
      categoryPath: ["Photo Gifts", "Custom Name Gifts", "Occasion Special"],
      productCategoryRedirect: "#",
      categoryPathRedirect: "/products/product.html",
    },
    {
      categoryId: 7,
      productCategory: "Trophies and Mementos",
      categoryPath: ["Sports Trophies", "Corporate Awards", "Custom Mementos"],
      productCategoryRedirect: "#",
      categoryPathRedirect: "/products/product.html",
    },
    {
      categoryId: 8,
      productCategory: "Trending Products",
      categoryPath: ["Best Sellers", "New Arrivals", "Deals of the Day"],
      productCategoryRedirect: "#",
      categoryPathRedirect: "/products/product.html",
    },
  ],
};

// Fallback static menu (your existing structure)
const fallbackCategories = [
  "Photo Frames",
  "Wall Decor",
  "Home Decor",
  "Nameplates",
  "Corporate Gifting",
  "Personalised Gifts",
  "Trophies and Mementos",
  "Trending Products",
];

// Function to fetch categories (simulated API call)
async function fetchCategories() {
  try {
    // Simulate API call - replace with actual fetch when ready
    // const response = await fetch('/api/categories');
    // const data = await response.json();

    // Using static data for now
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve(categoryData.navCategories);
      }, 100); // Simulate network delay
    });
  } catch (error) {
    console.error("Error fetching categories:", error);
    return null;
  }
}

// Function to render desktop navigation
function renderDesktopNavigation(categories) {
  const navContainer = document.querySelector(".md\\:block nav");
  if (!navContainer) return;

  if (!categories || categories.length === 0) {
    // Fallback to static menu
    navContainer.innerHTML = fallbackCategories
      .map(
        (cat) =>
          `<a href="#" class="hover:text-accent transition-colors whitespace-nowrap">${cat}</a>`,
      )
      .join("");
    return;
  }

  // Create dropdown structure for desktop
  let navHTML = "";

  categories.forEach((category) => {
    const hasSubcategories =
      category.categoryPath && category.categoryPath.length > 0;

    if (hasSubcategories) {
      // Create dropdown item
      navHTML += `
        <div class="relative group">
          <a href="${category.productCategoryRedirect || "#"}" 
             class="hover:text-accent transition-colors whitespace-nowrap inline-flex items-center gap-1">
            ${category.productCategory}
            <i class="fa-solid fa-chevron-down text-[10px] group-hover:rotate-180 transition-transform"></i>
          </a>
          <!-- Dropdown menu -->
        <div class="absolute left-0 top-full invisible group-hover:visible opacity-0 group-hover:opacity-100 transition-all duration-200 z-50">
  <div class="bg-white rounded-lg shadow-xl border border-gray-100 py-4 flex ${
    category.categoryPath.length <= 4
      ? "flex-col gap-1 min-w-[200px]"
      : "gap-3 min-w-[480px]"
  }">
    ${
      category.categoryPath.length <= 4
        ? category.categoryPath
            .map(
              (subcat) => `
      <a href="${category.categoryPathRedirect || "#"}"
         class="flex items-center gap-2 px-5 py-2 text-sm hover:bg-zinc-50 hover:text-accent transition-colors">
<i class="fa-solid fa-tag text-[#E39F32] w-4"></i>       <span>${subcat}</span>
      </a>
    `,
            )
            .join("")
        : (() => {
            const mid = Math.ceil(category.categoryPath.length / 2);
            const left = category.categoryPath.slice(0, mid);
            const right = category.categoryPath.slice(mid);

            const createColumn = (items) =>
              items
                .map(
                  (subcat) => `
        <a href="${category.categoryPathRedirect || "#"}"
           class="flex items-center gap-2 px-5 py-2.5 text-sm hover:bg-zinc-50 hover:text-accent transition-colors">
<i class="fa-solid fa-tag text-[#E39F32] w-4"></i>          <span>${subcat}</span>
        </a>
      `,
                )
                .join("");

            return `
      <div class="flex-1 flex flex-col gap-1">${createColumn(left)}</div>
      <div class="w-px bg-gray-200"></div>
      <div class="flex-1 flex flex-col gap-1">${createColumn(right)}</div>
    `;
          })()
    }
  </div>
</div>
</div>
        </div>
      `;
    } else {
      // Simple link without dropdown
      navHTML += `
        <a href="${category.productCategoryRedirect || "#"}" 
           class="hover:text-accent transition-colors whitespace-nowrap">
          ${category.productCategory}
        </a>
      `;
    }
  });

  navContainer.innerHTML = navHTML;
}

// Function to render mobile navigation
function renderMobileNavigation(categories) {
  const mobileNav = document.querySelector("#mobile-menu nav");
  if (!mobileNav) return;

  if (!categories || categories.length === 0) {
    // Fallback to static menu (already in HTML, so we can leave it)
    return;
  }

  let mobileNavHTML = "";

  categories.forEach((category) => {
    const hasSubcategories =
      category.categoryPath && category.categoryPath.length > 0;

    if (hasSubcategories) {
      // Create collapsible section for mobile
      mobileNavHTML += `
        <div class="mobile-category-group">
          <button class="mobile-category-toggle w-full flex items-center justify-between gap-3 py-3 px-3 rounded-full bg-[#FFFDF1] hover:bg-[#ffeab3] transition-colors">
            <span class="flex items-center gap-3">
              <span class="material-symbols-outlined text-2xl" style="color:#e39f32;">category</span>
              <span class="font-lexend font-medium">${category.productCategory}</span>
            </span>
            <i class="fa-solid fa-chevron-down text-sm text-gray-400 transition-transform"></i>
          </button>
          <div class="mobile-subcategories hidden pl-12 mt-1 space-y-1">
            ${category.categoryPath
              .map(
                (subcat) => `
              <a href="${category.categoryPathRedirect || "#"}" 
                 class="block py-2 px-3 text-sm text-gray-600 hover:text-accent hover:bg-[#FFFDF1] rounded-full transition-colors">
                ${subcat}
              </a>
            `,
              )
              .join("")}
          </div>
        </div>
      `;
    } else {
      mobileNavHTML += `
        <a href="${category.productCategoryRedirect || "#"}" 
           class="flex items-center gap-3 py-3 px-3 rounded-full bg-[#FFFDF1] hover:bg-[#ffeab3] transition-colors">
          <span class="material-symbols-outlined text-2xl" style="color:#e39f32;">category</span>
          <span class="font-lexend font-medium">${category.productCategory}</span>
        </a>
      `;
    }
  });

  // Add divider and return/exchange link
  mobileNavHTML += `
    <div class="my-2 border-t border-gray-100"></div>
    <a href="#"
       class="flex items-center gap-3 py-3 px-3 rounded-full bg-[#FFFDF1] border-b border-gray-100 text-red-600 font-semibold hover:bg-[#ffeab3] hover:text-red-700 transition-colors">
      <span class="material-symbols-outlined text-2xl" style="color:#e39f32;">replay</span>
      Return/Exchange
    </a>
  `;

  mobileNav.innerHTML = mobileNavHTML;

  // Add event listeners for mobile dropdowns
  document.querySelectorAll(".mobile-category-toggle").forEach((button) => {
    button.addEventListener("click", function () {
      const subcategories = this.nextElementSibling;
      const icon = this.querySelector(".fa-chevron-down");

      subcategories.classList.toggle("hidden");
      icon.classList.toggle("rotate-180");
    });
  });
}

// Initialize categories
async function initializeCategories() {
  try {
    const categories = await fetchCategories();
    renderDesktopNavigation(categories);
    renderMobileNavigation(categories);
  } catch (error) {
    console.error("Failed to load categories:", error);
    // Fallback to static menu
    renderDesktopNavigation(null);
    renderMobileNavigation(null);
  }
}

function initTypingAnimation() {
  const phrases = [
    "Search for photoframes…",
    "Search for curtains…",
    "Search for home decor…",
    "Search for deals…",
    "Search for new arrivals…",
  ];

  let phraseIndex = 0;
  let charIndex = 0;
  let isDeleting = false;
  let timeout;

  const input = document.getElementById("search-input");

  function type() {
    const currentPhrase = phrases[phraseIndex];

    if (isDeleting) {
      input.placeholder = currentPhrase.substring(0, charIndex - 1);
      charIndex--;
    } else {
      input.placeholder = currentPhrase.substring(0, charIndex + 1);
      charIndex++;
    }

    if (!isDeleting && charIndex === currentPhrase.length) {
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

    const speed = isDeleting ? 35 : 65;
    timeout = setTimeout(type, speed);
  }

  // Pause typing when focused
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

function renderAccountDropdown() {
  const dropdown = document.getElementById("account-dropdown");
  const avatarContainer = document.getElementById("account-avatar");
  const nameEl = document.getElementById("account-name-mobile");

  dropdown.innerHTML = "";

  if (isLoggedIn) {
    // Logged In View
    dropdown.innerHTML = `
            <div class="px-6 py-6 border-b">
                <div class="flex gap-4">
                    <img src="https://picsum.photos/id/64/64" 
                         class="w-14 h-14 rounded-2xl object-cover ring-2 ring-accent/30">
                    <div class="flex-1">
                        <div class="font-semibold text-xl">Shreya Sharma</div>
                        <div class="text-gray-500 text-sm">shreya.pune@gmail.com</div>
                    </div>
                </div>
            </div>
            
            <div class="py-2">
                <a href="#" class="flex items-center gap-x-4 px-7 py-4 hover:bg-zinc-50 text-sm">
                    <i class="fa-solid fa-user w-5 text-gray-400"></i>
                    <span>My Profile</span>
                </a>
                <a href="#" class="flex items-center gap-x-4 px-7 py-4 hover:bg-zinc-50 text-sm">
                    <i class="fa-solid fa-box w-5 text-gray-400"></i>
                    <span>My Orders</span>
                </a>
                <a href="#" class="flex items-center gap-x-4 px-7 py-4 hover:bg-zinc-50 text-sm">
                    <i class="fa-solid fa-heart w-5 text-gray-400"></i>
                    <span>Wishlist</span>
                </a>
                <a href="#" class="flex items-center gap-x-4 px-7 py-4 hover:bg-zinc-50 text-sm">
                    <i class="fa-solid fa-map-marker-alt w-5 text-gray-400"></i>
                    <span>Addresses</span>
                </a>
                <a href="#" class="flex items-center gap-x-4 px-7 py-4 hover:bg-zinc-50 text-sm">
                    <i class="fa-solid fa-bell w-5 text-gray-400"></i>
                    <span>Notifications</span>
                </a>
            </div>
            
            <div class="border-t mx-4 my-2"></div>
            
            <button onclick="logout()" 
                    class="w-full text-left flex items-center gap-x-4 px-7 py-4 text-red-600 hover:bg-red-50 text-sm">
                <i class="fa-solid fa-arrow-right-from-bracket"></i>
                <span>Logout</span>
            </button>
        `;

    avatarContainer.innerHTML = `<img src="https://picsum.photos/id/64/32" class="w-full h-full object-cover">`;
    nameEl.textContent = "Shreya";
  } else {
    // Logged Out View
    dropdown.innerHTML = `
            <div class="p-8 space-y-4">
                <button onclick="login()" 
                        class="w-full py-4 bg-primary hover:bg-primary/90 text-white rounded-3xl font-semibold transition-colors">
                    Sign In
                </button>
                <button onclick="signup()" 
                        class="w-full py-4 border border-primary text-primary rounded-3xl font-semibold">
                    Create New Account
                </button>
                
                <div class="pt-6 text-center space-y-4 text-sm">
                    <a href="#" class="block text-gray-600 hover:text-primary">Track Your Order</a>
                    <a href="#" class="block text-gray-600 hover:text-primary">Need Help?</a>
                </div>
            </div>
        `;

    avatarContainer.innerHTML = `<i class="fa-solid fa-user text-2xl"></i>`;
    nameEl.textContent = "";
  }
}

function toggleAccountDropdown() {
  const dd = document.getElementById("account-dropdown");
  dd.classList.toggle("hidden");

  // Close other dropdowns
  document.getElementById("search-suggestions").classList.add("hidden");
  document.getElementById("categories-dropdown").classList.add("hidden");
}

function toggleCategoriesDropdown() {
  const dd = document.getElementById("categories-dropdown");
  dd.classList.toggle("hidden");
}

function toggleCartPreview() {
  // Create cart preview on the fly if not exists
  let preview = document.getElementById("cart-preview");
  if (!preview) {
    preview = document.createElement("div");
    preview.id = "cart-preview";
    preview.className = `absolute right-0 top-16 w-96 bg-white rounded-3xl shadow-2xl border border-gray-100 p-6 z-50 hidden`;
    preview.innerHTML = `
            <div class="font-semibold text-lg mb-6 flex justify-between">
                <span>Your Cart</span>
                <span class="text-accent text-sm font-normal">${cartCount} items</span>
            </div>
            
            <div class="space-y-6 max-h-96 overflow-auto">
                <!-- Item 1 -->
                <div class="flex gap-4">
                    <img src="https://picsum.photos/id/201/80/80" class="w-20 h-20 object-cover rounded-2xl">
                    <div class="flex-1">
                        <div class="font-medium leading-tight">Photoframes</div>
                        <div class="text-accent mt-1">₹28,999</div>
                        <div class="text-xs text-gray-400 mt-2">Qty: 1</div>
                    </div>
                    <button class="text-red-400 text-xl self-start">×</button>
                </div>
                
                <!-- Item 2 -->
                <div class="flex gap-4">
                    <img src="https://picsum.photos/id/237/80/80" class="w-20 h-20 object-cover rounded-2xl">
                    <div class="flex-1">
                        <div class="font-medium leading-tight">Cashmere Oversized Sweater</div>
                        <div class="text-accent mt-1">₹6,499</div>
                        <div class="text-xs text-gray-400 mt-2">Qty: 1 • Black</div>
                    </div>
                    <button class="text-red-400 text-xl self-start">×</button>
                </div>
            </div>
            
            <div class="mt-8 pt-6 border-t flex justify-between text-lg">
                <span class="font-medium">Subtotal</span>
                <span class="font-semibold">₹35,498</span>
            </div>
            
            <div class="grid grid-cols-2 gap-4 mt-8">
                <a href="#" 
                   class="py-4 border border-primary text-primary font-medium rounded-3xl text-center text-sm hover:bg-zinc-50">View Cart</a>
                <a href="#" 
                   class="py-4 bg-primary text-white font-medium rounded-3xl text-center text-sm">Checkout</a>
            </div>
        `;
    document
      .getElementById("account-wrapper")
      .parentElement.appendChild(preview);
  }

  preview.classList.toggle("hidden");
}

function toggleWishlist() {
  wishlistCount = wishlistCount === 3 ? 4 : 3;
  document.getElementById("wishlist-count").textContent = wishlistCount;
  document.getElementById("mobile-wishlist-count").textContent = wishlistCount;
  // Could open wishlist modal in real app
  alert("❤️ Added to Wishlist (demo)");
}

function quickSearch(el) {
  const term = el.textContent.trim();
  document.getElementById("search-input").value = term;
  document.getElementById("search-suggestions").classList.add("hidden");
  // Simulate search
  setTimeout(() => {
    alert(`🔍 Searching for "${term}"... (demo)`);
  }, 300);
}

function clearRecentSearches() {
  const list = document.getElementById("recent-list");
  list.innerHTML =
    '<div class="text-gray-400 text-sm py-8 text-center">No recent searches</div>';
}

function login() {
  isLoggedIn = true;
  renderAccountDropdown();
  document.getElementById("account-dropdown").classList.remove("hidden");
}

function signup() {
  alert("Redirecting to signup page... (demo)");
}

function logout() {
  isLoggedIn = false;
  renderAccountDropdown();
  document.getElementById("account-dropdown").classList.add("hidden");
}

function toggleLoginState() {
  isLoggedIn = !isLoggedIn;
  renderAccountDropdown();
  alert(isLoggedIn ? "✅ Logged in as Shreya" : "👋 Logged out");
}

// Mobile Menu Controls
function openMobileMenu() {
  document.getElementById("mobile-menu").classList.remove("translate-x-full");
}

function closeMobileMenu() {
  document.getElementById("mobile-menu").classList.add("translate-x-full");
}

function showMobileSearch() {
  document.getElementById("mobile-search-overlay").classList.remove("hidden");
  document.getElementById("mobile-search-input").focus();
}

function hideMobileSearch() {
  document.getElementById("mobile-search-overlay").classList.add("hidden");
}

// Click outside handlers
function handleClickOutside(e) {
  // Account
  const accountWrapper = document.getElementById("account-wrapper");
  if (!accountWrapper.contains(e.target)) {
    document.getElementById("account-dropdown").classList.add("hidden");
  }

  // Search suggestions
  const searchContainer = document.getElementById("desktop-search-container");
  if (!searchContainer.contains(e.target)) {
    document.getElementById("search-suggestions").classList.add("hidden");
  }

  // Categories
  const catBtn = document.querySelector(
    '[onclick="toggleCategoriesDropdown()"]',
  );
  if (catBtn && !catBtn.parentElement.contains(e.target)) {
    document.getElementById("categories-dropdown").classList.add("hidden");
  }
}

// Typing animation for navbar (next to logo)
const typingData = [
  {
    icon: "fa-store",
    text: "Welcome to Artezo Store",
  },
  {
    icon: "fa-couch",
    text: "Elevate Your Home Decor",
  },
  {
    icon: "fa-image",
    text: "Crafted for Every Space",
  },
  {
    icon: "fa-gift",
    text: "Create a Home You Love",
  },
];

let textIndex = 0;
let charIndex = 0;
let isDeleting = false;
let typingTimeout;

function typeEffect() {
  const typingTextEl = document.getElementById("typing-text");
  const typingIconEl = document.getElementById("typing-icon");

  // Safety check
  if (!typingTextEl || !typingIconEl) {
    console.log("Typing elements not found");
    return;
  }

  const currentItem = typingData[textIndex];

  // Update icon
  if (charIndex === 0 || (isDeleting === false && charIndex === 1)) {
    typingIconEl.innerHTML = `<i class="fa-solid ${currentItem.icon} mr-2"></i>`;
  }

  const currentText = currentItem.text;

  // Handle typing/deleting logic
  if (isDeleting) {
    typingTextEl.textContent = currentText.substring(0, charIndex - 1);
    charIndex--;
  } else {
    typingTextEl.textContent = currentText.substring(0, charIndex + 1);
    charIndex++;
  }

  // Determine next action
  let speed = isDeleting ? 40 : 100; // Slightly slower for better readability

  // If word is complete
  if (!isDeleting && charIndex === currentText.length) {
    speed = 2000; // Pause at full text (2 seconds)
    isDeleting = true;
  }
  // If deletion is complete
  else if (isDeleting && charIndex === 0) {
    isDeleting = false;
    textIndex = (textIndex + 1) % typingData.length;
    speed = 500; // Pause before next word
  }

  // Clear previous timeout and set new one
  clearTimeout(typingTimeout);
  typingTimeout = setTimeout(typeEffect, speed);
}

// Start the animation when page loads
document.addEventListener("DOMContentLoaded", function () {
  // Small delay to ensure everything is loaded
  setTimeout(() => {
    console.log("Starting navbar typing animation...");
    typeEffect();
  }, 100);
});

if (
  document.readyState === "complete" ||
  document.readyState === "interactive"
) {
  setTimeout(typeEffect, 100);
}

// Modified initialization function
async function initializeHeader() {
  // Initialize categories first
  await initializeCategories();

  // Typing animation
  initTypingAnimation();

  // Account
  renderAccountDropdown();

  // Search focus shows suggestions
  const searchInput = document.getElementById("search-input");
  if (searchInput) {
    searchInput.addEventListener("focus", () => {
      document.getElementById("search-suggestions").classList.remove("hidden");
    });
  }

  // Hamburger
  const hamburgerBtn = document.getElementById("hamburger-btn");
  if (hamburgerBtn) {
    hamburgerBtn.addEventListener("click", openMobileMenu);
  }

  const closeMenuBtn = document.getElementById("close-menu-btn");
  if (closeMenuBtn) {
    closeMenuBtn.addEventListener("click", closeMobileMenu);
  }

  // Mobile search
  const mobileSearchBtn = document.getElementById("mobile-search-btn");
  if (mobileSearchBtn) {
    mobileSearchBtn.addEventListener("click", showMobileSearch);
  }

  // Cart
  const cartBtn = document.getElementById("cart-btn");
  if (cartBtn) {
    cartBtn.addEventListener("click", toggleCartPreview);
  }

  const mobileCartBtn = document.getElementById("mobile-cart-btn");
  if (mobileCartBtn) {
    mobileCartBtn.addEventListener("click", toggleCartPreview);
  }

  // Account button
  const accountBtn = document.getElementById("account-btn");
  if (accountBtn) {
    accountBtn.addEventListener("click", toggleAccountDropdown);
  }

  // Global click outside
  document.addEventListener("click", handleClickOutside);

  // Fake recent searches
  const recentHTML = `
        <div onclick="quickSearch(this)" class="px-4 py-3 hover:bg-zinc-50 border rounded-full cursor-pointer flex justify-between font-lexend font-normal text-sm">
            <span>Photoframes</span>
        </div>
        <div onclick="quickSearch(this)" class="px-4 py-3 hover:bg-zinc-50 border rounded-full cursor-pointer flex justify-between font-lexend font-normal text-sm">
            <span>curtains </span>
        </div>
            <div onclick="quickSearch(this)" class="px-4 py-3 hover:bg-zinc-50 border rounded-full cursor-pointer flex justify-between font-lexend font-normal text-sm">
            <span>wall paintings </span>
        </div>
    `;

  const recentList = document.getElementById("recent-list");
  if (recentList) {
    recentList.innerHTML = recentHTML;
  }

  // Demo: update cart count
  setTimeout(() => {
    cartCount = 5;
    const cartCountEl = document.getElementById("cart-count");
    const mobileCartCountEl = document.getElementById("mobile-cart-count");

    if (cartCountEl) cartCountEl.textContent = cartCount;
    if (mobileCartCountEl) mobileCartCountEl.textContent = cartCount;
  }, 4500);

  console.log(
    "%c Artezo Store Header initialized successfully (Production Ready)",
    "color:#E39F32; font-weight:600",
  );
}

// Auto start
window.onload = initializeHeader;
