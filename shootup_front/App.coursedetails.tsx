import React from 'react';
import { ThemeProvider } from '@mui/material/styles';
import { CssBaseline } from '@mui/material';
import CourseDetailsPage from './src/components/CourseDetailsPage';
import Layout from './src/components/Layout';
import theme from './src/theme';

const App: React.FC = () => {
  const handleStartCourse = (courseId: string) => {
    console.log('Starting course:', courseId);
    // In a real app, this would navigate to the course content
    alert(`Starting course: ${courseId}`);
  };

  const handleBack = () => {
    console.log('Going back to courses');
    // In a real app, this would navigate back to the courses list
    alert('Going back to courses list');
  };

  const handleNavigate = (href: string) => {
    console.log('Navigating to:', href);
    // In a real app, this would handle navigation
    alert(`Navigating to: ${href}`);
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Layout 
        currentPath="course-details" 
        onNavigate={handleNavigate}
      >
        <CourseDetailsPage
          courseId="course_js"
          onStartCourse={handleStartCourse}
          onBack={handleBack}
        />
      </Layout>
    </ThemeProvider>
  );
};

export default App;