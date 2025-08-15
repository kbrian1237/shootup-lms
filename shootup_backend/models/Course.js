const mongoose = require('mongoose');

const quizSchema = new mongoose.Schema({
  question: {
    type: String,
    required: true
  },
  options: [{
    type: String,
    required: true
  }],
  correctAnswer: {
    type: String,
    required: true
  }
});

const sectionSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  content: [{
    type: {
      type: String,
      enum: ['p', 'h3', 'h4', 'ul', 'code'],
      required: true
    },
    text: String,
    code: String,
    listItems: [String]
  }],
  quizzes: [quizSchema]
});

const scheduleGroupSchema = new mongoose.Schema({
  day: {
    type: Number,
    required: true
  },
  title: {
    type: String,
    required: true
  },
  estimatedHours: {
    type: Number,
    required: true
  },
  topics: [{
    section: String,
    topic: String
  }]
});

const courseSchema = new mongoose.Schema({
  courseId: {
    type: String,
    required: true,
    unique: true
  },
  title: {
    type: String,
    required: true
  },
  category: {
    type: String,
    required: true
  },
  level: {
    type: String,
    enum: ['Beginner', 'Intermediate', 'Advanced'],
    required: true
  },
  rating: {
    type: Number,
    min: 0,
    max: 5,
    default: 0
  },
  banner: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  outline: [{
    title: String,
    topics: [String]
  }],
  sections: [sectionSchema],
  scheduleGroups: [scheduleGroupSchema],
  instructor: {
    type: String,
    default: 'ShootUp Team'
  },
  duration: {
    type: String,
    default: 'Self-paced'
  },
  enrollmentCount: {
    type: Number,
    default: 0
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Index for search functionality
courseSchema.index({ title: 'text', description: 'text', category: 'text' });

// Method to get course statistics
courseSchema.methods.getStats = function() {
  return {
    totalSections: this.sections.length,
    totalQuizzes: this.sections.reduce((total, section) => total + section.quizzes.length, 0),
    enrollmentCount: this.enrollmentCount,
    rating: this.rating
  };
};

module.exports = mongoose.model('Course', courseSchema);