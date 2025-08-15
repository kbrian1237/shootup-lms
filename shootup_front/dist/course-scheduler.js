/**
 * Course Scheduling System for ShootUp LMS
 * Automatically schedules course content based on outline and user preferences
 */

window.CourseScheduler = (function() {
    'use strict';
    
    // Constants
    const STORAGE_PREFIX = 'schedule_';
    const DEFAULT_HOURS_PER_DAY = 4;
    const DEFAULT_ITEMS_PER_GROUP = 4;
    
    /**
     * Create a schedule for a course
     * @param {string} courseId - The course identifier
     * @param {Object} courseData - The course data with outline
     * @param {Date} startDate - When to start the course
     * @param {Object} options - Scheduling options
     * @returns {Object} The created schedule
     */
    function createSchedule(courseId, courseData, startDate = new Date(), options = {}) {
        const {
            hoursPerDay = DEFAULT_HOURS_PER_DAY,
            itemsPerGroup = DEFAULT_ITEMS_PER_GROUP,
            skipWeekends = true,
            skipDays = [] // Array of day names to skip: ['Saturday', 'Sunday']
        } = options;
        
        if (!courseData.outline || !Array.isArray(courseData.outline)) {
            throw new Error('Course outline is required and must be an array');
        }
        
        // Check if course has predefined schedule groups
        let topicGroups;
        if (courseData.scheduleGroups && courseData.scheduleGroups.length > 0) {
            // Use predefined schedule groups
            topicGroups = courseData.scheduleGroups.map(group => 
                group.topics.map(topic => ({
                    id: `${group.day}-${topic.topic}`,
                    sectionTitle: topic.section,
                    topicTitle: topic.topic,
                    estimatedHours: group.estimatedHours / group.topics.length || 1,
                    groupTitle: group.title
                }))
            );
            console.log('Using predefined schedule groups:', topicGroups.length, 'groups');
        } else {
            // Fallback to automatic grouping
            const allTopics = flattenOutline(courseData.outline);
            topicGroups = groupTopics(allTopics, itemsPerGroup);
            console.log('Using automatic topic grouping:', topicGroups.length, 'groups');
        }
        
        // Calculate total topics
        const totalTopics = topicGroups.reduce((total, group) => total + group.length, 0);
        
        // Create the schedule
        const schedule = {
            courseId,
            courseTitle: courseData.title,
            startDate: new Date(startDate),
            hoursPerDay,
            itemsPerGroup,
            totalDays: topicGroups.length,
            totalTopics: totalTopics,
            estimatedCompletionDate: null,
            skipWeekends,
            skipDays: skipDays || [],
            sessions: [],
            status: 'scheduled',
            createdAt: new Date(),
            lastUpdated: new Date()
        };
        
        // Generate daily sessions
        let currentDate = new Date(startDate);
        
        topicGroups.forEach((group, index) => {
            // Skip weekends and specified days if configured
            while (shouldSkipDay(currentDate, skipWeekends, skipDays)) {
                currentDate = addDays(currentDate, 1);
            }
            
            const session = {
                day: index + 1,
                date: new Date(currentDate),
                dayName: currentDate.toLocaleDateString('en-US', { weekday: 'long' }),
                topics: group,
                hoursAllocated: hoursPerDay,
                status: 'scheduled', // scheduled, in-progress, completed, skipped
                completedTopics: [],
                startTime: null,
                endTime: null,
                actualHours: 0,
                notes: '',
                title: group[0]?.groupTitle || `Day ${index + 1} Topics` // Use group title if available
            };
            
            schedule.sessions.push(session);
            currentDate = addDays(currentDate, 1);
        });
        
        // Set estimated completion date
        if (schedule.sessions.length > 0) {
            const lastSession = schedule.sessions[schedule.sessions.length - 1];
            schedule.estimatedCompletionDate = new Date(lastSession.date);
        }
        
        // Save the schedule
        saveSchedule(courseId, schedule);
        
        console.log(`Schedule created for ${courseData.title}:`, {
            totalDays: schedule.totalDays,
            totalTopics: schedule.totalTopics,
            startDate: schedule.startDate.toDateString(),
            estimatedCompletion: schedule.estimatedCompletionDate?.toDateString()
        });
        
        return schedule;
    }
    
    /**
     * Get the schedule for a course
     * @param {string} courseId - The course identifier
     * @returns {Object|null} The schedule or null if not found
     */
    function getSchedule(courseId) {
        const scheduleData = localStorage.getItem(`${STORAGE_PREFIX}${courseId}`);
        if (!scheduleData) return null;
        
        try {
            const schedule = JSON.parse(scheduleData);
            // Convert date strings back to Date objects
            schedule.startDate = new Date(schedule.startDate);
            schedule.estimatedCompletionDate = schedule.estimatedCompletionDate ? new Date(schedule.estimatedCompletionDate) : null;
            schedule.createdAt = new Date(schedule.createdAt);
            schedule.lastUpdated = new Date(schedule.lastUpdated);
            
            schedule.sessions.forEach(session => {
                session.date = new Date(session.date);
                if (session.startTime) session.startTime = new Date(session.startTime);
                if (session.endTime) session.endTime = new Date(session.endTime);
            });
            
            return schedule;
        } catch (error) {
            console.error('Error parsing schedule data:', error);
            return null;
        }
    }
    
    /**
     * Update a session in the schedule
     * @param {string} courseId - The course identifier
     * @param {number} sessionDay - The day number of the session
     * @param {Object} updates - Updates to apply to the session
     */
    function updateSession(courseId, sessionDay, updates) {
        const schedule = getSchedule(courseId);
        if (!schedule) return false;
        
        const session = schedule.sessions.find(s => s.day === sessionDay);
        if (!session) return false;
        
        // Apply updates
        Object.assign(session, updates);
        session.lastUpdated = new Date();
        
        // Update schedule timestamp
        schedule.lastUpdated = new Date();
        
        // Save updated schedule
        saveSchedule(courseId, schedule);
        
        return true;
    }
    
    /**
     * Mark a day as skipped and reschedule remaining sessions
     * @param {string} courseId - The course identifier
     * @param {number} sessionDay - The day number to skip
     */
    function skipDay(courseId, sessionDay) {
        const schedule = getSchedule(courseId);
        if (!schedule) return false;
        
        const sessionIndex = schedule.sessions.findIndex(s => s.day === sessionDay);
        if (sessionIndex === -1) return false;
        
        const skippedSession = schedule.sessions[sessionIndex];
        
        // Mark session as skipped
        skippedSession.status = 'skipped';
        skippedSession.lastUpdated = new Date();
        
        // Reschedule all subsequent sessions
        for (let i = sessionIndex; i < schedule.sessions.length; i++) {
            const session = schedule.sessions[i];
            if (session.status === 'scheduled' || session.status === 'skipped') {
                // Move session to next available day
                let newDate = i === sessionIndex ? 
                    addDays(session.date, 1) : 
                    addDays(schedule.sessions[i - 1].date, 1);
                
                // Skip weekends and specified days
                while (shouldSkipDay(newDate, schedule.skipWeekends, schedule.skipDays)) {
                    newDate = addDays(newDate, 1);
                }
                
                session.date = newDate;
                session.dayName = newDate.toLocaleDateString('en-US', { weekday: 'long' });
            }
        }
        
        // Update estimated completion date
        if (schedule.sessions.length > 0) {
            const lastSession = schedule.sessions[schedule.sessions.length - 1];
            schedule.estimatedCompletionDate = new Date(lastSession.date);
        }
        
        schedule.lastUpdated = new Date();
        saveSchedule(courseId, schedule);
        
        console.log(`Day ${sessionDay} skipped for course ${courseId}. Schedule updated.`);
        return true;
    }
    
    /**
     * Get today's session for a course
     * @param {string} courseId - The course identifier
     * @returns {Object|null} Today's session or null if none
     */
    function getTodaysSession(courseId) {
        const schedule = getSchedule(courseId);
        if (!schedule) return null;
        
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        return schedule.sessions.find(session => {
            const sessionDate = new Date(session.date);
            sessionDate.setHours(0, 0, 0, 0);
            return sessionDate.getTime() === today.getTime();
        }) || null;
    }
    
    /**
     * Get upcoming sessions for a course
     * @param {string} courseId - The course identifier
     * @param {number} days - Number of days to look ahead
     * @returns {Array} Array of upcoming sessions
     */
    function getUpcomingSessions(courseId, days = 7) {
        const schedule = getSchedule(courseId);
        if (!schedule) return [];
        
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const futureDate = addDays(today, days);
        
        return schedule.sessions.filter(session => {
            const sessionDate = new Date(session.date);
            sessionDate.setHours(0, 0, 0, 0);
            return sessionDate >= today && sessionDate <= futureDate;
        });
    }
    
    /**
     * Get schedule statistics
     * @param {string} courseId - The course identifier
     * @returns {Object} Schedule statistics
     */
    function getScheduleStats(courseId) {
        const schedule = getSchedule(courseId);
        if (!schedule) return null;
        
        const stats = {
            totalSessions: schedule.sessions.length,
            completedSessions: 0,
            skippedSessions: 0,
            inProgressSessions: 0,
            scheduledSessions: 0,
            totalTopics: schedule.totalTopics,
            completedTopics: 0,
            progressPercentage: 0,
            daysRemaining: 0,
            isOnTrack: true,
            averageHoursPerDay: 0
        };
        
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        schedule.sessions.forEach(session => {
            switch (session.status) {
                case 'completed':
                    stats.completedSessions++;
                    stats.completedTopics += session.completedTopics.length;
                    stats.averageHoursPerDay += session.actualHours;
                    break;
                case 'skipped':
                    stats.skippedSessions++;
                    break;
                case 'in-progress':
                    stats.inProgressSessions++;
                    stats.completedTopics += session.completedTopics.length;
                    break;
                case 'scheduled':
                    stats.scheduledSessions++;
                    break;
            }
            
            const sessionDate = new Date(session.date);
            sessionDate.setHours(0, 0, 0, 0);
            if (sessionDate >= today) {
                stats.daysRemaining++;
            }
        });
        
        stats.progressPercentage = Math.round((stats.completedTopics / stats.totalTopics) * 100);
        stats.averageHoursPerDay = stats.completedSessions > 0 ? 
            Math.round((stats.averageHoursPerDay / stats.completedSessions) * 10) / 10 : 0;
        
        // Check if on track (simplified logic)
        const expectedProgress = Math.round(((stats.completedSessions + stats.skippedSessions) / stats.totalSessions) * 100);
        stats.isOnTrack = stats.progressPercentage >= (expectedProgress * 0.8); // 80% threshold
        
        return stats;
    }
    
    /**
     * Delete a schedule
     * @param {string} courseId - The course identifier
     */
    function deleteSchedule(courseId) {
        localStorage.removeItem(`${STORAGE_PREFIX}${courseId}`);
        console.log(`Schedule deleted for course ${courseId}`);
    }
    
    // Helper Functions
    
    /**
     * Flatten course outline into individual topics
     */
    function flattenOutline(outline) {
        const topics = [];
        
        outline.forEach((section, sectionIndex) => {
            if (section.topics && Array.isArray(section.topics)) {
                section.topics.forEach((topic, topicIndex) => {
                    topics.push({
                        id: `${sectionIndex}-${topicIndex}`,
                        sectionTitle: section.title,
                        topicTitle: topic,
                        sectionIndex,
                        topicIndex,
                        estimatedHours: 1 // Default 1 hour per topic
                    });
                });
            }
        });
        
        return topics;
    }
    
    /**
     * Group topics into daily sessions
     */
    function groupTopics(topics, itemsPerGroup) {
        const groups = [];
        
        for (let i = 0; i < topics.length; i += itemsPerGroup) {
            groups.push(topics.slice(i, i + itemsPerGroup));
        }
        
        return groups;
    }
    
    /**
     * Check if a day should be skipped
     */
    function shouldSkipDay(date, skipWeekends, skipDays) {
        const dayName = date.toLocaleDateString('en-US', { weekday: 'long' });
        
        if (skipWeekends && (dayName === 'Saturday' || dayName === 'Sunday')) {
            return true;
        }
        
        return skipDays.includes(dayName);
    }
    
    /**
     * Add days to a date
     */
    function addDays(date, days) {
        const result = new Date(date);
        result.setDate(result.getDate() + days);
        return result;
    }
    
    /**
     * Save schedule to localStorage
     */
    function saveSchedule(courseId, schedule) {
        try {
            localStorage.setItem(`${STORAGE_PREFIX}${courseId}`, JSON.stringify(schedule));
        } catch (error) {
            console.error('Error saving schedule:', error);
        }
    }
    
    // Public API
    return {
        createSchedule,
        getSchedule,
        updateSession,
        skipDay,
        getTodaysSession,
        getUpcomingSessions,
        getScheduleStats,
        deleteSchedule
    };
})();