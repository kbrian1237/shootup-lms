// Authentication check for protected pages
(function() {
    'use strict';

    // Check if user is authenticated
    function checkAuth() {
        // Skip auth check for login and landing pages
        const publicPages = ['login.html', 'landing.html'];
        const currentPage = window.location.pathname.split('/').pop();
        
        if (publicPages.includes(currentPage)) {
            return;
        }

        // Check for current user
        const currentUser = JSON.parse(localStorage.getItem('shootup_current_user') || 'null');
        
        if (!currentUser) {
            // Redirect to login if not authenticated
            window.location.href = 'login.html';
            return;
        }

        // Add user info to page if elements exist
        updateUserInfo(currentUser);
    }

    function updateUserInfo(user) {
        // Update user name in navigation or header
        const userNameElements = document.querySelectorAll('[data-user-name]');
        userNameElements.forEach(el => {
            el.textContent = user.displayName || `${user.firstName} ${user.lastName}`;
        });

        // Update user email
        const userEmailElements = document.querySelectorAll('[data-user-email]');
        userEmailElements.forEach(el => {
            el.textContent = user.email;
        });

        // Add logout functionality
        const logoutButtons = document.querySelectorAll('[data-logout]');
        logoutButtons.forEach(btn => {
            btn.addEventListener('click', logout);
        });
    }

    function logout() {
        localStorage.removeItem('shootup_current_user');
        window.location.href = 'login.html';
    }

    // Run auth check when DOM is loaded
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', checkAuth);
    } else {
        checkAuth();
    }

    // Export logout function globally
    window.logout = logout;
})();