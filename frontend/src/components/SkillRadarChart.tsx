import React, { useState } from 'react';
import {
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  Tooltip,
  Legend,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid
} from 'recharts';
import { Skill } from '../types';
import { Layers, BarChart2, PieChart } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

interface SkillRadarChartProps {
  skills: Skill[];
  targetSkills?: string[];
}

export const SkillRadarChart: React.FC<SkillRadarChartProps> = ({ skills, targetSkills = [] }) => {
  const [chartType, setChartType] = useState<'radar' | 'bar'>('radar');
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const gridStroke = isDark ? '#334155' : '#cbd5e1';
  const primaryTick = isDark ? '#94a3b8' : '#334155';
  const secondaryTick = isDark ? '#64748b' : '#475569';
  const tooltipStyle = {
    backgroundColor: isDark ? '#0f172a' : '#ffffff',
    borderColor: isDark ? '#334155' : '#cbd5e1',
    borderRadius: '12px',
    boxShadow: isDark ? '0 10px 25px -5px rgba(0, 0, 0, 0.5)' : '0 10px 25px -8px rgba(15, 23, 42, 0.18)',
    fontSize: '12px',
    color: isDark ? '#f8fafc' : '#0f172a'
  };

  // Format data for comparison
  const chartData = skills.slice(0, 8).map((skill) => {
    const isTarget = targetSkills.some(ts => ts.toLowerCase().includes(skill.skill_name.toLowerCase()) || skill.skill_name.toLowerCase().includes(ts.toLowerCase()));
    return {
      skill: skill.skill_name.length > 18 ? `${skill.skill_name.substring(0, 16)}...` : skill.skill_name,
      fullName: skill.skill_name,
      initialProficiency: skill.initial_proficiency_level ?? Math.max(1, skill.proficiency_level - (skill.verified ? 2 : 1)),
      currentMastery: skill.proficiency_level,
      targetRequirement: isTarget ? 5 : (skill.proficiency_level < 4 ? skill.proficiency_level + 1 : 5),
      verified: skill.verified ? 'Verified' : 'Self-Reported',
    };
  });

  // Fallback placeholder data if user has no skills yet
  const displayData = chartData.length > 0 ? chartData : [
    { skill: 'Python', fullName: 'Python Programming', initialProficiency: 2, currentMastery: 4, targetRequirement: 5 },
    { skill: 'FastAPI', fullName: 'FastAPI & Async Python', initialProficiency: 1, currentMastery: 3, targetRequirement: 5 },
    { skill: 'PostgreSQL', fullName: 'PostgreSQL & DBs', initialProficiency: 2, currentMastery: 3, targetRequirement: 4 },
    { skill: 'pgvector', fullName: 'Vector Databases', initialProficiency: 1, currentMastery: 2, targetRequirement: 5 },
    { skill: 'LLMs', fullName: 'Large Language Models', initialProficiency: 1, currentMastery: 2, targetRequirement: 5 },
    { skill: 'RAG', fullName: 'Retrieval-Augmented Gen', initialProficiency: 1, currentMastery: 1, targetRequirement: 4 },
    { skill: 'AI Agents', fullName: 'Autonomous Tool Agents', initialProficiency: 1, currentMastery: 1, targetRequirement: 5 },
  ];

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-6 backdrop-blur-xl shadow-sm dark:bg-slate-900/80 dark:border-slate-800/80 dark:shadow-xl h-full">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white tracking-tight flex items-center space-x-2">
            <Layers className="w-4 h-4 text-cyan-400" />
            <span>Skill Gap & Mastery Matrix</span>
          </h3>
          <p className="text-xs text-slate-600 dark:text-slate-400">Initial proficiency vs. current mastery and target benchmark (Scale: 1-5)</p>
        </div>

        {/* Toggle between Radar and Bar Chart */}
        <div className="flex items-center space-x-1 p-1 bg-slate-100 rounded-xl border border-slate-200 dark:bg-slate-950/80 dark:border-slate-800">
          <button
            onClick={() => setChartType('radar')}
            title="Radar Chart View"
            className={`p-1.5 rounded-lg transition-all ${
              chartType === 'radar' ? 'bg-cyan-100 text-cyan-700 border border-cyan-500/30 dark:bg-cyan-950 dark:text-cyan-400' : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
            }`}
          >
            <PieChart className="w-4 h-4" />
          </button>
          <button
            onClick={() => setChartType('bar')}
            title="Bar Chart View"
            className={`p-1.5 rounded-lg transition-all ${
              chartType === 'bar' ? 'bg-indigo-100 text-indigo-700 border border-indigo-500/30 dark:bg-indigo-950 dark:text-indigo-400' : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
            }`}
          >
            <BarChart2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="h-[280px] sm:h-[320px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          {chartType === 'radar' ? (
            <RadarChart cx="50%" cy="50%" outerRadius="75%" data={displayData}>
              <PolarGrid stroke={gridStroke} strokeDasharray="3 3" />
              <PolarAngleAxis dataKey="skill" tick={{ fill: primaryTick, fontSize: 11 }} />
              <PolarRadiusAxis angle={30} domain={[0, 5]} tick={{ fill: secondaryTick, fontSize: 10 }} />
              <Tooltip contentStyle={tooltipStyle} />
              <Legend
                wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }}
                iconType="circle"
              />
              <Radar
                name="Initial Proficiency"
                dataKey="initialProficiency"
                stroke="#f59e0b"
                fill="#f59e0b"
                fillOpacity={0.18}
              />
              <Radar
                name="Current Mastery"
                dataKey="currentMastery"
                stroke="#38bdf8"
                fill="#38bdf8"
                fillOpacity={0.4}
              />
              <Radar
                name="Target Benchmark"
                dataKey="targetRequirement"
                stroke="#a855f7"
                fill="#a855f7"
                fillOpacity={0.25}
              />
            </RadarChart>
          ) : (
            <BarChart data={displayData} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} />
              <XAxis dataKey="skill" tick={{ fill: primaryTick, fontSize: 10 }} interval={0} angle={-25} textAnchor="end" />
              <YAxis domain={[0, 5]} tick={{ fill: secondaryTick, fontSize: 11 }} />
              <Tooltip contentStyle={tooltipStyle} />
              <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '5px' }} />
              <Bar name="Initial Proficiency" dataKey="initialProficiency" fill="#f59e0b" radius={[4, 4, 0, 0]} />
              <Bar name="Current Mastery" dataKey="currentMastery" fill="#38bdf8" radius={[4, 4, 0, 0]} />
              <Bar name="Target Benchmark" dataKey="targetRequirement" fill="#a855f7" radius={[4, 4, 0, 0]} />
            </BarChart>
          )}
        </ResponsiveContainer>
      </div>
    </div>
  );
};
