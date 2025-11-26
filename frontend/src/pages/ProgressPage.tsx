/**
 * Progress Tracking Page
 * Displays student progress over time with detailed analytics
 */
import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { progressApi } from '../api/services';
import { Footer } from '../components/Footer';
import type { Progress } from '../types';

export const ProgressPage: React.FC = () => {
  const { user } = useAuth();
  const [progress, setProgress] = useState<Progress[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSubject, setSelectedSubject] = useState<'math'>('math');
  const [selectedTopic, setSelectedTopic] = useState<string>('all');

  useEffect(() => {
    const loadProgress = async () => {
      if (!user?.sevis_pass_id) return;

      try {
        setLoading(true);
        const response = await progressApi.get(user.sevis_pass_id, selectedSubject);
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
  }, [user, selectedSubject]);

  // Filter progress by topic
  const filteredProgress = selectedTopic === 'all'
    ? progress
    : progress.filter(p => p.metric_name.toLowerCase().includes(selectedTopic.toLowerCase()));

  // Get unique topics from progress records
  const topics = Array.from(
    new Set(
      progress
        .map(p => {
          const name = p.metric_name.toLowerCase();
          if (name.includes('algebra')) return 'algebra';
          if (name.includes('geometry')) return 'geometry';
          if (name.includes('trigonometry') || name.includes('trig')) return 'trigonometry';
          if (name.includes('calculus')) return 'calculus';
          return 'other';
        })
        .filter(t => t !== 'other')
    )
  );

  // Calculate overall statistics
  const scoreMetrics = progress.filter(p =>
    p.metric_name.includes('_score') ||
    p.metric_name.includes('score') ||
    p.metric_name === 'overall_math_score'
  );

  const overallAverage = scoreMetrics.length > 0
    ? scoreMetrics.reduce((sum, p) => sum + p.metric_value, 0) / scoreMetrics.length
    : 0;

  // Calculate topic averages
  const topicAverages: Record<string, { average: number; count: number; trend: number }> = {};
  topics.forEach(topic => {
    const topicRecords = progress.filter(p =>
      p.metric_name.toLowerCase().includes(topic.toLowerCase()) &&
      (p.metric_name.includes('_score') || p.metric_name.includes('score'))
    );

    if (topicRecords.length > 0) {
      const average = topicRecords.reduce((sum, p) => sum + p.metric_value, 0) / topicRecords.length;
      const sortedByDate = [...topicRecords].sort((a, b) =>
        new Date(a.recorded_at).getTime() - new Date(b.recorded_at).getTime()
      );
      const recent = sortedByDate.slice(-Math.min(5, sortedByDate.length));
      const older = sortedByDate.slice(0, Math.max(0, sortedByDate.length - 5));
      const recentAvg = recent.length > 0
        ? recent.reduce((sum, p) => sum + p.metric_value, 0) / recent.length
        : average;
      const olderAvg = older.length > 0
        ? older.reduce((sum, p) => sum + p.metric_value, 0) / older.length
        : average;
      const trend = recentAvg - olderAvg;

      topicAverages[topic] = {
        average,
        count: topicRecords.length,
        trend,
      };
    }
  });

  // Get recent progress (last 10 records)
  const recentProgress = filteredProgress
    .sort((a, b) => new Date(b.recorded_at).getTime() - new Date(a.recorded_at).getTime())
    .slice(0, 10);

  // Format metric name for display
  const formatMetricName = (name: string): string => {
    return name
      .replace(/_/g, ' ')
      .replace(/\b\w/g, l => l.toUpperCase());
  };

  // Get color based on score
  const getScoreColor = (score: number): string => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  // Get trend indicator
  const getTrendIcon = (trend: number): string => {
    if (trend > 2) return '📈';
    if (trend < -2) return '📉';
    return '➡️';
  };

  // Get trend color
  const getTrendColor = (trend: number): string => {
    if (trend > 2) return 'text-green-600';
    if (trend < -2) return 'text-red-600';
    return 'text-gray-600';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading progress data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Progress Tracking</h1>
          <p className="text-gray-600">Monitor your academic performance and track improvements over time</p>
        </div>

        {/* Overall Stats Cards */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="bg-gradient-to-br from-primary-500 to-primary-700 p-3 rounded-lg">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
            </div>
            <h3 className="text-sm font-medium text-gray-600 mb-1">Overall Average</h3>
            <p className={`text-3xl font-bold ${getScoreColor(overallAverage)}`}>
              {overallAverage.toFixed(1)}%
            </p>
            <p className="text-xs text-gray-500 mt-2">{scoreMetrics.length} score records</p>
          </div>

          <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="bg-gradient-to-br from-green-500 to-green-600 p-3 rounded-lg">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
            <h3 className="text-sm font-medium text-gray-600 mb-1">Total Records</h3>
            <p className="text-3xl font-bold text-gray-900">{progress.length}</p>
            <p className="text-xs text-gray-500 mt-2">Progress entries tracked</p>
          </div>

          <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="bg-gradient-to-br from-purple-500 to-purple-600 p-3 rounded-lg">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
            </div>
            <h3 className="text-sm font-medium text-gray-600 mb-1">Topics Tracked</h3>
            <p className="text-3xl font-bold text-gray-900">{topics.length}</p>
            <p className="text-xs text-gray-500 mt-2">Different topics monitored</p>
          </div>
        </div>

        {/* Topic Performance */}
        {topics.length > 0 && (
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6 mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Topic Performance</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
              {topics.map(topic => {
                const topicData = topicAverages[topic];
                if (!topicData) return null;

                return (
                  <div
                    key={topic}
                    className={`border-2 rounded-lg p-4 transition-all cursor-pointer ${
                      selectedTopic === topic
                        ? 'border-primary-500 bg-primary-50'
                        : 'border-gray-200 hover:border-primary-300'
                    }`}
                    onClick={() => setSelectedTopic(selectedTopic === topic ? 'all' : topic)}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-semibold text-gray-900 capitalize">{topic}</h3>
                      <span className={`text-lg ${getTrendColor(topicData.trend)}`}>
                        {getTrendIcon(topicData.trend)}
                      </span>
                    </div>
                    <p className={`text-2xl font-bold ${getScoreColor(topicData.average)} mb-1`}>
                      {topicData.average.toFixed(1)}%
                    </p>
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <span>{topicData.count} records</span>
                      {topicData.trend !== 0 && (
                        <span className={getTrendColor(topicData.trend)}>
                          {topicData.trend > 0 ? '+' : ''}{topicData.trend.toFixed(1)}%
                        </span>
                      )}
                    </div>
                    {/* Progress Bar */}
                    <div className="mt-3 w-full bg-gray-200 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full transition-all ${
                          topicData.average >= 80
                            ? 'bg-green-500'
                            : topicData.average >= 60
                            ? 'bg-yellow-500'
                            : 'bg-red-500'
                        }`}
                        style={{ width: `${Math.min(topicData.average, 100)}%` }}
                      ></div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Recent Progress Records */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">
              Recent Progress Records
              {selectedTopic !== 'all' && (
                <span className="text-lg font-normal text-gray-600 ml-2">
                  ({selectedTopic})
                </span>
              )}
            </h2>
            <div className="flex gap-2">
              <button
                onClick={() => setSelectedTopic('all')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  selectedTopic === 'all'
                    ? 'bg-primary-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                All Topics
              </button>
            </div>
          </div>

          {recentProgress.length === 0 ? (
            <div className="text-center py-12">
              <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No Progress Records</h3>
              <p className="text-gray-600 mb-4">Start practicing to see your progress here!</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Metric</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Value</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Date</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {recentProgress.map((record) => (
                    <tr key={record.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                      <td className="py-3 px-4">
                        <span className="font-medium text-gray-900">
                          {formatMetricName(record.metric_name)}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`text-lg font-semibold ${getScoreColor(record.metric_value)}`}>
                          {record.metric_value.toFixed(1)}
                          {record.metric_name.includes('score') && '%'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-gray-600">
                        {new Date(record.recorded_at).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </td>
                      <td className="py-3 px-4">
                        {record.metric_name.includes('score') && (
                          <span
                            className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${
                              record.metric_value >= 80
                                ? 'bg-green-100 text-green-800'
                                : record.metric_value >= 60
                                ? 'bg-yellow-100 text-yellow-800'
                                : 'bg-red-100 text-red-800'
                            }`}
                          >
                            {record.metric_value >= 80
                              ? 'Excellent'
                              : record.metric_value >= 60
                              ? 'Good'
                              : 'Needs Improvement'}
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
      <Footer />
    </div>
  );
};

