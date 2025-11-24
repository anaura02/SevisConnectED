/**
 * TypeScript type definitions for SevisConnectED
 * Matches backend models and API responses
 */

// User types
export interface User {
  id: string;
  sevis_pass_id: string;
  name: string;
  grade_level: 11 | 12;
  school: string;
  email?: string;
  created_at: string;
  updated_at: string;
}

// Diagnostic types
export interface Diagnostic {
  id: string;
  user: string;
  subject: 'math' | 'english';
  question: string;
  student_answer: string;
  correct_answer: string;
  is_correct: boolean;
  score: number;
  time_taken_seconds: number;
  created_at: string;
}

export interface DiagnosticAnswer {
  subject: 'math' | 'english';
  question: string;
  student_answer: string;
  correct_answer: string;
  is_correct: boolean;
  score: number;
  time_taken_seconds: number;
}

// Weakness Profile types
export interface WeaknessProfile {
  id: string;
  user: string;
  subject: 'math' | 'english';
  weaknesses: Record<string, number>; // { "algebra": 0.8, "geometry": 0.6 }
  strengths: Record<string, number>; // { "arithmetic": 0.9 }
  baseline_score: number;
  confidence_score: number;
  recommended_difficulty: 'beginner' | 'intermediate' | 'advanced';
  created_at: string;
  updated_at: string;
}

// Learning Path types
export interface WeekPlan {
  focus: string;
  topics: string[];
  goals: string[];
}

export interface DailyTask {
  lesson: string;
  practice: string[];
  estimated_time: string;
}

export interface LearningPath {
  id: string;
  user: string;
  subject: 'math' | 'english';
  week_plan: Record<string, WeekPlan>; // { "week_1": {...}, "week_2": {...} }
  daily_tasks: Record<string, DailyTask>; // { "day_1": {...}, "day_2": {...} }
  status: 'active' | 'completed' | 'paused';
  created_at: string;
  updated_at: string;
}

// Chat types
export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface ChatSession {
  id: string;
  user: string;
  subject: 'math' | 'english';
  messages: ChatMessage[];
  context: Record<string, any>;
  created_at: string;
  updated_at: string;
}

// Progress types
export interface Progress {
  id: string;
  user: string;
  subject: 'math' | 'english';
  metric_name: string;
  metric_value: number;
  recorded_at: string;
}

// API Response types
export interface ApiResponse<T = any> {
  status: 'success' | 'error';
  data?: T;
  message?: string;
}

// Login request
export interface LoginRequest {
  sevis_pass_id: string;
  name?: string;
  grade_level?: number;
  school?: string;
  email?: string;
}

// Diagnostic submit request
export interface SubmitDiagnosticRequest {
  sevis_pass_id: string;
  answers: DiagnosticAnswer[];
}

// Analyze weaknesses request
export interface AnalyzeWeaknessesRequest {
  sevis_pass_id: string;
  subject: 'math' | 'english';
}

// Generate study plan request
export interface GenerateStudyPlanRequest {
  sevis_pass_id: string;
  subject: 'math' | 'english';
}

// Tutor chat request
export interface TutorChatRequest {
  sevis_pass_id: string;
  message: string;
  subject: 'math' | 'english';
}

export interface TutorChatResponse {
  response: string;
  session_id: string;
  messages: ChatMessage[];
}

