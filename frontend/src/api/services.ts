/**
 * API Service Functions for SevisConnectED
 * All API calls to backend endpoints
 */
import apiClient from './apiClient';
import type {
  ApiResponse,
  User,
  Diagnostic,
  WeaknessProfile,
  LearningPath,
  ChatSession,
  Progress,
  LoginRequest,
  SubmitDiagnosticRequest,
  AnalyzeWeaknessesRequest,
  GenerateStudyPlanRequest,
  TutorChatRequest,
  TutorChatResponse,
} from '../types';

// ==================== Authentication ====================

export const authApi = {
  /**
   * Login with SevisPass ID
   * POST /api/auth/login/
   */
  login: async (data: LoginRequest): Promise<ApiResponse<User>> => {
    const response = await apiClient.post<ApiResponse<User>>('/auth/login/', data);
    return response.data;
  },

  /**
   * Get student profile
   * POST /api/student/profile/
   */
  getProfile: async (sevisPassId: string): Promise<ApiResponse<User>> => {
    const response = await apiClient.post<ApiResponse<User>>('/student/profile/', {
      sevis_pass_id: sevisPassId,
    });
    return response.data;
  },
};

// ==================== Diagnostic ====================

export const diagnosticApi = {
  /**
   * Submit diagnostic test answers
   * POST /api/diagnostic/submit/
   */
  submit: async (data: SubmitDiagnosticRequest): Promise<ApiResponse<{
    diagnostic_id: string;
    count: number;
    diagnostics: Diagnostic[];
  }>> => {
    const response = await apiClient.post<ApiResponse<{
      diagnostic_id: string;
      count: number;
      diagnostics: Diagnostic[];
    }>>('/diagnostic/submit/', data);
    return response.data;
  },
};

// ==================== Weakness Analysis ====================

export const weaknessApi = {
  /**
   * Analyze weaknesses from diagnostic results
   * POST /api/analyze/weaknesses/
   */
  analyze: async (data: AnalyzeWeaknessesRequest): Promise<ApiResponse<WeaknessProfile>> => {
    const response = await apiClient.post<ApiResponse<WeaknessProfile>>('/analyze/weaknesses/', data);
    return response.data;
  },
};

// ==================== Learning Path ====================

export const learningPathApi = {
  /**
   * Generate personalized learning path
   * POST /api/generate/study-plan/
   */
  generate: async (data: GenerateStudyPlanRequest): Promise<ApiResponse<LearningPath>> => {
    const response = await apiClient.post<ApiResponse<LearningPath>>('/generate/study-plan/', data);
    return response.data;
  },
};

// ==================== AI Tutor Chat ====================

export const tutorApi = {
  /**
   * Chat with AI tutor
   * POST /api/tutor/chat/
   */
  chat: async (data: TutorChatRequest): Promise<ApiResponse<TutorChatResponse>> => {
    const response = await apiClient.post<ApiResponse<TutorChatResponse>>('/tutor/chat/', data);
    return response.data;
  },
};

// ==================== Progress ====================

export const progressApi = {
  /**
   * Get student progress
   * GET /api/progress/
   */
  get: async (sevisPassId: string, subject?: 'math' | 'english'): Promise<ApiResponse<Progress[]>> => {
    const params: Record<string, string> = { sevis_pass_id: sevisPassId };
    if (subject) {
      params.subject = subject;
    }
    const response = await apiClient.get<ApiResponse<Progress[]>>('/progress/', { params });
    return response.data;
  },
};

// ==================== Teacher Dashboard ====================

export const teacherApi = {
  /**
   * Get list of students
   * GET /api/teacher/students/
   */
  getStudents: async (school?: string): Promise<ApiResponse<User[]>> => {
    const params = school ? { school } : {};
    const response = await apiClient.get<ApiResponse<User[]>>('/teacher/students/', { params });
    return response.data;
  },

  /**
   * Get student details
   * GET /api/teacher/student/<student_id>/
   */
  getStudentDetail: async (studentId: string): Promise<ApiResponse<{
    student: User;
    weakness_profiles: WeaknessProfile[];
    learning_paths: LearningPath[];
    progress: Progress[];
    recent_diagnostics: Diagnostic[];
  }>> => {
    const response = await apiClient.get<ApiResponse<{
      student: User;
      weakness_profiles: WeaknessProfile[];
      learning_paths: LearningPath[];
      progress: Progress[];
      recent_diagnostics: Diagnostic[];
    }>>(`/teacher/student/${studentId}/`);
    return response.data;
  },
};

