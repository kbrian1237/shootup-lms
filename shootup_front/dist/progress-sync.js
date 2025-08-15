/**
 * Unified Progress Tracking System for ShootUp LMS
 * Synchronizes course progress across all pages and components
 */

window.ProgressSync = (function() {
    'use strict';
    
    // Constants
    const PROGRESS_KEY_PREFIX = 'progress_';
    const COURSE_STATE_PREFIX = '_';
    
    /**
     * Get course progress from localStorage
     * @param {string} courseId - The course identifier
     * @returns {number} Progress percentage (0-100)
     */
    function getCourseProgress(courseId) {
        if (!courseId) return 0;
        const progress = localStorage.getItem(`${PROGRESS_KEY_PREFIX}${courseId}`);
        return progress ? Math.max(0, Math.min(100, parseInt(progress, 10))) : 0;
    }
    
    /**
     * Set course progress in localStorage
     * @param {string} courseId - The course identifier
     * @param {number} progress - Progress percentage (0-100)
     */
    function setCourseProgress(courseId, progress) {
        if (!courseId || typeof progress !== 'number') return;
        
        const clampedProgress = Math.max(0, Math.min(100, Math.round(progress)));
        localStorage.setItem(`${PROGRESS_KEY_PREFIX}${courseId}`, clampedProgress.toString());
        
        // Update analytics if available
        if (window.AnalyticsEngine) {
            window.AnalyticsEngine.updateCourseProgress(courseId, clampedProgress);
        }
        
        // Dispatch custom event for real-time updates
        window.dispatchEvent(new CustomEvent('courseProgressUpdate', {
            detail: { courseId, progress: clampedProgress }
        }));
        
        console.log(`Progress updated for course ${courseId}: ${clampedProgress}%`);
    }
    
    /**
     * Get course-specific state data
     * @param {string} courseId - The course identifier
     * @param {string} key - The state key
     * @returns {any} The stored state data
     */
    function getCourseState(courseId, key) {
        if (!courseId || !key) return null;
        const stateKey = `${courseId}${COURSE_STATE_PREFIX}${key}`;
        const data = localStorage.getItem(stateKey);
        try {
            return data ? JSON.parse(data) : null;
        } catch (error) {
            console.warn(`Failed to parse course state for ${stateKey}:`, error);
            return data; // Return as string if JSON parsing fails
        }
    }
    
    /**
     * Set course-specific state data
     * @param {string} courseId - The course identifier
     * @param {string} key - The state key
     * @param {any} value - The state value
     */
    function setCourseState(courseId, key, value) {
        if (!courseId || !key) return;
        const stateKey = `${courseId}${COURSE_STATE_PREFIX}${key}`;
        const serializedValue = typeof value === 'string' ? value : JSON.stringify(value);
        localStorage.setItem(stateKey, serializedValue);
    }
    
    /**
     * Update all visible progress displays for a course
     * @param {string} courseId - The course identifier
     * @param {number} progress - Progress percentage (0-100)
     */
    function updateProgressDisplays(courseId, progress) {
        if (!courseId || typeof progress !== 'number') return;
        
        // Update course cards
        const courseCards = document.querySelectorAll('.course-card, [data-course-id]');
        courseCards.forEach(card => {
            const cardCourseId = card.getAttribute('data-course-id') || 
                                extractCourseIdFromHref(card.getAttribute('href'));
            
            if (cardCourseId === courseId) {
                updateCardProgress(card, progress);
            }
        });
        
        // Update dashboard progress displays
        const progressBars = document.querySelectorAll(`[data-progress-course="${courseId}"]`);
        progressBars.forEach(bar => {
            updateProgressBar(bar, progress);
        });
    }
    
    /**
     * Extract course ID from href attribute
     * @param {string} href - The href attribute value
     * @returns {string|null} The extracted course ID
     */
    function extractCourseIdFromHref(href) {
        if (!href) return null;
        const match = href.match(/[?&]id=([^&]+)/);
        return match ? match[1] : null;
    }
    
    /**
     * Update progress display in a course card
     * @param {Element} card - The course card element
     * @param {number} progress - Progress percentage (0-100)
     */
    function updateCardProgress(card, progress) {
        const progressBar = card.querySelector('.progress-bar, .course-progress-bar');
        const progressText = card.querySelector('.text-sm, [data-progress-text]');
        
        if (progressBar) {
            progressBar.style.width = `${progress}%`;
        }
        if (progressText) {
            progressText.textContent = `${progress}% Complete`;
        }
    }
    
    /**
     * Update a progress bar element
     * @param {Element} bar - The progress bar element
     * @param {number} progress - Progress percentage (0-100)
     */
    function updateProgressBar(bar, progress) {
        const fill = bar.querySelector('.progress-fill, .progress-bar');
        const text = bar.querySelector('.progress-text, .progress-percent');
        
        if (fill) {
            fill.style.width = `${progress}%`;
        }
        if (text) {
            text.textContent = `${progress}`;
        }
    }
    
    /**
     * Initialize progress synchronization
     */
    function initialize() {
        // Listen for progress updates from course iframes
        window.addEventListener('message', (event) => {
            if (event.data && event.data.type === 'progressUpdate') {
                const { courseId, progress } = event.data;
                if (courseId && typeof progress === 'number') {
                    setCourseProgress(courseId, progress);
                    updateProgressDisplays(courseId, progress);
                }
            }
        });
        
        // Listen for custom progress update events
        window.addEventListener('courseProgressUpdate', (event) => {
            const { courseId, progress } = event.detail;
            updateProgressDisplays(courseId, progress);
        });
        
        console.log('Progress synchronization initialized');
    }
    
    /**
     * Get all course progress data
     * @returns {Object} Object with courseId as keys and progress as values
     */
    function getAllProgress() {
        const progressData = {};
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && key.startsWith(PROGRESS_KEY_PREFIX)) {
                const courseId = key.substring(PROGRESS_KEY_PREFIX.length);
                progressData[courseId] = getCourseProgress(courseId);
            }
        }
        return progressData;
    }
    
    /**
     * Reset progress for a specific course
     * @param {string} courseId - The course identifier
     */
    function resetCourseProgress(courseId) {
        if (!courseId) return;
        
        // Remove progress
        localStorage.removeItem(`${PROGRESS_KEY_PREFIX}${courseId}`);
        
        // Remove course-specific state
        const keysToRemove = [];
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && key.startsWith(`${courseId}${COURSE_STATE_PREFIX}`)) {
                keysToRemove.push(key);
            }
        }
        keysToRemove.forEach(key => localStorage.removeItem(key));
        
        // Update displays
        updateProgressDisplays(courseId, 0);
        
        console.log(`Progress reset for course ${courseId}`);
    }
    
    // Auto-initialize when script loads
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initialize);
    } else {
        initialize();
    }
    
    // Public API
    return {
        getCourseProgress,
        setCourseProgress,
        getCourseState,
        setCourseState,
        updateProgressDisplays,
        getAllProgress,
        resetCourseProgress,
        initialize
    };
})();