/**
 * ShootUp Dashboard Script
 * Handles dashboard data binding and course display
 */

/**
 * Get course progress from localStorage (fallback if ProgressSync not available)
 */
function getCourseProgress(courseId) {
    if (window.ProgressSync) {
        return window.ProgressSync.getCourseProgress(courseId);
    }
    // Fallback to direct localStorage access
    const progress = localStorage.getItem(`progress_${courseId}`);
    return progress ? Math.max(0, Math.min(100, parseInt(progress, 10))) : 0;
}

document.addEventListener('DOMContentLoaded', async function() {
    try {
        // Load course data
        const data = await window.ShootUpData.load();
        
        // Initialize dashboard components
        initializeDashboardStats(data);
        initializeContinueCourses(data);
        initializeRecentActivity(data);
        initializeDeadlines();
        
        console.log('Dashboard initialized successfully');
    } catch (error) {
        console.error('Dashboard initialization error:', error);
        showFallbackData();
    }
});

/**
 * Initialize dashboard statistics
 */
function initializeDashboardStats(data) {
    const courses = data.courses || [];
    
    // Calculate statistics
    const totalCourses = courses.length;
    let completed = 0;
    let inProgress = 0;
    let totalHours = 0;
    
    courses.forEach(course => {
        const progress = getCourseProgress(course.id);
        
        if (progress >= 100) {
            completed++;
        } else if (progress > 0) {
            inProgress++;
        }
        
        // Estimate hours based on progress (assuming 10 hours per course)
        totalHours += Math.round((progress / 100) * 10);
    });
    
    // Update data-bind elements
    updateDataBind('dashboard.totalCourses', totalCourses);
    updateDataBind('dashboard.completed', completed);
    updateDataBind('dashboard.inProgress', inProgress);
    updateDataBind('dashboard.hoursLearned', totalHours);
}

/**
 * Initialize courses in progress section
 */
