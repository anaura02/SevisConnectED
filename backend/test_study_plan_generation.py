"""
Test script to verify study plan generation with OpenAI
Run: python test_study_plan_generation.py
"""
import os
import django
from django.conf import settings

# Setup Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'sevisconnect.settings')
django.setup()

from core.models import User, WeaknessProfile, Progress
from core.ai_services import generate_study_plan, get_openai_client

# Test configuration
TEST_STUDENT_ID = 'SEVIS-001'

print("\n" + "="*60)
print("TESTING STUDY PLAN GENERATION")
print("="*60)

# Check OpenAI client
client = get_openai_client()
if not client:
    print("\n❌ ERROR: OpenAI client not available")
    print("   Check your OPENAI_API_KEY in .env file")
    exit(1)

print("\n✅ OpenAI client available")

# Get test student
try:
    student = User.objects.get(sevis_pass_id=TEST_STUDENT_ID)
    print(f"\n✅ Found student: {student.name} (Grade {student.grade_level})")
except User.DoesNotExist:
    print(f"\n❌ ERROR: Student {TEST_STUDENT_ID} not found")
    print("   Run: python manage.py create_mock_students")
    exit(1)

# Get weakness profile
try:
    weakness_profile = WeaknessProfile.objects.get(user=student, subject='math')
    print(f"\n✅ Found weakness profile:")
    print(f"   Baseline Score: {weakness_profile.baseline_score}%")
    print(f"   Recommended Difficulty: {weakness_profile.recommended_difficulty}")
    print(f"   Weaknesses: {list(weakness_profile.weaknesses.keys())}")
    print(f"   Strengths: {list(weakness_profile.strengths.keys())}")
except WeaknessProfile.DoesNotExist:
    print(f"\n❌ ERROR: Weakness profile not found")
    print("   Run: python manage.py populate_mock_data")
    print("   Or call: POST /api/analyze/performance/")
    exit(1)

# Get topic scores from Progress records
progress_records = Progress.objects.filter(user=student, subject='math')
topic_scores = {}
math_topics = ['algebra', 'geometry', 'trigonometry', 'calculus']

for topic in math_topics:
    topic_key = f'{topic}_score'
    topic_records = progress_records.filter(metric_name=topic_key)
    if topic_records.exists():
        scores = [r.metric_value for r in topic_records]
        avg_score = sum(scores) / len(scores)
        topic_scores[topic] = round(avg_score, 1)

print(f"\n✅ Topic Scores from Progress records:")
for topic, score in topic_scores.items():
    print(f"   {topic}: {score}%")

# Generate study plan
print(f"\n🤖 Generating study plan...")
print("   This may take 30-60 seconds...")

try:
    path_data = generate_study_plan(
        weakness_profile={
            'weaknesses': weakness_profile.weaknesses,
            'strengths': weakness_profile.strengths,
            'recommended_difficulty': weakness_profile.recommended_difficulty,
        },
        subject='math',
        grade_level=student.grade_level,
        topic_scores=topic_scores if topic_scores else None
    )
    
    print(f"\n✅ Study plan generated successfully!")
    
    # Check syllabus
    if path_data.get('syllabus'):
        syllabus = path_data['syllabus']
        print(f"\n📚 Syllabus:")
        print(f"   Title: {syllabus.get('title', 'N/A')}")
        print(f"   Modules: {len(syllabus.get('modules', []))}")
        if syllabus.get('modules'):
            print(f"   First Module: {syllabus['modules'][0].get('title', 'N/A')}")
    else:
        print(f"\n⚠️  WARNING: No syllabus in response")
    
    # Check week plan
    if path_data.get('week_plan'):
        week_plan = path_data['week_plan']
        week_keys = list(week_plan.keys())
        print(f"\n📅 Week Plan:")
        print(f"   Total Weeks: {len(week_keys)}")
        if week_keys:
            first_week = week_plan[week_keys[0]]
            print(f"   Week 1 Focus: {first_week.get('focus', 'N/A')}")
            print(f"   Week 1 Topics: {first_week.get('topics', [])}")
            
            # Check learning materials
            learning_materials = first_week.get('learning_materials', {})
            if learning_materials:
                print(f"   Learning Materials:")
                print(f"     - Lecture Notes: {len(learning_materials.get('lecture_notes', []))}")
                print(f"     - Videos: {len(learning_materials.get('videos', []))}")
                print(f"     - Practice Exercises: {len(learning_materials.get('practice_exercises', []))}")
                print(f"     - Additional Resources: {len(learning_materials.get('additional_resources', []))}")
            else:
                print(f"   ⚠️  WARNING: No learning materials in week 1")
    else:
        print(f"\n⚠️  WARNING: No week_plan in response")
    
    # Check daily tasks
    if path_data.get('daily_tasks'):
        daily_tasks = path_data['daily_tasks']
        print(f"\n📝 Daily Tasks:")
        print(f"   Total Days: {len(daily_tasks)}")
        if daily_tasks:
            first_day = list(daily_tasks.values())[0]
            print(f"   Day 1 Lesson: {first_day.get('lesson', 'N/A')}")
    else:
        print(f"\n⚠️  WARNING: No daily_tasks in response")
    
    print(f"\n" + "="*60)
    print("✅ TEST COMPLETE - Study plan generation is working!")
    print("="*60)
    print(f"\n💡 If you see fallback data, check:")
    print(f"   1. OpenAI API key is valid")
    print(f"   2. OpenAI account has credits")
    print(f"   3. No rate limits (wait 10 minutes if rate limited)")
    print(f"   4. Check Django server logs for detailed errors")
    
except Exception as e:
    print(f"\n❌ ERROR generating study plan:")
    print(f"   {str(e)}")
    import traceback
    traceback.print_exc()
    print(f"\n💡 Check:")
    print(f"   1. OpenAI API key is valid")
    print(f"   2. OpenAI account has credits")
    print(f"   3. Network connection")
    print(f"   4. Rate limits (wait 10 minutes if rate limited)")

