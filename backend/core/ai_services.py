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


def _validate_and_clean_video_url(url: str) -> Optional[str]:
    """
    Validate and clean YouTube video URLs.
    Returns None if URL is invalid, otherwise returns cleaned URL.
    """
    if not url or not isinstance(url, str):
        return None
    
    url = url.strip()
    
    # Check if it's a YouTube URL
    if 'youtube.com' in url or 'youtu.be' in url:
        # Extract video ID using various patterns
        patterns = [
            r'(?:youtube\.com/watch\?v=|youtu\.be/|youtube\.com/embed/)([a-zA-Z0-9_-]{11})',
            r'youtube\.com/v/([a-zA-Z0-9_-]{11})',
            r'm\.youtube\.com/watch\?v=([a-zA-Z0-9_-]{11})',
        ]
        
        for pattern in patterns:
            match = re.search(pattern, url)
            if match and match.group(1):
                video_id = match.group(1)
                # YouTube video IDs are always 11 characters
                if len(video_id) == 11:
                    return f"https://www.youtube.com/watch?v={video_id}"
        
        # If it looks like YouTube but we can't extract ID, return None
        return None
    
    # Check if it's a Vimeo URL
    if 'vimeo.com' in url:
        match = re.search(r'vimeo\.com/(\d+)', url)
        if match:
            return f"https://vimeo.com/{match.group(1)}"
        return None
    
    # Check if it's a direct video file
    if re.match(r'https?://.*\.(mp4|webm|ogg|mov)(\?.*)?$', url, re.IGNORECASE):
        return url
    
    # If it doesn't match any known format, return None
    return None


def _clean_video_urls_in_study_plan(study_plan: Dict[str, Any]) -> Dict[str, Any]:
    """
    Recursively clean and validate video URLs in the study plan structure.
    Removes invalid URLs and fixes valid ones.
    """
    if isinstance(study_plan, dict):
        cleaned = {}
        for key, value in study_plan.items():
            if key == 'video_url' and isinstance(value, str):
                # Validate and clean video URL
                cleaned_url = _validate_and_clean_video_url(value)
                if cleaned_url:
                    cleaned[key] = cleaned_url
                # If invalid, don't include it (will show as "no video URL" in frontend)
            elif key == 'videos' and isinstance(value, list):
                # Clean video URLs in videos array
                cleaned_videos = []
                for video in value:
                    if isinstance(video, dict) and 'video_url' in video:
                        cleaned_video = video.copy()
                        cleaned_url = _validate_and_clean_video_url(video.get('video_url', ''))
                        if cleaned_url:
                            cleaned_video['video_url'] = cleaned_url
                        else:
                            # Remove invalid video_url but keep the video entry
                            cleaned_video.pop('video_url', None)
                        cleaned_videos.append(cleaned_video)
                    else:
                        cleaned_videos.append(_clean_video_urls_in_study_plan(video) if isinstance(video, dict) else video)
                cleaned[key] = cleaned_videos
            else:
                # Recursively clean nested structures
                cleaned[key] = _clean_video_urls_in_study_plan(value) if isinstance(value, (dict, list)) else value
        return cleaned
    elif isinstance(study_plan, list):
        return [_clean_video_urls_in_study_plan(item) for item in study_plan]
    else:
        return study_plan


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
        # Identify ALL weak topics from actual scores (below 60%)
        # Sort by score (lowest first) to prioritize the weakest topics
        weak_topics_with_scores = [(topic, score) for topic, score in topic_scores.items() if score < 60]
        weak_topics_with_scores.sort(key=lambda x: x[1])  # Sort by score, lowest first
        weak_topics = [topic for topic, score in weak_topics_with_scores]  # ALL weak topics
        strong_topics = [topic for topic, score in topic_scores.items() if score >= 60]
        
        # Calculate number of weeks needed: 1-2 weeks per weak topic, minimum 4 weeks
        num_weak_topics = len(weak_topics)
        num_weeks = max(4, min(12, num_weak_topics * 2))  # 4-12 weeks, 2 weeks per topic max
    else:
        # Use all weaknesses, not just first 5
        weak_topics = list(weaknesses.keys()) if weaknesses else []
        strong_topics = list(strengths.keys()) if strengths else []
        
        # Calculate weeks based on number of weak topics
        num_weak_topics = len(weak_topics)
        num_weeks = max(4, min(12, num_weak_topics * 2))  # 4-12 weeks, 2 weeks per topic max
    
    # Prepare weak topics list for prompts
    weak_topics_list = json.dumps(weak_topics, indent=2) if weak_topics else "[]"
    weak_topics_count = len(weak_topics)
    
    # Step 1: Generate comprehensive syllabus
    syllabus_prompt = f"""You are an expert PNG senior secondary education tutor. Create a comprehensive, detailed syllabus for Grade {grade_level} {subject} students.

Student Profile:
- Grade Level: {grade_level} (Senior Secondary - ages 16-18)
- Subject: {subject}
- Difficulty Level: {recommended_difficulty}
- ALL Weak Topics ({weak_topics_count} topics below 60%): {weak_topics_list}
- Strong Topics: {json.dumps(strong_topics, indent=2) if strong_topics else '[]'}
- Topic Performance Scores: {json.dumps(topic_scores, indent=2) if topic_scores else 'N/A'}
- Performance Status: {'Poor performing - needs comprehensive remedial support with detailed explanations' if is_poor_performing else 'Performing adequately but needs reinforcement'}

MANDATORY COVERAGE REQUIREMENT:
You MUST create a {num_weeks}-week plan that covers ALL {weak_topics_count} weak topics listed above. Each weak topic must receive dedicated coverage with:
- At least 1-2 weeks of focused learning
- Comprehensive lecture notes, videos, and practice exercises
- Clear progression from basics to mastery
- Assessment and reinforcement activities

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
    # CRITICAL: Must cover ALL weak topics comprehensively
    week_plan_prompt = f"""You are an expert PNG senior secondary education tutor creating a detailed {num_weeks}-week comprehensive learning plan with expanded learning materials for Grade {grade_level} students.

