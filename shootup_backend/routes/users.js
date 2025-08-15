const express = require('express');
const User = require('../models/User');
const auth = require('../middleware/auth');

const router = express.Router();

// Get user profile
router.get('/profile', auth, async (req, res) => {
  try {
    const user = await User.findById(req.userId).select('-password');
    res.json(user);
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update user profile
router.put('/profile', auth, async (req, res) => {
  try {
    const { firstName, lastName, displayName, preferences } = req.body;
    
    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Update fields
    if (firstName) user.firstName = firstName;
    if (lastName) user.lastName = lastName;
    if (displayName) user.displayName = displayName;
    if (preferences) user.preferences = { ...user.preferences, ...preferences };

    await user.save();

    res.json({
      message: 'Profile updated successfully',
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        displayName: user.displayName,
        preferences: user.preferences
      }
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get user dashboard data
router.get('/dashboard', auth, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    
    const totalCourses = user.enrolledCourses.length;
    const completedCourses = user.enrolledCourses.filter(course => course.progress === 100).length;
    const inProgressCourses = user.enrolledCourses.filter(course => course.progress > 0 && course.progress < 100).length;
    
    // Calculate total hours learned (estimate based on progress)
    const hoursLearned = user.enrolledCourses.reduce((total, course) => {
      return total + Math.floor((course.progress / 100) * 40); // Assume 40 hours per course
    }, 0);

    const dashboardData = {
      totalCourses,
      completed: completedCourses,
      inProgress: inProgressCourses,
      hoursLearned,
      recentActivity: user.enrolledCourses
        .filter(course => course.progress > 0)
        .sort((a, b) => new Date(b.enrolledAt) - new Date(a.enrolledAt))
        .slice(0, 5)
        .map(course => ({
          courseId: course.courseId,
          progress: course.progress,
          lastActivity: course.enrolledAt
        }))
    };

    res.json(dashboardData);
  } catch (error) {
    console.error('Get dashboard error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;