/**
 * Study Plan Context for SevisConnectED
 * Manages learning path and study plan state
 */
import React, { createContext, useContext, useState, ReactNode } from 'react';
import type { LearningPath, WeaknessProfile } from '../types';
import { learningPathApi, weaknessApi } from '../api/services';

interface StudyPlanContextType {
  learningPath: LearningPath | null;
  weaknessProfile: WeaknessProfile | null;
  loading: boolean;
  error: string | null;
  loadLearningPath: (sevisPassId: string, subject: 'math' | 'english') => Promise<void>;
  loadWeaknessProfile: (sevisPassId: string, subject: 'math' | 'english') => Promise<void>;
  generateLearningPath: (sevisPassId: string, subject: 'math' | 'english') => Promise<void>;
  clearStudyPlan: () => void;
}

const StudyPlanContext = createContext<StudyPlanContextType | undefined>(undefined);

export const StudyPlanProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [learningPath, setLearningPath] = useState<LearningPath | null>(null);
  const [weaknessProfile, setWeaknessProfile] = useState<WeaknessProfile | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadWeaknessProfile = async (sevisPassId: string, subject: 'math' | 'english') => {
    try {
      setLoading(true);
      setError(null);
      const response = await weaknessApi.analyze({
        sevis_pass_id: sevisPassId,
        subject,
      });

      if (response.status === 'success' && response.data) {
        setWeaknessProfile(response.data);
      } else {
        throw new Error(response.message || 'Failed to load weakness profile');
      }
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to load weakness profile';
      setError(errorMessage);
      console.error('Error loading weakness profile:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const generateLearningPath = async (sevisPassId: string, subject: 'math' | 'english') => {
    try {
      setLoading(true);
      setError(null);
      const response = await learningPathApi.generate({
        sevis_pass_id: sevisPassId,
        subject,
      });

      if (response.status === 'success' && response.data) {
        setLearningPath(response.data);
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
  };

  const loadLearningPath = async (sevisPassId: string, subject: 'math' | 'english') => {
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

