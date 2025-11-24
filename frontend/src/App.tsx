import { useState } from 'react';
import { authApi } from './api/services';

function App() {
  const [testResult, setTestResult] = useState<string>('');
  const [loading, setLoading] = useState(false);

  const testApiConnection = async () => {
    setLoading(true);
    setTestResult('Testing API connection...');
    
    try {
      // Test login endpoint
      const response = await authApi.login({
        sevis_pass_id: 'test-frontend-123',
        name: 'Frontend Test User',
        grade_level: 11,
        school: 'Test School',
      });
      
      if (response.status === 'success' && response.data) {
        console.log('✅ API Response:', response);
        setTestResult(`✅ API Connection Successful!\n\nUser ID: ${response.data.id}\nName: ${response.data.name}\nGrade: ${response.data.grade_level}\nSchool: ${response.data.school}`);
      } else {
        setTestResult(`❌ API Error: ${response.message || 'Unknown error'}`);
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.message 
        || error.message 
        || 'Could not connect to backend';
      const errorDetails = error.response 
        ? `Status: ${error.response.status}` 
        : 'No response from server';
      setTestResult(`❌ Connection Failed: ${errorMessage}\n${errorDetails}\n\nMake sure:\n- Backend is running on http://127.0.0.1:8000\n- CORS is enabled in Django settings`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-primary-700 mb-4">
          SevisConnectED
        </h1>
        <p className="text-gray-600 mb-6">
          Frontend setup complete! API client ready.
        </p>
        
        <div className="bg-white rounded-lg shadow p-6 max-w-2xl">
          <h2 className="text-xl font-semibold mb-4">API Connection Test</h2>
          <button
            onClick={testApiConnection}
            disabled={loading}
            className="bg-primary-600 text-white px-6 py-2 rounded-md hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? 'Testing...' : 'Test API Connection'}
          </button>
          
          {testResult && (
            <div className={`mt-4 p-4 rounded ${
              testResult.includes('✅') 
                ? 'bg-green-50 text-green-800 border border-green-200' 
                : 'bg-red-50 text-red-800 border border-red-200'
            }`}>
              <p className="font-mono text-sm">{testResult}</p>
            </div>
          )}
          
          <div className="mt-6 text-sm text-gray-600">
            <p className="font-semibold mb-2">What this tests:</p>
            <ul className="list-disc list-inside space-y-1">
              <li>API client configuration</li>
              <li>Connection to backend (http://localhost:8000)</li>
              <li>Login endpoint functionality</li>
              <li>TypeScript types working correctly</li>
            </ul>
            <p className="mt-4 text-xs text-gray-500">
              Make sure your Django backend is running on port 8000
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
