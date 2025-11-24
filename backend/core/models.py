"""
Core models for SevisConnectED
Based on PRD schema with enhancements for MVP functionality
"""
import uuid
from django.db import models
from django.utils import timezone


class User(models.Model):
    """
    Student user model linked to SevisPass ID
    PRD: Users (id UUID from SevisPass, name, grade_level, school, email)
    Enhanced: Added password field for MVP authentication
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    sevis_pass_id = models.CharField(max_length=255, unique=True, db_index=True)
    name = models.CharField(max_length=255)
    grade_level = models.IntegerField(choices=[(11, 'Grade 11'), (12, 'Grade 12')])
    school = models.CharField(max_length=255)
    email = models.EmailField(blank=True, null=True)
    password = models.CharField(max_length=255, default='', help_text="Hashed password for MVP")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'users'
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.name} (Grade {self.grade_level})"


class Diagnostic(models.Model):
    """
    Diagnostic test results
    PRD: Diagnostics (id, user_id, subject, question, student_answer, correct_answer, score)
    Enhanced: Added is_correct boolean and time_taken_seconds for better analytics
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='diagnostics')
    subject = models.CharField(max_length=50, choices=[('math', 'Mathematics'), ('english', 'English')])
    question = models.TextField()
    student_answer = models.TextField()
    correct_answer = models.TextField()
    is_correct = models.BooleanField(default=False)
    score = models.FloatField(default=0.0, help_text="Question score (0.0 to 1.0)")
    time_taken_seconds = models.IntegerField(default=0, help_text="Time taken to answer in seconds")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'diagnostics'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['user', 'subject', 'created_at']),
        ]

    def __str__(self):
        return f"{self.user.name} - {self.subject} - Q{self.id}"


class WeaknessProfile(models.Model):
    """
    AI-generated weakness profile for a student
    PRD: WeaknessProfile (id, user_id, subject, weaknesses JSON, strengths JSON, baseline_score)
    Enhanced: Added confidence_score and recommended_difficulty for better personalization
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='weakness_profiles')
    subject = models.CharField(max_length=50, choices=[('math', 'Mathematics'), ('english', 'English')])
    weaknesses = models.JSONField(default=dict, help_text="Dictionary of topic:weakness_score pairs")
    strengths = models.JSONField(default=dict, help_text="Dictionary of topic:strength_score pairs")
    baseline_score = models.FloatField(default=0.0, help_text="Overall baseline score percentage")
    confidence_score = models.FloatField(
        default=0.0,
        help_text="AI confidence in analysis (0.0 to 1.0)"
    )
    recommended_difficulty = models.CharField(
        max_length=20,
        choices=[('beginner', 'Beginner'), ('intermediate', 'Intermediate'), ('advanced', 'Advanced')],
        default='beginner'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'weakness_profiles'
        ordering = ['-updated_at']
        unique_together = [['user', 'subject']]  # One profile per user per subject

    def __str__(self):
        return f"{self.user.name} - {self.subject} Weakness Profile"


class LearningPath(models.Model):
    """
    AI-generated personalized learning path
    PRD: LearningPath (id, user_id, week_plan JSON)
    Enhanced: Added subject, daily_tasks, and status for better tracking
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='learning_paths')
    subject = models.CharField(max_length=50, choices=[('math', 'Mathematics'), ('english', 'English')])
    week_plan = models.JSONField(default=dict, help_text="Week-by-week learning plan structure")
    daily_tasks = models.JSONField(
        default=dict,
        help_text="Daily micro-lessons and practice tasks"
    )
    status = models.CharField(
        max_length=20,
        choices=[('active', 'Active'), ('completed', 'Completed'), ('paused', 'Paused')],
        default='active'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'learning_paths'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['user', 'subject', 'status']),
        ]

    def __str__(self):
        return f"{self.user.name} - {self.subject} Learning Path"


class ChatSession(models.Model):
    """
    AI tutor chat sessions
    PRD: ChatSessions (id, user_id, messages JSON)
    Enhanced: Added subject and context for better AI responses
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='chat_sessions')
    subject = models.CharField(max_length=50, choices=[('math', 'Mathematics'), ('english', 'English')])
    messages = models.JSONField(default=list, help_text="List of chat messages with role and content")
    context = models.JSONField(
        default=dict,
        help_text="Additional context for AI (weaknesses, grade level, etc.)"
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'chat_sessions'
        ordering = ['-updated_at']
        indexes = [
            models.Index(fields=['user', 'subject', 'updated_at']),
        ]

    def __str__(self):
        return f"{self.user.name} - {self.subject} Chat Session"


class Progress(models.Model):
    """
    Student progress tracking over time
    Not in PRD but essential for MVP to track improvement
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='progress_records')
    subject = models.CharField(max_length=50, choices=[('math', 'Mathematics'), ('english', 'English')])
    metric_name = models.CharField(
        max_length=100,
        help_text="Metric being tracked (e.g., 'algebra_score', 'reading_comprehension')"
    )
    metric_value = models.FloatField(help_text="Value of the metric")
    recorded_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'progress'
        ordering = ['-recorded_at']
        indexes = [
            models.Index(fields=['user', 'subject', 'recorded_at']),
            models.Index(fields=['user', 'metric_name', 'recorded_at']),
        ]

    def __str__(self):
        return f"{self.user.name} - {self.metric_name}: {self.metric_value}"

