import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Crosshair, TrendingUp } from 'lucide-react';
import { Course, Goal, Skill } from '../types';

interface SkillFocusWidgetProps {
  skills: Skill[];
  activeGoal?: Goal;
  activeCourses?: Course[];
  targetSkills?: string[];
  targetRole?: string;
}

interface TargetBenchmark {
  name: string;
  target: number;
  category: string;
}

export interface SkillPriority extends TargetBenchmark {
  current: number;
  gap: number;
}

const roleTaxonomy: Array<{ pattern: RegExp; skills: Array<{ name: string; target: number; category: string }> }> = [
  {
    pattern: /data\s+analyst|analytics|business\s+intelligence|\bbi\b/i,
    skills: [
      { name: 'SQL', target: 5, category: 'Data Analytics' },
      { name: 'Pandas', target: 4, category: 'Data Analytics' },
      { name: 'Power BI', target: 4, category: 'Business Intelligence' },
      { name: 'Data Visualization', target: 4, category: 'Data Analytics' },
    ],
  },
  {
    pattern: /frontend|react|ui engineer|web developer/i,
    skills: [
      { name: 'React & Frontend Architecture', target: 5, category: 'Frontend Engineering' },
      { name: 'TypeScript & JavaScript', target: 5, category: 'Programming Languages' },
      { name: 'Tailwind CSS & Design Systems', target: 4, category: 'Frontend Engineering' },
      { name: 'Interactive Data Visualizations', target: 4, category: 'Frontend Engineering' },
    ],
  },
  {
    pattern: /backend|api|platform engineer/i,
    skills: [
      { name: 'FastAPI & Async Python', target: 5, category: 'Backend Frameworks' },
      { name: 'PostgreSQL & Relational DBs', target: 4, category: 'Databases' },
      { name: 'Docker & Containerization', target: 4, category: 'DevOps & Cloud' },
      { name: 'Distributed Systems & System Design', target: 4, category: 'System Architecture' },
    ],
  },
  {
    pattern: /ai|llm|machine learning|ml|rag|solutions architect/i,
    skills: [
      { name: 'Large Language Models (LLMs)', target: 5, category: 'Artificial Intelligence' },
      { name: 'Retrieval-Augmented Generation (RAG)', target: 5, category: 'Artificial Intelligence' },
      { name: 'Vector Databases & pgvector', target: 4, category: 'Artificial Intelligence' },
      { name: 'AI Agents & Tool Orchestration', target: 4, category: 'Artificial Intelligence' },
    ],
  },
];

const clampScore = (value: number) => Math.min(5, Math.max(0, value));

const normalizeSkillName = (value: string) => value.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();

const isSameSkill = (a: string, b: string) => {
  const left = normalizeSkillName(a);
  const right = normalizeSkillName(b);
  if (!left || !right) return false;
  if (left.includes(right) || right.includes(left)) return true;

  const aliases: Record<string, string[]> = {
    sql: ['postgresql relational dbs', 'postgres', 'relational database'],
    powerbi: ['power bi', 'business intelligence'],
    'power bi': ['powerbi', 'business intelligence'],
    pandas: ['python programming', 'data analytics'],
    'data visualization': ['interactive data visualizations', 'dashboard'],
  };

  return (aliases[left]?.includes(right) || aliases[right]?.includes(left)) ?? false;
};

const getRoleTaxonomy = (role?: string) =>
  roleTaxonomy.find((entry) => entry.pattern.test(role || ''))?.skills || [];

const getCurrentMastery = (skill: Skill) =>
  clampScore(Number(skill.currentMastery ?? skill.proficiency_level ?? 0));

const getTargetBenchmark = (skill: Skill) =>
  clampScore(Number(skill.target_benchmark ?? skill.targetBenchmark ?? 5));

