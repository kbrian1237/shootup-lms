/**
 * Course Calendar Component for ShootUp LMS
 * Visual calendar interface for course scheduling
 */

window.CourseCalendar = (function() {
    'use strict';
    
    /**
     * Create a calendar view for a course schedule
     * @param {string} containerId - ID of the container element
     * @param {string} courseId - The course identifier
     * @param {Object} options - Calendar options
     */
    function createCalendar(containerId, courseId, options = {}) {
        const container = document.getElementById(containerId);
        if (!container) {
            console.error(`Container with ID '${containerId}' not found`);
            return;
        }
        
        const {
            showControls = true,
            showLegend = true,
            allowInteraction = true,
            theme = 'dark'
        } = options;
        
        const schedule = window.CourseScheduler.getSchedule(courseId);
        if (!schedule) {
            container.innerHTML = createNoScheduleView(courseId);
            return;
        }
        
        const currentDate = new Date();
        const calendarHTML = `
            <div class="course-calendar ${theme}-theme">
                ${showControls ? createCalendarControls(schedule) : ''}
                ${createCalendarHeader(schedule)}
                ${createCalendarGrid(schedule, currentDate, allowInteraction)}
                ${showLegend ? createCalendarLegend() : ''}
            </div>
        `;
        
        container.innerHTML = calendarHTML;
        
        // Add event listeners
        if (allowInteraction) {
            addCalendarEventListeners(container, courseId);
        }
    }
    
    /**
     * Create calendar controls (navigation, actions)
     */
    function createCalendarControls(schedule) {
        const stats = window.CourseScheduler.getScheduleStats(schedule.courseId);
        
        return `
            <div class="calendar-controls mb-6">
                <div class="flex justify-between items-center">
                    <div class="calendar-info">
                        <h3 class="text-xl font-semibold text-white">${schedule.courseTitle}</h3>
                        <p class="text-gray-400 text-sm">
                            ${stats.completedSessions}/${stats.totalSessions} sessions completed
                            (${stats.progressPercentage}%)
                        </p>
                    </div>
                    <div class="calendar-actions flex gap-2">
                        <button onclick="CourseCalendar.reschedule('${schedule.courseId}')" 
                                class="px-3 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm">
                            <i class="fas fa-calendar-alt mr-1"></i>
                            Reschedule
                        </button>
                        <button onclick="CourseCalendar.showStats('${schedule.courseId}')" 
                                class="px-3 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 text-sm">
                            <i class="fas fa-chart-bar mr-1"></i>
                            Stats
                        </button>
                    </div>
                </div>
            </div>
        `;
    }
    
    /**
     * Create calendar header with month navigation
     */
    function createCalendarHeader(schedule) {
        const startDate = new Date(schedule.startDate);
        const endDate = new Date(schedule.estimatedCompletionDate);
        
        return `
            <div class="calendar-header mb-4">
                <div class="flex justify-between items-center">
                    <div class="text-lg font-semibold text-white">
                        ${startDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                        ${startDate.getMonth() !== endDate.getMonth() ? 
                            ` - ${endDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}` : ''}
                    </div>
                    <div class="text-sm text-gray-400">
                        ${schedule.totalDays} days • ${schedule.hoursPerDay}h per day
                    </div>
                </div>
            </div>
        `;
    }
    
    /**
     * Create the main calendar grid
     */
    function createCalendarGrid(schedule, currentDate, allowInteraction) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        // Get date range for calendar
        const startDate = new Date(schedule.startDate);
        const endDate = new Date(schedule.estimatedCompletionDate);
        
        // Start from beginning of start month
        const calendarStart = new Date(startDate.getFullYear(), startDate.getMonth(), 1);
        
        // End at end of end month
        const calendarEnd = new Date(endDate.getFullYear(), endDate.getMonth() + 1, 0);
        
        let html = `
            <div class="calendar-grid">
                <div class="calendar-weekdays grid grid-cols-7 gap-1 mb-2">
                    ${['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => 
                        `<div class="weekday text-center text-sm font-medium text-gray-400 py-2">${day}</div>`
                    ).join('')}
                </div>
                <div class="calendar-days grid grid-cols-7 gap-1">
        `;
        
        // Add empty cells for days before start of month
        const firstDayOfWeek = calendarStart.getDay();
        for (let i = 0; i < firstDayOfWeek; i++) {
            html += '<div class="calendar-day empty"></div>';
        }
        
        // Add all days in the range
        const currentDateIter = new Date(calendarStart);
        while (currentDateIter <= calendarEnd) {
            const daySession = schedule.sessions.find(session => {
                const sessionDate = new Date(session.date);
                sessionDate.setHours(0, 0, 0, 0);
                const iterDate = new Date(currentDateIter);
                iterDate.setHours(0, 0, 0, 0);
                return sessionDate.getTime() === iterDate.getTime();
            });
            
            html += createCalendarDay(currentDateIter, daySession, today, allowInteraction);
            currentDateIter.setDate(currentDateIter.getDate() + 1);
        }
        
        html += `
                </div>
            </div>
        `;
        
        return html;
    }
    
    /**
     * Create a single calendar day
     */
    function createCalendarDay(date, session, today, allowInteraction) {
        const isToday = date.getTime() === today.getTime();
        const isPast = date < today;
        const dayNumber = date.getDate();
        
        let classes = ['calendar-day', 'p-2', 'min-h-[80px]', 'border', 'border-gray-700', 'rounded-lg'];
        let content = `<div class="day-number text-sm font-medium mb-1">${dayNumber}</div>`;
        
        if (isToday) {
            classes.push('today', 'border-indigo-500', 'bg-indigo-900/20');
        } else if (isPast) {
            classes.push('past', 'bg-gray-800/50');
        } else {
            classes.push('future', 'bg-gray-800');
        }
        
        if (session) {
            classes.push('has-session');
            
            // Add status-specific styling
            switch (session.status) {
                case 'completed':
                    classes.push('completed', 'bg-green-900/30', 'border-green-500');
                    break;
                case 'in-progress':
                    classes.push('in-progress', 'bg-yellow-900/30', 'border-yellow-500');
                    break;
                case 'skipped':
                    classes.push('skipped', 'bg-red-900/30', 'border-red-500');
                    break;
                case 'scheduled':
                    classes.push('scheduled', 'bg-indigo-900/30', 'border-indigo-500');
                    break;
            }
            
            content += createSessionContent(session, allowInteraction);
            
            if (allowInteraction) {
                classes.push('cursor-pointer', 'hover:bg-opacity-80');
            }
        }
        
        const clickHandler = allowInteraction && session ? 
            `onclick="CourseCalendar.showSessionDetails('${session.day}')"` : '';
        
        return `
            <div class="${classes.join(' ')}" ${clickHandler} data-date="${date.toISOString().split('T')[0]}" ${session ? `data-session="${session.day}"` : ''}>
                ${content}
            </div>
        `;
    }
    
    /**
     * Create session content for a calendar day
     */
    function createSessionContent(session, allowInteraction) {
        const statusIcons = {
            'completed': 'fas fa-check-circle text-green-400',
            'in-progress': 'fas fa-play-circle text-yellow-400',
            'skipped': 'fas fa-times-circle text-red-400',
            'scheduled': 'fas fa-clock text-indigo-400'
        };
        
        const icon = statusIcons[session.status] || 'fas fa-circle text-gray-400';
        const topicCount = session.topics.length;
        const completedCount = session.completedTopics.length;
        
        return `
            <div class="session-content">
                <div class="flex items-center justify-between mb-1">
                    <i class="${icon} text-xs"></i>
                    <span class="text-xs text-gray-400">Day ${session.day}</span>
                </div>
                <div class="text-xs text-gray-300">
                    ${topicCount} topics
                </div>
                ${completedCount > 0 ? 
                    `<div class="text-xs text-green-400">${completedCount}/${topicCount} done</div>` : ''}
                <div class="text-xs text-gray-400">
                    ${session.hoursAllocated}h
                </div>
            </div>
        `;
    }
    
    /**
     * Create calendar legend
     */
    function createCalendarLegend() {
        return `
            <div class="calendar-legend mt-6">
                <h4 class="text-sm font-medium text-gray-300 mb-3">Legend</h4>
                <div class="flex flex-wrap gap-4 text-xs">
                    <div class="flex items-center gap-2">
                        <div class="w-3 h-3 bg-green-900/30 border border-green-500 rounded"></div>
                        <span class="text-gray-400">Completed</span>
                    </div>
                    <div class="flex items-center gap-2">
                        <div class="w-3 h-3 bg-yellow-900/30 border border-yellow-500 rounded"></div>
                        <span class="text-gray-400">In Progress</span>
                    </div>
                    <div class="flex items-center gap-2">
                        <div class="w-3 h-3 bg-indigo-900/30 border border-indigo-500 rounded"></div>
                        <span class="text-gray-400">Scheduled</span>
                    </div>
                    <div class="flex items-center gap-2">
                        <div class="w-3 h-3 bg-red-900/30 border border-red-500 rounded"></div>
                        <span class="text-gray-400">Skipped</span>
                    </div>
                    <div class="flex items-center gap-2">
                        <div class="w-3 h-3 bg-indigo-900/20 border border-indigo-500 rounded"></div>
                        <span class="text-gray-400">Today</span>
                    </div>
                </div>
            </div>
        `;
    }
    
    /**
     * Create view when no schedule exists
     */
    function createNoScheduleView(courseId) {
        return `
            <div class="no-schedule text-center py-12">
                <i class="fas fa-calendar-plus text-4xl text-gray-400 mb-4"></i>
                <h3 class="text-xl font-semibold text-white mb-2">No Schedule Created</h3>
                <p class="text-gray-400 mb-6">Create a learning schedule to track your progress</p>
                <button onclick="CourseCalendar.createScheduleDialog('${courseId}')" 
                        class="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">
                    <i class="fas fa-plus mr-2"></i>
                    Create Schedule
                </button>
            </div>
        `;
    }
    
    /**
     * Add event listeners to calendar
     */
    function addCalendarEventListeners(container, courseId) {
        // Add any additional event listeners here
        console.log(`Calendar event listeners added for course ${courseId}`);
    }
    
    /**
     * Show session details modal
     */
    function showSessionDetails(sessionDay) {
        // This would open a modal with session details
        console.log(`Show details for session day ${sessionDay}`);
        // Implementation would depend on your modal system
    }
    
    /**
     * Show schedule statistics
     */
    function showStats(courseId) {
        const stats = window.CourseScheduler.getScheduleStats(courseId);
        if (!stats) return;
        
        alert(`Schedule Statistics:
        
Total Sessions: ${stats.totalSessions}
Completed: ${stats.completedSessions}
Skipped: ${stats.skippedSessions}
Progress: ${stats.progressPercentage}%
Days Remaining: ${stats.daysRemaining}
On Track: ${stats.isOnTrack ? 'Yes' : 'No'}
Avg Hours/Day: ${stats.averageHoursPerDay}h`);
    }
    
    /**
     * Reschedule course
     */
    function reschedule(courseId) {
        const newStartDate = prompt('Enter new start date (YYYY-MM-DD):');
        if (!newStartDate) return;
        
        try {
            const startDate = new Date(newStartDate);
            if (isNaN(startDate.getTime())) {
                alert('Invalid date format');
                return;
            }
            
            // Get course data and recreate schedule
            window.ShootUpData.load().then(data => {
                const course = data.courses.find(c => c.id === courseId);
                if (course) {
                    window.CourseScheduler.createSchedule(courseId, course, startDate);
                    location.reload(); // Refresh to show new schedule
                }
            });
        } catch (error) {
            alert('Error rescheduling course: ' + error.message);
        }
    }
    
    /**
     * Create schedule dialog
     */
    function createScheduleDialog(courseId) {
        const startDate = prompt('Enter start date (YYYY-MM-DD):', new Date().toISOString().split('T')[0]);
        if (!startDate) return;
        
        const hoursPerDay = prompt('Hours per day (default: 4):', '4');
        const skipWeekends = confirm('Skip weekends?');
        
        try {
            const start = new Date(startDate);
            if (isNaN(start.getTime())) {
                alert('Invalid date format');
                return;
            }
            
            window.ShootUpData.load().then(data => {
                const course = data.courses.find(c => c.id === courseId);
                if (course) {
                    window.CourseScheduler.createSchedule(courseId, course, start, {
                        hoursPerDay: parseInt(hoursPerDay) || 4,
                        skipWeekends: skipWeekends
                    });
                    location.reload(); // Refresh to show new schedule
                }
            });
        } catch (error) {
            alert('Error creating schedule: ' + error.message);
        }
    }
    
    // Public API
    return {
        createCalendar,
        showSessionDetails,
        showStats,
        reschedule,
        createScheduleDialog
    };
})();