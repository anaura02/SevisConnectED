/**
 * Footer Component
 * Site footer for all pages
 */
import { Link } from 'react-router-dom';

export const Footer: React.FC = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-gray-900 text-gray-300 border-t border-gray-800">
      <div className="container mx-auto px-4 py-12">
        <div className="grid md:grid-cols-4 gap-8">
          {/* Brand Section */}
          <div className="md:col-span-1">
            <Link to="/" className="flex items-center space-x-2 mb-4">
              <span className="text-2xl font-bold text-white">AI Teacher</span>
            </Link>
            <p className="text-sm text-gray-400">
              Personalized AI-powered learning platform for PNG senior secondary students.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-white font-semibold mb-4">Quick Links</h3>
            <ul className="space-y-2">
              <li>
                <Link to="/" className="text-gray-400 hover:text-primary-400 transition-colors text-sm">
                  Home
                </Link>
              </li>
              <li>
                <Link to="/dashboard" className="text-gray-400 hover:text-primary-400 transition-colors text-sm">
                  Dashboard
                </Link>
              </li>
              <li>
                <Link to="/study-plan" className="text-gray-400 hover:text-primary-400 transition-colors text-sm">
                  Study Plan
                </Link>
              </li>
              <li>
                <Link to="/tutor" className="text-gray-400 hover:text-primary-400 transition-colors text-sm">
                  AI Tutor
                </Link>
              </li>
            </ul>
          </div>

          {/* Features */}
          <div>
            <h3 className="text-white font-semibold mb-4">Features</h3>
            <ul className="space-y-2">
              <li>
                <Link to="/diagnostic" className="text-gray-400 hover:text-primary-400 transition-colors text-sm">
                  Exams & Tests
                </Link>
              </li>
              <li>
                <Link to="/progress" className="text-gray-400 hover:text-primary-400 transition-colors text-sm">
                  Progress Tracking
                </Link>
              </li>
              <li>
                <span className="text-gray-400 text-sm">Personalized Learning</span>
              </li>
              <li>
                <span className="text-gray-400 text-sm">AI-Powered Tutoring</span>
              </li>
            </ul>
          </div>

          {/* Contact/Info */}
          <div>
            <h3 className="text-white font-semibold mb-4">About</h3>
            <ul className="space-y-2">
              <li>
                <span className="text-gray-400 text-sm">For Grade 11-12 Students</span>
              </li>
              <li>
                <span className="text-gray-400 text-sm">Mathematics & English</span>
              </li>
              <li>
                <span className="text-gray-400 text-sm">Adaptive Learning</span>
              </li>
              <li>
                <span className="text-gray-400 text-sm">Performance Analytics</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-gray-800 mt-8 pt-8 flex flex-col md:flex-row justify-between items-center">
          <p className="text-sm text-gray-400 mb-4 md:mb-0">
            © {currentYear} AI Teacher. All rights reserved.
          </p>
          <div className="flex items-center space-x-6">
            <span className="text-sm text-gray-400">Made with ❤️ for PNG Students</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

