from flask import Blueprint, request, jsonify, session
from src.models.user import db, User, Role
from datetime import datetime
import secrets

auth_bp = Blueprint('auth', __name__)

@auth_bp.route('/register', methods=['POST'])
def register():
    try:
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
        
        # Create new user
        user = User(
            username=data['username'],
            email=data['email'],
            first_name=data['first_name'],
            last_name=data['last_name'],
            role_id=role.role_id,
            bio=data.get('bio', ''),
            registration_date=datetime.utcnow(),
            verification_token=secrets.token_urlsafe(32)
        )
        user.set_password(data['password'])
        
        db.session.add(user)
        db.session.commit()
        
        return jsonify({
            'message': 'User registered successfully',
            'user': user.to_dict()
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@auth_bp.route('/login', methods=['POST'])
def login():
    try:
        data = request.get_json()
        
        if not data.get('username') or not data.get('password'):
            return jsonify({'error': 'Username and password are required'}), 400
        
        # Find user by username or email
        user = User.query.filter(
            (User.username == data['username']) | (User.email == data['username'])
        ).first()
        
        if not user or not user.check_password(data['password']):
            return jsonify({'error': 'Invalid credentials'}), 401
        
        if not user.is_active:
            return jsonify({'error': 'Account is deactivated'}), 401
        
        # Update last login
        user.last_login = datetime.utcnow()
        db.session.commit()
        
        # Set session
        session['user_id'] = user.user_id
        session['role'] = user.role.role_name
        
        return jsonify({
            'message': 'Login successful',
            'user': user.to_dict()
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@auth_bp.route('/logout', methods=['POST'])
def logout():
    session.clear()
    return jsonify({'message': 'Logout successful'}), 200

@auth_bp.route('/me', methods=['GET'])
def get_current_user():
    try:
        if 'user_id' not in session:
            return jsonify({'error': 'Not authenticated'}), 401
        
        user = User.query.get(session['user_id'])
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        return jsonify({'user': user.to_dict()}), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@auth_bp.route('/change-password', methods=['POST'])
def change_password():
    try:
        if 'user_id' not in session:
            return jsonify({'error': 'Not authenticated'}), 401
        
        data = request.get_json()
        
        if not data.get('current_password') or not data.get('new_password'):
            return jsonify({'error': 'Current password and new password are required'}), 400
        
        user = User.query.get(session['user_id'])
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        if not user.check_password(data['current_password']):
            return jsonify({'error': 'Current password is incorrect'}), 400
        
        user.set_password(data['new_password'])
        db.session.commit()
        
        return jsonify({'message': 'Password changed successfully'}), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@auth_bp.route('/forgot-password', methods=['POST'])
def forgot_password():
    try:
        data = request.get_json()
        
        if not data.get('email'):
            return jsonify({'error': 'Email is required'}), 400
        
        user = User.query.filter_by(email=data['email']).first()
        if user:
            # Generate reset token
            user.verification_token = secrets.token_urlsafe(32)
            db.session.commit()
            
            # In a real application, you would send an email here
            # For now, we'll just return the token for testing
            return jsonify({
                'message': 'Password reset token generated',
                'reset_token': user.verification_token  # Remove this in production
            }), 200
        else:
            # Don't reveal if email exists or not
            return jsonify({'message': 'If the email exists, a reset link has been sent'}), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@auth_bp.route('/reset-password', methods=['POST'])
def reset_password():
    try:
        data = request.get_json()
        
        if not data.get('token') or not data.get('new_password'):
            return jsonify({'error': 'Token and new password are required'}), 400
        
        user = User.query.filter_by(verification_token=data['token']).first()
        if not user:
            return jsonify({'error': 'Invalid or expired token'}), 400
        
        user.set_password(data['new_password'])
        user.verification_token = None  # Clear the token
        db.session.commit()
        
        return jsonify({'message': 'Password reset successfully'}), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

