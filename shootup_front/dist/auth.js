// Authentication functionality
class AuthManager {
    constructor() {
        this.auth = window.firebaseAuth || firebase.auth();
        this.currentUser = null;
        this.init();
    }

    init() {
        // Check authentication state
        this.auth.onAuthStateChanged((user) => {
            this.currentUser = user;
            if (user && window.location.pathname.includes('login.html')) {
                window.location.href = 'dashboard.html';
            }
        });

        // Initialize form handlers
        this.initFormHandlers();
        this.initTabSwitching();
    }

    initTabSwitching() {
        const loginTab = document.getElementById('loginTab');
        const registerTab = document.getElementById('registerTab');
        const loginForm = document.getElementById('loginForm');
        const registerForm = document.getElementById('registerForm');

        if (loginTab && registerTab) {
            loginTab.addEventListener('click', () => {
                loginTab.classList.add('active');
                registerTab.classList.remove('active');
                loginForm.classList.remove('hidden');
                registerForm.classList.add('hidden');
            });

            registerTab.addEventListener('click', () => {
                registerTab.classList.add('active');
                loginTab.classList.remove('active');
                registerForm.classList.remove('hidden');
                loginForm.classList.add('hidden');
            });
        }
    }

    initFormHandlers() {
        const loginForm = document.getElementById('loginForm');
        const registerForm = document.getElementById('registerForm');

        if (loginForm) {
            loginForm.addEventListener('submit', (e) => this.handleLogin(e));
        }

        if (registerForm) {
            registerForm.addEventListener('submit', (e) => this.handleRegister(e));
        }
    }

    async handleLogin(e) {
        e.preventDefault();
        
        const email = document.getElementById('loginEmail').value.trim();
        const password = document.getElementById('loginPassword').value;
        const messageEl = document.getElementById('loginMessage');

        if (!this.validateEmail(email)) {
            this.showMessage(messageEl, 'Please enter a valid email address', 'error');
            return;
        }

        if (password.length < 6) {
            this.showMessage(messageEl, 'Password must be at least 6 characters', 'error');
            return;
        }

        try {
            this.showMessage(messageEl, 'Signing in...', 'info');
            this.setButtonLoading('loginBtn', 'loginBtnText', 'loginSpinner', true);
            
            // Try backend API first
            const isBackendAvailable = await window.apiClient.isBackendAvailable();
            
            if (isBackendAvailable) {
                const response = await window.apiClient.login({ email, password });
                localStorage.setItem('shootup_current_user', JSON.stringify(response.user));
                this.showMessage(messageEl, 'Login successful!', 'success');
                // Trigger navigation update
                document.dispatchEvent(new CustomEvent('authStateChanged'));
                setTimeout(() => window.location.href = 'dashboard.html', 1000);
            } else if (this.isFirebaseConfigured()) {
                await this.auth.signInWithEmailAndPassword(email, password);
            } else {
                // Fallback to localStorage for demo
                await new Promise(resolve => setTimeout(resolve, 1000));
                
                const users = JSON.parse(localStorage.getItem('shootup_users') || '[]');
                const user = users.find(u => u.email === email && u.password === password);
                
                if (user) {
                    localStorage.setItem('shootup_current_user', JSON.stringify(user));
                    this.showMessage(messageEl, 'Login successful!', 'success');
                    // Trigger navigation update
                    document.dispatchEvent(new CustomEvent('authStateChanged'));
                    setTimeout(() => window.location.href = 'dashboard.html', 1000);
                } else {
                    throw new Error('Invalid email or password');
                }
            }
        } catch (error) {
            this.showMessage(messageEl, this.getErrorMessage(error), 'error');
            this.setButtonLoading('loginBtn', 'loginBtnText', 'loginSpinner', false);
            document.dispatchEvent(new CustomEvent('authError'));
        }
    }

