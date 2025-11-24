"""
Serializers for SevisConnectED API
Converts Django models to/from JSON for API responses
"""
from rest_framework import serializers
from .models import User, Diagnostic, WeaknessProfile, LearningPath, ChatSession, Progress


class UserSerializer(serializers.ModelSerializer):
    """Serializer for User model"""
    class Meta:
        model = User
        fields = ['id', 'sevis_pass_id', 'name', 'grade_level', 'school', 'email', 'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at']
        # Note: password is excluded from serializer for security


class DiagnosticSerializer(serializers.ModelSerializer):
    """Serializer for Diagnostic model"""
    user = UserSerializer(read_only=True)
    user_id = serializers.UUIDField(write_only=True, required=False)

    class Meta:
        model = Diagnostic
        fields = ['id', 'user', 'user_id', 'subject', 'question', 'student_answer', 
                  'correct_answer', 'is_correct', 'score', 'time_taken_seconds', 'created_at']
        read_only_fields = ['id', 'created_at']


class WeaknessProfileSerializer(serializers.ModelSerializer):
    """Serializer for WeaknessProfile model"""
    user = UserSerializer(read_only=True)
    user_id = serializers.UUIDField(write_only=True, required=False)

    class Meta:
        model = WeaknessProfile
        fields = ['id', 'user', 'user_id', 'subject', 'weaknesses', 'strengths', 
                  'baseline_score', 'confidence_score', 'recommended_difficulty', 
                  'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at']


class LearningPathSerializer(serializers.ModelSerializer):
    """Serializer for LearningPath model"""
    user = UserSerializer(read_only=True)
    user_id = serializers.UUIDField(write_only=True, required=False)

    class Meta:
        model = LearningPath
        fields = ['id', 'user', 'user_id', 'subject', 'week_plan', 'daily_tasks', 
                  'status', 'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at']


class ChatSessionSerializer(serializers.ModelSerializer):
    """Serializer for ChatSession model"""
    user = UserSerializer(read_only=True)
    user_id = serializers.UUIDField(write_only=True, required=False)

    class Meta:
        model = ChatSession
        fields = ['id', 'user', 'user_id', 'subject', 'messages', 'context', 
                  'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at']


class ProgressSerializer(serializers.ModelSerializer):
    """Serializer for Progress model"""
    user = UserSerializer(read_only=True)
    user_id = serializers.UUIDField(write_only=True, required=False)

    class Meta:
        model = Progress
        fields = ['id', 'user', 'user_id', 'subject', 'metric_name', 'metric_value', 'recorded_at']
        read_only_fields = ['id', 'recorded_at']


