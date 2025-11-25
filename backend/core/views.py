"""
API Views for AI Teacher
Implements all endpoints according to PRD requirements
Enhanced: Performance-based analysis for Mathematics topics
"""
from rest_framework.views import APIView
from django.shortcuts import get_object_or_404
from django.contrib.auth.hashers import make_password, check_password
from .models import User, Diagnostic, WeaknessProfile, LearningPath, ChatSession, Progress
from .serializers import (
    UserSerializer, DiagnosticSerializer, WeaknessProfileSerializer,
    LearningPathSerializer, ChatSessionSerializer, ProgressSerializer
)
from .utils import success_response, error_response
from .ai_services import analyze_weaknesses, generate_study_plan, tutor_chat


class LoginView(APIView):
    """
    POST /api/auth/login/
    Handle SevisPass login - creates or retrieves user
    PRD: Student Login (via SevisPass)
    Enhanced: Added password authentication for MVP
    """
    def post(self, request):
        sevis_pass_id = request.data.get('sevis_pass_id')
        password = request.data.get('password', '')
        name = request.data.get('name')
        grade_level = request.data.get('grade_level', 11)
        school = request.data.get('school', '')
        email = request.data.get('email', '')
        
        if not sevis_pass_id:
            return error_response('SevisPass ID is required')
        
        if not password:
            return error_response('Password is required')
        
        # Try to get existing user
        try:
            user = User.objects.get(sevis_pass_id=sevis_pass_id)
            
            # Check password
            if user.password:
                # User has a password set, verify it
                if not check_password(password, user.password):
                    return error_response('Invalid SevisPass ID or password', http_status=401)
            else:
                # User exists but no password set (legacy user), set default password
                user.password = make_password('123456')
                user.save()
            
            # Update user info if provided
            updated = False
            if name and user.name != name:
                user.name = name
                updated = True
            if school and user.school != school:
                user.school = school
                updated = True
            if email and user.email != email:
                user.email = email
                updated = True
            if grade_level and user.grade_level != grade_level:
                user.grade_level = grade_level
                updated = True
            if updated:
                user.save()
            
            return success_response(
                data=UserSerializer(user).data,
                message='Login successful',
                http_status=200
            )
            
        except User.DoesNotExist:
            # Create new user with hashed password
            user = User.objects.create(
                sevis_pass_id=sevis_pass_id,
                name=name or f'Student {sevis_pass_id[:8]}',
                grade_level=grade_level,
                school=school,
                email=email,
                password=make_password(password)  # Hash the password
            )
            
            return success_response(
                data=UserSerializer(user).data,
                message='Account created and login successful',
                http_status=201
            )


class StudentProfileView(APIView):
    """
    POST /api/student/profile/
    Get student profile by SevisPass ID
    PRD: Student profile endpoint
    """
    def post(self, request):
        sevis_pass_id = request.data.get('sevis_pass_id')
        
        if not sevis_pass_id:
            return error_response('SevisPass ID is required')
        
        try:
            user = User.objects.get(sevis_pass_id=sevis_pass_id)
            return success_response(data=UserSerializer(user).data)
        except User.DoesNotExist:
            return error_response('User not found', http_status=404)


class SubmitDiagnosticView(APIView):
    """
    POST /api/diagnostic/submit/
    Submit diagnostic test answers
    PRD: Diagnostic Test (Initial Assessment)
    Note: Optional - performance analysis can work without diagnostic
    """
    def post(self, request):
        sevis_pass_id = request.data.get('sevis_pass_id')
        answers = request.data.get('answers', [])
        
        if not sevis_pass_id:
            return error_response('SevisPass ID is required')
        
        if not answers:
            return error_response('Answers are required')
        
        try:
            user = User.objects.get(sevis_pass_id=sevis_pass_id)
        except User.DoesNotExist:
            return error_response('User not found', http_status=404)
        
        # Save diagnostic results
        diagnostic_records = []
        for answer in answers:
            diagnostic = Diagnostic.objects.create(
                user=user,
                subject='math',  # Only math now
                question=answer.get('question', ''),
                student_answer=answer.get('student_answer', ''),
                correct_answer=answer.get('correct_answer', ''),
                is_correct=answer.get('is_correct', False),
                score=answer.get('score', 0.0),
                time_taken_seconds=answer.get('time_taken_seconds', 0),
            )
            diagnostic_records.append(diagnostic)
        
        return success_response(
            data={
                'diagnostic_id': str(diagnostic_records[0].id) if diagnostic_records else None,
                'count': len(diagnostic_records),
                'diagnostics': DiagnosticSerializer(diagnostic_records, many=True).data
            },
            message=f'Successfully submitted {len(diagnostic_records)} diagnostic answers',
            http_status=201
        )


