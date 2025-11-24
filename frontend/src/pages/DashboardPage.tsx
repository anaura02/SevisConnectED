/**
 * Dashboard Page - Student dashboard
 */
import { Navigation } from '../components/Navigation';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';

export const DashboardPage: React.FC = () => {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Welcome back, {user?.name}!
          </h1>
          <p className="text-gray-600">
            Grade {user?.grade_level} • {user?.school}
          </p>
        </div>

        {/* Quick Actions */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <Link
            to="/study-plan"
            className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow border-l-4 border-primary-600"
          >
            <h3 className="text-xl font-semibold text-gray-900 mb-2">My Study Plan</h3>
            <p className="text-gray-600 text-sm">
              View your personalized learning path
            </p>
          </Link>

          <Link
            to="/tutor"
            className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow border-l-4 border-green-600"
          >
            <h3 className="text-xl font-semibold text-gray-900 mb-2">AI Tutor</h3>
            <p className="text-gray-600 text-sm">
              Chat with your AI learning assistant
            </p>
          </Link>

          <Link
            to="/progress"
            className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow border-l-4 border-blue-600"
          >
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Progress</h3>
            <p className="text-gray-600 text-sm">
              Track your learning progress
            </p>
          </Link>
        </div>

        {/* Placeholder sections */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Recent Activity</h2>
          <p className="text-gray-500">No recent activity yet. Start by taking a diagnostic test!</p>
        </div>
      </div>
    </div>
  );
};

