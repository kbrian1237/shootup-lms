from flask_sqlalchemy import SQLAlchemy
from datetime import datetime
from werkzeug.security import generate_password_hash, check_password_hash

db = SQLAlchemy()

class Role(db.Model):
    __tablename__ = 'roles'
    role_id = db.Column(db.Integer, primary_key=True)
    role_name = db.Column(db.String(50), unique=True, nullable=False)
    
    # Relationships
    users = db.relationship('User', backref='role', lazy=True)
    permissions = db.relationship('Permission', secondary='role_permissions', backref='roles')
    
    def to_dict(self):
        return {
            'role_id': self.role_id,
            'role_name': self.role_name
        }

class Permission(db.Model):
    __tablename__ = 'permissions'
    permission_id = db.Column(db.Integer, primary_key=True)
    permission_name = db.Column(db.String(100), unique=True, nullable=False)
    
    def to_dict(self):
        return {
            'permission_id': self.permission_id,
            'permission_name': self.permission_name
        }

class RolePermission(db.Model):
    __tablename__ = 'role_permissions'
    role_id = db.Column(db.Integer, db.ForeignKey('roles.role_id'), primary_key=True)
    permission_id = db.Column(db.Integer, db.ForeignKey('permissions.permission_id'), primary_key=True)

class User(db.Model):
    __tablename__ = 'users'
    user_id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(255), unique=True, nullable=False)
    email = db.Column(db.String(255), unique=True, nullable=False)
    password_hash = db.Column(db.String(255), nullable=False)
    first_name = db.Column(db.String(100))
    last_name = db.Column(db.String(100))
    role_id = db.Column(db.Integer, db.ForeignKey('roles.role_id'), nullable=False)
    profile_picture = db.Column(db.String(255))
    bio = db.Column(db.Text)
    registration_date = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
    last_login = db.Column(db.DateTime)
    is_active = db.Column(db.Boolean, nullable=False, default=True)
    email_verified = db.Column(db.Boolean, nullable=False, default=False)
    verification_token = db.Column(db.String(255))
    
    # Relationships
    courses = db.relationship('Course', backref='instructor', lazy=True)
    enrollments = db.relationship('Enrollment', backref='user', lazy=True)
    quiz_attempts = db.relationship('QuizAttempt', backref='user', lazy=True)
    reviews = db.relationship('Review', backref='user', lazy=True)
    forum_topics = db.relationship('ForumTopic', backref='user', lazy=True)
    forum_posts = db.relationship('ForumPost', backref='user', lazy=True)
    vlogs = db.relationship('Vlog', backref='user', lazy=True)
    sent_messages = db.relationship('Message', foreign_keys='Message.sender_id', backref='sender', lazy=True)
    received_messages = db.relationship('Message', foreign_keys='Message.receiver_id', backref='receiver', lazy=True)
    notifications = db.relationship('Notification', backref='user', lazy=True)
    
    def set_password(self, password):
        self.password_hash = generate_password_hash(password)
    
    def check_password(self, password):
        return check_password_hash(self.password_hash, password)
    
    def to_dict(self):
        return {
            'user_id': self.user_id,
            'username': self.username,
            'email': self.email,
            'first_name': self.first_name,
            'last_name': self.last_name,
            'role': self.role.to_dict() if self.role else None,
            'profile_picture': self.profile_picture,
            'bio': self.bio,
            'registration_date': self.registration_date.isoformat() if self.registration_date else None,
            'last_login': self.last_login.isoformat() if self.last_login else None,
            'is_active': self.is_active,
            'email_verified': self.email_verified
        }

class Category(db.Model):
    __tablename__ = 'categories'
    category_id = db.Column(db.Integer, primary_key=True)
    category_name = db.Column(db.String(100), unique=True, nullable=False)
    description = db.Column(db.Text)
    icon_class = db.Column(db.String(50))
    
    # Relationships
    courses = db.relationship('Course', backref='category', lazy=True)
    
    def to_dict(self):
        return {
            'category_id': self.category_id,
            'category_name': self.category_name,
            'description': self.description,
            'icon_class': self.icon_class
        }

