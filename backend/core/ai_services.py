"""
AI Services for AI Teacher
Handles all OpenAI API interactions according to PRD requirements
All AI logic must live in this file (PRD Section 4)
"""
import json
import os
import re
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
                    timeout=120.0,  # 120 seconds - AI generation can take time
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


def _parse_json_with_recovery(json_text: str, context: str = "json") -> Dict[str, Any]:
    """
    Parse JSON with error recovery for common AI-generated JSON issues.
    Handles single quotes, trailing commas, and other common errors.
    """
    try:
        # First, try standard JSON parsing
        return json.loads(json_text)
    except json.JSONDecodeError as e:
        print(f"⚠️  JSON parse error in {context}: {str(e)}")
        print(f"   Attempting to fix common JSON issues...")
        
        # Try to fix common issues
        fixed_text = json_text
        
        # Fix 1: Replace single quotes with double quotes (but not inside strings)
        # This is a simplified approach - replace single quotes around keys and values
        fixed_text = re.sub(r"'(\w+)':", r'"\1":', fixed_text)  # Fix keys: 'key': -> "key":
        fixed_text = re.sub(r":\s*'([^']*)'", r': "\1"', fixed_text)  # Fix string values: : 'value' -> : "value"
        
        # Fix 2: Remove trailing commas before closing braces/brackets
        fixed_text = re.sub(r',(\s*[}\]])', r'\1', fixed_text)
        
        # Fix 3: Try to extract JSON from markdown code blocks if still wrapped
        if '```' in fixed_text:
            # Extract content between first ```json and last ```
            match = re.search(r'```(?:json)?\s*(.*?)\s*```', fixed_text, re.DOTALL)
            if match:
                fixed_text = match.group(1).strip()
        
        try:
            return json.loads(fixed_text)
        except json.JSONDecodeError as e2:
            print(f"❌ Failed to fix JSON after recovery attempts: {str(e2)}")
            
            # Special handling for unterminated strings
            if "Unterminated string" in str(e2):
                print(f"   Detected unterminated string - attempting to fix...")
                # Try to find and close unterminated strings
                # Look for the error position
                error_match = re.search(r'line (\d+) column (\d+)', str(e2))
                if error_match:
                    line_num = int(error_match.group(1))
                    col_num = int(error_match.group(2))
                    lines = fixed_text.split('\n')
                    if line_num <= len(lines):
                        # Try to close the string on that line
                        problem_line = lines[line_num - 1]
                        # If line doesn't end with quote, try adding one
                        if not problem_line.rstrip().endswith('"') and not problem_line.rstrip().endswith("'"):
                            # Find the last unclosed quote
                            quote_pos = problem_line.rfind('"', 0, col_num)
                            if quote_pos != -1:
                                # Try to close it
                                fixed_line = problem_line[:col_num] + '"' + problem_line[col_num:]
                                lines[line_num - 1] = fixed_line
                                fixed_text = '\n'.join(lines)
                                try:
                                    return json.loads(fixed_text)
                                except:
                                    pass
                
                # Alternative: Try to truncate at a safe point and close JSON
                # Find the last complete JSON structure
                safe_end = fixed_text.rfind('"')
                if safe_end != -1:
                    # Try to find a closing brace/bracket after that
                    remaining = fixed_text[safe_end:]
                    brace_pos = remaining.find('}')
                    bracket_pos = remaining.find(']')
                    if brace_pos != -1 or bracket_pos != -1:
                        end_pos = min(brace_pos, bracket_pos) if brace_pos != -1 and bracket_pos != -1 else (brace_pos if brace_pos != -1 else bracket_pos)
                        truncated = fixed_text[:safe_end + 1] + remaining[:end_pos + 1]
                        # Try to close any open structures
                        open_braces = truncated.count('{') - truncated.count('}')
                        open_brackets = truncated.count('[') - truncated.count(']')
                        truncated += '}' * open_braces + ']' * open_brackets
                        try:
                            return json.loads(truncated)
                        except:
                            pass
            
            print(f"   First 500 chars of problematic JSON:")
            print(f"   {json_text[:500]}")
            
            # Try to extract just the JSON object/array if it's embedded in text
            # Look for first { or [ and last } or ]
            first_brace = fixed_text.find('{')
            first_bracket = fixed_text.find('[')
            
            if first_brace != -1 or first_bracket != -1:
                start_idx = min(first_brace, first_bracket) if first_brace != -1 and first_bracket != -1 else (first_brace if first_brace != -1 else first_bracket)
                last_brace = fixed_text.rfind('}')
                last_bracket = fixed_text.rfind(']')
                end_idx = max(last_brace, last_bracket) if last_brace != -1 and last_bracket != -1 else (last_brace if last_brace != -1 else last_bracket)
                
                if start_idx != -1 and end_idx != -1 and end_idx > start_idx:
                    extracted = fixed_text[start_idx:end_idx + 1]
                    try:
                        return json.loads(extracted)
                    except:
                        pass
            
            # If all else fails, return empty structure
            print(f"⚠️  Returning empty structure for {context}")
            if context == "syllabus":
                return {"title": f"{context} Syllabus (Parse Error)", "overview": "JSON parsing failed", "modules": []}
            else:
                return {"week_plan": {}, "daily_tasks": {}}


