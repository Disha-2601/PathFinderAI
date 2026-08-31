import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Crosshair, TrendingUp } from 'lucide-react';
import { Course, Goal, Skill } from '../types';

interface SkillFocusWidgetProps {
  skills: Skill[];
  activeGoal?: Goal;
  activeCourses?: Course[];
}

const fallbackPriorities = [
  { name: 'Vector Databases', current: 2, target: 5, category: 'Retrieval Infrastructure' },
  { name: 'RAG Orchestration', current: 1, target: 4, category: 'AI Systems' },
  { name: 'Async Python', current: 2, target: 4, category: 'Backend Engineering' },
  { name: 'Embeddings Evaluation', current: 1, target: 4, category: 'Model Quality' },
];

const clampScore = (value: number) => Math.min(5, Math.max(0, value));

export const SkillFocusWidget: React.FC<SkillFocusWidgetProps> = ({ skills, activeGoal, activeCourses = [] }) => {
  const targetSkillNames = useMemo(() => {
    const names = new Set<string>();
    activeCourses.forEach((course) => {
      course.skills_covered?.forEach((skill) => {
        names.add(typeof skill === 'string' ? skill : skill.skill_name);
      });
    });
    return names;
  }, [activeCourses]);

  const priorities = useMemo(() => {
    const mappedSkills = skills.map((skill) => {
      const isTargetSkill = Array.from(targetSkillNames).some(
        (targetSkill) =>
          targetSkill.toLowerCase().includes(skill.skill_name.toLowerCase()) ||
          skill.skill_name.toLowerCase().includes(targetSkill.toLowerCase()),
      );
      const target = isTargetSkill || skill.proficiency_level < 4 ? 5 : Math.min(5, skill.proficiency_level + 1);
      return {
        name: skill.skill_name,
        category: skill.category || 'Core Skill',
        current: clampScore(skill.proficiency_level || 0),
        target,
      };
    });

    const source = mappedSkills.length > 0 ? mappedSkills : fallbackPriorities;

    return source
      .map((skill) => ({ ...skill, gap: skill.target - skill.current }))
      .sort((a, b) => b.gap - a.gap)
      .slice(0, 4);
  }, [skills, targetSkillNames]);

  const pathwayUrl = activeGoal?.id ? `/pathway/${activeGoal.id}` : '/pathway';

  return (
    <section className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm dark:bg-slate-900/80 dark:border-slate-800/80 dark:shadow-xl">
      <div className="flex items-start justify-between gap-4 mb-5">
        <div>
          <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <Crosshair className="w-4 h-4 text-cyan-500" />
            <span>Target Skill Gap Priorities</span>
          </h3>
          <p className="text-xs text-slate-600 dark:text-slate-400">
            Largest distance between current mastery and target benchmark.
          </p>
        </div>
        <TrendingUp className="w-5 h-5 text-emerald-500 flex-shrink-0" />
      </div>

      <div className="space-y-4">
        {priorities.map((skill) => {
          const progress = Math.round((skill.current / skill.target) * 100);
          return (
            <div key={skill.name} className="space-y-2">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-bold text-slate-900 dark:text-white truncate">{skill.name}</p>
                  <p className="text-[11px] text-slate-600 dark:text-slate-400 truncate">{skill.category}</p>
                </div>
                <span className="text-xs font-extrabold text-slate-800 bg-slate-100 border border-slate-200 rounded-full px-2 py-0.5 dark:text-slate-200 dark:bg-slate-800 dark:border-slate-700">
                  {skill.current}/{skill.target}
                </span>
              </div>
              <div className="h-2.5 rounded-full bg-slate-100 border border-slate-200 overflow-hidden dark:bg-slate-950 dark:border-slate-800">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-cyan-500 via-indigo-500 to-purple-500"
                  style={{ width: `${Math.max(8, progress)}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>

      <Link
        to={pathwayUrl}
        className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-600 to-indigo-600 px-4 py-3 text-sm font-bold text-white shadow-md shadow-cyan-600/20 transition-all hover:from-cyan-500 hover:to-indigo-500"
      >
        <span>Focus Next Module</span>
        <ArrowRight className="w-4 h-4" />
      </Link>
    </section>
  );
};
