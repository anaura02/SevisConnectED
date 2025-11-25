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
          <div className="hidden md:flex items-center space-x-6">
            <Link
              to="/dashboard"
              className="text-gray-700 hover:text-primary-600 transition-colors"
            >
              Dashboard
            </Link>
            <Link
              to="/diagnostic"
              className="text-gray-700 hover:text-primary-600 transition-colors"
            >
              Diagnostic Test
            </Link>
            <Link
              to="/study-plan"
              className="text-gray-700 hover:text-primary-600 transition-colors"
            >
              Study Plan
            </Link>
            <Link
              to="/tutor"
              className="text-gray-700 hover:text-primary-600 transition-colors"
            >
              AI Tutor
            </Link>
            <Link
              to="/progress"
              className="text-gray-700 hover:text-primary-600 transition-colors"
            >
              Progress
            </Link>
          </div>

          {/* User Menu */}
          <div className="flex items-center space-x-4">
            <span className="text-sm text-gray-600 hidden sm:block">
              {user.name}
            </span>
            <button
              onClick={handleLogout}
              className="text-sm text-gray-600 hover:text-primary-600 transition-colors"
            >
              Logout
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
};

