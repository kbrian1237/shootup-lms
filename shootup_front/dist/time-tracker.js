/**
 * Time Tracking System for ShootUp LMS
 * Automatically tracks time spent on course pages and integrates with analytics
 */

window.TimeTracker = (function() {
    'use strict';
    
    let startTime = null;
    let currentCourseId = null;
    let isActive = true;
    let totalTimeSpent = 0;
    let trackingInterval = null;
    
    // Configuration
    const TRACKING_INTERVAL = 30000; // Track every 30 seconds
    const IDLE_THRESHOLD = 60000; // Consider idle after 1 minute
    const MIN_SESSION_TIME = 10; // Minimum 10 seconds to count as a session
    
    /**
     * Start tracking time for a course
     */
    function startTracking(courseId) {
        if (!courseId) return;
        
        // Stop any existing tracking
        stopTracking();
        
        currentCourseId = courseId;
        startTime = Date.now();
        isActive = true;
        totalTimeSpent = 0;
        
        // Start periodic tracking
        trackingInterval = setInterval(trackTime, TRACKING_INTERVAL);
        
        // Set up activity listeners
        setupActivityListeners();
        
        console.log(`Started time tracking for course: ${courseId}`);
    }
    
    /**
     * Stop tracking and save the session
     */
    function stopTracking() {
        if (!currentCourseId || !startTime) return;
        
        // Calculate final session time
        const sessionTime = Math.floor((Date.now() - startTime) / 1000);
        
        // Only save if session is long enough
        if (sessionTime >= MIN_SESSION_TIME) {
            const minutes = Math.round(sessionTime / 60);
            
            // Save to analytics
            if (window.AnalyticsEngine) {
                window.AnalyticsEngine.trackTimeSpent(currentCourseId, minutes);
            }
            
            console.log(`Time tracking stopped. Session: ${minutes} minutes for course: ${currentCourseId}`);
        }
        
        // Clear tracking
        if (trackingInterval) {
            clearInterval(trackingInterval);
            trackingInterval = null;
        }
        
        currentCourseId = null;
        startTime = null;
        isActive = false;
        totalTimeSpent = 0;
        
        // Remove activity listeners
        removeActivityListeners();
    }
    
    /**
     * Track time periodically
     */
    function trackTime() {
        if (!currentCourseId || !startTime || !isActive) return;
        
        const currentTime = Date.now();
        const sessionTime = Math.floor((currentTime - startTime) / 1000);
        const minutes = Math.round(sessionTime / 60);
        
        // Update total time spent
        totalTimeSpent = minutes;
        
        // Update UI if available
        updateTimeDisplay(minutes);
        
        // Save progress periodically (every 2 minutes)
        if (sessionTime % 120 === 0 && sessionTime > 0) {
            if (window.AnalyticsEngine) {
                window.AnalyticsEngine.trackTimeSpent(currentCourseId, 2);
            }
        }
    }
    
    /**
     * Update time display in UI
     */
    function updateTimeDisplay(minutes) {
        const timeDisplays = document.querySelectorAll('[data-time-display]');
        timeDisplays.forEach(display => {
            const hours = Math.floor(minutes / 60);
            const mins = minutes % 60;
            const timeText = hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
            display.textContent = timeText;
        });
    }
    
    /**
     * Set up activity listeners to detect user activity
     */
    function setupActivityListeners() {
        const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];
        
        events.forEach(event => {
            document.addEventListener(event, handleActivity, true);
        });
        
        // Handle page visibility changes
        document.addEventListener('visibilitychange', handleVisibilityChange);
        
        // Handle window focus/blur
        window.addEventListener('focus', handleFocus);
        window.addEventListener('blur', handleBlur);
    }
    
    /**
     * Remove activity listeners
     */
    function removeActivityListeners() {
        const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];
        
        events.forEach(event => {
            document.removeEventListener(event, handleActivity, true);
        });
        
        document.removeEventListener('visibilitychange', handleVisibilityChange);
        window.removeEventListener('focus', handleFocus);
        window.removeEventListener('blur', handleBlur);
    }
    
    /**
     * Handle user activity
     */
    function handleActivity() {
        if (!isActive) {
            isActive = true;
            console.log('User activity detected - resuming time tracking');
        }
    }
    
    /**
     * Handle page visibility changes
     */
    function handleVisibilityChange() {
        if (document.hidden) {
            isActive = false;
            console.log('Page hidden - pausing time tracking');
        } else {
            isActive = true;
            console.log('Page visible - resuming time tracking');
        }
    }
    
    /**
     * Handle window focus
     */
    function handleFocus() {
        isActive = true;
        console.log('Window focused - resuming time tracking');
    }
    
    /**
     * Handle window blur
     */
    function handleBlur() {
        isActive = false;
        console.log('Window blurred - pausing time tracking');
    }
    
    /**
     * Get current session info
     */
    function getCurrentSession() {
        if (!currentCourseId || !startTime) {
            return null;
        }
        
        const sessionTime = Math.floor((Date.now() - startTime) / 1000);
        const minutes = Math.round(sessionTime / 60);
        
        return {
            courseId: currentCourseId,
            startTime: new Date(startTime),
            sessionTimeSeconds: sessionTime,
            sessionTimeMinutes: minutes,
            isActive: isActive
        };
    }
    
    /**
     * Auto-detect course ID from current page
     */
    function autoDetectCourse() {
        // Try to get course ID from URL parameters
        const urlParams = new URLSearchParams(window.location.search);
        let courseId = urlParams.get('id');
        
        if (!courseId) {
            // Try to get from page title or other elements
            const titleElement = document.querySelector('[data-course-id]');
            if (titleElement) {
                courseId = titleElement.getAttribute('data-course-id');
            }
        }
        
        if (!courseId) {
            // Try to extract from page URL
            const pathMatch = window.location.pathname.match(/course[s]?\/([^\/]+)/);
            if (pathMatch) {
                courseId = pathMatch[1];
            }
        }
        
        return courseId;
    }
    
    /**
     * Initialize time tracking
     */
    function initialize() {
        // Auto-start tracking if on a course page
        const courseId = autoDetectCourse();
        if (courseId) {
            startTracking(courseId);
        }
        
        // Handle page unload
        window.addEventListener('beforeunload', () => {
            stopTracking();
        });
        
        // Handle page navigation
        window.addEventListener('pagehide', () => {
            stopTracking();
        });
        
        console.log('Time Tracker initialized');
    }
    
    // Auto-initialize
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initialize);
    } else {
        initialize();
    }
    
    // Public API
    return {
        startTracking,
        stopTracking,
        getCurrentSession,
        autoDetectCourse,
        initialize
    };
})();