CRITICAL REQUIREMENT: You MUST create a learning plan that covers ALL {weak_topics_count} weak topics comprehensively. Each weak topic must have dedicated week(s) with thorough coverage.

ALL WEAK TOPICS THAT MUST BE COVERED (below 60% performance):
{weak_topics_list}

The learning plan must:
1. Cover EVERY single weak topic listed above - no exceptions
2. Allocate sufficient time (1-2 weeks) for each weak topic to ensure mastery
3. Total {num_weeks} weeks of structured learning
4. Progress from foundational concepts to advanced applications
5. Include review and reinforcement weeks

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

Create a detailed {num_weeks}-week learning plan that:
1. MANDATORY: Addresses EVERY SINGLE weak topic from the list above - ensure ALL {weak_topics_count} weak topics are covered
2. Allocates 1-2 weeks per weak topic to ensure thorough understanding and mastery
3. Includes EXPANDED learning materials for EACH week:
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

Return ONLY valid JSON in this exact format with {num_weeks} weeks (week_1 through week_{num_weeks}):
{{
    "week_plan": {{
        "week_1": {{
            "week_number": 1,
            "focus": "Week focus/title (must address one or more weak topics)",
            "topics": ["weak_topic_1", "related_concepts"],
            "weak_topics_covered": ["weak_topic_1"],  // List which weak topics this week addresses
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
                        "video_url": "MUST be a valid YouTube URL in one of these formats: https://www.youtube.com/watch?v=VIDEO_ID or https://youtu.be/VIDEO_ID. VIDEO_ID must be exactly 11 characters (alphanumeric). DO NOT use placeholder URLs, playback IDs, or invalid formats. Use real educational YouTube video URLs for the topic.",
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
        
        # Clean and validate video URLs in the study plan
        result = _clean_video_urls_in_study_plan(result)
        print(f"✅ Video URLs validated and cleaned")
        
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
    Enhanced: Now context-aware of study plan content
    
    Args:
        user_message: Student's question/message
        chat_history: Previous messages in conversation
        context: Additional context (subject, grade level, weaknesses, study_plan, etc.)
        
    Returns:
        AI tutor's response text
    """
    client = get_openai_client()
    if not client:
        return "I apologize, but the AI tutor service is not currently available. Please try again later."
    
    subject = context.get('subject', 'math') if context else 'math'
    grade_level = context.get('grade_level', 11) if context else 11
    weaknesses = context.get('weaknesses', {}) if context else {}
    study_plan = context.get('study_plan', {}) if context else {}
    
    # Build study plan context string if available
    study_plan_context = ""
    if study_plan:
        syllabus = study_plan.get('syllabus', {})
        week_plan = study_plan.get('week_plan', {})
        
        study_plan_context = "\n\nSTUDY PLAN CONTEXT (You can reference this when answering questions):\n"
        
        if syllabus:
            study_plan_context += f"Syllabus: {syllabus.get('title', 'N/A')}\n"
            study_plan_context += f"Overview: {syllabus.get('overview', 'N/A')}\n"
            modules = syllabus.get('modules', [])
            if modules:
                study_plan_context += f"Modules ({len(modules)} total):\n"
                for i, module in enumerate(modules[:10], 1):  # Limit to first 10 modules
                    study_plan_context += f"  Module {module.get('module_number', i)}: {module.get('title', 'N/A')}\n"
                    study_plan_context += f"    Description: {module.get('description', 'N/A')[:200]}...\n"
                    study_plan_context += f"    Topics: {', '.join(module.get('topics', []))}\n"
        
        if week_plan:
            study_plan_context += f"\nWeek-by-Week Plan ({len(week_plan)} weeks):\n"
            for week_key, week_data in list(week_plan.items())[:6]:  # Limit to first 6 weeks
                week_num = week_data.get('week_number', week_key)
                study_plan_context += f"  Week {week_num}: {week_data.get('focus', 'N/A')}\n"
                study_plan_context += f"    Topics: {', '.join(week_data.get('topics', []))}\n"
                study_plan_context += f"    Goals: {', '.join(week_data.get('goals', [])[:3])}\n"
        
        study_plan_context += "\nIMPORTANT: When students ask about their study plan (e.g., 'What does Module 1 mean?', 'Explain Week 2', 'What should I focus on?'), reference the specific modules, weeks, topics, and goals from their study plan above. Be specific and helpful."
    
    system_prompt = f"""You are a friendly, patient, and encouraging PNG senior secondary education tutor.
    
    Your role:
    - Explain concepts in simple, clear language appropriate for Grade {grade_level} students
    - Use PNG-relevant examples and contexts
    - Break down complex topics into easy steps
    - Encourage students and build their confidence
    - Adapt explanations to their learning level
    - When students ask you to "explain in simple terms" or "explain simply", use very basic language, analogies, and step-by-step breakdowns
    
    Subject: {subject}
    Student's known weaknesses: {json.dumps(list(weaknesses.keys())[:3], indent=2) if weaknesses else "None identified yet"}
    {study_plan_context}
    
    Always be supportive, clear, and use simple language. If asked about homework or a problem, provide step-by-step explanations. When referencing the study plan, be specific about modules, weeks, topics, and learning materials."""

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

