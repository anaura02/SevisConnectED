/**
 * Practice Exercise Modal Component
 * Displays practice exercises in a modal with interactive question-answer interface
 */
import React, { useState } from 'react';

interface Question {
  question: string;
  hints?: string[];
  solution: string;
  explanation: string;
}

interface PracticeExercise {
  title: string;
  description: string;
  difficulty_level?: string;
  questions: Question[];
}

interface PracticeExerciseModalProps {
  exercise: PracticeExercise;
  isOpen: boolean;
  onClose: () => void;
}

export const PracticeExerciseModal: React.FC<PracticeExerciseModalProps> = ({
  exercise,
  isOpen,
  onClose,
}) => {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState<Record<number, string>>({});
  const [submittedAnswers, setSubmittedAnswers] = useState<Record<number, boolean>>({});
  const [showHints, setShowHints] = useState<Record<number, boolean>>({});
  const [showExplanation, setShowExplanation] = useState<Record<number, boolean>>({});

  if (!isOpen) return null;

  const currentQuestion = exercise.questions[currentQuestionIndex];
  const userAnswer = userAnswers[currentQuestionIndex] || '';
  const isSubmitted = submittedAnswers[currentQuestionIndex] || false;
  const isCorrect = isSubmitted && 
    normalizeAnswer(userAnswer) === normalizeAnswer(currentQuestion.solution);
  const showHint = showHints[currentQuestionIndex] || false;
  const showExp = showExplanation[currentQuestionIndex] || false;

  const handleAnswerChange = (value: string) => {
    setUserAnswers((prev) => ({
      ...prev,
      [currentQuestionIndex]: value,
    }));
  };

  const normalizeAnswer = (answer: string): string => {
    // Remove extra whitespace, convert to lowercase, remove common punctuation
    return answer
      .trim()
      .toLowerCase()
      .replace(/\s+/g, ' ') // Normalize whitespace
      .replace(/[.,;:!?]/g, '') // Remove punctuation
      .replace(/\s*=\s*/g, '=') // Normalize equals signs
      .trim();
  };

  const handleSubmitAnswer = () => {
    if (!userAnswer.trim()) {
      alert('Please enter an answer before submitting.');
      return;
    }
    setSubmittedAnswers((prev) => ({
      ...prev,
      [currentQuestionIndex]: true,
    }));
    setShowExplanation((prev) => ({
      ...prev,
      [currentQuestionIndex]: true,
    }));
  };

  const handleNextQuestion = () => {
    if (currentQuestionIndex < exercise.questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    }
  };

  const handlePreviousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };

  const handleToggleHint = () => {
    setShowHints((prev) => ({
      ...prev,
      [currentQuestionIndex]: !prev[currentQuestionIndex],
    }));
  };

  const handleReset = () => {
    setCurrentQuestionIndex(0);
    setUserAnswers({});
    setSubmittedAnswers({});
    setShowHints({});
    setShowExplanation({});
  };

  const getDifficultyColor = (difficulty?: string) => {
    switch (difficulty?.toLowerCase()) {
      case 'beginner':
        return 'bg-green-100 text-green-800 border-green-300';
      case 'intermediate':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'advanced':
        return 'bg-red-100 text-red-800 border-red-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const progress = ((currentQuestionIndex + 1) / exercise.questions.length) * 100;
  const completedCount = Object.keys(submittedAnswers).length;
  const correctCount = Object.entries(submittedAnswers).filter(
    ([index, _]) => {
      const idx = parseInt(index);
      const userAns = userAnswers[idx] || '';
      const correctAns = exercise.questions[idx]?.solution || '';
      return normalizeAnswer(userAns) === normalizeAnswer(correctAns);
    }
  ).length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-primary-500 to-primary-700 text-white p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-2xl font-bold">{exercise.title}</h2>
              {exercise.difficulty_level && (
                <span className={`inline-block mt-2 px-3 py-1 rounded-full text-sm font-medium border ${getDifficultyColor(exercise.difficulty_level)}`}>
                  {exercise.difficulty_level}
                </span>
              )}
            </div>
            <button
              onClick={onClose}
              className="text-white hover:text-gray-200 transition-colors text-2xl font-bold w-8 h-8 flex items-center justify-center rounded-full hover:bg-white hover:bg-opacity-20"
              aria-label="Close"
            >
              ×
            </button>
          </div>
          {exercise.description && (
            <p className="text-primary-50 text-sm">{exercise.description}</p>
          )}
          
          {/* Progress Bar */}
          <div className="mt-4">
            <div className="flex items-center justify-between text-sm mb-2">
              <span>Question {currentQuestionIndex + 1} of {exercise.questions.length}</span>
              <span className="font-semibold">
                {completedCount}/{exercise.questions.length} completed
                {completedCount > 0 && ` • ${correctCount} correct`}
              </span>
            </div>
            <div className="w-full bg-white bg-opacity-30 rounded-full h-2">
              <div
                className="bg-white h-2 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              ></div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Question */}
          <div className="mb-6">
            <div className="bg-primary-50 border-l-4 border-primary-500 p-4 rounded-r-lg mb-4">
              <h3 className="font-semibold text-gray-900 mb-2">Question {currentQuestionIndex + 1}</h3>
              <p className="text-gray-700 whitespace-pre-wrap">{currentQuestion.question}</p>
            </div>

            {/* Answer Input */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Your Answer:
              </label>
              <textarea
                value={userAnswer}
                onChange={(e) => handleAnswerChange(e.target.value)}
                disabled={isSubmitted}
                placeholder="Enter your answer here..."
                className={`w-full px-4 py-3 border-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all ${
                  isSubmitted
                    ? isCorrect
                      ? 'border-green-500 bg-green-50'
                      : 'border-red-500 bg-red-50'
                    : 'border-gray-300 focus:border-primary-500'
                }`}
                rows={4}
              />
            </div>

            {/* Submit Button */}
            {!isSubmitted && (
              <div className="flex gap-3 mb-4">
                <button
                  onClick={handleSubmitAnswer}
                  className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-medium"
                >
                  Submit Answer
                </button>
                {currentQuestion.hints && currentQuestion.hints.length > 0 && (
                  <button
                    onClick={handleToggleHint}
                    className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium"
                  >
                    {showHint ? 'Hide Hint' : 'Show Hint'}
                  </button>
                )}
              </div>
            )}

            {/* Hint */}
            {showHint && currentQuestion.hints && currentQuestion.hints.length > 0 && (
              <div className="mb-4 bg-yellow-50 border-l-4 border-yellow-500 p-4 rounded-r-lg">
                <p className="font-semibold text-yellow-900 mb-2">💡 Hint:</p>
                <ul className="list-disc list-inside text-yellow-800 space-y-1">
                  {currentQuestion.hints.map((hint, idx) => (
                    <li key={idx}>{hint}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Feedback */}
            {isSubmitted && (
              <div className={`mb-4 p-4 rounded-lg border-2 ${
                isCorrect
                  ? 'bg-green-50 border-green-500'
                  : 'bg-red-50 border-red-500'
              }`}>
                <div className="flex items-start gap-3">
                  <span className="text-2xl">
                    {isCorrect ? '✅' : '❌'}
                  </span>
                  <div className="flex-1">
                    <p className={`font-semibold mb-2 ${
                      isCorrect ? 'text-green-900' : 'text-red-900'
                    }`}>
                      {isCorrect ? 'Correct!' : 'Incorrect'}
                    </p>
                    {!isCorrect && (
                      <div className="mb-3">
                        <p className="text-sm font-medium text-red-800 mb-1">Correct Answer:</p>
                        <p className="text-red-900 bg-white p-2 rounded border border-red-200">
                          {currentQuestion.solution}
                        </p>
                      </div>
                    )}
                    {showExp && (
                      <div className="mt-3">
                        <p className="text-sm font-medium text-gray-800 mb-1">Explanation:</p>
                        <p className="text-gray-700 bg-white p-3 rounded border border-gray-200 whitespace-pre-wrap">
                          {currentQuestion.explanation}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer - Navigation */}
        <div className="border-t bg-gray-50 p-4 flex items-center justify-between">
          <div className="flex gap-3">
            <button
              onClick={handlePreviousQuestion}
              disabled={currentQuestionIndex === 0}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
            >
              ← Previous
            </button>
            <button
              onClick={handleNextQuestion}
              disabled={currentQuestionIndex === exercise.questions.length - 1}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
            >
              Next →
            </button>
          </div>
          <div className="flex gap-3">
            <button
              onClick={handleReset}
              className="px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition-colors font-medium"
            >
              Reset
            </button>
            <button
              onClick={onClose}
              className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-medium"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

