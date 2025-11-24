"""
Quick test script to verify API endpoints are working
Run: python test_endpoints.py
"""
import os
import sys
import django

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'sevisconnect.settings')
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
django.setup()

from django.test import Client
import json

client = Client()

print("=" * 60)
print("TESTING API ENDPOINTS")
print("=" * 60)

# Test 1: Login
print("\n1. Testing POST /api/auth/login/")
response = client.post(
    '/api/auth/login/',
    data=json.dumps({
        'sevis_pass_id': 'test-api-123',
        'name': 'API Test User',
        'grade_level': 11,
        'school': 'Test School'
    }),
    content_type='application/json'
)
print(f"   Status: {response.status_code}")
if response.status_code == 201:
    data = json.loads(response.content)
    print(f"   ✓ Login successful")
    print(f"   User ID: {data['data']['id']}")
    user_id = data['data']['id']
else:
    print(f"   ✗ Failed: {response.content}")
    sys.exit(1)

# Test 2: Get Student Profile
print("\n2. Testing POST /api/student/profile/")
response = client.post(
    '/api/student/profile/',
    data=json.dumps({
        'sevis_pass_id': 'test-api-123'
    }),
    content_type='application/json'
)
print(f"   Status: {response.status_code}")
if response.status_code == 200:
    print(f"   ✓ Profile retrieved")
else:
    print(f"   ✗ Failed: {response.content}")

# Test 3: Submit Diagnostic
print("\n3. Testing POST /api/diagnostic/submit/")
response = client.post(
    '/api/diagnostic/submit/',
    data=json.dumps({
        'sevis_pass_id': 'test-api-123',
        'answers': [
            {
                'subject': 'math',
                'question': 'What is 2+2?',
                'student_answer': '4',
                'correct_answer': '4',
                'is_correct': True,
                'score': 1.0,
                'time_taken_seconds': 5
            },
            {
                'subject': 'math',
                'question': 'What is 3*3?',
                'student_answer': '9',
                'correct_answer': '9',
                'is_correct': True,
                'score': 1.0,
                'time_taken_seconds': 3
            }
        ]
    }),
    content_type='application/json'
)
print(f"   Status: {response.status_code}")
if response.status_code == 201:
    data = json.loads(response.content)
    print(f"   ✓ Diagnostic submitted: {data['data']['count']} answers")
else:
    print(f"   ✗ Failed: {response.content}")

# Test 4: Analyze Weaknesses
print("\n4. Testing POST /api/analyze/weaknesses/")
response = client.post(
    '/api/analyze/weaknesses/',
    data=json.dumps({
        'sevis_pass_id': 'test-api-123',
        'subject': 'math'
    }),
    content_type='application/json'
)
print(f"   Status: {response.status_code}")
if response.status_code == 200:
    data = json.loads(response.content)
    print(f"   ✓ Weakness analysis completed")
    print(f"   Baseline Score: {data['data']['baseline_score']}%")
else:
    print(f"   ✗ Failed: {response.content}")

# Test 5: Generate Study Plan
print("\n5. Testing POST /api/generate/study-plan/")
response = client.post(
    '/api/generate/study-plan/',
    data=json.dumps({
        'sevis_pass_id': 'test-api-123',
        'subject': 'math'
    }),
    content_type='application/json'
)
print(f"   Status: {response.status_code}")
if response.status_code == 200:
    data = json.loads(response.content)
    print(f"   ✓ Study plan generated")
    print(f"   Status: {data['data']['status']}")
else:
    print(f"   ✗ Failed: {response.content}")

# Test 6: Tutor Chat
print("\n6. Testing POST /api/tutor/chat/")
response = client.post(
    '/api/tutor/chat/',
    data=json.dumps({
        'sevis_pass_id': 'test-api-123',
        'message': 'What is algebra?',
        'subject': 'math'
    }),
    content_type='application/json'
)
print(f"   Status: {response.status_code}")
if response.status_code == 200:
    data = json.loads(response.content)
    print(f"   ✓ Chat response received")
    print(f"   Response: {data['data']['response'][:50]}...")
else:
    print(f"   ✗ Failed: {response.content}")

# Test 7: Get Progress
print("\n7. Testing GET /api/progress/")
response = client.get(
    '/api/progress/',
    {'sevis_pass_id': 'test-api-123'}
)
print(f"   Status: {response.status_code}")
if response.status_code == 200:
    data = json.loads(response.content)
    print(f"   ✓ Progress retrieved: {len(data['data'])} records")
else:
    print(f"   ✗ Failed: {response.content}")

# Test 8: Teacher Students
print("\n8. Testing GET /api/teacher/students/")
response = client.get('/api/teacher/students/')
print(f"   Status: {response.status_code}")
if response.status_code == 200:
    data = json.loads(response.content)
    print(f"   ✓ Students retrieved: {len(data['data'])} students")
else:
    print(f"   ✗ Failed: {response.content}")

# Cleanup
print("\n" + "=" * 60)
print("CLEANUP: Removing test data")
print("=" * 60)
from core.models import User
User.objects.filter(sevis_pass_id='test-api-123').delete()
print("✓ Test data cleaned up")

print("\n" + "=" * 60)
print("ALL ENDPOINT TESTS COMPLETED!")
print("=" * 60)


