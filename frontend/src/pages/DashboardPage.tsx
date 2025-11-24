/**
 * Dashboard Page - Student dashboard
 * Displays user overview, quick actions, and recent activity
 */
import { useState, useEffect } from 'react';
import { Navigation } from '../components/Navigation';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import { progressApi } from '../api/services';
import type { Progress } from '../types';

export const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const [progress, setProgress] = useState<Progress[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadProgress = async () => {
      if (!user?.sevis_pass_id) return;
      
      try {
        setLoading(true);
        const response = await progressApi.get(user.sevis_pass_id);
        if (response.status === 'success' && response.data) {
          setProgress(response.data);
        }
      } catch (error) {
        console.error('Failed to load progress:', error);
      } finally {
        setLoading(false);
      }
    };

    loadProgress();
  }, [user]);

  // Calculate stats from progress data
  const mathProgress = progress.filter(p => p.subject === 'math');
  const englishProgress = progress.filter(p => p.subject === 'english');
  
  const overallScore = progress.length > 0
    ? progress.reduce((sum, p) => sum + (p.metric_value || 0), 0) / progress.length
    : 0;

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Welcome back, {user?.name}! 👋
          </h1>
          <p className="text-gray-600">
            Grade {user?.grade_level} • {user?.school}
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-primary-600">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Overall Progress</p>
                <p className="text-3xl font-bold text-gray-900">
                  {overallScore > 0 ? `${Math.round(overallScore)}%` : '--'}
                </p>
              </div>
              <div className="text-4xl">📊</div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-blue-600">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Mathematics</p>
                <p className="text-3xl font-bold text-gray-900">
                  {mathProgress.length > 0 ? `${mathProgress.length} records` : 'No data'}
                </p>
              </div>
              <div className="text-4xl">🔢</div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-green-600">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">English</p>
                <p className="text-3xl font-bold text-gray-900">
                  {englishProgress.length > 0 ? `${englishProgress.length} records` : 'No data'}
                </p>
              </div>
              <div className="text-4xl">📚</div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <Link
            to="/study-plan"
            className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-all border-l-4 border-primary-600 hover:border-primary-700 group"
          >
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xl font-semibold text-gray-900 group-hover:text-primary-600 transition-colors">
                My Study Plan
              </h3>
              <span className="text-2xl">📋</span>
            </div>
            <p className="text-gray-600 text-sm">
              View your personalized learning path and track your progress
            </p>
          </Link>

          <Link
            to="/tutor"
            className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-all border-l-4 border-green-600 hover:border-green-700 group"
          >
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xl font-semibold text-gray-900 group-hover:text-green-600 transition-colors">
                AI Tutor
              </h3>
              <span className="text-2xl">🤖</span>
            </div>
            <p className="text-gray-600 text-sm">
              Chat with your AI learning assistant for personalized help
            </p>
          </Link>

          <Link
            to="/progress"
            className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-all border-l-4 border-blue-600 hover:border-blue-700 group"
          >
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xl font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                Progress Tracking
              </h3>
              <span className="text-2xl">📈</span>
            </div>
            <p className="text-gray-600 text-sm">
              View detailed analytics and track your learning journey
            </p>
          </Link>
        </div>

        {/* Recent Activity */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900">Recent Activity</h2>
            {loading && (
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary-600"></div>
            )}
          </div>
          
          {loading ? (
            <p className="text-gray-500">Loading activity...</p>
          ) : progress.length > 0 ? (
            <div className="space-y-3">
              {progress.slice(0, 5).map((record) => (
                <div
                  key={record.id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-xl">
                      {record.subject === 'math' ? '🔢' : '📚'}
                    </span>
                    <div>
                      <p className="font-medium text-gray-900 capitalize">
                        {record.subject} - {record.metric_name}
                      </p>
                      <p className="text-sm text-gray-500">
                        {new Date(record.recorded_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-primary-600">
                      {record.metric_value}%
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-500 mb-4">No activity yet. Get started by:</p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Link
                  to="/study-plan"
                  className="inline-block bg-primary-600 text-white px-4 py-2 rounded-md hover:bg-primary-700 transition-colors text-sm font-medium"
                >
                  Generate Study Plan
                </Link>
                <Link
                  to="/tutor"
                  className="inline-block bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors text-sm font-medium"
                >
                  Chat with AI Tutor
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

