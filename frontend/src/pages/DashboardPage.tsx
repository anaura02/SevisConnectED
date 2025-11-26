/**
 * Dashboard Page - Professional production-grade student dashboard
 * Modern design with turquoise surf theme (#00A5CF)
 */
import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import { progressApi } from '../api/services';
import type { Progress } from '../types';

// Progress Ring Component
const ProgressRing: React.FC<{ percentage: number; size?: number; strokeWidth?: number; color?: string }> = ({ 
  percentage, 
  size = 80, 
  strokeWidth = 8,
  color = '#00A5CF'
}) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (percentage / 100) * circumference;

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="transform -rotate-90">
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="#e5e7eb"
          strokeWidth={strokeWidth}
          fill="none"
        />
        {/* Progress circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={color}
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="transition-all duration-500 ease-out"
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-lg font-bold text-gray-900">{Math.round(percentage)}%</span>
      </div>
    </div>
  );
};

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
  
  // Calculate topic-specific stats
  const topicStats = {
    algebra: mathProgress.filter(p => p.metric_name.includes('algebra')).length,
    geometry: mathProgress.filter(p => p.metric_name.includes('geometry')).length,
    trigonometry: mathProgress.filter(p => p.metric_name.includes('trigonometry')).length,
    calculus: mathProgress.filter(p => p.metric_name.includes('calculus')).length,
  };
  
  const totalTopicRecords = Object.values(topicStats).reduce((sum, count) => sum + count, 0);
  
  // Calculate overall progress - only use score-related metrics
  const scoreMetrics = progress.filter(p => 
    p.metric_name.includes('_score') || 
    p.metric_name.includes('score') ||
    p.metric_name === 'overall_math_score'
  );
  
  const overallScore = scoreMetrics.length > 0
    ? scoreMetrics.reduce((sum, p) => sum + (p.metric_value || 0), 0) / scoreMetrics.length
    : 0;
  
  // Calculate average math score
  const mathScoreMetrics = mathProgress.filter(p => 
    p.metric_name.includes('_score') || 
    p.metric_name.includes('score') ||
    p.metric_name === 'overall_math_score'
  );
  
  const averageMathScore = mathScoreMetrics.length > 0
    ? mathScoreMetrics.reduce((sum, p) => sum + (p.metric_value || 0), 0) / mathScoreMetrics.length
    : 0;

  // Get topic scores for breakdown
  const topicScores = {
    algebra: mathScoreMetrics.filter(p => p.metric_name.includes('algebra')).reduce((sum, p) => sum + p.metric_value, 0) / 
             Math.max(mathScoreMetrics.filter(p => p.metric_name.includes('algebra')).length, 1),
    geometry: mathScoreMetrics.filter(p => p.metric_name.includes('geometry')).reduce((sum, p) => sum + p.metric_value, 0) / 
              Math.max(mathScoreMetrics.filter(p => p.metric_name.includes('geometry')).length, 1),
    trigonometry: mathScoreMetrics.filter(p => p.metric_name.includes('trigonometry')).reduce((sum, p) => sum + p.metric_value, 0) / 
                  Math.max(mathScoreMetrics.filter(p => p.metric_name.includes('trigonometry')).length, 1),
    calculus: mathScoreMetrics.filter(p => p.metric_name.includes('calculus')).reduce((sum, p) => sum + p.metric_value, 0) / 
              Math.max(mathScoreMetrics.filter(p => p.metric_name.includes('calculus')).length, 1),
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header Section */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-4xl font-bold text-gray-900 mb-2">
                Welcome back, {user?.name}! 👋
              </h1>
              <p className="text-gray-600 text-lg">
                Grade {user?.grade_level} • {user?.school}
              </p>
            </div>
            <div className="hidden md:block">
              <div className="bg-gradient-to-r from-primary-500 to-primary-600 text-white px-6 py-3 rounded-lg shadow-lg">
                <p className="text-sm font-medium">Today's Focus</p>
                <p className="text-xl font-bold">Keep Learning!</p>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Cards - Professional Design */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          {/* Average Score Card */}
          <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100 hover:shadow-xl transition-all duration-300 group">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="bg-gradient-to-br from-primary-500 to-primary-600 p-3 rounded-lg">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Average Score</p>
                  <p className="text-xs text-gray-500">All test scores</p>
                </div>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-4xl font-bold text-gray-900 mb-1">
                  {overallScore > 0 ? `${Math.round(overallScore)}%` : '--'}
                </p>
                {overallScore > 0 && (
                  <div className="flex items-center space-x-2">
                    <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-primary-500 to-primary-600 rounded-full transition-all duration-500"
                        style={{ width: `${Math.min(overallScore, 100)}%` }}
                      ></div>
                    </div>
                  </div>
                )}
              </div>
              {overallScore > 0 && (
                <ProgressRing percentage={overallScore} size={70} strokeWidth={6} color="#00A5CF" />
              )}
            </div>
          </div>

          {/* Math Average Card */}
          <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100 hover:shadow-xl transition-all duration-300 group">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="bg-gradient-to-br from-blue-500 to-blue-600 p-3 rounded-lg">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Math Average</p>
                  <p className="text-xs text-gray-500">Math test scores</p>
                </div>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-4xl font-bold text-gray-900 mb-1">
                  {averageMathScore > 0 ? `${Math.round(averageMathScore)}%` : '--'}
                </p>
                {averageMathScore > 0 && (
                  <div className="flex items-center space-x-2">
                    <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-blue-500 to-blue-600 rounded-full transition-all duration-500"
                        style={{ width: `${Math.min(averageMathScore, 100)}%` }}
                      ></div>
                    </div>
                  </div>
                )}
              </div>
              {averageMathScore > 0 && (
                <ProgressRing percentage={averageMathScore} size={70} strokeWidth={6} color="#3b82f6" />
              )}
            </div>
          </div>

          {/* Math Topics Card */}
          <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100 hover:shadow-xl transition-all duration-300 group">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 p-3 rounded-lg">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Topics Tracked</p>
                  <p className="text-xs text-gray-500">Math subjects</p>
                </div>
              </div>
            </div>
            <div>
              <p className="text-4xl font-bold text-gray-900 mb-3">
                {totalTopicRecords > 0 ? totalTopicRecords : '--'}
              </p>
              <div className="grid grid-cols-2 gap-2">
                {Object.entries(topicStats).map(([topic, count]) => (
                  <div key={topic} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                    <span className="text-xs font-medium text-gray-700 capitalize">{topic}</span>
                    <span className="text-xs font-bold text-primary-600">{count}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Topic Performance Breakdown */}
        {Object.keys(topicScores).some(topic => topicScores[topic as keyof typeof topicScores] > 0) && (
          <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100 mb-8">
            <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
              <svg className="w-5 h-5 text-primary-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              Topic Performance
            </h2>
            <div className="grid md:grid-cols-4 gap-4">
              {Object.entries(topicScores).map(([topic, score]) => {
                if (score <= 0) return null;
                return (
                  <div key={topic} className="p-4 bg-gradient-to-br from-gray-50 to-white rounded-lg border border-gray-200">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-semibold text-gray-700 capitalize">{topic}</span>
                      <span className="text-lg font-bold text-primary-600">{Math.round(score)}%</span>
                    </div>
                    <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-primary-500 to-primary-600 rounded-full transition-all duration-500"
                        style={{ width: `${Math.min(score, 100)}%` }}
                      ></div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Quick Actions - Enhanced Design */}
        <div className="mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Quick Actions</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Link
              to="/diagnostic"
              className="group bg-white rounded-xl shadow-md p-6 hover:shadow-xl transition-all duration-300 border border-gray-100 hover:border-primary-300"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="bg-gradient-to-br from-purple-500 to-purple-600 p-3 rounded-lg group-hover:scale-110 transition-transform">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <svg className="w-5 h-5 text-gray-400 group-hover:text-primary-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2 group-hover:text-primary-600 transition-colors">
                Exams & Tests
              </h3>
              <p className="text-sm text-gray-600">
                Assess your strengths and identify areas for improvement
              </p>
            </Link>

            <Link
              to="/study-plan"
              className="group bg-white rounded-xl shadow-md p-6 hover:shadow-xl transition-all duration-300 border border-gray-100 hover:border-primary-300"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="bg-gradient-to-br from-primary-500 to-primary-600 p-3 rounded-lg group-hover:scale-110 transition-transform">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                  </svg>
                </div>
                <svg className="w-5 h-5 text-gray-400 group-hover:text-primary-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2 group-hover:text-primary-600 transition-colors">
                Study Plan
              </h3>
              <p className="text-sm text-gray-600">
                View your personalized learning path and materials
              </p>
            </Link>

            <Link
              to="/tutor"
              className="group bg-white rounded-xl shadow-md p-6 hover:shadow-xl transition-all duration-300 border border-gray-100 hover:border-primary-300"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 p-3 rounded-lg group-hover:scale-110 transition-transform">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                </div>
                <svg className="w-5 h-5 text-gray-400 group-hover:text-primary-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2 group-hover:text-primary-600 transition-colors">
                AI Tutor
              </h3>
              <p className="text-sm text-gray-600">
                Get instant help with homework and concepts
              </p>
            </Link>

            <Link
              to="/progress"
              className="group bg-white rounded-xl shadow-md p-6 hover:shadow-xl transition-all duration-300 border border-gray-100 hover:border-primary-300"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="bg-gradient-to-br from-blue-500 to-blue-600 p-3 rounded-lg group-hover:scale-110 transition-transform">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                  </svg>
                </div>
                <svg className="w-5 h-5 text-gray-400 group-hover:text-primary-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2 group-hover:text-primary-600 transition-colors">
                Progress
              </h3>
              <p className="text-sm text-gray-600">
                Track your learning journey with detailed analytics
              </p>
            </Link>
          </div>
        </div>

        {/* Recent Activity - Enhanced */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
          <div className="bg-gradient-to-r from-primary-500 to-primary-600 px-6 py-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-white flex items-center">
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Recent Activity
              </h2>
              {loading && (
                <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
              )}
            </div>
          </div>
          
          <div className="p-6">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary-600 border-t-transparent"></div>
              </div>
            ) : progress.length > 0 ? (
              <div className="space-y-3">
                {progress.slice(0, 5).map((record) => (
                  <div
                    key={record.id}
                    className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-primary-50 transition-colors border border-gray-200 hover:border-primary-200"
                  >
                    <div className="flex items-center gap-4">
                      <div className="bg-primary-100 p-2 rounded-lg">
                        <svg className="w-5 h-5 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900 capitalize">
                          {record.subject} - {record.metric_name.replace('_', ' ')}
                        </p>
                        <p className="text-sm text-gray-500">
                          {new Date(record.recorded_at).toLocaleDateString('en-US', { 
                            weekday: 'short', 
                            year: 'numeric', 
                            month: 'short', 
                            day: 'numeric' 
                          })}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xl font-bold text-primary-600">
                        {Math.round(record.metric_value)}%
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="bg-gray-100 rounded-full p-4 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                  <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <p className="text-gray-500 mb-4 font-medium">No activity yet</p>
                <p className="text-sm text-gray-400 mb-6">Get started by taking a diagnostic test or generating your study plan</p>
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <Link
                    to="/study-plan"
                    className="inline-flex items-center justify-center bg-gradient-to-r from-primary-500 to-primary-600 text-white px-6 py-3 rounded-lg hover:from-primary-600 hover:to-primary-700 transition-all shadow-md hover:shadow-lg font-medium"
                  >
                    Generate Study Plan
                  </Link>
                  <Link
                    to="/tutor"
                    className="inline-flex items-center justify-center bg-white text-primary-600 px-6 py-3 rounded-lg hover:bg-primary-50 transition-all border-2 border-primary-600 font-medium"
                  >
                    Chat with AI Tutor
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
