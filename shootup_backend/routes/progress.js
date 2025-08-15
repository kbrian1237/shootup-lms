const express = require('express');
const User = require('../models/User');
const Course = require('../models/Course');
const auth = require('../middleware/auth');

const router = express.Router();

// Update course progress
router.post('/course/:courseId', auth, async (req, res) => {
  try {
    const { progress, sectionId, quizScore } = req.body;
    const user = await User.findById(req.userId);
    
    const enrollment = user.enrolledCourses.find(
      course => course.courseId === req.params.courseId
    );

    if (!enrollment) {
      return res.status(404).json({ message: 'Not enrolled in this course' });
    }

    // Update progress
    if (progress !== undefined) {
      enrollment.progress = Math.max(enrollment.progress, progress);
    }

    // Mark section as completed
    if (sectionId && !enrollment.completedSections.find(s => s.sectionId === sectionId)) {
      enrollment.completedSections.push({
        sectionId,
        completedAt: new Date()
      });
    }

    // Save quiz score
    if (quizScore && sectionId) {
      const existingScore = enrollment.quizScores.find(s => s.sectionId === sectionId);
      if (existingScore) {
        // Update if better score
        if (quizScore.score > existingScore.score) {
          existingScore.score = quizScore.score;
          existingScore.totalQuestions = quizScore.totalQuestions;
          existingScore.completedAt = new Date();
        }
      } else {
        enrollment.quizScores.push({
          sectionId,
          score: quizScore.score,
          totalQuestions: quizScore.totalQuestions,
          completedAt: new Date()
        });
      }
    }

    await user.save();

    res.json({
      message: 'Progress updated successfully',
      progress: enrollment.progress,
      completedSections: enrollment.completedSections.length
    });
  } catch (error) {
    console.error('Update progress error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get course progress
router.get('/course/:courseId', auth, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    const enrollment = user.enrolledCourses.find(
      course => course.courseId === req.params.courseId
    );

    if (!enrollment) {
      return res.status(404).json({ message: 'Not enrolled in this course' });
    }

    res.json({
      courseId: req.params.courseId,
      progress: enrollment.progress,
      completedSections: enrollment.completedSections,
      quizScores: enrollment.quizScores,
      enrolledAt: enrollment.enrolledAt
    });
  } catch (error) {
    console.error('Get progress error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get overall user progress
router.get('/overview', auth, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    
    const progressOverview = user.enrolledCourses.map(enrollment => ({
      courseId: enrollment.courseId,
      progress: enrollment.progress,
      completedSections: enrollment.completedSections.length,
      totalQuizzes: enrollment.quizScores.length,
      averageQuizScore: enrollment.quizScores.length > 0 
        ? enrollment.quizScores.reduce((sum, quiz) => sum + (quiz.score / quiz.totalQuestions * 100), 0) / enrollment.quizScores.length
        : 0,
      enrolledAt: enrollment.enrolledAt
    }));

    res.json(progressOverview);
  } catch (error) {
    console.error('Get progress overview error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;