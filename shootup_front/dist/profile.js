// Profile page functionality
class ProfileManager {
    constructor() {
        this.currentUser = null;
        this.isEditing = false;
        this.init();
    }

    async init() {
        await this.loadUserData();
        this.initEventListeners();
    }

    async loadUserData() {
        try {
            // Try to get user data from backend first
            const isBackendAvailable = await window.apiClient.isBackendAvailable();
            
            if (isBackendAvailable) {
                this.currentUser = await window.apiClient.getCurrentUser();
            } else {
                // Fallback to localStorage
                this.currentUser = JSON.parse(localStorage.getItem('shootup_current_user') || 'null');
            }

            if (this.currentUser) {
                this.displayUserData();
                await this.loadDashboardStats();
            } else {
                window.location.href = 'login.html';
            }
        } catch (error) {
            console.error('Error loading user data:', error);
            // Fallback to localStorage
            this.currentUser = JSON.parse(localStorage.getItem('shootup_current_user') || 'null');
            if (this.currentUser) {
                this.displayUserData();
            } else {
                window.location.href = 'login.html';
            }
        }
    }

    displayUserData() {
        if (!this.currentUser) return;

        // Update profile display
        document.getElementById('userName').textContent = this.currentUser.displayName || `${this.currentUser.firstName} ${this.currentUser.lastName}`;
        document.getElementById('userEmail').textContent = this.currentUser.email;
        
        // Update detailed information
        document.getElementById('displayFirstName').textContent = this.currentUser.firstName || 'Not set';
        document.getElementById('displayLastName').textContent = this.currentUser.lastName || 'Not set';
        document.getElementById('displayEmail').textContent = this.currentUser.email;
        document.getElementById('displayDisplayName').textContent = this.currentUser.displayName || 'Not set';
        document.getElementById('displayRole').textContent = this.currentUser.role || 'student';
        
        // Format member since date
        const memberSince = this.currentUser.createdAt || this.currentUser.createdAt;
        if (memberSince) {
            const date = new Date(memberSince);
            document.getElementById('displayMemberSince').textContent = date.toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });
        } else {
            document.getElementById('displayMemberSince').textContent = 'Unknown';
        }

        // Update avatar with user initials
        const initials = `${this.currentUser.firstName?.[0] || ''}${this.currentUser.lastName?.[0] || ''}`.toUpperCase();
        const avatarUrl = `https://placehold.co/120x120/4f46e5/ffffff?text=${initials}`;
        document.getElementById('userAvatar').src = avatarUrl;
    }

    async loadDashboardStats() {
        try {
            const isBackendAvailable = await window.apiClient.isBackendAvailable();
            
            if (isBackendAvailable) {
                const stats = await window.apiClient.getDashboardData();
                document.getElementById('totalCourses').textContent = stats.totalCourses || 0;
                document.getElementById('completedCourses').textContent = stats.completed || 0;
                document.getElementById('hoursLearned').textContent = stats.hoursLearned || 0;
            } else {
                // Fallback to localStorage calculation
                const users = JSON.parse(localStorage.getItem('shootup_users') || '[]');
                const currentUser = users.find(u => u.email === this.currentUser.email);
                
                if (currentUser && currentUser.enrolledCourses) {
                    const totalCourses = currentUser.enrolledCourses.length;
                    const completedCourses = currentUser.enrolledCourses.filter(c => c.progress === 100).length;
                    const hoursLearned = Math.floor(currentUser.enrolledCourses.reduce((total, course) => {
                        return total + (course.progress / 100) * 40; // Assume 40 hours per course
                    }, 0));

                    document.getElementById('totalCourses').textContent = totalCourses;
                    document.getElementById('completedCourses').textContent = completedCourses;
                    document.getElementById('hoursLearned').textContent = hoursLearned;
                } else {
                    // Default values
                    document.getElementById('totalCourses').textContent = '0';
                    document.getElementById('completedCourses').textContent = '0';
                    document.getElementById('hoursLearned').textContent = '0';
                }
            }
        } catch (error) {
            console.error('Error loading dashboard stats:', error);
            // Set default values
            document.getElementById('totalCourses').textContent = '0';
            document.getElementById('completedCourses').textContent = '0';
            document.getElementById('hoursLearned').textContent = '0';
        }
    }

    initEventListeners() {
        // Edit profile button
        document.getElementById('editProfileBtn').addEventListener('click', () => {
            this.toggleEditMode(true);
        });

        // Cancel edit button
        document.getElementById('cancelEditBtn').addEventListener('click', () => {
            this.toggleEditMode(false);
        });

        // Profile form submission
        document.getElementById('profileForm').addEventListener('submit', (e) => {
            this.handleProfileUpdate(e);
        });

        // Logout button
        document.getElementById('logoutBtn').addEventListener('click', () => {
            this.handleLogout();
        });

        // Change password button (placeholder)
        document.getElementById('changePasswordBtn').addEventListener('click', () => {
            alert('Change password functionality coming soon!');
        });

        // Change avatar button (placeholder)
        document.getElementById('changeAvatarBtn').addEventListener('click', () => {
            alert('Avatar upload functionality coming soon!');
        });
    }

    toggleEditMode(editing) {
        this.isEditing = editing;
        const viewMode = document.getElementById('viewMode');
        const editMode = document.getElementById('editMode');
        const editBtn = document.getElementById('editProfileBtn');

        if (editing) {
            viewMode.classList.add('hidden');
            editMode.classList.remove('hidden');
            editBtn.style.display = 'none';

            // Populate edit form
            document.getElementById('editFirstName').value = this.currentUser.firstName || '';
            document.getElementById('editLastName').value = this.currentUser.lastName || '';
            document.getElementById('editDisplayName').value = this.currentUser.displayName || '';
        } else {
            viewMode.classList.remove('hidden');
            editMode.classList.add('hidden');
            editBtn.style.display = 'block';
        }
    }

    async handleProfileUpdate(e) {
        e.preventDefault();

        const firstName = document.getElementById('editFirstName').value.trim();
        const lastName = document.getElementById('editLastName').value.trim();
        const displayName = document.getElementById('editDisplayName').value.trim();

        if (!firstName || !lastName) {
            alert('First name and last name are required.');
            return;
        }

        try {
            this.setButtonLoading('saveProfileBtn', 'saveProfileText', 'saveProfileSpinner', true);

            const updateData = {
                firstName,
                lastName,
                displayName: displayName || `${firstName} ${lastName}`
            };

            const isBackendAvailable = await window.apiClient.isBackendAvailable();

            if (isBackendAvailable) {
                const response = await window.apiClient.updateUserProfile(updateData);
                this.currentUser = { ...this.currentUser, ...response.user };
                localStorage.setItem('shootup_current_user', JSON.stringify(this.currentUser));
            } else {
                // Update localStorage
                const users = JSON.parse(localStorage.getItem('shootup_users') || '[]');
                const userIndex = users.findIndex(u => u.email === this.currentUser.email);
                
                if (userIndex !== -1) {
                    users[userIndex] = { ...users[userIndex], ...updateData };
                    localStorage.setItem('shootup_users', JSON.stringify(users));
                    this.currentUser = { ...this.currentUser, ...updateData };
                    localStorage.setItem('shootup_current_user', JSON.stringify(this.currentUser));
                }
            }

            this.displayUserData();
            this.toggleEditMode(false);
            this.showMessage('Profile updated successfully!', 'success');

        } catch (error) {
            console.error('Error updating profile:', error);
            this.showMessage('Error updating profile. Please try again.', 'error');
        } finally {
            this.setButtonLoading('saveProfileBtn', 'saveProfileText', 'saveProfileSpinner', false);
        }
    }

    async handleLogout() {
        if (confirm('Are you sure you want to logout?')) {
            try {
                const isBackendAvailable = await window.apiClient.isBackendAvailable();
                
                if (isBackendAvailable) {
                    await window.apiClient.logout();
                }
                
                // Clear localStorage
                localStorage.removeItem('shootup_current_user');
                localStorage.removeItem('shootup_token');
                
                // Redirect to login
                window.location.href = 'login.html';
            } catch (error) {
                console.error('Logout error:', error);
                // Force logout even if backend fails
                localStorage.removeItem('shootup_current_user');
                localStorage.removeItem('shootup_token');
                window.location.href = 'login.html';
            }
        }
    }

    setButtonLoading(btnId, textId, spinnerId, isLoading) {
        const btn = document.getElementById(btnId);
        const text = document.getElementById(textId);
        const spinner = document.getElementById(spinnerId);

        if (btn && text && spinner) {
            btn.disabled = isLoading;
            spinner.classList.toggle('hidden', !isLoading);
            
            if (isLoading) {
                btn.classList.add('opacity-75');
            } else {
                btn.classList.remove('opacity-75');
            }
        }
    }

    showMessage(message, type) {
        // Create a temporary message element
        const messageEl = document.createElement('div');
        messageEl.className = `fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg transition-all duration-300 ${
            type === 'success' ? 'bg-green-600 text-white' : 'bg-red-600 text-white'
        }`;
        messageEl.textContent = message;
        
        document.body.appendChild(messageEl);
        
        // Remove after 3 seconds
        setTimeout(() => {
            messageEl.remove();
        }, 3000);
    }
}

// Initialize profile manager when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.profileManager = new ProfileManager();
});
