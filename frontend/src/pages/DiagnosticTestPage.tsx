/**
 * Diagnostic Test Page - Initial assessment for students
 * Identifies which students need help based on their performance
 */
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { diagnosticApi, weaknessApi } from '../api/services';
import type { DiagnosticAnswer } from '../types';

interface Question {
  id: number;
  subject: 'math';
  question: string;
  correct_answer: string;
  type: 'text' | 'multiple_choice';
  options?: string[];
}

// Mock questions for MVP - In production, these would come from backend
// Only Mathematics questions now
const MOCK_QUESTIONS: Question[] = [
    {
      id: 1,
      subject: 'math',
      question: 'Solve for x: 2x + 5 = 15',
      correct_answer: 'x = 5',
      type: 'text',
    },
    {
      id: 2,
      subject: 'math',
      question: 'What is the area of a circle with radius 7? (Use π = 3.14)',
      correct_answer: '153.86',
      type: 'text',
    },
    {
      id: 3,
      subject: 'math',
      question: 'Simplify: 3(x + 2) - 2x',
      correct_answer: 'x + 6',
      type: 'text',
    },
    {
      id: 4,
      subject: 'math',
      question: 'What is 15% of 200?',
      correct_answer: '30',
      type: 'multiple_choice',
      options: ['25', '30', '35', '40'],
    },
    {
      id: 5,
      subject: 'math',
      question: 'Calculate: √144',
      correct_answer: '12',
      type: 'multiple_choice',
      options: ['10', '11', '12', '13'],
    },
];

