from flask import Blueprint, request, jsonify, session
from src.models.user import db, Category

categories_bp = Blueprint('categories', __name__)

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

@categories_bp.route('/', methods=['GET'])
def get_categories():
    try:
        categories = Category.query.all()
        return jsonify({
            'categories': [category.to_dict() for category in categories]
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@categories_bp.route('/<int:category_id>', methods=['GET'])
def get_category(category_id):
    try:
        category = Category.query.get_or_404(category_id)
        return jsonify(category.to_dict()), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@categories_bp.route('/', methods=['POST'])
def create_category():
    try:
        auth_error = require_role(['admin'])
        if auth_error:
            return auth_error
        
        data = request.get_json()
        
        # Validate required fields
        if not data.get('category_name'):
            return jsonify({'error': 'Category name is required'}), 400
        
        # Check if category already exists
        existing_category = Category.query.filter_by(category_name=data['category_name']).first()
        if existing_category:
            return jsonify({'error': 'Category already exists'}), 400
        
        # Create category
        category = Category(
            category_name=data['category_name'],
            description=data.get('description'),
            icon_class=data.get('icon_class')
        )
        
        db.session.add(category)
        db.session.commit()
        
        return jsonify({
            'message': 'Category created successfully',
            'category': category.to_dict()
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@categories_bp.route('/<int:category_id>', methods=['PUT'])
def update_category(category_id):
    try:
        auth_error = require_role(['admin'])
        if auth_error:
            return auth_error
        
        category = Category.query.get_or_404(category_id)
        data = request.get_json()
        
        # Update fields
        if 'category_name' in data:
            # Check if new name already exists
            existing_category = Category.query.filter_by(category_name=data['category_name']).first()
            if existing_category and existing_category.category_id != category_id:
                return jsonify({'error': 'Category name already exists'}), 400
            category.category_name = data['category_name']
        
        if 'description' in data:
            category.description = data['description']
        
        if 'icon_class' in data:
            category.icon_class = data['icon_class']
        
        db.session.commit()
        
        return jsonify({
            'message': 'Category updated successfully',
            'category': category.to_dict()
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@categories_bp.route('/<int:category_id>', methods=['DELETE'])
def delete_category(category_id):
    try:
        auth_error = require_role(['admin'])
        if auth_error:
            return auth_error
        
        category = Category.query.get_or_404(category_id)
        
        # Check if category has courses
        if category.courses:
            return jsonify({'error': 'Cannot delete category with existing courses'}), 400
        
        db.session.delete(category)
        db.session.commit()
        
        return jsonify({'message': 'Category deleted successfully'}), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

