/**
 * Comprehensive Achievement System for ShootUp LMS
 * Manages achievement definitions, tracking, and display
 */

window.AchievementSystem = (function() {
    'use strict';
    
    // Achievement definitions with unlock conditions
    const ACHIEVEMENT_DEFINITIONS = {
        // Learning Milestones
        'first_lesson': {
            id: 'first_lesson',
            title: 'First Steps',
            description: 'Complete your first lesson',
            icon: 'fa-baby',
            color: 'green',
            points: 50,
            category: 'Learning',
            condition: (analytics) => analytics.sessionHistory.length > 0
        },
        
        'first_quiz': {
            id: 'first_quiz',
            title: 'Quiz Rookie',
            description: 'Complete your first quiz',
            icon: 'fa-question-circle',
            color: 'blue',
            points: 75,
            category: 'Learning',
            condition: (analytics) => analytics.quizScores.length > 0
        },
        
        'course_complete': {
            id: 'course_complete',
            title: 'Course Conqueror',
            description: 'Complete your first course',
            icon: 'fa-graduation-cap',
            color: 'purple',
            points: 200,
            category: 'Learning',
            condition: (analytics) => analytics.coursesCompleted > 0
        },
        
        // Time-based Achievements
        'study_hour': {
            id: 'study_hour',
            title: 'Dedicated Learner',
            description: 'Study for 1 hour total',
            icon: 'fa-clock',
            color: 'indigo',
            points: 100,
            category: 'Time',
            condition: (analytics) => analytics.totalTimeSpent >= 60
        },
        
        'study_marathon': {
            id: 'study_marathon',
            title: 'Study Marathon',
            description: 'Study for 10 hours total',
            icon: 'fa-running',
            color: 'orange',
            points: 300,
            category: 'Time',
            condition: (analytics) => analytics.totalTimeSpent >= 600
        },
        
        'night_owl': {
            id: 'night_owl',
            title: 'Night Owl',
            description: 'Study late at night (after 10 PM)',
            icon: 'fa-moon',
            color: 'purple',
            points: 150,
            category: 'Time',
            condition: (analytics) => {
                return analytics.sessionHistory.some(session => {
                    const hour = new Date(session.date).getHours();
                    return hour >= 22 || hour <= 5;
                });
            }
        },
        
        // Consistency Achievements
        'consistency_3': {
            id: 'consistency_3',
            title: 'Getting Started',
            description: 'Study for 3 days in a row',
            icon: 'fa-calendar-check',
            color: 'green',
            points: 150,
            category: 'Consistency',
            condition: (analytics) => analytics.studyStreak >= 3
        },
        
        'consistency_7': {
            id: 'consistency_7',
            title: 'Week Warrior',
            description: 'Study for 7 days in a row',
            icon: 'fa-fire',
            color: 'red',
            points: 250,
            category: 'Consistency',
            condition: (analytics) => analytics.studyStreak >= 7
        },
        
        'consistency_30': {
            id: 'consistency_30',
            title: 'Consistency Champion',
            description: 'Study for 30 days in a row',
            icon: 'fa-crown',
            color: 'gold',
            points: 500,
            category: 'Consistency',
            condition: (analytics) => analytics.studyStreak >= 30
        },
        
        // Performance Achievements
        'quiz_master': {
            id: 'quiz_master',
            title: 'Quiz Master',
            description: 'Score 90% or higher on 5 quizzes',
            icon: 'fa-trophy',
            color: 'gold',
            points: 200,
            category: 'Performance',
            condition: (analytics) => {
                const highScores = analytics.quizScores.filter(quiz => quiz.percentage >= 90);
                return highScores.length >= 5;
            }
        },
        
        'perfectionist': {
            id: 'perfectionist',
            title: 'Perfectionist',
            description: 'Score 100% on any quiz',
            icon: 'fa-star',
            color: 'yellow',
            points: 150,
            category: 'Performance',
            condition: (analytics) => {
                return analytics.quizScores.some(quiz => quiz.percentage === 100);
            }
        },
        
        'improvement': {
            id: 'improvement',
            title: 'Always Improving',
            description: 'Improve your average score by 20%',
            icon: 'fa-chart-line',
            color: 'blue',
            points: 175,
            category: 'Performance',
            condition: (analytics) => {
                if (analytics.quizScores.length < 5) return false;
                const firstFive = analytics.quizScores.slice(0, 5);
                const lastFive = analytics.quizScores.slice(-5);
                const firstAvg = firstFive.reduce((sum, quiz) => sum + quiz.percentage, 0) / firstFive.length;
                const lastAvg = lastFive.reduce((sum, quiz) => sum + quiz.percentage, 0) / lastFive.length;
                return (lastAvg - firstAvg) >= 20;
            }
        },
        
        // Special Achievements
        'speed_learner': {
            id: 'speed_learner',
            title: 'Speed Learner',
            description: 'Complete a course in under 7 days',
            icon: 'fa-bolt',
            color: 'yellow',
            points: 250,
            category: 'Special',
            condition: (analytics) => {
                // This would need course completion date tracking
                return analytics.coursesCompleted > 0; // Simplified for now
            }
        },
        
        'multitasker': {
            id: 'multitasker',
            title: 'Multitasker',
            description: 'Study 3 different courses in one day',
            icon: 'fa-tasks',
            color: 'purple',
            points: 200,
            category: 'Special',
            condition: (analytics) => {
                const today = new Date().toDateString();
                const todaySessions = analytics.sessionHistory.filter(session => 
                    new Date(session.date).toDateString() === today
                );
                const uniqueCourses = new Set(todaySessions.map(session => session.courseId));
                return uniqueCourses.size >= 3;
            }
        },
        
        'early_bird': {
            id: 'early_bird',
            title: 'Early Bird',
            description: 'Study before 7 AM',
            icon: 'fa-sun',
            color: 'orange',
            points: 125,
            category: 'Special',
            condition: (analytics) => {
                return analytics.sessionHistory.some(session => {
                    const hour = new Date(session.date).getHours();
                    return hour >= 5 && hour < 7;
                });
            }
        }
    };
    
    /**
     * Check and unlock new achievements based on current analytics
     */
    function checkAndUnlockAchievements() {
        if (!window.AnalyticsEngine) {
            console.warn('Analytics Engine not available for achievement checking');
            return [];
        }
        
        const analytics = window.AnalyticsEngine.getAnalyticsData();
        const currentAchievements = analytics.achievements || [];
        const currentAchievementIds = currentAchievements.map(a => a.id);
        const newlyUnlocked = [];
        
        // Check each achievement definition
        Object.values(ACHIEVEMENT_DEFINITIONS).forEach(achievement => {
            // Skip if already unlocked
            if (currentAchievementIds.includes(achievement.id)) {
                return;
            }
            
            // Check if condition is met
            try {
                if (achievement.condition(analytics)) {
                    // Unlock the achievement
                    window.AnalyticsEngine.trackAchievement(
                        achievement.id,
                        achievement.title,
                        achievement.points
                    );
                    newlyUnlocked.push(achievement);
                    console.log(`🏆 Achievement unlocked: ${achievement.title}`);
                }
            } catch (error) {
                console.warn(`Error checking achievement ${achievement.id}:`, error);
            }
        });
        
        return newlyUnlocked;
    }
    
    /**
     * Get all achievement definitions
     */
    function getAllAchievements() {
        return ACHIEVEMENT_DEFINITIONS;
    }
    
    /**
     * Get unlocked achievements with full details
     */
    function getUnlockedAchievements() {
        if (!window.AnalyticsEngine) return [];
        
        const analytics = window.AnalyticsEngine.getAnalyticsData();
        const unlockedAchievements = analytics.achievements || [];
        
        return unlockedAchievements.map(unlocked => {
            const definition = ACHIEVEMENT_DEFINITIONS[unlocked.id];
            return {
                ...definition,
                ...unlocked,
                unlocked: true
            };
        });
    }
    
    /**
     * Get locked achievements with progress indicators
     */
    function getLockedAchievements() {
        if (!window.AnalyticsEngine) return [];
        
        const analytics = window.AnalyticsEngine.getAnalyticsData();
        const unlockedIds = (analytics.achievements || []).map(a => a.id);
        
        return Object.values(ACHIEVEMENT_DEFINITIONS)
            .filter(achievement => !unlockedIds.includes(achievement.id))
            .map(achievement => ({
                ...achievement,
                unlocked: false,
                progress: calculateAchievementProgress(achievement, analytics)
            }));
    }
    
    /**
     * Calculate progress towards an achievement (0-100)
     */
    function calculateAchievementProgress(achievement, analytics) {
        try {
            switch (achievement.id) {
                case 'study_hour':
                    return Math.min(100, (analytics.totalTimeSpent / 60) * 100);
                    
                case 'study_marathon':
                    return Math.min(100, (analytics.totalTimeSpent / 600) * 100);
                    
                case 'consistency_3':
                    return Math.min(100, (analytics.studyStreak / 3) * 100);
                    
                case 'consistency_7':
                    return Math.min(100, (analytics.studyStreak / 7) * 100);
                    
                case 'consistency_30':
                    return Math.min(100, (analytics.studyStreak / 30) * 100);
                    
                case 'quiz_master':
                    const highScores = analytics.quizScores.filter(quiz => quiz.percentage >= 90);
                    return Math.min(100, (highScores.length / 5) * 100);
                    
                case 'first_lesson':
                    return analytics.sessionHistory.length > 0 ? 100 : 0;
                    
                case 'first_quiz':
                    return analytics.quizScores.length > 0 ? 100 : 0;
                    
                case 'course_complete':
                    return analytics.coursesCompleted > 0 ? 100 : 0;
                    
                default:
                    return achievement.condition(analytics) ? 100 : 0;
            }
        } catch (error) {
            return 0;
        }
    }
    
    /**
     * Get achievements by category
     */
    function getAchievementsByCategory() {
        const unlocked = getUnlockedAchievements();
        const locked = getLockedAchievements();
        const all = [...unlocked, ...locked];
        
        const categories = {};
        all.forEach(achievement => {
            const category = achievement.category || 'Other';
            if (!categories[category]) {
                categories[category] = [];
            }
            categories[category].push(achievement);
        });
        
        return categories;
    }
    
    /**
     * Get achievement statistics
     */
    function getAchievementStats() {
        const unlocked = getUnlockedAchievements();
        const total = Object.keys(ACHIEVEMENT_DEFINITIONS).length;
        const totalPoints = unlocked.reduce((sum, achievement) => sum + (achievement.points || 0), 0);
        const maxPoints = Object.values(ACHIEVEMENT_DEFINITIONS).reduce((sum, achievement) => sum + achievement.points, 0);
        
        return {
            unlockedCount: unlocked.length,
            totalCount: total,
            completionPercentage: Math.round((unlocked.length / total) * 100),
            totalPoints: totalPoints,
            maxPoints: maxPoints,
            pointsPercentage: Math.round((totalPoints / maxPoints) * 100)
        };
    }
    
    /**
     * Show achievement notification
     */
    function showAchievementNotification(achievement) {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `
            fixed top-4 right-4 z-50 bg-gradient-to-r from-yellow-400 to-orange-500 
            text-white p-4 rounded-lg shadow-lg transform translate-x-full 
            transition-transform duration-300 max-w-sm
        `;
        
        notification.innerHTML = `
            <div class="flex items-center">
                <div class="p-2 bg-white/20 rounded-full mr-3">
                    <i class="fas ${achievement.icon} text-xl"></i>
                </div>
                <div>
                    <div class="font-bold">Achievement Unlocked!</div>
                    <div class="text-sm">${achievement.title}</div>
                    <div class="text-xs opacity-90">+${achievement.points} points</div>
                </div>
            </div>
        `;
        
        document.body.appendChild(notification);
        
        // Animate in
        setTimeout(() => {
            notification.style.transform = 'translateX(0)';
        }, 100);
        
        // Animate out and remove
        setTimeout(() => {
            notification.style.transform = 'translateX(100%)';
            setTimeout(() => {
                document.body.removeChild(notification);
            }, 300);
        }, 4000);
    }
    
    /**
     * Initialize achievement system
     */
    function initialize() {
        // Check for new achievements periodically
        setInterval(() => {
            const newAchievements = checkAndUnlockAchievements();
            newAchievements.forEach(achievement => {
                showAchievementNotification(achievement);
            });
        }, 30000); // Check every 30 seconds
        
        // Check immediately on load
        setTimeout(() => {
            checkAndUnlockAchievements();
        }, 1000);
        
        console.log('Achievement System initialized');
    }
    
    // Auto-initialize
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initialize);
    } else {
        initialize();
    }
    
    // Public API
    return {
        checkAndUnlockAchievements,
        getAllAchievements,
        getUnlockedAchievements,
        getLockedAchievements,
        getAchievementsByCategory,
        getAchievementStats,
        showAchievementNotification,
        initialize
    };
})();