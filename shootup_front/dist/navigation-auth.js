// Navigation authentication handler
class NavigationAuth {
    constructor() {
        this.currentUser = null;
        this.init();
    }

    async init() {
        // Wait for navigation to load
        setTimeout(() => {
            this.checkAuthAndUpdateNav();
            this.initEventListeners();
        }, 100);
    }

    async checkAuthAndUpdateNav() {
        try {
            // Check if user is logged in
            this.currentUser = JSON.parse(localStorage.getItem('shootup_current_user') || 'null');
            
            if (this.currentUser) {
                this.showAuthenticatedNav();
            } else {
                this.showUnauthenticatedNav();
            }
        } catch (error) {
            console.error('Error checking auth status:', error);
            this.showUnauthenticatedNav();
        }
    }

    showAuthenticatedNav() {
        // Hide login link, show logout button
        const loginLink = document.getElementById('loginNavLink');
        const logoutBtn = document.getElementById('logoutNavBtn');
        const userProfileSection = document.getElementById('userProfileSection');

        if (loginLink) loginLink.classList.add('hidden');
        if (logoutBtn) logoutBtn.classList.remove('hidden');
        if (userProfileSection) userProfileSection.classList.remove('hidden');

        // Update user profile info
        this.updateUserProfileDisplay();
    }

    showUnauthenticatedNav() {
        // Show login link, hide logout button and profile
        const loginLink = document.getElementById('loginNavLink');
        const logoutBtn = document.getElementById('logoutNavBtn');
        const userProfileSection = document.getElementById('userProfileSection');

        if (loginLink) loginLink.classList.remove('hidden');
        if (logoutBtn) logoutBtn.classList.add('hidden');
        if (userProfileSection) userProfileSection.classList.add('hidden');
    }

    updateUserProfileDisplay() {
        if (!this.currentUser) return;

        const navUserName = document.getElementById('navUserName');
        const navUserRole = document.getElementById('navUserRole');
        const navUserAvatar = document.getElementById('navUserAvatar');

        if (navUserName) {
            navUserName.textContent = this.currentUser.displayName || `${this.currentUser.firstName} ${this.currentUser.lastName}`;
        }

        if (navUserRole) {
            navUserRole.textContent = (this.currentUser.role || 'student').charAt(0).toUpperCase() + (this.currentUser.role || 'student').slice(1);
        }

        if (navUserAvatar) {
            const initials = `${this.currentUser.firstName?.[0] || ''}${this.currentUser.lastName?.[0] || ''}`.toUpperCase();
            navUserAvatar.src = `https://placehold.co/40x40/4f46e5/ffffff?text=${initials}`;
        }
    }

    initEventListeners() {
        // Logout button click handler
        const logoutBtn = document.getElementById('logoutNavBtn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => {
                this.handleLogout();
            });
        }

        // Listen for auth state changes
        window.addEventListener('storage', (e) => {
            if (e.key === 'shootup_current_user') {
                this.checkAuthAndUpdateNav();
            }
        });

        // Listen for custom auth events
        document.addEventListener('authStateChanged', () => {
            this.checkAuthAndUpdateNav();
        });
    }

    async handleLogout() {
        if (confirm('Are you sure you want to logout?')) {
            try {
                // Try backend logout if available
                const isBackendAvailable = await window.apiClient?.isBackendAvailable();
                
                if (isBackendAvailable && window.apiClient) {
                    await window.apiClient.logout();
                }
                
                // Clear localStorage
                localStorage.removeItem('shootup_current_user');
                localStorage.removeItem('shootup_token');
                
                // Update navigation
                this.showUnauthenticatedNav();
                
                // Redirect to login if not on public pages
                const publicPages = ['login.html', 'landing.html', 'index.html'];
                const currentPage = window.location.pathname.split('/').pop();
                
                if (!publicPages.includes(currentPage)) {
                    window.location.href = 'login.html';
                }
                
            } catch (error) {
                console.error('Logout error:', error);
                // Force logout even if backend fails
                localStorage.removeItem('shootup_current_user');
                localStorage.removeItem('shootup_token');
                this.showUnauthenticatedNav();
                window.location.href = 'login.html';
            }
        }
    }

    // Method to refresh navigation when user data changes
    refresh() {
        this.checkAuthAndUpdateNav();
    }
}

// Initialize navigation auth when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Wait a bit for navigation to load
    setTimeout(() => {
        window.navigationAuth = new NavigationAuth();
    }, 200);
});

// Export for global use
window.NavigationAuth = NavigationAuth;