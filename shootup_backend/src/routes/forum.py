from flask import Blueprint, request, jsonify, session
from src.models.user import db, ForumTopic, ForumPost
from datetime import datetime

forum_bp = Blueprint('forum', __name__)

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

@forum_bp.route('/topics', methods=['GET'])
def get_topics():
    try:
        page = int(request.args.get('page', 1))
        per_page = int(request.args.get('per_page', 10))
        search = request.args.get('search')
        
        query = ForumTopic.query
        
        # Search functionality
        if search:
            query = query.filter(ForumTopic.title.contains(search))
        
        # Order by sticky first, then by last post date
        query = query.order_by(ForumTopic.is_sticky.desc(), ForumTopic.last_post_at.desc())
        
        # Paginate
        topics = query.paginate(
            page=page, per_page=per_page, error_out=False
        )
        
        topic_data = []
        for topic in topics.items:
            data = topic.to_dict()
            # Get post count
            post_count = ForumPost.query.filter_by(topic_id=topic.topic_id).count()
            data['post_count'] = post_count
            topic_data.append(data)
        
        return jsonify({
            'topics': topic_data,
            'total': topics.total,
            'pages': topics.pages,
            'current_page': page,
            'per_page': per_page
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@forum_bp.route('/topics/<int:topic_id>', methods=['GET'])
def get_topic(topic_id):
    try:
        topic = ForumTopic.query.get_or_404(topic_id)
        
        # Get posts for this topic
        page = int(request.args.get('page', 1))
        per_page = int(request.args.get('per_page', 20))
        
        posts = ForumPost.query.filter_by(topic_id=topic_id).order_by(ForumPost.created_at.asc()).paginate(
            page=page, per_page=per_page, error_out=False
        )
        
        topic_data = topic.to_dict()
        topic_data['posts'] = [post.to_dict() for post in posts.items]
        topic_data['total_posts'] = posts.total
        topic_data['pages'] = posts.pages
        topic_data['current_page'] = page
        topic_data['per_page'] = per_page
        
        return jsonify(topic_data), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@forum_bp.route('/topics', methods=['POST'])
def create_topic():
    try:
        auth_error = require_auth()
        if auth_error:
            return auth_error
        
        data = request.get_json()
        
        # Validate required fields
        if not data.get('title'):
            return jsonify({'error': 'Title is required'}), 400
        
        if not data.get('content'):
            return jsonify({'error': 'Content is required'}), 400
        
        # Create topic
        topic = ForumTopic(
            title=data['title'],
            user_id=session['user_id'],
            created_at=datetime.utcnow(),
            last_post_at=datetime.utcnow(),
            is_sticky=data.get('is_sticky', False) if session.get('role') == 'admin' else False,
            is_locked=False
        )
        
        db.session.add(topic)
        db.session.flush()  # To get the topic ID
        
        # Create initial post
        post = ForumPost(
            topic_id=topic.topic_id,
            user_id=session['user_id'],
            content=data['content'],
            created_at=datetime.utcnow()
        )
        
        db.session.add(post)
        db.session.commit()
        
        return jsonify({
            'message': 'Topic created successfully',
            'topic': topic.to_dict()
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@forum_bp.route('/topics/<int:topic_id>', methods=['PUT'])
def update_topic(topic_id):
    try:
        topic = ForumTopic.query.get_or_404(topic_id)
        
        # Check permissions
        if topic.user_id != session['user_id'] and session.get('role') != 'admin':
            return jsonify({'error': 'Insufficient permissions'}), 403
        
        data = request.get_json()
        
        # Update fields
        if 'title' in data:
            topic.title = data['title']
        
        # Admin-only fields
        if session.get('role') == 'admin':
            if 'is_sticky' in data:
                topic.is_sticky = data['is_sticky']
            if 'is_locked' in data:
                topic.is_locked = data['is_locked']
        
        db.session.commit()
        
        return jsonify({
            'message': 'Topic updated successfully',
            'topic': topic.to_dict()
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@forum_bp.route('/topics/<int:topic_id>', methods=['DELETE'])
def delete_topic(topic_id):
    try:
        topic = ForumTopic.query.get_or_404(topic_id)
        
        # Check permissions
        if topic.user_id != session['user_id'] and session.get('role') != 'admin':
            return jsonify({'error': 'Insufficient permissions'}), 403
        
        db.session.delete(topic)
        db.session.commit()
        
        return jsonify({'message': 'Topic deleted successfully'}), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@forum_bp.route('/topics/<int:topic_id>/posts', methods=['POST'])
def create_post(topic_id):
    try:
        auth_error = require_auth()
        if auth_error:
            return auth_error
        
        topic = ForumTopic.query.get_or_404(topic_id)
        
        # Check if topic is locked
        if topic.is_locked and session.get('role') != 'admin':
            return jsonify({'error': 'Topic is locked'}), 403
        
        data = request.get_json()
        
        if not data.get('content'):
            return jsonify({'error': 'Content is required'}), 400
        
        # Create post
        post = ForumPost(
            topic_id=topic_id,
            user_id=session['user_id'],
            content=data['content'],
            created_at=datetime.utcnow(),
            parent_post_id=data.get('parent_post_id')
        )
        
        db.session.add(post)
        
        # Update topic's last post time
        topic.last_post_at = datetime.utcnow()
        
        db.session.commit()
        
        return jsonify({
            'message': 'Post created successfully',
            'post': post.to_dict()
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@forum_bp.route('/posts/<int:post_id>', methods=['PUT'])
def update_post(post_id):
    try:
        post = ForumPost.query.get_or_404(post_id)
        
        # Check permissions
        if post.user_id != session['user_id'] and session.get('role') != 'admin':
            return jsonify({'error': 'Insufficient permissions'}), 403
        
        data = request.get_json()
        
        if 'content' in data:
            post.content = data['content']
        
        db.session.commit()
        
        return jsonify({
            'message': 'Post updated successfully',
            'post': post.to_dict()
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@forum_bp.route('/posts/<int:post_id>', methods=['DELETE'])
def delete_post(post_id):
    try:
        post = ForumPost.query.get_or_404(post_id)
        
        # Check permissions
        if post.user_id != session['user_id'] and session.get('role') != 'admin':
            return jsonify({'error': 'Insufficient permissions'}), 403
        
        db.session.delete(post)
        db.session.commit()
        
        return jsonify({'message': 'Post deleted successfully'}), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@forum_bp.route('/posts/<int:post_id>/replies', methods=['GET'])
def get_post_replies(post_id):
    try:
        post = ForumPost.query.get_or_404(post_id)
        replies = ForumPost.query.filter_by(parent_post_id=post_id).order_by(ForumPost.created_at.asc()).all()
        
        return jsonify({
            'replies': [reply.to_dict() for reply in replies]
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@forum_bp.route('/my-topics', methods=['GET'])
def get_my_topics():
    try:
        auth_error = require_auth()
        if auth_error:
            return auth_error
        
        topics = ForumTopic.query.filter_by(user_id=session['user_id']).order_by(ForumTopic.created_at.desc()).all()
        
        topic_data = []
        for topic in topics:
            data = topic.to_dict()
            # Get post count
            post_count = ForumPost.query.filter_by(topic_id=topic.topic_id).count()
            data['post_count'] = post_count
            topic_data.append(data)
        
        return jsonify({
            'topics': topic_data
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@forum_bp.route('/my-posts', methods=['GET'])
def get_my_posts():
    try:
        auth_error = require_auth()
        if auth_error:
            return auth_error
        
        posts = ForumPost.query.filter_by(user_id=session['user_id']).order_by(ForumPost.created_at.desc()).all()
        
        post_data = []
        for post in posts:
            data = post.to_dict()
            data['topic'] = post.topic.to_dict()
            post_data.append(data)
        
        return jsonify({
            'posts': post_data
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

