const express = require('express');
const Course = require('../models/Course');
const User = require('../models/User');
const auth = require('../middleware/auth');

const router = express.Router();

// Get all courses
router.get('/', async (req, res) => {
  try {
    const { category, level, search } = req.query;
    let query = { isActive: true };

    if (category) query.category = category;
    if (level) query.level = level;
    if (search) {
      query.$text = { $search: search };
    }

    const courses = await Course.find(query).select('-sections');
    res.json(courses);
  } catch (error) {
    console.error('Get courses error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get course by ID
router.get('/:courseId', async (req, res) => {
  try {
    const course = await Course.findOne({ courseId: req.params.courseId });
    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }
    res.json(course);
  } catch (error) {
    console.error('Get course error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Enroll in course
router.post('/:courseId/enroll', auth, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    const course = await Course.findOne({ courseId: req.params.courseId });

    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }

    // Check if already enrolled
    const existingEnrollment = user.enrolledCourses.find(
      enrollment => enrollment.courseId === req.params.courseId
    );

    if (existingEnrollment) {
      return res.status(400).json({ message: 'Already enrolled in this course' });
    }

    // Add enrollment
    user.enrolledCourses.push({
      courseId: req.params.courseId,
      progress: 0,
      completedSections: [],
      quizScores: []
    });

    // Update course enrollment count
    course.enrollmentCount += 1;

    await Promise.all([user.save(), course.save()]);

    res.json({ message: 'Successfully enrolled in course' });
  } catch (error) {
    console.error('Enrollment error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get user's enrolled courses
router.get('/user/enrolled', auth, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    const enrolledCourseIds = user.enrolledCourses.map(enrollment => enrollment.courseId);
    
    const courses = await Course.find({ 
      courseId: { $in: enrolledCourseIds },
      isActive: true 
    }).select('-sections');

    // Add progress information
    const coursesWithProgress = courses.map(course => {
      const enrollment = user.enrolledCourses.find(e => e.courseId === course.courseId);
      return {
        ...course.toObject(),
        progress: enrollment ? enrollment.progress : 0,
        enrolledAt: enrollment ? enrollment.enrolledAt : null
      };
    });

    res.json(coursesWithProgress);
  } catch (error) {
    console.error('Get enrolled courses error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get course categories
router.get('/meta/categories', async (req, res) => {
  try {
    const categories = await Course.distinct('category', { isActive: true });
    res.json(categories);
  } catch (error) {
    console.error('Get categories error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;