// Banner Slider Logic

  const sliderWrapper = document.querySelector('#banner-slider');
  const slider = document.querySelector('#banner-slider > div');
  const slides = document.querySelectorAll('#banner-slider > div > div');
  const dots = document.querySelectorAll('#banner-slider [data-slide]');
  
  let currentSlide = 0;
  const totalSlides = slides.length;
  let slideInterval;

  function goToSlide(index) {
    slider.style.transform = `translateX(-${index * 100}%)`;
    
    dots.forEach(dot => dot.classList.remove('bg-white'));
    dots[index].classList.add('bg-white');
    
    currentSlide = index;
  }

  // Dot Click
  dots.forEach(dot => {
    dot.addEventListener('click', () => {
      const slideIndex = parseInt(dot.dataset.slide);
      goToSlide(slideIndex);
    });
  });

  // Start Auto Slide
  function startSlider() {
    slideInterval = setInterval(() => {
      let nextSlide = (currentSlide + 1) % totalSlides;
      goToSlide(nextSlide);
    }, 3000);
  }

  // Stop Auto Slide
  function stopSlider() {
    clearInterval(slideInterval);
  }

  // Pause on Hover
  sliderWrapper.addEventListener('mouseenter', stopSlider);
  sliderWrapper.addEventListener('mouseleave', startSlider);

  // Initialize
  goToSlide(0);
  startSlider();

  //countdown timer logic
document.addEventListener('DOMContentLoaded', () => {
  const hoursEl   = document.getElementById('hours');
  const minutesEl = document.getElementById('minutes');
  const secondsEl = document.getElementById('seconds');

  if (!hoursEl || !minutesEl || !secondsEl) {
    console.warn('Countdown elements not found');
    return;
  }

  const DURATION_HOURS = 6;
  let endTime = Date.now() + DURATION_HOURS * 60 * 60 * 1000;
  let intervalId = null;

  function pad(n) {
    return String(n).padStart(2, '0');
  }

  function update() {
    const remaining = endTime - Date.now();

    if (remaining <= 0) {
      hoursEl.textContent   = '00';
      minutesEl.textContent = '00';
      secondsEl.textContent = '00';
      // Optional: add expired class / message
      hoursEl.closest('.countdown')?.classList.add('expired');
      stop();
      return;
    }

    const h = Math.floor(remaining / 3600000);
    const m = Math.floor((remaining % 3600000) / 60000);
    const s = Math.floor((remaining % 60000) / 1000);

    hoursEl.textContent   = pad(h);
    minutesEl.textContent = pad(m);
    secondsEl.textContent = pad(s);
  }

  function start() {
    if (intervalId) return;
    update(); // immediate
    intervalId = setInterval(update, 1000);
  }

  function stop() {
    if (intervalId) {
      clearInterval(intervalId);
      intervalId = null;
    }
  }

  // Start
  start();

  // Cleanup (good practice)
  window.addEventListener('beforeunload', stop);
});

// Suggested Products Scroll Logic
document.addEventListener('DOMContentLoaded', function() {
    const scrollContainer = document.getElementById('suggestedScroll');
    const leftArrow = document.getElementById('scrollLeft');
    const rightArrow = document.getElementById('scrollRight');
    const dots = document.querySelectorAll('.nav-dot');
    
    const cardWidth = 224 + 20; // 224px (w-56 = 14rem = 224px) + 20px gap
    
    // Function to update active dot based on scroll position
    function updateActiveDot() {
        const scrollPosition = scrollContainer.scrollLeft;
        const containerWidth = scrollContainer.offsetWidth;
        const maxScroll = scrollContainer.scrollWidth - containerWidth;
        
        // Calculate which card is most visible
        const visibleIndex = Math.round(scrollPosition / cardWidth);
        const boundedIndex = Math.min(Math.max(visibleIndex, 0), dots.length - 1);
        
        dots.forEach((dot, index) => {
            if (index === boundedIndex) {
                dot.classList.remove('bg-gray-300');
                dot.classList.add('bg-accent', 'w-4'); // Active dot wider and colored
            } else {
                dot.classList.remove('bg-accent', 'w-4');
                dot.classList.add('bg-gray-300', 'w-2.5');
            }
        });
        
        // Update arrow states
        leftArrow.disabled = scrollPosition <= 0;
        rightArrow.disabled = scrollPosition >= maxScroll - 5;
    }
    
    // Arrow click handlers
    leftArrow.addEventListener('click', () => {
        const newPosition = Math.max(scrollContainer.scrollLeft - cardWidth * 2, 0);
        scrollContainer.scrollTo({
            left: newPosition,
            behavior: 'smooth'
        });
    });
    
    rightArrow.addEventListener('click', () => {
        const maxScroll = scrollContainer.scrollWidth - scrollContainer.offsetWidth;
        const newPosition = Math.min(scrollContainer.scrollLeft + cardWidth * 2, maxScroll);
        scrollContainer.scrollTo({
            left: newPosition,
            behavior: 'smooth'
        });
    });
    
    // Dot click handlers
    dots.forEach((dot, index) => {
        dot.addEventListener('click', () => {
            const scrollPosition = index * cardWidth;
            scrollContainer.scrollTo({
                left: scrollPosition,
                behavior: 'smooth'
            });
        });
    });
    
    // Scroll event listener
    scrollContainer.addEventListener('scroll', () => {
        requestAnimationFrame(updateActiveDot);
    });
    
    // Initial update
    setTimeout(updateActiveDot, 100);
    
    // Update on window resize
    window.addEventListener('resize', updateActiveDot);
});

//trending products scroll logic
 function scrollRow(row, direction) {

      const container = document.getElementById(row);

      container.scrollBy({
        left: direction * 350,
        behavior: "smooth"
      });

    }

    //Photo Frame Scroll Logic
    const container = document.getElementById("photoFramesContainer");
  const leftBtn = document.getElementById("pfLeft");
  const rightBtn = document.getElementById("pfRight");

  const scrollAmount = 220; // Adjust according to card width + gap

  leftBtn.addEventListener("click", () => {
    container.scrollBy({ left: -scrollAmount, behavior: "smooth" });
  });

  rightBtn.addEventListener("click", () => {
    container.scrollBy({ left: scrollAmount, behavior: "smooth" });
  });

  //deal scroll logic
  