"""
AI Services for SevisConnectED
Handles all OpenAI API interactions according to PRD requirements
All AI logic must live in this file (PRD Section 4)
"""
import json
import os
from typing import Dict, List, Any, Optional
from django.conf import settings

# Lazy initialization of OpenAI client
_client = None

def get_openai_client():
    """Get or create OpenAI client instance"""
    global _client
    if _client is None and settings.OPENAI_API_KEY:
        try:
            from openai import OpenAI
            import httpx
            import os
            
            # Strip whitespace and remove quotes if present
            api_key = settings.OPENAI_API_KEY.strip().strip('"').strip("'")
            if api_key and api_key != 'your-openai-api-key-here':
                # Create httpx client without proxy settings to avoid compatibility issues
                http_client = httpx.Client(
                    timeout=60.0,
                    # Explicitly don't pass proxies to avoid the error
                )
                
                # Initialize OpenAI client with explicit http_client
                _client = OpenAI(
                    api_key=api_key,
                    http_client=http_client,
                )
            else:
                _client = None
        except Exception as e:
            print(f"Error creating OpenAI client: {e}")
            import traceback
            traceback.print_exc()
            _client = None
    return _client


def analyze_weaknesses(diagnostic_results: List[Dict]) -> Dict[str, Any]:
    """
    Analyze diagnostic test results to identify student weaknesses.
    PRD: Real-time Weakness Detection
    
    Args:
        diagnostic_results: List of diagnostic answers with questions and correctness
        
    Returns:
        Dictionary with weaknesses, strengths, baseline_score, confidence_score, and recommended_difficulty
    """
    client = get_openai_client()
    if not client:
        # Fallback if OpenAI is not configured
        correct_count = sum(1 for r in diagnostic_results if r.get('is_correct', False))
        total_count = len(diagnostic_results)
        baseline_score = (correct_count / total_count * 100) if total_count > 0 else 0.0
        
        return {
            "weaknesses": {},
            "strengths": {},
            "baseline_score": baseline_score,
            "confidence_score": 0.5,
            "recommended_difficulty": "beginner" if baseline_score < 50 else "intermediate" if baseline_score < 75 else "advanced"
        }
    
    # Prepare context for AI
    wrong_answers = [r for r in diagnostic_results if not r.get('is_correct', False)]
    correct_answers = [r for r in diagnostic_results if r.get('is_correct', False)]
    
    subject = diagnostic_results[0].get('subject', 'math') if diagnostic_results else 'math'
    
    prompt = f"""You are an expert PNG senior secondary education tutor analyzing a student's diagnostic test results.

Subject: {subject}
Total Questions: {len(diagnostic_results)}
Correct: {len(correct_answers)}
Incorrect: {len(wrong_answers)}

Wrong Answer Patterns:
{json.dumps(wrong_answers[:10], indent=2)}

Analyze the student's weaknesses and strengths. For PNG Grade 11-12 curriculum, identify:
- Specific topic weaknesses (e.g., "algebra", "geometry", "reading_comprehension", "grammar")
- Strengths
- Overall baseline score (0-100)
- Recommended difficulty level (beginner/intermediate/advanced)
- Confidence in your analysis (0-1)

Return ONLY valid JSON in this exact format:
{{
    "weaknesses": {{"topic_name": weakness_score_0_to_1}},
    "strengths": {{"topic_name": strength_score_0_to_1}},
    "baseline_score": 0.0,
    "confidence_score": 0.0,
    "recommended_difficulty": "beginner"
}}

Use PNG-appropriate terminology and focus on Grade 11-12 curriculum."""

    try:
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": "You are an expert PNG education tutor. Always respond with valid JSON only."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.3,
            max_tokens=1000
        )
        
        result_text = response.choices[0].message.content.strip()
        # Remove markdown code blocks if present
        if result_text.startswith("```"):
            result_text = result_text.split("```")[1]
            if result_text.startswith("json"):
                result_text = result_text[4:]
            result_text = result_text.strip()
        
        result = json.loads(result_text)
        return result
        
    except Exception as e:
        # Fallback if AI fails
        correct_count = sum(1 for r in diagnostic_results if r.get('is_correct', False))
        total_count = len(diagnostic_results)
        baseline_score = (correct_count / total_count * 100) if total_count > 0 else 0.0
        
        return {
            "weaknesses": {},
            "strengths": {},
            "baseline_score": baseline_score,
            "confidence_score": 0.5,
            "recommended_difficulty": "beginner" if baseline_score < 50 else "intermediate" if baseline_score < 75 else "advanced"
        }


