(function() {
    'use strict';

    /**
     * Analytics Engine for ShootUp LMS
     * Provides comprehensive learning analytics and insights
     */
    class AnalyticsEngine {
        constructor() {
            this.storageKey = 'shootup_analytics';
            this.sessionStorageKey = 'shootup_session_analytics';
            this.analytics = this.loadAnalytics();
        }

        /**
         * Load analytics data from localStorage
         */
        loadAnalytics() {
            try {
                const stored = localStorage.getItem(this.storageKey);
                if (stored) {
                    const data = JSON.parse(stored);
                    // Ensure all required properties exist
                    return {
                        totalTimeSpent: data.totalTimeSpent || 0,
                        coursesCompleted: data.coursesCompleted || 0,
                        averageScore: data.averageScore || 0,
                        achievementsUnlocked: data.achievementsUnlocked || 0,
                        dailyActivity: data.dailyActivity || {},
                        courseProgress: data.courseProgress || {},
                        timeSpentByCourse: data.timeSpentByCourse || {},
                        quizScores: data.quizScores || [],
                        studyStreak: data.studyStreak || 0,
                        lastStudyDate: data.lastStudyDate || null,
                        weeklyGoals: data.weeklyGoals || {},
                        learningPath: data.learningPath || [],
                        sessionHistory: data.sessionHistory || [],
                        topicMastery: data.topicMastery || {},
                        createdAt: data.createdAt || new Date().toISOString(),
                        lastUpdated: data.lastUpdated || new Date().toISOString()
                    };
                }
            } catch (error) {
                console.error('Error loading analytics:', error);
            }

            // Return default analytics structure
            return {
                totalTimeSpent: 0,
                coursesCompleted: 0,
                averageScore: 0,
                achievementsUnlocked: 0,
                dailyActivity: {},
                courseProgress: {},
                timeSpentByCourse: {},
                quizScores: [],
                studyStreak: 0,
                lastStudyDate: null,
                weeklyGoals: {},
                learningPath: [],
                sessionHistory: [],
                topicMastery: {},
                createdAt: new Date().toISOString(),
                lastUpdated: new Date().toISOString()
            };
        }

        /**
         * Save analytics data to localStorage
         */
        saveAnalytics() {
            try {
                this.analytics.lastUpdated = new Date().toISOString();
                localStorage.setItem(this.storageKey, JSON.stringify(this.analytics));
            } catch (error) {
                console.error('Error saving analytics:', error);
            }
        }

        /**
         * Track time spent on a course
         */
        trackTimeSpent(courseId, minutes) {
            if (!courseId || minutes <= 0) return;

            this.analytics.totalTimeSpent += minutes;
            
            if (!this.analytics.timeSpentByCourse[courseId]) {
                this.analytics.timeSpentByCourse[courseId] = 0;
            }
            this.analytics.timeSpentByCourse[courseId] += minutes;

            // Track daily activity
            const today = new Date().toISOString().split('T')[0];
            if (!this.analytics.dailyActivity[today]) {
                this.analytics.dailyActivity[today] = 0;
            }
            this.analytics.dailyActivity[today] += minutes;

            // Update study streak
            this.updateStudyStreak();

            // Add to session history
            this.analytics.sessionHistory.push({
                courseId,
                minutes,
                date: new Date().toISOString(),
                type: 'study'
            });

            // Keep only last 100 sessions
            if (this.analytics.sessionHistory.length > 100) {
                this.analytics.sessionHistory = this.analytics.sessionHistory.slice(-100);
            }

            this.saveAnalytics();
        }

        /**
         * Track course completion
         */
        trackCourseCompletion(courseId, courseTitle) {
            this.analytics.coursesCompleted++;
            
            this.analytics.learningPath.push({
                courseId,
                courseTitle,
                completedAt: new Date().toISOString(),
                type: 'completion'
            });

            this.analytics.sessionHistory.push({
                courseId,
                courseTitle,
                date: new Date().toISOString(),
                type: 'completion'
            });

            this.saveAnalytics();
        }

        /**
         * Track quiz score
         */
        trackQuizScore(courseId, score, maxScore, topicTitle) {
            const percentage = Math.round((score / maxScore) * 100);
            
            this.analytics.quizScores.push({
                courseId,
                score,
                maxScore,
                percentage,
                topicTitle,
                date: new Date().toISOString()
            });

            // Recalculate average score
            this.recalculateAverageScore();

            // Track topic mastery
            if (!this.analytics.topicMastery[courseId]) {
                this.analytics.topicMastery[courseId] = {};
            }
            this.analytics.topicMastery[courseId][topicTitle] = percentage;

            this.analytics.sessionHistory.push({
                courseId,
                score: percentage,
                topicTitle,
                date: new Date().toISOString(),
                type: 'quiz'
            });

            this.saveAnalytics();
        }

        /**
         * Track achievement unlock
         */
        trackAchievement(achievementId, title, points) {
            this.analytics.achievementsUnlocked++;
            
            this.analytics.sessionHistory.push({
                achievementId,
                title,
                points,
                date: new Date().toISOString(),
                type: 'achievement'
            });

            this.saveAnalytics();
        }

        /**
         * Update course progress
         */
        updateCourseProgress(courseId, progress) {
            this.analytics.courseProgress[courseId] = progress;
            this.saveAnalytics();
        }

        /**
         * Update study streak
         */
        updateStudyStreak() {
            const today = new Date().toISOString().split('T')[0];
            const lastStudyDate = this.analytics.lastStudyDate;

            if (!lastStudyDate) {
                this.analytics.studyStreak = 1;
            } else {
                const lastDate = new Date(lastStudyDate);
                const currentDate = new Date(today);
                const daysDiff = Math.floor((currentDate - lastDate) / (1000 * 60 * 60 * 24));

                if (daysDiff === 1) {
                    // Consecutive day
                    this.analytics.studyStreak++;
                } else if (daysDiff > 1) {
                    // Streak broken
                    this.analytics.studyStreak = 1;
                }
                // If daysDiff === 0, same day, don't change streak
            }

            this.analytics.lastStudyDate = today;
        }

        /**
         * Recalculate average score
         */
        recalculateAverageScore() {
            if (this.analytics.quizScores.length === 0) {
                this.analytics.averageScore = 0;
                return;
            }

            const totalScore = this.analytics.quizScores.reduce((sum, quiz) => sum + quiz.percentage, 0);
            this.analytics.averageScore = Math.round(totalScore / this.analytics.quizScores.length);
        }

        /**
         * Get comprehensive analytics summary
         */
        getAnalyticsSummary() {
            return {
                overview: {
                    totalTimeSpent: this.analytics.totalTimeSpent,
                    totalTimeSpentHours: Math.round(this.analytics.totalTimeSpent / 60 * 10) / 10,
                    coursesCompleted: this.analytics.coursesCompleted,
                    averageScore: this.analytics.averageScore,
                    achievementsUnlocked: this.analytics.achievementsUnlocked,
                    studyStreak: this.analytics.studyStreak
                },
                timeSpentByCourse: this.analytics.timeSpentByCourse,
                courseProgress: this.analytics.courseProgress,
                recentActivity: this.getRecentActivity(),
                weeklyProgress: this.getWeeklyProgress(),
                learningTrends: this.getLearningTrends(),
                topicMastery: this.analytics.topicMastery,
                performanceMetrics: this.getPerformanceMetrics()
            };
        }

        /**
         * Get recent activity (last 7 days)
         */
        getRecentActivity() {
            const sevenDaysAgo = new Date();
            sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

            return this.analytics.sessionHistory
                .filter(session => new Date(session.date) >= sevenDaysAgo)
                .sort((a, b) => new Date(b.date) - new Date(a.date))
                .slice(0, 10);
        }

        /**
         * Get weekly progress data
         */
        getWeeklyProgress() {
            const weeklyData = {};
            const today = new Date();
            
            // Get last 7 days
            for (let i = 6; i >= 0; i--) {
                const date = new Date(today);
                date.setDate(date.getDate() - i);
                const dateStr = date.toISOString().split('T')[0];
                const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
                
                weeklyData[dayName] = this.analytics.dailyActivity[dateStr] || 0;
            }

            return weeklyData;
        }

        /**
         * Get learning trends
         */
        getLearningTrends() {
            const trends = {
                mostActiveDay: null,
                averageDailyTime: 0,
                totalActiveDays: 0,
                consistencyScore: 0
            };

            const dailyActivity = this.analytics.dailyActivity;
            const days = Object.keys(dailyActivity);
            
            if (days.length === 0) return trends;

            // Find most active day
            let maxTime = 0;
            let maxDay = null;
            let totalTime = 0;

            for (const [day, time] of Object.entries(dailyActivity)) {
                totalTime += time;
                if (time > maxTime) {
                    maxTime = time;
                    maxDay = new Date(day).toLocaleDateString('en-US', { weekday: 'long' });
                }
            }

            trends.mostActiveDay = maxDay;
            trends.averageDailyTime = Math.round(totalTime / days.length);
            trends.totalActiveDays = days.length;
            
            // Calculate consistency score (0-100)
            const last30Days = 30;
            const activeDaysLast30 = days.filter(day => {
                const dayDate = new Date(day);
                const thirtyDaysAgo = new Date();
                thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
                return dayDate >= thirtyDaysAgo;
            }).length;
            
            trends.consistencyScore = Math.round((activeDaysLast30 / last30Days) * 100);

            return trends;
        }

        /**
         * Get performance metrics
         */
        getPerformanceMetrics() {
            const metrics = {
                quizPerformance: {
                    totalQuizzes: this.analytics.quizScores.length,
                    averageScore: this.analytics.averageScore,
                    highestScore: 0,
                    lowestScore: 100,
                    improvementTrend: 0
                },
                learningVelocity: {
                    topicsPerWeek: 0,
                    hoursPerWeek: 0,
                    completionRate: 0
                }
            };

            // Quiz performance
            if (this.analytics.quizScores.length > 0) {
                const scores = this.analytics.quizScores.map(q => q.percentage);
                metrics.quizPerformance.highestScore = Math.max(...scores);
                metrics.quizPerformance.lowestScore = Math.min(...scores);

                // Calculate improvement trend (last 5 vs first 5 quizzes)
                if (scores.length >= 10) {
                    const firstFive = scores.slice(0, 5).reduce((a, b) => a + b) / 5;
                    const lastFive = scores.slice(-5).reduce((a, b) => a + b) / 5;
                    metrics.quizPerformance.improvementTrend = Math.round(lastFive - firstFive);
                }
            }

            // Learning velocity
            const weeklyActivity = this.getWeeklyProgress();
            const weeklyMinutes = Object.values(weeklyActivity).reduce((a, b) => a + b, 0);
            metrics.learningVelocity.hoursPerWeek = Math.round(weeklyMinutes / 60 * 10) / 10;

            return metrics;
        }

        /**
         * Generate sample data for demonstration
         */
        generateSampleData() {
            console.log('Generating sample analytics data...');
            
            // Realistic course topics based on actual course outlines
            const courseTopics = {
                'course_js': [
                    'What is JavaScript?', 'Variables and Scope', 'Functions and Methods', 
                    'DOM Manipulation', 'Event Handling', 'Async/Await', 'ES6 Modules',
                    'Object-Oriented Programming', 'Error Handling', 'Debugging Techniques'
                ],
                'course_backend': [
                    'Backend Fundamentals', 'Node.js Basics', 'Express.js Framework',
                    'Database Integration', 'Authentication', 'RESTful APIs', 'Security Best Practices',
                    'Testing Strategies', 'Deployment', 'Performance Optimization'
                ],
                'course_uiux': [
                    'Design Fundamentals', 'User Research', 'Wireframing', 'Prototyping',
                    'Visual Design', 'Mobile Design', 'Accessibility', 'Design Tools',
                    'User Testing', 'Design Systems'
                ]
            };
            
            // Generate realistic study sessions over the past 2 weeks
            const courses = ['course_js', 'course_backend', 'course_uiux'];
            const now = new Date();
            
            for (let day = 14; day >= 0; day--) {
                const studyDate = new Date(now);
                studyDate.setDate(studyDate.getDate() - day);
                
                // Skip some days to make it realistic (not studying every day)
                if (Math.random() > 0.7) continue;
                
                // Random course selection with preference for JavaScript
                const courseWeights = { 'course_js': 0.5, 'course_backend': 0.3, 'course_uiux': 0.2 };
                const rand = Math.random();
                let selectedCourse;
                if (rand < 0.5) selectedCourse = 'course_js';
                else if (rand < 0.8) selectedCourse = 'course_backend';
                else selectedCourse = 'course_uiux';
                
                // Realistic study time (15-90 minutes)
                const studyTime = Math.floor(Math.random() * 75) + 15;
                this.trackTimeSpent(selectedCourse, studyTime);
                
                // Sometimes take quizzes (30% chance)
                if (Math.random() < 0.3) {
                    const topics = courseTopics[selectedCourse];
                    const randomTopic = topics[Math.floor(Math.random() * topics.length)];
                    const score = Math.floor(Math.random() * 4) + 7; // 7-10 score
                    this.trackQuizScore(selectedCourse, score, 10, randomTopic);
                }
            }
            
            // Add some achievements
            this.trackAchievement('first_lesson', 'First Steps', 50);
            this.trackAchievement('quiz_master', 'Quiz Master', 100);
            this.trackAchievement('consistency', 'Consistency Champion', 150);
            
            // Set realistic course progress
            this.updateCourseProgress('course_js', 78);
            this.updateCourseProgress('course_backend', 45);
            this.updateCourseProgress('course_uiux', 23);
            
            // Mark JavaScript course as completed if high progress
            if (this.analytics.courseProgress['course_js'] >= 75) {
                this.trackCourseCompletion('course_js', 'Javascript Adventure');
            }

            console.log('Sample data generated successfully');
        }

        /**
         * Reset all analytics data
         */
        resetAnalytics() {
            localStorage.removeItem(this.storageKey);
            this.analytics = this.loadAnalytics();
            console.log('Analytics data reset');
        }

        /**
         * Export analytics data
         */
        exportData() {
            return {
                analytics: this.analytics,
                summary: this.getAnalyticsSummary(),
                exportedAt: new Date().toISOString()
            };
        }
    }

    // Create global instance
    window.AnalyticsEngine = new AnalyticsEngine();

    // Auto-track page visits
    document.addEventListener('DOMContentLoaded', function() {
        // Track page visit
        const currentPage = window.location.pathname.split('/').pop() || 'index.html';
        window.AnalyticsEngine.analytics.sessionHistory.push({
            page: currentPage,
            date: new Date().toISOString(),
            type: 'page_visit'
        });
        window.AnalyticsEngine.saveAnalytics();
    });

    console.log('Analytics Engine loaded successfully');
})();