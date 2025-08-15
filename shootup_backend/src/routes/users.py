from flask import Blueprint, request, jsonify, session
from src.models.user import db, User, Role
from datetime import datetime

users_bp = Blueprint('users', __name__)

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

@users_bp.route('/', methods=['GET'])
def get_users():
    try:
        auth_error = require_role(['admin'])
        if auth_error:
            return auth_error
        
        page = int(request.args.get('page', 1))
        per_page = int(request.args.get('per_page', 10))
        role_filter = request.args.get('role')
        search = request.args.get('search')
        
        query = User.query
        
        # Filter by role
        if role_filter:
            role = Role.query.filter_by(role_name=role_filter).first()
            if role:
                query = query.filter(User.role_id == role.role_id)
        
        # Search functionality
        if search:
            query = query.filter(
                (User.username.contains(search)) |
                (User.email.contains(search)) |
                (User.first_name.contains(search)) |
                (User.last_name.contains(search))
            )
        
        # Paginate
        users = query.paginate(
            page=page, per_page=per_page, error_out=False
        )
        
        return jsonify({
            'users': [user.to_dict() for user in users.items],
            'total': users.total,
            'pages': users.pages,
            'current_page': page,
            'per_page': per_page
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@users_bp.route('/<int:user_id>', methods=['GET'])
def get_user(user_id):
    try:
        auth_error = require_auth()
        if auth_error:
            return auth_error
        
        # Users can view their own profile, admins can view any profile
        if session['user_id'] != user_id and session['role'] != 'admin':
            return jsonify({'error': 'Insufficient permissions'}), 403
        
        user = User.query.get_or_404(user_id)
        return jsonify(user.to_dict()), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@users_bp.route('/<int:user_id>', methods=['PUT'])
def update_user(user_id):
    try:
        auth_error = require_auth()
        if auth_error:
            return auth_error
        
        # Users can update their own profile, admins can update any profile
        if session['user_id'] != user_id and session['role'] != 'admin':
            return jsonify({'error': 'Insufficient permissions'}), 403
        
        user = User.query.get_or_404(user_id)
        data = request.get_json()
        
        # Update allowed fields
        if 'first_name' in data:
            user.first_name = data['first_name']
        if 'last_name' in data:
            user.last_name = data['last_name']
        if 'bio' in data:
            user.bio = data['bio']
        if 'profile_picture' in data:
            user.profile_picture = data['profile_picture']
        
        # Admin-only fields
        if session['role'] == 'admin':
            if 'email' in data:
                # Check if email is already taken
                existing_user = User.query.filter_by(email=data['email']).first()
                if existing_user and existing_user.user_id != user_id:
                    return jsonify({'error': 'Email already exists'}), 400
                user.email = data['email']
            
            if 'username' in data:
                # Check if username is already taken
                existing_user = User.query.filter_by(username=data['username']).first()
                if existing_user and existing_user.user_id != user_id:
                    return jsonify({'error': 'Username already exists'}), 400
                user.username = data['username']
            
            if 'role_id' in data:
                role = Role.query.get(data['role_id'])
                if not role:
                    return jsonify({'error': 'Invalid role'}), 400
                user.role_id = data['role_id']
            
            if 'is_active' in data:
                user.is_active = data['is_active']
            
            if 'email_verified' in data:
                user.email_verified = data['email_verified']
        
        db.session.commit()
        
        return jsonify({
            'message': 'User updated successfully',
            'user': user.to_dict()
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@users_bp.route('/<int:user_id>', methods=['DELETE'])
def delete_user(user_id):
    try:
        auth_error = require_role(['admin'])
        if auth_error:
            return auth_error
        
        user = User.query.get_or_404(user_id)
        
        # Prevent admin from deleting themselves
        if user_id == session['user_id']:
            return jsonify({'error': 'Cannot delete your own account'}), 400
        
        db.session.delete(user)
        db.session.commit()
        
        return jsonify({'message': 'User deleted successfully'}), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@users_bp.route('/', methods=['POST'])
def create_user():
    try:
        auth_error = require_role(['admin', 'instructor'])
        if auth_error:
            return auth_error
        
        data = request.get_json()
        
        # Validate required fields
        required_fields = ['username', 'email', 'password', 'first_name', 'last_name', 'role']
        for field in required_fields:
            if not data.get(field):
                return jsonify({'error': f'{field} is required'}), 400
        
        # Check if user already exists
        if User.query.filter_by(username=data['username']).first():
            return jsonify({'error': 'Username already exists'}), 400
        
        if User.query.filter_by(email=data['email']).first():
            return jsonify({'error': 'Email already exists'}), 400
        
        # Get role
        role = Role.query.filter_by(role_name=data['role']).first()
        if not role:
            return jsonify({'error': 'Invalid role'}), 400
        
        # Instructors can only create learner accounts
        if session['role'] == 'instructor' and data['role'] != 'learner':
            return jsonify({'error': 'Instructors can only create learner accounts'}), 403
        
        # Create new user
        user = User(
            username=data['username'],
            email=data['email'],
            first_name=data['first_name'],
            last_name=data['last_name'],
            role_id=role.role_id,
            bio=data.get('bio', ''),
            registration_date=datetime.utcnow(),
            is_active=data.get('is_active', True),
            email_verified=data.get('email_verified', False)
        )
        user.set_password(data['password'])
        
        db.session.add(user)
        db.session.commit()
        
        return jsonify({
            'message': 'User created successfully',
            'user': user.to_dict()
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@users_bp.route('/profile', methods=['GET'])
def get_profile():
    try:
        auth_error = require_auth()
        if auth_error:
            return auth_error
        
        user = User.query.get(session['user_id'])
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        return jsonify(user.to_dict()), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@users_bp.route('/profile', methods=['PUT'])
def update_profile():
    try:
        auth_error = require_auth()
        if auth_error:
            return auth_error
        
        user = User.query.get(session['user_id'])
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        data = request.get_json()
        
        # Update allowed fields
        if 'first_name' in data:
            user.first_name = data['first_name']
        if 'last_name' in data:
            user.last_name = data['last_name']
        if 'bio' in data:
            user.bio = data['bio']
        if 'profile_picture' in data:
            user.profile_picture = data['profile_picture']
        
        db.session.commit()
        
        return jsonify({
            'message': 'Profile updated successfully',
            'user': user.to_dict()
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@users_bp.route('/roles', methods=['GET'])
def get_roles():
    try:
        roles = Role.query.all()
        return jsonify({
            'roles': [role.to_dict() for role in roles]
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