class AnalyzePerformanceView(APIView):
    """
    POST /api/analyze/performance/
    Analyze academic performance from Progress records (topic-level analysis)
    Primary method: Analyzes Mathematics topics directly from database
    """
    def post(self, request):
        sevis_pass_id = request.data.get('sevis_pass_id')
        
        if not sevis_pass_id:
            return error_response('SevisPass ID is required')
        
        try:
            user = User.objects.get(sevis_pass_id=sevis_pass_id)
        except User.DoesNotExist:
            return error_response('User not found', http_status=404)
        
        # Get all math progress records
        progress_records = Progress.objects.filter(user=user, subject='math')
        
        if not progress_records.exists():
            return error_response('No academic performance data found. Please ensure student records are in the database.', http_status=404)
        
        # Define the 4 core math topics
        math_topics = ['algebra', 'geometry', 'trigonometry', 'calculus']
        
        # Group progress records by topic and calculate averages
        topic_scores = {}
        topic_data = {}
        
        for topic in math_topics:
            topic_key = f'{topic}_score'
            topic_records = progress_records.filter(metric_name=topic_key)
            
            if topic_records.exists():
                scores = [r.metric_value for r in topic_records]
                avg_score = sum(scores) / len(scores)
                topic_scores[topic] = round(avg_score, 1)
                topic_data[topic] = {
                    'average': round(avg_score, 1),
                    'records_count': len(scores),
                    'min': round(min(scores), 1),
                    'max': round(max(scores), 1),
                }
            else:
                # If no data for this topic, set a default or skip
                topic_scores[topic] = None
        
        # Calculate overall math performance
        overall_scores = [score for score in topic_scores.values() if score is not None]
        overall_performance = sum(overall_scores) / len(overall_scores) if overall_scores else 0.0
        
        # Identify weak topics (< 60% threshold)
        weak_topics = {topic: score for topic, score in topic_scores.items() 
                      if score is not None and score < 60}
        strong_topics = {topic: score for topic, score in topic_scores.items() 
                        if score is not None and score >= 60}
        
        # Determine if student is poor-performing
        is_poor_performing = overall_performance < 60 or len(weak_topics) >= 2
        
        # Prepare performance context for AI
        performance_context = {
            'grade_level': user.grade_level,
            'overall_performance': round(overall_performance, 1),
            'topic_scores': topic_scores,
            'weak_topics': weak_topics,
            'strong_topics': strong_topics,
            'is_poor_performing': is_poor_performing,
            'performance_records_count': progress_records.count(),
        }
        
        # Call AI service to analyze performance and generate weakness profile
        # Convert topic scores to weakness/strength format for AI
        weaknesses_dict = {}
        strengths_dict = {}
        
        for topic, score in topic_scores.items():
            if score is not None:
                # Convert percentage to 0-1 scale (lower score = worse performance)
                normalized_score = score / 100.0
                if score < 60:
                    weaknesses_dict[topic] = normalized_score
                else:
                    strengths_dict[topic] = normalized_score
        
        # Generate baseline score (overall performance)
        baseline_score = overall_performance
        
        # Determine recommended difficulty
        if overall_performance < 50:
            recommended_difficulty = 'beginner'
        elif overall_performance < 70:
            recommended_difficulty = 'intermediate'
        else:
            recommended_difficulty = 'advanced'
        
        # Create or update weakness profile
        weakness_profile, created = WeaknessProfile.objects.update_or_create(
            user=user,
            subject='math',
            defaults={
                'weaknesses': weaknesses_dict,
                'strengths': strengths_dict,
                'baseline_score': baseline_score,
                'confidence_score': 0.9,  # High confidence when using actual performance data
                'recommended_difficulty': recommended_difficulty,
            }
        )
        
        return success_response(
            data={
                'weakness_profile': WeaknessProfileSerializer(weakness_profile).data,
                'performance_analysis': {
                    'overall_score': round(overall_performance, 1),
                    'topic_scores': topic_data,
                    'weak_topics': list(weak_topics.keys()),
                    'strong_topics': list(strong_topics.keys()),
                    'is_poor_performing': is_poor_performing,
                }
            },
            message='Performance analysis completed successfully'
        )


