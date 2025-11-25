"""
Simple test script for the new performance analysis endpoint
Uses Django test client (no external dependencies)
"""
import os
import sys
import django

# Setup Django
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'sevisconnect.settings')
django.setup()

from django.test import Client
from core.models import User, Progress
import json

# Test configuration
TEST_STUDENT_ID = 'SEVIS-001'  # John Doe

def test_performance_analysis():
    """Test the new performance analysis endpoint"""
    print("=" * 60)
    print("TESTING PERFORMANCE ANALYSIS ENDPOINT")
    print("=" * 60)
    
    # Get a test student
    test_id = TEST_STUDENT_ID
    try:
        student = User.objects.get(sevis_pass_id=test_id)
        print(f"\n✅ Found student: {student.name} ({student.sevis_pass_id})")
    except User.DoesNotExist:
        # Try first available student
        student = User.objects.first()
        if student:
            test_id = student.sevis_pass_id
            print(f"\n✅ Using first student: {student.name} ({student.sevis_pass_id})")
        else:
            print(f"\n❌ No students found in database")
            return
    
    # Check progress records
    progress_records = Progress.objects.filter(user=student, subject='math')
    print(f"\n📊 Math Progress Records: {progress_records.count()}")
    
    # Show topic scores
    topics = ['algebra_score', 'geometry_score', 'trigonometry_score', 'calculus_score']
    print("\n📈 Topic Scores:")
    for topic in topics:
        topic_records = progress_records.filter(metric_name=topic)
        if topic_records.exists():
            scores = [r.metric_value for r in topic_records]
            avg = sum(scores) / len(scores)
            print(f"  {topic}: {scores} → Average: {avg:.1f}%")
        else:
            print(f"  {topic}: No data")
    
    # Test the endpoint using Django test client
    print(f"\n🔍 Testing POST /api/analyze/performance/")
    print(f"   Student: {test_id}")
    
    client = Client()
    
    try:
        response = client.post(
            '/api/analyze/performance/',
            data=json.dumps({'sevis_pass_id': test_id}),
            content_type='application/json'
        )
        
        print(f"\n📡 Response Status: {response.status_code}")
        
        if response.status_code == 200:
            data = json.loads(response.content)
            print(f"✅ Status: {data.get('status')}")
            print(f"📝 Message: {data.get('message')}")
            
            if data.get('status') == 'success' and data.get('data'):
                perf_data = data['data']
                
                # Show weakness profile
                if 'weakness_profile' in perf_data:
                    wp = perf_data['weakness_profile']
                    print(f"\n🎯 Weakness Profile:")
                    print(f"   Baseline Score: {wp.get('baseline_score', 0):.1f}%")
                    print(f"   Recommended Difficulty: {wp.get('recommended_difficulty', 'N/A')}")
                    weaknesses = wp.get('weaknesses', {})
                    strengths = wp.get('strengths', {})
                    print(f"   Weaknesses: {list(weaknesses.keys())}")
                    print(f"   Strengths: {list(strengths.keys())}")
                
                # Show performance analysis
                if 'performance_analysis' in perf_data:
                    pa = perf_data['performance_analysis']
                    print(f"\n📊 Performance Analysis:")
                    print(f"   Overall Score: {pa.get('overall_score', 0):.1f}%")
                    print(f"   Weak Topics: {pa.get('weak_topics', [])}")
                    print(f"   Strong Topics: {pa.get('strong_topics', [])}")
                    print(f"   Poor Performing: {'Yes' if pa.get('is_poor_performing', False) else 'No'}")
                    
                    if 'topic_scores' in pa:
                        print(f"\n📈 Detailed Topic Scores:")
                        for topic, scores in pa['topic_scores'].items():
                            print(f"   {topic}:")
                            print(f"      Average: {scores.get('average', 0):.1f}%")
                            print(f"      Records: {scores.get('records_count', 0)}")
                            print(f"      Range: {scores.get('min', 0):.1f}% - {scores.get('max', 0):.1f}%")
                    
                    return True
        else:
            print(f"❌ Error: {response.content.decode()}")
            return False
            
    except Exception as e:
        print(f"\n❌ ERROR: {e}")
        import traceback
        traceback.print_exc()
        return False

