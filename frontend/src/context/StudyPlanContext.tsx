/**
 * Study Plan Context for AI Teacher
 * Manages learning path and study plan state
 */
import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import type { LearningPath, WeaknessProfile } from '../types';
import { learningPathApi, performanceApi } from '../api/services';

interface StudyPlanContextType {
  learningPath: LearningPath | null;
  studyPlans: LearningPath[];  // Array of all saved study plans
  weaknessProfile: WeaknessProfile | null;
  loading: boolean;
  error: string | null;
  loadLearningPath: (sevisPassId: string, subject: 'math') => Promise<void>;
  loadStudyPlans: (sevisPassId: string, subject: 'math') => Promise<void>;  // Load all saved plans
  loadWeaknessProfile: (sevisPassId: string, subject: 'math') => Promise<void>;
  generateLearningPath: (sevisPassId: string, subject: 'math') => Promise<void>;
  deleteStudyPlan: (planId: string, sevisPassId: string, subject: 'math') => Promise<void>;  // Delete a study plan
  clearStudyPlan: () => void;
  setActivePlan: (plan: LearningPath | null) => void;  // Set which plan to display
}

const StudyPlanContext = createContext<StudyPlanContextType | undefined>(undefined);

export const StudyPlanProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [learningPath, setLearningPath] = useState<LearningPath | null>(null);
  const [studyPlans, setStudyPlans] = useState<LearningPath[]>([]);  // All saved study plans
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

  const loadStudyPlans = useCallback(async (sevisPassId: string, subject: 'math' = 'math') => {
    try {
      setLoading(true);
      setError(null);
      const response = await learningPathApi.getAll(sevisPassId, subject);
      
      if (response.status === 'success' && response.data) {
        const plans = response.data.study_plans || [];
        setStudyPlans(plans);
        // Set the most recent one as the active learning path if none is selected
        if (plans.length > 0 && !learningPath) {
          setLearningPath(plans[0]);  // Newest first (ordered by created_at desc)
        }
        console.log(`✅ Loaded ${plans.length} saved study plan(s)`);
      }
    } catch (err: any) {
      console.error('Error loading study plans:', err);
      setStudyPlans([]);
      // Don't throw - just log error, allow page to show empty state
    } finally {
      setLoading(false);
    }
  }, [learningPath]); // Include learningPath to check if we should set default

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
        const newPlan = response.data;
        setLearningPath(newPlan);
        
        // Reload all study plans to include the new one
        await loadStudyPlans(sevisPassId, subject);
        
        // Detailed logging to check what we received
        const hasSyllabus = !!newPlan.syllabus;
        const syllabusModules = newPlan.syllabus?.modules?.length || 0;
        const weekCount = Object.keys(newPlan.week_plan || {}).length;
        const firstWeek = newPlan.week_plan ? Object.values(newPlan.week_plan)[0] : null;
        const hasLearningMaterials = firstWeek?.learning_materials ? true : false;
        
        console.log('Learning Path Generated:', {
          has_syllabus: hasSyllabus,
          syllabus_modules: syllabusModules,
          week_count: weekCount,
          has_learning_materials: hasLearningMaterials,
          syllabus_title: newPlan.syllabus?.title || 'N/A',
          first_week_focus: firstWeek?.focus || 'N/A',
          week_plan_keys: Object.keys(newPlan.week_plan || {}),
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
  }, [loadStudyPlans]); // Include loadStudyPlans dependency

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
    setStudyPlans([]);
    setWeaknessProfile(null);
    setError(null);
  };

  const setActivePlan = useCallback((plan: LearningPath | null) => {
    setLearningPath(plan);
  }, []);

  const deleteStudyPlan = useCallback(async (planId: string, sevisPassId: string, subject: 'math' = 'math') => {
    try {
      setLoading(true);
      setError(null);
      const response = await learningPathApi.delete(planId, sevisPassId);
      
      if (response.status === 'success') {
        // Remove the plan from the studyPlans array
        setStudyPlans(prev => prev.filter(plan => plan.id !== planId));
        
        // If the deleted plan was the active one, clear it or set the first remaining plan
        if (learningPath?.id === planId) {
          const remainingPlans = studyPlans.filter(plan => plan.id !== planId);
          setLearningPath(remainingPlans.length > 0 ? remainingPlans[0] : null);
        }
        
        console.log('✅ Study plan deleted successfully');
      } else {
        throw new Error(response.message || 'Failed to delete study plan');
      }
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to delete study plan';
      setError(errorMessage);
      console.error('Error deleting study plan:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [learningPath, studyPlans]);

  return (
    <StudyPlanContext.Provider
      value={{
        learningPath,
        studyPlans,
        weaknessProfile,
        loading,
        error,
        loadLearningPath,
        loadStudyPlans,
        loadWeaknessProfile,
        generateLearningPath,
        deleteStudyPlan,
        clearStudyPlan,
        setActivePlan,
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

