from flask import Blueprint, request, jsonify, session
from src.models.user import db, Quiz, Question, Option, QuizAttempt, Answer, Lesson, Course
from datetime import datetime

quizzes_bp = Blueprint('quizzes', __name__)

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

@quizzes_bp.route('/lesson/<int:lesson_id>', methods=['GET'])
def get_lesson_quizzes(lesson_id):
    try:
        lesson = Lesson.query.get_or_404(lesson_id)
        quizzes = Quiz.query.filter_by(lesson_id=lesson_id).all()
        
        return jsonify({
            'quizzes': [quiz.to_dict() for quiz in quizzes]
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@quizzes_bp.route('/<int:quiz_id>', methods=['GET'])
def get_quiz(quiz_id):
    try:
        quiz = Quiz.query.get_or_404(quiz_id)
        quiz_data = quiz.to_dict()
        
        # Get questions with options
        questions = Question.query.filter_by(quiz_id=quiz_id).all()
        quiz_data['questions'] = []
        
        for question in questions:
            question_data = question.to_dict()
            # Don't include correct answers for non-admin users taking the quiz
            if session.get('role') != 'admin':
                question_data.pop('correct_answer', None)
                # Remove is_correct from options
                for option in question_data.get('options', []):
                    option.pop('is_correct', None)
            quiz_data['questions'].append(question_data)
        
        return jsonify(quiz_data), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@quizzes_bp.route('/', methods=['POST'])
def create_quiz():
    try:
        auth_error = require_role(['admin', 'instructor'])
        if auth_error:
            return auth_error
        
        data = request.get_json()
        
        # Validate required fields
        required_fields = ['lesson_id', 'title', 'passing_score']
        for field in required_fields:
            if not data.get(field):
                return jsonify({'error': f'{field} is required'}), 400
        
        lesson = Lesson.query.get_or_404(data['lesson_id'])
        
        # Check permissions
        if session.get('role') != 'admin' and lesson.course.instructor_id != session['user_id']:
            return jsonify({'error': 'Insufficient permissions'}), 403
        
        # Create quiz
        quiz = Quiz(
            lesson_id=data['lesson_id'],
            title=data['title'],
            description=data.get('description'),
            passing_score=data['passing_score'],
            created_at=datetime.utcnow()
        )
        
        db.session.add(quiz)
        db.session.commit()
        
        return jsonify({
            'message': 'Quiz created successfully',
            'quiz': quiz.to_dict()
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@quizzes_bp.route('/<int:quiz_id>', methods=['PUT'])
def update_quiz(quiz_id):
    try:
        quiz = Quiz.query.get_or_404(quiz_id)
        
        # Check permissions
        if session.get('role') != 'admin' and quiz.lesson.course.instructor_id != session['user_id']:
            return jsonify({'error': 'Insufficient permissions'}), 403
        
        data = request.get_json()
        
        # Update fields
        if 'title' in data:
            quiz.title = data['title']
        if 'description' in data:
            quiz.description = data['description']
        if 'passing_score' in data:
            quiz.passing_score = data['passing_score']
        
        db.session.commit()
        
        return jsonify({
            'message': 'Quiz updated successfully',
            'quiz': quiz.to_dict()
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@quizzes_bp.route('/<int:quiz_id>', methods=['DELETE'])
def delete_quiz(quiz_id):
    try:
        quiz = Quiz.query.get_or_404(quiz_id)
        
        # Check permissions
        if session.get('role') != 'admin' and quiz.lesson.course.instructor_id != session['user_id']:
            return jsonify({'error': 'Insufficient permissions'}), 403
        
        db.session.delete(quiz)
        db.session.commit()
        
        return jsonify({'message': 'Quiz deleted successfully'}), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@quizzes_bp.route('/<int:quiz_id>/questions', methods=['POST'])
def create_question(quiz_id):
    try:
        quiz = Quiz.query.get_or_404(quiz_id)
        
        # Check permissions
        if session.get('role') != 'admin' and quiz.lesson.course.instructor_id != session['user_id']:
            return jsonify({'error': 'Insufficient permissions'}), 403
        
        data = request.get_json()
        
        # Validate required fields
        required_fields = ['question_text', 'question_type']
        for field in required_fields:
            if not data.get(field):
                return jsonify({'error': f'{field} is required'}), 400
        
        # Create question
        question = Question(
            quiz_id=quiz_id,
            question_text=data['question_text'],
            question_type=data['question_type'],
            correct_answer=data.get('correct_answer')
        )
        
        db.session.add(question)
        db.session.flush()  # To get the question ID
        
        # Create options for multiple choice questions
        if data['question_type'] == 'multiple_choice' and data.get('options'):
            for option_data in data['options']:
                option = Option(
                    question_id=question.question_id,
                    option_text=option_data['option_text'],
                    is_correct=option_data.get('is_correct', False)
                )
                db.session.add(option)
        
        db.session.commit()
        
        return jsonify({
            'message': 'Question created successfully',
            'question': question.to_dict()
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@quizzes_bp.route('/<int:quiz_id>/questions/<int:question_id>', methods=['PUT'])
def update_question(quiz_id, question_id):
    try:
        quiz = Quiz.query.get_or_404(quiz_id)
        question = Question.query.filter_by(question_id=question_id, quiz_id=quiz_id).first_or_404()
        
        # Check permissions
        if session.get('role') != 'admin' and quiz.lesson.course.instructor_id != session['user_id']:
            return jsonify({'error': 'Insufficient permissions'}), 403
        
        data = request.get_json()
        
        # Update fields
        if 'question_text' in data:
            question.question_text = data['question_text']
        if 'question_type' in data:
            question.question_type = data['question_type']
        if 'correct_answer' in data:
            question.correct_answer = data['correct_answer']
        
        # Update options if provided
        if 'options' in data:
            # Delete existing options
            Option.query.filter_by(question_id=question_id).delete()
            
            # Create new options
            for option_data in data['options']:
                option = Option(
                    question_id=question_id,
                    option_text=option_data['option_text'],
                    is_correct=option_data.get('is_correct', False)
                )
                db.session.add(option)
        
        db.session.commit()
        
        return jsonify({
            'message': 'Question updated successfully',
            'question': question.to_dict()
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@quizzes_bp.route('/<int:quiz_id>/questions/<int:question_id>', methods=['DELETE'])
def delete_question(quiz_id, question_id):
    try:
        quiz = Quiz.query.get_or_404(quiz_id)
        question = Question.query.filter_by(question_id=question_id, quiz_id=quiz_id).first_or_404()
        
        # Check permissions
        if session.get('role') != 'admin' and quiz.lesson.course.instructor_id != session['user_id']:
            return jsonify({'error': 'Insufficient permissions'}), 403
        
        db.session.delete(question)
        db.session.commit()
        
        return jsonify({'message': 'Question deleted successfully'}), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@quizzes_bp.route('/<int:quiz_id>/attempt', methods=['POST'])
def submit_quiz_attempt():
    try:
        auth_error = require_auth()
        if auth_error:
            return auth_error
        
        quiz = Quiz.query.get_or_404(quiz_id)
        data = request.get_json()
        
        if not data.get('answers'):
            return jsonify({'error': 'Answers are required'}), 400
        
        # Calculate score
        questions = Question.query.filter_by(quiz_id=quiz_id).all()
        total_questions = len(questions)
        correct_answers = 0
        
        # Create quiz attempt
        attempt = QuizAttempt(
            user_id=session['user_id'],
            quiz_id=quiz_id,
            score=0,  # Will be updated after calculation
            attempt_date=datetime.utcnow(),
            is_passed=False  # Will be updated after calculation
        )
        
        db.session.add(attempt)
        db.session.flush()  # To get the attempt ID
        
        # Process answers and calculate score
        for answer_data in data['answers']:
            question = Question.query.get(answer_data['question_id'])
            if not question:
                continue
            
            # Create answer record
            answer = Answer(
                attempt_id=attempt.attempt_id,
                question_id=answer_data['question_id'],
                selected_option_id=answer_data.get('selected_option_id'),
                answer_text=answer_data.get('answer_text')
            )
            db.session.add(answer)
            
            # Check if answer is correct
            is_correct = False
            if question.question_type == 'multiple_choice':
                if answer_data.get('selected_option_id'):
                    option = Option.query.get(answer_data['selected_option_id'])
                    if option and option.is_correct:
                        is_correct = True
            elif question.question_type == 'true_false':
                if answer_data.get('selected_option_id'):
                    option = Option.query.get(answer_data['selected_option_id'])
                    if option and option.is_correct:
                        is_correct = True
            elif question.question_type == 'short_answer':
                if (answer_data.get('answer_text') and 
                    question.correct_answer and
                    answer_data['answer_text'].lower().strip() == question.correct_answer.lower().strip()):
                    is_correct = True
            
            if is_correct:
                correct_answers += 1
        
        # Calculate final score
        score = (correct_answers / total_questions * 100) if total_questions > 0 else 0
        attempt.score = score
        attempt.is_passed = score >= quiz.passing_score
        
        db.session.commit()
        
        return jsonify({
            'message': 'Quiz attempt submitted successfully',
            'attempt': attempt.to_dict(),
            'score': score,
            'correct_answers': correct_answers,
            'total_questions': total_questions,
            'is_passed': attempt.is_passed
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@quizzes_bp.route('/<int:quiz_id>/attempts', methods=['GET'])
def get_quiz_attempts(quiz_id):
    try:
        auth_error = require_auth()
        if auth_error:
            return auth_error
        
        quiz = Quiz.query.get_or_404(quiz_id)
        
        # Users can see their own attempts, instructors/admins can see all attempts
        if session.get('role') in ['admin'] or quiz.lesson.course.instructor_id == session['user_id']:
            attempts = QuizAttempt.query.filter_by(quiz_id=quiz_id).all()
        else:
            attempts = QuizAttempt.query.filter_by(quiz_id=quiz_id, user_id=session['user_id']).all()
        
        return jsonify({
            'attempts': [attempt.to_dict() for attempt in attempts]
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@quizzes_bp.route('/attempts/<int:attempt_id>', methods=['GET'])
def get_quiz_attempt(attempt_id):
    try:
        auth_error = require_auth()
        if auth_error:
            return auth_error
        
        attempt = QuizAttempt.query.get_or_404(attempt_id)
        
        # Check permissions
        if (attempt.user_id != session['user_id'] and 
            session.get('role') != 'admin' and
            attempt.quiz.lesson.course.instructor_id != session['user_id']):
            return jsonify({'error': 'Insufficient permissions'}), 403
        
        attempt_data = attempt.to_dict()
        attempt_data['answers'] = [answer.to_dict() for answer in attempt.answers]
        
        return jsonify(attempt_data), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