def analyze_weaknesses(diagnostic_results: List[Dict], performance_context: Optional[Dict] = None) -> Dict[str, Any]:
    """
    Analyze diagnostic test results to identify student weaknesses.
    PRD: Real-time Weakness Detection
    Enhanced: Factors in academic performance scores to identify poor-performing students
    
    Args:
        diagnostic_results: List of diagnostic answers with questions and correctness
        performance_context: Optional dict with academic performance data (scores, grades, etc.)
        
    Returns:
        Dictionary with weaknesses, strengths, baseline_score, confidence_score, and recommended_difficulty
    """
    client = get_openai_client()
    
    # Prepare context for AI
    wrong_answers = [r for r in diagnostic_results if not r.get('is_correct', False)]
    correct_answers = [r for r in diagnostic_results if r.get('is_correct', False)]
    
    subject = diagnostic_results[0].get('subject', 'math') if diagnostic_results else 'math'
    
    # Calculate baseline from diagnostic if no performance data
    correct_count = len(correct_answers)
    total_count = len(diagnostic_results)
    diagnostic_baseline = (correct_count / total_count * 100) if total_count > 0 else 0.0
    
    if not client:
        # Fallback if OpenAI is not configured
        baseline_score = diagnostic_baseline
        if performance_context and performance_context.get('overall_performance'):
            # Use performance data if available
            baseline_score = performance_context['overall_performance']
        
        return {
            "weaknesses": {},
            "strengths": {},
            "baseline_score": baseline_score,
            "confidence_score": 0.5,
            "recommended_difficulty": "beginner" if baseline_score < 50 else "intermediate" if baseline_score < 75 else "advanced"
        }
    
    # Build performance context string for AI prompt
    performance_info = ""
    if performance_context:
        perf = performance_context
        performance_info = f"""
ACADEMIC PERFORMANCE DATA:
- Grade Level: {perf.get('grade_level', 'N/A')}
- Overall Performance: {perf.get('overall_performance', 'N/A')}%
- Average Quiz Score: {perf.get('avg_quiz_score', 'N/A')}%
- Average Practice Completion: {perf.get('avg_practice_completion', 'N/A')}%
- Average Topic Mastery: {perf.get('avg_topic_mastery', 'N/A')}%
- Average Diagnostic Score: {perf.get('avg_diagnostic_score', 'N/A')}%
- Performance Records: {perf.get('performance_records_count', 0)} records
- Student Status: {'POOR PERFORMING - Needs extra support' if perf.get('is_poor_performing') else 'Performing adequately'}
"""
    
    prompt = f"""You are an expert PNG senior secondary education tutor analyzing a student's diagnostic test results and academic performance.

Subject: {subject}
Grade Level: {performance_context.get('grade_level', 'N/A') if performance_context else 'N/A'}
Total Questions: {len(diagnostic_results)}
Correct: {len(correct_answers)}
Incorrect: {len(wrong_answers)}
Diagnostic Baseline: {diagnostic_baseline:.1f}%
{performance_info}
Wrong Answer Patterns:
{json.dumps(wrong_answers[:10], indent=2)}

IMPORTANT: This student {'IS POOR PERFORMING' if (performance_context and performance_context.get('is_poor_performing')) else 'is performing adequately'} based on their academic scores.

Analyze the student's weaknesses and strengths. For PNG Grade 11-12 curriculum, identify:
- Specific topic weaknesses (e.g., "algebra", "geometry", "reading_comprehension", "grammar")
- Strengths
- Overall baseline score (0-100) - PRIMARY: Use the diagnostic test score ({diagnostic_baseline:.1f}%) as the main baseline. If performance data exists, it can inform the analysis but the baseline_score should primarily reflect the diagnostic test performance. Only adjust if performance data strongly contradicts diagnostic results.
- Recommended difficulty level (beginner/intermediate/advanced) - prioritize beginner for poor performers
- Confidence in your analysis (0-1)

For poor-performing students, focus on foundational topics and create a remedial learning path.

IMPORTANT: The baseline_score should primarily reflect the diagnostic test score ({diagnostic_baseline:.1f}%). Performance data is for context only - use it to understand the student's overall academic standing, but the baseline_score should be close to the diagnostic test result.

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


def generate_study_plan(weakness_profile: Dict, subject: str, grade_level: int, topic_scores: Optional[Dict] = None) -> Dict[str, Any]:
    """
    Generate a comprehensive syllabus and personalized learning path based on weakness profile.
    PRD: Personalized Learning Path
    Enhanced: Generates full syllabus first, then detailed week-by-week plan with learning materials
    
    Args:
        weakness_profile: Dictionary with weaknesses, strengths, and recommended_difficulty
        subject: 'math' or 'english'
        grade_level: 11 or 12
        
    Returns:
        Dictionary with syllabus, week_plan (with learning materials), and daily_tasks
    """
    client = get_openai_client()
    if not client:
        # Fallback if OpenAI is not configured
        return {
            "syllabus": {
                "title": f"Grade {grade_level} {subject.capitalize()} Syllabus",
                "overview": "Comprehensive curriculum outline",
                "modules": []
            },
            "week_plan": {
                "week_1": {
                    "focus": "Foundation review",
                    "topics": ["Basic concepts"],
                    "goals": ["Build confidence", "Review fundamentals"],
                    "learning_materials": []
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
    strengths = weakness_profile.get('strengths', {})
    recommended_difficulty = weakness_profile.get('recommended_difficulty', 'beginner')
    is_poor_performing = recommended_difficulty == 'beginner'
    
    # If topic_scores provided, use them for more specific analysis
    # topic_scores format: {'algebra': 70, 'geometry': 55, 'trigonometry': 55, 'calculus': 60}
    if topic_scores:
        # Identify weak topics from actual scores
        weak_topics = [topic for topic, score in topic_scores.items() if score < 60]
        strong_topics = [topic for topic, score in topic_scores.items() if score >= 60]
    else:
        weak_topics = list(weaknesses.keys())[:5] if weaknesses else []
        strong_topics = list(strengths.keys())[:3] if strengths else []
    
    # Step 1: Generate comprehensive syllabus
    syllabus_prompt = f"""You are an expert PNG senior secondary education tutor. Create a comprehensive, detailed syllabus for Grade {grade_level} {subject} students.

