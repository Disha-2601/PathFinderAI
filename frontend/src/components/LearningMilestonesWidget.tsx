import React from 'react';
import { Link } from 'react-router-dom';
import { Activity, ArrowRight, CalendarCheck2, ClipboardCheck, Flame, Timer } from 'lucide-react';
import { Course, Goal, UserStats } from '../types';

interface LearningMilestonesWidgetProps {
  activeGoal?: Goal;
  activeCourses?: Course[];
  stats?: UserStats | null;
}

const safeNumber = (value: unknown, fallback: number) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const positiveNumber = (value: unknown, fallback: number) => {
  const parsed = safeNumber(value, fallback);
  return parsed > 0 ? parsed : fallback;
};

export const LearningMilestonesWidget: React.FC<LearningMilestonesWidgetProps> = ({
  activeGoal,
  activeCourses = [],
  stats,
}) => {
  const hasActiveGoal = Boolean(activeGoal?.id) || Boolean(stats?.active_goals_count);
  const completedCourses = activeCourses.filter((course) => course.node_status === 'completed');
  const completedNodeCount = completedCourses.length;
  const hasCompletedActivity = completedNodeCount > 0;
  const pathwayUrl = activeGoal?.id ? `/pathway/${activeGoal.id}` : '/parse';
  const weeklyTarget = positiveNumber(activeGoal?.weekly_study_hours, positiveNumber(stats?.weekly_committed_hours, 15));
  const hoursLogged = completedCourses.reduce((sum, course) => sum + safeNumber(course.duration_hours, 0), 0);
  const nextCourse =
    activeCourses.find((course) => course.node_status === 'in_progress') ||
    activeCourses.find((course) => course.node_status !== 'completed') ||
    null;
  const nextNodeTitle = hasActiveGoal
    ? nextCourse?.title || 'Open your roadmap to continue diagnostic checkpoints'
    : 'Synthesize a goal to unlock diagnostic checkpoints';
  const nextNodeActionLabel = hasActiveGoal ? 'Launch Assessment' : 'Synthesize Goal';
  const streakDays = hasCompletedActivity
    ? Math.max(1, Math.min(14, completedNodeCount + safeNumber(stats?.passed_assessments_count, 0)))
    : 0;
  const hourProgress = Math.min(100, Math.round((hoursLogged / weeklyTarget) * 100));
  const formattedHoursLogged = Number.isInteger(hoursLogged) ? String(hoursLogged) : hoursLogged.toFixed(1);
  const formattedWeeklyTarget = Number.isInteger(weeklyTarget) ? String(weeklyTarget) : weeklyTarget.toFixed(1);
  const streakLabel = streakDays === 1 ? '1 Day Active' : `${streakDays} Days`;

  return (
    <section className="w-full bg-white border border-slate-200 rounded-2xl p-6 shadow-sm dark:bg-slate-900/80 dark:border-slate-800/80 dark:shadow-xl">
      <div className="flex items-start justify-between gap-4 mb-5">
        <div>
          <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <CalendarCheck2 className="w-4 h-4 text-emerald-500" />
            <span>Upcoming Milestones & Study Activity</span>
          </h3>
          <p className="text-xs text-slate-600 dark:text-slate-400">
            Weekly momentum and the next diagnostic checkpoint.
          </p>
        </div>
        <Activity className="w-5 h-5 text-cyan-500 flex-shrink-0" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 dark:border-emerald-500/30 dark:bg-emerald-950/40">
          <div className="flex items-center gap-2 text-xs font-semibold text-emerald-800 dark:text-emerald-300">
            <Flame className="w-4 h-4" />
            <span>Current Study Streak</span>
          </div>
          <p className="mt-2 text-xl font-extrabold text-slate-900 dark:text-white">{streakLabel}</p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950/60">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-300">
            <Timer className="w-4 h-4 text-cyan-500" />
            <span>Hours Logged This Week</span>
          </div>
          <p className="mt-2 text-xl font-extrabold text-slate-900 dark:text-white">
            {formattedHoursLogged} / {formattedWeeklyTarget} hrs
          </p>
          <div className="mt-3 h-2 rounded-full bg-white border border-slate-200 overflow-hidden dark:bg-slate-900 dark:border-slate-800">
            <div className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-cyan-500" style={{ width: `${hourProgress}%` }} />
          </div>
        </div>

        <div className="rounded-xl border border-cyan-200 bg-cyan-50 p-4 dark:border-cyan-500/30 dark:bg-cyan-950/30">
          <div className="flex h-full flex-col justify-between gap-4">
            <div className="min-w-0">
              <div className="flex items-center gap-2 text-xs font-semibold text-cyan-800 dark:text-cyan-300">
                <ClipboardCheck className="w-4 h-4" />
                <span>Next Up Node</span>
              </div>
              <p className="mt-1 text-sm font-bold text-slate-900 dark:text-white break-words">{nextNodeTitle}</p>
            </div>
            <Link
              to={pathwayUrl}
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-cyan-600 px-4 py-2.5 text-xs font-bold text-white transition-all hover:bg-cyan-500"
            >
              <span>{nextNodeActionLabel}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
};
