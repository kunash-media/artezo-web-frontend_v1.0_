// main/footer-loader.js
class FooterLoader {
    constructor() {
        this.footerContainer = document.getElementById('footer-container');
        this.init();
    }

    async init() {
        if (this.footerContainer) {
            await this.loadFooter();
            this.initializeFooterScripts();
        }
    }

    async loadFooter() {
        try {
            const response = await fetch('../Footer/footer.html');
            const html = await response.text();
            this.footerContainer.innerHTML = html;
        } catch (error) {
            console.error('Error loading footer:', error);
            this.fallbackFooter();
        }
    }

    initializeFooterScripts() {
        // Load footer CSS
        this.loadCSS('../Footer/footer.css');
        
        // Load footer JS
        const script = document.createElement('script');
        script.src = '../Footer/footer.js';
        script.onload = () => {
            if (window.footerAPI) {
                window.footerAPI.init();
            }
        };
        document.body.appendChild(script);
    }

    loadCSS(href) {
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = href;
        document.head.appendChild(link);
    }

    fallbackFooter() {
        this.footerContainer.innerHTML = `
            <footer style="background: #1D3C4A; color: white; padding: 20px; text-align: center;">
                <p>&copy; ${new Date().getFullYear()} Your Company. All rights reserved.</p>
            </footer>
        `;
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    new FooterLoader();
});