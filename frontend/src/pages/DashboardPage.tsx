import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Sparkles,
  Map,
  Compass,
  Award,
  CheckCircle2,
  Clock,
  ArrowRight,
  Target,
  ShieldCheck,
  Zap,
  Layers,
  TrendingUp,
  Gauge
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { goalsApi, userApi } from '../services/api';
import { Skill, Goal, Assessment, UserStats, Course } from '../types';
import { SkillRadarChart } from '../components/SkillRadarChart';
import { SkillFocusWidget } from '../components/SkillFocusWidget';
import { LearningMilestonesWidget } from '../components/LearningMilestonesWidget';
import { useToast } from '../context/ToastContext';
import { useTheme } from '../context/ThemeContext';

export const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const { showToast } = useToast();
  const { theme } = useTheme();
  const [skills, setSkills] = useState<Skill[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [stats, setStats] = useState<UserStats | null>(null);
  const [activeCourses, setActiveCourses] = useState<Course[]>([]);
  const [activeTargetSkills, setActiveTargetSkills] = useState<string[]>([]);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const data = await userApi.getProfile(user?.id);
        setSkills(data.skills || []);
        const loadedGoals = data.goals || [];
        setGoals(loadedGoals);
        setAssessments(data.assessments || []);
        setStats(data.stats);

        const goalForProgress = loadedGoals.find((g) => g.status === 'active') || loadedGoals[0];
        if (goalForProgress?.id) {
          const pathway = await goalsApi.getById(goalForProgress.id);
          setActiveCourses(pathway.recommendations || []);
          setActiveTargetSkills(pathway.target_skills || []);
        } else {
          setActiveCourses([]);
          setActiveTargetSkills([]);
        }
      } catch (error: any) {
        console.error('Failed to load dashboard:', error);
        showToast('warning', 'Notice', 'Could not load complete profile data. Using cached/demo state.');
      }
    };

    fetchDashboardData();
  }, [user, showToast]);

  const activeGoal = goals.find((g) => g.status === 'active') || goals[0];
  const completedNodeCount = activeCourses.filter((course) => course.node_status === 'completed').length;
  const totalNodeCount = activeCourses.length || Number(activeGoal?.recommendation_count || 0);
  const fallbackCompletedNodes = activeGoal?.current_step ? Math.max(0, activeGoal.current_step - 1) : 0;
  const roadmapProgress = totalNodeCount > 0
    ? Math.min(100, Math.round(((completedNodeCount || fallbackCompletedNodes) / totalNodeCount) * 100))
    : 0;
  const assessmentPerformance = useMemo(() => {
    if (assessments.length === 0) return stats?.average_assessment_score ?? 0;
    const normalized = assessments.map((assessment) => {
      const maxScore = Number(assessment.max_score || 100);
      const score = Number(assessment.score || 0);
      return maxScore > 0 ? (score / maxScore) * 100 : score;
    });
    return Math.round(normalized.reduce((sum, score) => sum + score, 0) / normalized.length);
  }, [assessments, stats]);
  const careerReadinessScore = Math.min(100, Math.round((roadmapProgress * 0.7) + (assessmentPerformance * 0.3)));
  const progressLabel = totalNodeCount > 0
    ? `${completedNodeCount || fallbackCompletedNodes}/${totalNodeCount} nodes complete`
    : 'No roadmap nodes loaded';
  const isDark = theme === 'dark';
  const dashboardCardClass = 'bg-white border border-slate-200 rounded-2xl backdrop-blur-xl shadow-sm dark:bg-slate-900/80 dark:border-slate-800/80 dark:shadow-xl';
  const headingClass = 'text-slate-900 dark:text-white';
  const secondaryTextClass = 'text-slate-600 dark:text-slate-400';

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-fade-in">
      {/* 1. Welcome Header & Active Career Goal Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-white border border-slate-200 p-6 sm:p-8 backdrop-blur-2xl shadow-sm dark:bg-gradient-to-r dark:from-slate-900 dark:via-indigo-950/60 dark:to-slate-900 dark:border-slate-800 dark:shadow-2xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-cyan-100 border border-cyan-500/30 text-cyan-700 text-xs font-semibold mb-3 dark:bg-cyan-950/80 dark:text-cyan-400">
              <Zap className="w-3.5 h-3.5" />
              <span>AI Milestone Engine Active</span>
            </div>
            <h1 className={`text-2xl sm:text-4xl font-extrabold ${headingClass} tracking-tight`}>
              Welcome back, <span className="bg-gradient-to-r from-cyan-400 via-indigo-300 to-purple-400 bg-clip-text text-transparent">{user?.full_name || 'Engineer'}</span>
            </h1>
            <p className={`${secondaryTextClass} text-sm sm:text-base mt-2 max-w-2xl leading-relaxed`}>
              Target Role: <strong className="text-slate-800 dark:text-slate-200">{user?.target_role || activeGoal?.target_role || 'AI Solutions Architect'}</strong>. Pacing structured across verified skill checkpoints and prerequisite DAG trees.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Link
              to="/parse"
              className="flex items-center space-x-2 px-5 py-3 rounded-xl font-bold text-sm text-white bg-gradient-to-r from-cyan-500 via-indigo-500 to-purple-600 hover:from-cyan-400 hover:to-purple-500 shadow-lg shadow-cyan-500/20 transition-all active:scale-95"
            >
              <Sparkles className="w-4 h-4 text-purple-200" />
              <span>Synthesize New Goal</span>
            </Link>

            {activeGoal && (
              <Link
                to={`/pathway/${activeGoal.id}`}
                className="flex items-center space-x-2 px-5 py-3 rounded-xl font-semibold text-sm text-slate-800 bg-slate-100 hover:bg-slate-200 border border-slate-200 hover:border-cyan-500/30 transition-all dark:text-slate-200 dark:bg-slate-800/90 dark:hover:bg-slate-700 dark:border-slate-700"
              >
                <Map className="w-4 h-4 text-cyan-400" />
                <span>View Active Roadmap</span>
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* 2. Key Metrics Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <div className={`${dashboardCardClass} p-5`}>
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400">Tracked Skills</span>
            <div className="p-2 rounded-xl bg-cyan-100 border border-cyan-500/30 text-cyan-700 dark:bg-cyan-950 dark:text-cyan-400">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline space-x-2">
            <span className={`text-2xl sm:text-3xl font-extrabold ${headingClass}`}>
              {stats?.total_skills_tracked ?? skills.length}
            </span>
            <span className="text-xs text-slate-400">({stats?.verified_skills_count || 0} verified)</span>
          </div>
          <p className="text-xs text-slate-500 mt-1">Taxonomy aligned</p>
        </div>

        <div className={`${dashboardCardClass} p-5`}>
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400">Active Goals</span>
            <div className="p-2 rounded-xl bg-indigo-100 border border-indigo-500/30 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-400">
              <Target className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline space-x-2">
            <span className={`text-2xl sm:text-3xl font-extrabold ${headingClass}`}>
              {stats?.active_goals_count ?? (goals.length > 0 ? 1 : 0)}
            </span>
            <span className="text-xs text-slate-400">of {stats?.total_goals_count ?? goals.length} total</span>
          </div>
          <p className="text-xs text-slate-500 mt-1">In progress milestones</p>
        </div>

        <div className={`${dashboardCardClass} p-5`}>
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400">Weekly Commitment</span>
            <div className="p-2 rounded-xl bg-purple-100 border border-purple-500/30 text-purple-700 dark:bg-purple-950 dark:text-purple-400">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline space-x-2">
            <span className={`text-2xl sm:text-3xl font-extrabold ${headingClass}`}>
              {stats?.weekly_committed_hours || activeGoal?.weekly_study_hours || 15}
            </span>
            <span className="text-xs text-slate-400">hrs / week</span>
          </div>
          <p className="text-xs text-slate-500 mt-1">Adaptive study pacing</p>
        </div>

        <div className={`${dashboardCardClass} p-5`}>
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400">Readiness Score</span>
            <div className="p-2 rounded-xl bg-emerald-100 border border-emerald-500/30 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400">
              <Gauge className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline space-x-2">
            <span className={`text-2xl sm:text-3xl font-extrabold ${headingClass}`}>
              {careerReadinessScore}%
            </span>
            <span className="text-xs text-emerald-400 font-semibold">{roadmapProgress}% path</span>
          </div>
          <p className="text-xs text-slate-500 mt-1">Completion + assessments</p>
        </div>
      </div>

      {/* 3. Stage 7 Analytics: Roadmap Progress & Career Readiness */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        <div className={`lg:col-span-8 ${dashboardCardClass} p-6`}>
          <div className="flex items-center justify-between gap-4 mb-5">
            <div>
              <h3 className={`text-base sm:text-lg font-bold ${headingClass} tracking-tight flex items-center space-x-2`}>
                <TrendingUp className="w-4 h-4 text-cyan-400" />
                <span>Overall Roadmap Progress</span>
              </h3>
              <p className={`text-xs ${secondaryTextClass}`}>{progressLabel}</p>
            </div>
            <span className="text-3xl font-extrabold text-cyan-300">{roadmapProgress}%</span>
          </div>
          <div className="h-4 w-full rounded-full bg-slate-100 border border-slate-200 overflow-hidden dark:bg-slate-950 dark:border-slate-800">
            <div
              className="h-full rounded-full bg-gradient-to-r from-cyan-500 via-emerald-400 to-amber-300 transition-all duration-700"
              style={{ width: `${roadmapProgress}%` }}
            />
          </div>
          <div className="grid grid-cols-3 gap-3 mt-5">
            <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
              <p className="text-[11px] text-slate-500 font-semibold uppercase">Completed</p>
              <p className="text-lg font-extrabold text-emerald-300">{completedNodeCount || fallbackCompletedNodes}</p>
            </div>
            <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
              <p className="text-[11px] text-slate-500 font-semibold uppercase">In Path</p>
              <p className={`text-lg font-extrabold ${headingClass}`}>{totalNodeCount}</p>
            </div>
            <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
              <p className="text-[11px] text-slate-500 font-semibold uppercase">Assessment Avg</p>
              <p className="text-lg font-extrabold text-amber-300">{assessmentPerformance}%</p>
            </div>
          </div>
        </div>

        <div className={`lg:col-span-4 ${dashboardCardClass} p-6`}>
          <div className="flex items-center justify-between gap-3 mb-4">
            <h3 className={`text-base sm:text-lg font-bold ${headingClass} tracking-tight flex items-center space-x-2`}>
              <Award className="w-4 h-4 text-emerald-400" />
              <span>Career Readiness</span>
            </h3>
          </div>
          <div className="flex items-center justify-center py-2">
            <div
              className="relative w-40 h-40 rounded-full flex items-center justify-center"
              style={{
                background: `conic-gradient(#34d399 ${careerReadinessScore * 3.6}deg, ${isDark ? '#1e293b' : '#e2e8f0'} 0deg)`
              }}
            >
              <div className="w-32 h-32 rounded-full bg-white border border-slate-200 flex flex-col items-center justify-center dark:bg-slate-950 dark:border-slate-800">
                <span className={`text-4xl font-extrabold ${headingClass}`}>{careerReadinessScore}</span>
                <span className="text-xs text-slate-600 dark:text-slate-400 font-semibold">/ 100</span>
              </div>
            </div>
          </div>
          <p className={`text-xs ${secondaryTextClass} text-center leading-relaxed`}>
            Weighted from completed DAG nodes and assessment performance.
          </p>
        </div>
      </div>

      {/* 4. Main Dashboard Grid: Skill analytics, goals, and assessments */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
        {/* Left Column: Skill Matrix */}
        <div className="h-full min-h-0">
          <SkillRadarChart skills={skills} />
        </div>

        {/* Right Column: Active Goals & Assessments */}
        <div className="flex flex-col gap-6 h-full justify-between min-h-0">
          {/* Active Goals Card */}
          <div className={`${dashboardCardClass} p-6 flex-1 min-h-0 flex flex-col`}>
            <div className="flex items-center justify-between mb-4 flex-shrink-0">
              <h3 className={`text-base sm:text-lg font-bold ${headingClass} tracking-tight flex items-center space-x-2`}>
                <Target className="w-4 h-4 text-cyan-400" />
                <span>Career Roadmaps</span>
              </h3>
              <Link to="/parse" className="text-xs text-cyan-400 hover:underline font-semibold">
                + New Goal
              </Link>
            </div>

            <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar min-h-0 space-y-3">
              {goals.length === 0 ? (
                <div className="p-6 text-center border border-dashed border-slate-300 rounded-xl dark:border-slate-800">
                  <Compass className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                  <p className="text-sm font-semibold text-slate-800 dark:text-slate-300">No Career Goals Synthesized Yet</p>
                  <p className="text-xs text-slate-500 mt-1">
                    Describe your aspirations in the AI Goal Parser to generate your roadmap.
                  </p>
                  <Link
                    to="/parse"
                    className="inline-flex items-center space-x-1 mt-3 px-3.5 py-1.5 rounded-lg bg-cyan-500 text-slate-950 text-xs font-bold"
                  >
                    <span>Generate Goal</span>
                    <ArrowRight className="w-3 h-3" />
                  </Link>
                </div>
              ) : (
                goals.map((goal) => (
                  <Link
                    key={goal.id}
                    to={`/pathway/${goal.id}`}
                    className="block p-4 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 hover:border-cyan-500/40 transition-all group dark:bg-slate-950/60 dark:hover:bg-slate-800/60 dark:border-slate-800"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className={`text-xs font-bold px-2 py-0.5 rounded-full border capitalize ${
                            goal.status === 'active'
                              ? 'bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-500/30'
                              : 'bg-slate-100 text-slate-800 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700'
                          }`}>
                            {goal.status}
                          </span>
                          <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-800 border border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700">
                            {goal.target_timeline_months} months • {goal.weekly_study_hours}h/wk
                          </span>
                        </div>
                        <h4 className="text-sm font-bold text-slate-900 group-hover:text-cyan-700 transition-colors mt-1.5 dark:text-white dark:group-hover:text-cyan-300">
                          {goal.target_role}
                        </h4>
                        {goal.notes && (
                          <p className="text-xs text-slate-600 line-clamp-1 mt-1 dark:text-slate-400">{goal.notes}</p>
                        )}
                      </div>
                      <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-cyan-400 group-hover:translate-x-1 transition-all" />
                    </div>
                  </Link>
                ))
              )}
            </div>
          </div>

          {/* Diagnostic Assessments Card */}
          <div className={`${dashboardCardClass} p-6 flex-1 min-h-0 flex flex-col`}>
            <div className="flex items-center justify-between mb-4 flex-shrink-0">
              <h3 className={`text-base sm:text-lg font-bold ${headingClass} tracking-tight flex items-center space-x-2`}>
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>Diagnostic Assessments</span>
              </h3>
            </div>

            <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar min-h-0 space-y-2.5">
              {assessments.length === 0 ? (
                <p className="text-xs text-slate-500 text-center py-4">No diagnostic tests taken yet.</p>
              ) : (
                assessments.map((a) => (
                  <div
                    key={a.id}
                    className="flex items-center justify-between p-3 rounded-xl bg-white border border-slate-200 dark:bg-slate-950/60 dark:border-slate-800/80"
                  >
                    <div className="flex items-center space-x-2.5">
                      <CheckCircle2 className={`w-4 h-4 ${a.passed ? 'text-emerald-400' : 'text-amber-400'}`} />
                      <div>
                        <p className="text-xs font-bold text-slate-800 dark:text-slate-200">{a.title}</p>
                        <p className="text-[11px] text-slate-600 dark:text-slate-400 capitalize">{a.skill_name || 'Core Domain'}</p>
                      </div>
                    </div>
                    <span className="text-xs font-extrabold text-slate-800 px-2 py-1 rounded bg-slate-100 border border-slate-200 dark:text-white dark:bg-slate-800 dark:border-slate-700">
                      {a.score}/{a.max_score}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        <section className="col-span-1 lg:col-span-2 w-full">
          <SkillFocusWidget
            skills={skills}
            activeGoal={activeGoal}
            activeCourses={activeCourses}
            targetSkills={activeTargetSkills}
            targetRole={activeGoal?.target_role || user?.target_role}
          />
        </section>

        <section className="col-span-1 lg:col-span-2 w-full">
          <LearningMilestonesWidget activeGoal={activeGoal} activeCourses={activeCourses} stats={stats} />
        </section>
      </div>
    </div>
  );
};
