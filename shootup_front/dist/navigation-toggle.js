/**
 * Universal Navigation Toggle Script for ShootUp LMS
 * Handles sidebar show/hide functionality across all pages
 */

document.addEventListener('DOMContentLoaded', () => {
    // Initialize navigation toggle functionality
    initializeNavigationToggle();
});

function initializeNavigationToggle() {
    const mainContainer = document.getElementById('main-container');
    const toggleBtn = document.getElementById('sidebar-toggle-btn');
    
    if (!mainContainer) {
        console.warn('Main container not found - navigation toggle disabled');
        return;
    }

    // Wait for navigation to be loaded
    const checkNavigation = () => {
        const sidebar = document.getElementById('sidebar');
        const closeBtn = document.getElementById('sidebar-close-btn');
        
        if (sidebar && closeBtn) {
            setupToggleFunctionality(mainContainer, toggleBtn, sidebar, closeBtn);
        } else {
            // Retry after a short delay if navigation isn't loaded yet
            setTimeout(checkNavigation, 100);
        }
    };
    
    checkNavigation();
}

function setupToggleFunctionality(mainContainer, toggleBtn, sidebar, closeBtn) {
    // Ensure toggle button exists and is properly configured
    if (toggleBtn) {
        // Reset button styles to ensure it's properly configured
        toggleBtn.style.pointerEvents = 'auto';
        toggleBtn.style.cursor = 'pointer';
        toggleBtn.style.userSelect = 'none';
        
        // Remove any existing event listeners to prevent duplicates
        const newToggleBtn = toggleBtn.cloneNode(true);
        toggleBtn.parentNode.replaceChild(newToggleBtn, toggleBtn);
        
        // Add click event to show sidebar
        newToggleBtn.addEventListener('click', (event) => {
            event.preventDefault();
            event.stopPropagation();
            showSidebar(mainContainer, newToggleBtn);
        });
        
        // Add touch event for mobile
        newToggleBtn.addEventListener('touchend', (event) => {
            event.preventDefault();
            showSidebar(mainContainer, newToggleBtn);
        });
        
        // Update reference
        toggleBtn = newToggleBtn;
    }
    
    // Setup close button functionality
    if (closeBtn) {
        // Remove any existing event listeners to prevent duplicates
        const newCloseBtn = closeBtn.cloneNode(true);
        closeBtn.parentNode.replaceChild(newCloseBtn, closeBtn);
        
        // Add click event to hide sidebar
        newCloseBtn.addEventListener('click', (event) => {
            event.preventDefault();
            event.stopPropagation();
            hideSidebar(mainContainer, toggleBtn);
        });
        
        // Add touch event for mobile
        newCloseBtn.addEventListener('touchend', (event) => {
            event.preventDefault();
            hideSidebar(mainContainer, toggleBtn);
        });
    }
    
    // Setup responsive behavior
    setupResponsiveBehavior(mainContainer, toggleBtn);
    
    // Setup mutation observer to handle dynamic class changes
    setupMutationObserver(mainContainer, toggleBtn);
    
    // Initial state check - ensure toggle button is hidden if sidebar is visible
    if (!mainContainer.classList.contains('sidebar-collapsed') && window.innerWidth > 768) {
        if (toggleBtn) {
            toggleBtn.style.display = 'none';
            toggleBtn.style.opacity = '0';
            toggleBtn.style.visibility = 'hidden';
        }
    }
    
    console.log('Navigation toggle functionality initialized successfully');
}

function showSidebar(mainContainer, toggleBtn) {
    console.log('Showing sidebar');
    
    // Remove collapsed class to show sidebar
    mainContainer.classList.remove('sidebar-collapsed');
    
    // Hide toggle button with smooth animation
    if (toggleBtn) {
        toggleBtn.style.opacity = '0';
        toggleBtn.style.visibility = 'hidden';
        toggleBtn.style.transform = 'translateX(-50px) scale(0.8)';
        
        setTimeout(() => {
            toggleBtn.style.display = 'none';
        }, 300);
    }
}

