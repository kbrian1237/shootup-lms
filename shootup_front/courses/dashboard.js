// LMS Dashboard JavaScript
const API_BASE_URL = 'http://localhost:3000/api';

// Function to get course progress from Local Storage (unified system)
function getCourseProgress(courseId) {
    const progress = localStorage.getItem(`progress_${courseId}`);
    return progress ? parseInt(progress, 10) : 0;
}

// Global state
let currentUser = null;
let currentSection = 'dashboard';
let courses = [];
let enrolledCourses = [];
let communityPosts = [];

// Initialize dashboard
document.addEventListener('DOMContentLoaded', function() {
    initializeDashboard();
});

async function initializeDashboard() {
    try {
        // Check authentication
        const token = localStorage.getItem('authToken');
        const userData = localStorage.getItem('userData');
        
        if (!token || !userData) {
            window.location.href = 'signin.html';
            return;
        }
        
        currentUser = JSON.parse(userData);
        
        // Initialize UI
        setupEventListeners();
        updateUserInterface();
        
        // Load initial data
        await loadDashboardData();
        
        // Show default section
        showSection('dashboard');
        
    } catch (error) {
        console.error('Dashboard initialization error:', error);
        showAlert('Error', 'Failed to initialize dashboard', 'error');
    }
}

function setupEventListeners() {
    // User menu toggle
    const userMenuBtn = document.getElementById('userMenuBtn');
    const userDropdown = document.getElementById('userDropdown');
    
    userMenuBtn.addEventListener('click', function(e) {
        e.stopPropagation();
        userDropdown.classList.toggle('show');
    });
    
    // Close dropdown when clicking outside
    document.addEventListener('click', function() {
        userDropdown.classList.remove('show');
    });
    
    // Search functionality
    const searchInput = document.getElementById('searchInput');
    searchInput.addEventListener('input', handleSearch);
    
    // Tab switching
    document.addEventListener('click', function(e) {
        if (e.target.classList.contains('tab-btn')) {
            switchTab(e.target);
        }
    });
    
    // Form submissions
    const forms = document.querySelectorAll('form');
    forms.forEach(form => {
        form.addEventListener('submit', handleFormSubmit);
    });
}

function updateUserInterface() {
    // Update user information in various places
    const userNameElements = document.querySelectorAll('#userName, #welcomeUserName, #dropdownUserName, #profileUserName');
    const userEmailElements = document.querySelectorAll('#dropdownUserEmail, #profileUserEmail');
    const userAvatarElements = document.querySelectorAll('#userAvatarImg, #profileAvatarImg');
    
    userNameElements.forEach(el => {
        el.textContent = currentUser.username;
    });
    
    userEmailElements.forEach(el => {
        el.textContent = currentUser.email;
    });
    
    // Set user avatar (placeholder for now)
    const avatarUrl = `https://via.placeholder.com/120x120/3b82f6/ffffff?text=${currentUser.username.charAt(0).toUpperCase()}`;
    userAvatarElements.forEach(el => {
        el.src = avatarUrl;
    });
}

async function loadDashboardData() {
    try {
        showLoading(true);
        
        // Load courses
        await loadCourses();
        
        // Load enrolled courses
        await loadEnrolledCourses();
        
        // Load community posts
        await loadCommunityPosts();
        
        // Update dashboard stats
        updateDashboardStats();
        
    } catch (error) {
        console.error('Error loading dashboard data:', error);
        showAlert('Error', 'Failed to load dashboard data', 'error');
    } finally {
        showLoading(false);
    }
}

async function loadCourses() {
    try {
        const response = await fetch(`${API_BASE_URL}/courses`);
        const result = await response.json();
        
        if (result.success) {
            courses = result.data;
            renderCourses();
        }
    } catch (error) {
        console.error('Error loading courses:', error);
    }
}

