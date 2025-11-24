"""
URL routing for core app
All endpoints follow PRD requirements
"""
from django.urls import path
from . import views

urlpatterns = [
    # Authentication endpoints (PRD Section 4.1)
    path('auth/login/', views.LoginView.as_view(), name='login'),
    
    # Student profile endpoint (PRD Section 4.1)
    path('student/profile/', views.StudentProfileView.as_view(), name='student_profile'),
    
    # Diagnostic endpoints (PRD Section 4.2)
    path('diagnostic/submit/', views.SubmitDiagnosticView.as_view(), name='submit_diagnostic'),
    
    # Weakness analysis endpoint (PRD Section 4.3)
    path('analyze/weaknesses/', views.AnalyzeWeaknessesView.as_view(), name='analyze_weaknesses'),
    
    # Learning path generation (PRD Section 4.4)
    path('generate/study-plan/', views.GenerateStudyPlanView.as_view(), name='generate_study_plan'),
    
    # AI tutor chat (PRD Section 4.3)
    path('tutor/chat/', views.TutorChatView.as_view(), name='tutor_chat'),
    
    # Progress tracking (PRD Section 4.6)
    path('progress/', views.ProgressView.as_view(), name='progress'),
    
    # Teacher dashboard endpoints (PRD Section 4.6)
    path('teacher/students/', views.TeacherStudentsView.as_view(), name='teacher_students'),
    path('teacher/student/<uuid:student_id>/', views.TeacherStudentDetailView.as_view(), name='teacher_student_detail'),
]
