
 
 
 



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
 








//Patch 2
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














function renderPage() {
    if (!safeProductData) {
      console.error("[Gallery] safeProductData not ready");
      return;
    }
 
    // Update SEO meta tags with the extracted data
    if (window.currentSEOData) {
      updateSEOMetaTags(safeProductData, window.currentSEOData);
    }
 
    // Initialize lightbox
    initLightbox();
 
    // Store lightbox functions globally for onclick
    window.openLightbox = window.openLightbox || function () {};
    window.closeLightbox = window.closeLightbox || function () {};
 
    // Rewrite browser URL
    const initialVariantSku =
      safeProductData.availableVariants?.[0]?.sku || null;
    rewriteURLToSEO(initialVariantSku);
 
    // Build base HTML FIRST -- patch remove duplicate 23/6
    buildCompleteHTML();
 
    // Critical: Wait for DOM to be ready before building media gallery
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
        document
          .querySelectorAll(".buy-now-btn")
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