    async handleRegister(e) {
        e.preventDefault();
        
        const firstName = document.getElementById('firstName').value.trim();
        const lastName = document.getElementById('lastName').value.trim();
        const email = document.getElementById('registerEmail').value.trim();
        const password = document.getElementById('registerPassword').value;
        const messageEl = document.getElementById('registerMessage');

        if (!firstName || !lastName) {
            this.showMessage(messageEl, 'Please enter your first and last name', 'error');
            return;
        }

        if (!this.validateEmail(email)) {
            this.showMessage(messageEl, 'Please enter a valid email address', 'error');
            return;
        }

        if (!this.validatePassword(password)) {
            this.showMessage(messageEl, 'Password must be at least 8 characters with uppercase, lowercase, and number', 'error');
            return;
        }

        try {
            this.showMessage(messageEl, 'Creating account...', 'info');
            this.setButtonLoading('registerBtn', 'registerBtnText', 'registerSpinner', true);
            
            // Try backend API first
            const isBackendAvailable = await window.apiClient.isBackendAvailable();
            
            if (isBackendAvailable) {
                const response = await window.apiClient.register({ firstName, lastName, email, password });
                localStorage.setItem('shootup_current_user', JSON.stringify(response.user));
                this.showMessage(messageEl, 'Account created successfully!', 'success');
                // Trigger navigation update
                document.dispatchEvent(new CustomEvent('authStateChanged'));
                setTimeout(() => window.location.href = 'dashboard.html', 1000);
            } else if (this.isFirebaseConfigured()) {
                const userCredential = await this.auth.createUserWithEmailAndPassword(email, password);
                await userCredential.user.updateProfile({
                    displayName: `${firstName} ${lastName}`
                });
            } else {
                // Fallback to localStorage for demo
                await new Promise(resolve => setTimeout(resolve, 1500));
                
                const users = JSON.parse(localStorage.getItem('shootup_users') || '[]');
                
                if (users.find(u => u.email === email)) {
                    throw new Error('Email already registered');
                }

                const newUser = {
                    id: Date.now().toString(),
                    email,
                    password,
                    firstName,
                    lastName,
                    displayName: `${firstName} ${lastName}`,
                    createdAt: new Date().toISOString()
                };

                users.push(newUser);
                localStorage.setItem('shootup_users', JSON.stringify(users));
                localStorage.setItem('shootup_current_user', JSON.stringify(newUser));
                // Trigger navigation update
                document.dispatchEvent(new CustomEvent('authStateChanged'));
            }

            this.showMessage(messageEl, 'Account created successfully!', 'success');
            setTimeout(() => window.location.href = 'dashboard.html', 1000);
        } catch (error) {
            this.showMessage(messageEl, this.getErrorMessage(error), 'error');
            this.setButtonLoading('registerBtn', 'registerBtnText', 'registerSpinner', false);
            document.dispatchEvent(new CustomEvent('authError'));
        }
    }

    validateEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    validatePassword(password) {
        // At least 8 characters, 1 uppercase, 1 lowercase, 1 number
        const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d@$!%*?&]{8,}$/;
        return passwordRegex.test(password);
    }

    showMessage(element, message, type) {
        if (!element) return;
        
        element.textContent = message;
        element.className = `text-sm text-center ${
            type === 'error' ? 'text-red-400' : 
            type === 'success' ? 'text-green-400' : 
            'text-blue-400'
        }`;
    }

    getErrorMessage(error) {
        const errorMessages = {
            'auth/user-not-found': 'No account found with this email',
            'auth/wrong-password': 'Incorrect password',
            'auth/email-already-in-use': 'Email already registered',
            'auth/weak-password': 'Password is too weak',
            'auth/invalid-email': 'Invalid email address',
            'auth/too-many-requests': 'Too many failed attempts. Try again later'
        };

        return errorMessages[error.code] || error.message || 'An error occurred';
    }

    isFirebaseConfigured() {
        try {
            const config = firebase.app().options;
            return config.apiKey && config.apiKey !== 'your-api-key-here';
        } catch {
            return false;
        }
    }

    async signOut() {
        try {
            if (this.isFirebaseConfigured()) {
                await this.auth.signOut();
            } else {
                localStorage.removeItem('shootup_current_user');
            }
            // Trigger navigation update
            document.dispatchEvent(new CustomEvent('authStateChanged'));
            window.location.href = 'login.html';
        } catch (error) {
            console.error('Sign out error:', error);
        }
    }

    getCurrentUser() {
        if (this.isFirebaseConfigured()) {
            return this.currentUser;
        } else {
            return JSON.parse(localStorage.getItem('shootup_current_user') || 'null');
        }
    }

    requireAuth() {
        const user = this.getCurrentUser();
        if (!user && !window.location.pathname.includes('login.html') && !window.location.pathname.includes('landing.html')) {
            window.location.href = 'login.html';
            return false;
        }
        return true;
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
}

// Initialize authentication when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.authManager = new AuthManager();
});

// Export for global use
window.AuthManager = AuthManager;
