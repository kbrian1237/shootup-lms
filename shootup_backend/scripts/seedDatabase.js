const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const Course = require('../models/Course');
require('dotenv').config();

const seedDatabase = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('Connected to MongoDB');

    // Clear existing courses
    await Course.deleteMany({});
    console.log('Cleared existing courses');

    // Read course JSON files
    const coursesDir = path.join(__dirname, '../../shootup_front/courses');
    const courseFiles = ['backend.json', 'html.json', 'javascript.json', 'uiux.json'];

    const courses = [];

    for (const file of courseFiles) {
      const filePath = path.join(coursesDir, file);
      if (fs.existsSync(filePath)) {
        const courseData = JSON.parse(fs.readFileSync(filePath, 'utf8'));
        
        // Create course object with courseId
        const course = {
          courseId: file.replace('.json', ''),
          ...courseData,
          enrollmentCount: Math.floor(Math.random() * 1000) + 100, // Random enrollment count
          isActive: true
        };

        courses.push(course);
      }
    }

    // Insert courses into database
    const insertedCourses = await Course.insertMany(courses);
    console.log(`Inserted ${insertedCourses.length} courses`);

    // Display course information
    insertedCourses.forEach(course => {
      console.log(`- ${course.title} (${course.courseId})`);
      console.log(`  Category: ${course.category}, Level: ${course.level}`);
      console.log(`  Sections: ${course.sections.length}, Rating: ${course.rating}`);
    });

    console.log('Database seeding completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
};

seedDatabase();