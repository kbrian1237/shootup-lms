from flask import Blueprint, request, jsonify, session
from src.models.user import db, Enrollment, Course, Progress, Lesson
from datetime import datetime

enrollments_bp = Blueprint('enrollments', __name__)

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

@enrollments_bp.route('/', methods=['GET'])
def get_enrollments():
    try:
        auth_error = require_auth()
        if auth_error:
            return auth_error
        
        # Get user's enrollments
        enrollments = Enrollment.query.filter_by(user_id=session['user_id']).all()
        
        enrollment_data = []
        for enrollment in enrollments:
            data = enrollment.to_dict()
            data['course'] = enrollment.course.to_dict()
            
            # Calculate progress
            total_lessons = Lesson.query.filter_by(course_id=enrollment.course_id).count()
            completed_lessons = Progress.query.filter_by(
                enrollment_id=enrollment.enrollment_id,
                is_completed=True
            ).count()
            
            data['progress_percentage'] = (completed_lessons / total_lessons * 100) if total_lessons > 0 else 0
            data['completed_lessons'] = completed_lessons
            data['total_lessons'] = total_lessons
            
            enrollment_data.append(data)
        
        return jsonify({
            'enrollments': enrollment_data
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@enrollments_bp.route('/', methods=['POST'])
def enroll_course():
    try:
        auth_error = require_auth()
        if auth_error:
            return auth_error
        
        data = request.get_json()
        
        if not data.get('course_id'):
            return jsonify({'error': 'Course ID is required'}), 400
        
        course = Course.query.get_or_404(data['course_id'])
        
        # Check if course is approved
        if course.status != 'approved':
            return jsonify({'error': 'Course is not available for enrollment'}), 400
        
        # Check if already enrolled
        existing_enrollment = Enrollment.query.filter_by(
            user_id=session['user_id'],
            course_id=data['course_id']
        ).first()
        
        if existing_enrollment:
            return jsonify({'error': 'Already enrolled in this course'}), 400
        
        # Create enrollment
        enrollment = Enrollment(
            user_id=session['user_id'],
            course_id=data['course_id'],
            enrollment_date=datetime.utcnow(),
            status='in_progress'
        )
        
        db.session.add(enrollment)
        db.session.flush()  # To get the enrollment ID
        
        # Create progress records for all lessons
        lessons = Lesson.query.filter_by(course_id=data['course_id']).all()
        for lesson in lessons:
            progress = Progress(
                enrollment_id=enrollment.enrollment_id,
                lesson_id=lesson.lesson_id,
                is_completed=False
            )
            db.session.add(progress)
        
        db.session.commit()
        
        return jsonify({
            'message': 'Successfully enrolled in course',
            'enrollment': enrollment.to_dict()
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@enrollments_bp.route('/<int:enrollment_id>', methods=['GET'])
def get_enrollment(enrollment_id):
    try:
        auth_error = require_auth()
        if auth_error:
            return auth_error
        
        enrollment = Enrollment.query.get_or_404(enrollment_id)
        
        # Check if user owns this enrollment or is admin
        if enrollment.user_id != session['user_id'] and session.get('role') != 'admin':
            return jsonify({'error': 'Insufficient permissions'}), 403
        
        data = enrollment.to_dict()
        data['course'] = enrollment.course.to_dict()
        
        # Get progress details
        progress_records = Progress.query.filter_by(enrollment_id=enrollment_id).all()
        data['progress'] = [progress.to_dict() for progress in progress_records]
        
        return jsonify(data), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@enrollments_bp.route('/<int:enrollment_id>/progress', methods=['POST'])
def update_lesson_progress():
    try:
        auth_error = require_auth()
        if auth_error:
            return auth_error
        
        data = request.get_json()
        
        if not data.get('lesson_id'):
            return jsonify({'error': 'Lesson ID is required'}), 400
        
        enrollment = Enrollment.query.get_or_404(data.get('enrollment_id'))
        
        # Check if user owns this enrollment
        if enrollment.user_id != session['user_id']:
            return jsonify({'error': 'Insufficient permissions'}), 403
        
        # Find progress record
        progress = Progress.query.filter_by(
            enrollment_id=enrollment.enrollment_id,
            lesson_id=data['lesson_id']
        ).first()
        
        if not progress:
            return jsonify({'error': 'Progress record not found'}), 404
        
        # Update progress
        progress.is_completed = data.get('is_completed', True)
        if progress.is_completed:
            progress.completion_date = datetime.utcnow()
        else:
            progress.completion_date = None
        
        # Update last accessed lesson
        enrollment.last_accessed_lesson_id = data['lesson_id']
        
        # Check if course is completed
        total_lessons = Lesson.query.filter_by(course_id=enrollment.course_id).count()
        completed_lessons = Progress.query.filter_by(
            enrollment_id=enrollment.enrollment_id,
            is_completed=True
        ).count()
        
        if completed_lessons == total_lessons:
            enrollment.status = 'completed'
            enrollment.completion_date = datetime.utcnow()
        
        db.session.commit()
        
        return jsonify({
            'message': 'Progress updated successfully',
            'progress': progress.to_dict()
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@enrollments_bp.route('/<int:enrollment_id>', methods=['PUT'])
def update_enrollment(enrollment_id):
    try:
        auth_error = require_auth()
        if auth_error:
            return auth_error
        
        enrollment = Enrollment.query.get_or_404(enrollment_id)
        
        # Check permissions
        if enrollment.user_id != session['user_id'] and session.get('role') != 'admin':
            return jsonify({'error': 'Insufficient permissions'}), 403
        
        data = request.get_json()
        
        # Update status
        if 'status' in data:
            valid_statuses = ['in_progress', 'completed', 'dropped']
            if data['status'] not in valid_statuses:
                return jsonify({'error': 'Invalid status'}), 400
            
            enrollment.status = data['status']
            
            if data['status'] == 'completed':
                enrollment.completion_date = datetime.utcnow()
            elif data['status'] == 'dropped':
                enrollment.completion_date = None
        
        db.session.commit()
        
        return jsonify({
            'message': 'Enrollment updated successfully',
            'enrollment': enrollment.to_dict()
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@enrollments_bp.route('/<int:enrollment_id>', methods=['DELETE'])
def delete_enrollment(enrollment_id):
    try:
        auth_error = require_auth()
        if auth_error:
            return auth_error
        
        enrollment = Enrollment.query.get_or_404(enrollment_id)
        
        # Check permissions (admin or course owner can delete enrollments)
        if (enrollment.user_id != session['user_id'] and 
            session.get('role') != 'admin' and 
            enrollment.course.instructor_id != session['user_id']):
            return jsonify({'error': 'Insufficient permissions'}), 403
        
        db.session.delete(enrollment)
        db.session.commit()
        
        return jsonify({'message': 'Enrollment deleted successfully'}), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@enrollments_bp.route('/course/<int:course_id>', methods=['GET'])
def get_course_enrollments(course_id):
    try:
        auth_error = require_auth()
        if auth_error:
            return auth_error
        
        course = Course.query.get_or_404(course_id)
        
        # Check permissions (instructor or admin can view course enrollments)
        if course.instructor_id != session['user_id'] and session.get('role') != 'admin':
            return jsonify({'error': 'Insufficient permissions'}), 403
        
        enrollments = Enrollment.query.filter_by(course_id=course_id).all()
        
        enrollment_data = []
        for enrollment in enrollments:
            data = enrollment.to_dict()
            data['user'] = enrollment.user.to_dict()
            
            # Calculate progress
            total_lessons = Lesson.query.filter_by(course_id=course_id).count()
            completed_lessons = Progress.query.filter_by(
                enrollment_id=enrollment.enrollment_id,
                is_completed=True
            ).count()
            
            data['progress_percentage'] = (completed_lessons / total_lessons * 100) if total_lessons > 0 else 0
            data['completed_lessons'] = completed_lessons
            data['total_lessons'] = total_lessons
            
            enrollment_data.append(data)
        
        return jsonify({
            'enrollments': enrollment_data
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