class Course(db.Model):
    __tablename__ = 'courses'
    course_id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(255), nullable=False)
    description = db.Column(db.Text, nullable=False)
    category_id = db.Column(db.Integer, db.ForeignKey('categories.category_id'), nullable=False)
    instructor_id = db.Column(db.Integer, db.ForeignKey('users.user_id'), nullable=False)
    thumbnail = db.Column(db.String(255))
    price = db.Column(db.Numeric(10, 2))
    duration_hours = db.Column(db.Integer)
    created_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow, onupdate=datetime.utcnow)
    status = db.Column(db.Enum('pending', 'approved', 'rejected', 'draft', name='course_status'), nullable=False)
    course_path = db.Column(db.String(255))
    is_featured = db.Column(db.Boolean, nullable=False, default=False)
    
    # Relationships
    lessons = db.relationship('Lesson', backref='course', lazy=True, cascade='all, delete-orphan')
    enrollments = db.relationship('Enrollment', backref='course', lazy=True, cascade='all, delete-orphan')
    reviews = db.relationship('Review', backref='course', lazy=True, cascade='all, delete-orphan')
    roadmap_courses = db.relationship('RoadmapCourse', backref='course', lazy=True, cascade='all, delete-orphan')
    
    def to_dict(self):
        return {
            'course_id': self.course_id,
            'title': self.title,
            'description': self.description,
            'category': self.category.to_dict() if self.category else None,
            'instructor': self.instructor.to_dict() if self.instructor else None,
            'thumbnail': self.thumbnail,
            'price': float(self.price) if self.price else None,
            'duration_hours': self.duration_hours,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None,
            'status': self.status,
            'course_path': self.course_path,
            'is_featured': self.is_featured
        }

class Lesson(db.Model):
    __tablename__ = 'lessons'
    lesson_id = db.Column(db.Integer, primary_key=True)
    course_id = db.Column(db.Integer, db.ForeignKey('courses.course_id'), nullable=False)
    title = db.Column(db.String(255), nullable=False)
    description = db.Column(db.Text)
    lesson_order = db.Column(db.Integer, nullable=False)
    content_path = db.Column(db.String(255))
    lesson_type = db.Column(db.Enum('html', 'video', 'quiz', 'pdf', name='lesson_type'), nullable=False)
    created_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    quizzes = db.relationship('Quiz', backref='lesson', lazy=True, cascade='all, delete-orphan')
    progress = db.relationship('Progress', backref='lesson', lazy=True, cascade='all, delete-orphan')
    
    def to_dict(self):
        return {
            'lesson_id': self.lesson_id,
            'course_id': self.course_id,
            'title': self.title,
            'description': self.description,
            'lesson_order': self.lesson_order,
            'content_path': self.content_path,
            'lesson_type': self.lesson_type,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }

class Enrollment(db.Model):
    __tablename__ = 'enrollments'
    enrollment_id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.user_id'), nullable=False)
    course_id = db.Column(db.Integer, db.ForeignKey('courses.course_id'), nullable=False)
    enrollment_date = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
    completion_date = db.Column(db.DateTime)
    status = db.Column(db.Enum('in_progress', 'completed', 'dropped', name='enrollment_status'), nullable=False)
    last_accessed_lesson_id = db.Column(db.Integer, db.ForeignKey('lessons.lesson_id'))
    
    # Relationships
    progress = db.relationship('Progress', backref='enrollment', lazy=True, cascade='all, delete-orphan')
    
    def to_dict(self):
        return {
            'enrollment_id': self.enrollment_id,
            'user_id': self.user_id,
            'course_id': self.course_id,
            'enrollment_date': self.enrollment_date.isoformat() if self.enrollment_date else None,
            'completion_date': self.completion_date.isoformat() if self.completion_date else None,
            'status': self.status,
            'last_accessed_lesson_id': self.last_accessed_lesson_id
        }

