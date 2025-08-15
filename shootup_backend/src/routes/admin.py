from flask import Blueprint, request, jsonify, session
from src.models.user import db, User, Course, Category, Enrollment, QuizAttempt, ForumTopic, ForumPost, Vlog, AuditLog
from datetime import datetime, timedelta
from sqlalchemy import func, and_

admin_bp = Blueprint('admin', __name__)

def require_admin():
    if 'user_id' not in session:
        return jsonify({'error': 'Authentication required'}), 401
    
    if session.get('role') != 'admin':
        return jsonify({'error': 'Admin access required'}), 403
    return None

@admin_bp.route('/dashboard', methods=['GET'])
def get_dashboard_stats():
    try:
        auth_error = require_admin()
        if auth_error:
            return auth_error
        
        # Get basic statistics
        total_users = User.query.count()
        total_courses = Course.query.count()
        total_enrollments = Enrollment.query.count()
        pending_courses = Course.query.filter_by(status='pending').count()
        pending_vlogs = Vlog.query.filter_by(status='pending').count()
        
        # Get user statistics by role
        user_stats = db.session.query(
            User.role.has(role_name='admin').label('is_admin'),
            User.role.has(role_name='instructor').label('is_instructor'),
            User.role.has(role_name='learner').label('is_learner'),
            func.count(User.user_id).label('count')
        ).group_by(User.role_id).all()
        
        # Get recent activity
        recent_users = User.query.order_by(User.registration_date.desc()).limit(5).all()
        recent_courses = Course.query.order_by(Course.created_at.desc()).limit(5).all()
        recent_enrollments = Enrollment.query.order_by(Enrollment.enrollment_date.desc()).limit(5).all()
        
        # Get monthly enrollment statistics
        thirty_days_ago = datetime.utcnow() - timedelta(days=30)
        monthly_enrollments = Enrollment.query.filter(
            Enrollment.enrollment_date >= thirty_days_ago
        ).count()
        
        return jsonify({
            'stats': {
                'total_users': total_users,
                'total_courses': total_courses,
                'total_enrollments': total_enrollments,
                'pending_courses': pending_courses,
                'pending_vlogs': pending_vlogs,
                'monthly_enrollments': monthly_enrollments
            },
            'recent_activity': {
                'users': [user.to_dict() for user in recent_users],
                'courses': [course.to_dict() for course in recent_courses],
                'enrollments': [enrollment.to_dict() for enrollment in recent_enrollments]
            }
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@admin_bp.route('/courses/pending', methods=['GET'])
def get_pending_courses():
    try:
        auth_error = require_admin()
        if auth_error:
            return auth_error
        
        page = int(request.args.get('page', 1))
        per_page = int(request.args.get('per_page', 10))
        
        courses = Course.query.filter_by(status='pending').order_by(Course.created_at.desc()).paginate(
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

@admin_bp.route('/courses/<int:course_id>/approve', methods=['POST'])
def approve_course(course_id):
    try:
        auth_error = require_admin()
        if auth_error:
            return auth_error
        
        course = Course.query.get_or_404(course_id)
        course.status = 'approved'
        course.updated_at = datetime.utcnow()
        
        # Log the action
        log = AuditLog(
            user_id=session['user_id'],
            action='approve_course',
            details=f'Approved course: {course.title} (ID: {course_id})',
            ip_address=request.remote_addr,
            timestamp=datetime.utcnow()
        )
        db.session.add(log)
        
        db.session.commit()
        
        return jsonify({
            'message': 'Course approved successfully',
            'course': course.to_dict()
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@admin_bp.route('/courses/<int:course_id>/reject', methods=['POST'])
def reject_course(course_id):
    try:
        auth_error = require_admin()
        if auth_error:
            return auth_error
        
        data = request.get_json()
        reason = data.get('reason', 'No reason provided')
        
        course = Course.query.get_or_404(course_id)
        course.status = 'rejected'
        course.updated_at = datetime.utcnow()
        
        # Log the action
        log = AuditLog(
            user_id=session['user_id'],
            action='reject_course',
            details=f'Rejected course: {course.title} (ID: {course_id}). Reason: {reason}',
            ip_address=request.remote_addr,
            timestamp=datetime.utcnow()
        )
        db.session.add(log)
        
        db.session.commit()
        
        return jsonify({
            'message': 'Course rejected successfully',
            'course': course.to_dict()
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@admin_bp.route('/analytics/users', methods=['GET'])
def get_user_analytics():
    try:
        auth_error = require_admin()
        if auth_error:
            return auth_error
        
        # User registration trends (last 30 days)
        thirty_days_ago = datetime.utcnow() - timedelta(days=30)
        daily_registrations = db.session.query(
            func.date(User.registration_date).label('date'),
            func.count(User.user_id).label('count')
        ).filter(
            User.registration_date >= thirty_days_ago
        ).group_by(
            func.date(User.registration_date)
        ).all()
        
        # User activity (last login)
        active_users_7d = User.query.filter(
            User.last_login >= datetime.utcnow() - timedelta(days=7)
        ).count()
        
        active_users_30d = User.query.filter(
            User.last_login >= datetime.utcnow() - timedelta(days=30)
        ).count()
        
        # Users by role
        users_by_role = db.session.query(
            User.role.has().label('role_name'),
            func.count(User.user_id).label('count')
        ).group_by(User.role_id).all()
        
        return jsonify({
            'daily_registrations': [
                {'date': str(reg.date), 'count': reg.count}
                for reg in daily_registrations
            ],
            'active_users': {
                'last_7_days': active_users_7d,
                'last_30_days': active_users_30d
            },
            'users_by_role': [
                {'role': role.role_name, 'count': role.count}
                for role in users_by_role
            ]
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@admin_bp.route('/analytics/courses', methods=['GET'])
def get_course_analytics():
    try:
        auth_error = require_admin()
        if auth_error:
            return auth_error
        
        # Course creation trends
        thirty_days_ago = datetime.utcnow() - timedelta(days=30)
        daily_courses = db.session.query(
            func.date(Course.created_at).label('date'),
            func.count(Course.course_id).label('count')
        ).filter(
            Course.created_at >= thirty_days_ago
        ).group_by(
            func.date(Course.created_at)
        ).all()
        
        # Courses by category
        courses_by_category = db.session.query(
            Category.category_name,
            func.count(Course.course_id).label('count')
        ).join(Course).group_by(Category.category_id).all()
        
        # Courses by status
        courses_by_status = db.session.query(
            Course.status,
            func.count(Course.course_id).label('count')
        ).group_by(Course.status).all()
        
        # Most popular courses (by enrollment)
        popular_courses = db.session.query(
            Course.title,
            func.count(Enrollment.enrollment_id).label('enrollment_count')
        ).join(Enrollment).group_by(Course.course_id).order_by(
            func.count(Enrollment.enrollment_id).desc()
        ).limit(10).all()
        
        return jsonify({
            'daily_courses': [
                {'date': str(course.date), 'count': course.count}
                for course in daily_courses
            ],
            'courses_by_category': [
                {'category': cat.category_name, 'count': cat.count}
                for cat in courses_by_category
            ],
            'courses_by_status': [
                {'status': status.status, 'count': status.count}
                for status in courses_by_status
            ],
            'popular_courses': [
                {'title': course.title, 'enrollments': course.enrollment_count}
                for course in popular_courses
            ]
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@admin_bp.route('/analytics/enrollments', methods=['GET'])
def get_enrollment_analytics():
    try:
        auth_error = require_admin()
        if auth_error:
            return auth_error
        
        # Enrollment trends
        thirty_days_ago = datetime.utcnow() - timedelta(days=30)
        daily_enrollments = db.session.query(
            func.date(Enrollment.enrollment_date).label('date'),
            func.count(Enrollment.enrollment_id).label('count')
        ).filter(
            Enrollment.enrollment_date >= thirty_days_ago
        ).group_by(
            func.date(Enrollment.enrollment_date)
        ).all()
        
        # Completion rates
        total_enrollments = Enrollment.query.count()
        completed_enrollments = Enrollment.query.filter_by(status='completed').count()
        completion_rate = (completed_enrollments / total_enrollments * 100) if total_enrollments > 0 else 0
        
        # Enrollments by status
        enrollments_by_status = db.session.query(
            Enrollment.status,
            func.count(Enrollment.enrollment_id).label('count')
        ).group_by(Enrollment.status).all()
        
        return jsonify({
            'daily_enrollments': [
                {'date': str(enroll.date), 'count': enroll.count}
                for enroll in daily_enrollments
            ],
            'completion_rate': completion_rate,
            'enrollments_by_status': [
                {'status': status.status, 'count': status.count}
                for status in enrollments_by_status
            ]
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@admin_bp.route('/audit-logs', methods=['GET'])
def get_audit_logs():
    try:
        auth_error = require_admin()
        if auth_error:
            return auth_error
        
        page = int(request.args.get('page', 1))
        per_page = int(request.args.get('per_page', 20))
        action_filter = request.args.get('action')
        user_id_filter = request.args.get('user_id')
        
        query = AuditLog.query
        
        # Filter by action
        if action_filter:
            query = query.filter(AuditLog.action.contains(action_filter))
        
        # Filter by user
        if user_id_filter:
            query = query.filter(AuditLog.user_id == user_id_filter)
        
        # Order by timestamp
        query = query.order_by(AuditLog.timestamp.desc())
        
        # Paginate
        logs = query.paginate(
            page=page, per_page=per_page, error_out=False
        )
        
        return jsonify({
            'logs': [log.to_dict() for log in logs.items],
            'total': logs.total,
            'pages': logs.pages,
            'current_page': page,
            'per_page': per_page
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@admin_bp.route('/system-health', methods=['GET'])
def get_system_health():
    try:
        auth_error = require_admin()
        if auth_error:
            return auth_error
        
        # Database connection test
        try:
            db.session.execute('SELECT 1')
            db_status = 'healthy'
        except Exception:
            db_status = 'unhealthy'
        
        # Get system statistics
        stats = {
            'database_status': db_status,
            'total_users': User.query.count(),
            'active_sessions': 1,  # Simplified for this implementation
            'pending_approvals': {
                'courses': Course.query.filter_by(status='pending').count(),
                'vlogs': Vlog.query.filter_by(status='pending').count()
            },
            'system_uptime': '24h',  # Simplified for this implementation
            'last_backup': 'N/A'  # Would be implemented with actual backup system
        }
        
        return jsonify({
            'status': 'healthy' if db_status == 'healthy' else 'degraded',
            'stats': stats,
            'timestamp': datetime.utcnow().isoformat()
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@admin_bp.route('/bulk-actions/users', methods=['POST'])
def bulk_user_actions():
    try:
        auth_error = require_admin()
        if auth_error:
            return auth_error
        
        data = request.get_json()
        action = data.get('action')
        user_ids = data.get('user_ids', [])
        
        if not action or not user_ids:
            return jsonify({'error': 'Action and user IDs are required'}), 400
        
        users = User.query.filter(User.user_id.in_(user_ids)).all()
        
        if action == 'activate':
            for user in users:
                user.is_active = True
        elif action == 'deactivate':
            for user in users:
                user.is_active = False
        elif action == 'verify_email':
            for user in users:
                user.email_verified = True
        else:
            return jsonify({'error': 'Invalid action'}), 400
        
        # Log the action
        log = AuditLog(
            user_id=session['user_id'],
            action=f'bulk_{action}_users',
            details=f'Applied {action} to {len(users)} users',
            ip_address=request.remote_addr,
            timestamp=datetime.utcnow()
        )
        db.session.add(log)
        
        db.session.commit()
        
        return jsonify({
            'message': f'Successfully applied {action} to {len(users)} users'
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