def test_study_plan_generation():
    """Test generating a study plan after performance analysis"""
    print("\n" + "=" * 60)
    print("TESTING STUDY PLAN GENERATION")
    print("=" * 60)
    
    client = Client()
    
    try:
        # Get a student
        student = User.objects.first()
        if not student:
            print("❌ No students found")
            return
        
        # First analyze performance
        print(f"\n1️⃣ Analyzing performance for {student.sevis_pass_id}...")
        perf_response = client.post(
            '/api/analyze/performance/',
            data=json.dumps({'sevis_pass_id': student.sevis_pass_id}),
            content_type='application/json'
        )
        
        if perf_response.status_code != 200:
            print(f"❌ Performance analysis failed: {perf_response.content.decode()}")
            return
        
        print("✅ Performance analysis complete")
        
        # Then generate study plan
        print(f"\n2️⃣ Generating study plan...")
        print("   (This may take 30-60 seconds for AI generation...)")
        plan_response = client.post(
            '/api/generate/study-plan/',
            data=json.dumps({'sevis_pass_id': student.sevis_pass_id, 'subject': 'math'}),
            content_type='application/json'
        )
        
        print(f"📡 Response Status: {plan_response.status_code}")
        
        if plan_response.status_code == 200:
            data = json.loads(plan_response.content)
            print(f"✅ Status: {data.get('status')}")
            print(f"📝 Message: {data.get('message')}")
            
            if data.get('status') == 'success' and data.get('data'):
                lp = data['data']
                print(f"\n📚 Learning Path Generated:")
                print(f"   Subject: {lp.get('subject', 'N/A')}")
                print(f"   Status: {lp.get('status', 'N/A')}")
                
                if 'syllabus' in lp and lp['syllabus']:
                    syllabus = lp['syllabus']
                    print(f"\n📖 Syllabus:")
                    print(f"   Title: {syllabus.get('title', 'N/A')}")
                    modules = syllabus.get('modules', [])
                    print(f"   Modules: {len(modules)}")
                    if modules:
                        print(f"   First Module: {modules[0].get('title', 'N/A')}")
                
                if 'week_plan' in lp and lp['week_plan']:
                    weeks = lp['week_plan']
                    print(f"\n📅 Week Plan:")
                    print(f"   Total Weeks: {len(weeks)}")
                    for week_key, week_data in list(weeks.items())[:2]:  # Show first 2 weeks
                        print(f"   {week_key}: {week_data.get('focus', 'N/A')}")
                        if 'topics' in week_data:
                            print(f"      Topics: {', '.join(week_data['topics'][:3])}")
        else:
            print(f"❌ Error: {plan_response.content.decode()}")
            
    except Exception as e:
        print(f"\n❌ ERROR: {e}")
        import traceback
        traceback.print_exc()

if __name__ == '__main__':
    print("\n🚀 Starting Tests...\n")
    
    # Test 1: Performance Analysis
    success = test_performance_analysis()
    
    # Test 2: Study Plan Generation (only if first test passed)
    if success:
        print("\n" + "=" * 60)
        print("Would you like to test study plan generation?")
        print("(This requires OpenAI API key and may take 30-60 seconds)")
        print("=" * 60)
        # Uncomment to test:
        # test_study_plan_generation()
    else:
        print("\n⚠️  Skipping study plan test (performance analysis failed)")
    
    print("\n" + "=" * 60)
    print("✅ Tests Complete!")
    print("=" * 60)
    print("\n💡 To test with the frontend:")
    print("   1. Start Django server: python manage.py runserver")
    print("   2. Start frontend: cd ../frontend && npm run dev")
    print("   3. Login with SEVIS-001 and password: 123456")
    print("   4. Navigate to Study Plan page")
