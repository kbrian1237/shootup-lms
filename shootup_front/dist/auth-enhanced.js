// Enhanced authentication features
document.addEventListener('DOMContentLoaded', () => {
    initPasswordToggles();
    initPasswordStrength();
    initFormEnhancements();
});

function initPasswordToggles() {
    // Login password toggle
    const loginToggle = document.getElementById('toggleLoginPassword');
    const loginPassword = document.getElementById('loginPassword');
    const loginIcon = document.getElementById('loginPasswordIcon');

    if (loginToggle && loginPassword && loginIcon) {
        loginToggle.addEventListener('click', () => {
            const isPassword = loginPassword.type === 'password';
            loginPassword.type = isPassword ? 'text' : 'password';
            loginIcon.className = isPassword ? 'fas fa-eye-slash' : 'fas fa-eye';
        });
    }

    // Register password toggle
    const registerToggle = document.getElementById('toggleRegisterPassword');
    const registerPassword = document.getElementById('registerPassword');
    const registerIcon = document.getElementById('registerPasswordIcon');

    if (registerToggle && registerPassword && registerIcon) {
        registerToggle.addEventListener('click', () => {
            const isPassword = registerPassword.type === 'password';
            registerPassword.type = isPassword ? 'text' : 'password';
            registerIcon.className = isPassword ? 'fas fa-eye-slash' : 'fas fa-eye';
        });
    }
}

function initPasswordStrength() {
    const passwordInput = document.getElementById('registerPassword');
    const strengthBars = ['strength1', 'strength2', 'strength3', 'strength4'];
    const strengthText = document.getElementById('strengthText');

    if (!passwordInput || !strengthText) return;

    passwordInput.addEventListener('input', (e) => {
        const password = e.target.value;
        const strength = calculatePasswordStrength(password);
        updateStrengthIndicator(strength, strengthBars, strengthText);
    });
}

function calculatePasswordStrength(password) {
    let score = 0;
    const checks = {
        length: password.length >= 8,
        lowercase: /[a-z]/.test(password),
        uppercase: /[A-Z]/.test(password),
        numbers: /\d/.test(password),
        special: /[!@#$%^&*(),.?\":{}|<>]/.test(password)
    };

    // Basic length check
    if (checks.length) score++;
    if (checks.lowercase) score++;
    if (checks.uppercase) score++;
    if (checks.numbers) score++;
    if (checks.special) score++;

    // Bonus for longer passwords
    if (password.length >= 12) score++;

    return {
        score: Math.min(score, 4),
        checks,
        level: score <= 1 ? 'weak' : score <= 2 ? 'fair' : score <= 3 ? 'good' : 'strong'
    };
}

function updateStrengthIndicator(strength, strengthBars, strengthText) {
    const colors = {
        0: 'bg-gray-600',
        1: 'bg-red-500',
        2: 'bg-yellow-500',
        3: 'bg-blue-500',
        4: 'bg-green-500'
    };

    const messages = {
        weak: 'Weak password',
        fair: 'Fair password',
        good: 'Good password',
        strong: 'Strong password'
    };

    // Update strength bars
    strengthBars.forEach((barId, index) => {
        const bar = document.getElementById(barId);
        if (bar) {
            bar.className = `h-1 w-1/4 rounded ${index < strength.score ? colors[strength.score] : 'bg-gray-600'}`;
        }
    });

    // Update strength text
    if (strength.score === 0) {
        strengthText.textContent = 'Password must be 8+ characters with uppercase, lowercase, and number';
        strengthText.className = 'text-gray-400';
    } else {
        strengthText.textContent = messages[strength.level];
        strengthText.className = strength.score <= 1 ? 'text-red-400' : 
                                 strength.score <= 2 ? 'text-yellow-400' : 
                                 strength.score <= 3 ? 'text-blue-400' : 'text-green-400';
    }
}

function initFormEnhancements() {
    // Add loading states to buttons
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');

    if (loginForm) {
        loginForm.addEventListener('submit', () => {
            setButtonLoading('loginBtn', 'loginBtnText', 'loginSpinner', true);
        });
    }

    if (registerForm) {
        registerForm.addEventListener('submit', () => {
            setButtonLoading('registerBtn', 'registerBtnText', 'registerSpinner', true);
        });
    }

    // Reset loading states on form errors
    document.addEventListener('authError', () => {
        setButtonLoading('loginBtn', 'loginBtnText', 'loginSpinner', false);
        setButtonLoading('registerBtn', 'registerBtnText', 'registerSpinner', false);
    });
}

function setButtonLoading(btnId, textId, spinnerId, isLoading) {
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

// Demo user creation for testing
function createDemoUsers() {
    const demoUsers = [
        {
            id: 'demo1',
            email: 'demo@shootup.com',
            password: 'Demo123!',
            firstName: 'Demo',
            lastName: 'User',
            displayName: 'Demo User',
            createdAt: new Date().toISOString()
        },
        {
            id: 'admin1',
            email: 'admin@shootup.com',
            password: 'Admin123!',
            firstName: 'Admin',
            lastName: 'User',
            displayName: 'Admin User',
            createdAt: new Date().toISOString()
        }
    ];

    const existingUsers = JSON.parse(localStorage.getItem('shootup_users') || '[]');
    if (existingUsers.length === 0) {
        localStorage.setItem('shootup_users', JSON.stringify(demoUsers));
        console.log('Demo users created:', demoUsers.map(u => ({ email: u.email, password: u.password })));
    }
}

// Create demo users on page load
createDemoUsers();