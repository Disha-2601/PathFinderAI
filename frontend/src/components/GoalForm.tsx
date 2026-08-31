import React, { useState } from 'react';
import { Sparkles, ArrowRight, Lightbulb, Clock, Compass } from 'lucide-react';

interface GoalFormProps {
  onSubmit: (prompt: string) => void;
  isLoading?: boolean;
}

const SAMPLE_PROMPTS = [
  'I want to become a Senior AI & Backend Solutions Architect in 6 months with 15 hours/week focused on LLMs, RAG, and FastAPI.',
  'I want to transition from frontend to Full-Stack AI Engineer in 3 months studying 10 hours per week through hands-on projects.',
  'I want to master High-Performance Distributed Systems in Go and Rust within 4 months dedicating 12 hours weekly.',
  'I want to build Autonomous Multi-Agent AI systems using Python, pgvector, and tool orchestration in 8 weeks.'
];

export const GoalForm: React.FC<GoalFormProps> = ({ onSubmit, isLoading = false }) => {
  const [prompt, setPrompt] = useState<string>('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim() || isLoading) return;
    onSubmit(prompt.trim());
  };

  const handleSelectSample = (sample: string) => {
    setPrompt(sample);
  };

  return (
    <div className="w-full bg-slate-900/70 border border-slate-800/80 rounded-2xl p-6 sm:p-8 backdrop-blur-xl shadow-2xl relative overflow-hidden">
      {/* Decorative background ambient glow */}
      <div className="absolute -top-24 -right-24 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10">
        <div className="flex items-center space-x-2.5 mb-3 min-w-0">
          <div className="p-2 rounded-lg bg-cyan-950/80 border border-cyan-500/30 text-cyan-400">
            <Sparkles className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight break-words [overflow-wrap:anywhere]">
              Synthesize Your Next Career Milestone
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 break-words">
              Powered by Google Gemini 2.5 Flash & 384-dimensional vector similarity ranking
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          <div className="relative">
            <textarea
              rows={4}
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              maxLength={1200}
              placeholder="Describe your career aspiration, target timeframe, weekly study availability, and technical domains (e.g. 'I want to become a Backend AI Engineer in 3 months with 12 hours/week')..."
              className="w-full px-4 py-3.5 bg-slate-950/80 border border-slate-700/80 rounded-xl text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-400 transition-all text-sm sm:text-base leading-relaxed resize-y min-h-32 max-h-72 shadow-inner break-words [overflow-wrap:anywhere]"
              disabled={isLoading}
            />
            <div className="absolute bottom-3 right-3 text-xs text-slate-500 bg-slate-950/80 px-1.5 py-0.5 rounded">
              {prompt.length}/1200
            </div>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-1">
            <div className="flex items-center space-x-4 text-xs text-slate-400">
              <span className="flex items-center space-x-1.5">
                <Clock className="w-3.5 h-3.5 text-cyan-400" />
                <span>Paced Scheduling</span>
              </span>
              <span className="flex items-center space-x-1.5">
                <Compass className="w-3.5 h-3.5 text-indigo-400" />
                <span>Prerequisite DAG</span>
              </span>
            </div>

            <button
              type="submit"
              disabled={!prompt.trim() || isLoading}
              className={`flex items-center justify-center space-x-2 px-6 py-3 rounded-xl font-semibold text-sm transition-all shadow-lg ${
                !prompt.trim() || isLoading
                  ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700/50'
                  : 'bg-gradient-to-r from-cyan-500 via-indigo-500 to-purple-600 hover:from-cyan-400 hover:to-purple-500 text-white shadow-cyan-500/25 hover:shadow-cyan-500/40 hover:scale-[1.01] active:scale-[0.99]'
              }`}
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Synthesizing Pathway...</span>
                </>
              ) : (
                <>
                  <span>Generate Career Pathway</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </form>

        {/* Sample Prompt Quick Select */}
        <div className="mt-6 pt-5 border-t border-slate-800/80">
          <div className="flex items-center space-x-2 text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
            <Lightbulb className="w-3.5 h-3.5 text-amber-400" />
            <span>Sample Prompts (Click to Populate)</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {SAMPLE_PROMPTS.map((sample, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleSelectSample(sample)}
              className="text-left p-3 rounded-xl bg-slate-950/50 hover:bg-slate-800/60 border border-slate-800/60 hover:border-cyan-500/30 text-xs text-slate-300 hover:text-white transition-all group min-w-0"
            >
                <p className="line-clamp-2 leading-relaxed break-words [overflow-wrap:anywhere]">
                  "{sample}"
                </p>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