class Progress(db.Model):
    __tablename__ = 'progress'
    progress_id = db.Column(db.Integer, primary_key=True)
    enrollment_id = db.Column(db.Integer, db.ForeignKey('enrollments.enrollment_id'), nullable=False)
    lesson_id = db.Column(db.Integer, db.ForeignKey('lessons.lesson_id'), nullable=False)
    is_completed = db.Column(db.Boolean, nullable=False, default=False)
    completion_date = db.Column(db.DateTime)
    
    def to_dict(self):
        return {
            'progress_id': self.progress_id,
            'enrollment_id': self.enrollment_id,
            'lesson_id': self.lesson_id,
            'is_completed': self.is_completed,
            'completion_date': self.completion_date.isoformat() if self.completion_date else None
        }

class Quiz(db.Model):
    __tablename__ = 'quizzes'
    quiz_id = db.Column(db.Integer, primary_key=True)
    lesson_id = db.Column(db.Integer, db.ForeignKey('lessons.lesson_id'), nullable=False)
    title = db.Column(db.String(255), nullable=False)
    description = db.Column(db.Text)
    passing_score = db.Column(db.Integer, nullable=False)
    created_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
    
    # Relationships
    questions = db.relationship('Question', backref='quiz', lazy=True, cascade='all, delete-orphan')
    quiz_attempts = db.relationship('QuizAttempt', backref='quiz', lazy=True, cascade='all, delete-orphan')
    
    def to_dict(self):
        return {
            'quiz_id': self.quiz_id,
            'lesson_id': self.lesson_id,
            'title': self.title,
            'description': self.description,
            'passing_score': self.passing_score,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }

class Question(db.Model):
    __tablename__ = 'questions'
    question_id = db.Column(db.Integer, primary_key=True)
    quiz_id = db.Column(db.Integer, db.ForeignKey('quizzes.quiz_id'), nullable=False)
    question_text = db.Column(db.Text, nullable=False)
    question_type = db.Column(db.Enum('multiple_choice', 'true_false', 'short_answer', name='question_type'), nullable=False)
    correct_answer = db.Column(db.Text)
    
    # Relationships
    options = db.relationship('Option', backref='question', lazy=True, cascade='all, delete-orphan')
    answers = db.relationship('Answer', backref='question', lazy=True, cascade='all, delete-orphan')
    
    def to_dict(self):
        return {
            'question_id': self.question_id,
            'quiz_id': self.quiz_id,
            'question_text': self.question_text,
            'question_type': self.question_type,
            'correct_answer': self.correct_answer,
            'options': [option.to_dict() for option in self.options]
        }

class Option(db.Model):
    __tablename__ = 'options'
    option_id = db.Column(db.Integer, primary_key=True)
    question_id = db.Column(db.Integer, db.ForeignKey('questions.question_id'), nullable=False)
    option_text = db.Column(db.String(255), nullable=False)
    is_correct = db.Column(db.Boolean, nullable=False, default=False)
    
    # Relationships
    answers = db.relationship('Answer', backref='selected_option', lazy=True)
    
    def to_dict(self):
        return {
            'option_id': self.option_id,
            'question_id': self.question_id,
            'option_text': self.option_text,
            'is_correct': self.is_correct
        }

class QuizAttempt(db.Model):
    __tablename__ = 'quiz_attempts'
    attempt_id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.user_id'), nullable=False)
    quiz_id = db.Column(db.Integer, db.ForeignKey('quizzes.quiz_id'), nullable=False)
    score = db.Column(db.Numeric(5, 2), nullable=False)
    attempt_date = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
    is_passed = db.Column(db.Boolean, nullable=False, default=False)
    
    # Relationships
    answers = db.relationship('Answer', backref='attempt', lazy=True, cascade='all, delete-orphan')
    
    def to_dict(self):
        return {
            'attempt_id': self.attempt_id,
            'user_id': self.user_id,
            'quiz_id': self.quiz_id,
            'score': float(self.score),
            'attempt_date': self.attempt_date.isoformat() if self.attempt_date else None,
            'is_passed': self.is_passed
        }

