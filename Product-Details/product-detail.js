(function () {
  // ---------- NEW JSON PAYLOAD  ----------
  const productData = {
    productId: 5055,
    productName: "Artezo Golden Acrylic Premium Modern Light Switch Plate",
    brandName: "Artezo",
    productCategory: "Electrical",
    productSubCategory: "Wall Plates",
    isDeleted: false,
    hasVariants: true,
    isCustomizable: false,
    isExchange: "true",

    /* --- CURRENTLY SELECTED VARIANT DATA (Root Level) --- */
    currentSku: "ART-WPLATE-GLD",
    selectedColor: "Golden",
    currentSellingPrice: 499.0,
    currentMrpPrice: 899.0,
    currentStock: 150,
    mainImage: "../Images/chair1.jfif", // Using local fallback since API paths are relative
    mockupImages: ["../Images/chair1.jfif", "../Images/chair2.jfif"],

    description: [
      "Premium Acrylic Material",
      "Modern Minimalist Design",
      "Easy Installation",
    ],
    aboutItem: [
      "Premium Acrylic Material",
      "Modern Minimalist Design",
      "Easy Installation & Universal Fit",
      "Scratch Resistant Surface",
    ],
    specifications: {
      material: "Premium Acrylic",
      design_style: "Modern Minimalist",
      installation_type: "Easy Installation",
      fit_type: "Universal Fit",
      surface_quality: "Scratch Resistant",
    },

    additionalInfo: {
      sellerName: "",
      sellerAddress: "",
      manufacturerDetails: "",
      packageDetails: "",
      country: "india",
    },

    /* --- VARIANT LOOKUP SECTION --- */
    availableVariants: [
      {
        variantId: "VAR-GOLD",
        titleName: "matty, glossy etc",
        color: "Golden",
        sku: "ART-WPLATE-GLD",
        price: 499.0,
        mrp: 899.0,
        stock: 150,
        mainImage: "../Images/chair1.jfif",
        mockupImages: ["../Images/chair1.jfif"],
        mfgDate: "2024-02-15",
        expDate: null,
        size: "xyz",
        couponAvailable: [],
      },
      {
        variantId: "VAR-BLACK",
        titleName: "matty, glossy etc",
        color: "Matte Black",
        sku: "ART-WPLATE-BLK",
        price: 449.0,
        mrp: 799.0,
        stock: 85,
        mainImage: "../Images/chair2.jfif",
        mockupImages: ["../Images/chair2.jfif"],
        mfgDate: "2024-02-15",
        expDate: null,
        size: "xyz",
        couponAvailable: [],
      },
    ],

    hero_banners: [
      {
        bannerId: 1,
        bannerImg: "../Images/chair1.jfif",
        imgDescrition: "xyz",
      },
      {
        bannerId: 2,
        bannerImg: "../Images/chair2.jfif",
        imgDescrition: "xyz",
      },
    ],
    availabeCoupons: [
      {
        couponId: 1001,
        couponDescription: "Get 10% off on first purchase",
        createdAt: "2024-01-01",
        validUntil: "2024-12-31",
        discount: "10%",
        couponCode: "CPN-1001",
      },
      {
        couponId: 1002,
        couponDescription: "Special discount for members",
        createdAt: "2024-01-01",
        validUntil: "2024-12-31",
        discount: "20%",
        couponCode: "CPN-10221",
      },
    ],

    productReviews: [
      {
        reviewId: "101",
        userId: "001",
        reviewerName: "Priya S.",
        reviewerImage: "https://randomuser.me/api/portraits/women/44.jpg",
        rating: 5,
        description:
          "Absolutely love the quality! The switch plate looks premium and modern. Installation was easy and it matches perfectly with my decor.",
        reviewImages: ["../Images/chair1.jfif", "../Images/chair2.jfif"],
        approved: true,
        location: "Chennai",
        time: "2 days ago",
        likes: 24,
        verified: true,
      },
      {
        reviewId: "102",
        userId: "002",
        reviewerName: "Rahul M.",
        reviewerImage: "https://randomuser.me/api/portraits/men/32.jpg",
        rating: 4,
        description:
          "Great product for the price. The acrylic finish is nice and it was easy to install. Would recommend.",
        reviewImages: ["../Images/chair2.jfif"],
        approved: true,
        location: "Mumbai",
        time: "5 days ago",
        likes: 18,
        verified: true,
      },
      {
        reviewId: "103",
        userId: "003",
        reviewerName: "Anjali K.",
        reviewerImage: "https://randomuser.me/api/portraits/women/68.jpg",
        rating: 5,
        description:
          "Beautiful finish and excellent quality. The golden color adds a touch of elegance to my room.",
        reviewImages: ["../Images/chair3.jfif"],
        approved: true,
        location: "Bangalore",
        time: "1 week ago",
        likes: 32,
        verified: true,
      },
    ],

    faqAns: {
      "Is this product easy to care for?":
        "Well, here's the thing—it's machine washable in cold water.",
      "Is installation difficult?":
        "No, installation is straightforward with basic tools. Instructions included.",
      "What material is it made of?":
        "Premium acrylic with scratch-resistant surface.",
    },

    installationSteps: [
      {
        step: 1,
        title: "Prepare the Wall",
        shortDescription:
          "Clean the wall surface and mark the positions for mounting.",
        stepImage: "../Images/install1.jfif",
        shortNote: "Use a level for accuracy",
      },
      {
        step: 2,
        title: "Mount the Plate",
        shortDescription:
          "Align the plate with marked positions and secure with screws.",
        stepImage: "../Images/install2.jfif",
        shortNote: "Don't overtighten",
      },
      {
        step: 3,
        title: "Final Check",
        shortDescription:
          "Ensure plate is level and all connections are secure.",
        stepImage: "../Images/install3.jfif",
        shortNote: "Test switch operation",
      },
    ],

    globalTags: ["Home Decor", "Premium Interior", "Amazon Choice"],
    addonkeys: ["stand", "wall-stand"],
  };

  // Calculate discount percentage
  const discountPercent = Math.round(
    ((productData.currentMrpPrice - productData.currentSellingPrice) /
      productData.currentMrpPrice) *
      100,
  );

  // Transform data to match existing structure
  const transformedData = {
    id: "ART-WPLATE-GLD",
    name: productData.productName,
    brand: productData.brandName,
    rating: 4.5,
    reviewCount: productData.productReviews.length,
    price: productData.currentSellingPrice,
    originalPrice: productData.currentMrpPrice,
    discountPercent: discountPercent,
    stock: productData.currentStock,
    colors: productData.availableVariants.map((v) => ({
      name: v.color,
      image: v.mainImage,
    })),
    sizes: [
      { label: "S", dim: "Standard" },
      { label: "M", dim: "Medium" },
      { label: "L", dim: "Large" },
    ],
    mainImages: [
      { thumb: productData.mainImage, full: productData.mainImage },
      ...(productData.hero_banners?.map((b) => ({
        thumb: b.bannerImg,
        full: b.bannerImg,
      })) || []),
      ...(productData.mockupImages?.map((img) => ({ thumb: img, full: img })) ||
        []),
    ],
    highlights: Object.entries(productData.specifications || {}).map(
      ([key, value]) => ({
        label: key
          .split("_")
          .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
          .join(" "),
        value: value,
        accent: key === "material" ? true : false,
      }),
    ),
    description:
      productData.aboutItem?.map((item) => `<p>${item}</p>`).join("") ||
      "<p>Premium quality product</p>",
    specifications: Object.entries(productData.specifications || {}).map(
      ([key, value]) => ({
        label: key
          .split("_")
          .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
          .join(" "),
        value: value,
      }),
    ),
    additionalInfo: [
      ...(productData.aboutItem || []),
      "Premium protective packaging included",
      "1 year warranty",
    ],
    faqs: Object.entries(productData.faqAns || {}).map(([q, a]) => ({
      q: q,
      a: a,
    })),
    together: [
      {
        name: "Matching Switch Plate Cover",
        price: 299,
        original: 499,
        img: "../Images/chair1.jfif",
        desc: "Product on this page",
        rating: 4.3,
        checked: true,
      },
      {
        name: "Premium Screwdriver Set",
        price: 199,
        original: 399,
        img: "../Images/install2.jfif",
        rating: 4.5,
        checked: false,
      },
      {
        name: "Wall Anchors Kit",
        price: 99,
        original: 199,
        img: "../Images/install1.jfif",
        rating: 4.2,
        checked: false,
      },
    ],
    similarProducts: [
      {
        name: "Modern White Switch Plate",
        price: 399,
        original: 799,
        img: "https://images.unsplash.com/photo-1567538096630-e0c55bd6374c?w=400",
      },
      {
        name: "Matte Black Wall Plate",
        price: 449,
        original: 849,
        img: "https://images.unsplash.com/photo-1592078615290-033ee584e267?w=400",
      },
      {
        name: "Brass Finish Switch",
        price: 599,
        original: 999,
        img: "https://images.unsplash.com/photo-1580480055273-228ff5388ef8?w=400",
      },
      {
        name: "Premium Acrylic Cover",
        price: 549,
        original: 899,
        img: "../Images/chair2.jfif",
      },
    ],
    stats: [
      { value: "5k+", label: "Happy Customers", stars: 5 },
      { value: "4.5", label: "Average Rating", stars: "4.5" },
      { value: "500+", label: "Verified Reviews", extra: "Trusted" },
      { value: "95%", label: "Recommend Us", progress: 95 },
    ],
    reviews: productData.productReviews
      .filter((r) => r.approved)
      .map((r) => ({
        name: r.reviewerName,
        img: r.reviewerImage,
        rating: r.rating,
        location: r.location || "India",
        time: r.time || "recently",
        text: r.description,
        likes: r.likes || 0,
        verified: r.verified || true,
      })),
    installSteps: productData.installationSteps.map((step, idx) => ({
      step: step.step,
      title: step.title,
      desc: step.shortDescription,
      list: [step.shortNote || "Follow manufacturer guidelines"],
      time:
        idx === 0
          ? "15–20 Minutes"
          : idx === 1
            ? "Basic tools required"
            : "5 Minutes",
      img: step.stepImage,
      alt: step.title,
    })),
  };

  // ---------- HELPER: render stars ----------
  function renderStars(rating, max = 5) {
    let full = Math.floor(rating);
    let half = rating - full >= 0.5 ? 1 : 0;
    let empty = max - full - half;
    let html = "";
    for (let i = 0; i < full; i++) html += '<i class="fa-solid fa-star"></i>';
    if (half) html += '<i class="fa-solid fa-star-half-alt"></i>';
    for (let i = 0; i < empty; i++)
      html += '<i class="fa-regular fa-star"></i>';
    return html;
  }

  // ---------- BUILD DOM STRUCTURE ----------
  const root = document.getElementById("dynamicRoot");

  // Main product grid
  let html = `
        <div class="grid grid-cols-1 md:grid-cols-12 gap-6 lg:gap-10 items-start px-4 md:px-0">
          <!-- LEFT COLUMN sticky images -->
          <div class="md:col-span-5">
            <div class="sticky top-20">
              <div class="flex gap-2">
                <!-- Small thumbnails -->
                <div class="flex flex-col gap-2 w-12" id="thumbContainer">
      `;
  transformedData.mainImages.forEach((img, idx) => {
    html += `<img src="${img.thumb}" data-full="${img.full}" class="thumbnail-img w-full h-16 object-cover rounded-md ${idx === 0 ? "active" : ""} cursor-pointer" />`;
  });
  html += `
                </div>
                <!-- Main image -->
                <div class="relative flex-1 bg-white rounded-xl border border-stone-100 shadow-sm flex items-center justify-center p-2 h-[320px]">
                  <img id="mainProductImage" src="${transformedData.mainImages[0].full}" alt="Product" class="max-h-full max-w-full object-contain" />
                  <span class="absolute top-2 left-2 text-white text-[10px] font-semibold px-2.5 py-1 rounded-full shadow" style="background: #e6a62c">${transformedData.discountPercent}% OFF</span>
                </div>
              </div>
            </div>
          </div>
          <!-- RIGHT COLUMN scrollable -->
          <div class="md:col-span-7">
            <div class="overflow-y-auto max-h-[calc(100vh-5rem)] pr-2 space-y-3 hide-scrollbar">
              <!-- Product title -->
              <h1 class="text-3xl md:text-4xl font-normal font-zain leading-tight text-[#033E59]">${transformedData.name}</h1>
              
              <!-- Reviews + Brand - FIXED: Now properly spaced without overlapping -->
              <div class="flex items-start justify-between gap-3 mb-2">
                <div class="flex items-center gap-2 flex-wrap flex-1">
                  <div class="flex text-amber-400 text-sm gap-0.5">${renderStars(transformedData.rating)}</div>
                  <span class="text-sm font-lexend text-stone-600">${transformedData.reviewCount} reviews</span>
                  <div class="flex items-center gap-2 px-2 py-0.5 rounded-full border ml-2" style="background-color:#d6e8f9; border-color:#e5e7eb">
                    <span class="text-xs font-lexend font-semibold text-[#1D3C4A]">Brand : ${transformedData.brand}</span>
                  </div>
                </div>
                
                <!-- Share button - with proper spacing and z-index -->
                <div class="relative flex-shrink-0" id="shareContainer" style="z-index: 30;">
                  <button id="shareButton" class="w-9 h-9 rounded-full border border-stone-200 flex items-center justify-center hover:bg-stone-100 transition bg-white shadow-sm"><i class="fa-solid fa-share-nodes text-[#033E59]"></i></button>
                  <div id="sharePopup" class="absolute right-0 mt-2 w-48 bg-white shadow-xl rounded-xl border p-2 z-40 hidden">
                    <div class="flex flex-col gap-1 text-sm">
                      <button class="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-yellow-50 w-full text-left"><i class="fa-solid fa-link font-lexend text-[#E6A62C]"></i>Copy link</button>
                      <button class="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-yellow-50 w-full text-left"><i class="fa-solid fa-envelope font-lexend text-[#E6A62C]"></i>Email</button>
                      <button class="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-yellow-50 w-full text-left"><i class="fa-brands fa-whatsapp font-lexend text-[#E6A62C]"></i>WhatsApp</button>
                    </div>
                  </div>
                </div>
              </div>

             <!-- DEAL OF THE DAY - Option 3: Premium/Luxury with Custom Color Theme -->
<div class="pt-6 pr-6 pb-4 pl-6 sm:pt-5 sm:pr-5 sm:pb-3 sm:pl-5 rounded-2xl bg-gradient-to-br from-[#e39f32]/5 to-[#1D3C4A]/5 flex flex-col md:flex-row gap-6 border border-[#e5e7eb] shadow-xl relative overflow-visible">
  <!-- Decorative elements with theme colors -->
  <div class="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-[#e39f32]/10 to-[#1D3C4A]/10 rounded-bl-full"></div>
  <div class="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-[#e39f32]/10 to-[#1D3C4A]/10 rounded-tr-full"></div>
  
  <div class="flex-1 space-y-4 relative z-10">
    <div>
      <span class="inline-block border border-[#e39f32] text-[#1D3C4A] text-xs font-medium px-3 py-1 rounded-full bg-white/80 backdrop-blur">✨ LIMITED TIME OFFER</span>
      <div class="flex items-baseline gap-3 mt-3">
        <span class="text-4xl sm:text-5xl font-light font-lexend text-[#1D3C4A]">₹${transformedData.price.toLocaleString()}</span>
        <span class="text-base font-lexend text-[#e39f32] line-through">₹${transformedData.originalPrice.toLocaleString()}</span>
        <span class="bg-[#e39f32] text-white text-xs font-medium px-3 py-1.5 rounded-full">Save ${transformedData.discountPercent}%</span>
      </div>
    </div>
    
    <!-- Premium Timer with theme colors -->
    <div class="bg-white/80 backdrop-blur rounded-lg p-3 border border-[#e5e7eb]">
      <div class="flex items-center justify-between">
        <span class="text-sm font-lexend text-[#1D3C4A]">⏳ Hurry, offer ends in</span>
        <div class="flex items-center gap-2">
          <div class="text-center">
            <span class="block bg-[#e39f32]/10 text-[#1D3C4A] px-3 py-1.5 rounded font-mono font-bold text-lg" id="timerHours">02</span>
            <span class="text-[10px] text-[#1D3C4A]/60">HRS</span>
          </div>
          <span class="text-[#e39f32] font-bold text-xl">:</span>
          <div class="text-center">
            <span class="block bg-[#e39f32]/10 text-[#1D3C4A] px-3 py-1.5 rounded font-mono font-bold text-lg" id="timerMinutes">45</span>
            <span class="text-[10px] text-[#1D3C4A]/60">MIN</span>
          </div>
          <span class="text-[#e39f32] font-bold text-xl">:</span>
          <div class="text-center">
            <span class="block bg-[#e39f32]/10 text-[#1D3C4A] px-3 py-1.5 rounded font-mono font-bold text-lg" id="timerSeconds">12</span>
            <span class="text-[10px] text-[#1D3C4A]/60">SEC</span>
          </div>
        </div>
      </div>
    </div>
  </div>
  
  <div class="hidden md:block w-px bg-gradient-to-b from-transparent via-[#e5e7eb] to-transparent self-stretch"></div>
  
  <!-- Coupons - Premium with theme colors -->
  <div class="flex-1 space-y-3 relative z-10">
    <div class="bg-white/90 backdrop-blur rounded-xl p-4 border border-[#e5e7eb] shadow-sm">
      <span class="text-xs font-lexend text-[#e39f32] uppercase tracking-wider">Exclusive Coupon</span>
      <div class="flex items-center justify-between mt-2">
        <div>
          <div class="font-lexend text-2xl font-light text-[#1D3C4A]">${productData.availabeCoupons[0]?.discount || "₹80"} <span class="text-sm">OFF</span></div>
          <div class="text-xs text-[#1D3C4A]/60 mt-1">on orders above ₹2,000</div>
        </div>
        <div class="text-right">
          <div class="font-mono text-sm bg-[#e39f32]/10 text-[#1D3C4A] px-3 py-1.5 rounded border border-[#e5e7eb]">${productData.availabeCoupons[0]?.couponCode || "LUXE80"}</div>
        </div>
      </div>
      <button class="w-full mt-4 bg-[#1D3C4A] text-white text-sm font-lexend py-2.5 rounded-lg hover:bg-[#1D3C4A]/90 transition-all duration-300 shadow-md hover:shadow-lg">Apply Coupon</button>
    </div>
    <button id="viewMoreBtn" class="w-full border border-[#e5e7eb] text-[#1D3C4A] px-4 py-2.5 rounded-lg text-sm font-lexend hover:bg-[#e39f32]/5 transition-all duration-300 flex items-center justify-center gap-2">
      <span>View All Offers</span>
      <i class="fa-solid fa-arrow-right text-xs text-[#e39f32]"></i>
    </button>
  </div>
  
  <!-- Modal - Premium style with theme colors -->
  <div id="offerOverlay" class="hidden fixed inset-0 bg-black/40 backdrop-blur-sm z-50 opacity-0 pointer-events-none flex items-center justify-center transition-opacity duration-300">
    <div id="offerModal" class="hidden flex flex-col bg-white w-full max-w-md mx-4 rounded-xl p-5 border border-[#e5e7eb] shadow-2xl scale-95 opacity-0 transition-all duration-300">
      <button id="closeOffersBtn" class="absolute top-4 right-4 text-[#e39f32] hover:text-[#1D3C4A] transition-colors text-xl">✕</button>
      <h3 class="text-[#1D3C4A] font-lexend text-lg mb-5 pb-2 border-b border-[#e5e7eb]">✨ Premium Offers</h3>
      <div class="space-y-4 max-h-[60vh] overflow-y-auto pr-1 thin-scrollbar">
        ${productData.availabeCoupons
          .map(
            (coupon) => `
        <div class="bg-gradient-to-br from-[#e39f32]/5 to-[#1D3C4A]/5 rounded-xl p-4 border border-[#e5e7eb]">
          <div class="flex justify-between items-start">
            <div>
              <span class="text-xs text-[#e39f32] uppercase tracking-wide">Limited Time</span>
              <div class="font-lexend text-xl text-[#1D3C4A] mt-1">${coupon.discount} OFF</div>
              <p class="text-xs text-[#1D3C4A]/60 mt-1">${coupon.couponDescription}</p>
            </div>
            <div class="bg-white px-3 py-2 rounded-lg border border-[#e5e7eb]">
              <span class="font-mono text-sm text-[#1D3C4A]">${coupon.couponCode}</span>
            </div>
          </div>
          <button class="w-full mt-4 bg-[#1D3C4A] text-white text-sm font-lexend py-2.5 rounded-lg hover:bg-[#1D3C4A]/90 transition">Apply Now</button>
        </div>
        `,
          )
          .join("")}
      </div>
    </div>
  </div>
</div>
              <!-- Size & Color Variants -->
              <div class="space-y-4">
                <div class="flex flex-wrap items-center gap-6 mt-4 bg-white p-4 rounded-xl shadow-sm">
                  <!-- Size Selector -->
                  <div class="flex items-center gap-2"><span class="text-sm font-normal font-lexend text-[#033E59]">Size</span><div class="flex items-center gap-2">`;
  transformedData.sizes.forEach((sz, i) => {
    let activeClass =
      i === 1
        ? "border-[#E6A62C] bg-[#033E59]/5"
        : "border border-dotted border-[#cfdde5] hover:border-[#E6A62C]";
    html += `<button class="w-20 h-12 ${activeClass} rounded-full flex flex-col justify-center items-center text-[#033E59] transition"><span class="text-sm font-medium">${sz.label}</span><span class="text-[11px] text-gray-400">${sz.dim}</span></button>`;
  });
  html += `</div></div><div class="w-px bg-gray-300 h-10 mx-4"></div>
                  <!-- Quantity -->
                  <div class="flex flex-col gap-2"><div class="flex items-center gap-2"><span class="text-sm font-medium text-[#033E59]">Quantity:</span><div class="flex border rounded-lg"><button id="decreaseBtn" class="px-4 py-2 border-r text-lg hover:bg-stone-50">−</button><span class="px-5 py-2 text-sm w-12 text-center" id="quantity">1</span><button id="increaseBtn" class="px-4 py-2 border-l text-lg hover:bg-stone-50">+</button></div></div><p id="stockInfo" class="text-xs font-medium font-lexend text-green-600">Only ${transformedData.stock} items left in stock</p></div>
                </div>

              <!-- Color Variants - Optimized Responsive with Yellow Hover -->
<div class="space-y-3 mt-4">
  <!-- Color Label -->
  <span class="text-sm font-medium text-[#033E59] block sm:hidden">Select Color:</span>
  
  <!-- Color Swatches - Responsive Grid with Yellow Hover -->
  <div class="flex flex-col sm:flex-row sm:items-start gap-4">
    <span class="text-sm font-medium text-[#033E59] hidden sm:block sm:mt-4">Color:</span>
    
    <div class="grid grid-cols-2 xs:grid-cols-3 sm:flex sm:flex-wrap md:flex-nowrap gap-3 sm:gap-4 w-full" id="colorSwatches">
      ${transformedData.colors
        .map((c, idx) => {
          let selected =
            idx === 0
              ? "ring-2 ring-[#E6A62C] ring-offset-2 bg-[#033E59]/5"
              : "ring-1 ring-gray-200 bg-white hover:ring-[#E6A62C] hover:ring-2";

          let textClass =
            idx === 0
              ? "text-[#033E59] font-medium"
              : "text-gray-600 group-hover:text-[#E6A62C]";

          return `
          <button class="group flex flex-col items-center gap-2 color-swatch">
            <div class="relative rounded-xl sm:rounded-2xl overflow-hidden ${selected} transition-all duration-300 p-1.5">
              <div class="w-full aspect-square sm:w-24 sm:h-24 md:w-28 md:h-28 rounded-lg sm:rounded-xl overflow-hidden">
                <img src="${c.image}" 
                     class="w-full h-full object-cover transition-all duration-500 group-hover:scale-110 group-hover:brightness-105"
                     alt="${c.name}"/>
              </div>
              <!-- Yellow overlay on hover (subtle) -->
              <div class="absolute inset-0 bg-[#E6A62C]/0 group-hover:bg-[#E6A62C]/5 transition-all duration-300 pointer-events-none"></div>
            </div>
            <span class="text-xs sm:text-sm ${textClass} transition-colors duration-300 font-medium">
              ${c.name}
            </span>
          </button>
        `;
        })
        .join("")}
    </div>
  </div>
</div>

              <!-- Purchase Section -->
              <div class="mt-12 flex flex-col gap-4"><div class="flex flex-col sm:flex-row gap-4">
                <button class="relative overflow-hidden flex-1 flex items-center justify-center gap-2 min-w-[140px] border-2 border-[#e5e7eb] rounded-xl bg-white text-[#1D3C4A] font-medium py-3 px-5 group"><span class="absolute inset-0 bg-[#e39f32] -translate-x-full group-hover:translate-x-0 transition-transform duration-500 ease-out"></span><i class="fa-solid fa-cart-shopping text-[#e39f32] group-hover:text-white relative z-10 transition-colors duration-500"></i><span class="relative z-10">Add to Cart</span></button>
                <button class="relative overflow-hidden flex-1 flex items-center justify-center gap-2 min-w-[140px] bg-[#1D3C4A] text-white font-medium py-3 px-5 rounded-xl group"><span class="absolute inset-0 bg-[#e39f32] -translate-x-full group-hover:translate-x-0 transition-transform duration-500 ease-out"></span><i class="fa-solid fa-bolt text-[#e39f32] group-hover:text-[#1D3C4A] relative z-10 transition-colors duration-500"></i><span class="relative z-10">Buy Now</span></button>
              </div></div>

<!-- DELIVERY & PINCODE CHECKER (COMPACT PREMIUM UI) -->
<div class="bg-white rounded-xl border border-[#e5e7eb] shadow-sm mt-4 p-4">

  <!-- Header -->
  <div class="flex items-center gap-2 mb-3">
    <div class="w-7 h-7 rounded-full bg-[#e39f32]/10 flex items-center justify-center">
      <i class="fa-solid fa-truck-fast text-[#e39f32] text-xs"></i>
    </div>
    <h3 class="font-lexend text-sm font-medium text-[#1D3C4A]">
      Delivery & Services
    </h3>
  </div>

  <!-- Layout -->
  <div class="flex flex-col md:flex-row gap-4">

    <!-- LEFT : PINCODE -->
    <div class="flex-1 space-y-2">

      <label class="text-[11px] text-gray-500 font-lexend">
        Enter pincode
      </label>

      <div class="flex gap-2">
        <input
          type="text"
          id="pincodeInput"
          maxlength="6"
          placeholder="400001"
          class="flex-1 border border-[#e5e7eb] rounded-lg px-3 py-2.5 text-sm
                 focus:outline-none focus:border-[#e39f32]
                 focus:ring-1 focus:ring-[#e39f32]/20 transition"
        />

        <button
          id="checkPincodeBtn"
          class="bg-[#1D3C4A] text-white px-4 py-2.5 rounded-lg
                 text-sm font-lexend hover:bg-[#1D3C4A]/90
                 transition shadow-sm whitespace-nowrap">
          Check
        </button>
      </div>

      <!-- Messages -->
      <p id="pincodeSuccess"
         class="hidden text-[11px] text-green-600 flex items-center gap-1">
        <i class="fa-solid fa-circle-check"></i>
        Delivery available (4 – 7 days)
      </p>

      <p id="pincodeError"
         class="hidden text-[11px] text-red-500 flex items-center gap-1">
        <i class="fa-solid fa-circle-xmark"></i>
        Delivery not available
      </p>

    </div>

    <!-- Divider -->
    <div class="hidden md:block w-px bg-[#e5e7eb]"></div>

    <!-- RIGHT : DELIVERY INFO -->
    <div class="flex-1">

      <!-- Timeline -->
      <div class="grid grid-cols-3 gap-2 text-center">

        <div class="space-y-1">
          <div class="w-7 h-7 mx-auto rounded-full bg-[#e39f32]/10 flex items-center justify-center">
            <i class="fa-solid fa-box text-[#e39f32] text-xs"></i>
          </div>
          <p class="text-[10px] text-gray-500">Dispatch</p>
          <p class="text-xs font-medium text-[#1D3C4A]">24 – 48h</p>
        </div>

        <div class="space-y-1">
          <div class="w-7 h-7 mx-auto rounded-full bg-[#e39f32]/10 flex items-center justify-center">
            <i class="fa-solid fa-calendar-check text-[#e39f32] text-xs"></i>
          </div>
          <p class="text-[10px] text-gray-500">Delivery</p>
          <p class="text-xs font-medium text-[#1D3C4A]">4 – 7d</p>
        </div>

        <div class="space-y-1">
          <div class="w-7 h-7 mx-auto rounded-full bg-[#e39f32]/10 flex items-center justify-center">
            <i class="fa-solid fa-hand-holding-dollar text-[#e39f32] text-xs"></i>
          </div>
          <p class="text-[10px] text-gray-500">Payment</p>
          <p class="text-xs font-medium text-[#1D3C4A]">COD</p>
        </div>

      </div>

      <!-- Trust Badges (Compact Line) -->
      <div class="flex flex-wrap items-center justify-center gap-3 mt-3 pt-3 border-t border-[#f1f1f1] text-[11px] text-gray-600">

        <span class="flex items-center gap-1">
          <i class="fa-solid fa-check text-green-600"></i>
          Free Shipping
        </span>

        <span class="flex items-center gap-1">
          <i class="fa-solid fa-check text-green-600"></i>
          Easy Returns
        </span>

        <span class="flex items-center gap-1">
          <i class="fa-solid fa-check text-green-600"></i>
          Secure Packaging
        </span>

      </div>

    </div>

  </div>
</div>
              
              <!--more info section-->
              <section class="max-w-3xl mx-auto px-4 pt-8 pb-0 font-sans text-[#1D3C4A]">
                <div class="border border-[#e5e7eb] rounded-xl divide-y divide-[#e5e7eb] bg-white" id="accordionContainer"></div>
              </section>

              <!-- Frequently Bought Together -->
              <section class="max-w-4xl mx-auto mt-4 mb-12 px-4"><h2 class="text-xl font-normal font-lexend text-[#1D3C4A] mb-5">Frequently Bought Together</h2><div class="bg-[#1D3C4A]/5 border border-[#e5e7eb] rounded-2xl p-4 space-y-4" id="boughtTogether"></div></section>
            </div>
          </div>
        </div>
      `;
  root.innerHTML = html;

  // Delivery Pincode Checker Functionality - FIXED VERSION
  function initPincodeChecker() {
    console.log("Initializing pincode checker..."); // Debug

    // Get elements by ID - most reliable method
    const pincodeInput = document.getElementById("pincodeInput");
    const checkBtn = document.getElementById("checkPincodeBtn");
    const successMsg = document.getElementById("pincodeSuccess");
    const errorMsg = document.getElementById("pincodeError");

    // Check if elements exist
    if (!pincodeInput || !checkBtn) {
      console.log("Pincode elements not found, retrying...");
      setTimeout(initPincodeChecker, 500); // Retry after 500ms
      return;
    }

    console.log("Pincode elements found, attaching events...");

    // Serviceable pincodes (example data)
    const serviceablePincodes = [
      "400001",
      "400002",
      "400003",
      "400004",
      "400005",
      "110001",
      "110002",
      "110003",
      "110004",
      "110005",
      "560001",
      "560002",
      "560003",
      "560004",
      "560005",
      "600001",
      "600002",
      "600003",
      "600004",
      "600005",
      "700001",
      "700002",
      "700003",
      "700004",
      "700005",
    ];

    // Function to check pincode
    function checkPincode() {
      const pincode = pincodeInput.value.trim();
      console.log("Checking pincode:", pincode); // Debug

      // Validation: 6-digit number
      if (!/^\d{6}$/.test(pincode)) {
        alert("Please enter a valid 6-digit pincode");
        pincodeInput.focus();
        return;
      }

      // Check if serviceable
      const isServiceable = serviceablePincodes.includes(pincode);
      console.log("Is serviceable:", isServiceable); // Debug

      // Hide both messages first
      if (successMsg) successMsg.classList.add("hidden");
      if (errorMsg) errorMsg.classList.add("hidden");

      // Show appropriate message
      if (isServiceable) {
        if (successMsg) {
          successMsg.classList.remove("hidden");
          console.log("Showing success message");

          // Auto hide after 5 seconds
          setTimeout(() => {
            successMsg.classList.add("hidden");
          }, 5000);
        }
      } else {
        if (errorMsg) {
          errorMsg.classList.remove("hidden");
          console.log("Showing error message");

          setTimeout(() => {
            errorMsg.classList.add("hidden");
          }, 5000);
        }
      }
    }

    // Remove any existing event listeners by cloning and replacing
    const newCheckBtn = checkBtn.cloneNode(true);
    checkBtn.parentNode.replaceChild(newCheckBtn, checkBtn);

    // Get the new button reference
    const updatedCheckBtn = document.getElementById("checkPincodeBtn");

    // Add click event listener
    updatedCheckBtn.addEventListener("click", function (e) {
      e.preventDefault();
      checkPincode();
    });

    // Get fresh input reference (in case it was affected)
    const updatedInput = document.getElementById("pincodeInput");

    // Add keypress event for Enter key
    updatedInput.addEventListener("keypress", function (e) {
      if (e.key === "Enter") {
        e.preventDefault();
        checkPincode();
      }
    });

    // Input validation - only numbers
    updatedInput.addEventListener("input", function () {
      this.value = this.value.replace(/[^0-9]/g, "").slice(0, 6);
    });

    console.log("Pincode checker initialized successfully");
  }

  // Make sure DOM is fully loaded before initializing
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", function () {
      setTimeout(initPincodeChecker, 500);
    });
  } else {
    setTimeout(initPincodeChecker, 500);
  }

  // Initialize pincode checker
  setTimeout(function () {
    initPincodeChecker();
  }, 500);

  // fill accordion
  const acc = document.getElementById("accordionContainer");
  let accHtml = `
        <div class="item"><button class="toggle w-full flex justify-between items-center px-6 py-5 text-left font-medium font-lexend text-[#1D3C4A]">Highlights<span class="icon text-xl transition-transform duration-300">+</span></button><div class="content"><div class="px-6 pb-6 text-sm"><div class="rounded-lg overflow-hidden bg-white border border-[#edf2f4] shadow-sm"><table class="w-full text-left border-collapse"><tbody>`;
  transformedData.highlights.forEach((h) => {
    let rowClass = h.accent
      ? "bg-[#fff9f2]"
      : "border-b border-[#f1f5f7] hover:bg-[#f8fbfc] transition";
    let valClass = h.accent
      ? "text-[#e39f32] font-medium"
      : "text-[#1D3C4A]/70";
    accHtml += `<tr class="${rowClass}"><td class="py-3 px-4 font-medium border-r border-[#f1f5f7] w-1/3 text-[#1D3C4A]">${h.label}</td><td class="py-3 px-4 ${valClass}">${h.value}</td></tr>`;
  });
  accHtml += `</tbody></table></div></div></div></div>`;

  accHtml += `<div class="item"><button class="toggle w-full flex justify-between items-center px-6 py-5 text-left font-medium font-lexend">Product Description<span class="icon text-xl transition-transform duration-300">+</span></button><div class="content"><div class="px-6 pb-6 text-sm text-[#1D3C4A]/80 leading-relaxed space-y-4">${transformedData.description}</div></div></div>`;

  accHtml += `<div class="item"><button class="toggle w-full flex justify-between items-center px-6 py-5 text-left font-medium font-lexend text-[#1D3C4A]">Specifications<span class="icon text-xl transition-transform duration-300">+</span></button><div class="content"><div class="px-6 pb-6 text-sm"><div class="rounded-lg overflow-hidden bg-white border border-[#edf2f4] shadow-sm"><table class="w-full text-left border-collapse"><tbody>`;
  transformedData.specifications.forEach((s) => {
    accHtml += `<tr class="border-b border-[#f1f5f7]"><td class="py-3 px-4 font-medium border-r border-[#f1f5f7] w-1/3 text-[#1D3C4A]">${s.label}</td><td class="py-3 px-4 text-[#1D3C4A]/70">${s.value}</td></tr>`;
  });
  accHtml += `</tbody></table></div></div></div></div>`;

  accHtml += `<div class="item"><button class="toggle w-full flex justify-between items-center px-6 py-4 text-left font-medium font-lexend text-[#1D3C4A]">Additional Information<span class="icon text-lg transition-transform duration-300">+</span></button><div class="content"><div class="px-6 pb-5 text-sm"><div class="grid gap-3">`;
  transformedData.additionalInfo.forEach((info) => {
    accHtml += `<div class="flex items-start gap-2 p-3 rounded-md bg-[#f8fbfc] border border-[#eef3f6]"><div class="w-1.5 h-1.5 mt-2 rounded-full bg-[#e39f32]"></div><p class="text-[#1D3C4A]/75 text-[13px]">${info}</p></div>`;
  });
  accHtml += `</div></div></div></div>`;

  accHtml += `<div class="item"><button class="toggle w-full flex justify-between items-center px-6 py-4 text-left font-medium font-lexend text-[#1D3C4A]">FAQs<span class="icon text-lg transition-transform duration-300">+</span></button><div class="content"><div class="px-6 pb-6 text-sm space-y-4">`;
  transformedData.faqs.forEach((faq) => {
    accHtml += `<div class="p-4 rounded-lg border border-[#eef3f6] bg-white shadow-sm"><p class="font-medium text-[#1D3C4A] text-[14px]">${faq.q}</p><p class="mt-2 text-[#1D3C4A]/70 text-[13px] leading-relaxed">${faq.a}</p></div>`;
  });
  accHtml += `</div></div></div>`;
  acc.innerHTML = accHtml;

  // bought together
  const togetherDiv = document.getElementById("boughtTogether");
  let togetherHtml = "";
  transformedData.together.forEach((item, i) => {
    togetherHtml += `<div class="flex items-center justify-between bg-white border border-[#e5e7eb] rounded-xl p-3 hover:shadow-sm transition"><div class="flex gap-3 items-center"><img src="${item.img}" class="w-20 h-20 object-cover rounded-lg"/><div>${item.desc ? '<p class="text-xs text-gray-500 font-lexend">' + item.desc + "</p>" : ""}<h3 class="font-medium font-lexend text-[#1D3C4A] text-sm">${item.name}</h3><div class="flex items-center gap-2 mt-1 text-sm"><span class="font-semibold font-lexend text-[#1D3C4A]">₹${item.price}</span><span class="line-through font-lexend text-gray-400 text-xs">₹${item.original}</span><span class="bg-[#e39f32]/20 text-[#e39f32] text-[10px] px-2 py-[2px] rounded-full">${Math.round((1 - item.price / item.original) * 100)}% OFF</span></div>${item.rating ? '<div class="text-[#e39f32] text-xs mt-1">★ ' + item.rating + "</div>" : ""}</div></div><input type="checkbox" class="w-5 h-5 accent-[#1D3C4A] product-check" data-price="${item.price}" ${item.checked ? "checked" : ""} /></div>`;
  });
  togetherHtml += `<div class="pt-2"><button id="addToCartBtn" class="w-full bg-[#1D3C4A] text-white font-lexend py-3 rounded-xl text-sm font-medium hover:bg-[#16303b] transition duration-300 shadow-md hover:shadow-lg">Add To Cart (1) • Total ₹5,499</button></div>`;
  togetherDiv.innerHTML = togetherHtml;

  // similar products
  const similarSec = document.getElementById("similarSection");
  let similarHtml = `<div class="text-center mb-10"><h2 class="text-2xl md:text-3xl font-medium font-zain text-[#1D3C4A]">View Similar Products</h2><div class="w-16 h-1 bg-[#e39f32] mx-auto mt-3 rounded-full"></div></div><div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6 lg:gap-8">`;
  transformedData.similarProducts.forEach((p) => {
    similarHtml += `<div class="group relative flex flex-col bg-white rounded-2xl border border-[#e5e7eb] shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-1 overflow-hidden"><button class="absolute top-3 right-3 z-10 w-9 h-9 flex items-center justify-center bg-white border border-[#e5e7eb] rounded-full shadow-sm hover:border-[#e39f32] transition-all duration-300"><svg class="w-4 h-4 text-[#1D3C4A] group-hover:text-[#e39f32]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4.318 6.318a4.5 4.5 0 016.364 0L12 7.636l1.318-1.318a4.5 4.5 0 116.364 6.364L12 21.364 4.318 12.682a4.5 4.5 0 010-6.364z"/></svg></button><div class="aspect-[4/4.5] overflow-hidden bg-gray-100"><img src="${p.img}" alt="${p.name}" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-in-out"/></div><div class="flex flex-col flex-1 p-3"><h3 class="text-sm font-medium font-lexend text-[#1D3C4A] line-clamp-2 mb-1">${p.name}</h3><div class="flex items-baseline gap-2 mb-3"><span class="text-base font-semibold font-lexend text-[#1D3C4A]">₹${p.price.toLocaleString()}</span><span class="text-xs text-gray-400 font-lexend line-through">₹${p.original.toLocaleString()}</span></div><button class="mt-auto py-2 rounded-lg border border-[#1D3C4A] text-[#1D3C4A] text-sm font-medium font-lexend hover:bg-[#1D3C4A] hover:text-white transition-all duration-300">Add to Cart</button></div></div>`;
  });
  similarHtml += `</div>`;
  similarSec.innerHTML = similarHtml;

  // social proof
  const socialSec = document.getElementById("socialSection");
  let socialHtml = `<div class="mb-8"><h2 class="text-2xl md:text-3xl font-semibold font-zain text-[#1D3C4A]">Loved by 5,000+ Happy Customers</h2><p class="text-[#1D3C4A]/70 font-lexend mt-2">Real reviews from real people who trust our quality</p></div><div class="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">`;
  transformedData.stats.forEach((stat) => {
    let stars = "";
    if (stat.stars === 5)
      stars =
        '<i class="fa-solid fa-star"></i><i class="fa-solid fa-star"></i><i class="fa-solid fa-star"></i><i class="fa-solid fa-star"></i><i class="fa-solid fa-star"></i>';
    else if (stat.stars === "4.5")
      stars =
        '<i class="fa-solid fa-star"></i><i class="fa-solid fa-star"></i><i class="fa-solid fa-star"></i><i class="fa-solid fa-star"></i><i class="fa-solid fa-star-half-alt"></i>';
    socialHtml += `<div class="bg-gradient-to-br from-white to-[#fefaf5] rounded-2xl border border-[#e5e7eb] p-6 text-center shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-1 relative overflow-hidden group"><div class="absolute inset-0 bg-gradient-to-br from-[#e39f32]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div><div class="relative"><div class="text-3xl font-bold font-zain text-[#e39f32] mb-2">${stat.value}</div><div class="text-sm font-medium font-lexend text-[#1D3C4A]">${stat.label}</div><div class="flex justify-center gap-0.5 mt-2 text-[#e39f32]">${stars}</div></div></div>`;
  });
  socialHtml += `</div><div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" id="reviewsContainer">`;
  transformedData.reviews.forEach((r) => {
    socialHtml += `<div class="bg-gradient-to-br from-white to-[#fff9f2] rounded-2xl border border-[#e5e7eb] p-6 shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1 relative overflow-hidden group"><div class="absolute inset-0 bg-gradient-to-br from-[#e39f32]/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div><div class="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-[#e39f32]/10 to-transparent rounded-bl-full -mr-8 -mt-8 group-hover:scale-110 transition-transform duration-500"></div><div class="relative"><div class="flex items-start gap-4 mb-4"><img src="${r.img}" class="w-12 h-12 rounded-full object-cover border-2 border-[#e39f32] ring-2 ring-[#e39f32]/20"/><div><h4 class="font-semibold text-[#1D3C4A]">${r.name}</h4><div class="flex items-center gap-2 text-sm"><div class="flex text-[#e39f32]">${renderStars(r.rating)}</div>${r.verified ? '<span class="text-green-600 text-xs flex items-center bg-green-50 px-2 py-0.5 rounded-full"><i class="fa-solid fa-circle-check mr-1"></i>Verified</span>' : ""}</div></div></div><p class="text-[#1D3C4A]/80 text-sm leading-relaxed mb-3 italic">"${r.text}"</p><div class="flex items-center gap-2 text-xs text-gray-500 border-t border-[#e5e7eb] pt-3 mt-2"><span>${r.time}</span><span>•</span><span>${r.location}</span><span class="ml-auto"><i class="fa-regular fa-heart text-[#e39f32]"></i> ${r.likes}</span></div></div></div>`;
  });
  socialHtml += `</div><div class="text-center mt-10"><button id="loadMoreBtn" class="group relative inline-flex items-center gap-2 px-8 py-3.5 bg-gradient-to-r from-[#1D3C4A] to-[#2a4d5e] text-white font-medium rounded-xl hover:from-[#e39f32] hover:to-[#f5b85b] hover:text-[#1D3C4A] transition-all duration-500 shadow-md hover:shadow-xl overflow-hidden"><span class="absolute inset-0 bg-white/20 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></span><span class="relative">Load More Reviews</span><i class="fa-solid fa-arrow-right relative text-sm transition-transform duration-300 group-hover:translate-x-1"></i></button></div>`;
  socialSec.innerHTML = socialHtml;

  // installation
  const installSec = document.getElementById("installSection");
  let installHtml = `<div class="max-w-6xl mx-auto px-6 space-y-12"><div class="text-center max-w-3xl mx-auto mb-12"><span class="text-sm tracking-widest uppercase text-[#e39f32] font-medium">Installation Process</span><h2 class="text-3xl md:text-4xl lg:text-5xl font-zain font-semibold text-[#1D3C4A] mt-4 mb-6 leading-tight">Professional Installation Process</h2><div class="w-16 h-[3px] bg-[#e39f32] mx-auto mb-6 rounded-full"></div><p class="text-gray-600 font-lexend leading-relaxed text-base md:text-lg">Our streamlined workflow ensures safe, precise, and flawless installation handled by trained professionals using industry-grade tools.</p></div>`;
  transformedData.installSteps.forEach((step, idx) => {
    let even = idx % 2 === 0;
    installHtml += `<div class="grid md:grid-cols-2 gap-12 items-center"><div class="${even ? "" : "order-2 md:order-1"}"><h3 class="text-2xl font-lexend font-semibold text-[#1D3C4A] mb-4">${step.title}</h3><p class="text-gray-600 mb-6 font-lexend font-light leading-relaxed">${step.desc}</p><ul class="space-y-3 text-gray-600 font-lexend font-light mb-6">${step.list.map((l) => '<li class="flex items-start gap-3"><span class="w-2 h-2 bg-[#e39f32] rounded-full mt-2"></span>' + l + "</li>").join("")}</ul><div class="bg-[#1D3C4A]/5 border border-[#e5e7eb] rounded-xl p-4 text-sm font-lexend text-gray-600"><span class="font-normal text-[#1D3C4A]">${step.time ? "Estimated Time:" : "Tools Required:"}</span> ${step.time}</div></div><div class="relative ${even ? "" : "order-1 md:order-2"}"><div class="h-[380px] bg-gray-50 rounded-2xl border border-[#e5e7eb] flex items-center justify-center p-6"><img src="${step.img}" alt="${step.alt}" class="max-h-full max-w-full object-contain"/></div><div class="absolute -top-4 ${even ? "-left-4" : "-right-4"} bg-[#e39f32] text-white text-sm px-4 py-1 rounded-full shadow">Step 0${step.step}</div></div></div>`;
  });
  installHtml += `<div class="grid md:grid-cols-2 gap-12 items-center pt-6"><div><span class="text-sm tracking-widest uppercase text-[#e39f32] font-medium">Video Demonstration</span><h3 class="text-2xl font-semibold font-lexend text-[#1D3C4A] mt-3 mb-4">Watch the Full Installation Process</h3><p class="text-gray-600 font-lexend font-light leading-relaxed mb-5">See our experts complete the installation step-by-step using professional tools and precision techniques to ensure stability and long-term durability.</p><ul class="space-y-3 text-gray-600 font-lexend font-light"><li class="flex items-start gap-3"><span class="w-2 h-2 bg-[#e39f32] rounded-full mt-2"></span>Real-time installation walkthrough</li><li class="flex items-start gap-3"><span class="w-2 h-2 bg-[#e39f32] rounded-full mt-2"></span>Expert handling & finishing process</li><li class="flex items-start gap-3"><span class="w-2 h-2 bg-[#e39f32] rounded-full mt-2"></span>Final quality inspection preview</li></ul></div><div class="rounded-2xl overflow-hidden border border-[#e5e7eb] shadow-md"><iframe class="w-full h-[240px] md:h-[300px]" src="https://www.youtube.com/embed/f_213aSWLrA?autoplay=1&mute=1&rel=0&modestbranding=1&controls=1" title="Installation Video" frameborder="0" allow="autoplay; encrypted-media; picture-in-picture" allowfullscreen></iframe></div></div></div>`;
  installSec.innerHTML = installHtml;

  // sticky bar
  const sticky = document.getElementById("stickyBar");
  sticky.innerHTML = `<div class="flex items-center justify-center gap-3 order-1"><span class="font-medium font-lexend text-2xl md:text-3xl drop-shadow-sm" style="color:#e39f32">₹${transformedData.price.toLocaleString()}</span><span class="text-gray-600 line-through text-base md:text-lg opacity-90">₹${transformedData.originalPrice.toLocaleString()}</span></div><div class="flex items-center gap-3 md:gap-4 flex-wrap justify-center order-2"><button class="border-2 px-6 py-3 rounded-full text-base font-medium font-lexend flex items-center gap-2 transition-all duration-200 hover:bg-[#1D3C4A]/10 hover:shadow-md group" style="border-color:#1d3c4a;color:#1d3c4a"><i class="fas fa-cart-plus text-xl group-hover:text-[#e39f32] transition-colors"></i>Add to Cart</button><button class="px-8 py-3 rounded-full text-base font-medium font-lexend shadow-lg flex items-center gap-2 transition-all duration-200 hover:shadow-xl hover:scale-[1.04]" style="background-color:#1d3c4a;color:white">Buy Now <i class="fas fa-arrow-right text-lg"></i></button><a href="https://wa.me/+919876543210?text=Hi%2C%20I%27m%20interested%20in%20this%20product.%20Can%20you%20please%20send%20live%20product%20videos%3F%20%F0%9F%93%B9" target="_blank" class="px-7 py-3 rounded-full text-base font-medium font-lexend flex items-center gap-2 shadow-md transition-all duration-200 hover:shadow-lg hover:scale-[1.03] bg-green-600 hover:bg-green-700 text-white"><i class="fab fa-whatsapp text-xl"></i>Request Live Product Videos</a></div>`;

  // ---------- reattach all js behaviors (same as original) ----------
  // thumbnails
  const mainImg = document.getElementById("mainProductImage");
  const thumbs = document.querySelectorAll(".thumbnail-img");
  if (thumbs.length && mainImg) {
    thumbs.forEach((t) =>
      t.addEventListener("click", function () {
        thumbs.forEach((t) =>
          t.classList.remove("active", "ring-2", "ring-[#e39f32]"),
        );
        this.classList.add("active", "ring-2", "ring-[#e39f32]");
        if (this.dataset.full) mainImg.src = this.dataset.full;
      }),
    );
  }

  // share - FIXED: Reattach after DOM update
  setTimeout(() => {
    const shareBtn = document.getElementById("shareButton");
    const sharePopup = document.getElementById("sharePopup");

    if (shareBtn && sharePopup) {
      // Remove any existing listeners by cloning
      const newShareBtn = shareBtn.cloneNode(true);
      shareBtn.parentNode.replaceChild(newShareBtn, shareBtn);

      // Get the new button and add event listener
      const updatedShareBtn = document.getElementById("shareButton");
      const updatedSharePopup = document.getElementById("sharePopup");

      updatedShareBtn.addEventListener("click", function (e) {
        e.stopPropagation();
        updatedSharePopup.classList.toggle("hidden");
      });

      // Close popup when clicking outside
      document.addEventListener("click", function (e) {
        if (
          !updatedShareBtn.contains(e.target) &&
          !updatedSharePopup.contains(e.target)
        ) {
          updatedSharePopup.classList.add("hidden");
        }
      });
    }
  }, 100);

  // color swatch
  const swatches = document.querySelectorAll(".color-swatch");
  swatches.forEach((sw) => {
    sw.addEventListener("click", function () {
      swatches.forEach((s) => {
        s.querySelector("div:first-child").classList.remove(
          "border-2",
          "border-[#E6A62C]",
          "shadow-xl",
          "bg-[#033E59]/5",
        );
        s.querySelector("div:first-child").classList.add(
          "border",
          "border-[#e2e8f0]",
          "shadow-sm",
          "bg-[#f8fafc]",
        );
        s.querySelector("span").classList.remove(
          "font-medium",
          "text-[#033E59]",
        );
        s.querySelector("span").classList.add("text-gray-500");
      });
      this.querySelector("div:first-child").classList.add(
        "border-2",
        "border-[#E6A62C]",
        "shadow-xl",
        "bg-[#033E59]/5",
      );
      this.querySelector("span").classList.add("font-medium", "text-[#033E59]");
      if (this.dataset.img) mainImg.src = this.dataset.img;
    });
  });

  // quantity
  let quantity = 1,
    stock = transformedData.stock;
  const qtySpan = document.getElementById("quantity"),
    stockInfo = document.getElementById("stockInfo"),
    inc = document.getElementById("increaseBtn"),
    dec = document.getElementById("decreaseBtn");
  function updateQtyUI() {
    qtySpan.textContent = quantity;
    let rem = stock - quantity;
    stockInfo.textContent =
      rem > 0 ? `Only ${rem} items left in stock` : "Out of stock";
    stockInfo.className =
      rem > 0
        ? "text-xs font-medium text-green-600"
        : "text-xs font-medium text-red-600";
  }
  if (inc && dec) {
    inc.addEventListener("click", () => {
      if (quantity < stock) {
        quantity++;
        updateQtyUI();
      }
    });
    dec.addEventListener("click", () => {
      if (quantity > 1) {
        quantity--;
        updateQtyUI();
      }
    });
    updateQtyUI();
  }

  // timer
  function updateTimer() {
    let h = document.getElementById("timerHours"),
      m = document.getElementById("timerMinutes"),
      s = document.getElementById("timerSeconds");
    if (!h || !m || !s) return;
    let hours = parseInt(h.innerText) || 0,
      mins = parseInt(m.innerText) || 0,
      secs = parseInt(s.innerText) || 0;
    if (secs > 0) secs--;
    else if (mins > 0) {
      mins--;
      secs = 59;
    } else if (hours > 0) {
      hours--;
      mins = 59;
      secs = 59;
    }
    s.innerText = secs.toString().padStart(2, "0");
    m.innerText = mins.toString().padStart(2, "0");
    h.innerText = hours.toString().padStart(2, "0");
  }
  setInterval(updateTimer, 1000);

  // overlay modal
  const overlay = document.getElementById("offerOverlay"),
    modal = document.getElementById("offerModal"),
    viewBtn = document.getElementById("viewMoreBtn"),
    closeBtn = document.getElementById("closeOffersBtn");
  if (overlay && modal && viewBtn && closeBtn) {
    viewBtn.addEventListener("click", (e) => {
      e.preventDefault();
      overlay.classList.remove("hidden", "opacity-0", "pointer-events-none");
      overlay.classList.add("flex", "opacity-100");
      modal.classList.remove("hidden", "scale-95", "opacity-0");
      modal.classList.add("flex", "scale-100", "opacity-100");
      document.body.classList.add("overflow-hidden");
    });
    function closeOffers() {
      overlay.classList.add("opacity-0", "pointer-events-none");
      overlay.classList.remove("opacity-100");
      modal.classList.add("scale-95", "opacity-0");
      modal.classList.remove("scale-100", "opacity-100");
      setTimeout(() => {
        if (overlay.classList.contains("opacity-0")) {
          overlay.classList.add("hidden");
          modal.classList.add("hidden");
        }
        document.body.classList.remove("overflow-hidden");
      }, 300);
    }
    closeBtn.addEventListener("click", closeOffers);
    overlay.addEventListener("click", (e) => {
      if (e.target === overlay) closeOffers();
    });
  }

  // accordion toggles
  document.querySelectorAll(".item").forEach((item) => {
    const btn = item.querySelector(".toggle"),
      content = item.querySelector(".content"),
      icon = item.querySelector(".icon");
    if (btn && content && icon) {
      btn.addEventListener("click", () => {
        document.querySelectorAll(".item").forEach((i) => {
          if (i !== item) {
            i.querySelector(".content")?.classList.remove("open");
            if (i.querySelector(".icon"))
              i.querySelector(".icon").style.transform = "rotate(0deg)";
          }
        });
        content.classList.toggle("open");
        icon.style.transform = content.classList.contains("open")
          ? "rotate(45deg)"
          : "rotate(0deg)";
      });
    }
  });

  // together checkboxes
  const checkboxes = document.querySelectorAll(".product-check");
  const totalBtn = document.getElementById("addToCartBtn");
  function updateTotal() {
    let total = 0,
      count = 0;
    checkboxes.forEach((c) => {
      if (c.checked) {
        total += parseInt(c.dataset.price);
        count++;
      }
    });
    if (totalBtn)
      totalBtn.innerHTML = `Add To Cart (${count}) <span class="text-[#e39f32]">• Total ₹${total.toLocaleString()}</span>`;
  }
  checkboxes.forEach((c) => c.addEventListener("change", updateTotal));
  updateTotal();

  // load more reviews (stub)
  const loadMore = document.getElementById("loadMoreBtn");
  if (loadMore) {
    loadMore.addEventListener("click", function () {
      this.disabled = true;
      this.innerHTML =
        '<span class="relative">Loading...</span> <i class="fa-solid fa-spinner fa-spin relative"></i>';
      setTimeout(() => {
        this.parentElement.remove();
      }, 1000);
    });
  }
})();
