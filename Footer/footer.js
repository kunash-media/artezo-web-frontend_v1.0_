// Footer JavaScript
(function() {
    'use strict';
 
    // Initialize footer functionality
    function initFooter() {
        updateCopyrightYear();
        initScrollToTop();
        handleExternalLinks();
    }
 
    // Update copyright year dynamically
    function updateCopyrightYear() {
        const yearElement = document.getElementById('currentYear');
        if (yearElement) {
            yearElement.textContent = new Date().getFullYear();
        }
    }
 
    // Handle smooth scroll to top
    function initScrollToTop() {
        // You can add a scroll-to-top button functionality here if needed
        const scrollLinks = document.querySelectorAll('a[href^="#"]');
       
        scrollLinks.forEach(link => {
            link.addEventListener('click', function(e) {
                const href = this.getAttribute('href');
               
                if (href === '#') {
                    e.preventDefault();
                    window.scrollTo({
                        top: 0,
                        behavior: 'smooth'
                    });
                }
            });
        });
    }
 
    // Handle external links (open in new tab)
    function handleExternalLinks() {
        const externalLinks = document.querySelectorAll('a[target="_blank"]');
       
        externalLinks.forEach(link => {
            link.setAttribute('rel', 'noopener noreferrer');
        });
    }
 
    // Add animation on scroll for footer
    function observeFooter() {
        const footer = document.querySelector('footer');
       
        if (footer && 'IntersectionObserver' in window) {
            const observer = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        entry.target.classList.add('footer-visible');
                        // Add fade-in animation to child elements
                        const sections = entry.target.querySelectorAll('.grid > div');
                        sections.forEach((section, index) => {
                            setTimeout(() => {
                                section.classList.add('section-visible');
                            }, index * 100);
                        });
                    }
                });
            }, { threshold: 0.1 });
 
            observer.observe(footer);
        }
    }
 
    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initFooter);
    } else {
        initFooter();
    }
 
    // Optional: Add intersection observer for animations
    // Uncomment the line below if you want animations
    // document.addEventListener('DOMContentLoaded', observeFooter);
})();
 
// Export for module usage if needed
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        initFooter,
        updateCopyrightYear
    };
}