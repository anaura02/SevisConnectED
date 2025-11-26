/**
 * Navigation Component
 * Main navigation bar for authenticated users
 */
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export const Navigation: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  if (!user) {
    return null;
  }

  return (
    <nav className="bg-white shadow-sm border-b border-gray-200">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          {/* Logo/Brand */}
          <Link to="/dashboard" className="flex items-center space-x-2">
            <span className="text-xl font-bold text-primary-700">AI Teacher</span>
          </Link>

          {/* Navigation Links */}
              <div className="hidden md:flex items-center space-x-1">
                <Link
                  to="/dashboard"
                  className="px-4 py-2 text-gray-700 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-all font-medium"
                >
                  Dashboard
                </Link>
                <Link
                  to="/diagnostic"
                  className="px-4 py-2 text-gray-700 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-all font-medium"
                >
                  Exams & Tests
                </Link>
                <Link
                  to="/study-plan"
                  className="px-4 py-2 text-gray-700 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-all font-medium"
                >
                  Study Plan
                </Link>
                <Link
                  to="/tutor"
                  className="px-4 py-2 text-gray-700 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-all font-medium"
                >
                  AI Tutor
                </Link>
                <Link
                  to="/progress"
                  className="px-4 py-2 text-gray-700 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-all font-medium"
                >
                  Progress
                </Link>
              </div>

          {/* User Menu */}
              <div className="flex items-center space-x-4">
                <div className="hidden sm:flex items-center space-x-2 bg-gray-50 px-3 py-1.5 rounded-lg">
                  <div className="w-8 h-8 bg-gradient-to-br from-primary-500 to-primary-600 rounded-full flex items-center justify-center">
                    <span className="text-white text-sm font-semibold">{user.name.charAt(0).toUpperCase()}</span>
                  </div>
                  <span className="text-sm font-medium text-gray-700">{user.name}</span>
                </div>
                <button
                  onClick={handleLogout}
                  className="text-sm font-medium text-gray-700 hover:text-primary-600 hover:bg-primary-50 px-3 py-2 rounded-lg transition-all"
                >
                  Logout
                </button>
              </div>
        </div>
      </div>
    </nav>
  );
};

