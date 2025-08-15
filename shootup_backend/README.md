# ShootUp LMS Backend

A Node.js/Express backend API for the ShootUp Learning Management System with MongoDB integration.

## Features

- **Authentication**: JWT-based user authentication with bcrypt password hashing
- **Course Management**: Full CRUD operations for courses with enrollment tracking
- **Progress Tracking**: User progress monitoring with quiz scores and section completion
- **Security**: Rate limiting, CORS, helmet security headers
- **Database**: MongoDB with Mongoose ODM
- **Deployment Ready**: Configured for Vercel deployment

## Quick Start

### Prerequisites

- Node.js (v14 or higher)
- MongoDB (local or MongoDB Atlas)
- VS Code with MongoDB extension (for development)

### Installation

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Set up environment variables:**
   ```bash
   cp .env.example .env
   ```
   Update `.env` with your MongoDB connection string and JWT secret.

3. **Seed the database:**
   ```bash
   npm run seed
   ```

4. **Start the development server:**
   ```bash
   npm run dev
   ```

The API will be available at `http://localhost:5000`

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user
- `POST /api/auth/logout` - Logout user

### Courses
- `GET /api/courses` - Get all courses (with filters)
- `GET /api/courses/:courseId` - Get specific course
- `POST /api/courses/:courseId/enroll` - Enroll in course
- `GET /api/courses/user/enrolled` - Get user's enrolled courses
- `GET /api/courses/meta/categories` - Get course categories

### Users
- `GET /api/users/profile` - Get user profile
- `PUT /api/users/profile` - Update user profile
- `GET /api/users/dashboard` - Get dashboard data

### Progress
- `POST /api/progress/course/:courseId` - Update course progress
- `GET /api/progress/course/:courseId` - Get course progress
- `GET /api/progress/overview` - Get progress overview

## Database Schema

### User Model
- Personal information (firstName, lastName, email)
- Authentication (hashed password)
- Course enrollments with progress tracking
- User preferences and settings

### Course Model
- Course metadata (title, description, category, level)
- Course content (sections, quizzes, outline)
- Enrollment statistics
- Schedule groups for structured learning

## Deployment

### Vercel Deployment

1. **Install Vercel CLI:**
   ```bash
   npm i -g vercel
   ```

2. **Deploy:**
   ```bash
   vercel
   ```

3. **Set environment variables in Vercel dashboard:**
   - `MONGODB_URI`: Your MongoDB connection string
   - `JWT_SECRET`: Your JWT secret key
   - `NODE_ENV`: production

### MongoDB Setup

For production, use MongoDB Atlas:
1. Create a MongoDB Atlas account
2. Create a new cluster
3. Get the connection string
4. Add it to your environment variables

## Development

### Database Seeding

The seeding script automatically imports course data from the frontend JSON files:

```bash
npm run seed
```

This will:
- Clear existing courses
- Import courses from `../shootup_front/courses/*.json`
- Create proper database documents with all course content

### VS Code MongoDB Extension

1. Install the MongoDB extension for VS Code
2. Connect to your MongoDB instance
3. Browse collections and documents directly in VS Code

## Security Features

- **JWT Authentication**: Secure token-based authentication
- **Password Hashing**: bcrypt with salt rounds
- **Rate Limiting**: Prevents API abuse
- **CORS**: Configured for frontend domains
- **Helmet**: Security headers
- **Input Validation**: Mongoose schema validation

## Environment Variables

```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/shootup_lms
JWT_SECRET=your_jwt_secret_key_here
NODE_ENV=development
```

## Scripts

- `npm start` - Start production server
- `npm run dev` - Start development server with nodemon
- `npm run seed` - Seed database with course data

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

MIT License - see LICENSE file for details