# ShootUp LMS Authentication System

## Overview
The authentication system has been improved with Firebase integration and localStorage fallback for demo purposes.

## Features
- ✅ User registration with validation
- ✅ User login with email/password
- ✅ Password strength indicator
- ✅ Password visibility toggle
- ✅ Form validation and error handling
- ✅ Loading states for better UX
- ✅ Authentication checks on protected pages
- ✅ Demo users for testing
- ✅ Remember me functionality
- ✅ Logout functionality

## Demo Users
For testing purposes, the following demo users are automatically created:

1. **Demo User**
   - Email: `demo@shootup.com`
   - Password: `Demo123!`

2. **Admin User**
   - Email: `admin@shootup.com`
   - Password: `Admin123!`

## Files Structure
```
dist/
├── firebase-config.js      # Firebase configuration
├── auth.js                 # Main authentication logic
├── auth-enhanced.js        # Enhanced features (password toggle, strength)
├── auth-check.js          # Authentication check for protected pages
└── style.css              # Basic styles
```

## Password Requirements
- Minimum 8 characters
- At least 1 uppercase letter
- At least 1 lowercase letter
- At least 1 number
- Special characters are recommended for stronger passwords

## Firebase Setup (Optional)
To use Firebase authentication instead of localStorage:

1. Create a Firebase project
2. Enable Authentication with Email/Password
3. Update `firebase-config.js` with your project credentials
4. Replace placeholder values with actual Firebase config

## Usage
1. Navigate to `login.html`
2. Use demo credentials or create a new account
3. The system will redirect to `dashboard.html` upon successful authentication
4. Protected pages automatically check for authentication

## Security Notes
- Passwords are stored in plain text in localStorage (demo only)
- In production, use Firebase or proper backend authentication
- Implement proper password hashing and security measures
- Add HTTPS in production environment

## Browser Support
- Modern browsers with ES6+ support
- localStorage support required for demo mode
- Firebase SDK compatibility for Firebase mode