/**
 * Study Plan Page - Comprehensive syllabus and personalized learning path
 * Shows AI-generated syllabus, week-by-week plan with detailed learning materials
 * Tailored for Grade 11-12 students with expanded explanations
 * Redesigned with card-based layout for better UX
 */
import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useStudyPlan } from '../context/StudyPlanContext';
import { VideoPlayer } from '../components/VideoPlayer';
import { FloatingChatbot } from '../components/FloatingChatbot';
import type { WeaknessProfile, LearningPath, Syllabus, LearningMaterial } from '../types';

export const StudyPlanPage: React.FC = () => {
  const { user } = useAuth();
  const location = useLocation();
  const {
    learningPath,
    weaknessProfile,
    loading,
    error,
    loadWeaknessProfile,
    generateLearningPath,
  } = useStudyPlan();

  const subject: 'math' = 'math';
  const [generating, setGenerating] = useState(false);
  const [expandedWeek, setExpandedWeek] = useState<string | null>(null);
  const [expandedNote, setExpandedNote] = useState<string | null>(null);
  
  // Card expansion states
  const [expandedCards, setExpandedCards] = useState({
    performance: true, // Performance Analysis expanded by default
    syllabus: false,
    learningPath: false,
  });

  // Load weakness profile and learning path when user changes
  useEffect(() => {
    if (!user?.sevis_pass_id) return;
    
    if (weaknessProfile && learningPath) {
      return;
    }

    const loadData = async () => {
      try {
        if (!weaknessProfile) {
          await loadWeaknessProfile(user.sevis_pass_id, subject);
        }
        if (!learningPath) {
          await generateLearningPath(user.sevis_pass_id, subject);
        }
      } catch (err) {
        console.error('Failed to load study plan data:', err);
      }
    };

    loadData();
  }, [user?.sevis_pass_id, subject]);

  const handleGeneratePlan = async () => {
    if (!user?.sevis_pass_id) return;

    setGenerating(true);
    try {
      await generateLearningPath(user.sevis_pass_id, subject);
    } catch (err) {
      console.error('Failed to generate study plan:', err);
    } finally {
      setGenerating(false);
    }
  };

  const toggleCard = (cardName: 'performance' | 'syllabus' | 'learningPath') => {
    setExpandedCards((prev) => ({
      ...prev,
      [cardName]: !prev[cardName],
    }));
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner':
        return 'bg-green-100 text-green-800';
      case 'intermediate':
        return 'bg-yellow-100 text-yellow-800';
      case 'advanced':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getWeaknessSeverity = (score: number) => {
    if (score < 0.3) return { label: 'Critical', color: 'text-red-600' };
    if (score < 0.5) return { label: 'High', color: 'text-orange-600' };
    if (score < 0.7) return { label: 'Medium', color: 'text-yellow-600' };
    return { label: 'Low', color: 'text-green-600' };
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">My Study Plan</h1>
            <p className="text-gray-600">
              Comprehensive syllabus and personalized learning path for Grade {user?.grade_level} {subject}
            </p>
          </div>

          {/* Loading State */}
          {loading && !weaknessProfile && (
            <div className="bg-white rounded-lg shadow-md p-8 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
              <p className="text-gray-600 mb-2">Generating your personalized study plan...</p>
              <p className="text-sm text-gray-500">This may take 60-90 seconds. Please wait...</p>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md mb-6">
              {error}
            </div>
          )}

          {/* Card Grid */}
          <div className="space-y-6">
            {/* Performance Analysis Card */}
            {weaknessProfile && (
              <div className="bg-white rounded-lg shadow-md overflow-hidden border border-gray-200">
                <button
                  onClick={() => toggleCard('performance')}
                  className="w-full p-6 flex items-center justify-between hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center">
                      <span className="text-2xl">📊</span>
                    </div>
                    <div className="text-left">
                      <h2 className="text-xl font-bold text-gray-900">Performance Analysis</h2>
                      <p className="text-sm text-gray-600">Your strengths, weaknesses, and baseline score</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="text-2xl font-bold text-primary-600">
                        {weaknessProfile.baseline_score.toFixed(1)}%
                      </p>
                      <p className="text-xs text-gray-500">Baseline Score</p>
                    </div>
                    <span className="text-2xl text-gray-400">
                      {expandedCards.performance ? '▼' : '▶'}
                    </span>
                  </div>
                </button>

                {expandedCards.performance && (
                  <div className="px-6 pb-6 border-t border-gray-200">
                    <div className="pt-6">
                      {/* Overall Score Display */}
                      <div className="bg-gradient-to-r from-primary-50 to-primary-100 rounded-lg p-6 mb-6">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm text-gray-600 mb-1">Baseline Score</p>
                            <p className="text-4xl font-bold text-primary-600">
                              {weaknessProfile.baseline_score.toFixed(1)}%
                            </p>
                            <p className="text-xs text-gray-500 mt-1">
                              Based on diagnostic test and academic performance analysis
                            </p>
                            {weaknessProfile.baseline_score < 60 && (
                              <p className="text-sm text-red-600 mt-2 font-medium">
                                ⚠️ Poor Performance - Comprehensive support provided
                              </p>
                            )}
                          </div>
                          <div className="text-right">
                            <span
                              className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${getDifficultyColor(
                                weaknessProfile.recommended_difficulty
                              )}`}
                            >
                              {weaknessProfile.recommended_difficulty.charAt(0).toUpperCase() +
                                weaknessProfile.recommended_difficulty.slice(1)}
                            </span>
                            <p className="text-xs text-gray-500 mt-2">Recommended Level</p>
                          </div>
                        </div>
                      </div>

                      {/* Weaknesses and Strengths */}
                      <div className="grid md:grid-cols-2 gap-6">
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                            <span className="text-red-500 mr-2">⚠️</span>
                            Areas Needing Improvement
                          </h3>
                          {Object.keys(weaknessProfile.weaknesses).length > 0 ? (
                            <div className="space-y-2">
                              {Object.entries(weaknessProfile.weaknesses).map(([topic, score]) => {
                                const severity = getWeaknessSeverity(score as number);
                                return (
                                  <div
                                    key={topic}
                                    className="bg-red-50 border border-red-200 rounded-lg p-3"
                                  >
                                    <div className="flex items-center justify-between mb-1">
                                      <span className="font-medium text-gray-900 capitalize">
                                        {topic}
                                      </span>
                                      <span className={`text-sm font-semibold ${severity.color}`}>
                                        {severity.label}
                                      </span>
                                    </div>
                                    <div className="w-full bg-red-200 rounded-full h-2">
                                      <div
                                        className="bg-red-500 h-2 rounded-full"
                                        style={{ width: `${(score as number) * 100}%` }}
                                      ></div>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          ) : (
                            <p className="text-gray-500 text-sm">No specific weaknesses identified</p>
                          )}
                        </div>

                        <div>
                          <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                            <span className="text-green-500 mr-2">✅</span>
                            Your Strengths
                          </h3>
                          {Object.keys(weaknessProfile.strengths).length > 0 ? (
                            <div className="space-y-2">
                              {Object.entries(weaknessProfile.strengths).map(([topic, score]) => (
                                <div
                                  key={topic}
                                  className="bg-green-50 border border-green-200 rounded-lg p-3"
                                >
                                  <div className="flex items-center justify-between mb-1">
                                    <span className="font-medium text-gray-900 capitalize">
                                      {topic}
                                    </span>
                                    <span className="text-sm font-semibold text-green-600">
                                      Strong
                                    </span>
                                  </div>
                                  <div className="w-full bg-green-200 rounded-full h-2">
                                    <div
                                      className="bg-green-500 h-2 rounded-full"
                                      style={{ width: `${(score as number) * 100}%` }}
                                    ></div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <p className="text-gray-500 text-sm">No specific strengths identified</p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Syllabus Card */}
            {learningPath?.syllabus && learningPath.syllabus.modules && learningPath.syllabus.modules.length > 0 && (
              <div className="bg-white rounded-lg shadow-md overflow-hidden border border-gray-200">
                <button
                  onClick={() => toggleCard('syllabus')}
                  className="w-full p-6 flex items-center justify-between hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                      <span className="text-2xl">📚</span>
                    </div>
                    <div className="text-left">
                      <h2 className="text-xl font-bold text-gray-900">Comprehensive Syllabus</h2>
                      <p className="text-sm text-gray-600">
                        {learningPath.syllabus.modules.length} modules covering all essential topics
                      </p>
                    </div>
                  </div>
                  <span className="text-2xl text-gray-400">
                    {expandedCards.syllabus ? '▼' : '▶'}
                  </span>
                </button>

                {expandedCards.syllabus && (
                  <div className="px-6 pb-6 border-t border-gray-200">
                    <div className="pt-6">
                      <div className="mb-6">
                        <h3 className="text-xl font-semibold text-gray-800 mb-2">
                          {learningPath.syllabus.title}
                        </h3>
                        <p className="text-gray-600 mb-3">{learningPath.syllabus.overview}</p>
                        <div className="flex gap-4 text-sm text-gray-500">
                          {learningPath.syllabus.duration && (
                            <span>Duration: {learningPath.syllabus.duration}</span>
                          )}
                          {learningPath.syllabus.total_hours && (
                            <span>Total Hours: {learningPath.syllabus.total_hours}</span>
                          )}
                        </div>
                      </div>

                      {/* Syllabus Modules */}
                      <div className="space-y-4">
                        <h4 className="text-lg font-semibold text-gray-900">Course Modules</h4>
                        {learningPath.syllabus.modules.map((module, index) => (
                          <div
                            key={index}
                            className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                          >
                            <div className="flex items-start justify-between mb-2">
                              <div>
                                <h5 className="font-semibold text-gray-900">
                                  Module {module.module_number}: {module.title}
                                </h5>
                                <p className="text-sm text-gray-600 mt-1">{module.description}</p>
                              </div>
                              {module.estimated_time && (
                                <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                                  {module.estimated_time}
                                </span>
                              )}
                            </div>
                            {module.topics && module.topics.length > 0 && (
                              <div className="mt-2">
                                <p className="text-sm font-medium text-gray-700 mb-1">Topics:</p>
                                <div className="flex flex-wrap gap-2">
                                  {module.topics.map((topic, i) => (
                                    <span
                                      key={i}
                                      className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded"
                                    >
                                      {topic}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            )}
                            {module.learning_objectives && module.learning_objectives.length > 0 && (
                              <div className="mt-3">
                                <p className="text-sm font-medium text-gray-700 mb-1">
                                  Learning Objectives:
                                </p>
                                <ul className="list-disc list-inside text-sm text-gray-600 space-y-1">
                                  {module.learning_objectives.map((obj, i) => (
                                    <li key={i}>{obj}</li>
                                  ))}
                                </ul>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Learning Path Card */}
            {learningPath && learningPath.week_plan && Object.keys(learningPath.week_plan).length > 0 && (
              <div className="bg-white rounded-lg shadow-md overflow-hidden border border-gray-200">
                <button
                  onClick={() => toggleCard('learningPath')}
                  className="w-full p-6 flex items-center justify-between hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                      <span className="text-2xl">📋</span>
                    </div>
                    <div className="text-left">
                      <h2 className="text-xl font-bold text-gray-900">Learning Path</h2>
                      <p className="text-sm text-gray-600">
                        {Object.keys(learningPath.week_plan).length} weeks of structured learning
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <span
                      className={`px-3 py-1 rounded-full text-sm font-medium ${
                        learningPath.status === 'active'
                          ? 'bg-green-100 text-green-800'
                          : learningPath.status === 'completed'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {learningPath.status.charAt(0).toUpperCase() + learningPath.status.slice(1)}
                    </span>
                    <span className="text-2xl text-gray-400">
                      {expandedCards.learningPath ? '▼' : '▶'}
                    </span>
                  </div>
                </button>

                {expandedCards.learningPath && (
                  <div className="px-6 pb-6 border-t border-gray-200">
                    <div className="pt-6">
                      {/* Week Plan */}
                      <div className="space-y-6">
                        {Object.entries(learningPath.week_plan).map(([weekKey, weekPlan]: [string, any]) => {
                          const isExpanded = expandedWeek === weekKey;
                          const weekNumber = weekPlan.week_number || weekKey.replace('week_', '');
                          
                          return (
                            <div
                              key={weekKey}
                              className="border-2 border-gray-200 rounded-lg overflow-hidden"
                            >
                              <button
                                onClick={() => setExpandedWeek(isExpanded ? null : weekKey)}
                                className="w-full bg-gradient-to-r from-primary-50 to-primary-100 p-4 flex items-center justify-between hover:from-primary-100 hover:to-primary-200 transition-colors"
                              >
                                <div className="text-left">
                                  <h3 className="text-lg font-semibold text-gray-900">
                                    Week {weekNumber}: {weekPlan.focus || 'Learning Focus'}
                                  </h3>
                                  {weekPlan.topics && (
                                    <p className="text-sm text-gray-600 mt-1">
                                      Topics: {Array.isArray(weekPlan.topics) ? weekPlan.topics.join(', ') : weekPlan.topics}
                                    </p>
                                  )}
                                </div>
                                <span className="text-2xl">{isExpanded ? '▼' : '▶'}</span>
                              </button>

                              {isExpanded && (
                                <div className="p-6 bg-white">
                                  {weekPlan.goals && Array.isArray(weekPlan.goals) && weekPlan.goals.length > 0 && (
                                    <div className="mb-6">
                                      <h4 className="font-semibold text-gray-900 mb-2">Learning Goals:</h4>
                                      <ul className="list-disc list-inside text-gray-600 space-y-1">
                                        {weekPlan.goals.map((goal: string, i: number) => (
                                          <li key={i}>{goal}</li>
                                        ))}
                                      </ul>
                                    </div>
                                  )}

                                  {weekPlan.learning_materials && (
                                    <div className="space-y-6">
                                      {/* Lecture Notes */}
                                      {weekPlan.learning_materials.lecture_notes &&
                                        weekPlan.learning_materials.lecture_notes.length > 0 && (
                                          <div>
                                            <h4 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                                              <span className="mr-2">📝</span>
                                              Lecture Notes
                                            </h4>
                                            <div className="space-y-4">
                                              {weekPlan.learning_materials.lecture_notes.map(
                                                (note: any, noteIndex: number) => {
                                                  const noteId = `${weekKey}-note-${noteIndex}`;
                                                  const isNoteExpanded = expandedNote === noteId;
                                                  
                                                  return (
                                                    <div
                                                      key={noteIndex}
                                                      className="border border-gray-200 rounded-lg overflow-hidden"
                                                    >
                                                      <button
                                                        onClick={() =>
                                                          setExpandedNote(isNoteExpanded ? null : noteId)
                                                        }
                                                        className="w-full bg-gray-50 p-4 flex items-center justify-between hover:bg-gray-100 transition-colors"
                                                      >
                                                        <h5 className="font-semibold text-gray-900">
                                                          {note.title}
                                                        </h5>
                                                        <span>{isNoteExpanded ? '▼' : '▶'}</span>
                                                      </button>
                                                      {isNoteExpanded && (
                                                        <div className="p-4 bg-white">
                                                          <div className="prose max-w-none">
                                                            <div className="whitespace-pre-wrap text-gray-700">
                                                              {note.content}
                                                            </div>
                                                          </div>
                                                          {note.key_concepts && note.key_concepts.length > 0 && (
                                                            <div className="mt-4">
                                                              <p className="font-semibold text-gray-900 mb-2">
                                                                Key Concepts:
                                                              </p>
                                                              <ul className="list-disc list-inside text-gray-600 space-y-1">
                                                                {note.key_concepts.map((concept: string, i: number) => (
                                                                  <li key={i}>{concept}</li>
                                                                ))}
                                                              </ul>
                                                            </div>
                                                          )}
                                                          {note.examples && note.examples.length > 0 && (
                                                            <div className="mt-4 space-y-3">
                                                              <p className="font-semibold text-gray-900 mb-1">
                                                                Worked Examples:
                                                              </p>
                                                              {note.examples.map((example: any, i: number) => (
                                                                <div
                                                                  key={i}
                                                                  className="bg-blue-50 border border-blue-200 rounded-lg p-3"
                                                                >
                                                                  <p className="font-medium text-gray-900 mb-1">
                                                                    Example {i + 1}:
                                                                  </p>
                                                                  <p className="text-sm text-gray-700 mb-2">
                                                                    <strong>Problem:</strong> {example.problem}
                                                                  </p>
                                                                  <p className="text-sm text-gray-700 mb-2">
                                                                    <strong>Solution:</strong> {example.solution}
                                                                  </p>
                                                                  {example.explanation && (
                                                                    <p className="text-sm text-gray-600 italic">
                                                                      {example.explanation}
                                                                    </p>
                                                                  )}
                                                                </div>
                                                              ))}
                                                            </div>
                                                          )}
                                                        </div>
                                                      )}
                                                    </div>
                                                  );
                                                }
                                              )}
                                            </div>
                                          </div>
                                        )}

                                      {/* Videos */}
                                      {weekPlan.learning_materials.videos &&
                                        weekPlan.learning_materials.videos.length > 0 && (
                                          <div>
                                            <h4 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                                              <span className="mr-2">🎥</span>
                                              Video Resources
                                            </h4>
                                            <div className="space-y-6">
                                              {weekPlan.learning_materials.videos.map(
                                                (video: any, videoIndex: number) => (
                                                  <div
                                                    key={videoIndex}
                                                    className="bg-white border border-gray-200 rounded-lg overflow-hidden"
                                                  >
                                                    {/* Video Player */}
                                                    {video.video_url && (
                                                      <div className="mb-4">
                                                        <VideoPlayer
                                                          videoUrl={video.video_url}
                                                          title={video.title}
                                                          description={video.description}
                                                        />
                                                      </div>
                                                    )}
                                                    
                                                    {/* Video Details */}
                                                    <div className="p-4">
                                                      {!video.video_url && (
                                                        <>
                                                          <h5 className="font-semibold text-gray-900 mb-2">
                                                            {video.title}
                                                          </h5>
                                                          <p className="text-sm text-gray-700 mb-2">
                                                            {video.description}
                                                          </p>
                                                        </>
                                                      )}
                                                      
                                                      {video.key_points && video.key_points.length > 0 && (
                                                        <div className="mb-3">
                                                          <p className="text-sm font-medium text-gray-700 mb-1">
                                                            Key Points:
                                                          </p>
                                                          <ul className="list-disc list-inside text-sm text-gray-600 space-y-1">
                                                            {video.key_points.map((point: string, i: number) => (
                                                              <li key={i}>{point}</li>
                                                            ))}
                                                          </ul>
                                                        </div>
                                                      )}
                                                      
                                                      {video.what_to_focus_on && (
                                                        <div className="mb-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                                                          <p className="text-xs font-medium text-yellow-800 mb-1">
                                                            📌 What to Focus On:
                                                          </p>
                                                          <p className="text-sm text-yellow-700">
                                                            {video.what_to_focus_on}
                                                          </p>
                                                        </div>
                                                      )}
                                                      
                                                      {video.recommended_resources &&
                                                        video.recommended_resources.length > 0 && (
                                                          <div className="mt-3">
                                                            <p className="text-xs font-medium text-gray-700 mb-2">
                                                              Recommended Resources:
                                                            </p>
                                                            <div className="flex flex-wrap gap-2">
                                                              {video.recommended_resources.map(
                                                                (resource: string, i: number) => (
                                                                  <span
                                                                    key={i}
                                                                    className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded"
                                                                  >
                                                                    {resource}
                                                                  </span>
                                                                )
                                                              )}
                                                            </div>
                                                          </div>
                                                        )}
                                                      
                                                      {video.duration && (
                                                        <p className="text-xs text-gray-500 mt-3">
                                                          ⏱️ Duration: {video.duration}
                                                        </p>
                                                      )}
                                                    </div>
                                                  </div>
                                                )
                                              )}
                                            </div>
                                          </div>
                                        )}

                                      {/* Practice Exercises */}
                                      {weekPlan.learning_materials.practice_exercises &&
                                        weekPlan.learning_materials.practice_exercises.length > 0 && (
                                          <div>
                                            <h4 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                                              <span className="mr-2">✏️</span>
                                              Practice Exercises
                                            </h4>
                                            <div className="space-y-4">
                                              {weekPlan.learning_materials.practice_exercises.map(
                                                (exercise: any, exIndex: number) => (
                                                  <div
                                                    key={exIndex}
                                                    className="border border-gray-200 rounded-lg p-4"
                                                  >
                                                    <div className="flex items-start justify-between mb-2">
                                                      <h5 className="font-semibold text-gray-900">
                                                        {exercise.title}
                                                      </h5>
                                                      {exercise.difficulty_level && (
                                                        <span
                                                          className={`text-xs px-2 py-1 rounded ${getDifficultyColor(
                                                            exercise.difficulty_level
                                                          )}`}
                                                        >
                                                          {exercise.difficulty_level}
                                                        </span>
                                                      )}
                                                    </div>
                                                    {exercise.description && (
                                                      <p className="text-sm text-gray-600 mb-3">
                                                        {exercise.description}
                                                      </p>
                                                    )}
                                                  </div>
                                                )
                                              )}
                                            </div>
                                          </div>
                                        )}
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Empty State / Generate Button */}
            {!loading && !weaknessProfile && !error && (
              <div className="bg-white rounded-lg shadow-md p-8 text-center">
                <p className="text-gray-600 mb-4">
                  No study plan available. Complete a diagnostic test first to generate your personalized learning path.
                </p>
                <a
                  href="/diagnostic"
                  className="inline-block bg-primary-600 text-white px-6 py-3 rounded-md hover:bg-primary-700 transition-colors font-medium"
                >
                  Take Diagnostic Test
                </a>
              </div>
            )}

            {/* Generate New Plan Button */}
            {weaknessProfile && (
              <div className="bg-white rounded-lg shadow-md p-6 text-center border border-gray-200">
                <p className="text-gray-600 mb-4">
                  Want to regenerate your study plan with updated information?
                </p>
                <button
                  onClick={handleGeneratePlan}
                  disabled={generating}
                  className="bg-primary-600 text-white px-6 py-3 rounded-md hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
                >
                  {generating ? 'Generating...' : 'Generate New Study Plan'}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Floating Chatbot */}
      <FloatingChatbot subject={subject} />
    </div>
  );
};