def generate_study_plan(weakness_profile: Dict, subject: str, grade_level: int) -> Dict[str, Any]:
    """
    Generate a personalized learning path based on weakness profile.
    PRD: Personalized Learning Path
    
    Args:
        weakness_profile: Dictionary with weaknesses, strengths, and recommended_difficulty
        subject: 'math' or 'english'
        grade_level: 11 or 12
        
    Returns:
        Dictionary with week_plan and daily_tasks
    """
    client = get_openai_client()
    if not client:
        # Fallback if OpenAI is not configured
        return {
            "week_plan": {
                "week_1": {
                    "focus": "Foundation review",
                    "topics": ["Basic concepts"],
                    "goals": ["Build confidence", "Review fundamentals"]
                }
            },
            "daily_tasks": {
                "day_1": {
                    "lesson": "Introduction to key concepts",
                    "practice": ["Practice exercise 1"],
                    "estimated_time": "30 minutes"
                }
            }
        }
    
    weaknesses = weakness_profile.get('weaknesses', {})
    recommended_difficulty = weakness_profile.get('recommended_difficulty', 'beginner')
    
    prompt = f"""You are an expert PNG senior secondary education tutor creating a personalized 3-week learning plan.

Student Profile:
- Grade Level: {grade_level}
- Subject: {subject}
- Difficulty Level: {recommended_difficulty}
- Top Weaknesses: {json.dumps(list(weaknesses.keys())[:5], indent=2)}

Create a structured 3-week learning plan with:
1. Week-by-week outline focusing on addressing weaknesses
2. Daily micro-lessons and practice tasks
3. PNG curriculum-aligned content
4. Simple, clear explanations appropriate for struggling students

Return ONLY valid JSON in this exact format:
{{
    "week_plan": {{
        "week_1": {{
            "focus": "description",
            "topics": ["topic1", "topic2"],
            "goals": ["goal1", "goal2"]
        }},
        "week_2": {{...}},
        "week_3": {{...}}
    }},
    "daily_tasks": {{
        "day_1": {{
            "lesson": "lesson title",
            "practice": ["task1", "task2"],
            "estimated_time": "30 minutes"
        }},
        "day_2": {{...}},
        ...
    }}
}}

Make it practical, achievable, and tailored to PNG Grade {grade_level} {subject} curriculum."""

    try:
        response = client.chat.completions.create(
            model="gpt-4o",
            messages=[
                {"role": "system", "content": "You are an expert PNG education tutor. Always respond with valid JSON only."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.5,
            max_tokens=2000
        )
        
        result_text = response.choices[0].message.content.strip()
        # Remove markdown code blocks if present
        if result_text.startswith("```"):
            result_text = result_text.split("```")[1]
            if result_text.startswith("json"):
                result_text = result_text[4:]
            result_text = result_text.strip()
        
        result = json.loads(result_text)
        return result
        
    except Exception as e:
        # Fallback learning path
        return {
            "week_plan": {
                "week_1": {
                    "focus": "Foundation review",
                    "topics": ["Basic concepts"],
                    "goals": ["Build confidence", "Review fundamentals"]
                }
            },
            "daily_tasks": {
                "day_1": {
                    "lesson": "Introduction to key concepts",
                    "practice": ["Practice exercise 1"],
                    "estimated_time": "30 minutes"
                }
            }
        }


def tutor_chat(user_message: str, chat_history: List[Dict], context: Dict = None) -> str:
    """
    Generate AI tutor response for chat interface.
    PRD: AI Teacher Interface
    
    Args:
        user_message: Student's question/message
        chat_history: Previous messages in conversation
        context: Additional context (subject, grade level, weaknesses, etc.)
        
    Returns:
        AI tutor's response text
    """
    client = get_openai_client()
    if not client:
        return "I apologize, but the AI tutor service is not currently available. Please try again later."
    
    subject = context.get('subject', 'math') if context else 'math'
    grade_level = context.get('grade_level', 11) if context else 11
    weaknesses = context.get('weaknesses', {}) if context else {}
    
    system_prompt = f"""You are a friendly, patient, and encouraging PNG senior secondary education tutor.

Your role:
- Explain concepts in simple, clear language appropriate for Grade {grade_level} students
- Use PNG-relevant examples and contexts
- Break down complex topics into easy steps
- Encourage students and build their confidence
- Adapt explanations to their learning level

Subject: {subject}
Student's known weaknesses: {json.dumps(list(weaknesses.keys())[:3], indent=2) if weaknesses else "None identified yet"}

Always be supportive, clear, and use simple language. If asked about homework or a problem, provide step-by-step explanations."""

    messages = [{"role": "system", "content": system_prompt}]
    
    # Add chat history (last 10 messages to avoid token limits)
    for msg in chat_history[-10:]:
        messages.append(msg)
    
    # Add current user message
    messages.append({"role": "user", "content": user_message})
    
    try:
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=messages,
            temperature=0.7,
            max_tokens=500
        )
        
        return response.choices[0].message.content.strip()
        
    except Exception as e:
        return "I apologize, but I'm having trouble responding right now. Please try again in a moment."


def generate_quiz(topic: str, subject: str, difficulty: str, num_questions: int = 5) -> List[Dict]:
    """
    Generate a practice quiz for a specific topic.
    Optional feature for future use.
    
    Args:
        topic: Topic name (e.g., "algebra", "reading_comprehension")
        subject: 'math' or 'english'
        difficulty: 'beginner', 'intermediate', or 'advanced'
        num_questions: Number of questions to generate
        
    Returns:
        List of quiz questions with answers
    """
    client = get_openai_client()
    if not client:
        return []
    
    prompt = f"""Generate {num_questions} practice quiz questions for PNG Grade 11-12 students.

Topic: {topic}
Subject: {subject}
Difficulty: {difficulty}

Return ONLY valid JSON in this exact format:
{{
    "questions": [
        {{
            "question": "question text",
            "options": ["option1", "option2", "option3", "option4"],
            "correct_answer": "option1",
            "explanation": "brief explanation"
        }},
        ...
    ]
}}

Make questions appropriate for PNG curriculum and {difficulty} level students."""

    try:
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": "You are an expert PNG education tutor. Always respond with valid JSON only."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.6,
            max_tokens=1500
        )
        
        result_text = response.choices[0].message.content.strip()
        # Remove markdown code blocks if present
        if result_text.startswith("```"):
            result_text = result_text.split("```")[1]
            if result_text.startswith("json"):
                result_text = result_text[4:]
            result_text = result_text.strip()
        
        result = json.loads(result_text)
        return result.get('questions', [])
        
    except Exception as e:
        return []