function hideSidebar(mainContainer, toggleBtn) {
    console.log('Hiding sidebar');
    
    // Add collapsed class to hide sidebar
    mainContainer.classList.add('sidebar-collapsed');
    
    // Show toggle button with smooth animation
    if (toggleBtn) {
        toggleBtn.style.display = 'block';
        toggleBtn.style.pointerEvents = 'auto';
        
        // Small delay to ensure display change takes effect
        setTimeout(() => {
            toggleBtn.style.opacity = '1';
            toggleBtn.style.visibility = 'visible';
            toggleBtn.style.transform = 'translateX(0) scale(1)';
        }, 50);
    }
}

function setupResponsiveBehavior(mainContainer, toggleBtn) {
    // Initialize responsive state
    const updateResponsiveState = () => {
        if (window.innerWidth <= 768) {
            // Mobile: Always collapse sidebar and show toggle button
            if (!mainContainer.classList.contains('sidebar-collapsed')) {
                mainContainer.classList.add('sidebar-collapsed');
            }
            if (toggleBtn) {
                toggleBtn.style.display = 'block';
                toggleBtn.style.opacity = '1';
                toggleBtn.style.visibility = 'visible';
                toggleBtn.style.transform = 'translateX(0) scale(1)';
            }
        } else {
            // Desktop: Show sidebar by default, hide toggle button
            if (mainContainer.classList.contains('sidebar-collapsed')) {
                // Only remove if not manually collapsed by user
                const wasManuallyCollapsed = sessionStorage.getItem('sidebar-manually-collapsed');
                if (!wasManuallyCollapsed) {
                    mainContainer.classList.remove('sidebar-collapsed');
                    if (toggleBtn) {
                        toggleBtn.style.display = 'none';
                        toggleBtn.style.opacity = '0';
                        toggleBtn.style.visibility = 'hidden';
                    }
                }
            } else {
                // Ensure toggle button is hidden when sidebar is visible on desktop
                if (toggleBtn) {
                    toggleBtn.style.display = 'none';
                    toggleBtn.style.opacity = '0';
                    toggleBtn.style.visibility = 'hidden';
                }
            }
        }
    };
    
    // Initial setup
    updateResponsiveState();
    
    // Handle window resize
    let resizeTimeout;
    window.addEventListener('resize', () => {
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(updateResponsiveState, 150);
    });
}

function setupMutationObserver(mainContainer, toggleBtn) {
    // Observe changes to the main container class
    const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
            if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
                const isCollapsed = mainContainer.classList.contains('sidebar-collapsed');
                
                if (isCollapsed) {
                    // Sidebar is collapsed - show toggle button
                    if (toggleBtn) {
                        toggleBtn.style.display = 'block';
                        toggleBtn.style.pointerEvents = 'auto';
                        setTimeout(() => {
                            toggleBtn.style.opacity = '1';
                            toggleBtn.style.visibility = 'visible';
                            toggleBtn.style.transform = 'translateX(0) scale(1)';
                        }, 50);
                    }
                    // Remember manual collapse state
                    if (window.innerWidth > 768) {
                        sessionStorage.setItem('sidebar-manually-collapsed', 'true');
                    }
                } else {
                    // Sidebar is expanded - hide toggle button
                    if (toggleBtn) {
                        toggleBtn.style.opacity = '0';
                        toggleBtn.style.visibility = 'hidden';
                        toggleBtn.style.transform = 'translateX(-50px) scale(0.8)';
                        setTimeout(() => {
                            toggleBtn.style.display = 'none';
                        }, 300);
                    }
                    // Clear manual collapse state
                    sessionStorage.removeItem('sidebar-manually-collapsed');
                }
            }
        });
    });
    
    observer.observe(mainContainer, { attributes: true });
}

// Export functions for external use
window.NavigationToggle = {
    show: () => {
        const mainContainer = document.getElementById('main-container');
        const toggleBtn = document.getElementById('sidebar-toggle-btn');
        if (mainContainer) showSidebar(mainContainer, toggleBtn);
    },
    hide: () => {
        const mainContainer = document.getElementById('main-container');
        const toggleBtn = document.getElementById('sidebar-toggle-btn');
        if (mainContainer) hideSidebar(mainContainer, toggleBtn);
    },
    toggle: () => {
        const mainContainer = document.getElementById('main-container');
        const toggleBtn = document.getElementById('sidebar-toggle-btn');
        if (mainContainer) {
            if (mainContainer.classList.contains('sidebar-collapsed')) {
                showSidebar(mainContainer, toggleBtn);
            } else {
                hideSidebar(mainContainer, toggleBtn);
            }
        }
    }
};