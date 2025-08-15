from flask import Blueprint, request, jsonify, session
from src.models.user import db, Vlog
from datetime import datetime

vlogs_bp = Blueprint('vlogs', __name__)

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

@vlogs_bp.route('/', methods=['GET'])
def get_vlogs():
    try:
        page = int(request.args.get('page', 1))
        per_page = int(request.args.get('per_page', 10))
        status = request.args.get('status', 'approved')
        search = request.args.get('search')
        user_id = request.args.get('user_id')
        
        query = Vlog.query
        
        # Filter by status (only admins can see pending/rejected vlogs)
        if session.get('role') == 'admin':
            if status:
                query = query.filter(Vlog.status == status)
        else:
            query = query.filter(Vlog.status == 'approved')
        
        # Filter by user
        if user_id:
            query = query.filter(Vlog.user_id == user_id)
        
        # Search functionality
        if search:
            query = query.filter(
                (Vlog.title.contains(search)) |
                (Vlog.description.contains(search))
            )
        
        # Order by upload date
        query = query.order_by(Vlog.upload_date.desc())
        
        # Paginate
        vlogs = query.paginate(
            page=page, per_page=per_page, error_out=False
        )
        
        return jsonify({
            'vlogs': [vlog.to_dict() for vlog in vlogs.items],
            'total': vlogs.total,
            'pages': vlogs.pages,
            'current_page': page,
            'per_page': per_page
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@vlogs_bp.route('/<int:vlog_id>', methods=['GET'])
def get_vlog(vlog_id):
    try:
        vlog = Vlog.query.get_or_404(vlog_id)
        
        # Check if user can view this vlog
        if (vlog.status != 'approved' and 
            vlog.user_id != session.get('user_id') and 
            session.get('role') != 'admin'):
            return jsonify({'error': 'Vlog not found or not accessible'}), 404
        
        # Increment view count
        vlog.views += 1
        db.session.commit()
        
        return jsonify(vlog.to_dict()), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@vlogs_bp.route('/', methods=['POST'])
def create_vlog():
    try:
        auth_error = require_auth()
        if auth_error:
            return auth_error
        
        data = request.get_json()
        
        # Validate required fields
        required_fields = ['title', 'video_url']
        for field in required_fields:
            if not data.get(field):
                return jsonify({'error': f'{field} is required'}), 400
        
        # Create vlog
        vlog = Vlog(
            user_id=session['user_id'],
            title=data['title'],
            description=data.get('description'),
            video_url=data['video_url'],
            thumbnail=data.get('thumbnail'),
            upload_date=datetime.utcnow(),
            views=0,
            status='pending'  # Requires admin approval
        )
        
        db.session.add(vlog)
        db.session.commit()
        
        return jsonify({
            'message': 'Vlog uploaded successfully and is pending approval',
            'vlog': vlog.to_dict()
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@vlogs_bp.route('/<int:vlog_id>', methods=['PUT'])
def update_vlog(vlog_id):
    try:
        vlog = Vlog.query.get_or_404(vlog_id)
        
        # Check permissions
        if vlog.user_id != session['user_id'] and session.get('role') != 'admin':
            return jsonify({'error': 'Insufficient permissions'}), 403
        
        data = request.get_json()
        
        # Update fields
        if 'title' in data:
            vlog.title = data['title']
        if 'description' in data:
            vlog.description = data['description']
        if 'video_url' in data:
            vlog.video_url = data['video_url']
        if 'thumbnail' in data:
            vlog.thumbnail = data['thumbnail']
        
        # Admin-only fields
        if session.get('role') == 'admin':
            if 'status' in data:
                valid_statuses = ['pending', 'approved', 'rejected']
                if data['status'] in valid_statuses:
                    vlog.status = data['status']
        
        db.session.commit()
        
        return jsonify({
            'message': 'Vlog updated successfully',
            'vlog': vlog.to_dict()
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@vlogs_bp.route('/<int:vlog_id>', methods=['DELETE'])
def delete_vlog(vlog_id):
    try:
        vlog = Vlog.query.get_or_404(vlog_id)
        
        # Check permissions
        if vlog.user_id != session['user_id'] and session.get('role') != 'admin':
            return jsonify({'error': 'Insufficient permissions'}), 403
        
        db.session.delete(vlog)
        db.session.commit()
        
        return jsonify({'message': 'Vlog deleted successfully'}), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@vlogs_bp.route('/my-vlogs', methods=['GET'])
def get_my_vlogs():
    try:
        auth_error = require_auth()
        if auth_error:
            return auth_error
        
        page = int(request.args.get('page', 1))
        per_page = int(request.args.get('per_page', 10))
        status = request.args.get('status')
        
        query = Vlog.query.filter_by(user_id=session['user_id'])
        
        # Filter by status
        if status:
            query = query.filter(Vlog.status == status)
        
        # Order by upload date
        query = query.order_by(Vlog.upload_date.desc())
        
        # Paginate
        vlogs = query.paginate(
            page=page, per_page=per_page, error_out=False
        )
        
        return jsonify({
            'vlogs': [vlog.to_dict() for vlog in vlogs.items],
            'total': vlogs.total,
            'pages': vlogs.pages,
            'current_page': page,
            'per_page': per_page
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@vlogs_bp.route('/pending', methods=['GET'])
def get_pending_vlogs():
    try:
        auth_error = require_role(['admin'])
        if auth_error:
            return auth_error
        
        page = int(request.args.get('page', 1))
        per_page = int(request.args.get('per_page', 10))
        
        vlogs = Vlog.query.filter_by(status='pending').order_by(Vlog.upload_date.desc()).paginate(
            page=page, per_page=per_page, error_out=False
        )
        
        return jsonify({
            'vlogs': [vlog.to_dict() for vlog in vlogs.items],
            'total': vlogs.total,
            'pages': vlogs.pages,
            'current_page': page,
            'per_page': per_page
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@vlogs_bp.route('/<int:vlog_id>/approve', methods=['POST'])
def approve_vlog(vlog_id):
    try:
        auth_error = require_role(['admin'])
        if auth_error:
            return auth_error
        
        vlog = Vlog.query.get_or_404(vlog_id)
        vlog.status = 'approved'
        db.session.commit()
        
        return jsonify({
            'message': 'Vlog approved successfully',
            'vlog': vlog.to_dict()
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@vlogs_bp.route('/<int:vlog_id>/reject', methods=['POST'])
def reject_vlog(vlog_id):
    try:
        auth_error = require_role(['admin'])
        if auth_error:
            return auth_error
        
        vlog = Vlog.query.get_or_404(vlog_id)
        vlog.status = 'rejected'
        db.session.commit()
        
        return jsonify({
            'message': 'Vlog rejected successfully',
            'vlog': vlog.to_dict()
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@vlogs_bp.route('/popular', methods=['GET'])
def get_popular_vlogs():
    try:
        limit = int(request.args.get('limit', 10))
        
        vlogs = Vlog.query.filter_by(status='approved').order_by(Vlog.views.desc()).limit(limit).all()
        
        return jsonify({
            'vlogs': [vlog.to_dict() for vlog in vlogs]
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@vlogs_bp.route('/recent', methods=['GET'])
def get_recent_vlogs():
    try:
        limit = int(request.args.get('limit', 10))
        
        vlogs = Vlog.query.filter_by(status='approved').order_by(Vlog.upload_date.desc()).limit(limit).all()
        
        return jsonify({
            'vlogs': [vlog.to_dict() for vlog in vlogs]
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

