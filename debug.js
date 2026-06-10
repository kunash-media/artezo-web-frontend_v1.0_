(function () {
    // ========== GET PRODUCT DATA FROM URL ==========
    const urlParams = new URLSearchParams(window.location.search);
    const productId = parseInt(urlParams.get("id")) || 5055;

    // ========== LOAD PRODUCT FROM CENTRAL DATABASE ==========
    let productData = null;
    let currentVariant = null;
    let safeProductData = null;
    let transformedData = null;
    let currentCustomFields = {};
    let customFieldValues = {};

    // Store all products array for filtering similar products
    let allProductsArray = [];

    document.addEventListener("DOMContentLoaded", function () {
        // Call your existing functions here
        fillHeroBanner();
        init();
    });

    // Function to wait for ProductDatabase
    function waitForProductDatabase(callback, maxAttempts = 30) {
        let attempts = 0;
        function check() {
            if (window.ProductDatabase) {
                // IMPORTANT: Convert ProductDatabase object to array for easier filtering
                // This allows us to search and filter through all products
                allProductsArray = window.ProductDatabase.getAllProducts();

                // Get the current product by ID from the URL
                productData = window.ProductDatabase.getProductById(productId);

                console.log("[ProductDetail] Product loaded:", {
                    productId: productData?.productId,
                    name: productData?.productName,
                    variantsCount: productData?.availableVariants?.length,
                    couponsCount: productData?.availabeCoupons?.length,
                    isCustomizable: productData?.isCustomizable,
                    customFieldsCount: productData?.customFields?.length,
                    totalProductsInDB: allProductsArray.length,
                });

                if (!productData) {
                    console.warn("[ProductDetail] Product not found, using fallback");
                    productData = getFallbackProduct();
                }
                callback();
            } else if (attempts < maxAttempts) {
                attempts++;
                console.log(
                    "[ProductDetail] Waiting for ProductDatabase... attempt",
                    attempts,
                );
                setTimeout(check, 100);
            } else {
                console.error("[ProductDetail] ProductDatabase not available");
                productData = getFallbackProduct();
                callback();
            }
        }
        check();
    }

    function getFallbackProduct() {
        return {
            productId: productId,
            productName: "Artezo Premium Product",
            brandName: "Artezo",
            currentSku: "ART-PROD",
            selectedColor: "Default",
            currentSellingPrice: 499,
            currentMrpPrice: 899,
            currentStock: 150,
            mainImage:
                "https://images.unsplash.com/photo-1567538096630-e0c55bd6374c?w=600",
            mockupImages: [
                "https://images.unsplash.com/photo-1567538096630-e0c55bd6374c?w=600",
                "https://images.unsplash.com/photo-1592078615290-033ee584e267?w=600",
            ],
            availableVariants: [
                {
                    variantId: "VAR-GOLD",
                    color: "Golden",
                    sku: "ART-GOLD",
                    price: 499,
                    mrp: 899,
                    stock: 150,
                    mainImage:
                        "https://images.unsplash.com/photo-1567538096630-e0c55bd6374c?w=600",
                    size: "Standard",
                    sizes: ["Standard", "Large"],
                },
                {
                    variantId: "VAR-BLACK",
                    color: "Matte Black",
                    sku: "ART-BLACK",
                    price: 449,
                    mrp: 799,
                    stock: 85,
                    mainImage:
                        "https://images.unsplash.com/photo-1592078615290-033ee584e267?w=600",
                    size: "Standard",
                    sizes: ["Standard", "Large"],
                },
            ],
            hero_banners: [
                {
                    bannerId: 1,
                    bannerImg:
                        "https://images.unsplash.com/photo-1567538096630-e0c55bd6374c?w=600",
                },
                {
                    bannerId: 2,
                    bannerImg:
                        "https://images.unsplash.com/photo-1592078615290-033ee584e267?w=600",
                },
            ],
            availabeCoupons: [
                {
                    couponId: 1001,
                    couponDescription: "Get 10% off on first purchase",
                    discount: "10%",
                    couponCode: "FIRST10",
                    minPurchase: 499,
                },
                {
                    couponId: 1002,
                    couponDescription: "Special discount for members",
                    discount: "20%",
                    couponCode: "MEMBER20",
                    minPurchase: 999,
                },
            ],
            productReviews: [
                {
                    reviewId: "101",
                    reviewerName: "Priya S.",
                    reviewerImage: "https://randomuser.me/api/portraits/women/44.jpg",
                    rating: 5,
                    description: "Absolutely love the quality!",
                    approved: true,
                    location: "Chennai",
                    time: "2 days ago",
                    likes: 24,
                    verified: true,
                },
            ],
            faqAns: {
                "Is this product easy to care for?": "Machine washable in cold water.",
                "Is installation difficult?":
                    "No, installation is straightforward with basic tools.",
            },
            installationSteps: [
                {
                    step: 1,
                    title: "Prepare the Wall",
                    shortDescription: "Clean the wall surface",
                    stepImage:
                        "https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=400",
                    shortNote: "Use a level for accuracy",
                },
            ],
            isCustomizable: false,
            customFields: [],
        };
    }

    //=====================================================//
    //      patch function
    //=====================================================//

    // ==================== SEO URL FUNCTIONS - ADD TO YOUR CURRENT FILE ====================

    // ─── SLUGIFY HELPER ───────────────────────────────────────────────────────────
    function slugify(text) {
        if (!text) return "product";
        return text
            .toString()
            .toLowerCase()
            .trim()
            .replace(/\s+/g, "-")
            .replace(/[^\w\-]+/g, "")
            .replace(/\-\-+/g, "-")
            .replace(/^-+/, "")
            .replace(/-+$/, "");
    }

    // ─── GENERATE SEO URL FOR PRODUCT ────────────────────────────────────────────
    function generateProductSEOUrl(product) {
        if (!product) return null;

        const brandSlug = slugify(product.brandName || "artezo");
        const categorySlug = slugify(product.productCategory || "products");

        let cleanName = product.productName || "product";
        if (
            cleanName
                .toLowerCase()
                .startsWith((product.brandName || "").toLowerCase())
        ) {
            cleanName = cleanName.substring((product.brandName || "").length).trim();
        }
        const productSlug = slugify(cleanName || product.productName);
        const sku =
            product.currentSku ||
            `PROD-${product.productPrimeId || product.productId}`;

        // Use file path so it works on Live Server + Hostinger without extra rewrite rules
        return `/Product-Details/product-detail.html?id=${product.productPrimeId || product.productId}&sku=${sku}&brand=${brandSlug}&category=${categorySlug}&product=${productSlug}`;
    }

    // ─── REWRITE URL TO SEO FORMAT ───────────────────────────────────────────────
    function rewriteURLToSEO(variantSku) {
        if (!safeProductData) return;

        const baseSku =
            safeProductData.currentSku || `PROD-${safeProductData.productId}`;

        // Keep the REAL file path — no fake /products/ path that breaks refresh
        // and relative links. Only update query params for SEO signals.
        const params = new URLSearchParams({
            id: safeProductData.productId,
            sku: baseSku,
            brand: slugify(safeProductData.brandName),
            category: slugify(safeProductData.productCategory || "products"),
            product: slugify(safeProductData.productName),
        });

        if (variantSku && variantSku !== `VAR-${safeProductData.productId}`) {
            params.set("variant", variantSku);
        }

        // Result: /Product-Details/product-detail.html?id=1&sku=ART-WPLATE-GLD&brand=artezo&...
        const newURL = `/products/product-detail.html?${params.toString()}`;
        history.replaceState(
            { productId: safeProductData.productId },
            document.title,
            newURL,
        );
        console.log("[ProductDetail] URL updated to:", newURL);
    }

    // ─── PARSE SEO PARAMETERS FROM URL ───────────────────────────────────────────
    function getSEOParameters() {
        const searchParams = new URLSearchParams(window.location.search);
        return {
            brand: searchParams.get("brand"),
            product: searchParams.get("product"),
            sku: searchParams.get("sku"),
            variant: searchParams.get("variant"),
            category: searchParams.get("category"),
        };
    }

    // ─── UPDATE SEO META TAGS ─────────────────────────────────────────────────────
    function updateSEOMetaTags(productData, seoData) {
        if (!productData) return;

        // Build clean title
        let title = `${productData.brandName} ${productData.productName}`;
        if (seoData?.variant) {
            const variantName = seoData.variant.replace(/-/g, " ");
            title += ` - ${variantName}`;
        }
        title += ` | Buy Online at Best Price in India`;
        document.title = title;

        // Meta description
        let metaDesc = document.querySelector('meta[name="description"]');
        if (!metaDesc) {
            metaDesc = document.createElement("meta");
            metaDesc.name = "description";
            document.head.appendChild(metaDesc);
        }
        const price = productData.currentSellingPrice;
        const discount =
            productData.currentMrpPrice > price
                ? `${Math.round(((productData.currentMrpPrice - price) / productData.currentMrpPrice) * 100)}% off`
                : "";
        metaDesc.content = `Buy ${productData.brandName} ${productData.productName} online at best price. ${discount}. Free shipping. COD available. Shop now!`;

        // Meta keywords
        let metaKeywords = document.querySelector('meta[name="keywords"]');
        if (!metaKeywords) {
            metaKeywords = document.createElement("meta");
            metaKeywords.name = "keywords";
            document.head.appendChild(metaKeywords);
        }
        const keywords = [
            productData.brandName,
            productData.productName,
            productData.productCategory,
            productData.productSubCategory,
            ...(productData.globalTags || []),
        ]
            .filter(Boolean)
            .join(", ");
        metaKeywords.content = keywords;

        // Canonical URL
        let canonical = document.querySelector('link[rel="canonical"]');
        if (!canonical) {
            canonical = document.createElement("link");
            canonical.rel = "canonical";
            document.head.appendChild(canonical);
        }
        const canonicalUrl = `${window.location.origin}${window.location.pathname}?id=${productData.productId}`;
        canonical.href = canonicalUrl;

        // Open Graph tags
        let ogTitle = document.querySelector('meta[property="og:title"]');
        if (!ogTitle) {
            ogTitle = document.createElement("meta");
            ogTitle.setAttribute("property", "og:title");
            document.head.appendChild(ogTitle);
        }
        ogTitle.setAttribute("content", title);

        let ogUrl = document.querySelector('meta[property="og:url"]');
        if (!ogUrl) {
            ogUrl = document.createElement("meta");
            ogUrl.setAttribute("property", "og:url");
            document.head.appendChild(ogUrl);
        }
        ogUrl.setAttribute("content", canonicalUrl);
    }

    // ─── ADD STRUCTURED DATA (JSON-LD) ───────────────────────────────────────────
    function addStructuredData() {
        // Remove existing structured data
        const existingScript = document.querySelector(
            'script[type="application/ld+json"]',
        );
        if (existingScript) existingScript.remove();

        const structuredData = {
            "@context": "https://schema.org/",
            "@type": "Product",
            name: safeProductData.productName,
            image: safeProductData.mainImage,
            description: safeProductData.aboutItem?.join(" ") || "",
            sku: safeProductData.currentSku,
            mpn: safeProductData.productStrId,
            brand: {
                "@type": "Brand",
                name: safeProductData.brandName,
            },
            offers: {
                "@type": "Offer",
                url: window.location.href,
                priceCurrency: "INR",
                price: safeProductData.currentSellingPrice,
                priceValidUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
                    .toISOString()
                    .split("T")[0],
                availability:
                    safeProductData.currentStock > 0
                        ? "https://schema.org/InStock"
                        : "https://schema.org/OutOfStock",
                seller: {
                    "@type": "Organization",
                    name: "Artezo",
                },
            },
            aggregateRating: {
                "@type": "AggregateRating",
                ratingValue: "4.5",
                reviewCount: safeProductData.productReviews?.length || 50,
            },
        };

        const script = document.createElement("script");
        script.type = "application/ld+json";
        script.textContent = JSON.stringify(structuredData);
        document.head.appendChild(script);
    }

    //====================================================//
    //          patch end
    //====================================================//

    // ==================== GET SIMILAR PRODUCTS ====================
    function getSimilarProducts(currentProduct, limit = 4) {
        if (!allProductsArray.length) return [];

        // Filter products from same subcategory, excluding current product
        const similar = allProductsArray.filter(
            (product) =>
                product.id !== currentProduct.productId &&
                product.subcategory === currentProduct.subcategory,
        );

        // Sort by popularity (higher popular value first) and take first 'limit' items
        const sortedSimilar = similar.sort(
            (a, b) => (b.popular || 0) - (a.popular || 0),
        );

        // Transform to the format expected by fillSimilarProducts
        return sortedSimilar.slice(0, limit).map((product) => ({
            productId: product.id,
            name: product.name,
            price: product.price,
            original: product.original,
            img: product.image,
            subcategory: product.subcategory,
            rating: product.rating,
            reviews: product.reviews,
        }));
    }

    // ==================== HERO BANNER SECTION ====================
    /**
     * Dynamically creates the hero banner section from product data
     * Supports multiple banners with auto-sliding functionality
     */
    function fillHeroBanner() {
        const heroSection = document.getElementById("heroSection");

        if (!heroSection) {
            console.warn("[HeroBanner] Hero section element not found");
            return;
        }

        const heroBanners = safeProductData.hero_banners || [];

        console.log("[HeroBanner] Found", heroBanners.length, "hero banners");
        console.log("[HeroBanner] Hero banners data:", heroBanners);

        // If banners exist
        if (heroBanners.length > 0) {
            let heroHTML = `
      <div class="w-full flex flex-col gap-6 hero-banner-stack">
    `;

            heroBanners.forEach((banner, index) => {
                const bannerImg = banner.bannerImg;

                console.log(`[HeroBanner] Banner ${index + 1} image URL:`, bannerImg);

                heroHTML += `
        <div class="banner-div">

  <!-- Image Container -->
  <div class="banner-img-wrapper">
    <img
      src="${bannerImg}"
      alt="Hero Banner ${index + 1}"
      class="banner-img"
      onerror="this.onerror=null; console.error('Failed to load banner image:', '${bannerImg}')"
    />
  </div>

  ${banner.imgDescription
                        ? `
      <div class="banner-desc">
        <p class="banner-text">
          ${banner.imgDescription}
        </p>
      </div>
      `
                        : ""
                    }

</div>
      `;
            });

            heroHTML += `</div>`;

            heroSection.innerHTML = heroHTML;

            console.log(
                "[HeroBanner] Hero section updated with",
                heroBanners.length,
                "banners",
            );
        } else {
            // fallback if no banners exist
            console.log("[HeroBanner] No hero banners found");

            heroSection.innerHTML = `
      <div class="w-full overflow-hidden rounded-3xl">

        <img
          src="${safeProductData.bannerImg || "https://images.unsplash.com/photo-1618221195710-dd6b41faaea6"}"
          alt="Home Decor Background"
          class="w-full h-auto object-cover"
        />

        <div class="px-4 py-6 text-center">

          <p class="text-sm tracking-[0.3em] text-gray-500 uppercase mb-4">
            ${safeProductData.productCategory || safeProductData.subcategory || "Modern Home Decor"}
          </p>

          <h1 class="text-3xl md:text-5xl font-zain font-semibold text-gray-900 leading-tight mb-4">
            ${safeProductData.productName || "Elevate Your Space"}
          </h1>

          <p class="text-gray-600 font-lexend text-base md:text-lg leading-relaxed max-w-xl mx-auto">
            ${safeProductData.aboutItem?.[0] ||
                safeProductData.description?.[0] ||
                "Discover thoughtfully curated decor pieces that bring warmth and elegance into your space."
                }
          </p>

        </div>
      </div>
    `;
        }
    }
    // ==================== GET SELECTED VARIANT ====================

    function getSelectedVariant() {
        const selectedCard = document.querySelector(
            "[data-variant-id].ring-2, .variant-card.selected",
        );
        let variantId = null;

        if (selectedCard && selectedCard.dataset.variantId) {
            variantId = selectedCard.dataset.variantId;
        } else {
            const ringCard = document.querySelector("[data-variant-id].ring-2");
            if (ringCard && ringCard.dataset.variantId) {
                variantId = ringCard.dataset.variantId;
            }
        }

        if (variantId && safeProductData.availableVariants) {
            const variant = safeProductData.availableVariants.find(
                (v) => v.variantId === variantId,
            );
            if (variant) return variant;
        }
        return currentVariant;
    }

    // ==================== CUSTOMIZATION FUNCTIONS ====================

    // Function to calculate discount percentage based on MRP and selling price
    function getDiscountPercent() {
        const selling = Number(safeProductData.currentSellingPrice) || 0;
        const mrp = Number(safeProductData.currentMrpPrice) || 0;

        if (mrp > selling) {
            return Math.round(((mrp - selling) / mrp) * 100);
        }

        return (
            safeProductData.discountPercentage ||
            safeProductData.discountPercent ||
            safeProductData.discount ||
            0
        );
    }

    // Function to build the customization overlay HTML and insert into DOM
    function buildCustomizationOverlay() {
        if (document.getElementById("customizationOverlay")) return;


        // Note:customization overlay mobile fixes

        const overlayHTML = `
  <div id="customizationOverlay" class="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 hidden opacity-0 transition-all duration-300 flex items-center justify-center p-4">
<div class="bg-white rounded-2xl w-full max-w-4xl h-[95vh] overflow-hidden shadow-2xl transform transition-all duration-300 scale-95 border border-[#e5e7eb] flex flex-col">      <!-- HEADER -->
      <!-- HEADER -->
<div class="sticky top-0 bg-gradient-to-b from-[#fff7d6] via-[#fffdf5] to-white border-b border-[#e5e7eb] px-3 sm:px-4 py-3 z-10 rounded-t-2xl shadow-sm">

  <div class="flex items-start justify-between gap-3">

    <!-- Product Info -->
    <div class="flex-1 min-w-0">

      <h2 class="text-lg sm:text-xl font-semibold font-zain text-[#1D3C4A] leading-tight break-words mb-2">
        ${safeProductData.productName || safeProductData.name || "Product"}
      </h2>

      <div class="flex flex-wrap items-center gap-2">

        <span class="text-xl sm:text-2xl font-bold font-lexend text-[#1D3C4A]">
          ₹${safeProductData.currentSellingPrice || 0}
        </span>

        ${safeProductData.currentMrpPrice &&
                safeProductData.currentMrpPrice >
                (safeProductData.currentSellingPrice || 0)
                ? `
        <span class="text-sm sm:text-base text-gray-400 font-lexend line-through">
          ₹${safeProductData.currentMrpPrice}
        </span>
        `
                : ""
            }

        ${getDiscountPercent()
                ? `
        <span class="bg-[#e39f32] text-white text-xs font-semibold px-2 py-1 rounded-md">
          ${getDiscountPercent()}% OFF
        </span>
        `
                : ""
            }

      </div>

    </div>

    <!-- Close Button -->
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

          <!-- LEFT SIDE - Preview + Summary -->
          <div class="space-y-4">
      <div class="bg-gray-100 rounded-xl overflow-hidden aspect-square border border-[#e5e7eb] max-w-md mx-auto lg:max-w-none">
              <img id="customPreviewImage"
                   src="${safeProductData.mainImage}"
                   alt="Product preview"
                   class="w-full h-full object-cover">
            </div>

            <div class="bg-gray-50 rounded-xl p-4 border border-[#e5e7eb]">
              <h3 class="font-semibold text-[#1D3C4A] mb-2">
                Customization Summary
              </h3>
              <div id="customSummary"
                   class="text-sm text-gray-600 space-y-1 max-h-40 overflow-y-auto">
              </div>
              <div class="mt-3 pt-3 border-t border-[#e5e7eb]">
                <div class="flex justify-between items-center">
                  <span class="font-semibold text-gray-700">Total Price</span>
                  <span id="customTotalPrice" class="text-2xl font-bold text-[#e39f32]">
                    ₹${safeProductData.currentSellingPrice}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <!-- RIGHT SIDE - Custom Fields + WhatsApp Section -->
          <div class="space-y-6">

            <!-- Custom Fields Container (Upload + other fields) -->
            <div id="customFieldsContainer" 
                 class="space-y-5 max-h-[45vh] lg:max-h-[52vh] overflow-y-auto pr-1 sm:pr-2 custom-scrollbar">
            </div>

            <!-- WhatsApp Number Section -->
      <div class="bg-white border border-[#e5e7eb] rounded-xl p-5 shadow-sm">

       <div class="flex items-start gap-3">

          <!-- WhatsApp Icon -->
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

            <!-- Input Field -->
            <div class="mt-4 flex items-center border border-[#e5e7eb] rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-green-500">

              <!-- Country Code -->
              <span class="px-3 bg-gray-50 text-gray-600 text-sm border-r">
                +91
              </span>

              <!-- Number Input -->
              <input
                type="tel"
                id="customerWhatsappNumber"
                placeholder="Enter your WhatsApp number"
                maxlength="10"
                class="w-full px-3 py-2 outline-none text-sm"
              />

            </div>

              <!-- Helper Text -->
            <p class="text-xs text-gray-400 mt-2">
              Our designer will send the customized design preview to this number before final processing.
            </p>

    </div>

  </div>
</div>

<!-- Note Section - 1/6/26 -->
<div class="bg-orange-50 border border-orange-200 rounded-lg p-3 flex gap-3">
  <i class="fas fa-exclamation-circle text-orange-600 mt-0.5"></i>
  <p class="text-xs text-gray-700 leading-relaxed">
    <span class="font-semibold">Important:</span> Customized products cannot be returned or exchanged after confirmation. A design preview will be shared on WhatsApp for approval before production.
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
  </div>
`;

        document.body.insertAdjacentHTML("beforeend", overlayHTML);

        const closeBtn = document.getElementById("closeCustomOverlayBtn");
        const cancelBtn = document.getElementById("cancelCustomBtn");

        if (closeBtn) closeBtn.addEventListener("click", closeCustomizationOverlay);
        if (cancelBtn)
            cancelBtn.addEventListener("click", closeCustomizationOverlay);

        if (!document.getElementById("customizationStyles")) {
            const style = document.createElement("style");
            style.id = "customizationStyles";

            style.textContent = `
      .custom-scrollbar::-webkit-scrollbar {
        width: 6px;
      }

      .custom-scrollbar::-webkit-scrollbar-track {
        background: #f1f1f1;
        border-radius: 3px;
      }

      .custom-scrollbar::-webkit-scrollbar-thumb {
        background: #e39f32;
        border-radius: 3px;
      }

      .custom-field-card {
        transition: all 0.2s ease;
        border:1px solid #e5e7eb;
      }

      .custom-field-card:hover {
        transform: translateY(-2px);
        box-shadow:0 6px 18px rgba(0,0,0,0.06);
      }

      .custom-input:focus {
        border-color:#e39f32;
        outline:none;
      }
    `;

            document.head.appendChild(style);
        }
    }

    // ========== FILE UPLOAD SECTION FOR CUSTOMIZATION ==========

    function addFileUploadField(container, options) {
        const fileUploadHTML = `
    <div class="custom-field-card border border-gray-200 rounded-xl p-4 bg-white">
      <div class="flex items-center justify-between mb-3">
        <div>
          <h3 class="font-semibold text-gray-900">${options.label || "Upload Custom Image"}</h3>
          <p class="text-xs text-gray-500 mt-1">${options.description || "Upload your own image for personalization"}</p>
        </div>
        ${options.required ? '<span class="text-xs text-red-500">Required</span>' : '<span class="text-xs text-gray-400">Optional</span>'}
      </div>
      
      <!-- Upload Area -->
      <div class="file-upload-area border-2 border-dashed border-gray-300 rounded-xl p-6 text-center cursor-pointer hover:border-[#e39f32] transition-all duration-300"
           id="fileUploadArea_${options.id}">
        <input type="file" 
               id="fileInput_${options.id}" 
               class="hidden" 
               accept="${options.accept || "image/*"}"
               ${options.required ? "required" : ""}>
        <div class="flex flex-col items-center gap-3">
          <div class="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
            <i class="fas fa-cloud-upload-alt text-3xl text-gray-400"></i>
          </div>
          <div>
            <p class="text-sm font-medium text-gray-700">Click to upload or drag & drop</p>
            <p class="text-xs text-gray-500 mt-1">${options.accept === "image/*" ? "PNG, JPG, JPEG up to 5MB" : options.accept || "Any file up to 5MB"}</p>
          </div>
        </div>
      </div>
      
      <!-- Preview Section -->
      <div id="filePreview_${options.id}" class="hidden mt-4">
        <div class="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
          <div class="w-16 h-16 rounded-lg overflow-hidden bg-gray-200 flex-shrink-0">
            <img id="previewImage_${options.id}" src="" alt="Preview" class="w-full h-full object-cover">
          </div>
          <div class="flex-1">
            <p id="fileName_${options.id}" class="text-sm font-medium text-gray-700"></p>
            <p id="fileSize_${options.id}" class="text-xs text-gray-500"></p>
          </div>
          <button type="button" 
                  id="removeFileBtn_${options.id}" 
                  class="text-gray-400 hover:text-red-500 transition">
            <i class="fas fa-trash-alt"></i>
          </button>
        </div>
      </div>
      
      <!-- Upload Progress -->
      <div id="uploadProgress_${options.id}" class="hidden mt-3">
        <div class="flex items-center gap-2">
          <div class="flex-1 bg-gray-200 rounded-full h-2">
            <div id="progressBar_${options.id}" class="bg-[#e39f32] h-2 rounded-full transition-all duration-300" style="width: 0%"></div>
          </div>
          <span id="progressPercent_${options.id}" class="text-xs text-gray-500">0%</span>
        </div>
      </div>
      
      <!-- Error Message -->
      <div id="uploadError_${options.id}" class="hidden mt-2 text-xs text-red-500"></div>
    </div>
  `;

        container.insertAdjacentHTML("beforeend", fileUploadHTML);

        // Setup event handlers
        const fileInput = document.getElementById(`fileInput_${options.id}`);
        const uploadArea = document.getElementById(`fileUploadArea_${options.id}`);
        const previewDiv = document.getElementById(`filePreview_${options.id}`);
        const removeBtn = document.getElementById(`removeFileBtn_${options.id}`);
        const progressDiv = document.getElementById(`uploadProgress_${options.id}`);
        const errorDiv = document.getElementById(`uploadError_${options.id}`);

        let selectedFile = null;

        // Click to upload
        if (uploadArea) {
            uploadArea.addEventListener("click", () => {
                fileInput.click();
            });

            // Drag and drop
            uploadArea.addEventListener("dragover", (e) => {
                e.preventDefault();
                uploadArea.classList.add("border-[#e39f32]", "bg-[#fef9e8]");
            });

            uploadArea.addEventListener("dragleave", (e) => {
                e.preventDefault();
                uploadArea.classList.remove("border-[#e39f32]", "bg-[#fef9e8]");
            });

            uploadArea.addEventListener("drop", (e) => {
                e.preventDefault();
                uploadArea.classList.remove("border-[#e39f32]", "bg-[#fef9e8]");
                const files = e.dataTransfer.files;
                if (files.length > 0) {
                    handleFile(files[0]);
                }
            });
        }

        // File input change
        if (fileInput) {
            fileInput.addEventListener("change", (e) => {
                if (e.target.files.length > 0) {
                    handleFile(e.target.files[0]);
                }
            });
        }

        // Remove file
        if (removeBtn) {
            removeBtn.addEventListener("click", () => {
                selectedFile = null;
                fileInput.value = "";
                uploadArea.classList.remove("hidden");
                previewDiv.classList.add("hidden");
                progressDiv.classList.add("hidden");
                errorDiv.classList.add("hidden");

                // Update main preview back to original
                if (options.updateMainPreview) {
                    options.updateMainPreview(options.originalImage || "");
                }

                // Callback
                if (options.onFileRemove) {
                    options.onFileRemove();
                }
            });
        }

        function handleFile(file) {
            // Validate file size (max 5MB)
            const maxSize = options.maxSize || 5 * 1024 * 1024;
            if (file.size > maxSize) {
                showError(`File size exceeds ${maxSize / (1024 * 1024)}MB limit`);
                return;
            }

            // Validate file type
            const acceptTypes = options.accept || "image/*";
            if (acceptTypes !== "*/*") {
                const fileType = file.type;
                const isValid = acceptTypes.split(",").some((type) => {
                    if (type.includes("/*")) {
                        const mainType = type.split("/")[0];
                        return fileType.startsWith(mainType);
                    }
                    return fileType === type.trim();
                });

                if (!isValid) {
                    showError(`Invalid file type. Please upload ${acceptTypes}`);
                    return;
                }
            }

            selectedFile = file;

            // Show preview for images
            if (file.type.startsWith("image/")) {
                const reader = new FileReader();
                reader.onload = (e) => {
                    const previewImg = document.getElementById(
                        `previewImage_${options.id}`,
                    );
                    if (previewImg) {
                        previewImg.src = e.target.result;
                    }

                    // Update main preview
                    if (options.updateMainPreview) {
                        options.updateMainPreview(e.target.result);
                    }
                };
                reader.readAsDataURL(file);
            }

            // Update preview info
            const fileNameSpan = document.getElementById(`fileName_${options.id}`);
            const fileSizeSpan = document.getElementById(`fileSize_${options.id}`);

            if (fileNameSpan) fileNameSpan.textContent = file.name;
            if (fileSizeSpan) fileSizeSpan.textContent = formatFileSize(file.size);

            // Show preview, hide upload area
            uploadArea.classList.add("hidden");
            previewDiv.classList.remove("hidden");
            errorDiv.classList.add("hidden");

            // Simulate upload progress
            simulateUpload(() => {
                if (options.onFileUpload) {
                    options.onFileUpload(selectedFile);
                }
            });
        }

        function simulateUpload(onComplete) {
            progressDiv.classList.remove("hidden");

            let progress = 0;
            const progressBar = document.getElementById(`progressBar_${options.id}`);
            const progressPercent = document.getElementById(
                `progressPercent_${options.id}`,
            );

            const interval = setInterval(() => {
                progress += 10;
                if (progressBar) progressBar.style.width = `${progress}%`;
                if (progressPercent) progressPercent.textContent = `${progress}%`;

                if (progress >= 100) {
                    clearInterval(interval);
                    setTimeout(() => {
                        progressDiv.classList.add("hidden");
                        if (onComplete) onComplete();
                    }, 500);
                }
            }, 100);
        }

        function showError(message) {
            if (errorDiv) {
                errorDiv.textContent = message;
                errorDiv.classList.remove("hidden");
                setTimeout(() => {
                    errorDiv.classList.add("hidden");
                }, 3000);
            }
        }

        function formatFileSize(bytes) {
            if (bytes === 0) return "0 Bytes";
            const k = 1024;
            const sizes = ["Bytes", "KB", "MB", "GB"];
            const i = Math.floor(Math.log(bytes) / Math.log(k));
            return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
        }

        return {
            getFile: () => selectedFile,
            clearFile: () => {
                selectedFile = null;
                fileInput.value = "";
                uploadArea.classList.remove("hidden");
                previewDiv.classList.add("hidden");
                progressDiv.classList.add("hidden");
            },
        };
    }

    // ========== ADD FILE UPLOAD TO CUSTOMIZATION CONTAINER ==========

    function addFileUploadToCustomization() {
        const container = document.getElementById("customFieldsContainer");
        if (!container) return;

        // Store original image URL
        const originalImage =
            document.getElementById("customPreviewImage")?.src || "";

        // Add file upload field
        const fileUploadHandler = addFileUploadField(container, {
            id: "customImageUpload",
            label: "Upload Custom Image",
            description: "Upload your own image to be printed on the product",
            accept: "image/*",
            maxSize: 5 * 1024 * 1024, // 5MB
            required: false,
            originalImage: originalImage,
            onFileUpload: (file) => {
                console.log("File uploaded:", file.name);
                // Store file in customization data
                window.customizationData = window.customizationData || {};
                window.customizationData.customImage = file;
            },
            onFileRemove: () => {
                console.log("File removed");
                window.customizationData = window.customizationData || {};
                window.customizationData.customImage = null;
            },
            updateMainPreview: (imageUrl) => {
                const previewImg = document.getElementById("customPreviewImage");
                if (previewImg) {
                    previewImg.src = imageUrl;
                }
            },
        });

        // Store handler for later use
        window.fileUploadHandler = fileUploadHandler;

        return fileUploadHandler;
    }

    function buildCustomFieldsUI(customFields) {
        const container = document.getElementById("customFieldsContainer");
        if (!container) return;

        let html = "";

        customFields.forEach((field) => {
            const fieldId = `custom_${field.fieldId}`;
            const fieldName = field.fieldName;
            const fieldLabel =
                field.fieldLabel ||
                fieldName
                    .split("_")
                    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
                    .join(" ");

            currentCustomFields[fieldId] = field;

            html += `
        <div class="custom-field-card border border-gray-200 rounded-xl p-4 bg-white" data-field-id="${fieldId}" data-depends-on="${field.dependsOn || ""}">
          <label class="block font-semibold text-gray-900 mb-2">
            ${fieldLabel}
            ${field.required ? '<span class="text-red-500 text-sm ml-1">*</span>' : ""}
          </label>
          ${field.note ? `<p class="text-xs text-gray-500 mb-3">${field.note}</p>` : ""}
      `;

            switch (field.fieldInputType) {
                case "text":
                    html += `<input type="text" id="${fieldId}" name="${fieldName}" class="custom-input w-full border border-gray-300 rounded-lg p-3 text-sm focus:border-[#e39f32] focus:ring-2 focus:ring-[#e39f32] outline-none transition" placeholder="${field.placeholder || ""}" ${field.maxLength ? `maxlength="${field.maxLength}"` : ""} ${field.required ? "required" : ""} value="${field.defaultValue || ""}">`;
                    break;
                case "number":
                    html += `<input type="number" id="${fieldId}" name="${fieldName}" class="custom-input w-full border border-gray-300 rounded-lg p-3 text-sm focus:border-[#e39f32] focus:ring-2 focus:ring-[#e39f32] outline-none transition" placeholder="${field.placeholder || ""}" ${field.min ? `min="${field.min}"` : ""} ${field.max ? `max="${field.max}"` : ""} ${field.required ? "required" : ""} value="${field.defaultValue || field.min || 1}">`;
                    break;
                case "textarea":
                    html += `<textarea id="${fieldId}" name="${fieldName}" class="custom-input w-full border border-gray-300 rounded-lg p-3 text-sm focus:border-[#e39f32] focus:ring-2 focus:ring-[#e39f32] outline-none transition" placeholder="${field.placeholder || ""}" rows="3" ${field.maxLength ? `maxlength="${field.maxLength}"` : ""} ${field.required ? "required" : ""}>${field.defaultValue || ""}</textarea>`;
                    break;
                case "select":
                    html += `<select id="${fieldId}" name="${fieldName}" class="custom-input w-full border border-gray-300 rounded-lg p-3 text-sm focus:border-[#e39f32] focus:ring-2 focus:ring-[#e39f32] outline-none transition" ${field.required ? "required" : ""}>${field.options.map((opt) => `<option value="${opt}" ${field.defaultValue === opt ? "selected" : ""}>${opt}</option>`).join("")}</select>`;
                    break;
                case "radio":
                    html += `<div class="space-y-2">${field.options.map((opt) => `<label class="flex items-center gap-3 cursor-pointer"><input type="radio" name="${fieldName}" value="${opt}" class="w-4 h-4 text-[#e39f32] focus:ring-[#e39f32]" ${field.defaultValue === opt ? "checked" : ""} ${field.required ? "required" : ""}><span class="text-sm text-gray-700">${opt}</span></label>`).join("")}</div>`;
                    break;
                case "checkbox":
                    html += `<label class="flex items-center gap-3 cursor-pointer"><input type="checkbox" id="${fieldId}" name="${fieldName}" class="w-5 h-5 text-[#e39f32] focus:ring-[#e39f32] rounded" ${field.defaultValue ? "checked" : ""}><span class="text-sm text-gray-700">Enable ${fieldLabel}</span></label>${field.price ? `<p class="text-xs text-green-600 mt-2">Additional +₹${field.price}</p>` : ""}`;
                    break;
            }
            html += `</div>`;
        });

        container.innerHTML = html;

        document
            .querySelectorAll(
                "#customFieldsContainer input, #customFieldsContainer select, #customFieldsContainer textarea",
            )
            .forEach((input) => {
                input.addEventListener("change", updateCustomizationPrice);
                input.addEventListener("input", updateCustomizationPrice);
            });
        addFileUploadToCustomization();
        updateCustomizationPrice();
    }

    function updateCustomizationPrice() {
        let total = safeProductData.currentSellingPrice;
        const selections = {};

        for (const [fieldId, field] of Object.entries(currentCustomFields)) {
            const element = document.getElementById(fieldId);
            if (!element) continue;

            let value;
            if (field.fieldInputType === "checkbox") {
                value = element.checked;
                if (value && field.price) total += field.price;
                selections[field.fieldName] = value;
            } else if (field.fieldInputType === "radio") {
                const selected = document.querySelector(
                    `input[name="${field.fieldName}"]:checked`,
                );
                value = selected ? selected.value : null;
                if (field.priceMapping && value && field.priceMapping[value])
                    total += field.priceMapping[value];
                selections[field.fieldName] = value;
            } else if (field.fieldInputType === "select") {
                value = element.value;
                if (field.priceMapping && value && field.priceMapping[value])
                    total += field.priceMapping[value];
                selections[field.fieldName] = value;
            } else {
                value = element.value;
                selections[field.fieldName] = value;
            }
            customFieldValues[field.fieldName] = value;
        }

        const totalSpan = document.getElementById("customTotalPrice");
        if (totalSpan) totalSpan.textContent = `₹${total.toLocaleString()}`;
        updateCustomizationSummary(selections, total);
    }

    function updateCustomizationSummary(selections, total) {
        const summaryDiv = document.getElementById("customSummary");
        if (!summaryDiv) return;

        const items = [];
        for (const [key, value] of Object.entries(selections)) {
            if (value && value !== "" && value !== false) {
                const displayKey = key
                    .split("_")
                    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
                    .join(" ");
                items.push(
                    `<div><span class="font-medium">${displayKey}:</span> ${value}</div>`,
                );
            }
        }
        items.push(
            `<div class="mt-2 pt-2 border-t border-gray-200"><span class="font-medium">Base Price:</span> ₹${safeProductData.currentSellingPrice.toLocaleString()}</div>`,
        );
        summaryDiv.innerHTML =
            items.length > 0
                ? items.join("")
                : '<div class="text-gray-400 text-center py-4">No customizations selected</div>';
    }

    function openCustomizationOverlay() {
        console.log("[ProductDetail] Opening customization overlay");
        const customFields = safeProductData.customFields || [];
        buildCustomizationOverlay();

        if (customFields.length > 0) {
            buildCustomFieldsUI(customFields);
        } else {
            const container = document.getElementById("customFieldsContainer");
            if (container)
                container.innerHTML =
                    '<div class="text-center text-gray-500 py-8">No customization options available</div>';
        }

        customFieldValues = {};
        currentCustomFields = {};

        const overlay = document.getElementById("customizationOverlay");
        if (overlay) {
            overlay.classList.remove("hidden");
            setTimeout(() => {
                overlay.classList.remove("opacity-0");
                overlay.querySelector(".bg-white").classList.remove("scale-95");
                overlay.classList.add("opacity-100");
                overlay.querySelector(".bg-white").classList.add("scale-100");
            }, 10);
            document.body.style.overflow = "hidden";
        }

        const addBtn = document.getElementById("addCustomizedToCartBtn");
        const buyBtn = document.getElementById("buyCustomizedNowBtn");
        if (addBtn) addBtn.onclick = () => addCustomizedToCart();
        if (buyBtn) buyBtn.onclick = () => buyCustomizedNow();
    }

    function closeCustomizationOverlay() {
        const overlay = document.getElementById("customizationOverlay");
        if (overlay) {
            overlay.classList.add("opacity-0");
            overlay.querySelector(".bg-white").classList.add("scale-95");
            overlay.classList.remove("opacity-100");
            overlay.querySelector(".bg-white").classList.remove("scale-100");
            setTimeout(() => {
                overlay.classList.add("hidden");
                document.body.style.overflow = "";
            }, 300);
        }
    }

    function getCustomizedProduct() {
        const total =
            parseInt(
                document
                    .getElementById("customTotalPrice")
                    ?.textContent.replace(/[^0-9]/g, ""),
            ) || safeProductData.currentSellingPrice;
        return {
            id: safeProductData.productId,
            productId: safeProductData.productId,
            name: safeProductData.productName,
            productName: safeProductData.productName,
            basePrice: safeProductData.currentSellingPrice,
            finalPrice: total,
            quantity: parseInt(document.getElementById("quantity")?.textContent || 1),
            image: safeProductData.mainImage,
            isCustomized: true,
            customization: customFieldValues,
            customFields: customFieldValues,
            sku: `${safeProductData.currentSku}-CUSTOM-${Date.now()}`,
            selectedColor:
                customFieldValues.frameColor || safeProductData.selectedColor,
            selectedSize: customFieldValues.size || safeProductData.size,
        };
    }

    function addCustomizedToCart() {
        const customizedProduct = getCustomizedProduct();
        if (window.addToCartGlobal) {
            const result = window.addToCartGlobal(
                customizedProduct,
                customizedProduct.quantity,
            );
            if (result && result.success) {
                showToast("Customized product added to cart!", "success");
                closeCustomizationOverlay();
            } else {
                showToast(result?.message || "Error adding to cart", "error");
            }
        } else {
            showToast("Cart service not available", "error");
        }
    }

    function buyCustomizedNow() {
        const customizedProduct = getCustomizedProduct();
        if (window.addToCartGlobal) {
            const result = window.addToCartGlobal(
                customizedProduct,
                customizedProduct.quantity,
            );
            if (result && result.success) {
                setTimeout(
                    () => (window.location.href = "/Checkout/checkout.html"),
                    300,
                );
            } else {
                showToast(result?.message || "Error processing", "error");
            }
        } else {
            showToast("Cart service not available", "error");
        }
    }

    // ==================== HANDLE ADD TO CART (using global utils) ====================

    function handleAddToCart(e) {
        e.preventDefault();
        e.stopPropagation();

        if (safeProductData.isCustomizable) {
            openCustomizationOverlay();
            return;
        }

        const quantity = parseInt(
            document.getElementById("quantity")?.textContent || 1,
        );
        const selectedVariant = getSelectedVariant();

        const product = {
            id: safeProductData.productId,
            productId: safeProductData.productId,
            name: safeProductData.productName,
            productName: safeProductData.productName,
            sku: selectedVariant?.sku || safeProductData.currentSku,
            selectedColor: selectedVariant?.color || safeProductData.selectedColor,
            selectedSize: selectedVariant?.size || null,
            price: selectedVariant?.price || safeProductData.currentSellingPrice,
            unitPrice: selectedVariant?.price || safeProductData.currentSellingPrice,
            mrpPrice: selectedVariant?.mrp || safeProductData.currentMrpPrice,
            variantId: selectedVariant?.variantId || null,
            image: selectedVariant?.mainImage || safeProductData.mainImage,
            quantity: quantity,
            isCustomizable: false,
        };

        if (window.addToCartGlobal) {
            const result = window.addToCartGlobal(product, quantity);
            if (!result || !result.success) {
                showToast(result?.message || "Error adding to cart", "error");
            }
        } else {
            showToast("Cart service not available", "error");
        }
    }

    function handleBuyNow(e) {
        e.preventDefault();
        e.stopPropagation();

        if (safeProductData.isCustomizable) {
            openCustomizationOverlay();
            return;
        }

        const quantity = parseInt(
            document.getElementById("quantity")?.textContent || 1,
        );
        const selectedVariant = getSelectedVariant();

        const product = {
            id: safeProductData.productId,
            productId: safeProductData.productId,
            name: safeProductData.productName,
            productName: safeProductData.productName,
            sku: selectedVariant?.sku || safeProductData.currentSku,
            selectedColor: selectedVariant?.color || safeProductData.selectedColor,
            selectedSize: selectedVariant?.size || null,
            price: selectedVariant?.price || safeProductData.currentSellingPrice,
            unitPrice: selectedVariant?.price || safeProductData.currentSellingPrice,
            mrpPrice: selectedVariant?.mrp || safeProductData.currentMrpPrice,
            variantId: selectedVariant?.variantId || null,
            image: selectedVariant?.mainImage || safeProductData.mainImage,
            quantity: quantity,
            isCustomizable: false,
        };

        if (window.addToCartGlobal) {
            const result = window.addToCartGlobal(product, quantity);
            if (result && result.success) {
                window.location.href = "/Checkout/checkout.html";
            } else {
                showToast(result?.message || "Error processing", "error");
            }
        } else {
            showToast("Cart service not available", "error");
        }
    }

    // ==================== HANDLE WISHLIST (using global utils) ====================

    function handleWishlistToggle(e) {
        e.preventDefault();
        e.stopPropagation();
        const btn = e.currentTarget;
        const selectedVariant = getSelectedVariant();

        const product = {
            id: safeProductData.productId,
            productId: safeProductData.productId,
            name: safeProductData.productName,
            productName: safeProductData.productName,
            sku: selectedVariant?.sku || safeProductData.currentSku,
            selectedColor: selectedVariant?.color || safeProductData.selectedColor,
            price: selectedVariant?.price || safeProductData.currentSellingPrice,
            variantId: selectedVariant?.variantId || null,
            image: selectedVariant?.mainImage || safeProductData.mainImage,
        };

        const isActive =
            btn.classList.contains("active") ||
            btn.querySelector(".fa-solid.fa-heart");

        if (window.toggleWishlistGlobal) {
            const newState = window.toggleWishlistGlobal(product);
            updateWishlistButtonState(btn, newState);
            showToast(
                newState ? "Added to wishlist ❤️" : "Removed from wishlist",
                "info",
            );
        } else {
            showToast("Wishlist service not available", "error");
        }
    }

    function updateWishlistButtonState(btn, inWishlist) {
        if (inWishlist) {
            btn.classList.add("active");
            btn.innerHTML = '<i class="fa-solid fa-heart text-red-500"></i>';
        } else {
            btn.classList.remove("active");
            btn.innerHTML = '<i class="fa-regular fa-heart"></i>';
        }
    }

    function checkWishlistStatus() {
        const wishlistBtn = document.querySelector(
            ".wishlist-btn, .wishlist-icon-btn",
        );
        if (!wishlistBtn) return;

        let inWishlist = false;
        if (window.cartWishlistService && window.cartWishlistService.isInWishlist) {
            inWishlist = window.cartWishlistService.isInWishlist(
                safeProductData.productId,
            );
        }
        updateWishlistButtonState(wishlistBtn, inWishlist);
    }

    // ==================== SETUP FUNCTIONS - #patch-2 ====================
    function setupDynamicVariants() {
        const sizeButtons = document.querySelectorAll(".size-btn");
        const sizeHint = document.getElementById("sizeHint");

        function filterColorsBySize(selectedSize) {
            const colorButtons = document.querySelectorAll(".color-variant");
            let count = 0;
            let firstVisible = null;

            colorButtons.forEach((btn) => {
                const supportedSizes = btn.dataset.sizes.split(",");
                if (supportedSizes.includes(selectedSize)) {
                    btn.style.display = "block";
                    count++;
                    if (!firstVisible) firstVisible = btn;
                } else {
                    btn.style.display = "none";
                }
            });

            if (sizeHint)
                sizeHint.textContent = `${count} color${count > 1 ? "s" : ""} available`;

            if (firstVisible) firstVisible.click();
        }

        // Size buttons
        sizeButtons.forEach((btn) => {
            btn.addEventListener("click", () => {
                sizeButtons.forEach((b) =>
                    b.classList.remove(
                        "border-[#E6A62C]",
                        "bg-[#fff9ef]",
                        "text-[#033E59]",
                    ),
                );
                btn.classList.add("border-[#E6A62C]", "bg-[#fff9ef]", "text-[#033E59]");

                filterColorsBySize(btn.dataset.size);
            });
        });

        // Color buttons
        // Color buttons - REPLACE the existing click handler with this:
        document.getElementById("variantSection").addEventListener("click", (e) => {
            const btn = e.target.closest(".color-variant");
            if (!btn) return;

            document
                .querySelectorAll(".color-variant")
                .forEach((b) =>
                    b.classList.remove("ring-2", "ring-[#E6A62C]", "ring-offset-2"),
                );
            btn.classList.add("ring-2", "ring-[#E6A62C]", "ring-offset-2");

            // Update main product info
            document.getElementById("mainProductImage").src = btn.dataset.image;
            document.querySelector(".price-display").textContent =
                `₹${parseInt(btn.dataset.price).toLocaleString()}`;

            // ─── ADD THIS BLOCK - Update currentVariant when color clicked ───
            const variantId = btn.dataset.variantId;
            const newVariant = safeProductData.availableVariants?.find(
                (v) => v.variantId === variantId,
            );
            if (newVariant) {
                currentVariant = newVariant;
                // URL will be updated via updateProductDisplay() call below
            }
            // ─────────────────────────────────────────────────────────────────
        });

        // Also update the size button click handler to find the first available color
        // for that size and update currentVariant:
        sizeButtons.forEach((btn) => {
            btn.addEventListener("click", () => {
                sizeButtons.forEach((b) =>
                    b.classList.remove(
                        "border-[#E6A62C]",
                        "bg-[#fff9ef]",
                        "text-[#033E59]",
                    ),
                );
                btn.classList.add("border-[#E6A62C]", "bg-[#fff9ef]", "text-[#033E59]");

                filterColorsBySize(btn.dataset.size);

                // ─── ADD THIS - Find first visible color and update currentVariant ───
                const firstVisibleColor = document.querySelector(
                    '.color-variant[style*="display: block"], .color-variant:not([style*="display: none"])',
                );
                if (firstVisibleColor) {
                    const variantId = firstVisibleColor.dataset.variantId;
                    const newVariant = safeProductData.availableVariants?.find(
                        (v) => v.variantId === variantId,
                    );
                    if (newVariant) {
                        currentVariant = newVariant;
                        rewriteURLToSEO(currentVariant.sku || currentVariant.variantId);
                    }
                }
                // ────────────────────────────────────────────────────────────────────
            });
        });

        // Initialize with first size
        if (sizeButtons.length > 0) {
            sizeButtons[0].click();
        }
    }

    //   function updateProductDisplay() {
    //     const mainImage = document.getElementById("mainProductImage");
    //     if (mainImage && currentVariant?.mainImage)
    //       mainImage.src = currentVariant.mainImage;
    //     const priceElement = document.querySelector(
    //       ".text-3xl.font-bold, .price-display",
    //     );
    //     const mrpElement = document.querySelector(".line-through");
    //     if (priceElement && currentVariant)
    //       priceElement.textContent = `₹${currentVariant.price}`;
    //     if (mrpElement && currentVariant)
    //       mrpElement.textContent = `₹${currentVariant.mrp}`;
    //     const stockInfo = document.getElementById("stockInfo");
    //     if (stockInfo && currentVariant)
    //       stockInfo.textContent = `Only ${currentVariant.stock} items left in stock`;

    //     // Add at the end of updateProductDisplay() function
    // if (safeProductData && currentVariant) {
    //     const variantSku = currentVariant.sku || currentVariant.variantId || null;
    //     rewriteURLToSEO(variantSku);
    // }
    //   }

    // Find this function in your current file and REPLACE with this:

    function updateProductDisplay() {
        const mainImage = document.getElementById("mainProductImage");
        if (mainImage && currentVariant?.mainImage)
            mainImage.src = currentVariant.mainImage;
        const priceElement = document.querySelector(
            ".text-3xl.font-bold, .price-display",
        );
        const mrpElement = document.querySelector(".line-through");
        if (priceElement && currentVariant)
            priceElement.textContent = `₹${currentVariant.price}`;
        if (mrpElement && currentVariant)
            mrpElement.textContent = `₹${currentVariant.mrp}`;
        const stockInfo = document.getElementById("stockInfo");
        if (stockInfo && currentVariant)
            stockInfo.textContent = `Only ${currentVariant.stock} items left in stock`;

        // ─── ADD THIS BLOCK - UPDATE URL WITH VARIANT SKU ───
        if (safeProductData && currentVariant) {
            const variantSku = currentVariant.sku || currentVariant.variantId || null;
            rewriteURLToSEO(variantSku);
        }
        // ─────────────────────────────────────────────────
    }

    function applyCoupon(couponCode) {
        const coupon = safeProductData.availabeCoupons?.find(
            (c) => c.couponCode === couponCode,
        );
        if (!coupon) {
            showToast("Invalid coupon code", "error");
            return false;
        }
        let price = currentVariant?.price || safeProductData.currentSellingPrice;
        let discountPercent = parseFloat(coupon.discount);
        let discountAmount = (price * discountPercent) / 100;
        let finalPrice = price - discountAmount;
        showToast(
            `Coupon applied! You saved ₹${Math.round(discountAmount)}`,
            "success",
        );
        const priceElement = document.querySelector(
            ".text-3xl.font-bold, .price-display",
        );
        if (priceElement) priceElement.textContent = `₹${Math.round(finalPrice)}`;
        return true;
    }

    function showToast(message, type = "info") {
        if (window.showGlobalToast) {
            window.showGlobalToast(message, type);
        } else {
            console.log(`[Toast] ${type}: ${message}`);
        }
    }

    // ==================== RENDER STARS ====================

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

    // ==================== BUILD COMPLETE HTML ====================

    function buildCompleteHTML() {
        const discountPercent =
            Math.round(
                ((safeProductData.currentMrpPrice -
                    safeProductData.currentSellingPrice) /
                    (safeProductData.currentMrpPrice || 1)) *
                100,
            ) || 0;

        // Get similar products from the database
        const similarProductsList = getSimilarProducts(safeProductData, 4);

        transformedData = {
            id: safeProductData.currentSku || "PRODUCT",
            name: safeProductData.productName,
            brand: safeProductData.brandName,
            rating: 4.5,
            reviewCount: safeProductData.productReviews?.length || 0,
            price: safeProductData.currentSellingPrice,
            originalPrice: safeProductData.currentMrpPrice,
            discountPercent: discountPercent,
            stock: safeProductData.currentStock,
            colors: (safeProductData.availableVariants || []).map((v) => ({
                name: v.color || "Default",
                image: v.mainImage || safeProductData.mainImage,
                variantId: v.variantId,
                sku: v.sku,
                price: v.price || 0,
                mrp: v.mrp || 0,
                stock: v.stock || 0,
                size: v.size || "Standard",
                sizes: v.sizes || ["Standard"],
            })),
            mainImages: [
                { thumb: safeProductData.mainImage, full: safeProductData.mainImage },
                ...(safeProductData.mockupImages?.map((img) => ({
                    thumb: img,
                    full: img,
                })) || []),
            ],
            highlights: Object.entries(safeProductData.specifications || {}).map(
                ([key, value]) => ({
                    label: key
                        .split("_")
                        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
                        .join(" "),
                    value: value || "N/A",
                    accent: key === "material",
                }),
            ),
            description:
                safeProductData.aboutItem?.map((item) => `<p>${item}</p>`).join("") ||
                "<p>Premium quality product</p>",
            specifications: Object.entries(safeProductData.specifications || {}).map(
                ([key, value]) => ({
                    label: key
                        .split("_")
                        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
                        .join(" "),
                    value: value || "N/A",
                }),
            ),
            additionalInfo: [
                ...(safeProductData.aboutItem || []),
                "Premium protective packaging included",
                "1 year warranty",
            ],
            faqs: Object.entries(safeProductData.faqAns || {}).map(([q, a]) => ({
                q: q,
                a: a,
            })),
            together: [
                {
                    name: "Matching Switch Plate Cover",
                    price: 299,
                    original: 499,
                    img: safeProductData.mainImage,
                    rating: 4.3,
                    checked: true,
                },
                {
                    name: "Premium Screwdriver Set",
                    price: 199,
                    original: 399,
                    img: "https://images.unsplash.com/photo-1504917595217-d4dc5ebe6122?w=400",
                    rating: 4.5,
                    checked: false,
                },
                {
                    name: "Wall Anchors Kit",
                    price: 99,
                    original: 199,
                    img: "https://images.unsplash.com/photo-1504328345606-18bbc8c9d7d1?w=400",
                    rating: 4.2,
                    checked: false,
                },
            ],
            similarProducts: similarProductsList, // Populated from ProductDatabase
            stats: [
                { value: "5k+", label: "Happy Customers", stars: 5 },
                { value: "4.5", label: "Average Rating", stars: "4.5" },
                { value: "500+", label: "Verified Reviews", extra: "Trusted" },
                { value: "95%", label: "Recommend Us", progress: 95 },
            ],
            reviews: (
                safeProductData.productReviews?.filter((r) => r.approved) || []
            ).map((r) => ({
                name: r.reviewerName || "Anonymous",
                img:
                    r.reviewerImage || "https://randomuser.me/api/portraits/lego/1.jpg",
                rating: r.rating || 4,
                location: r.location || "India",
                time: r.time || "recently",
                text: r.description || "Great product!",
                likes: r.likes || 0,
                verified: r.verified || true,
            })),
            installSteps: (safeProductData.installationSteps || []).map(
                (step, idx) => ({
                    step: step.step,
                    title: step.title || "Step",
                    desc: step.shortDescription || "Follow instructions",
                    list: [step.shortNote || "Follow manufacturer guidelines"],
                    time:
                        idx === 0
                            ? "15–20 Minutes"
                            : idx === 1
                                ? "Basic tools required"
                                : "5 Minutes",
                    img:
                        step.stepImage ||
                        "https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=400",
                    alt: step.title || "Installation step",
                }),
            ),
        };

        console.log(
            "[ProductDetail] Similar products loaded:",
            transformedData.similarProducts.length,
        );

        const root = document.getElementById("dynamicRoot");
        if (!root) return;

        // ========== REFACTORED: SEPARATE SIZE & COLOR SECTIONS WITH DYNAMIC FILTERING #patch-1 ==========

        // Extract unique sizes
        const sizeSet = new Set();
        transformedData.colors.forEach((c) => {
            if (c.sizes && Array.isArray(c.sizes)) {
                c.sizes.forEach((s) => sizeSet.add(s));
            } else if (c.size) {
                sizeSet.add(c.size);
            }
        });

        const uniqueSizes = Array.from(sizeSet).sort();

        let variantCardsHTML = `
      <div class="mt-6 space-y-8" id="variantSection">

       <!-- SIZE SECTION - 5th june changes -->
        <div>
        <div class="flex items-center gap-2 mb-2">
            <span class="text-sm font-semibold text-[#033E59]">Size</span>
            <div class="h-px bg-gray-200 flex-1"></div>
        </div>

        <div class="flex flex-wrap gap-2" id="sizeOptions">
            ${uniqueSizes
                        .map(
                            (size, idx) => `
                <button class="size-btn px-4 py-2 text-xs font-medium border rounded-xl transition-all duration-200
                    ${idx === 0
                                    ? "border-[#E6A62C] bg-[#fff9ef] text-[#033E59] shadow-sm"
                                    : "border-gray-200 hover:border-[#E6A62C]"
                                }"
                    data-size="${size}">
                    ${size}
                </button>
                `,
                        )
                        .join("")}
                </div>
                </div>

            <!-- COLOR SECTION - 5th june changes -->
                <div>
                <div class="flex items-center justify-between mb-2">
                    <div class="flex items-center gap-2 flex-1">
                    <span class="text-sm font-semibold text-[#033E59]">Color</span>
                    <div class="h-px bg-gray-200 flex-1"></div>
                    </div>
                    <span id="sizeHint" class="text-xs text-gray-500 font-medium"></span>
                </div>

                <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2.5" id="colorSwatches">
                    ${transformedData.colors
                                .map(
                                    (c) => `
                        <button class="color-variant group bg-white rounded-xl border border-gray-200 transition-all duration-200 hover:shadow-md hover:-translate-y-0.5"
                                data-variant-id="${c.variantId}"
                                data-sku="${c.sku || ""}"
                                data-price="${c.price}"
                                data-mrp="${c.mrp}"
                                data-stock="${c.stock}"
                                data-image="${c.image}"
                                data-sizes="${(c.sizes || [c.size || "Standard"]).join(",")}">

                            <div class="aspect-[1/0.9] rounded-lg overflow-hidden mb-1.5">
                            <img src="${c.image}"
                                class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                alt="${c.name}">
                            </div>

                            <div class="text-center">
                            <div class="text-xs font-medium text-[#033E59] leading-tight">
                                ${c.name}
                            </div>

                            <div class="text-xs font-semibold text-[#E6A62C] mt-0.5">
                                ₹${c.price}
                            </div>
                            </div>

                        </button>
                        `,
                                )
                                .join("")}
                </div>
                </div>
            </div>
            `;

                // Build coupons HTML for overlay
                let couponsHTML = "";
                if (
                    safeProductData.availabeCoupons &&
                    safeProductData.availabeCoupons.length > 0
                ) {
                    couponsHTML = safeProductData.availabeCoupons
                        .map(
                            (coupon) => `
                <div class="bg-gradient-to-br from-[#e39f32]/5 to-[#1D3C4A]/5 rounded-xl p-4 border border-[#e5e7eb] coupon-card">
                <div class="flex justify-between items-start">
                    <div>
                    <span class="text-xs text-[#e39f32] uppercase tracking-wide">Limited Time</span>
                    <div class="font-lexend text-xl text-[#1D3C4A] mt-1">${coupon.discount} OFF</div>
                    <p class="text-xs text-[#1D3C4A]/60 mt-1">${coupon.couponDescription}</p>
                    ${coupon.minPurchase ? `<p class="text-[10px] text-gray-400 mt-1">Min. Purchase: ₹${coupon.minPurchase}</p>` : ""}
                    </div>
                    <div class="bg-white px-3 py-2 rounded-lg border border-[#e5e7eb]">
                    <span class="font-mono text-sm text-[#1D3C4A] coupon-code">${coupon.couponCode}</span>
                    </div>
                </div>
                <div class="flex gap-2 mt-4">
                    <button class="apply-coupon-btn flex-1 bg-[#1D3C4A] text-white text-sm font-lexend py-2.5 rounded-lg hover:bg-[#1D3C4A]/90 transition" data-coupon-code="${coupon.couponCode}">Apply Now</button>
                    <button class="copy-coupon-btn flex-1 border border-[#e5e7eb] text-[#1D3C4A] text-sm font-lexend py-2.5 rounded-lg hover:bg-gray-50 transition" data-coupon-code="${coupon.couponCode}">Copy Code</button>
                </div>
                </div>
            `,
                        )
                        .join("");
            }

                    const addToCartButtonText = safeProductData.isCustomizable
                        ? "Customize"
                        : "Add to Cart";
                    const addToCartButtonIcon = safeProductData.isCustomizable
                        ? '<i class="fas fa-sliders-h"></i>'
                        : '<i class="fa-solid fa-cart-shopping"></i>';

                    // Build main HTML
                    const html = `
                <div class="grid grid-cols-1 md:grid-cols-12 gap-6 lg:gap-10 items-start px-4 md:px-0">
                <div class="md:col-span-5">
            <div class="sticky top-20">
                <div class="flex gap-2">
            <div class="flex flex-col gap-2 w-12" id="thumbContainer">
                ${transformedData.mainImages
                            .map(
                                (img, idx) => `
                <img src="${img.thumb}" data-full="${img.full}" class="thumbnail-img w-full h-16 object-cover rounded-md ${idx === 0 ? "active" : ""} cursor-pointer" />
                `,
                            )
                            .join("")}
            </div>
            <div class="relative flex-1 bg-white rounded-xl border border-stone-100 shadow-sm flex items-center justify-center">
                <!-- Main Product Image - 5th june changes  -->
                <img id="mainProductImage" src="${transformedData.mainImages[0]?.full || transformedData.mainImages[0]?.thumb}" alt="Product" class="max-h-full max-w-full object-cover"/>
                
                <!-- Discount Badge -->
                <span class="absolute top-2 left-2 text-white text-[10px] font-semibold px-2.5 py-1 rounded-full shadow" style="background: #e6a62c">${transformedData.discountPercent}% OFF</span>
            </div>
            </div>
            </div>
            </div>

        <div class="md:col-span-7">
          <div class="pr-2 space-y-3"> <!--5th june changes - removed sticky scroll functionlality -->
            <h1 class="text-xl md:text-2xl font-normal font-zain leading-tight text-[#033E59]">${transformedData.name}</h1>
            
                          <div class="flex items-start justify-between gap-3 mb-2">
                            <div class="flex items-center gap-2 flex-wrap flex-1">
                              <div class="flex text-amber-400 text-sm gap-0.5">${renderStars(transformedData.rating)}</div>
                              <span class="text-sm font-lexend text-stone-600">${transformedData.reviewCount} reviews</span>
                              <div class="flex items-center gap-2 px-2 py-0.5 rounded-full border ml-2" style="background-color:#d6e8f9; border-color:#e5e7eb">
                                <span class="text-xs font-lexend font-semibold text-[#1D3C4A]">Brand : ${transformedData.brand}</span>
                              </div>
                            </div>
                  
                  <div class="flex items-center gap-2 flex-shrink-0">
                    <!-- Wishlist Button -->
                    <button class="wishlist-icon-btn w-9 h-9 rounded-full border border-stone-200 flex items-center justify-center hover:bg-stone-100 transition bg-white shadow-sm">
                      <i class="fa-regular fa-heart text-[#033E59]"></i>
                    </button>
                    
                    <!-- Share Button -->
                    <div class="relative" id="shareContainer" style="z-index: 30;">
                      <button id="shareButton" class="w-9 h-9 rounded-full border border-stone-200 flex items-center justify-center hover:bg-stone-100 transition bg-white shadow-sm">
                        <i class="fa-solid fa-share-nodes text-[#033E59]"></i>
                      </button>
                      <div id="sharePopup" class="absolute right-0 mt-2 w-48 bg-white shadow-xl rounded-xl border p-2 z-40 hidden">
                        <div class="flex flex-col gap-1 text-sm">
                          <button class="share-option flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-yellow-50 w-full text-left" data-share-type="link">
                            <i class="fa-solid fa-link font-lexend text-[#E6A62C]"></i>Copy link
                          </button>
                          <button class="share-option flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-yellow-50 w-full text-left" data-share-type="email">
                            <i class="fa-solid fa-envelope font-lexend text-[#E6A62C]"></i>Email
                          </button>
                          <button class="share-option flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-yellow-50 w-full text-left" data-share-type="whatsapp">
                            <i class="fa-brands fa-whatsapp font-lexend text-[#E6A62C]"></i>WhatsApp
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

            <!-- Deal of the day -->
            <div class="max-w-[520px] p-2.5 rounded-2xl bg-gradient-to-br from-[#e39f32]/5 to-[#1D3C4A]/5 border border-[#e5e7eb] relative space-y-2 overflow-hidden">
                <div class="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-[#e39f32]/10 to-[#1D3C4A]/10 rounded-bl-full"></div>
                <div class="absolute bottom-0 left-0 w-14 h-14 bg-gradient-to-tr from-[#e39f32]/10 to-[#1D3C4A]/10 rounded-tr-full"></div>
              
                <div class="relative z-10 bg-white/85 backdrop-blur rounded-xl border border-[#e5e7eb] px-2.5 py-2 flex items-center justify-between gap-2.5">
                <div class="flex items-center gap-2">
                  <div class="flex items-end gap-1">
                    <span class="text-xl md:text-2xl font-bold text-[#1D3C4A] price-display">₹${transformedData.price.toLocaleString()}</span>
                    <span class="text-xs text-[#e39f32] line-through">₹${transformedData.originalPrice.toLocaleString()}</span>
                    <span class="bg-[#e39f32] text-white text-[8px] px-1.5 py-[2px] rounded-full">${transformedData.discountPercent}% OFF</span>
                   
                    <!-- Tax info badge - 5th june changes -->
                    <div class="mt-1 inline-flex items-center gap-1.5 w-fit px-2 py-0.5 rounded-full bg-[#e39f32]/10 border border-[#e39f32]/20">
                        <i class="fa-solid fa-shield-check text-[9px] text-[#e39f32]"></i>
                              <span class="text-[10px] font-medium text-[#1D3C4A]/80">
                                Inclusive of all taxes
                              </span>
                    </div>
                  </div>
                </div>
                <div class="hidden md:block w-px h-7 bg-[#e5e7eb]"></div>
                <div class="flex items-center gap-1 text-center">
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
              
              <div class="relative z-10 bg-[#FCF8F8] border border-[#e5e7eb] rounded-xl p-2.5 flex flex-col gap-2">
                <div class="flex items-start justify-between gap-2.5">
                  <div>
                    <p class="text-[9px] tracking-wide text-[#e39f32] uppercase font-semibold">LIMITED TIME</p>
                    <h3 class="text-base md:text-lg font-bold text-[#1D3C4A] leading-tight">
                      ${safeProductData.availabeCoupons && safeProductData.availabeCoupons[0] ? safeProductData.availabeCoupons[0].discount : "20%"} OFF
                    </h3>
                    <p class="text-[10px] text-gray-500">Special discount for members</p>
                  </div>
                  <div class="font-mono text-[10px] bg-white border border-[#e5e7eb] px-2 py-[2px] rounded-md text-[#1D3C4A] shadow-sm coupon-code">
                    ${safeProductData.availabeCoupons && safeProductData.availabeCoupons[0] ? safeProductData.availabeCoupons[0].couponCode : "MEMBER20"}
                  </div>
                </div>
                <div class="flex gap-2">
                  <button class="apply-coupon-btn flex-1 flex items-center justify-center bg-[#1D3C4A] text-white text-xs py-1.5 rounded-lg hover:bg-[#1D3C4A]/90 transition" data-coupon-code="${safeProductData.availabeCoupons && safeProductData.availabeCoupons[0] ? safeProductData.availabeCoupons[0].couponCode : "MEMBER20"}">
                    Apply Now
                  </button>
                  <button id="viewMoreBtn" class="flex-1 flex items-center justify-center border border-[#e5e7eb] text-[#1D3C4A] text-xs py-1.5 rounded-lg hover:bg-[#e39f32]/5 transition gap-1">
                    Offers
                    <i class="fa-solid fa-arrow-right text-[9px] text-[#e39f32]"></i>
                  </button>
                </div>
              </div>
            </div>

            <!-- Offer Overlay -->
            <div id="offerOverlay" class="hidden fixed inset-0 bg-black/40 backdrop-blur-sm z-50 opacity-0 pointer-events-none flex items-center justify-center transition-opacity duration-300">
              <div id="offerModal" class="hidden flex flex-col bg-white w-full max-w-md mx-4 rounded-xl p-5 border border-[#e5e7eb] shadow-2xl scale-95 opacity-0 transition-all duration-300">
                <button id="closeOffersBtn" class="absolute top-4 right-4 text-[#e39f32] hover:text-[#1D3C4A] transition-colors text-xl">✕</button>
                <h3 class="text-[#1D3C4A] font-lexend text-lg mb-5 pb-2 border-b border-[#e5e7eb]">✨ Premium Offers</h3>
                <div class="space-y-4 max-h-[60vh] overflow-y-auto pr-1 thin-scrollbar">
                  ${couponsHTML}
                </div>
              </div>
            </div>
            
            <!-- Variant Cards -->
            ${variantCardsHTML}
           
            <!-- Purchase Quantity Section - 5th june changes -->
           <div class="mt-5 bg-white p-3 rounded-xl border border-[#e5e7eb] shadow-sm space-y-2.5">

            <!-- Purchase Actions -->
            <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">

                <!-- Quantity Selector -->
                <div class="flex items-center justify-between border border-[#e5e7eb] rounded-lg overflow-hidden h-10">

                <button id="decreaseBtn"
                    class="w-1/3 h-full flex items-center justify-center text-base hover:bg-stone-50 border-r border-[#e5e7eb] transition">
                    −
                </button>

                <span id="quantity"
                    class="w-1/3 h-full flex items-center justify-center text-sm font-medium border-r border-[#e5e7eb]">
                    1
                </span>

                <button id="increaseBtn"
                    class="w-1/3 h-full flex items-center justify-center text-base hover:bg-stone-50 transition">
                    +
                </button>

                </div>

                <!-- Add To Cart -->
                <button
                class="add-to-cart-btn h-10 flex items-center justify-center gap-1.5 border border-[#e5e7eb] rounded-lg bg-white text-[#1D3C4A] font-medium px-3 hover:bg-[#e39f32] hover:text-white transition">

                ${addToCartButtonIcon}

                <span class="text-sm whitespace-nowrap">
                    ${addToCartButtonText}
                </span>

                </button>

                <!-- Buy Now -->
                <button
                class="buy-now-btn h-10 flex items-center justify-center gap-1.5 bg-[#1D3C4A] text-white rounded-lg font-medium px-3 hover:bg-[#e39f32] transition">

                <i class="fa-solid fa-arrow-right text-xs"></i>

                <span class="text-sm whitespace-nowrap">
                    ${safeProductData.isCustomizable ? "Customize & Buy" : "Buy Now"}
                </span>

                </button>

            </div>

            <!-- Stock + WhatsApp -->
            <div class="flex flex-wrap items-center gap-2 text-[11px]">

                <p id="stockInfo" class="text-green-600 font-medium">
                Only ${transformedData.stock} items left
                </p>

                ${safeProductData.isCustomizable
                            ? `
                <span class="hidden sm:inline text-gray-300">•</span>

                <a href="https://wa.me/919876543210"
                    target="_blank"
                    class="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-green-50 border border-green-200 text-green-700 font-medium hover:bg-green-100 transition">

                    <i class="fa-brands fa-whatsapp text-xs"></i>

                    <span class="whitespace-nowrap">
                    Need bulk quantities?
                    </span>

                </a>
                `
                            : ""
                        }

            </div>

            </div>

            <!-- Delivery Service -->
              <div class="flex flex-wrap items-center justify-center md:justify-between gap-x-4 gap-y-2 text-[11px] sm:text-xs text-[#1D3C4A] bg-[#faf8f4] border border-[#efe5d3] rounded-xl px-3 py-2.5">

                <div class="flex items-center gap-1.5 whitespace-nowrap">
                    <i class="fa-solid fa-box text-[#e39f32] text-[10px]"></i>
                    <span>24–48h Dispatch</span>
                </div>

                <div class="flex items-center gap-1.5 whitespace-nowrap">
                    <i class="fa-solid fa-calendar-check text-[#e39f32] text-[10px]"></i>
                    <span>4–7d Delivery</span>
                </div>

                <div class="flex items-center gap-1.5 whitespace-nowrap">
                    <i class="fa-solid fa-hand-holding-dollar text-[#e39f32] text-[10px]"></i>
                    <span>COD Available</span>
                </div>

                <div class="flex items-center gap-1.5 whitespace-nowrap">
                    <i class="fa-solid fa-truck text-[#e39f32] text-[10px]"></i>
                    <span>Free Shipping</span>
                </div>

                <div class="flex items-center gap-1.5 whitespace-nowrap">
                    <i class="fa-solid fa-shield-halved text-[#e39f32] text-[10px]"></i>
                    <span>Secure Payment</span>
                </div>

                <div class="flex items-center gap-1.5 whitespace-nowrap">
                    <i class="fa-solid fa-rotate-left text-[#e39f32] text-[10px]"></i>
                    <span>Easy Returns</span>
                </div>

                </div>
            </div>

            <!-- Additional Information Accordion - 5th June Changes -->
            <section class="max-w-4xl mx-auto pt-8 pb-0 font-sans text-[#1D3C4A]">
                <div class="border border-[#e5e7eb] rounded-xl divide-y divide-[#e5e7eb] bg-white" id="accordionContainer"></div>
                </section>

                <!-- Frequently Bought Together -->
                <section class="max-w-4xl mx-auto mt-4 mb-12 px-4">
                <h2 class="text-xl font-normal font-lexend text-[#1D3C4A] mb-5">Frequently Bought Together</h2>
                <div class="bg-[#1D3C4A]/5 border border-[#e5e7eb] rounded-2xl p-4 space-y-4" id="boughtTogether"></div>
                </section>
            </div>
            </div>
        </div>
        `;

        root.innerHTML = html;

        // ========== IMPORTANT: CALL HERO BANNER FUNCTION ==========
        // This will populate the hero section with product banners
        fillHeroBanner();
    }

    
    // ==================== FILL ACCORDION - 5th June Changes ====================

    function fillAccordion() {
        const acc = document.getElementById("accordionContainer");
        if (!acc) return;

        let accHtml = `
      <div class="item"><button class="toggle w-full flex justify-between items-center px-4 py-2 text-left font-medium font-lexend text-[#1D3C4A]">Highlights<span class="icon text-xl transition-transform duration-300">+</span></button><div class="content"><div class="px-6 pb-6 text-sm"><div class="rounded-lg overflow-hidden bg-white border border-[#edf2f4] shadow-sm"><table class="w-full text-left border-collapse"><tbody>`;

        transformedData.highlights.forEach((h) => {
            let rowClass = h.accent
                ? "bg-[#fff9f2]"
                : "border-b border-[#f1f5f7] hover:bg-[#f8fbfc] transition";
            let valClass = h.accent
                ? "text-[#e39f32] font-medium"
                : "text-[#1D3C4A]/70";
            accHtml += `<tr class="${rowClass}"><td class="py-3 px-3 font-medium border-r border-[#f1f5f7] w-1/3 text-[#1D3C4A]">${h.label}<\/td><td class="py-3 px-4 ${valClass}">${h.value}<\/td><\/tr>`;
        });

        accHtml += `</tbody><\/table><\/div><\/div><\/div><\/div>`;
        accHtml += `<div class="item"><button class="toggle w-full flex justify-between items-center px-4 py-2 text-left font-medium font-lexend">Product Description<span class="icon text-xl transition-transform duration-300">+</span></button><div class="content"><div class="px-6 pb-6 text-sm text-[#1D3C4A]/80 leading-relaxed space-y-4">${transformedData.description}<\/div><\/div><\/div>`;
        accHtml += `<div class="item"><button class="toggle w-full flex justify-between items-center px-4 py-2 text-left font-medium font-lexend text-[#1D3C4A]">Specifications<span class="icon text-xl transition-transform duration-300">+</span></button><div class="content"><div class="px-6 pb-6 text-sm"><div class="rounded-lg overflow-hidden bg-white border border-[#edf2f4] shadow-sm"><table class="w-full text-left border-collapse"><tbody>`;

        transformedData.specifications.forEach((s) => {
            accHtml += `<tr class="border-b border-[#f1f5f7]"><td class="py-3 px-3 font-medium border-r border-[#f1f5f7] w-1/3 text-[#1D3C4A]">${s.label}<\/td><td class="py-3 px-4 text-[#1D3C4A]/70">${s.value}<\/td><\/tr>`;
        });

        accHtml += `</tbody><\/table><\/div><\/div><\/div><\/div>`;
        accHtml += `<div class="item"><button class="toggle w-full flex justify-between items-center px-4 py-2 text-left font-medium font-lexend text-[#1D3C4A]">Additional Information<span class="icon text-lg transition-transform duration-300">+</span></button><div class="content"><div class="px-6 pb-5 text-sm"><div class="grid gap-3">`;

        transformedData.additionalInfo.forEach((info) => {
            accHtml += `<div class="flex items-start gap-2 p-3 rounded-md bg-[#f8fbfc] border border-[#eef3f6]"><div class="w-1.5 h-1.5 mt-2 rounded-full bg-[#e39f32]"></div><p class="text-[#1D3C4A]/75 text-[13px]">${info}</p></div>`;
        });

        accHtml += `</div></div></div></div>`;
        accHtml += `<div class="item"><button class="toggle w-full flex justify-between items-center px-4 py-2 text-left font-medium font-lexend text-[#1D3C4A]">FAQs<span class="icon text-lg transition-transform duration-300">+</span></button><div class="content"><div class="px-6 pb-6 text-sm space-y-4">`;

        transformedData.faqs.forEach((faq) => {
            accHtml += `<div class="p-4 rounded-lg border border-[#eef3f6] bg-white shadow-sm"><p class="font-medium text-[#1D3C4A] text-[14px]">${faq.q}</p><p class="mt-2 text-[#1D3C4A]/70 text-[13px] leading-relaxed">${faq.a}</p></div>`;
        });

        accHtml += `</div></div></div>`;
        acc.innerHTML = accHtml;

        // Setup accordion click handlers
        document.querySelectorAll(".item").forEach((item) => {
            const btn = item.querySelector(".toggle");
            const content = item.querySelector(".content");
            const icon = item.querySelector(".icon");
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
    }

    // ==================== BOUGHT TOGETHER ====================

    function fillBoughtTogether() {
        const togetherDiv = document.getElementById("boughtTogether");
        if (!togetherDiv) return;

        let togetherHtml = "";
        transformedData.together.forEach((item) => {
            togetherHtml += `<div class="flex items-center justify-between bg-white border border-[#e5e7eb] rounded-xl p-3 hover:shadow-sm transition"><div class="flex gap-3 items-center"><img src="${item.img}" class="w-20 h-20 object-cover rounded-lg"/><div><h3 class="font-medium font-lexend text-[#1D3C4A] text-sm">${item.name}</h3><div class="flex items-center gap-2 mt-1 text-sm"><span class="font-semibold font-lexend text-[#1D3C4A]">₹${item.price}</span><span class="line-through font-lexend text-gray-400 text-xs">₹${item.original}</span><span class="bg-[#e39f32]/20 text-[#e39f32] text-[10px] px-2 py-[2px] rounded-full">${Math.round((1 - item.price / item.original) * 100)}% OFF</span></div>${item.rating ? '<div class="text-[#e39f32] text-xs mt-1">★ ' + item.rating + "</div>" : ""}</div></div><input type="checkbox" class="w-5 h-5 accent-[#1D3C4A] product-check" data-price="${item.price}" ${item.checked ? "checked" : ""} /></div>`;
        });
        togetherHtml += `<div class="pt-2"><button id="addToCartBtn" class="w-full bg-[#1D3C4A] text-white font-lexend py-3 rounded-xl text-sm font-medium hover:bg-[#16303b] transition duration-300 shadow-md hover:shadow-lg">Add To Cart (1) • Total ₹5,499</button></div>`;
        togetherDiv.innerHTML = togetherHtml;

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
    }

    // ==================== SIMILAR PRODUCTS ====================

    function fillSimilarProducts() {
        const similarSec = document.getElementById("similarSection");

        // Check if section exists and if we have similar products
        if (
            !similarSec ||
            !transformedData.similarProducts ||
            transformedData.similarProducts.length === 0
        ) {
            // Hide the section if no similar products available
            if (similarSec) {
                similarSec.style.display = "none";
                console.log(
                    "[SimilarProducts] No similar products found, hiding section",
                );
            }
            return;
        }

        // Show the section since we have products to display
        similarSec.style.display = "block";
        console.log(
            `[SimilarProducts] Rendering ${transformedData.similarProducts.length} similar products`,
        );

        // Build the HTML for similar products grid
        let similarHtml = `
    <div class="text-center mb-10">
      <h2 class="text-2xl md:text-3xl font-medium font-zain text-[#1D3C4A]">View Similar Products</h2>
      <div class="w-16 h-1 bg-[#e39f32] mx-auto mt-3 rounded-full"></div>
    </div>
    <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6 lg:gap-8">
  `;

        // Generate HTML for each similar product
        transformedData.similarProducts.forEach((p) => {
            similarHtml += `
      <div class="group relative flex flex-col bg-white rounded-2xl border border-[#e5e7eb] shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-1 overflow-hidden cursor-pointer" 
           onclick="window.location.href='/products/product-detail.html?id=${p.productId}'">
        <button class="wishlist-icon-btn absolute top-3 right-3 z-10 w-9 h-9 flex items-center justify-center bg-white border border-[#e5e7eb] rounded-full shadow-sm hover:border-[#e39f32] transition-all duration-300" 
                onclick="event.stopPropagation();">
          <i class="fa-regular fa-heart text-[#1D3C4A]"></i>
        </button>
        <div class="aspect-[4/4.5] overflow-hidden bg-gray-100">
          <img src="${p.img}" alt="${p.name}" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-in-out"/>
        </div>
        <div class="flex flex-col flex-1 p-3">
          <h3 class="text-sm font-medium font-lexend text-[#1D3C4A] line-clamp-2 mb-1">${p.name}</h3>
          <div class="flex items-baseline gap-2 mb-3">
            <span class="text-base font-semibold font-lexend text-[#1D3C4A]">₹${p.price.toLocaleString()}</span>
            <span class="text-xs text-gray-400 font-lexend line-through">₹${p.original.toLocaleString()}</span>
          </div>
          <button class="similar-product-add-btn mt-auto py-2 rounded-lg border border-[#1D3C4A] text-[#1D3C4A] text-sm font-medium font-lexend hover:bg-[#1D3C4A] hover:text-white transition-all duration-300" 
                  onclick="event.stopPropagation();">
            Add to Cart
          </button>
        </div>
      </div>
    `;
        });

        similarHtml += `</div>`;
        similarSec.innerHTML = similarHtml;
    }
    // ==================== SOCIAL PROOF ====================

    function fillSocialProof() {
        const socialSec = document.getElementById("socialSection");
        if (!socialSec) return;

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
    }

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

    // Copy to clipboard helper function
    function copyToClipboard(text) {
        // Modern approach
        if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(text).catch((err) => {
                console.error("Failed to copy:", err);
                fallbackCopyToClipboard(text);
            });
        } else {
            fallbackCopyToClipboard(text);
        }
    }

    // Fallback for older browsers
    function fallbackCopyToClipboard(text) {
        const textarea = document.createElement("textarea");
        textarea.value = text;
        textarea.style.position = "fixed";
        textarea.style.top = "-9999px";
        textarea.style.left = "-9999px";
        document.body.appendChild(textarea);
        textarea.select();
        try {
            document.execCommand("copy");
        } catch (err) {
            console.error("Fallback: Unable to copy", err);
        }
        document.body.removeChild(textarea);
    }

    // ==================== INSTALLATION ====================

    function fillInstallation() {
        const installSec = document.getElementById("installSection");
        if (
            !installSec ||
            !transformedData.installSteps ||
            transformedData.installSteps.length === 0
        )
            return;

        let installHtml = `<div class="max-w-6xl mx-auto px-6 space-y-12"><div class="text-center max-w-3xl mx-auto mb-12"><span class="text-sm tracking-widest uppercase text-[#e39f32] font-medium">Installation Process</span><h2 class="text-3xl md:text-4xl lg:text-5xl font-zain font-semibold text-[#1D3C4A] mt-4 mb-6 leading-tight">Professional Installation Process</h2><div class="w-16 h-[3px] bg-[#e39f32] mx-auto mb-6 rounded-full"></div><p class="text-gray-600 font-lexend leading-relaxed text-base md:text-lg">Our streamlined workflow ensures safe, precise, and flawless installation handled by trained professionals using industry-grade tools.</p></div>`;

        transformedData.installSteps.forEach((step, idx) => {
            let even = idx % 2 === 0;
            installHtml += `<div class="grid md:grid-cols-2 gap-12 items-center"><div class="${even ? "" : "order-2 md:order-1"}"><h3 class="text-2xl font-lexend font-semibold text-[#1D3C4A] mb-4">${step.title}</h3><p class="text-gray-600 mb-6 font-lexend font-light leading-relaxed">${step.desc}</p><ul class="space-y-3 text-gray-600 font-lexend font-light mb-6">${step.list.map((l) => '<li class="flex items-start gap-3"><span class="w-2 h-2 bg-[#e39f32] rounded-full mt-2"></span>' + l + "</li>").join("")}</ul><div class="bg-[#1D3C4A]/5 border border-[#e5e7eb] rounded-xl p-4 text-sm font-lexend text-gray-600"><span class="font-normal text-[#1D3C4A]">${step.time ? "Estimated Time:" : "Tools Required:"}</span> ${step.time}</div></div><div class="relative ${even ? "" : "order-1 md:order-2"}"><div class="h-[380px] bg-gray-50 rounded-2xl border border-[#e5e7eb] flex items-center justify-center p-6"><img src="${step.img}" alt="${step.alt}" class="max-h-full max-w-full object-contain"/></div><div class="absolute -top-4 ${even ? "-left-4" : "-right-4"} bg-[#e39f32] text-white text-sm px-4 py-1 rounded-full shadow">Step 0${step.step}</div></div></div>`;
        });

        installHtml += `<div class="grid md:grid-cols-2 gap-12 items-center pt-6"><div><span class="text-sm tracking-widest uppercase text-[#e39f32] font-medium">Video Demonstration</span><h3 class="text-2xl font-semibold font-lexend text-[#1D3C4A] mt-3 mb-4">Watch the Full Installation Process</h3><p class="text-gray-600 font-lexend font-light leading-relaxed mb-5">See our experts complete the installation step-by-step using professional tools and precision techniques to ensure stability and long-term durability.</p><ul class="space-y-3 text-gray-600 font-lexend font-light"><li class="flex items-start gap-3"><span class="w-2 h-2 bg-[#e39f32] rounded-full mt-2"></span>Real-time installation walkthrough</li><li class="flex items-start gap-3"><span class="w-2 h-2 bg-[#e39f32] rounded-full mt-2"></span>Expert handling & finishing process</li><li class="flex items-start gap-3"><span class="w-2 h-2 bg-[#e39f32] rounded-full mt-2"></span>Final quality inspection preview</li></ul></div><div class="rounded-2xl overflow-hidden border border-[#e5e7eb] shadow-md"><iframe class="w-full h-[240px] md:h-[300px]" src="https://www.youtube.com/embed/f_213aSWLrA?autoplay=1&mute=1&rel=0&modestbranding=1&controls=1" title="Installation Video" frameborder="0" allow="autoplay; encrypted-media; picture-in-picture" allowfullscreen></iframe></div></div></div>`;
        installSec.innerHTML = installHtml;
    }

    // ==================== STICKY BAR ====================

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
      class="w-full md:min-w-[190px] px-4 md:px-6 py-3 rounded-xl text-sm md:text-base font-medium font-lexend flex items-center justify-center gap-2 transition-all duration-300 hover:bg-[#1D3C4A]/10"
      style="color:#1d3c4a"
    >
      <i class="fas fa-cart-plus text-xs md:text-sm"></i>
      Add to Cart
    </button>
  </div>

  <!-- BUY NOW -->
  <div class="flex-1 md:flex-none bg-white rounded-xl border border-gray-300 overflow-hidden">
    <button
      class="w-full md:min-w-[190px] px-4 md:px-6 py-3 rounded-xl text-sm md:text-base font-medium font-lexend flex items-center justify-center gap-2 transition-all duration-300 hover:bg-gray-50"
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

    // ==================== SETUP EVENT LISTENERS ====================

    function setupEventListeners() {
        // Thumbnail click handler
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

        // Share button
        setTimeout(() => {
            const shareBtn = document.getElementById("shareButton");
            const sharePopup = document.getElementById("sharePopup");
            if (shareBtn && sharePopup) {
                shareBtn.addEventListener("click", function (e) {
                    e.stopPropagation();
                    sharePopup.classList.toggle("hidden");
                });
                document.addEventListener("click", function (e) {
                    if (!shareBtn.contains(e.target) && !sharePopup.contains(e.target)) {
                        sharePopup.classList.add("hidden");
                    }
                });
            }
        }, 100);

        // Quantity logic
        let quantity = 1;
        let stock = transformedData.stock || 0;

        const qtySpan = document.getElementById("quantity");
        const stockInfoEl = document.getElementById("stockInfo");
        const inc = document.getElementById("increaseBtn");
        const dec = document.getElementById("decreaseBtn");

        function updateQtyUI() {
            if (qtySpan) qtySpan.textContent = quantity;
            const remaining = stock - quantity;
            if (remaining > 0 && stockInfoEl) {
                stockInfoEl.textContent = `Only ${remaining} items left in stock`;
                stockInfoEl.className = "text-xs text-green-600 mt-1";
            } else if (stockInfoEl) {
                stockInfoEl.textContent = "Out of stock";
                stockInfoEl.className = "text-xs text-red-600 mt-1";
            }
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
        }
        updateQtyUI();

        // Timer update
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

        // Offer overlay
        const overlay = document.getElementById("offerOverlay");
        const modal = document.getElementById("offerModal");
        const viewBtn = document.getElementById("viewMoreBtn");
        const closeBtn = document.getElementById("closeOffersBtn");

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
    }

    // ================== == INITIALIZATION ====================

    function init() {
        waitForProductDatabase(() => {
            safeProductData = {
                ...productData,
                productId: productData.productId || productData.id || productId,
                currentSellingPrice:
                    productData.currentSellingPrice || productData.price || 0,
                currentMrpPrice: productData.currentMrpPrice || productData.mrp || 0,
                currentStock: productData.currentStock || productData.stock || 0,
                productName: productData.productName || productData.name || "Product",
                brandName: productData.brandName || "Artezo",
                mainImage:
                    productData.mainImage ||
                    productData.image ||
                    "https://images.unsplash.com/photo-1567538096630-e0c55bd6374c?w=600",
                mockupImages: productData.mockupImages || [],
                // CRITICAL: Add hero_banners to safeProductData
                hero_banners: productData.hero_banners || [],
                availableVariants: productData.availableVariants || [],
                productReviews: productData.productReviews || [],
                specifications: productData.specifications || {},
                aboutItem: productData.aboutItem || [],
                faqAns: productData.faqAns || {},
                installationSteps: productData.installationSteps || [],
                availabeCoupons: productData.availabeCoupons || [],
                isCustomizable: productData.isCustomizable || false,
                customFields: productData.customFields || [],
                productCategory: productData.productCategory || productData.subcategory,
                subcategory: productData.subcategory,
            };

            console.log(
                "[ProductDetail] Hero banners count:",
                safeProductData.hero_banners?.length,
            );
            console.log(
                "[ProductDetail] Hero banners data:",
                safeProductData.hero_banners,
            );

            // Add after safeProductData is defined
            const seoParams = getSEOParameters();
            updateSEOMetaTags(safeProductData, seoParams);
            addStructuredData();

            currentVariant = safeProductData.availableVariants?.[0] || null;

            buildCompleteHTML();
            fillAccordion();
            fillBoughtTogether();
            fillSimilarProducts();
            fillSocialProof();
            fillInstallation();
            fillStickyBar();
            setupEventListeners();
            setupShareFunctionality();

            setTimeout(() => {
                setupDynamicVariants(); //#patch 3 - Setup variant selection logic after HTML is rendered
                const initialVariantSku =
                    safeProductData.availableVariants?.[0]?.sku || null;
                rewriteURLToSEO(initialVariantSku);

                document
                    .querySelectorAll(".add-to-cart-btn")
                    .forEach((btn) => btn.addEventListener("click", handleAddToCart));
                document
                    .querySelectorAll(".buy-now-btn")
                    .forEach((btn) => btn.addEventListener("click", handleBuyNow));
                document
                    .querySelectorAll(".wishlist-btn, .wishlist-icon-btn")
                    .forEach((btn) =>
                        btn.addEventListener("click", handleWishlistToggle),
                    );
                document.querySelectorAll(".apply-coupon-btn").forEach((btn) =>
                    btn.addEventListener("click", (e) => {
                        e.preventDefault();
                        const code = btn.dataset.couponCode;
                        if (code) applyCoupon(code);
                    }),
                );
                checkWishlistStatus();
            }, 100);
        });
    }

    init();
})();