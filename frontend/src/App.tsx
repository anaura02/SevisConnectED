import { useState } from 'react';
import { useAuth } from './context/AuthContext';
import { useStudyPlan } from './context/StudyPlanContext';

function App() {
  const { user, loading: authLoading, login, logout } = useAuth();
  const { learningPath, weaknessProfile, loading: studyPlanLoading } = useStudyPlan();
  const [testResult, setTestResult] = useState<string>('');

  const testContextLogin = async () => {
    setTestResult('Testing Context login...');
    
    try {
      await login('test-context-123', 'Context Test User', 11, 'Test School');
      setTestResult(`✅ Context Login Successful!\n\nUser: ${user?.name}\nGrade: ${user?.grade_level}\nSchool: ${user?.school}`);
    } catch (error: any) {
      setTestResult(`❌ Context Login Failed: ${error.message || 'Unknown error'}`);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-primary-700 mb-4">
          SevisConnectED
        </h1>
        <p className="text-gray-600 mb-6">
          Context providers set up! Ready to build pages.
        </p>
        
        <div className="bg-white rounded-lg shadow p-6 max-w-2xl mb-6">
          <h2 className="text-xl font-semibold mb-4">Context Test</h2>
          
          {user ? (
            <div className="space-y-4">
              <div className="bg-green-50 border border-green-200 rounded p-4">
                <p className="font-semibold text-green-800 mb-2">✅ User Logged In</p>
                <div className="text-sm text-green-700">
                  <p><strong>Name:</strong> {user.name}</p>
                  <p><strong>Grade:</strong> {user.grade_level}</p>
                  <p><strong>School:</strong> {user.school}</p>
                  <p><strong>SevisPass ID:</strong> {user.sevis_pass_id}</p>
                </div>
              </div>
              <button
                onClick={logout}
                className="bg-red-600 text-white px-6 py-2 rounded-md hover:bg-red-700 transition-colors"
              >
                Logout
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <button
                onClick={testContextLogin}
                disabled={authLoading}
                className="bg-primary-600 text-white px-6 py-2 rounded-md hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {authLoading ? 'Logging in...' : 'Test Context Login'}
              </button>
              
              {testResult && (
                <div className={`p-4 rounded ${
                  testResult.includes('✅') 
                    ? 'bg-green-50 text-green-800 border border-green-200' 
                    : 'bg-red-50 text-red-800 border border-red-200'
                }`}>
                  <p className="font-mono text-sm whitespace-pre-line">{testResult}</p>
                </div>
              )}
            </div>
          )}
          
          <div className="mt-6 text-sm text-gray-600">
            <p className="font-semibold mb-2">What this tests:</p>
            <ul className="list-disc list-inside space-y-1">
              <li>AuthContext provider working</li>
              <li>User state management</li>
              <li>Login/logout functionality</li>
              <li>LocalStorage persistence</li>
            </ul>
          </div>
        </div>

        {user && (
          <div className="bg-white rounded-lg shadow p-6 max-w-2xl">
            <h2 className="text-xl font-semibold mb-4">Study Plan Context</h2>
            <div className="text-sm text-gray-600 space-y-2">
              <p><strong>Learning Path:</strong> {learningPath ? 'Loaded' : 'Not loaded'}</p>
              <p><strong>Weakness Profile:</strong> {weaknessProfile ? 'Loaded' : 'Not loaded'}</p>
              {studyPlanLoading && <p className="text-primary-600">Loading study plan data...</p>}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
