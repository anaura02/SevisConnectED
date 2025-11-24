"""
API Views for SevisConnectED
Implements all endpoints according to PRD requirements
"""
from rest_framework.views import APIView
from django.shortcuts import get_object_or_404
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
    """
    def post(self, request):
        sevis_pass_id = request.data.get('sevis_pass_id')
        name = request.data.get('name')
        grade_level = request.data.get('grade_level', 11)
        school = request.data.get('school', '')
        email = request.data.get('email', '')
        
        if not sevis_pass_id:
            return error_response('SevisPass ID is required')
        
        # Get or create user
        user, created = User.objects.get_or_create(
            sevis_pass_id=sevis_pass_id,
            defaults={
                'name': name or f'Student {sevis_pass_id[:8]}',
                'grade_level': grade_level,
                'school': school,
                'email': email,
            }
        )
        
        # Update user if provided
        if name and user.name != name:
            user.name = name
        if school and user.school != school:
            user.school = school
        if email and user.email != email:
            user.email = email
        if grade_level and user.grade_level != grade_level:
            user.grade_level = grade_level
        user.save()
        
        return success_response(
            data=UserSerializer(user).data,
            message='Login successful' if created else 'User retrieved',
            http_status=201 if created else 200
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
                subject=answer.get('subject', 'math'),
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


class AnalyzeWeaknessesView(APIView):
    """
    POST /api/analyze/weaknesses/
    Analyze diagnostic results and generate weakness profile
    PRD: Real-time Weakness Detection
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
        
        # Call AI service to analyze weaknesses
        analysis_result = analyze_weaknesses(diagnostic_data)
        
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
                'Weakness profile not found. Please complete diagnostic and weakness analysis first.',
                http_status=404
            )
        
        # Call AI service to generate learning path
        path_data = generate_study_plan(
            weakness_profile={
                'weaknesses': weakness_profile.weaknesses,
                'strengths': weakness_profile.strengths,
                'recommended_difficulty': weakness_profile.recommended_difficulty,
            },
            subject=subject,
            grade_level=user.grade_level
        )
        
        # Create or update learning path with AI-generated data
        learning_path, created = LearningPath.objects.update_or_create(
            user=user,
            subject=subject,
            defaults={
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
    Note: This will call AI service (to be implemented)
    """
    def post(self, request):
        sevis_pass_id = request.data.get('sevis_pass_id')
        message = request.data.get('message')
        subject = request.data.get('subject', 'math')
        
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
            defaults={'messages': [], 'context': {}}
        )
        
        # Add user message to history
        chat_session.messages.append({
            'role': 'user',
            'content': message
        })
        
        # Prepare context
        weakness_profile = WeaknessProfile.objects.filter(user=user, subject=subject).first()
        context = {
            'subject': subject,
            'grade_level': user.grade_level,
            'weaknesses': weakness_profile.weaknesses if weakness_profile else {},
        }
        chat_session.context = context
        
        # Call AI service to generate response
        ai_response = tutor_chat(
            user_message=message,
            chat_history=chat_session.messages[:-1],  # Exclude current message
            context=context
        )
        
        # Add AI response to history
        chat_session.messages.append({
            'role': 'assistant',
            'content': ai_response
        })
        
        chat_session.save()
        
        return success_response(
            data={
                'response': ai_response,
                'session_id': str(chat_session.id),
                'messages': chat_session.messages
            },
            message='Chat response generated'
        )


class ProgressView(APIView):
    """
    GET /api/progress/
    Get student progress tracking data
    PRD: Progress tracking endpoint
    """
    def get(self, request):
        sevis_pass_id = request.query_params.get('sevis_pass_id')
        subject = request.query_params.get('subject')
        
        if not sevis_pass_id:
            return error_response('SevisPass ID is required')
        
        try:
            user = User.objects.get(sevis_pass_id=sevis_pass_id)
        except User.DoesNotExist:
            return error_response('User not found', http_status=404)
        
        # Get progress records
        progress_query = Progress.objects.filter(user=user)
        if subject:
            progress_query = progress_query.filter(subject=subject)
        
        progress_records = progress_query.order_by('-recorded_at')[:50]  # Limit to 50 most recent
        
        return success_response(
            data=ProgressSerializer(progress_records, many=True).data,
            message=f'Retrieved {progress_records.count()} progress records'
        )


class TeacherStudentsView(APIView):
    """
    GET /api/teacher/students/
    Get list of students for teacher dashboard
    PRD: Teacher Dashboard (Lite for MVP)
    """
    def get(self, request):
        school = request.query_params.get('school')
        
        students_query = User.objects.all()
        if school:
            students_query = students_query.filter(school=school)
        
        students = students_query.order_by('-created_at')
        
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

