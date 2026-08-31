import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  Map,
  Compass,
  Clock,
  Sparkles,
  ArrowLeft,
  CheckCircle2,
  Lock,
  PlayCircle,
  Wand2,
  X,
  ExternalLink,
  SlidersHorizontal,
  CalendarDays,
  GitBranch,
  BookOpen,
  Check,
  AlertTriangle
} from 'lucide-react';
import { goalsApi } from '../services/api';
import { Goal, Course, CourseNodeStatus } from '../types';
import { CourseCard } from '../components/CourseCard';
import { AssessmentModal } from '../components/AssessmentModal';
import { CourseFeedbackWidget } from '../components/CourseFeedbackWidget';
import { useToast } from '../context/ToastContext';

const PHASES = ['Foundations', 'Core Backend', 'Advanced Topics', 'Capstone Project'];

const statusMeta: Record<CourseNodeStatus, { label: string; className: string; icon: React.ElementType }> = {
  completed: {
    label: 'Completed',
    className: 'bg-emerald-950 text-emerald-300 border-emerald-500/40',
    icon: CheckCircle2
  },
  in_progress: {
    label: 'In Progress',
    className: 'bg-cyan-950 text-cyan-300 border-cyan-500/40',
    icon: PlayCircle
  },
  locked: {
    label: 'Locked',
    className: 'bg-slate-800 text-slate-300 border-slate-700',
    icon: Lock
  },
  ai_adjusted: {
    label: 'AI Adjusted',
    className: 'bg-purple-950 text-purple-300 border-purple-500/40',
    icon: Wand2
  }
};

const getMatchPct = (course: Course) => {
  if (typeof course.match_percentage === 'number') return course.match_percentage;
  if (typeof course.match_percentage === 'string') return Number.parseFloat(course.match_percentage);
  if (course.score_breakdown?.final_score) return Math.round(course.score_breakdown.final_score * 100);
  return 88;
};

const getPhaseForCourse = (course: Course, index: number, total: number) => {
  if (course.phase) return course.phase;
  const quartile = Math.min(PHASES.length - 1, Math.floor((index / Math.max(total, 1)) * PHASES.length));
  return PHASES[quartile];
};

const addDays = (date: Date, days: number) => {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
};

interface WhatIfPanelProps {
  initialWeeklyHours: number;
  totalDuration: number;
  onClose: () => void;
}

const WhatIfPanel = React.memo<WhatIfPanelProps>(({ initialWeeklyHours, totalDuration, onClose }) => {
  const [draftWeeklyHours, setDraftWeeklyHours] = useState<number>(initialWeeklyHours);
  const estimatedWeeks = useMemo(
    () => Math.max(1, Math.ceil(totalDuration / Math.max(draftWeeklyHours, 1))),
    [draftWeeklyHours, totalDuration]
  );
  const projectedEndDate = useMemo(() => addDays(new Date(), estimatedWeeks * 7), [estimatedWeeks]);

  useEffect(() => {
    setDraftWeeklyHours(initialWeeklyHours);
  }, [initialWeeklyHours]);

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-950/70 backdrop-blur-sm" onClick={onClose}>
      <aside
        className="h-full w-full max-w-md overflow-y-auto bg-slate-950 border-l border-slate-800 shadow-2xl p-5 sm:p-6"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4 mb-6">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-cyan-400">What-If Analysis</span>
            <h3 className="text-xl font-extrabold text-white mt-1">Weekly Commitment</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-6">
          <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800">
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm font-bold text-white">Hours per week</p>
              <span className="text-lg font-extrabold text-cyan-300">{draftWeeklyHours}</span>
            </div>
            <input
              type="range"
              min={5}
              max={30}
              step={1}
              value={draftWeeklyHours}
              onChange={(event) => setDraftWeeklyHours(Number(event.target.value))}
              className="w-full accent-cyan-400"
            />
            <div className="flex justify-between text-[11px] text-slate-500 mt-2">
              <span>5h</span>
              <span>30h</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800">
              <BookOpen className="w-4 h-4 text-indigo-400 mb-2" />
              <p className="text-xs text-slate-400">Curriculum</p>
              <p className="text-lg font-extrabold text-white">{totalDuration}h</p>
            </div>
            <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800">
              <CalendarDays className="w-4 h-4 text-emerald-400 mb-2" />
              <p className="text-xs text-slate-400">Completion</p>
              <p className="text-lg font-extrabold text-white">{estimatedWeeks} wks</p>
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800">
            <p className="text-xs text-slate-400">Projected End Date</p>
            <p className="text-2xl font-extrabold text-white mt-1">
              {projectedEndDate.toLocaleDateString(undefined, {
                month: 'short',
                day: 'numeric',
                year: 'numeric'
              })}
            </p>
            <p className="text-xs text-slate-500 mt-3">
              Based on {totalDuration} total course hours at {draftWeeklyHours} hours per week.
            </p>
          </div>
        </div>
      </aside>
    </div>
  );
});

