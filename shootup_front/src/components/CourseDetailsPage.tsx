import React, { useState, useEffect } from 'react';
import {
  Container,
  Stack,
  Box,
  Typography,
  Button,
  Chip,
  LinearProgress,
  Card,
  CardContent,
  IconButton,
  Alert,
  Skeleton
} from '@mui/material';
import {
  ArrowBack,
  Play,
  Bookmark,
  ThumbUp,
  Comment,
  Schedule,
  Star
} from '@mui/icons-material';

interface Course {
  id: string;
  title: string;
  description: string;
  category: string;
  level: string;
  rating: number;
  requirements: string;
  likes: number;
  comments: number;
  image: string;
}

interface CourseDetailsPageProps {
  courseId?: string;
  onStartCourse?: (courseId: string) => void;
  onBack?: () => void;
}

const CourseDetailsPage: React.FC<CourseDetailsPageProps> = ({
  courseId = 'course_js',
  onStartCourse,
  onBack
}) => {
  const [course, setCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const loadCourseData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Mock data for demo - in real app this would come from API
        const mockCourse: Course = {
          id: courseId,
          title: 'Learn JavaScript',
          description: 'Master the fundamentals of JavaScript, from variables and functions to asynchronous programming and DOM manipulation.',
          category: 'Web Development',
          level: 'Beginner',
          rating: 4.5,
          requirements: 'Basic HTML and CSS',
          likes: 1200,
          comments: 34,
          image: 'https://images.unsplash.com/photo-1426024120108-99cc76989c71?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NTAwNDR8MHwxfHNlYXJjaHw4fHxlZHVjYXRpb24lMjB0ZWNobm9sb2d5JTIwbGVhcm5pbmclMjBjb3Vyc2V8ZW58MHwwfHxibHVlfDE3NTUyNDIxMzB8MA&ixlib=rb-4.1.0&q=85'
        };

        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 1000));

        setCourse(mockCourse);
        
        // Get progress from localStorage
        const savedProgress = localStorage.getItem(`progress_${courseId}`);
        setProgress(savedProgress ? parseInt(savedProgress, 10) : 0);

      } catch (err) {
        setError('Failed to load course data. Please try again.');
        console.error('Error loading course:', err);
      } finally {
        setLoading(false);
      }
    };

    loadCourseData();
  }, [courseId]);

  const handleStartCourse = () => {
    if (course && onStartCourse) {
      onStartCourse(course.id);
    }
  };

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      window.history.back();
    }
  };

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Stack spacing={3}>
          <Skeleton variant="rectangular" width={120} height={40} />
          <Stack direction={{ xs: 'column', lg: 'row' }} spacing={4}>
            <Skeleton variant="rectangular" width="100%" height={256} sx={{ maxWidth: { lg: '33%' } }} />
            <Stack spacing={2} sx={{ flex: 1 }}>
              <Skeleton variant="text" sx={{ fontSize: '2rem' }} />
              <Skeleton variant="text" height={60} />
              <Stack direction="row" spacing={2}>
                <Skeleton variant="rounded" width={120} height={32} />
                <Skeleton variant="rounded" width={100} height={32} />
                <Skeleton variant="rounded" width={80} height={32} />
              </Stack>
              <Skeleton variant="rectangular" height={20} />
              <Stack direction="row" spacing={2}>
                <Skeleton variant="rounded" width={140} height={48} />
                <Skeleton variant="rounded" width={120} height={48} />
              </Stack>
            </Stack>
          </Stack>
        </Stack>
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
        <Button onClick={() => window.location.reload()} variant="contained">
          Retry
        </Button>
      </Container>
    );
  }

  if (!course) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Alert severity="warning">
          Course not found.
        </Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Stack spacing={4}>
        {/* Back Button */}
        <Button
          startIcon={<ArrowBack />}
          onClick={handleBack}
          sx={{ alignSelf: 'flex-start', color: 'primary.main' }}
        >
          Back to Courses
        </Button>

        {/* Course Header */}
        <Stack direction={{ xs: 'column', lg: 'row' }} spacing={4}>
          <Box sx={{ width: { xs: '100%', lg: '33%' } }}>
            <Box
              component="img"
              src={course.image}
              alt={`${course.title} - Firmbee.com on Unsplash`}
              sx={{
                width: '100%',
                height: 256,
                objectFit: 'cover',
                borderRadius: 2,
                boxShadow: 3
              }}
            />
          </Box>

          <Stack spacing={3} sx={{ flex: 1 }}>
            <Typography variant="h3" component="h1" fontWeight="bold">
              {course.title}
            </Typography>

            <Typography variant="body1" color="text.secondary" sx={{ lineHeight: 1.6 }}>
              {course.description}
            </Typography>

            <Stack direction="row" spacing={2} flexWrap="wrap">
              <Chip
                label={course.category}
                color="primary"
                sx={{ fontWeight: 'medium' }}
              />
              <Chip
                label={course.level}
                variant="outlined"
                sx={{ fontWeight: 'medium' }}
              />
              <Chip
                icon={<Star />}
                label={course.rating}
                color="warning"
                sx={{ fontWeight: 'medium' }}
              />
            </Stack>

            {/* Progress Bar */}
            <Stack spacing={1}>
              <Stack direction="row" justifyContent="space-between" alignItems="center">
                <Typography variant="body2" color="text.secondary">
                  Progress
                </Typography>
                <Typography variant="body2" color="primary.main" fontWeight="medium">
                  {progress}% Complete
                </Typography>
              </Stack>
              <LinearProgress
                variant="determinate"
                value={progress}
                sx={{ height: 8, borderRadius: 1 }}
              />
            </Stack>

            {/* Action Buttons */}
            <Stack direction="row" spacing={2}>
              <Button
                variant="contained"
                size="large"
                startIcon={<Play />}
                onClick={handleStartCourse}
                sx={{ px: 4 }}
              >
                {progress > 0 ? 'Continue Course' : 'Start Course'}
              </Button>
              <Button
                variant="outlined"
                size="large"
                startIcon={<Bookmark />}
                sx={{ px: 3 }}
              >
                Save for Later
              </Button>
            </Stack>
          </Stack>
        </Stack>

        {/* Course Requirements */}
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Requirements
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {course.requirements}
            </Typography>
          </CardContent>
        </Card>

        {/* Course Stats */}
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={3}>
          <Card sx={{ flex: 1 }}>
            <CardContent sx={{ textAlign: 'center' }}>
              <ThumbUp sx={{ fontSize: 48, color: 'primary.main', mb: 2 }} />
              <Typography variant="h4" fontWeight="bold" gutterBottom>
                {course.likes.toLocaleString()}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Likes
              </Typography>
            </CardContent>
          </Card>

          <Card sx={{ flex: 1 }}>
            <CardContent sx={{ textAlign: 'center' }}>
              <Comment sx={{ fontSize: 48, color: 'success.main', mb: 2 }} />
              <Typography variant="h4" fontWeight="bold" gutterBottom>
                {course.comments}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Comments
              </Typography>
            </CardContent>
          </Card>

          <Card sx={{ flex: 1 }}>
            <CardContent sx={{ textAlign: 'center' }}>
              <Schedule sx={{ fontSize: 48, color: 'warning.main', mb: 2 }} />
              <Typography variant="h4" fontWeight="bold" gutterBottom>
                Self-paced
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Duration
              </Typography>
            </CardContent>
          </Card>
        </Stack>
      </Stack>
    </Container>
  );
};

export default CourseDetailsPage;