function initializeContinueCourses(data) {
    const container = document.querySelector('[data-component="continue-courses"]');
    if (!container) return;
    
    const courses = data.courses || [];
    const coursesInProgress = courses.filter(course => {
        const progress = getCourseProgress(course.id);
        return progress > 0 && progress < 100;
    });
    
    // If no courses in progress, show all courses with some progress or show sample
    let displayCourses = coursesInProgress;
    if (displayCourses.length === 0) {
        // Show courses with any progress, or first few courses as samples
        displayCourses = courses.filter(course => {
            const progress = getCourseProgress(course.id);
            return progress > 0;
        });
        
        // If still no courses, show first 3 as samples
        if (displayCourses.length === 0) {
            displayCourses = courses.slice(0, 3);
        }
    }
    
    if (displayCourses.length === 0) {
        container.innerHTML = `
            <div class="text-center py-8 text-gray-400">
                <i class="fas fa-book-open text-4xl mb-4"></i>
                <p>No courses available</p>
                <p class="text-sm">Check your course data!</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = displayCourses.map(course => {
        const progress = getCourseProgress(course.id);
        return createCourseProgressCard(course, progress);
    }).join('');
}

/**
 * Initialize recent activity section
 */
function initializeRecentActivity(data) {
    const container = document.querySelector('[data-component="recent-activity"]');
    if (!container) return;
    
    const courses = data.courses || [];
    const recentActivities = [];
    
    // Generate recent activities based on course progress
    courses.forEach(course => {
        const progress = getCourseProgress(course.id);
        if (progress > 0) {
            recentActivities.push({
                type: progress >= 100 ? 'completed' : 'progress',
                course: course.title,
                progress: progress,
                time: getRandomRecentTime()
            });
        }
    });
    
    // Sort by most recent (simulated)
    recentActivities.sort((a, b) => b.time.localeCompare(a.time));
    
    if (recentActivities.length === 0) {
        container.innerHTML = `
            <div class="text-center py-8 text-gray-400">
                <i class="fas fa-clock text-4xl mb-4"></i>
                <p>No recent activity</p>
                <p class="text-sm">Start learning to see your activity!</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = recentActivities.slice(0, 5).map(activity => 
        createActivityItem(activity)
    ).join('');
}

/**
 * Initialize deadlines section
 */
function initializeDeadlines() {
    const container = document.querySelector('[data-component="deadlines"]');
    if (!container) return;
    
    // Sample deadlines data
    const deadlines = [
        {
            course: 'JavaScript Fundamentals',
            assignment: 'Final Project',
            dueDate: '2024-02-15',
            status: 'pending'
        },
        {
            course: 'React Development',
            assignment: 'Component Assignment',
            dueDate: '2024-02-20',
            status: 'in-progress'
        }
    ];
    
    if (deadlines.length === 0) {
        container.innerHTML = `
            <tr>
                <td colspan="4" class="text-center py-8 text-gray-400">
                    <i class="fas fa-calendar-check text-4xl mb-4"></i>
                    <p>No upcoming deadlines</p>
                </td>
            </tr>
        `;
        return;
    }
    
    container.innerHTML = deadlines.map(deadline => 
        createDeadlineRow(deadline)
    ).join('');
}

/**
 * Create a course progress card
 */
function createCourseProgressCard(course, progress) {
    return `
        <div class="flex items-center space-x-4 p-4 bg-gray-800 rounded-xl hover:bg-gray-700 transition-colors cursor-pointer" onclick="openCourse('${course.id}')">
            <div class="w-12 h-12 bg-indigo-600 rounded-lg flex items-center justify-center">
                <i class="fas fa-book-open text-white"></i>
            </div>
            <div class="flex-grow">
                <h4 class="font-semibold text-white">${course.title}</h4>
                <div class="flex items-center space-x-2 mt-1">
                    <div class="w-32 bg-gray-600 rounded-full h-2">
                        <div class="bg-indigo-600 h-2 rounded-full transition-all duration-300" style="width: ${progress}%"></div>
                    </div>
                    <span class="text-sm text-gray-400">${progress}%</span>
                </div>
            </div>
            <button class="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm">
                Continue
            </button>
        </div>
    `;
}

/**
 * Create an activity item
 */
function createActivityItem(activity) {
    const icon = activity.type === 'completed' ? 'fa-check-circle text-green-400' : 'fa-play-circle text-indigo-400';
    const text = activity.type === 'completed' ? 'Completed' : `Progress: ${activity.progress}%`;
    
    return `
        <div class="flex items-center space-x-4 p-3 bg-gray-800 rounded-lg">
            <div class="w-10 h-10 bg-gray-700 rounded-full flex items-center justify-center">
                <i class="fas ${icon}"></i>
            </div>
            <div class="flex-grow">
                <p class="font-medium text-white">${activity.course}</p>
                <p class="text-sm text-gray-400">${text}</p>
            </div>
            <span class="text-xs text-gray-500">${activity.time}</span>
        </div>
    `;
}

/**
 * Create a deadline row
 */
function createDeadlineRow(deadline) {
    const statusColors = {
        'pending': 'text-yellow-400',
        'in-progress': 'text-blue-400',
        'completed': 'text-green-400',
        'overdue': 'text-red-400'
    };
    
    const statusColor = statusColors[deadline.status] || 'text-gray-400';
    
    return `
        <tr class="border-b border-gray-700">
            <td class="py-3 text-white">${deadline.course}</td>
            <td class="py-3 text-gray-300">${deadline.assignment}</td>
            <td class="py-3 text-gray-300">${formatDate(deadline.dueDate)}</td>
            <td class="py-3">
                <span class="px-2 py-1 rounded-full text-xs ${statusColor} bg-gray-700">
                    ${deadline.status.replace('-', ' ')}
                </span>
            </td>
        </tr>
    `;
}

/**
 * Update data-bind elements
 */
function updateDataBind(selector, value) {
    const element = document.querySelector(`[data-bind="${selector}"]`);
    if (element) {
        element.textContent = value;
    }
}

/**
 * Open a course
 */
function openCourse(courseId) {
    window.location.href = `course-details.html?id=${courseId}`;
}

/**
 * Format date for display
 */
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric', 
        year: 'numeric' 
    });
}

/**
 * Generate random recent time for demo purposes
 */
function getRandomRecentTime() {
    const times = ['2 hours ago', '5 hours ago', '1 day ago', '2 days ago', '3 days ago'];
    return times[Math.floor(Math.random() * times.length)];
}

/**
 * Show fallback data when main data fails to load
 */
function showFallbackData() {
    updateDataBind('dashboard.totalCourses', '3');
    updateDataBind('dashboard.completed', '1');
    updateDataBind('dashboard.inProgress', '2');
    updateDataBind('dashboard.hoursLearned', '24');
    
    const continueContainer = document.querySelector('[data-component="continue-courses"]');
    if (continueContainer) {
        continueContainer.innerHTML = `
            <div class="text-center py-8 text-gray-400">
                <i class="fas fa-exclamation-triangle text-4xl mb-4"></i>
                <p>Unable to load course data</p>
                <p class="text-sm">Please check your connection and try again</p>
            </div>
        `;
    }
    
    const activityContainer = document.querySelector('[data-component="recent-activity"]');
    if (activityContainer) {
        activityContainer.innerHTML = `
            <div class="text-center py-8 text-gray-400">
                <i class="fas fa-exclamation-triangle text-4xl mb-4"></i>
                <p>Unable to load activity data</p>
            </div>
        `;
    }
}

// Listen for progress updates to refresh dashboard
window.addEventListener('courseProgressUpdate', (event) => {
    // Refresh dashboard stats when progress changes
    setTimeout(async () => {
        try {
            const data = await window.ShootUpData.load();
            initializeDashboardStats(data);
            initializeContinueCourses(data);
            initializeRecentActivity(data);
        } catch (error) {
            console.warn('Failed to refresh dashboard after progress update:', error);
        }
    }, 100);
});