export const LearningPathPage: React.FC = () => {
  const { goalId } = useParams<{ goalId?: string }>();
  const [goal, setGoal] = useState<Goal | null>(null);
  const [courses, setCourses] = useState<Course[]>([]);
  const [targetSkills, setTargetSkills] = useState<string[]>([]);
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('all');
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [completedCourseIds, setCompletedCourseIds] = useState<Set<string>>(new Set());
  const [aiAdjustedCourseIds, setAiAdjustedCourseIds] = useState<Set<string>>(new Set());
  const [assessmentCourse, setAssessmentCourse] = useState<Course | null>(null);
  const [rerouteAlert, setRerouteAlert] = useState<string>('');
  const [isWhatIfOpen, setIsWhatIfOpen] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const { showToast } = useToast();

  useEffect(() => {
    const fetchPathway = async () => {
      try {
        setIsLoading(true);
        let targetId = goalId;

        if (!targetId) {
          const goalsRes = await goalsApi.list();
          if (goalsRes.goals && goalsRes.goals.length > 0) {
            targetId = goalsRes.goals[0].id;
          }
        }

        if (targetId) {
          const data = await goalsApi.getById(targetId);
          setGoal(data.goal);
          setCourses(data.recommendations || []);
          setTargetSkills(data.target_skills || []);
        }
      } catch (error: any) {
        console.error('Failed to load roadmap pathway:', error);
        showToast('error', 'Error', 'Failed to load learning roadmap.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchPathway();
  }, [goalId, showToast]);

  const filteredCourses = useMemo(() => courses.filter((course) => {
    if (selectedDifficulty === 'all') return true;
    if (selectedDifficulty === 'free') return Number(course.cost || 0) === 0;
    return course.difficulty?.toLowerCase() === selectedDifficulty;
  }), [courses, selectedDifficulty]);

  const phasedCourses = useMemo(() => {
    return PHASES.map((phase) => ({
      phase,
      courses: filteredCourses.filter((course, index) => getPhaseForCourse(course, index, filteredCourses.length) === phase)
    })).filter((group) => group.courses.length > 0);
  }, [filteredCourses]);

  const totalDuration = useMemo(() => courses.reduce((sum, course) => sum + (Number(course.duration_hours) || 0), 0), [courses]);
  const goalWeeks = goal?.target_timeline_months ? goal.target_timeline_months * 4 : Math.max(1, Math.ceil(totalDuration / Math.max(goal?.weekly_study_hours || 12, 1)));

  const getEffectiveStatus = useCallback((course: Course): CourseNodeStatus => {
    if (completedCourseIds.has(course.id)) return 'completed';
    if (aiAdjustedCourseIds.has(course.id) || course.ai_adjusted) return 'ai_adjusted';
    return course.node_status || 'locked';
  }, [aiAdjustedCourseIds, completedCourseIds]);

  const openAssessment = (course: Course) => {
    if (course.is_foundational_review) {
      setCompletedCourseIds((prev) => {
        const next = new Set(prev);
        next.add(course.id);
        return next;
      });
      showToast('success', 'Review Complete', 'Foundational review module marked complete.');
      return;
    }
    setAssessmentCourse(course);
  };

  const markCourseComplete = (course: Course) => {
    setCompletedCourseIds((prev) => {
      const next = new Set(prev);
      next.add(course.id);
      return next;
    });
  };

  const applyAdaptiveReroute = (course: Course) => {
    const reviewCourse: Course = {
      ...course,
      id: `review-${course.id}`,
      title: `Foundational Review: ${course.title}`,
      description: `PathFinder AI added this review module after the assessment score fell below 60%. Revisit prerequisites, core concepts, and practice checkpoints before retrying ${course.title}.`,
      difficulty: 'beginner',
      duration_hours: Math.max(2, Math.ceil((course.duration_hours || 6) * 0.35)),
      rank: Number(course.rank || courses.length) + 0.1,
      node_status: 'in_progress',
      ai_adjusted: true,
      is_foundational_review: true,
      phase: course.phase || 'Foundations',
    };

    setAiAdjustedCourseIds((prev) => {
      const next = new Set(prev);
      next.add(course.id);
      return next;
    });
    setCourses((prev) => {
      if (prev.some((item) => item.id === reviewCourse.id)) return prev;
      const sourceIndex = prev.findIndex((item) => item.id === course.id);
      if (sourceIndex === -1) return [reviewCourse, ...prev];
      const next = [...prev];
      next.splice(sourceIndex, 0, reviewCourse);
      return next.map((item) => item.id === course.id ? { ...item, node_status: 'ai_adjusted', ai_adjusted: true } : item);
    });
    setSelectedCourse((prev) => prev?.id === course.id ? { ...prev, node_status: 'ai_adjusted', ai_adjusted: true } : prev);
    setRerouteAlert('Score threshold not met. PathFinder AI has updated your roadmap with a foundational review module.');
  };

  const renderStatusBadge = useCallback((status: CourseNodeStatus) => {
    const meta = statusMeta[status];
    const Icon = meta.icon;
    return (
      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-[11px] font-bold ${meta.className}`}>
        <Icon className="w-3.5 h-3.5" />
        {meta.label}
      </span>
    );
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-fade-in">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link
          to="/dashboard"
          className="inline-flex items-center space-x-2 text-xs font-semibold text-slate-400 hover:text-cyan-400 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Dashboard</span>
        </Link>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setIsWhatIfOpen(true)}
            className="inline-flex items-center space-x-1.5 px-3.5 py-1.5 rounded-xl bg-cyan-950/80 border border-cyan-500/30 text-cyan-300 text-xs font-bold hover:bg-cyan-900 transition-all"
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span>What-If</span>
          </button>
          <Link
            to="/parse"
            className="inline-flex items-center space-x-1.5 px-3.5 py-1.5 rounded-xl bg-purple-950/80 border border-purple-500/30 text-purple-300 text-xs font-bold hover:bg-purple-900 transition-all"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Synthesize Alternative Goal</span>
          </Link>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-6">
          <div className="h-48 bg-slate-900/80 rounded-3xl border border-slate-800 animate-pulse" />
          <div className="h-32 bg-slate-900/80 rounded-2xl border border-slate-800 animate-pulse" />
          <div className="h-32 bg-slate-900/80 rounded-2xl border border-slate-800 animate-pulse" />
        </div>
      ) : !goal ? (
        <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-12 text-center backdrop-blur-xl">
          <Compass className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <h2 className="text-xl font-bold text-white">No Roadmap Found</h2>
          <p className="text-sm text-slate-400 mt-2 max-w-md mx-auto">
            You don't have an active learning pathway yet. Generate one with the AI Goal Parser.
          </p>
          <Link
            to="/parse"
            className="inline-flex items-center space-x-2 mt-6 px-6 py-3 rounded-xl font-bold text-sm text-white bg-gradient-to-r from-cyan-600 to-indigo-600 shadow-lg shadow-cyan-500/20"
          >
            <Sparkles className="w-4 h-4" />
            <span>Open AI Goal Parser</span>
          </Link>
        </div>
      ) : (
        <>
          <section className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-900 via-indigo-950/60 to-slate-900 border border-slate-800 p-6 sm:p-8 backdrop-blur-2xl shadow-2xl">
            <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
            <div className="relative z-10 space-y-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center space-x-2">
                  <span className="px-3 py-1 rounded-full text-xs font-extrabold bg-cyan-950 border border-cyan-500/40 text-cyan-400 capitalize">
                    {goal.status} Roadmap
                  </span>
                  <span className="text-xs text-slate-400">
                    Created {new Date(goal.created_at).toLocaleDateString()}
                  </span>
                </div>
                <div className="flex items-center space-x-2 text-xs text-slate-400">
                  <Clock className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Total Curriculum: <strong className="text-white">{totalDuration} hours</strong></span>
                </div>
              </div>

              <div>
                <h1 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight">
                  {goal.target_role}
                </h1>
                {goal.notes && (
                  <p className="text-sm sm:text-base text-slate-300 mt-2 max-w-3xl leading-relaxed">
                    {goal.notes}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 pt-3 border-t border-slate-800/80">
                <div className="p-3 rounded-xl bg-slate-950/50 border border-slate-800/70">
                  <span className="text-[11px] text-slate-400 uppercase font-semibold">Baseline Pace</span>
                  <p className="text-sm font-bold text-white mt-0.5">{goal.weekly_study_hours} hrs/week</p>
                </div>
                <div className="p-3 rounded-xl bg-slate-950/50 border border-slate-800/70">
                  <span className="text-[11px] text-slate-400 uppercase font-semibold">Target Window</span>
                  <p className="text-sm font-bold text-white mt-0.5">{goal.target_timeline_months} months ({goalWeeks} wks)</p>
                </div>
                <div className="p-3 rounded-xl bg-slate-950/50 border border-slate-800/70">
                  <span className="text-[11px] text-slate-400 uppercase font-semibold">Target Skills</span>
                  <p className="text-sm font-bold text-white mt-0.5">{targetSkills.length || 'Mapped'} skills</p>
                </div>
                <div className="p-3 rounded-xl bg-slate-950/50 border border-slate-800/70">
                  <span className="text-[11px] text-slate-400 uppercase font-semibold">Course Nodes</span>
                  <p className="text-sm font-bold text-emerald-400 mt-0.5">{courses.length} populated</p>
                </div>
              </div>
            </div>
          </section>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-white tracking-tight flex items-center space-x-2">
                <Map className="w-5 h-5 text-cyan-400" />
                <span>Learning Path Node Graph</span>
              </h2>
              <p className="text-xs text-slate-400">
                Foundations to capstone, sequenced by recommendation rank and prerequisite dependencies.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-1.5 p-1 bg-slate-900 border border-slate-800 rounded-xl">
              {['all', 'beginner', 'intermediate', 'advanced', 'expert', 'free'].map((filterKey) => (
                <button
                  key={filterKey}
                  onClick={() => setSelectedDifficulty(filterKey)}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold capitalize transition-all ${
                    selectedDifficulty === filterKey
                      ? 'bg-cyan-950 text-cyan-300 border border-cyan-500/40 shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {filterKey}
                </button>
              ))}
            </div>
          </div>

          {filteredCourses.length === 0 ? (
            <div className="p-8 text-center bg-slate-900/60 rounded-2xl border border-slate-800">
              <p className="text-sm text-slate-400">No courses match the selected filter.</p>
            </div>
          ) : (
            <div className="space-y-8">
              {rerouteAlert && (
                <div className="flex items-start gap-3 p-4 rounded-2xl bg-amber-950/60 border border-amber-500/30 text-amber-100">
                  <AlertTriangle className="w-5 h-5 text-amber-300 mt-0.5 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="text-sm font-bold">Adaptive Re-routing Active</p>
                    <p className="text-xs mt-1 leading-relaxed">{rerouteAlert}</p>
                  </div>
                </div>
              )}
              {phasedCourses.map((group, groupIndex) => (
                <section key={group.phase} className="relative">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-2xl bg-slate-900 border border-cyan-500/30 flex items-center justify-center text-cyan-300 font-extrabold">
                      {groupIndex + 1}
                    </div>
                    <div>
                      <h3 className="text-base sm:text-lg font-bold text-white">{group.phase}</h3>
                      <p className="text-xs text-slate-400">{group.courses.length} course nodes</p>
                    </div>
                  </div>

                  <div className="relative pl-5 sm:pl-8 space-y-4 before:absolute before:left-[19px] sm:before:left-[31px] before:top-0 before:bottom-0 before:w-px before:bg-slate-800">
                    {group.courses.map((course) => {
                      const status = getEffectiveStatus(course);
                      const meta = statusMeta[status];
                      const Icon = meta.icon;
                      const matchPct = getMatchPct(course);
                      const unmetPrereqs = course.prerequisites?.filter((p) => p.status !== 'met') || [];

                      return (
                        <button
                          key={course.id}
                          type="button"
                          onClick={() => setSelectedCourse(course)}
                          className="relative block w-full text-left pl-8"
                        >
                          <span className={`absolute left-0 top-5 w-7 h-7 rounded-full border flex items-center justify-center ${meta.className}`}>
                            <Icon className="w-3.5 h-3.5" />
                          </span>

                          <div className="bg-slate-900/80 border border-slate-800/80 hover:border-cyan-500/40 rounded-2xl p-5 transition-all shadow-xl">
                            <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                              <div className="min-w-0">
                                <div className="flex flex-wrap items-center gap-2 mb-2">
                                  <span className="px-2.5 py-1 rounded-lg bg-slate-950/70 border border-slate-800 text-slate-300 text-[11px] font-bold">
                                    Node {course.rank || 1}
                                  </span>
                                  {renderStatusBadge(status)}
                                  {course.ai_adjusted && status !== 'ai_adjusted' && renderStatusBadge('ai_adjusted')}
                                  <span className="px-2.5 py-1 rounded-lg bg-slate-950/70 border border-slate-800 text-slate-300 text-[11px] font-bold capitalize">
                                    {course.difficulty}
                                  </span>
                                </div>
                                <h4 className="text-base sm:text-lg font-bold text-white leading-snug">{course.title}</h4>
                                <p className="text-xs sm:text-sm text-slate-400 mt-2 line-clamp-2 leading-relaxed">
                                  {course.description}
                                </p>
                              </div>

                              <div className="grid grid-cols-3 gap-2 lg:min-w-[260px]">
                                <div className="p-2 rounded-xl bg-slate-950/60 border border-slate-800 text-center">
                                  <p className="text-[11px] text-slate-500 font-semibold">Match</p>
                                  <p className="text-sm font-extrabold text-cyan-300">{Math.round(matchPct)}%</p>
                                </div>
                                <div className="p-2 rounded-xl bg-slate-950/60 border border-slate-800 text-center">
                                  <p className="text-[11px] text-slate-500 font-semibold">Duration</p>
                                  <p className="text-sm font-extrabold text-white">{course.duration_hours}h</p>
                                </div>
                                <div className="p-2 rounded-xl bg-slate-950/60 border border-slate-800 text-center">
                                  <p className="text-[11px] text-slate-500 font-semibold">DAG</p>
                                  <p className={`text-sm font-extrabold ${unmetPrereqs.length ? 'text-amber-300' : 'text-emerald-300'}`}>
                                    {unmetPrereqs.length ? `${unmetPrereqs.length} wait` : 'Ready'}
                                  </p>
                                </div>
                              </div>
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </section>
              ))}
            </div>
          )}
        </>
      )}

      {selectedCourse && (
        <div className="fixed inset-0 z-50 flex justify-end bg-slate-950/70 backdrop-blur-sm" onClick={() => setSelectedCourse(null)}>
          <aside
            className="h-full w-full max-w-xl overflow-y-auto bg-slate-950 border-l border-slate-800 shadow-2xl p-5 sm:p-6"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4 mb-5">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-cyan-400">Course Node Detail</span>
                <h3 className="text-xl font-extrabold text-white mt-1">{selectedCourse.title}</h3>
                <p className="text-xs text-slate-400 mt-1">{selectedCourse.provider}</p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedCourse(null)}
                className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-5">
              {selectedCourse.is_foundational_review ? (
                <div className="p-5 rounded-2xl bg-amber-950/40 border border-amber-500/30">
                  <p className="text-xs font-bold uppercase tracking-wider text-amber-300 mb-2">Adaptive Review Module</p>
                  <p className="text-sm text-amber-50 leading-relaxed">{selectedCourse.description}</p>
                </div>
              ) : (
                <CourseCard course={selectedCourse} stepIndex={selectedCourse.rank} />
              )}

              <div className="grid grid-cols-2 gap-3">
                <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800">
                  <Clock className="w-4 h-4 text-cyan-400 mb-2" />
                  <p className="text-xs text-slate-400">Duration</p>
                  <p className="text-lg font-extrabold text-white">{selectedCourse.duration_hours} hours</p>
                </div>
                <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800">
                  <GitBranch className="w-4 h-4 text-indigo-400 mb-2" />
                  <p className="text-xs text-slate-400">Prerequisite DAG</p>
                  <p className="text-lg font-extrabold text-white">{selectedCourse.prerequisites?.length || 0} nodes</p>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-bold text-white">
                      {completedCourseIds.has(selectedCourse.id) ? 'Module Complete' : 'Complete Module'}
                    </p>
                    <p className="text-xs text-slate-400">
                      {selectedCourse.is_foundational_review
                        ? 'Marks the review node complete for this session.'
                        : 'Launches a checkpoint assessment before advancing.'}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => openAssessment(selectedCourse)}
                    disabled={completedCourseIds.has(selectedCourse.id)}
                    className={`w-12 h-7 rounded-full border transition-all p-0.5 ${
                      completedCourseIds.has(selectedCourse.id)
                        ? 'bg-emerald-500 border-emerald-400'
                        : 'bg-slate-800 border-slate-700'
                    } disabled:cursor-not-allowed`}
                  >
                    <span
                      className={`w-5 h-5 rounded-full bg-white flex items-center justify-center transition-transform ${
                        completedCourseIds.has(selectedCourse.id) ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    >
                      {completedCourseIds.has(selectedCourse.id) && <Check className="w-3 h-3 text-emerald-600" />}
                    </span>
                  </button>
                </div>
              </div>

              {!selectedCourse.is_foundational_review && (
                <CourseFeedbackWidget
                  courseId={selectedCourse.id}
                  courseTitle={selectedCourse.title}
                />
              )}

              <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800">
                <p className="text-sm font-bold text-white mb-3 flex items-center gap-2">
                  <GitBranch className="w-4 h-4 text-cyan-400" />
                  Prerequisite Status
                </p>
                {selectedCourse.prerequisites && selectedCourse.prerequisites.length > 0 ? (
                  <div className="space-y-2">
                    {selectedCourse.prerequisites.map((prereq) => (
                      <div key={prereq.course_id} className="flex items-center justify-between gap-3 p-3 rounded-xl bg-slate-950/70 border border-slate-800">
                        <span className="text-xs font-semibold text-slate-300">{prereq.title}</span>
                        <span className={`text-[11px] font-bold px-2 py-1 rounded-lg border ${
                          prereq.status === 'met'
                            ? 'bg-emerald-950 text-emerald-300 border-emerald-500/40'
                            : 'bg-amber-950 text-amber-300 border-amber-500/40'
                        }`}>
                          {prereq.status === 'met' ? 'Met' : 'Pending'}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-slate-400">No blocking prerequisites for this node.</p>
                )}
              </div>

              <a
                href={selectedCourse.url}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-sm font-bold transition-all"
              >
                <ExternalLink className="w-4 h-4" />
                Open Course
              </a>
            </div>
          </aside>
        </div>
      )}

      {isWhatIfOpen && (
        <WhatIfPanel
          initialWeeklyHours={goal?.weekly_study_hours || 12}
          totalDuration={totalDuration}
          onClose={() => setIsWhatIfOpen(false)}
        />
      )}

      <AssessmentModal
        course={assessmentCourse}
        isOpen={Boolean(assessmentCourse)}
        onClose={() => setAssessmentCourse(null)}
        onPassed={(course) => markCourseComplete(course)}
        onRerouted={(course) => applyAdaptiveReroute(course)}
      />
    </div>
  );
};
