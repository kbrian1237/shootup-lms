// Mobile navigation handler
class MobileNavigation {
    constructor() {
        this.sidebar = null;
        this.toggleBtn = null;
        this.closeBtn = null;
        this.overlay = null;
        this.init();
    }

    init() {
        // Wait for navigation to load
        setTimeout(() => {
            this.setupElements();
            this.bindEvents();
        }, 300);
    }

    setupElements() {
        this.sidebar = document.getElementById('sidebar');
        this.toggleBtn = document.getElementById('sidebar-toggle-btn');
        this.closeBtn = document.getElementById('sidebar-close-btn');
        
        // Create overlay for mobile
        if (!document.querySelector('.sidebar-overlay')) {
            this.overlay = document.createElement('div');
            this.overlay.className = 'sidebar-overlay';
            document.body.appendChild(this.overlay);
        } else {
            this.overlay = document.querySelector('.sidebar-overlay');
        }
    }

    bindEvents() {
        if (this.toggleBtn) {
            this.toggleBtn.addEventListener('click', () => this.showSidebar());
        }

        if (this.closeBtn) {
            this.closeBtn.addEventListener('click', () => this.hideSidebar());
        }

        if (this.overlay) {
            this.overlay.addEventListener('click', () => this.hideSidebar());
        }

        // Close sidebar when clicking nav links on mobile
        if (this.sidebar) {
            this.sidebar.addEventListener('click', (e) => {
                if (e.target.closest('.nav-link') && window.innerWidth <= 768) {
                    setTimeout(() => this.hideSidebar(), 100);
                }
            });
        }

        // Handle window resize
        window.addEventListener('resize', () => {
            if (window.innerWidth > 768) {
                this.hideSidebar();
            }
        });

        // Handle escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.isSidebarVisible()) {
                this.hideSidebar();
            }
        });
    }

    showSidebar() {
        if (this.sidebar && this.overlay) {
            this.sidebar.classList.add('show');
            this.overlay.classList.add('show');
            document.body.style.overflow = 'hidden';
        }
    }

    hideSidebar() {
        if (this.sidebar && this.overlay) {
            this.sidebar.classList.remove('show');
            this.overlay.classList.remove('show');
            document.body.style.overflow = '';
        }
    }

    isSidebarVisible() {
        return this.sidebar && this.sidebar.classList.contains('show');
    }
}

// Initialize mobile navigation
document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
        window.mobileNav = new MobileNavigation();
    }, 500);
});

// Export for global use
window.MobileNavigation = MobileNavigation;
