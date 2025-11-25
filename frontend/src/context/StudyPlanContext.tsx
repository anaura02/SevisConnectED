/**
 * Study Plan Context for AI Teacher
 * Manages learning path and study plan state
 */
import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import type { LearningPath, WeaknessProfile } from '../types';
import { learningPathApi, performanceApi } from '../api/services';

interface StudyPlanContextType {
  learningPath: LearningPath | null;
  weaknessProfile: WeaknessProfile | null;
  loading: boolean;
  error: string | null;
  loadLearningPath: (sevisPassId: string, subject: 'math') => Promise<void>;
  loadWeaknessProfile: (sevisPassId: string, subject: 'math') => Promise<void>;
  generateLearningPath: (sevisPassId: string, subject: 'math') => Promise<void>;
  clearStudyPlan: () => void;
}

const StudyPlanContext = createContext<StudyPlanContextType | undefined>(undefined);

export const StudyPlanProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [learningPath, setLearningPath] = useState<LearningPath | null>(null);
  const [weaknessProfile, setWeaknessProfile] = useState<WeaknessProfile | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadWeaknessProfile = useCallback(async (sevisPassId: string, subject: 'math' = 'math') => {
    try {
      setLoading(true);
      setError(null);
      
      // Use performance analysis (primary method - analyzes from Progress records)
      const response = await performanceApi.analyze(sevisPassId);

      if (response.status === 'success' && response.data) {
        // Extract weakness profile from the response
        setWeaknessProfile(response.data.weakness_profile);
        
        // Log performance analysis for debugging
        if (response.data.performance_analysis) {
          console.log('Performance Analysis:', {
            overall_score: response.data.performance_analysis.overall_score,
            weak_topics: response.data.performance_analysis.weak_topics,
            strong_topics: response.data.performance_analysis.strong_topics,
          });
        }
      } else {
        throw new Error(response.message || 'Failed to analyze performance');
      }
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to analyze performance';
      setError(errorMessage);
      console.error('Error analyzing performance:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []); // Empty deps - function doesn't depend on state

  const generateLearningPath = useCallback(async (sevisPassId: string, subject: 'math' = 'math') => {
    try {
      setLoading(true);
      setError(null);
      console.log('🔄 Starting study plan generation... This may take 60-90 seconds.');
      const response = await learningPathApi.generate({
        sevis_pass_id: sevisPassId,
        subject,
      });

      if (response.status === 'success' && response.data) {
        setLearningPath(response.data);
        
        // Detailed logging to check what we received
        const hasSyllabus = !!response.data.syllabus;
        const syllabusModules = response.data.syllabus?.modules?.length || 0;
        const weekCount = Object.keys(response.data.week_plan || {}).length;
        const firstWeek = response.data.week_plan ? Object.values(response.data.week_plan)[0] : null;
        const hasLearningMaterials = firstWeek?.learning_materials ? true : false;
        
        console.log('Learning Path Generated:', {
          has_syllabus: hasSyllabus,
          syllabus_modules: syllabusModules,
          week_count: weekCount,
          has_learning_materials: hasLearningMaterials,
          syllabus_title: response.data.syllabus?.title || 'N/A',
          first_week_focus: firstWeek?.focus || 'N/A',
          week_plan_keys: Object.keys(response.data.week_plan || {}),
        });
        
        // Only warn if BOTH syllabus AND week_plan are empty (not just one)
        // If week_plan has data, it's valid even if syllabus is missing
        const hasValidData = weekCount > 0 || (hasSyllabus && syllabusModules > 0);
        
        if (!hasValidData) {
          console.warn('⚠️  WARNING: Received empty or fallback study plan data!');
          console.warn('   This usually means OpenAI API failed. Check:');
          console.warn('   1. OpenAI account has credits');
          console.warn('   2. No rate limits');
          console.warn('   3. API key is valid');
          setError('Study plan generated but appears to be empty. Please check OpenAI account credits and try again.');
        } else {
          // Clear any previous errors if we have valid data
          setError(null);
          console.log('✅ Study plan data is valid!');
        }
      } else {
        throw new Error(response.message || 'Failed to generate learning path');
      }
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to generate learning path';
      setError(errorMessage);
      console.error('Error generating learning path:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []); // Empty deps - function doesn't depend on state

  const loadLearningPath = async (sevisPassId: string, subject: 'math' = 'math') => {
    // For now, we'll generate it if it doesn't exist
    // In the future, we could add a GET endpoint to fetch existing learning paths
    try {
      await generateLearningPath(sevisPassId, subject);
    } catch (err) {
      // If generation fails, try to load existing one
      // This would require a GET endpoint on the backend
      console.error('Failed to load learning path:', err);
      throw err;
    }
  };

  const clearStudyPlan = () => {
    setLearningPath(null);
    setWeaknessProfile(null);
    setError(null);
  };

  return (
    <StudyPlanContext.Provider
      value={{
        learningPath,
        weaknessProfile,
        loading,
        error,
        loadLearningPath,
        loadWeaknessProfile,
        generateLearningPath,
        clearStudyPlan,
      }}
    >
      {children}
    </StudyPlanContext.Provider>
  );
};

export const useStudyPlan = () => {
  const context = useContext(StudyPlanContext);
  if (context === undefined) {
    throw new Error('useStudyPlan must be used within a StudyPlanProvider');
  }
  return context;
};