export const DiagnosticTestPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const subject: 'math' = 'math'; // Only math now
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [timeStarted, setTimeStarted] = useState<Date | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [results, setResults] = useState<any>(null);

  const questions = MOCK_QUESTIONS;
  const currentQuestion = questions[currentQuestionIndex];
  const isLastQuestion = currentQuestionIndex === questions.length - 1;
  const allAnswered = Object.keys(answers).length === questions.length;

  useEffect(() => {
    if (!timeStarted) {
      setTimeStarted(new Date());
    }
  }, [timeStarted]);

  const handleAnswerChange = (questionId: number, answer: string) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: answer,
    }));
  };

  const handleNext = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    }
  };

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };

  const calculateScore = (studentAnswer: string, correctAnswer: string): number => {
    // Simple scoring: exact match = 1.0, partial match = 0.5, wrong = 0.0
    const normalizedStudent = studentAnswer.trim().toLowerCase();
    const normalizedCorrect = correctAnswer.trim().toLowerCase();
    
    if (normalizedStudent === normalizedCorrect) {
      return 1.0;
    }
    // Check if answer contains correct answer (for partial credit)
    if (normalizedStudent.includes(normalizedCorrect) || normalizedCorrect.includes(normalizedStudent)) {
      return 0.5;
    }
    return 0.0;
  };

  const handleSubmit = async () => {
    if (!user?.sevis_pass_id) {
      setError('User not found. Please log in again.');
      return;
    }

    if (!allAnswered) {
      setError('Please answer all questions before submitting.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Prepare answers for submission
      const diagnosticAnswers: DiagnosticAnswer[] = questions.map((q) => {
        const studentAnswer = answers[q.id] || '';
        const correctAnswer = q.correct_answer;
        const isCorrect = studentAnswer.trim().toLowerCase() === correctAnswer.trim().toLowerCase();
        const score = calculateScore(studentAnswer, correctAnswer);
        
        // Calculate time taken (simple: assume 30 seconds per question for MVP)
        const timeTaken = 30;

        return {
          subject: q.subject,
          question: q.question,
          student_answer: studentAnswer,
          correct_answer: correctAnswer,
          is_correct: isCorrect,
          score: score,
          time_taken_seconds: timeTaken,
        };
      });

      // Submit diagnostic answers
      const submitResponse = await diagnosticApi.submit({
        sevis_pass_id: user.sevis_pass_id,
        answers: diagnosticAnswers,
      });

      if (submitResponse.status === 'success') {
        setSubmitted(true);
        setResults(submitResponse.data);

        // Automatically trigger weakness analysis
        try {
          const analysisResponse = await weaknessApi.analyze({
            sevis_pass_id: user.sevis_pass_id,
            subject: subject,
          });

          if (analysisResponse.status === 'success') {
            // Navigate to study plan or show results
            setTimeout(() => {
              navigate('/study-plan', { 
                state: { 
                  weaknessProfile: analysisResponse.data,
                  diagnosticResults: submitResponse.data,
                } 
              });
            }, 2000);
          }
        } catch (analysisError: any) {
          console.error('Weakness analysis error:', analysisError);
          // Still show diagnostic results even if analysis fails
        }
      } else {
        throw new Error(submitResponse.message || 'Failed to submit diagnostic');
      }
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || err.message || 'Failed to submit diagnostic test';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  if (submitted && results) {
    const correctCount = results.diagnostics?.filter((d: any) => d.is_correct).length || 0;
    const totalCount = results.count || questions.length;
    const percentage = Math.round((correctCount / totalCount) * 100);

    return (
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-2xl mx-auto">
            <div className="bg-white rounded-lg shadow-md p-8 text-center">
              <div className="text-6xl mb-4">✅</div>
              <h1 className="text-3xl font-bold text-gray-900 mb-4">Diagnostic Test Submitted!</h1>
              <div className="bg-primary-50 rounded-lg p-6 mb-6">
                <p className="text-2xl font-bold text-primary-600 mb-2">
                  Score: {correctCount} / {totalCount}
                </p>
                <p className="text-xl text-gray-700">
                  {percentage}% Correct
                </p>
              </div>
              <p className="text-gray-600 mb-6">
                Your answers have been analyzed. We're generating your personalized weakness profile...
              </p>
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
              <p className="text-sm text-gray-500 mt-4">Redirecting to your study plan...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-3xl mx-auto">
          {/* Header */}
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Diagnostic Test</h1>
            <p className="text-gray-600">
              This assessment helps us identify your strengths and areas for improvement
            </p>
          </div>

          {/* Subject Selector */}
          <div className="bg-white rounded-lg shadow-md p-4 mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Subject
            </label>
            <div className="flex gap-4">
              <button
                onClick={() => {
                  setSubject('math');
                  setCurrentQuestionIndex(0);
                  setAnswers({});
                  setTimeStarted(null);
                }}
                className={`flex-1 px-4 py-2 rounded-md font-medium transition-colors ${
                  subject === 'math'
                    ? 'bg-primary-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                📐 Mathematics
              </button>
              <button
                onClick={() => {
                  setSubject('english');
                  setCurrentQuestionIndex(0);
                  setAnswers({});
                  setTimeStarted(null);
                }}
                className={`flex-1 px-4 py-2 rounded-md font-medium transition-colors ${
                  subject === 'english'
                    ? 'bg-primary-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                📚 English
              </button>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="bg-white rounded-lg shadow-md p-4 mb-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">
                Question {currentQuestionIndex + 1} of {questions.length}
              </span>
              <span className="text-sm text-gray-500">
                {Math.round(((currentQuestionIndex + 1) / questions.length) * 100)}% Complete
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-primary-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${((currentQuestionIndex + 1) / questions.length) * 100}%` }}
              ></div>
            </div>
          </div>

          {/* Question Card */}
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <div className="mb-4">
              <span className="inline-block bg-primary-100 text-primary-700 px-3 py-1 rounded-full text-sm font-medium mb-4">
                Mathematics
              </span>
              <h2 className="text-xl font-semibold text-gray-900 mt-2">
                {currentQuestion.question}
              </h2>
            </div>

            {/* Answer Input */}
            <div className="mt-6">
              {currentQuestion.type === 'multiple_choice' && currentQuestion.options ? (
                <div className="space-y-3">
                  {currentQuestion.options.map((option, index) => (
                    <label
                      key={index}
                      className={`flex items-center p-4 border-2 rounded-lg cursor-pointer transition-colors ${
                        answers[currentQuestion.id] === option
                          ? 'border-primary-600 bg-primary-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <input
                        type="radio"
                        name={`question-${currentQuestion.id}`}
                        value={option}
                        checked={answers[currentQuestion.id] === option}
                        onChange={(e) => handleAnswerChange(currentQuestion.id, e.target.value)}
                        className="mr-3 h-4 w-4 text-primary-600 focus:ring-primary-500"
                      />
                      <span className="text-gray-900">{option}</span>
                    </label>
                  ))}
                </div>
              ) : (
                <textarea
                  value={answers[currentQuestion.id] || ''}
                  onChange={(e) => handleAnswerChange(currentQuestion.id, e.target.value)}
                  placeholder="Type your answer here..."
                  className="w-full px-4 py-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
                  rows={4}
                />
              )}
            </div>
          </div>

          {/* Navigation Buttons */}
          <div className="flex justify-between items-center mb-6">
            <button
              onClick={handlePrevious}
              disabled={currentQuestionIndex === 0}
              className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              ← Previous
            </button>

            <div className="flex gap-2">
              {questions.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentQuestionIndex(index)}
                  className={`w-8 h-8 rounded-full text-sm font-medium transition-colors ${
                    index === currentQuestionIndex
                      ? 'bg-primary-600 text-white'
                      : answers[questions[index].id]
                      ? 'bg-green-500 text-white'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  {index + 1}
                </button>
              ))}
            </div>

            {isLastQuestion ? (
              <button
                onClick={handleSubmit}
                disabled={!allAnswered || loading}
                className="px-6 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
              >
                {loading ? 'Submitting...' : 'Submit Test'}
              </button>
            ) : (
              <button
                onClick={handleNext}
                className="px-6 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors"
              >
                Next →
              </button>
            )}
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md mb-6">
              {error}
            </div>
          )}

          {/* Instructions */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="font-semibold text-blue-900 mb-2">📝 Instructions</h3>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Answer all questions before submitting</li>
              <li>• You can navigate between questions using Previous/Next buttons</li>
              <li>• Green dots indicate answered questions</li>
              <li>• Your answers will be analyzed to create a personalized learning path</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

