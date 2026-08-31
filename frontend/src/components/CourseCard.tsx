import React, { useState } from 'react';
import { ExternalLink, Star, Clock, ChevronDown, ChevronUp, Award, MessageSquare } from 'lucide-react';
import { Course } from '../types';
import { CourseFeedbackModal } from './CourseFeedbackModal';

interface CourseCardProps {
  course: Course;
  stepIndex?: number;
}

const safeNumber = (value: unknown, fallback: number) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const CourseCardComponent: React.FC<CourseCardProps> = ({ course, stepIndex }) => {
  const [showDetails, setShowDetails] = useState<boolean>(false);
  const [isFeedbackOpen, setIsFeedbackOpen] = useState<boolean>(false);
  const title = course.title || 'Untitled course';
  const provider = course.provider || 'Unknown provider';
  const description = course.description || 'No course description available yet.';
  const url = course.url || '#';

  // Match percentage calculation / formatting
  const matchPct = typeof course.match_percentage === 'number'
    ? course.match_percentage
    : typeof course.match_percentage === 'string'
    ? safeNumber(course.match_percentage, 88)
    : course.score_breakdown?.final_score
    ? Math.round(course.score_breakdown.final_score * 100)
    : 88;
  const boundedMatchPct = Math.min(100, Math.max(0, safeNumber(matchPct, 88)));
  const ratingValue = safeNumber(course.rating, 4.8);
  const costValue = safeNumber(course.cost, 0);
  const durationHours = safeNumber(course.duration_hours, 0);

  const skillGapMatch = course.score_breakdown?.skill_gap_score
    ? Math.round(course.score_breakdown.skill_gap_score * 100)
    : Math.round(matchPct);
  const prerequisiteFit = course.score_breakdown?.prerequisite_fit
    ? Math.round(course.score_breakdown.prerequisite_fit * 100)
    : 90;
  const timeFit = course.score_breakdown?.time_fit
    ? Math.round(course.score_breakdown.time_fit * 100)
    : 85;
  const unmetPrereqs = course.prerequisites?.filter((p) => p.status !== 'met') || [];

  const difficultyColor = {
    beginner: 'bg-emerald-950/80 text-emerald-300 border-emerald-500/30',
    intermediate: 'bg-cyan-950/80 text-cyan-300 border-cyan-500/30',
    advanced: 'bg-indigo-950/80 text-indigo-300 border-indigo-500/30',
    expert: 'bg-purple-950/80 text-purple-300 border-purple-500/30',
  }[course.difficulty?.toLowerCase() || 'intermediate'];

  return (
    <>
      <div className="bg-slate-900/80 border border-slate-800/80 hover:border-cyan-500/40 rounded-2xl p-5 sm:p-6 transition-all duration-300 backdrop-blur-xl shadow-xl hover:shadow-cyan-500/10 group">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          {/* Main Info */}
          <div className="flex-1">
            <div className="flex flex-wrap items-center gap-2 mb-2.5">
              {stepIndex !== undefined && (
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-gradient-to-r from-cyan-500 to-indigo-500 text-white shadow-sm">
                  Step {stepIndex}
                </span>
              )}
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                <span className="block max-w-[10rem] truncate">{provider}</span>
              </span>
              <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full border capitalize ${difficultyColor}`}>
                {course.difficulty}
              </span>
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-slate-800/90 text-slate-300 border border-slate-700">
                {costValue === 0 ? 'Free / Open' : `$${costValue}`}
              </span>
            </div>

            <h3 className="text-lg font-bold text-white group-hover:text-cyan-300 transition-colors leading-snug break-words [overflow-wrap:anywhere]">
              {title}
            </h3>

            <p className="text-xs sm:text-sm text-slate-400 mt-2 line-clamp-2 leading-relaxed break-words">
              {description}
            </p>

            {/* Skills Badges */}
            {course.skills_covered && course.skills_covered.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-3.5">
                {course.skills_covered.map((skill, idx) => {
                  const skillName = (typeof skill === 'string' ? skill : skill.skill_name) || 'Mapped skill';
                  return (
                    <span
                      key={idx}
                      className="max-w-full px-2 py-0.5 rounded-md bg-slate-950/70 border border-slate-800 text-slate-300 text-[11px] font-medium truncate"
                      title={skillName}
                    >
                      {skillName}
                    </span>
                  );
                })}
              </div>
            )}
          </div>

          {/* Match Score & Actions */}
          <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-start gap-3 min-w-[140px] pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-800">
            {/* Match percentage meter */}
            <div className="text-right">
              <div className="flex items-baseline space-x-1 justify-end">
                <span className="text-2xl font-extrabold bg-gradient-to-r from-cyan-400 to-emerald-400 bg-clip-text text-transparent">
                  {Math.round(boundedMatchPct)}%
                </span>
                <span className="text-xs font-semibold text-slate-400">match</span>
              </div>
              <div className="w-24 h-1.5 bg-slate-800 rounded-full overflow-hidden mt-1">
                <div
                  className="h-full bg-gradient-to-r from-cyan-500 to-emerald-400 rounded-full transition-all duration-500"
                  style={{ width: `${Math.max(10, boundedMatchPct)}%` }}
                />
              </div>
            </div>

            {/* Stats row */}
            <div className="flex items-center space-x-3 text-xs text-slate-400">
              <span className="flex items-center space-x-1">
                <Clock className="w-3.5 h-3.5 text-cyan-400" />
                <span>{durationHours}h</span>
              </span>
              <span className="flex items-center space-x-1">
                <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                <span>{ratingValue.toFixed(1)}</span>
              </span>
            </div>

            {/* Buttons */}
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setIsFeedbackOpen(true)}
                title="Rate / Give Feedback"
                className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700/60 transition-all text-xs flex items-center space-x-1"
              >
                <MessageSquare className="w-3.5 h-3.5 text-indigo-400" />
              </button>

              <a
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                aria-disabled={!course.url}
                className="flex items-center space-x-1 px-3 py-1.5 rounded-xl bg-cyan-950/80 hover:bg-cyan-900 border border-cyan-500/40 text-cyan-300 hover:text-white transition-all text-xs font-semibold shadow-sm"
              >
                <span>View Course</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>
        </div>

        {/* Multi-Factor Score Breakdown Trigger */}
        <div className="mt-4 pt-3 border-t border-slate-800/60">
            <div className="flex items-center space-x-1.5 text-xs font-bold text-slate-300 mb-2">
              <Award className="w-3.5 h-3.5 text-cyan-400" />
              <span>Why Recommended?</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 mb-3">
              <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80">
                <span className="text-[11px] font-semibold uppercase text-slate-500">Skill Gap Match</span>
                <p className="text-sm font-extrabold text-cyan-300 mt-0.5">{skillGapMatch}%</p>
              </div>
              <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80">
                <span className="text-[11px] font-semibold uppercase text-slate-500">Prerequisite Status</span>
                <p className={`text-sm font-extrabold mt-0.5 ${unmetPrereqs.length === 0 ? 'text-emerald-300' : 'text-amber-300'}`}>
                  {unmetPrereqs.length === 0 ? `Ready (${prerequisiteFit}%)` : `${unmetPrereqs.length} pending`}
                </p>
              </div>
              <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80">
                <span className="text-[11px] font-semibold uppercase text-slate-500">Time Fit</span>
                <p className="text-sm font-extrabold text-indigo-300 mt-0.5">{timeFit}%</p>
              </div>
            </div>

            {course.score_breakdown && (
              <button
                onClick={() => setShowDetails(!showDetails)}
                className="flex items-center justify-between w-full text-xs font-medium text-slate-400 hover:text-slate-200 transition-colors"
              >
                <span>AI Multi-Factor Ranking Score Breakdown</span>
                {showDetails ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              </button>
            )}

            {course.score_breakdown && showDetails && (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 mt-3 pt-3 border-t border-slate-800/40 animate-fade-in text-xs">
                <div className="p-2 rounded-lg bg-slate-950/60 border border-slate-800/80">
                  <span className="text-slate-400 block">Skill Gap Coverage (30%)</span>
                  <span className="font-bold text-cyan-300">
                    {Math.round(course.score_breakdown.skill_gap_score * 100)}%
                  </span>
                </div>
                <div className="p-2 rounded-lg bg-slate-950/60 border border-slate-800/80">
                  <span className="text-slate-400 block">Vector Similarity (20%)</span>
                  <span className="font-bold text-indigo-300">
                    {Math.round(course.score_breakdown.semantic_similarity * 100)}%
                  </span>
                </div>
                <div className="p-2 rounded-lg bg-slate-950/60 border border-slate-800/80">
                  <span className="text-slate-400 block">Prerequisite Fit (15%)</span>
                  <span className="font-bold text-purple-300">
                    {Math.round(course.score_breakdown.prerequisite_fit * 100)}%
                  </span>
                </div>
                <div className="p-2 rounded-lg bg-slate-950/60 border border-slate-800/80">
                  <span className="text-slate-400 block">Difficulty Alignment (10%)</span>
                  <span className="font-bold text-emerald-300">
                    {Math.round(course.score_breakdown.difficulty_match * 100)}%
                  </span>
                </div>
                <div className="p-2 rounded-lg bg-slate-950/60 border border-slate-800/80">
                  <span className="text-slate-400 block">Time Fit / Pacing (10%)</span>
                  <span className="font-bold text-amber-300">
                    {Math.round(course.score_breakdown.time_fit * 100)}%
                  </span>
                </div>
                <div className="p-2 rounded-lg bg-slate-950/60 border border-slate-800/80">
                  <span className="text-slate-400 block">Feedback & Rating (15%)</span>
                  <span className="font-bold text-rose-300">
                    {Math.round(course.score_breakdown.feedback_rating_score * 100)}%
                  </span>
                </div>
              </div>
            )}
          </div>
      </div>

      {/* Review Modal */}
      <CourseFeedbackModal
        courseId={course.id}
        courseTitle={title}
        isOpen={isFeedbackOpen}
        onClose={() => setIsFeedbackOpen(false)}
      />
    </>
  );
};

export const CourseCard = React.memo(CourseCardComponent);
