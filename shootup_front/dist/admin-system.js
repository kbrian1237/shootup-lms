/**
 * Comprehensive Admin System for ShootUp LMS
 * Manages users, courses, categories, and system analytics
 */

window.AdminSystem = (function() {
    'use strict';
    
    // Admin data storage key
    const ADMIN_STORAGE_KEY = 'shootup_admin_data';
    
    // Default admin data structure
    const DEFAULT_ADMIN_DATA = {
        users: [
            { id: 'u_001', name: 'Jane Doe', email: 'jane.doe@example.com', role: 'Student', joinDate: '2024-01-15', lastActive: '2024-01-20' },
            { id: 'u_002', name: 'John Smith', email: 'john.smith@example.com', role: 'Admin', joinDate: '2024-01-10', lastActive: '2024-01-20' },
            { id: 'u_003', name: 'Alice Johnson', email: 'alice.johnson@example.com', role: 'Student', joinDate: '2024-01-18', lastActive: '2024-01-19' },
            { id: 'u_004', name: 'Bob Wilson', email: 'bob.wilson@example.com', role: 'Student', joinDate: '2024-01-12', lastActive: '2024-01-20' }
        ],
        categories: ['Web Development', 'Data Science', 'Design', 'Mobile Development', 'DevOps'],
        courses: [
            { id: 'course_js', name: 'Javascript Adventure', category: 'Web Development', students: 156, status: 'Active' },
            { id: 'course_backend', name: 'Backend Development Mastery', category: 'Web Development', students: 89, status: 'Active' },
            { id: 'course_uiux', name: 'The Art of UI/UX Design', category: 'Design', students: 203, status: 'Active' }
        ],
        systemStats: {
            totalUsers: 4,
            totalCourses: 3,
            totalCategories: 5,
            activeUsers: 3,
            coursesCompleted: 45,
            totalStudyHours: 1250
        }
    };
    
    /**
     * Get admin data from localStorage or return defaults
     */
    function getAdminData() {
        try {
            const stored = localStorage.getItem(ADMIN_STORAGE_KEY);
            if (stored) {
                const data = JSON.parse(stored);
                // Merge with defaults to ensure all properties exist
                return {
                    ...DEFAULT_ADMIN_DATA,
                    ...data,
                    users: data.users || DEFAULT_ADMIN_DATA.users,
                    categories: data.categories || DEFAULT_ADMIN_DATA.categories,
                    courses: data.courses || DEFAULT_ADMIN_DATA.courses,
                    systemStats: { ...DEFAULT_ADMIN_DATA.systemStats, ...(data.systemStats || {}) }
                };
            }
        } catch (error) {
            console.warn('Error loading admin data:', error);
        }
        return { ...DEFAULT_ADMIN_DATA };
    }
    
    /**
     * Save admin data to localStorage
     */
    function saveAdminData(data) {
        try {
            localStorage.setItem(ADMIN_STORAGE_KEY, JSON.stringify(data));
            console.log('Admin data saved successfully');
        } catch (error) {
            console.error('Error saving admin data:', error);
        }
    }
    
    /**
     * Generate unique ID
     */
    function generateId(prefix = 'id') {
        return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
    
    /**
     * User Management Functions
     */
    const UserManager = {
        /**
         * Get all users
         */
        getUsers() {
            return getAdminData().users;
        },
        
        /**
         * Add new user
         */
        addUser(userData) {
            const adminData = getAdminData();
            const newUser = {
                id: generateId('u'),
                name: userData.name,
                email: userData.email,
                role: userData.role || 'Student',
                joinDate: new Date().toISOString().split('T')[0],
                lastActive: new Date().toISOString().split('T')[0]
            };
            
            // Check for duplicate email
            if (adminData.users.some(user => user.email === newUser.email)) {
                throw new Error('User with this email already exists');
            }
            
            adminData.users.push(newUser);
            adminData.systemStats.totalUsers = adminData.users.length;
            saveAdminData(adminData);
            
            return newUser;
        },
        
        /**
         * Update user
         */
        updateUser(userId, updates) {
            const adminData = getAdminData();
            const userIndex = adminData.users.findIndex(user => user.id === userId);
            
            if (userIndex === -1) {
                throw new Error('User not found');
            }
            
            // Check for duplicate email if email is being updated
            if (updates.email && updates.email !== adminData.users[userIndex].email) {
                if (adminData.users.some(user => user.email === updates.email && user.id !== userId)) {
                    throw new Error('User with this email already exists');
                }
            }
            
            adminData.users[userIndex] = { ...adminData.users[userIndex], ...updates };
            saveAdminData(adminData);
            
            return adminData.users[userIndex];
        },
        
        /**
         * Delete user
         */
        deleteUser(userId) {
            const adminData = getAdminData();
            const userIndex = adminData.users.findIndex(user => user.id === userId);
            
            if (userIndex === -1) {
                throw new Error('User not found');
            }
            
            const deletedUser = adminData.users.splice(userIndex, 1)[0];
            adminData.systemStats.totalUsers = adminData.users.length;
            saveAdminData(adminData);
            
            return deletedUser;
        },
        
        /**
         * Get user statistics
         */
        getUserStats() {
            const users = this.getUsers();
            const now = new Date();
            const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            
            return {
                total: users.length,
                students: users.filter(user => user.role === 'Student').length,
                admins: users.filter(user => user.role === 'Admin').length,
                activeThisWeek: users.filter(user => new Date(user.lastActive) >= weekAgo).length,
                newThisWeek: users.filter(user => new Date(user.joinDate) >= weekAgo).length
            };
        }
    };
    
    /**
     * Category Management Functions
     */
    const CategoryManager = {
        /**
         * Get all categories
         */
        getCategories() {
            return getAdminData().categories;
        },
        
        /**
         * Add new category
         */
        addCategory(categoryName) {
            const adminData = getAdminData();
            
            if (!categoryName || categoryName.trim() === '') {
                throw new Error('Category name is required');
            }
            
            const trimmedName = categoryName.trim();
            
            if (adminData.categories.includes(trimmedName)) {
                throw new Error('Category already exists');
            }
            
            adminData.categories.push(trimmedName);
            adminData.systemStats.totalCategories = adminData.categories.length;
            saveAdminData(adminData);
            
            return trimmedName;
        },
        
        /**
         * Delete category
         */
        deleteCategory(categoryName) {
            const adminData = getAdminData();
            const categoryIndex = adminData.categories.indexOf(categoryName);
            
            if (categoryIndex === -1) {
                throw new Error('Category not found');
            }
            
            // Check if any courses use this category
            const coursesUsingCategory = adminData.courses.filter(course => course.category === categoryName);
            if (coursesUsingCategory.length > 0) {
                throw new Error(`Cannot delete category. ${coursesUsingCategory.length} courses are using this category.`);
            }
            
            adminData.categories.splice(categoryIndex, 1);
            adminData.systemStats.totalCategories = adminData.categories.length;
            saveAdminData(adminData);
            
            return categoryName;
        }
    };
    
    /**
     * Course Management Functions
     */
    const CourseManager = {
        /**
         * Get all courses
         */
        getCourses() {
            return getAdminData().courses;
        },
        
        /**
         * Add new course
         */
        addCourse(courseData) {
            const adminData = getAdminData();
            const newCourse = {
                id: generateId('course'),
                name: courseData.name,
                category: courseData.category,
                description: courseData.description || '',
                level: courseData.level || 'Beginner',
                requirements: courseData.requirements || 'None',
                students: 0,
                status: 'Active',
                createdDate: new Date().toISOString().split('T')[0]
            };
            
            // Check for duplicate course name
            if (adminData.courses.some(course => course.name === newCourse.name)) {
                throw new Error('Course with this name already exists');
            }
            
            adminData.courses.push(newCourse);
            adminData.systemStats.totalCourses = adminData.courses.length;
            saveAdminData(adminData);
            
            return newCourse;
        },
        
        /**
         * Update course
         */
        updateCourse(courseId, updates) {
            const adminData = getAdminData();
            const courseIndex = adminData.courses.findIndex(course => course.id === courseId);
            
            if (courseIndex === -1) {
                throw new Error('Course not found');
            }
            
            // Check for duplicate name if name is being updated
            if (updates.name && updates.name !== adminData.courses[courseIndex].name) {
                if (adminData.courses.some(course => course.name === updates.name && course.id !== courseId)) {
                    throw new Error('Course with this name already exists');
                }
            }
            
            adminData.courses[courseIndex] = { ...adminData.courses[courseIndex], ...updates };
            saveAdminData(adminData);
            
            return adminData.courses[courseIndex];
        },
        
        /**
         * Delete course
         */
        deleteCourse(courseId) {
            const adminData = getAdminData();
            const courseIndex = adminData.courses.findIndex(course => course.id === courseId);
            
            if (courseIndex === -1) {
                throw new Error('Course not found');
            }
            
            const deletedCourse = adminData.courses.splice(courseIndex, 1)[0];
            adminData.systemStats.totalCourses = adminData.courses.length;
            saveAdminData(adminData);
            
            return deletedCourse;
        },
        
        /**
         * Get course statistics
         */
        getCourseStats() {
            const courses = this.getCourses();
            const categories = CategoryManager.getCategories();
            
            const statsByCategory = {};
            categories.forEach(category => {
                statsByCategory[category] = courses.filter(course => course.category === category).length;
            });
            
            return {
                total: courses.length,
                active: courses.filter(course => course.status === 'Active').length,
                totalStudents: courses.reduce((sum, course) => sum + (course.students || 0), 0),
                averageStudentsPerCourse: Math.round(courses.reduce((sum, course) => sum + (course.students || 0), 0) / courses.length),
                byCategory: statsByCategory
            };
        }
    };
    
    /**
     * System Analytics Functions
     */
    const SystemAnalytics = {
        /**
         * Get comprehensive system statistics
         */
        getSystemStats() {
            const adminData = getAdminData();
            const userStats = UserManager.getUserStats();
            const courseStats = CourseManager.getCourseStats();
            
            // Get analytics data if available
            let analyticsData = null;
            if (window.AnalyticsEngine) {
                try {
                    const summary = window.AnalyticsEngine.getAnalyticsSummary();
                    analyticsData = summary.overview;
                } catch (error) {
                    console.warn('Could not get analytics data:', error);
                }
            }
            
            return {
                users: userStats,
                courses: courseStats,
                categories: {
                    total: CategoryManager.getCategories().length
                },
                learning: analyticsData ? {
                    totalTimeSpent: analyticsData.totalTimeSpentHours,
                    coursesCompleted: analyticsData.coursesCompleted,
                    averageScore: analyticsData.averageScore,
                    studyStreak: analyticsData.studyStreak
                } : {
                    totalTimeSpent: adminData.systemStats.totalStudyHours || 0,
                    coursesCompleted: adminData.systemStats.coursesCompleted || 0,
                    averageScore: 0,
                    studyStreak: 0
                }
            };
        },
        
        /**
         * Get user activity data for charts
         */
        getUserActivityData() {
            const users = UserManager.getUsers();
            const now = new Date();
            const last7Days = [];
            
            for (let i = 6; i >= 0; i--) {
                const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
                const dateStr = date.toISOString().split('T')[0];
                const activeUsers = users.filter(user => user.lastActive === dateStr).length;
                
                last7Days.push({
                    date: dateStr,
                    day: date.toLocaleDateString('en-US', { weekday: 'short' }),
                    activeUsers: activeUsers
                });
            }
            
            return last7Days;
        },
        
        /**
         * Get course enrollment data
         */
        getCourseEnrollmentData() {
            const courses = CourseManager.getCourses();
            return courses.map(course => ({
                name: course.name,
                students: course.students || 0,
                category: course.category
            })).sort((a, b) => b.students - a.students);
        }
    };
    
    /**
     * Generate sample admin data for demonstration
     */
    function generateSampleData() {
        const sampleUsers = [
            { name: 'Emma Davis', email: 'emma.davis@example.com', role: 'Student' },
            { name: 'Michael Brown', email: 'michael.brown@example.com', role: 'Student' },
            { name: 'Sarah Wilson', email: 'sarah.wilson@example.com', role: 'Admin' },
            { name: 'David Miller', email: 'david.miller@example.com', role: 'Student' },
            { name: 'Lisa Anderson', email: 'lisa.anderson@example.com', role: 'Student' }
        ];
        
        const sampleCategories = ['Machine Learning', 'Cybersecurity', 'Cloud Computing'];
        
        const sampleCourses = [
            { name: 'Python for Data Science', category: 'Data Science', description: 'Learn Python for data analysis and machine learning' },
            { name: 'React Native Development', category: 'Mobile Development', description: 'Build mobile apps with React Native' },
            { name: 'AWS Cloud Fundamentals', category: 'DevOps', description: 'Master AWS cloud services and deployment' }
        ];
        
        // Add sample users
        sampleUsers.forEach(userData => {
            try {
                UserManager.addUser(userData);
            } catch (error) {
                console.log(`User ${userData.email} already exists`);
            }
        });
        
        // Add sample categories
        sampleCategories.forEach(category => {
            try {
                CategoryManager.addCategory(category);
            } catch (error) {
                console.log(`Category ${category} already exists`);
            }
        });
        
        // Add sample courses
        sampleCourses.forEach(courseData => {
            try {
                CourseManager.addCourse(courseData);
            } catch (error) {
                console.log(`Course ${courseData.name} already exists`);
            }
        });
        
        console.log('Sample admin data generated successfully');
    }
    
    /**
     * Reset all admin data
     */
    function resetAdminData() {
        localStorage.removeItem(ADMIN_STORAGE_KEY);
        console.log('Admin data reset to defaults');
    }
    
    /**
     * Export admin data
     */
    function exportAdminData() {
        const adminData = getAdminData();
        const exportData = {
            ...adminData,
            exportDate: new Date().toISOString(),
            version: '1.0'
        };
        
        return exportData;
    }
    
    /**
     * Import admin data
     */
    function importAdminData(importData) {
        try {
            // Validate import data structure
            if (!importData.users || !importData.categories || !importData.courses) {
                throw new Error('Invalid import data structure');
            }
            
            saveAdminData(importData);
            console.log('Admin data imported successfully');
            return true;
        } catch (error) {
            console.error('Error importing admin data:', error);
            throw error;
        }
    }
    
    /**
     * Initialize admin system
     */
    function initialize() {
        // Ensure admin data exists
        const adminData = getAdminData();
        if (!localStorage.getItem(ADMIN_STORAGE_KEY)) {
            saveAdminData(adminData);
        }
        
        console.log('Admin System initialized');
    }
    
    // Auto-initialize
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initialize);
    } else {
        initialize();
    }
    
    // Public API
    return {
        // User Management
        users: UserManager,
        
        // Category Management
        categories: CategoryManager,
        
        // Course Management
        courses: CourseManager,
        
        // System Analytics
        analytics: SystemAnalytics,
        
        // Data Management
        generateSampleData,
        resetAdminData,
        exportAdminData,
        importAdminData,
        
        // Utility
        initialize
    };
})();