class Answer(db.Model):
    __tablename__ = 'answers'
    answer_id = db.Column(db.Integer, primary_key=True)
    attempt_id = db.Column(db.Integer, db.ForeignKey('quiz_attempts.attempt_id'), nullable=False)
    question_id = db.Column(db.Integer, db.ForeignKey('questions.question_id'), nullable=False)
    selected_option_id = db.Column(db.Integer, db.ForeignKey('options.option_id'))
    answer_text = db.Column(db.Text)
    
    def to_dict(self):
        return {
            'answer_id': self.answer_id,
            'attempt_id': self.attempt_id,
            'question_id': self.question_id,
            'selected_option_id': self.selected_option_id,
            'answer_text': self.answer_text
        }

class Review(db.Model):
    __tablename__ = 'reviews'
    review_id = db.Column(db.Integer, primary_key=True)
    course_id = db.Column(db.Integer, db.ForeignKey('courses.course_id'), nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey('users.user_id'), nullable=False)
    rating = db.Column(db.Integer, nullable=False)
    comment = db.Column(db.Text)
    review_date = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
    
    def to_dict(self):
        return {
            'review_id': self.review_id,
            'course_id': self.course_id,
            'user': self.user.to_dict() if self.user else None,
            'rating': self.rating,
            'comment': self.comment,
            'review_date': self.review_date.isoformat() if self.review_date else None
        }

class CareerRoadmap(db.Model):
    __tablename__ = 'career_roadmaps'
    roadmap_id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(255), nullable=False)
    description = db.Column(db.Text, nullable=False)
    created_by = db.Column(db.Integer, db.ForeignKey('users.user_id'), nullable=False)
    created_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
    
    # Relationships
    roadmap_courses = db.relationship('RoadmapCourse', backref='roadmap', lazy=True, cascade='all, delete-orphan')
    
    def to_dict(self):
        return {
            'roadmap_id': self.roadmap_id,
            'title': self.title,
            'description': self.description,
            'created_by': self.created_by,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }

class RoadmapCourse(db.Model):
    __tablename__ = 'roadmap_courses'
    roadmap_id = db.Column(db.Integer, db.ForeignKey('career_roadmaps.roadmap_id'), primary_key=True)
    course_id = db.Column(db.Integer, db.ForeignKey('courses.course_id'), primary_key=True)
    order_in_roadmap = db.Column(db.Integer, nullable=False)
    
    def to_dict(self):
        return {
            'roadmap_id': self.roadmap_id,
            'course_id': self.course_id,
            'order_in_roadmap': self.order_in_roadmap
        }

class ForumTopic(db.Model):
    __tablename__ = 'forum_topics'
    topic_id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(255), nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey('users.user_id'), nullable=False)
    created_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
    last_post_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
    is_sticky = db.Column(db.Boolean, nullable=False, default=False)
    is_locked = db.Column(db.Boolean, nullable=False, default=False)
    
    # Relationships
    posts = db.relationship('ForumPost', backref='topic', lazy=True, cascade='all, delete-orphan')
    
    def to_dict(self):
        return {
            'topic_id': self.topic_id,
            'title': self.title,
            'user': self.user.to_dict() if self.user else None,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'last_post_at': self.last_post_at.isoformat() if self.last_post_at else None,
            'is_sticky': self.is_sticky,
            'is_locked': self.is_locked
        }