class AnalyzeWeaknessesView(APIView):
    """
    POST /api/analyze/weaknesses/
    Analyze diagnostic results and generate weakness profile
    PRD: Real-time Weakness Detection
    Note: This is now secondary - AnalyzePerformanceView is primary
    """
    def post(self, request):
        sevis_pass_id = request.data.get('sevis_pass_id')
        subject = request.data.get('subject', 'math')
        
        if not sevis_pass_id:
            return error_response('SevisPass ID is required')
        
        try:
            user = User.objects.get(sevis_pass_id=sevis_pass_id)
        except User.DoesNotExist:
            return error_response('User not found', http_status=404)
        
        # Get diagnostic results for the subject
        diagnostics = Diagnostic.objects.filter(user=user, subject=subject).order_by('-created_at')
        if not diagnostics.exists():
            return error_response('No diagnostic results found. Please complete diagnostic test first.', http_status=404)
        
        # Calculate academic performance from Progress records
        progress_records = Progress.objects.filter(user=user, subject=subject).order_by('-recorded_at')
        
        # Calculate average scores from progress data
        performance_data = {
            'quiz_scores': [],
            'practice_completion': [],
            'topic_mastery': [],
            'overall_scores': [],
        }
        
        for record in progress_records:
            metric_name = record.metric_name.lower()
            metric_value = record.metric_value
            
            if 'quiz' in metric_name or 'score' in metric_name:
                performance_data['quiz_scores'].append(metric_value)
            elif 'practice' in metric_name or 'completion' in metric_name:
                performance_data['practice_completion'].append(metric_value)
            elif 'mastery' in metric_name or 'topic' in metric_name:
                performance_data['topic_mastery'].append(metric_value)
            
            # Collect all scores for overall average
            if metric_value > 0:
                performance_data['overall_scores'].append(metric_value)
        
        # Calculate averages
        avg_quiz_score = sum(performance_data['quiz_scores']) / len(performance_data['quiz_scores']) if performance_data['quiz_scores'] else None
        avg_practice = sum(performance_data['practice_completion']) / len(performance_data['practice_completion']) if performance_data['practice_completion'] else None
        avg_mastery = sum(performance_data['topic_mastery']) / len(performance_data['topic_mastery']) if performance_data['topic_mastery'] else None
        overall_performance = sum(performance_data['overall_scores']) / len(performance_data['overall_scores']) if performance_data['overall_scores'] else None
        
        # Calculate diagnostic average (from is_correct, not score field)
        # The diagnostic test score is based on correct/incorrect answers
        correct_diagnostics = diagnostics.filter(is_correct=True).count()
        total_diagnostics = diagnostics.count()
        diagnostic_percentage = (correct_diagnostics / total_diagnostics * 100) if total_diagnostics > 0 else 0.0
        
        # Also calculate from score field if available (for reference)
        diagnostic_scores = [d.score for d in diagnostics if d.score > 0]
        avg_diagnostic = sum(diagnostic_scores) / len(diagnostic_scores) * 100 if diagnostic_scores else diagnostic_percentage
        
        # Determine if student is poor-performing (threshold: < 60%)
        is_poor_performing = False
        if overall_performance is not None and overall_performance < 60:
            is_poor_performing = True
        elif avg_diagnostic is not None and avg_diagnostic < 60:
            is_poor_performing = True
        
        # Prepare diagnostic data for AI analysis
        diagnostic_data = [
            {
                'subject': d.subject,
                'question': d.question,
                'student_answer': d.student_answer,
                'correct_answer': d.correct_answer,
                'is_correct': d.is_correct,
            }
            for d in diagnostics
        ]
        
        # Prepare performance context for AI
        performance_context = {
            'grade_level': user.grade_level,
            'overall_performance': round(overall_performance, 1) if overall_performance else None,
            'avg_quiz_score': round(avg_quiz_score, 1) if avg_quiz_score else None,
            'avg_practice_completion': round(avg_practice, 1) if avg_practice else None,
            'avg_topic_mastery': round(avg_mastery, 1) if avg_mastery else None,
            'avg_diagnostic_score': round(diagnostic_percentage, 1),  # Use the actual diagnostic test percentage
            'is_poor_performing': is_poor_performing,
            'performance_records_count': progress_records.count(),
        }
        
        # Call AI service to analyze weaknesses (now with performance data)
        analysis_result = analyze_weaknesses(diagnostic_data, performance_context)
        
        # Create or update weakness profile with AI results
        weakness_profile, created = WeaknessProfile.objects.update_or_create(
            user=user,
            subject=subject,
            defaults={
                'weaknesses': analysis_result.get('weaknesses', {}),
                'strengths': analysis_result.get('strengths', {}),
                'baseline_score': analysis_result.get('baseline_score', 0.0),
                'confidence_score': analysis_result.get('confidence_score', 0.5),
                'recommended_difficulty': analysis_result.get('recommended_difficulty', 'beginner'),
            }
        )
        
        return success_response(
            data=WeaknessProfileSerializer(weakness_profile).data,
            message='Weakness analysis completed' if created else 'Weakness profile updated'
        )


