import os
import sys
# DON'T CHANGE THIS !!!
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from flask import Flask, send_from_directory, jsonify
from flask_cors import CORS
from src.models.user import db, Role, Permission, User
from src.routes.auth import auth_bp
from src.routes.courses import courses_bp
from src.routes.users import users_bp
from src.routes.categories import categories_bp
from src.routes.enrollments import enrollments_bp
from src.routes.quizzes import quizzes_bp
from src.routes.forum import forum_bp
from src.routes.vlogs import vlogs_bp
from src.routes.admin import admin_bp
from datetime import datetime

app = Flask(__name__, static_folder=os.path.join(os.path.dirname(__file__), 'static'))
app.config['SECRET_KEY'] = 'asdf#FGSgvasgf$5$WGT'

# Enable CORS for all routes
CORS(app, origins="*")

# Register blueprints
app.register_blueprint(auth_bp, url_prefix='/api/auth')
app.register_blueprint(courses_bp, url_prefix='/api/courses')
app.register_blueprint(users_bp, url_prefix='/api/users')
app.register_blueprint(categories_bp, url_prefix='/api/categories')
app.register_blueprint(enrollments_bp, url_prefix='/api/enrollments')
app.register_blueprint(quizzes_bp, url_prefix='/api/quizzes')
app.register_blueprint(forum_bp, url_prefix='/api/forum')
app.register_blueprint(vlogs_bp, url_prefix='/api/vlogs')
app.register_blueprint(admin_bp, url_prefix='/api/admin')

# Database configuration
app.config['SQLALCHEMY_DATABASE_URI'] = f"sqlite:///{os.path.join(os.path.dirname(__file__), 'database', 'app.db')}"
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
db.init_app(app)

def init_database():
    """Initialize database with default data"""
    with app.app_context():
        db.create_all()
        
        # Create default roles if they don't exist
        if not Role.query.first():
            admin_role = Role(role_name='admin')
            instructor_role = Role(role_name='instructor')
            learner_role = Role(role_name='learner')
            
            db.session.add(admin_role)
            db.session.add(instructor_role)
            db.session.add(learner_role)
            
            # Create default permissions
            permissions = [
                'manage_users', 'manage_courses', 'manage_categories',
                'approve_courses', 'view_analytics', 'manage_settings',
                'create_courses', 'edit_own_courses', 'view_learners',
                'enroll_courses', 'take_quizzes', 'post_forum',
                'upload_vlogs', 'send_messages'
            ]
            
            for perm_name in permissions:
                permission = Permission(permission_name=perm_name)
                db.session.add(permission)
            
            db.session.commit()
            
            # Create default admin user
            admin_user = User(
                username='admin',
                email='admin@shootup.com',
                first_name='Admin',
                last_name='User',
                role_id=admin_role.role_id,
                registration_date=datetime.utcnow(),
                is_active=True,
                email_verified=True
            )
            admin_user.set_password('admin123')
            db.session.add(admin_user)
            db.session.commit()

init_database()

@app.route('/api/health')
def health_check():
    return jsonify({'status': 'healthy', 'message': 'ShootUp LMS API is running'})

@app.route('/', defaults={'path': ''})
@app.route('/<path:path>')
def serve(path):
    static_folder_path = app.static_folder
    if static_folder_path is None:
        return "Static folder not configured", 404

    if path != "" and os.path.exists(os.path.join(static_folder_path, path)):
        return send_from_directory(static_folder_path, path)
    else:
        index_path = os.path.join(static_folder_path, 'index.html')
        if os.path.exists(index_path):
            return send_from_directory(static_folder_path, 'index.html')
        else:
            return "index.html not found", 404

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)