async function loadEnrolledCourses() {
    try {
        const token = localStorage.getItem('authToken');
        const response = await fetch(`${API_BASE_URL}/users/enrolled-courses`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (response.ok) {
            const result = await response.json();
            enrolledCourses = result.data || [];
            renderEnrolledCourses();
        }
    } catch (error) {
        console.error('Error loading enrolled courses:', error);
    }
}

async function loadCommunityPosts() {
    try {
        const response = await fetch(`${API_BASE_URL}/posts`);
        if (response.ok) {
            const result = await response.json();
            communityPosts = result.data || [];
            renderCommunityPosts();
        }
    } catch (error) {
        console.error('Error loading community posts:', error);
    }
}

function renderCourses() {
    const allCoursesGrid = document.getElementById('allCoursesGrid');
    const recommendedCoursesGrid = document.getElementById('recommendedCoursesGrid');
    
    if (allCoursesGrid) {
        allCoursesGrid.innerHTML = courses.map(course => createCourseCard(course)).join('');
    }
    
    if (recommendedCoursesGrid) {
        // Show first 3 courses as recommended
        const recommended = courses.slice(0, 3);
        recommendedCoursesGrid.innerHTML = recommended.map(course => createCourseCard(course)).join('');
    }
}

function renderEnrolledCourses() {
    const continueCoursesGrid = document.getElementById('continueCoursesGrid');
    const enrolledCoursesGrid = document.getElementById('enrolledCoursesGrid');
    
    if (continueCoursesGrid) {
        // Show first 3 enrolled courses
        const continueCourses = enrolledCourses.slice(0, 3);
        continueCoursesGrid.innerHTML = continueCourses.map(course => createEnrolledCourseCard(course)).join('');
    }
    
    if (enrolledCoursesGrid) {
        enrolledCoursesGrid.innerHTML = enrolledCourses.map(course => createEnrolledCourseCard(course)).join('');
    }
}

function renderCommunityPosts() {
    const discussionsPosts = document.getElementById('discussionsPosts');
    const questionsPosts = document.getElementById('questionsPosts');
    
    if (discussionsPosts) {
        const discussions = communityPosts.filter(post => post.type !== 'question');
        discussionsPosts.innerHTML = discussions.map(post => createPostCard(post)).join('');
    }
    
    if (questionsPosts) {
        const questions = communityPosts.filter(post => post.type === 'question');
        questionsPosts.innerHTML = questions.map(post => createPostCard(post)).join('');
    }
}

function createCourseCard(course) {
    return `
        <div class="course-card" onclick="viewCourse(${course.id})">
            <div class="course-image">
                <i class="fas fa-book-open"></i>
            </div>
            <div class="course-content">
                <h3 class="course-title">${course.title}</h3>
                <p class="course-instructor">by ${course.instructor_name || 'Instructor'}</p>
                <p class="course-description">${course.description || 'No description available'}</p>
                <div class="course-meta">
                    <div class="course-rating">
                        <i class="fas fa-star"></i>
                        <span>4.5</span>
                    </div>
                    <div class="course-students">
                        <i class="fas fa-users"></i>
                        <span>1,234 students</span>
                    </div>
                </div>
                <div class="course-actions">
                    <button class="btn primary" onclick="event.stopPropagation(); enrollInCourse(${course.id})">
                        <i class="fas fa-plus"></i>
                        Enroll
                    </button>
                    <button class="btn outline" onclick="event.stopPropagation(); addToWishlist(${course.id})">
                        <i class="fas fa-heart"></i>
                    </button>
                </div>
            </div>
        </div>
    `;
}

function createEnrolledCourseCard(course) {
    // Get progress from localStorage using the unified system
    const progress = getCourseProgress(course.id);
    return `
        <div class="course-card" onclick="continueCourse(${course.id})">
            <div class="course-image">
                <i class="fas fa-book-open"></i>
                <div class="course-progress-overlay">
                    <div class="course-progress-bar" style="width: ${progress}%"></div>
                </div>
            </div>
            <div class="course-content">
                <h3 class="course-title">${course.title}</h3>
                <p class="course-instructor">by ${course.instructor_name || 'Instructor'}</p>
                <div class="course-meta">
                    <div class="course-rating">
                        <i class="fas fa-clock"></i>
                        <span>${progress}% complete</span>
                    </div>
                </div>
                <div class="course-actions">
                    <button class="btn primary" onclick="event.stopPropagation(); continueCourse(${course.id})">
                        <i class="fas fa-play"></i>
                        Continue
                    </button>
                </div>
            </div>
        </div>
    `;
}

function createPostCard(post) {
    return `
        <div class="post-card">
            <div class="post-header">
                <img src="https://via.placeholder.com/40x40/3b82f6/ffffff?text=${post.author?.charAt(0) || 'U'}" alt="Avatar" class="post-avatar">
                <div>
                    <div class="post-author">${post.author || 'Anonymous'}</div>
                    <div class="post-date">${formatDate(post.created_at)}</div>
                </div>
            </div>
            <h3 class="post-title">${post.title}</h3>
            <p class="post-content">${post.content}</p>
            <div class="post-actions">
                <button class="post-action" onclick="likePost(${post.id})">
                    <i class="fas fa-thumbs-up"></i>
                    <span>${post.likes || 0}</span>
                </button>
                <button class="post-action" onclick="commentOnPost(${post.id})">
                    <i class="fas fa-comment"></i>
                    <span>${post.comments || 0}</span>
                </button>
                <button class="post-action">
                    <i class="fas fa-share"></i>
                    Share
                </button>
            </div>
        </div>
    `;
}

function updateDashboardStats() {
    // Update stats cards
    document.getElementById('enrolledCoursesCount').textContent = enrolledCourses.length;
    document.getElementById('studyHours').textContent = '24'; // Placeholder
    document.getElementById('certificatesCount').textContent = '2'; // Placeholder
    document.getElementById('achievementsCount').textContent = '5'; // Placeholder
    
    // Update progress stats
    document.getElementById('coursesInProgress').textContent = enrolledCourses.length;
    document.getElementById('lessonsCompleted').textContent = '45'; // Placeholder
    document.getElementById('quizAverage').textContent = '87%'; // Placeholder
    
    // Update overall progress circle
    const overallProgress = 65; // Placeholder
    updateProgressCircle('overallProgressCircle', overallProgress);
    document.getElementById('overallProgressPercentage').textContent = `${overallProgress}%`;
    
    // Render activity feed
    renderActivityFeed();
}

function updateProgressCircle(elementId, percentage) {
    const circle = document.getElementById(elementId);
    if (circle) {
        const radius = circle.r.baseVal.value;
        const circumference = radius * 2 * Math.PI;
        const offset = circumference - (percentage / 100) * circumference;
        
        circle.style.strokeDasharray = `${circumference} ${circumference}`;
        circle.style.strokeDashoffset = offset;
    }
}

function renderActivityFeed() {
    const activityFeed = document.getElementById('activityFeed');
    if (!activityFeed) return;
    
    const activities = [
        {
            type: 'course',
            icon: 'fas fa-book',
            title: 'Completed lesson: Introduction to JavaScript',
            description: 'Web Development Fundamentals',
            time: '2 hours ago'
        },
        {
            type: 'quiz',
            icon: 'fas fa-check-circle',
            title: 'Passed quiz with 95% score',
            description: 'HTML & CSS Basics',
            time: '1 day ago'
        },
        {
            type: 'certificate',
            icon: 'fas fa-certificate',
            title: 'Earned certificate',
            description: 'JavaScript Fundamentals',
            time: '3 days ago'
        }
    ];
    
    activityFeed.innerHTML = activities.map(activity => `
        <div class="activity-item">
            <div class="activity-icon ${activity.type}">
                <i class="${activity.icon}"></i>
            </div>
            <div class="activity-content">
                <div class="activity-title">${activity.title}</div>
                <div class="activity-description">${activity.description}</div>
            </div>
            <div class="activity-time">${activity.time}</div>
        </div>
    `).join('');
}

function showSection(sectionName) {
    // Update sidebar active state
    document.querySelectorAll('.menu-item').forEach(item => {
        item.classList.remove('active');
        if (item.dataset.section === sectionName) {
            item.classList.add('active');
        }
    });
    
    // Show/hide sections
    document.querySelectorAll('.content-section').forEach(section => {
        section.classList.remove('active');
    });
    
    const targetSection = document.getElementById(`${sectionName}-section`);
    if (targetSection) {
        targetSection.classList.add('active');
        currentSection = sectionName;
    }
    
    // Load section-specific data
    loadSectionData(sectionName);
}

async function loadSectionData(sectionName) {
    switch (sectionName) {
        case 'courses':
            if (courses.length === 0) {
                await loadCourses();
            }
            break;
        case 'my-courses':
            if (enrolledCourses.length === 0) {
                await loadEnrolledCourses();
            }
            break;
        case 'community':
            if (communityPosts.length === 0) {
                await loadCommunityPosts();
            }
            break;
    }
}

function switchTab(tabBtn) {
    const tabContainer = tabBtn.closest('.course-tabs, .community-tabs, .profile-tabs');
    const contentContainer = tabContainer.nextElementSibling;
    const targetTab = tabBtn.dataset.tab;
    
    // Update tab buttons
    tabContainer.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    tabBtn.classList.add('active');
    
    // Update tab content
    contentContainer.querySelectorAll('.tab-pane').forEach(pane => {
        pane.classList.remove('active');
    });
    
    const targetPane = contentContainer.querySelector(`#${targetTab}-tab`);
    if (targetPane) {
        targetPane.classList.add('active');
    }
}

async function handleSearch(event) {
    const query = event.target.value.trim();
    const searchResults = document.getElementById('searchResults');
    
    if (query.length < 2) {
        searchResults.style.display = 'none';
        return;
    }
    
    // Filter courses based on search query
    const filteredCourses = courses.filter(course => 
        course.title.toLowerCase().includes(query.toLowerCase()) ||
        course.description.toLowerCase().includes(query.toLowerCase())
    );
    
    // Display search results
    searchResults.innerHTML = filteredCourses.slice(0, 5).map(course => `
        <div class="search-result-item" onclick="viewCourse(${course.id})">
            <div class="search-result-title">${course.title}</div>
            <div class="search-result-description">${course.description}</div>
        </div>
    `).join('');
    
    searchResults.style.display = filteredCourses.length > 0 ? 'block' : 'none';
}

async function enrollInCourse(courseId) {
    try {
        const token = localStorage.getItem('authToken');
        const response = await fetch(`${API_BASE_URL}/courses/${courseId}/enroll`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        
        const result = await response.json();
        
        if (result.success) {
            showAlert('Success', 'Successfully enrolled in course!', 'success');
            await loadEnrolledCourses();
        } else {
            showAlert('Error', result.error || 'Failed to enroll in course', 'error');
        }
    } catch (error) {
        console.error('Enrollment error:', error);
        showAlert('Error', 'Failed to enroll in course', 'error');
    }
}

function viewCourse(courseId) {
    // Navigate to course detail page
    window.location.href = `course-detail.html?id=${courseId}`;
}

function continueCourse(courseId) {
    // Navigate to course learning page
    window.location.href = `course-learn.html?id=${courseId}`;
}

function addToWishlist(courseId) {
    // Add to wishlist functionality
    showAlert('Info', 'Added to wishlist!', 'success');
}

function openCreatePostModal() {
    const modal = document.getElementById('createPostModal');
    modal.classList.add('show');
}

function closeCreatePostModal() {
    const modal = document.getElementById('createPostModal');
    modal.classList.remove('show');
    
    // Reset form
    document.getElementById('createPostForm').reset();
}

async function submitPost() {
    const form = document.getElementById('createPostForm');
    const formData = new FormData(form);
    const postData = Object.fromEntries(formData.entries());
    
    try {
        const token = localStorage.getItem('authToken');
        const response = await fetch(`${API_BASE_URL}/posts`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(postData)
        });
        
        const result = await response.json();
        
        if (result.success) {
            showAlert('Success', 'Post created successfully!', 'success');
            closeCreatePostModal();
            await loadCommunityPosts();
        } else {
            showAlert('Error', result.error || 'Failed to create post', 'error');
        }
    } catch (error) {
        console.error('Post creation error:', error);
        showAlert('Error', 'Failed to create post', 'error');
    }
}

async function handleFormSubmit(event) {
    event.preventDefault();
    
    const form = event.target;
    const formId = form.id;
    
    switch (formId) {
        case 'personalInfoForm':
            await updatePersonalInfo(form);
            break;
        case 'securityForm':
            await updatePassword(form);
            break;
        case 'preferencesForm':
            await updatePreferences(form);
            break;
    }
}

async function updatePersonalInfo(form) {
    const formData = new FormData(form);
    const data = Object.fromEntries(formData.entries());
    
    // Update personal info via API
    showAlert('Success', 'Personal information updated successfully!', 'success');
}

async function updatePassword(form) {
    const formData = new FormData(form);
    const data = Object.fromEntries(formData.entries());
    
    if (data.newPassword !== data.confirmNewPassword) {
        showAlert('Error', 'New passwords do not match', 'error');
        return;
    }
    
    // Update password via API
    showAlert('Success', 'Password updated successfully!', 'success');
    form.reset();
}

async function updatePreferences(form) {
    const formData = new FormData(form);
    const data = Object.fromEntries(formData.entries());
    
    // Update preferences via API
    showAlert('Success', 'Preferences updated successfully!', 'success');
}

function likePost(postId) {
    // Like post functionality
    console.log('Liked post:', postId);
}

function commentOnPost(postId) {
    // Comment on post functionality
    console.log('Comment on post:', postId);
}

function logout() {
    localStorage.removeItem('authToken');
    localStorage.removeItem('userData');
    window.location.href = 'signin.html';
}

function showLoading(show) {
    const loadingOverlay = document.getElementById('loadingOverlay');
    if (show) {
        loadingOverlay.classList.remove('hidden');
    } else {
        loadingOverlay.classList.add('hidden');
    }
}

function showAlert(title, message, type = 'info') {
    // Create and show alert (you can implement a proper alert system)
    console.log(`${type.toUpperCase()}: ${title} - ${message}`);
    
    // For now, use browser alert
    alert(`${title}: ${message}`);
}

function formatDate(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) {
        return 'Yesterday';
    } else if (diffDays < 7) {
        return `${diffDays} days ago`;
    } else {
        return date.toLocaleDateString();
    }
}

// Close modals when clicking outside
document.addEventListener('click', function(event) {
    const modals = document.querySelectorAll('.modal');
    modals.forEach(modal => {
        if (event.target === modal) {
            modal.classList.remove('show');
        }
    });
});

// Handle escape key to close modals
document.addEventListener('keydown', function(event) {
    if (event.key === 'Escape') {
        const modals = document.querySelectorAll('.modal.show');
        modals.forEach(modal => {
            modal.classList.remove('show');
        });
    }
});