Student Profile:
- Grade Level: {grade_level} (Senior Secondary - ages 16-18)
- Subject: {subject}
- Difficulty Level: {recommended_difficulty}
- Top Weaknesses: {json.dumps(weak_topics, indent=2) if topic_scores else json.dumps(list(weaknesses.keys())[:5], indent=2)}
- Strengths: {json.dumps(strong_topics, indent=2) if topic_scores else json.dumps(list(strengths.keys())[:3], indent=2)}
- Topic Performance Scores: {json.dumps(topic_scores, indent=2) if topic_scores else 'N/A'}
- Performance Status: {'Poor performing - needs comprehensive remedial support with detailed explanations' if is_poor_performing else 'Performing adequately but needs reinforcement'}

IMPORTANT: These are Grade {grade_level} students (16-18 years old). Create content that:
- Is appropriate for their age and cognitive level
- Uses clear, expanded explanations (not oversimplified, but thorough)
- Builds understanding step-by-step with detailed reasoning
- Connects concepts to real-world applications relevant to PNG context
- Provides comprehensive coverage of PNG Grade {grade_level} curriculum requirements

Create a complete syllabus that:
1. Covers ALL essential topics for PNG Grade {grade_level} {subject} curriculum comprehensively
2. Prioritizes addressing identified weaknesses with detailed modules
3. Builds from foundational concepts to advanced topics logically
4. Is structured in logical learning modules/units (6-8 modules)
5. Includes detailed learning objectives for each module
6. Provides clear progression path