export const buildSkillFocusPriorities = ({
  skills,
  activeGoal,
  activeCourses = [],
  targetSkills = [],
  targetRole,
}: SkillFocusWidgetProps): SkillPriority[] => {
  const benchmarks = new Map<string, TargetBenchmark>();
  const addBenchmark = (name: string, target = 5, category = 'Target Skill') => {
    const cleanName = name.trim();
    if (!cleanName) return;
    const key = normalizeSkillName(cleanName);
    const existing = benchmarks.get(key);
    if (!existing || target > existing.target) {
      benchmarks.set(key, { name: cleanName, target: clampScore(target), category });
    }
  };

  [...targetSkills, ...(activeGoal?.target_skills || [])].forEach((skill) => addBenchmark(skill, 5));
  getRoleTaxonomy(activeGoal?.target_role || targetRole).forEach((skill) =>
    addBenchmark(skill.name, skill.target, skill.category),
  );
  activeGoal?.skillMatrix?.forEach((skill) => {
    addBenchmark(skill.skill_name, getTargetBenchmark(skill), skill.category || 'Goal Skill');
  });

  activeCourses.forEach((course) => {
    course.skills_covered?.forEach((skill) => {
      const skillName = typeof skill === 'string' ? skill : skill.skill_name;
      const target = typeof skill === 'string' ? 5 : Number(skill.proficiency_level || 5);
      addBenchmark(skillName, target, 'Roadmap Skill');
    });
  });

  if (benchmarks.size === 0) {
    getRoleTaxonomy(targetRole).forEach((skill) => addBenchmark(skill.name, skill.target, skill.category));
  }

  const currentSkills = skills.map((skill) => ({
    name: skill.skill_name,
    category: skill.category || 'Core Skill',
    current: getCurrentMastery(skill),
  }));

  const mappedTargets = Array.from(benchmarks.values()).map((targetSkill) => {
    const currentSkill = currentSkills.find((skill) => isSameSkill(skill.name, targetSkill.name));
    const current = currentSkill?.current ?? 0;
    const category = targetSkill.category === 'Target Skill' ? currentSkill?.category || targetSkill.category : targetSkill.category;
    return {
      name: targetSkill.name,
      category,
      current,
      target: targetSkill.target,
    };
  });

  const source = mappedTargets.length > 0
    ? mappedTargets
    : currentSkills.map((skill) => ({
      ...skill,
      target: Math.min(5, skill.current + 1),
    }));

  return source
    .map((skill) => ({ ...skill, gap: skill.target - skill.current }))
    .filter((skill) => skill.gap > 0)
    .sort((a, b) => b.gap - a.gap)
    .slice(0, 4);
};

export const SkillFocusWidget: React.FC<SkillFocusWidgetProps> = ({
  skills,
  activeGoal,
  activeCourses = [],
  targetSkills = [],
  targetRole,
}) => {
  const priorities = useMemo(
    () => buildSkillFocusPriorities({ skills, activeGoal, activeCourses, targetSkills, targetRole }),
    [activeCourses, activeGoal, skills, targetRole, targetSkills],
  );

  const pathwayUrl = activeGoal?.id ? `/pathway/${activeGoal.id}` : '/parse';

  return (
    <section className="w-full bg-white border border-slate-200 rounded-2xl p-6 shadow-sm dark:bg-slate-900/80 dark:border-slate-800/80 dark:shadow-xl">
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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {priorities.length === 0 && (
          <div className="md:col-span-2 rounded-xl border border-dashed border-slate-300 bg-slate-50 p-5 text-center dark:border-slate-800 dark:bg-slate-950/50">
            <p className="text-sm font-bold text-slate-900 dark:text-white">No priority gaps detected</p>
            <p className="mt-1 text-xs text-slate-600 dark:text-slate-400">
              Add a goal or refresh your roadmap to calculate the next target skills.
            </p>
          </div>
        )}

        {priorities.map((skill) => {
          const progress = skill.target > 0 ? Math.round((skill.current / skill.target) * 100) : 0;
          return (
            <div
              key={skill.name}
              className="space-y-2 rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950/50"
            >
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
