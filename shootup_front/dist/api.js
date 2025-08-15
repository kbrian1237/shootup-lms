// API client for ShootUp LMS Backend
class APIClient {
    constructor() {
        this.baseURL = 'https://shootup-gzkp9hdic-kbrian1237s-projects.vercel.app/api';
        this.token = localStorage.getItem('shootup_token');
    }

    // Set authentication token
    setToken(token) {
        this.token = token;
        if (token) {
            localStorage.setItem('shootup_token', token);
        } else {
            localStorage.removeItem('shootup_token');
        }
    }

    // Get authentication headers
    getHeaders() {
        const headers = {
            'Content-Type': 'application/json'
        };
        
        if (this.token) {
            headers['Authorization'] = `Bearer ${this.token}`;
        }
        
        return headers;
    }

    // Generic request method
    async request(endpoint, options = {}) {
        const url = `${this.baseURL}${endpoint}`;
        const config = {
            headers: this.getHeaders(),
            ...options
        };

        try {
            const response = await fetch(url, config);
            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'API request failed');
            }

            return data;
        } catch (error) {
            console.error('API request error:', error);
            throw error;
        }
    }

    // Authentication methods
    async register(userData) {
        const response = await this.request('/auth/register', {
            method: 'POST',
            body: JSON.stringify(userData)
        });
        
        if (response.token) {
            this.setToken(response.token);
        }
        
        return response;
    }

    async login(credentials) {
        const response = await this.request('/auth/login', {
            method: 'POST',
            body: JSON.stringify(credentials)
        });
        
        if (response.token) {
            this.setToken(response.token);
        }
        
        return response;
    }

    async logout() {
        await this.request('/auth/logout', { method: 'POST' });
        this.setToken(null);
    }

    async getCurrentUser() {
        return this.request('/auth/me');
    }

    // Course methods
    async getCourses(filters = {}) {
        const params = new URLSearchParams(filters);
        return this.request(`/courses?${params}`);
    }

    async getCourse(courseId) {
        return this.request(`/courses/${courseId}`);
    }

    async enrollInCourse(courseId) {
        return this.request(`/courses/${courseId}/enroll`, {
            method: 'POST'
        });
    }

    async getEnrolledCourses() {
        return this.request('/courses/user/enrolled');
    }

    async getCourseCategories() {
        return this.request('/courses/meta/categories');
    }

    // User methods
    async getUserProfile() {
        return this.request('/users/profile');
    }

    async updateUserProfile(profileData) {
        return this.request('/users/profile', {
            method: 'PUT',
            body: JSON.stringify(profileData)
        });
    }

    async getDashboardData() {
        return this.request('/users/dashboard');
    }

    // Progress methods
    async updateCourseProgress(courseId, progressData) {
        return this.request(`/progress/course/${courseId}`, {
            method: 'POST',
            body: JSON.stringify(progressData)
        });
    }

    async getCourseProgress(courseId) {
        return this.request(`/progress/course/${courseId}`);
    }

    async getProgressOverview() {
        return this.request('/progress/overview');
    }

    // Health check
    async healthCheck() {
        return this.request('/health');
    }

    // Check if backend is available
    async isBackendAvailable() {
        try {
            await this.healthCheck();
            return true;
        } catch (error) {
            return false;
        }
    }
}

// Create global API client instance
window.apiClient = new APIClient();

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = APIClient;
}