Return ONLY valid JSON in this exact format:
{{
    "title": "Grade {grade_level} {subject.capitalize()} Comprehensive Syllabus",
    "overview": "Detailed overview explaining the syllabus structure, goals, and approach for Grade {grade_level} students",
    "duration": "X weeks",
    "total_hours": "X hours",
    "modules": [
        {{
            "module_number": 1,
            "title": "Module Title",
            "description": "Comprehensive module description explaining what students will learn and why it's important",
            "topics": ["topic1", "topic2", "topic3"],
            "learning_objectives": ["Detailed objective 1", "Detailed objective 2"],
            "estimated_time": "X hours",
            "prerequisites": ["What students should know before starting"],
            "outcomes": ["What students will be able to do after completing"]
        }},
        ...
    ]
}}

Make it comprehensive, curriculum-aligned, and appropriate for PNG Grade {grade_level} senior secondary students."""

    # Step 2: Generate detailed week-by-week plan with learning materials
    week_plan_prompt = f"""You are an expert PNG senior secondary education tutor creating a detailed 4-6 week learning plan with comprehensive, expanded learning materials for Grade {grade_level} students.

CRITICAL JSON FORMATTING REQUIREMENTS (MUST FOLLOW EXACTLY):
1. ALL strings MUST use double quotes (") - NEVER single quotes (')
2. ALL quotes inside string values MUST be escaped as \\\"
3. ALL newlines inside string values MUST be escaped as \\n (NOT actual newlines)
4. NO unescaped quotes, newlines, or special characters in string values
5. Ensure ALL JSON structures are properly closed with matching braces and brackets
6. Test your JSON - it MUST be valid, parseable JSON
7. If content is too long, shorten it rather than breaking JSON syntax

Student Profile:
- Grade Level: {grade_level} (Senior Secondary - ages 16-18)
- Subject: {subject}
- Difficulty Level: {recommended_difficulty}
- Top Weaknesses: {json.dumps(weak_topics, indent=2) if topic_scores else json.dumps(list(weaknesses.keys())[:5], indent=2)}
- Strengths: {json.dumps(strong_topics, indent=2) if topic_scores else json.dumps(list(strengths.keys())[:3], indent=2)}
- Topic Performance Scores: {json.dumps(topic_scores, indent=2) if topic_scores else 'N/A'}
- Performance Status: {'Poor performing - needs comprehensive support with expanded explanations' if is_poor_performing else 'Performing adequately but needs reinforcement'}

CRITICAL REQUIREMENTS FOR GRADE {grade_level} STUDENTS:
- Content must be appropriate for 16-18 year olds (not oversimplified, but thoroughly explained)
- Use expanded, detailed explanations that build deep understanding
- Connect concepts to real-world PNG contexts and applications
- Provide step-by-step reasoning, not just answers
- Include comprehensive examples and worked solutions
- Explain the "why" behind concepts, not just the "how"
- Use appropriate academic language for senior secondary level
- Build critical thinking and analytical skills

Create a detailed week-by-week learning plan that:
1. Addresses ALL identified weaknesses systematically with comprehensive coverage
2. Includes EXPANDED learning materials for EACH week:
   - Lecture notes: Detailed, comprehensive explanations (500-800 words each) with:
     * Clear introduction to concepts
     * Step-by-step explanations with reasoning
     * Multiple worked examples with detailed solutions
     * Common mistakes and how to avoid them
     * Real-world applications relevant to PNG context
     * Practice problems with full solutions
   - Videos: Specific video recommendations with:
     * Video URLs (YouTube, Vimeo, or direct links) - MUST include actual video URLs
     * Detailed descriptions of what should be covered
     * Key concepts to explain in depth
     * Examples and demonstrations needed
     * Recommended platforms (Khan Academy, YouTube channels, etc.)
     * IMPORTANT: Provide actual YouTube video URLs (e.g., https://www.youtube.com/watch?v=VIDEO_ID) for relevant educational content
   - Practice exercises: Comprehensive sets with:
     * Multiple difficulty levels
     * Full worked solutions with explanations
     * Step-by-step reasoning shown
     * Common pitfalls highlighted
   - Additional resources: Worksheets, reference sheets, study guides
3. Provides detailed daily tasks with specific learning activities
4. Is structured to help students build deep understanding, not just memorize

Return ONLY valid JSON in this exact format:
{{
    "week_plan": {{
        "week_1": {{
            "week_number": 1,
            "focus": "Week focus/title",
            "topics": ["topic1", "topic2"],
            "goals": ["Detailed goal 1", "Detailed goal 2"],
            "learning_materials": {{
                "lecture_notes": [
                    {{
                        "title": "Comprehensive Note Title",
                        "content": "EXPANDED lecture notes (200-300 words MAX - keep concise for valid JSON) with: detailed introduction, step-by-step explanations with full reasoning, multiple worked examples with complete solutions, explanation of why each step is taken, common mistakes section, real-world PNG applications, and practice problems with full solutions. Make it comprehensive and thorough for Grade {grade_level} understanding. CRITICAL: All quotes must be escaped as \\\" and newlines as \\n. Content must be a single valid JSON string without actual newlines.",
                        "key_concepts": ["concept1 with explanation", "concept2 with explanation"],
                        "examples": [
                            {{
                                "problem": "Example problem statement",
                                "solution": "Complete step-by-step solution with explanations",
                                "explanation": "Why this approach works"
                            }}
                        ],
                        "practice_problems": ["problem1", "problem2"],
                        "common_mistakes": ["mistake1 with correction", "mistake2 with correction"]
                    }},
                    ...
                ],
                "videos": [
                    {{
                        "title": "Video topic",
                        "description": "Detailed description of what this video should comprehensively cover for Grade {grade_level} students",
                        "video_url": "YouTube URL or embed URL (e.g., https://www.youtube.com/watch?v=VIDEO_ID or https://www.youtube.com/embed/VIDEO_ID)",
                        "key_points": ["Expanded point 1 with explanation", "Expanded point 2 with explanation"],
                        "duration": "X minutes",
                        "recommended_resources": ["Specific YouTube channels", "Khan Academy specific topics", "Other educational platforms"],
                        "what_to_focus_on": "What students should pay attention to and take notes on"
                    }},
                    ...
                ],
                "practice_exercises": [
                    {{
                        "title": "Exercise title",
                        "description": "What students will practice and why it's important",
                        "difficulty_level": "beginner/intermediate/advanced",
                        "questions": [
                            {{
                                "question": "Question statement",
                                "hints": ["hint1", "hint2"],
                                "solution": "Complete step-by-step solution with full explanations",
                                "explanation": "Why this answer is correct and how to approach similar problems"
                            }}
                        ]
                    }},
                    ...
                ],
                "additional_resources": [
                    {{
                        "type": "worksheet/reference/study_guide",
                        "title": "Resource title",
                        "description": "What this resource provides and how to use it"
                    }}
                ]
            }}
        }},
        "week_2": {{...}},
        ...
    }},
    "daily_tasks": {{
        "day_1": {{
            "lesson": "Lesson title",
            "activities": ["Detailed activity 1", "Detailed activity 2"],
            "materials_to_use": ["lecture note 1", "video 1"],
            "practice": ["exercise1", "exercise2"],
            "estimated_time": "X minutes",
            "learning_objectives": ["What students will learn today"]
        }},
        ...
    }}
}}

Make it comprehensive, detailed, and appropriate for Grade {grade_level} senior secondary students. Expand on all explanations - students need to understand the reasoning, not just memorize steps."""

    try:
        # First, generate the syllabus
        print(f"\n🤖 Generating syllabus for Grade {grade_level} {subject}...")
        print(f"   Weak topics: {weak_topics}")
        print(f"   Strong topics: {strong_topics}")
        
        try:
            # Try using JSON mode for structured output
            syllabus_response = client.chat.completions.create(
                model="gpt-4o",
                messages=[
                    {"role": "system", "content": "You are an expert PNG Grade 11-12 education tutor. You MUST respond with valid JSON only. Provide comprehensive, expanded content appropriate for senior secondary students."},
                    {"role": "user", "content": syllabus_prompt}
                ],
                temperature=0.3,  # Lower temperature for more consistent JSON
                max_tokens=3000,
                response_format={"type": "json_object"}  # Force JSON mode
            )
        except Exception as json_mode_error:
            # Fallback if JSON mode not supported
            print(f"⚠️  JSON mode not available for syllabus, using standard mode: {str(json_mode_error)}")
            syllabus_response = client.chat.completions.create(
                model="gpt-4o",
                messages=[
                    {"role": "system", "content": "You are an expert PNG Grade 11-12 education tutor. Always respond with valid JSON only. Provide comprehensive, expanded content appropriate for senior secondary students."},
                    {"role": "user", "content": syllabus_prompt}
                ],
                temperature=0.3,
                max_tokens=3000
            )
        
        syllabus_text = syllabus_response.choices[0].message.content.strip()
        if syllabus_text.startswith("```"):
            syllabus_text = syllabus_text.split("```")[1]
            if syllabus_text.startswith("json"):
                syllabus_text = syllabus_text[4:]
            syllabus_text = syllabus_text.strip()
        
        syllabus_data = _parse_json_with_recovery(syllabus_text, "syllabus")
        print(f"✅ Syllabus parsed successfully: {len(syllabus_data.get('modules', []))} modules")
        
        # Then, generate the detailed week-by-week plan with learning materials
        print(f"🤖 Generating week-by-week plan with learning materials...")
        try:
            # Try using JSON mode for structured output
            week_plan_response = client.chat.completions.create(
                model="gpt-4o",
                messages=[
                    {"role": "system", "content": "You are an expert PNG Grade 11-12 education tutor. You MUST respond with valid JSON only. Keep lecture note content to 200-300 words maximum. Provide comprehensive, expanded explanations appropriate for senior secondary students (16-18 years old). Include detailed lecture notes, video recommendations, and practice exercises."},
                    {"role": "user", "content": week_plan_prompt}
                ],
                temperature=0.3,  # Lower temperature for more consistent JSON
                max_tokens=8000,  # Increased to ensure complete response
                response_format={"type": "json_object"}  # Force JSON mode
            )
        except Exception as json_mode_error:
            # Fallback if JSON mode not supported
            print(f"⚠️  JSON mode not available for week plan, using standard mode: {str(json_mode_error)}")
            week_plan_response = client.chat.completions.create(
                model="gpt-4o",
                messages=[
                    {"role": "system", "content": "You are an expert PNG Grade 11-12 education tutor. CRITICAL: You MUST respond with valid, complete JSON only. All strings must be properly escaped. Use \\n for newlines, \\\" for quotes. Keep lecture note content to 200-300 words maximum. Ensure all JSON is properly closed. Provide comprehensive, expanded explanations appropriate for senior secondary students (16-18 years old). Include detailed lecture notes, video recommendations, and practice exercises."},
                    {"role": "user", "content": week_plan_prompt}
                ],
                temperature=0.3,
                max_tokens=8000
            )
        
        print(f"✅ Week plan generated successfully")
        
        week_plan_text = week_plan_response.choices[0].message.content.strip()
        if week_plan_text.startswith("```"):
            week_plan_text = week_plan_text.split("```")[1]
            if week_plan_text.startswith("json"):
                week_plan_text = week_plan_text[4:]
            week_plan_text = week_plan_text.strip()
        
        # Try to parse JSON with error recovery
        week_plan_data = _parse_json_with_recovery(week_plan_text, "week_plan")
        print(f"✅ Week plan parsed successfully: {len(week_plan_data.get('week_plan', {}))} weeks")
        
        # Combine syllabus and week plan
        result = {
            "syllabus": syllabus_data,
            "week_plan": week_plan_data.get("week_plan", {}),
            "daily_tasks": week_plan_data.get("daily_tasks", {})
        }
        
        # Verify result structure
        print(f"\n{'='*60}")
        print(f"✅ Study plan generation complete!")
        print(f"{'='*60}")
        print(f"Syllabus: {len(syllabus_data.get('modules', []))} modules")
        print(f"Week Plan: {len(week_plan_data.get('week_plan', {}))} weeks")
        print(f"Daily Tasks: {len(week_plan_data.get('daily_tasks', {}))} days")
        
        # Check if learning materials exist
        if week_plan_data.get('week_plan'):
            first_week = list(week_plan_data['week_plan'].values())[0] if week_plan_data['week_plan'] else {}
            learning_materials = first_week.get('learning_materials', {})
            if learning_materials:
                print(f"Learning Materials in Week 1:")
                print(f"  - Lecture Notes: {len(learning_materials.get('lecture_notes', []))}")
                print(f"  - Videos: {len(learning_materials.get('videos', []))}")
                print(f"  - Practice Exercises: {len(learning_materials.get('practice_exercises', []))}")
            else:
                print(f"⚠️  WARNING: No learning_materials in week plan!")
        print(f"{'='*60}\n")
        
        return result
        
    except Exception as e:
        # Log the error for debugging
        import traceback
        error_details = traceback.format_exc()
        error_str = str(e).lower()
        
        print(f"\n{'='*60}")
        print(f"❌ ERROR in generate_study_plan: {str(e)}")
        print(f"{'='*60}")
        
        # Check for specific error types
        if 'rate limit' in error_str or '429' in error_str:
            print("⚠️  RATE LIMIT ERROR: OpenAI API rate limit exceeded")
            print("   Solution: Wait 10 minutes or upgrade your OpenAI plan")
        elif 'insufficient' in error_str or 'credit' in error_str or 'balance' in error_str or 'payment' in error_str:
            print("⚠️  INSUFFICIENT CREDITS: OpenAI account has no credits")
            print("   Solution: Add credits to your OpenAI account at https://platform.openai.com/account/billing")
        elif 'invalid' in error_str and 'api key' in error_str:
            print("⚠️  INVALID API KEY: OpenAI API key is invalid")
            print("   Solution: Check your OPENAI_API_KEY in .env file")
        else:
            print(f"Full traceback:\n{error_details}")
        
        print(f"{'='*60}\n")
        
        # Fallback learning path
        return {
            "syllabus": {
                "title": f"Grade {grade_level} {subject.capitalize()} Syllabus (Fallback)",
                "overview": "Comprehensive curriculum outline (Fallback - AI generation failed)",
                "modules": []
            },
            "week_plan": {
                "week_1": {
                    "focus": "Foundation review (Fallback)",
                    "topics": ["Basic concepts"],
                    "goals": ["Build confidence", "Review fundamentals"],
                    "learning_materials": []
                }
            },
            "daily_tasks": {
                "day_1": {
                    "lesson": "Introduction to key concepts (Fallback)",
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