class GenerateStudyPlanView(APIView):
    """
    POST /api/generate/study-plan/
    Generate personalized learning path based on weakness profile
    PRD: Personalized Learning Path
    Enhanced: Works with performance-based weakness profiles
    """
    def post(self, request):
        sevis_pass_id = request.data.get('sevis_pass_id')
        subject = request.data.get('subject', 'math')
        
        if not sevis_pass_id:
            return error_response('SevisPass ID is required')
        
        try:
            user = User.objects.get(sevis_pass_id=sevis_pass_id)
        except User.DoesNotExist:
            return error_response('User not found', http_status=404)
        
        # Check if weakness profile exists
        try:
            weakness_profile = WeaknessProfile.objects.get(user=user, subject=subject)
        except WeaknessProfile.DoesNotExist:
            return error_response(
                'Weakness profile not found. Please analyze performance first.',
                http_status=404
            )
        
        # Get topic-level scores from Progress records for better AI context
        progress_records = Progress.objects.filter(user=user, subject=subject)
        topic_scores = {}
        math_topics = ['algebra', 'geometry', 'trigonometry', 'calculus']
        
        for topic in math_topics:
            topic_key = f'{topic}_score'
            topic_records = progress_records.filter(metric_name=topic_key)
            if topic_records.exists():
                scores = [r.metric_value for r in topic_records]
                topic_scores[topic] = round(sum(scores) / len(scores), 1)
        
        # Call AI service to generate learning path
        path_data = generate_study_plan(
            weakness_profile={
                'weaknesses': weakness_profile.weaknesses,
                'strengths': weakness_profile.strengths,
                'recommended_difficulty': weakness_profile.recommended_difficulty,
            },
            subject=subject,
            grade_level=user.grade_level,
            topic_scores=topic_scores if topic_scores else None
        )
        
        # Create or update learning path with AI-generated data
        learning_path, created = LearningPath.objects.update_or_create(
            user=user,
            subject=subject,
            defaults={
                'syllabus': path_data.get('syllabus', {}),
                'week_plan': path_data.get('week_plan', {}),
                'daily_tasks': path_data.get('daily_tasks', {}),
                'status': 'active',
            }
        )
        
        return success_response(
            data=LearningPathSerializer(learning_path).data,
            message='Learning path generated successfully' if created else 'Learning path updated'
        )