class ForumPost(db.Model):
    __tablename__ = 'forum_posts'
    post_id = db.Column(db.Integer, primary_key=True)
    topic_id = db.Column(db.Integer, db.ForeignKey('forum_topics.topic_id'), nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey('users.user_id'), nullable=False)
    content = db.Column(db.Text, nullable=False)
    created_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
    parent_post_id = db.Column(db.Integer, db.ForeignKey('forum_posts.post_id'))
    
    # Relationships
    replies = db.relationship('ForumPost', backref=db.backref('parent_post', remote_side='ForumPost.post_id'), lazy=True)
    
    def to_dict(self):
        return {
            'post_id': self.post_id,
            'topic_id': self.topic_id,
            'user': self.user.to_dict() if self.user else None,
            'content': self.content,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'parent_post_id': self.parent_post_id
        }

class Vlog(db.Model):
    __tablename__ = 'vlogs'
    vlog_id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.user_id'), nullable=False)
    title = db.Column(db.String(255), nullable=False)
    description = db.Column(db.Text)
    video_url = db.Column(db.String(255), nullable=False)
    thumbnail = db.Column(db.String(255))
    upload_date = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
    views = db.Column(db.Integer, default=0)
    status = db.Column(db.Enum('pending', 'approved', 'rejected', name='vlog_status'), nullable=False)
    
    def to_dict(self):
        return {
            'vlog_id': self.vlog_id,
            'user': self.user.to_dict() if self.user else None,
            'title': self.title,
            'description': self.description,
            'video_url': self.video_url,
            'thumbnail': self.thumbnail,
            'upload_date': self.upload_date.isoformat() if self.upload_date else None,
            'views': self.views,
            'status': self.status
        }

class Message(db.Model):
    __tablename__ = 'messages'
    message_id = db.Column(db.Integer, primary_key=True)
    sender_id = db.Column(db.Integer, db.ForeignKey('users.user_id'), nullable=False)
    receiver_id = db.Column(db.Integer, db.ForeignKey('users.user_id'), nullable=False)
    subject = db.Column(db.String(255))
    content = db.Column(db.Text, nullable=False)
    sent_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
    is_read = db.Column(db.Boolean, nullable=False, default=False)
    
    def to_dict(self):
        return {
            'message_id': self.message_id,
            'sender': self.sender.to_dict() if self.sender else None,
            'receiver': self.receiver.to_dict() if self.receiver else None,
            'subject': self.subject,
            'content': self.content,
            'sent_at': self.sent_at.isoformat() if self.sent_at else None,
            'is_read': self.is_read
        }

class Notification(db.Model):
    __tablename__ = 'notifications'
    notification_id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.user_id'), nullable=False)
    type = db.Column(db.String(50), nullable=False)
    message = db.Column(db.Text, nullable=False)
    link = db.Column(db.String(255))
    created_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
    is_read = db.Column(db.Boolean, nullable=False, default=False)
    
    def to_dict(self):
        return {
            'notification_id': self.notification_id,
            'user_id': self.user_id,
            'type': self.type,
            'message': self.message,
            'link': self.link,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'is_read': self.is_read
        }

class Setting(db.Model):
    __tablename__ = 'settings'
    setting_id = db.Column(db.Integer, primary_key=True)
    setting_key = db.Column(db.String(100), unique=True, nullable=False)
    setting_value = db.Column(db.Text, nullable=False)
    
    def to_dict(self):
        return {
            'setting_id': self.setting_id,
            'setting_key': self.setting_key,
            'setting_value': self.setting_value
        }

class AuditLog(db.Model):
    __tablename__ = 'audit_logs'
    log_id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.user_id'))
    action = db.Column(db.String(255), nullable=False)
    details = db.Column(db.Text)
    ip_address = db.Column(db.String(45), nullable=False)
    timestamp = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
    
    def to_dict(self):
        return {
            'log_id': self.log_id,
            'user_id': self.user_id,
            'action': self.action,
            'details': self.details,
            'ip_address': self.ip_address,
            'timestamp': self.timestamp.isoformat() if self.timestamp else None
        }

