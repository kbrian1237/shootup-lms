const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  firstName: {
    type: String,
    required: true,
    trim: true
  },
  lastName: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  displayName: {
    type: String,
    trim: true
  },
  role: {
    type: String,
    enum: ['student', 'instructor', 'admin'],
    default: 'student'
  },
  enrolledCourses: [{
    courseId: {
      type: String,
      required: true
    },
    enrolledAt: {
      type: Date,
      default: Date.now
    },
    progress: {
      type: Number,
      default: 0,
      min: 0,
      max: 100
    },
    completedSections: [{
      sectionId: String,
      completedAt: Date
    }],
    quizScores: [{
      sectionId: String,
      score: Number,
      totalQuestions: Number,
      completedAt: Date
    }]
  }],
  preferences: {
    theme: {
      type: String,
      enum: ['light', 'dark', 'auto'],
      default: 'auto'
    },
    notifications: {
      type: Boolean,
      default: true
    }
  }
}, {
  timestamps: true
});

// Virtual for full name
userSchema.virtual('fullName').get(function() {
  return `${this.firstName} ${this.lastName}`;
});

// Pre-save middleware to hash password
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    
    // Set displayName if not provided
    if (!this.displayName) {
      this.displayName = this.fullName;
    }
    
    next();
  } catch (error) {
    next(error);
  }
});

// Method to compare password
userSchema.methods.comparePassword = async function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// Method to get user's course progress
userSchema.methods.getCourseProgress = function(courseId) {
  const enrollment = this.enrolledCourses.find(course => course.courseId === courseId);
  return enrollment ? enrollment.progress : 0;
};

// Method to update course progress
userSchema.methods.updateCourseProgress = function(courseId, progress) {
  const enrollment = this.enrolledCourses.find(course => course.courseId === courseId);
  if (enrollment) {
    enrollment.progress = Math.max(enrollment.progress, progress);
  }
  return this.save();
};

module.exports = mongoose.model('User', userSchema);