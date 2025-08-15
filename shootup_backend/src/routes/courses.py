from flask import Blueprint, request, jsonify, session
from src.models.user import db, Course, Category, User, Lesson, Enrollment, Review
from datetime import datetime
from sqlalchemy import or_, and_

courses_bp = Blueprint('courses', __name__)

def require_auth():
    if 'user_id' not in session:
        return jsonify({'error': 'Authentication required'}), 401
    return None

def require_role(allowed_roles):
    auth_error = require_auth()
    if auth_error:
        return auth_error
    
    if session.get('role') not in allowed_roles:
        return jsonify({'error': 'Insufficient permissions'}), 403
    return None

@courses_bp.route('/', methods=['GET'])
def get_courses():
    try:
        # Get query parameters
        page = int(request.args.get('page', 1))
        per_page = int(request.args.get('per_page', 10))
        category_id = request.args.get('category_id')
        search = request.args.get('search')
        status = request.args.get('status', 'approved')
        featured = request.args.get('featured')
        
        # Build query
        query = Course.query
        
        # Filter by status
        if status:
            query = query.filter(Course.status == status)
        
        # Filter by category
        if category_id:
            query = query.filter(Course.category_id == category_id)
        
        # Filter by featured
        if featured == 'true':
            query = query.filter(Course.is_featured == True)
        
        # Search functionality
        if search:
            query = query.filter(
                or_(
                    Course.title.contains(search),
                    Course.description.contains(search)
                )
            )
        
        # Order by creation date
        query = query.order_by(Course.created_at.desc())
        
        # Paginate
        courses = query.paginate(
            page=page, per_page=per_page, error_out=False
        )
        
        return jsonify({
            'courses': [course.to_dict() for course in courses.items],
            'total': courses.total,
            'pages': courses.pages,
            'current_page': page,
            'per_page': per_page
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@courses_bp.route('/<int:course_id>', methods=['GET'])
def get_course(course_id):
    try:
        course = Course.query.get_or_404(course_id)
        
        # Get course details with lessons
        course_data = course.to_dict()
        course_data['lessons'] = [lesson.to_dict() for lesson in course.lessons]
        
        # Get reviews
        reviews = Review.query.filter_by(course_id=course_id).all()
        course_data['reviews'] = [review.to_dict() for review in reviews]
        
        # Calculate average rating
        if reviews:
            total_rating = sum(review.rating for review in reviews)
            course_data['average_rating'] = total_rating / len(reviews)
            course_data['review_count'] = len(reviews)
        else:
            course_data['average_rating'] = 0
            course_data['review_count'] = 0
        
        # Check if current user is enrolled
        if 'user_id' in session:
            enrollment = Enrollment.query.filter_by(
                user_id=session['user_id'],
                course_id=course_id
            ).first()
            course_data['is_enrolled'] = enrollment is not None
            course_data['enrollment_status'] = enrollment.status if enrollment else None
        else:
            course_data['is_enrolled'] = False
            course_data['enrollment_status'] = None
        
        return jsonify(course_data), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@courses_bp.route('/', methods=['POST'])
def create_course():
    try:
        auth_error = require_role(['admin', 'instructor'])
        if auth_error:
            return auth_error
        
        data = request.get_json()
        
        # Validate required fields
        required_fields = ['title', 'description', 'category_id']
        for field in required_fields:
            if not data.get(field):
                return jsonify({'error': f'{field} is required'}), 400
        
        # Verify category exists
        category = Category.query.get(data['category_id'])
        if not category:
            return jsonify({'error': 'Category not found'}), 404
        
        # Create course
        course = Course(
            title=data['title'],
            description=data['description'],
            category_id=data['category_id'],
            instructor_id=session['user_id'],
            thumbnail=data.get('thumbnail'),
            price=data.get('price', 0),
            duration_hours=data.get('duration_hours', 0),
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow(),
            status='pending' if session['role'] == 'instructor' else 'approved',
            course_path=data.get('course_path'),
            is_featured=data.get('is_featured', False)
        )
        
        db.session.add(course)
        db.session.commit()
        
        return jsonify({
            'message': 'Course created successfully',
            'course': course.to_dict()
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@courses_bp.route('/<int:course_id>', methods=['PUT'])
def update_course(course_id):
    try:
        course = Course.query.get_or_404(course_id)
        
        # Check permissions
        if session.get('role') != 'admin' and course.instructor_id != session.get('user_id'):
            return jsonify({'error': 'Insufficient permissions'}), 403
        
        data = request.get_json()
        
        # Update fields
        if 'title' in data:
            course.title = data['title']
        if 'description' in data:
            course.description = data['description']
        if 'category_id' in data:
            category = Category.query.get(data['category_id'])
            if not category:
                return jsonify({'error': 'Category not found'}), 404
            course.category_id = data['category_id']
        if 'thumbnail' in data:
            course.thumbnail = data['thumbnail']
        if 'price' in data:
            course.price = data['price']
        if 'duration_hours' in data:
            course.duration_hours = data['duration_hours']
        if 'course_path' in data:
            course.course_path = data['course_path']
        if 'is_featured' in data and session.get('role') == 'admin':
            course.is_featured = data['is_featured']
        if 'status' in data and session.get('role') == 'admin':
            course.status = data['status']
        
        course.updated_at = datetime.utcnow()
        db.session.commit()
        
        return jsonify({
            'message': 'Course updated successfully',
            'course': course.to_dict()
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@courses_bp.route('/<int:course_id>', methods=['DELETE'])
def delete_course(course_id):
    try:
        course = Course.query.get_or_404(course_id)
        
        # Check permissions
        if session.get('role') != 'admin' and course.instructor_id != session.get('user_id'):
            return jsonify({'error': 'Insufficient permissions'}), 403
        
        db.session.delete(course)
        db.session.commit()
        
        return jsonify({'message': 'Course deleted successfully'}), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@courses_bp.route('/<int:course_id>/lessons', methods=['GET'])
def get_course_lessons(course_id):
    try:
        course = Course.query.get_or_404(course_id)
        lessons = Lesson.query.filter_by(course_id=course_id).order_by(Lesson.lesson_order).all()
        
        return jsonify({
            'lessons': [lesson.to_dict() for lesson in lessons]
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@courses_bp.route('/<int:course_id>/lessons', methods=['POST'])
def create_lesson(course_id):
    try:
        course = Course.query.get_or_404(course_id)
        
        # Check permissions
        if session.get('role') != 'admin' and course.instructor_id != session.get('user_id'):
            return jsonify({'error': 'Insufficient permissions'}), 403
        
        data = request.get_json()
        
        # Validate required fields
        required_fields = ['title', 'lesson_order', 'lesson_type']
        for field in required_fields:
            if not data.get(field):
                return jsonify({'error': f'{field} is required'}), 400
        
        # Create lesson
        lesson = Lesson(
            course_id=course_id,
            title=data['title'],
            description=data.get('description'),
            lesson_order=data['lesson_order'],
            content_path=data.get('content_path'),
            lesson_type=data['lesson_type'],
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow()
        )
        
        db.session.add(lesson)
        db.session.commit()
        
        return jsonify({
            'message': 'Lesson created successfully',
            'lesson': lesson.to_dict()
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@courses_bp.route('/<int:course_id>/lessons/<int:lesson_id>', methods=['PUT'])
def update_lesson(course_id, lesson_id):
    try:
        course = Course.query.get_or_404(course_id)
        lesson = Lesson.query.filter_by(lesson_id=lesson_id, course_id=course_id).first_or_404()
        
        # Check permissions
        if session.get('role') != 'admin' and course.instructor_id != session.get('user_id'):
            return jsonify({'error': 'Insufficient permissions'}), 403
        
        data = request.get_json()
        
        # Update fields
        if 'title' in data:
            lesson.title = data['title']
        if 'description' in data:
            lesson.description = data['description']
        if 'lesson_order' in data:
            lesson.lesson_order = data['lesson_order']
        if 'content_path' in data:
            lesson.content_path = data['content_path']
        if 'lesson_type' in data:
            lesson.lesson_type = data['lesson_type']
        
        lesson.updated_at = datetime.utcnow()
        db.session.commit()
        
        return jsonify({
            'message': 'Lesson updated successfully',
            'lesson': lesson.to_dict()
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@courses_bp.route('/<int:course_id>/lessons/<int:lesson_id>', methods=['DELETE'])
def delete_lesson(course_id, lesson_id):
    try:
        course = Course.query.get_or_404(course_id)
        lesson = Lesson.query.filter_by(lesson_id=lesson_id, course_id=course_id).first_or_404()
        
        # Check permissions
        if session.get('role') != 'admin' and course.instructor_id != session.get('user_id'):
            return jsonify({'error': 'Insufficient permissions'}), 403
        
        db.session.delete(lesson)
        db.session.commit()
        
        return jsonify({'message': 'Lesson deleted successfully'}), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@courses_bp.route('/<int:course_id>/reviews', methods=['GET'])
def get_course_reviews(course_id):
    try:
        reviews = Review.query.filter_by(course_id=course_id).all()
        
        return jsonify({
            'reviews': [review.to_dict() for review in reviews]
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@courses_bp.route('/<int:course_id>/reviews', methods=['POST'])
def create_review(course_id):
    try:
        auth_error = require_auth()
        if auth_error:
            return auth_error
        
        # Check if user is enrolled in the course
        enrollment = Enrollment.query.filter_by(
            user_id=session['user_id'],
            course_id=course_id
        ).first()
        
        if not enrollment:
            return jsonify({'error': 'You must be enrolled in the course to leave a review'}), 403
        
        # Check if user already reviewed this course
        existing_review = Review.query.filter_by(
            user_id=session['user_id'],
            course_id=course_id
        ).first()
        
        if existing_review:
            return jsonify({'error': 'You have already reviewed this course'}), 400
        
        data = request.get_json()
        
        if not data.get('rating') or data['rating'] < 1 or data['rating'] > 5:
            return jsonify({'error': 'Rating must be between 1 and 5'}), 400
        
        # Create review
        review = Review(
            course_id=course_id,
            user_id=session['user_id'],
            rating=data['rating'],
            comment=data.get('comment'),
            review_date=datetime.utcnow()
        )
        
        db.session.add(review)
        db.session.commit()
        
        return jsonify({
            'message': 'Review created successfully',
            'review': review.to_dict()
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@courses_bp.route('/my-courses', methods=['GET'])
def get_my_courses():
    try:
        auth_error = require_auth()
        if auth_error:
            return auth_error
        
        if session['role'] == 'instructor':
            # Get courses created by instructor
            courses = Course.query.filter_by(instructor_id=session['user_id']).all()
            return jsonify({
                'courses': [course.to_dict() for course in courses]
            }), 200
        else:
            # Get enrolled courses for learners
            enrollments = Enrollment.query.filter_by(user_id=session['user_id']).all()
            courses = []
            for enrollment in enrollments:
                course_data = enrollment.course.to_dict()
                course_data['enrollment'] = enrollment.to_dict()
                courses.append(course_data)
            
            return jsonify({
                'courses': courses
            }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