class TutorChatView(APIView):
    """
    POST /api/tutor/chat/
    AI tutor chat interface
    PRD: AI Teacher Interface
    """
    def post(self, request):
        sevis_pass_id = request.data.get('sevis_pass_id')
        message = request.data.get('message', '')
        subject = request.data.get('subject', 'math')
        chat_history = request.data.get('chat_history', [])
        study_plan_context = request.data.get('study_plan_context')  # New: study plan context
        
        if not sevis_pass_id:
            return error_response('SevisPass ID is required')
        
        if not message:
            return error_response('Message is required')
        
        try:
            user = User.objects.get(sevis_pass_id=sevis_pass_id)
        except User.DoesNotExist:
            return error_response('User not found', http_status=404)
        
        # Get or create chat session
        chat_session, created = ChatSession.objects.get_or_create(
            user=user,
            subject=subject,
            defaults={
                'messages': [],
                'context': {
                    'grade_level': user.grade_level,
                    'subject': subject,
                }
            }
        )
        
        # Get weakness profile for context
        try:
            weakness_profile = WeaknessProfile.objects.get(user=user, subject=subject)
            context = {
                'grade_level': user.grade_level,
                'subject': subject,
                'weaknesses': weakness_profile.weaknesses,
                'baseline_score': weakness_profile.baseline_score,
            }
        except WeaknessProfile.DoesNotExist:
            context = {
                'grade_level': user.grade_level,
                'subject': subject,
            }
        
        # Add study plan context if provided
        if study_plan_context:
            context['study_plan'] = study_plan_context
        
        # Prepare chat history
        messages = chat_session.messages if chat_session.messages else []
        if chat_history:
            messages = chat_history
        
        # Call AI service
        ai_response = tutor_chat(message, messages, context)
        
        # Update chat session
        messages.append({'role': 'user', 'content': message})
        messages.append({'role': 'assistant', 'content': ai_response})
        chat_session.messages = messages
        chat_session.context = context
        chat_session.save()
        
        return success_response(
            data={
                'session_id': str(chat_session.id),
                'response': ai_response,
                'chat_history': messages,
            },
            message='Chat response generated'
        )


class ProgressView(APIView):
    """
    GET /api/progress/
    Get student progress records
    PRD: Progress Tracking
    """
    def get(self, request):
        sevis_pass_id = request.GET.get('sevis_pass_id')
        subject = request.GET.get('subject', 'math')
        
        if not sevis_pass_id:
            return error_response('SevisPass ID is required')
        
        try:
            user = User.objects.get(sevis_pass_id=sevis_pass_id)
        except User.DoesNotExist:
            return error_response('User not found', http_status=404)
        
        progress_records = Progress.objects.filter(user=user, subject=subject).order_by('-recorded_at')
        
        return success_response(
            data=ProgressSerializer(progress_records, many=True).data,
            message=f'Retrieved {progress_records.count()} progress records'
        )


class TeacherStudentsView(APIView):
    """
    GET /api/teacher/students/
    Get list of all students (for teacher dashboard)
    PRD: Teacher Dashboard
    """
    def get(self, request):
        school = request.GET.get('school')
        
        if school:
            students = User.objects.filter(school=school)
        else:
            students = User.objects.all()
        
        return success_response(
            data=UserSerializer(students, many=True).data,
            message=f'Retrieved {students.count()} students'
        )


class TeacherStudentDetailView(APIView):
    """
    GET /api/teacher/student/<student_id>/
    Get detailed student information for teacher
    PRD: Teacher Dashboard - View student details
    """
    def get(self, request, student_id):
        try:
            user = User.objects.get(id=student_id)
        except User.DoesNotExist:
            return error_response('Student not found', http_status=404)
        
        # Get all related data
        weakness_profiles = WeaknessProfile.objects.filter(user=user)
        learning_paths = LearningPath.objects.filter(user=user)
        progress_records = Progress.objects.filter(user=user).order_by('-recorded_at')[:20]
        diagnostics = Diagnostic.objects.filter(user=user).order_by('-created_at')[:20]
        
        return success_response(
            data={
                'student': UserSerializer(user).data,
                'weakness_profiles': WeaknessProfileSerializer(weakness_profiles, many=True).data,
                'learning_paths': LearningPathSerializer(learning_paths, many=True).data,
                'progress': ProgressSerializer(progress_records, many=True).data,
                'recent_diagnostics': DiagnosticSerializer(diagnostics, many=True).data,
            },
            message='Student details retrieved successfully'
        )
