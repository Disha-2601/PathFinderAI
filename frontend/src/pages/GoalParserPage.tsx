import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, ArrowRight, Clock, Award, Compass, BookOpen } from 'lucide-react';
import { GoalForm } from '../components/GoalForm';
import { CourseCard } from '../components/CourseCard';
import { goalsApi } from '../services/api';
import { Course, ParsedGoalData } from '../types';
import { useToast } from '../context/ToastContext';

export const GoalParserPage: React.FC = () => {
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [currentStepText, setCurrentStepText] = useState<string>('');
  const [parsedData, setParsedData] = useState<ParsedGoalData | null>(null);
  const [goalId, setGoalId] = useState<string | null>(null);
  const [recommendations, setRecommendations] = useState<Course[]>([]);
  const { showToast } = useToast();
  const navigate = useNavigate();

  const handleGenerateGoal = async (rawPrompt: string) => {
    try {
      setIsLoading(true);
      setParsedData(null);
      setGoalId(null);
      setRecommendations([]);

      // Step 1: Parse Prompt with AI LLM (Gemini 2.5 Flash)
      setCurrentStepText('Analyzing natural language objectives with Gemini 2.5 Flash...');
      const parseResult = await goalsApi.parse(rawPrompt);
      setParsedData(parseResult.parsed_data);
      setGoalId(parseResult.goal_id);

      // Step 2: Multi-Factor Ranking & Prerequisite Tree Synthesis
      setCurrentStepText('Generating 384-dim dense embeddings & ranking curriculum DAGs...');
      try {
        const recResult = await goalsApi.recommend(
          parseResult.goal_id,
          undefined,
          12,
          parseResult.parsed_data.target_role,
          parseResult.parsed_data.target_skills
        );
        setRecommendations(recResult.recommendations || []);
      } catch (recommendError: any) {
        console.warn('Recommendation refresh failed after goal parse:', recommendError);
      }

      showToast('success', 'Pathway Generated!', `Synthesized curriculum for "${parseResult.parsed_data.target_role}".`);
      navigate(`/pathway/${parseResult.goal_id}`);
    } catch (error: any) {
      console.error('Goal synthesis error:', error);
      showToast('error', 'Synthesis Failed', error.response?.data?.message || 'Failed to synthesize pathway. Please check backend connection.');
    } finally {
      setIsLoading(false);
      setCurrentStepText('');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-fade-in">
      {/* Header */}
      <div>
        <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-purple-950/80 border border-purple-500/30 text-purple-300 text-xs font-semibold mb-3">
          <Sparkles className="w-3.5 h-3.5 animate-pulse" />
          <span>Generative Curriculum Architect</span>
        </div>
        <h1 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight">
          AI Goal Parser & Pathway Synthesizer
        </h1>
        <p className="text-slate-400 text-sm sm:text-base mt-2 max-w-3xl leading-relaxed">
          State your career aspiration in natural language. Our dual-agent engine parses domain entities with Gemini 2.5 Flash and resolves directed prerequisite pathways via 384-dimensional vector similarity.
        </p>
      </div>

      {/* Interactive Prompt Input Form */}
      <GoalForm onSubmit={handleGenerateGoal} isLoading={isLoading} />

      {/* Loading Skeleton / Multi-Step Progress Indicator */}
      {isLoading && (
        <div className="bg-slate-900/90 border border-cyan-500/40 rounded-3xl p-8 backdrop-blur-2xl shadow-2xl space-y-6 animate-pulse">
          <div className="flex items-center space-x-4">
            <div className="w-10 h-10 rounded-2xl bg-cyan-500/20 border border-cyan-400/40 flex items-center justify-center">
              <div className="w-5 h-5 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white tracking-tight">AI Reasoning in Progress...</h3>
              <p className="text-xs sm:text-sm text-cyan-300 font-medium">{currentStepText}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
            <div className="h-20 bg-slate-950/70 rounded-2xl border border-slate-800 animate-pulse" />
            <div className="h-20 bg-slate-950/70 rounded-2xl border border-slate-800 animate-pulse" />
            <div className="h-20 bg-slate-950/70 rounded-2xl border border-slate-800 animate-pulse" />
          </div>
        </div>
      )}

      {/* Synthesized Goal Results & Extracted Parameters */}
      {parsedData && (
        <div className="space-y-6 animate-fade-in">
          {/* Extracted Parameters Card */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 sm:p-8 backdrop-blur-xl shadow-2xl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800/80 pb-6 mb-6">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-cyan-400">Synthesized Career Milestone</span>
                <h2 className="text-xl sm:text-2xl font-extrabold text-white mt-1">
                  {parsedData.target_role}
                </h2>
                {parsedData.notes && (
                  <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-2xl">{parsedData.notes}</p>
                )}
              </div>

              {goalId && (
                <button
                  onClick={() => navigate(`/pathway/${goalId}`)}
                  className="flex items-center space-x-2 px-5 py-3 rounded-xl font-bold text-sm text-white bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 shadow-lg shadow-cyan-600/20 transition-all self-start sm:self-auto"
                >
                  <span>Open Full Roadmap</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Extracted Meta Badges */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800/80">
                <span className="text-xs text-slate-400 flex items-center space-x-1.5 mb-1">
                  <Clock className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Timeline</span>
                </span>
                <span className="text-base font-bold text-white">{parsedData.timeframe_weeks} Weeks</span>
              </div>

              <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800/80">
                <span className="text-xs text-slate-400 flex items-center space-x-1.5 mb-1">
                  <Clock className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Weekly Study</span>
                </span>
                <span className="text-base font-bold text-white">{parsedData.weekly_hours} Hours/wk</span>
              </div>

              <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800/80">
                <span className="text-xs text-slate-400 flex items-center space-x-1.5 mb-1">
                  <Award className="w-3.5 h-3.5 text-purple-400" />
                  <span>Experience Level</span>
                </span>
                <span className="text-base font-bold text-white capitalize">{parsedData.experience_level}</span>
              </div>

              <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800/80">
                <span className="text-xs text-slate-400 flex items-center space-x-1.5 mb-1">
                  <Compass className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Learning Style</span>
                </span>
                <span className="text-base font-bold text-white capitalize">
                  {parsedData.preferred_learning_style.replace(/_/g, ' ')}
                </span>
              </div>
            </div>

            {/* Target Skills Covered */}
            {parsedData.target_skills && parsedData.target_skills.length > 0 && (
              <div className="mt-6 pt-5 border-t border-slate-800/80">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-2.5">
                  Target Technical Skills Identified by LLM:
                </span>
                <div className="flex flex-wrap gap-2">
                  {parsedData.target_skills.map((skill, idx) => (
                    <span
                      key={idx}
                      className="px-3 py-1 rounded-xl bg-cyan-950/70 border border-cyan-500/30 text-cyan-300 text-xs font-semibold"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Recommended Course Cards */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-white tracking-tight flex items-center space-x-2">
                  <BookOpen className="w-4 h-4 text-cyan-400" />
                  <span>Ranked Course Recommendations</span>
                </h3>
                <p className="text-xs text-slate-400">
                  Sorted by composite multi-factor ranking (Coverage, Cosine distance, Prerequisites, Difficulty)
                </p>
              </div>

              <span className="text-xs font-semibold px-3 py-1 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                {recommendations.length} Courses Found
              </span>
            </div>

            <div className="grid grid-cols-1 gap-4">
              {recommendations.map((course, idx) => (
                <CourseCard key={course.id} course={course} stepIndex={idx + 1} />
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
