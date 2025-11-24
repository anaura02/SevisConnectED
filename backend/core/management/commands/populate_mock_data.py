"""
Django management command to populate mock data for all students
Run: python manage.py populate_mock_data
Creates: Diagnostics, Weakness Profiles, Learning Paths, Progress Records
"""
from django.core.management.base import BaseCommand
from django.utils import timezone
from datetime import timedelta
import random
import json
from core.models import User, Diagnostic, WeaknessProfile, LearningPath, Progress


class Command(BaseCommand):
    help = 'Populates mock data (diagnostics, weaknesses, learning paths, progress) for all students'

    def handle(self, *args, **options):
        students = User.objects.all()
        
        if not students.exists():
            self.stdout.write(self.style.ERROR('No students found. Please create students first using: python manage.py create_mock_students'))
            return
        
        self.stdout.write(self.style.SUCCESS(f'Found {students.count()} students. Populating mock data...\n'))
        
        total_diagnostics = 0
        total_weaknesses = 0
        total_paths = 0
        total_progress = 0
        
        for student in students:
            self.stdout.write(f'Processing {student.name} ({student.sevis_pass_id})...')
            
            # 1. Create Diagnostic Results
            diagnostics_created = self._create_diagnostics(student)
            total_diagnostics += diagnostics_created
            
            # 2. Create Weakness Profiles
            weaknesses_created = self._create_weakness_profiles(student)
            total_weaknesses += weaknesses_created
            
            # 3. Create Learning Paths
            paths_created = self._create_learning_paths(student)
            total_paths += paths_created
            
            # 4. Create Progress Records
            progress_created = self._create_progress_records(student)
            total_progress += progress_created
            
            self.stdout.write(self.style.SUCCESS(f'  ✓ Created {diagnostics_created} diagnostics, {weaknesses_created} weaknesses, {paths_created} paths, {progress_created} progress records\n'))
        
        self.stdout.write(self.style.SUCCESS('\n' + '='*60))
        self.stdout.write(self.style.SUCCESS('✅ Mock Data Population Complete!'))
        self.stdout.write(self.style.SUCCESS('='*60))
        self.stdout.write(f'Total Diagnostics: {total_diagnostics}')
        self.stdout.write(f'Total Weakness Profiles: {total_weaknesses}')
        self.stdout.write(f'Total Learning Paths: {total_paths}')
        self.stdout.write(f'Total Progress Records: {total_progress}')
        self.stdout.write(self.style.SUCCESS('\nYou can now test data fetching in the frontend!'))

    def _create_diagnostics(self, student):
        """Create diagnostic test results for a student"""
        subjects = ['math', 'english']
        diagnostics_created = 0
        
        for subject in subjects:
            # Create 5-8 diagnostic questions per subject
            num_questions = random.randint(5, 8)
            
            for i in range(num_questions):
                is_correct = random.choice([True, False, True, True])  # 75% chance correct
                score = random.uniform(0.7, 1.0) if is_correct else random.uniform(0.0, 0.6)
                time_taken = random.randint(30, 300)  # 30 seconds to 5 minutes
                
                # Generate realistic question/answer pairs
                if subject == 'math':
                    questions = [
                        ('Solve: 2x + 5 = 15', 'x = 5', 'x = 5'),
                        ('What is the area of a circle with radius 7?', '153.94', '153.94'),
                        ('Simplify: 3(x + 2) - 2x', 'x + 6', 'x + 6'),
                        ('What is 15% of 200?', '30', '30'),
                        ('Solve: x² - 5x + 6 = 0', 'x = 2 or x = 3', 'x = 2 or x = 3'),
                        ('Calculate: √144', '12', '12'),
                        ('What is the slope of y = 2x + 3?', '2', '2'),
                        ('Solve: 3x - 7 = 14', 'x = 7', 'x = 7'),
                    ]
                else:  # english
                    questions = [
                        ('Identify the verb in: "The cat sat on the mat."', 'sat', 'sat'),
                        ('What is the past tense of "go"?', 'went', 'went'),
                        ('Correct: "I have went to the store."', 'I have gone to the store', 'I have gone to the store'),
                        ('What is a synonym for "happy"?', 'joyful', 'joyful'),
                        ('Identify the subject: "The students studied hard."', 'students', 'students'),
                        ('What is the plural of "child"?', 'children', 'children'),
                        ('Correct: "She don\'t like apples."', 'She doesn\'t like apples', 'She doesn\'t like apples'),
                        ('What is an antonym for "brave"?', 'cowardly', 'cowardly'),
                    ]
                
                question, correct_answer, student_answer = random.choice(questions)
                if not is_correct:
                    # Generate a wrong answer
                    wrong_answers = ['5', '10', '20', 'Incorrect', 'Wrong answer', 'Not sure']
                    student_answer = random.choice(wrong_answers)
                
                Diagnostic.objects.create(
                    user=student,
                    subject=subject,
                    question=question,
                    student_answer=student_answer,
                    correct_answer=correct_answer,
                    is_correct=is_correct,
                    score=round(score, 2),
                    time_taken_seconds=time_taken,
                    created_at=timezone.now() - timedelta(days=random.randint(1, 30))
                )
                diagnostics_created += 1
        
        return diagnostics_created

    def _create_weakness_profiles(self, student):
        """Create weakness profiles based on diagnostic results"""
        subjects = ['math', 'english']
        weaknesses_created = 0
        
        for subject in subjects:
            # Check if weakness profile already exists
            if WeaknessProfile.objects.filter(user=student, subject=subject).exists():
                continue
            
            # Generate realistic weakness and strength topics
            if subject == 'math':
                topics = [
                    'Algebraic equations',
                    'Geometry and shapes',
                    'Percentage calculations',
                    'Fractions and decimals',
                    'Word problems',
                    'Linear equations',
                    'Quadratic equations',
                ]
            else:  # english
                topics = [
                    'Grammar and syntax',
                    'Vocabulary building',
                    'Reading comprehension',
                    'Verb tenses',
                    'Sentence structure',
                    'Essay writing',
                    'Punctuation',
                ]
            
            # Select 2-3 weakness topics and 2-3 strength topics
            selected_weaknesses = random.sample(topics, random.randint(2, 3))
            remaining_topics = [t for t in topics if t not in selected_weaknesses]
            selected_strengths = random.sample(remaining_topics, random.randint(2, 3)) if remaining_topics else []
            
            # Create weaknesses dict: topic -> weakness_score (0.0 to 0.5, lower is worse)
            weaknesses_dict = {
                topic: round(random.uniform(0.1, 0.5), 2) for topic in selected_weaknesses
            }
            
            # Create strengths dict: topic -> strength_score (0.6 to 1.0, higher is better)
            strengths_dict = {
                topic: round(random.uniform(0.6, 1.0), 2) for topic in selected_strengths
            }
            
            # Calculate baseline score (average of all scores)
            all_scores = list(weaknesses_dict.values()) + list(strengths_dict.values())
            baseline_score = round(sum(all_scores) / len(all_scores) * 100, 1) if all_scores else 50.0
            
            WeaknessProfile.objects.create(
                user=student,
                subject=subject,
                weaknesses=weaknesses_dict,
                strengths=strengths_dict,
                baseline_score=baseline_score,
                confidence_score=round(random.uniform(0.7, 0.95), 2),
                recommended_difficulty=random.choice(['beginner', 'intermediate', 'advanced']),
                created_at=timezone.now() - timedelta(days=random.randint(1, 20))
            )
            weaknesses_created += 1
        
        return weaknesses_created

    def _create_learning_paths(self, student):
        """Create learning paths based on weakness profiles"""
        subjects = ['math', 'english']
        paths_created = 0
        
        for subject in subjects:
            # Check if learning path already exists
            if LearningPath.objects.filter(user=student, subject=subject).exists():
                continue
            
            # Get weakness profile to base path on
            weakness_profile = WeaknessProfile.objects.filter(user=student, subject=subject).first()
            
            # Generate week-by-week plan
            if subject == 'math':
                week_topics = [
                    {'week': 1, 'focus': 'Basic Algebra Review', 'topics': ['Linear equations', 'Basic operations']},
                    {'week': 2, 'focus': 'Geometry Fundamentals', 'topics': ['Shapes', 'Area and perimeter']},
                    {'week': 3, 'focus': 'Percentage and Ratios', 'topics': ['Calculations', 'Word problems']},
                    {'week': 4, 'focus': 'Advanced Algebra', 'topics': ['Quadratic equations', 'Factoring']},
                ]
                daily_tasks = {
                    'monday': 'Practice algebraic equations (30 min)',
                    'tuesday': 'Geometry exercises (30 min)',
                    'wednesday': 'Percentage calculations (30 min)',
                    'thursday': 'Review and practice (30 min)',
                    'friday': 'Weekly assessment (45 min)',
                }
            else:  # english
                week_topics = [
                    {'week': 1, 'focus': 'Grammar Fundamentals', 'topics': ['Parts of speech', 'Sentence structure']},
                    {'week': 2, 'focus': 'Verb Tenses', 'topics': ['Past, present, future', 'Perfect tenses']},
                    {'week': 3, 'focus': 'Vocabulary Building', 'topics': ['Synonyms', 'Context clues']},
                    {'week': 4, 'focus': 'Reading Comprehension', 'topics': ['Main ideas', 'Inference']},
                ]
                daily_tasks = {
                    'monday': 'Grammar exercises (30 min)',
                    'tuesday': 'Vocabulary practice (30 min)',
                    'wednesday': 'Reading comprehension (30 min)',
                    'thursday': 'Writing practice (30 min)',
                    'friday': 'Weekly assessment (45 min)',
                }
            
            # Select 3-4 weeks for the plan
            selected_weeks = random.sample(week_topics, random.randint(3, 4))
            
            week_plan = {
                'weeks': selected_weeks,
                'total_weeks': len(selected_weeks),
                'current_week': random.randint(1, len(selected_weeks)),
            }
            
            LearningPath.objects.create(
                user=student,
                subject=subject,
                week_plan=week_plan,
                daily_tasks=daily_tasks,
                status=random.choice(['active', 'paused']),
                created_at=timezone.now() - timedelta(days=random.randint(1, 15))
            )
            paths_created += 1
        
        return paths_created

    def _create_progress_records(self, student):
        """Create progress tracking records"""
        subjects = ['math', 'english']
        progress_created = 0
        
        # Create progress records for the last 30 days
        for day_offset in range(30):
            date = timezone.now() - timedelta(days=day_offset)
            
            # Create 0-2 progress records per day (not every day has activity)
            if random.random() > 0.4:  # 60% chance of activity on a given day
                for subject in subjects:
                    if random.random() > 0.5:  # 50% chance per subject
                        metric_names = [
                            'quiz_score',
                            'practice_completion',
                            'topic_mastery',
                            'time_spent_minutes',
                            'exercises_completed',
                        ]
                        
                        metric_name = random.choice(metric_names)
                        
                        # Generate realistic metric values
                        if 'score' in metric_name or 'mastery' in metric_name:
                            metric_value = round(random.uniform(60, 95), 1)
                        elif 'completion' in metric_name:
                            metric_value = round(random.uniform(70, 100), 1)
                        elif 'time' in metric_name:
                            metric_value = round(random.uniform(15, 120), 0)
                        else:
                            metric_value = round(random.uniform(5, 20), 0)
                        
                        Progress.objects.create(
                            user=student,
                            subject=subject,
                            metric_name=metric_name,
                            metric_value=metric_value,
                            recorded_at=date
                        )
                        progress_created += 1
        
        return progress_created

