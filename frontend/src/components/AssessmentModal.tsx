import React, { useMemo, useState } from 'react';
import { AlertTriangle, CheckCircle2, GraduationCap, X } from 'lucide-react';
import { Course, AssessmentQuestion } from '../types';
import { userApi } from '../services/api';
import { useToast } from '../context/ToastContext';

interface AssessmentModalProps {
  course: Course | null;
  isOpen: boolean;
  onClose: () => void;
  onPassed: (course: Course, score: number) => void;
  onRerouted: (course: Course, score: number) => void;
}

const buildQuestions = (course: Course): AssessmentQuestion[] => {
  const skills = (course.skills_covered || [])
    .map((skill) => (typeof skill === 'string' ? skill : skill.skill_name))
    .filter(Boolean);
  const primarySkill = skills[0] || course.title.split(' ').slice(0, 2).join(' ');
  const secondarySkill = skills[1] || 'prerequisite knowledge';

  return [
    {
      id: 'goal-fit',
      prompt: `What is the strongest reason to complete "${course.title}" in this roadmap?`,
      options: [
        `It builds practical mastery in ${primarySkill}.`,
        'It replaces every later module automatically.',
        'It only improves account settings.',
        'It removes the need for assessments.',
      ],
      correctIndex: 0,
    },
    {
      id: 'dag',
      prompt: 'How should blocked prerequisite nodes be handled in a DAG-based learning path?',
      options: [
        'Skip them and keep the final score unchanged.',
        'Complete or review prerequisites before dependent modules.',
        'Mark every dependent node complete.',
        'Hide them from the roadmap permanently.',
      ],
      correctIndex: 1,
    },
    {
      id: 'difficulty',
      prompt: `For a ${course.difficulty} course, what is the best learning signal after completion?`,
      options: [
        'A random course rating only.',
        'The number of external links opened.',
        'Assessment score plus feedback on difficulty and relevance.',
        'The visual theme of the dashboard.',
      ],
      correctIndex: 2,
    },
    {
      id: 'adaptive',
      prompt: `If your mastery of ${secondarySkill} is weak, what should PathFinder AI do?`,
      options: [
        'Add a foundational review module before advancing.',
        'Archive the active career goal.',
        'Delete all completed modules.',
        'Increase course cost estimates.',
      ],
      correctIndex: 0,
    },
  ];
};

export const AssessmentModal: React.FC<AssessmentModalProps> = ({
  course,
  isOpen,
  onClose,
  onPassed,
  onRerouted,
}) => {
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const { showToast } = useToast();
  const questions = useMemo(() => (course ? buildQuestions(course) : []), [course]);

  if (!isOpen || !course) return null;

  const answeredCount = Object.keys(answers).length;
  const canSubmit = answeredCount === questions.length;

  const handleSubmit = async () => {
    const correct = questions.filter((question) => answers[question.id] === question.correctIndex).length;
    const score = Math.round((correct / questions.length) * 100);

    try {
      setIsSubmitting(true);
      if (score < 60) {
        await userApi.submitFeedback({
          course_id: course.id,
          rating: 2,
          comments: `Assessment score ${score}%. Score threshold not met; adaptive rerouting requested.`,
          relevance_score: 0.6,
        });
        onRerouted(course, score);
        showToast(
          'warning',
          'Roadmap Updated',
          'Score threshold not met. PathFinder AI has updated your roadmap with a foundational review module.'
        );
      } else {
        onPassed(course, score);
        showToast('success', 'Assessment Passed', `${score}% mastery recorded for "${course.title}".`);
      }
    } catch (error: any) {
      if (score < 60) {
        onRerouted(course, score);
        showToast(
          'warning',
          'Roadmap Updated Locally',
          'Score threshold not met. PathFinder AI has updated your roadmap with a foundational review module.'
        );
      } else {
        onPassed(course, score);
        showToast('success', 'Assessment Passed', `${score}% mastery recorded for "${course.title}".`);
      }
    } finally {
      setIsSubmitting(false);
      setAnswers({});
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-fade-in">
      <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl bg-slate-900 border border-slate-700 shadow-2xl">
        <div className="sticky top-0 z-10 flex items-start justify-between gap-4 p-5 border-b border-slate-800 bg-slate-900/95 backdrop-blur">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-cyan-400 flex items-center gap-2">
              <GraduationCap className="w-4 h-4" />
              Module Completion Assessment
            </p>
            <h3 className="text-lg font-extrabold text-white mt-1">{course.title}</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-400 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          <div className="flex items-start gap-2 p-3 rounded-xl bg-amber-950/50 border border-amber-500/30 text-amber-100">
            <AlertTriangle className="w-4 h-4 mt-0.5 text-amber-300 flex-shrink-0" />
            <p className="text-xs leading-relaxed">
              Passing threshold is 60%. Scores below threshold trigger adaptive re-routing and a foundational review module.
            </p>
          </div>

          {questions.map((question, index) => (
            <fieldset key={question.id} className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800">
              <legend className="text-sm font-bold text-white mb-3">
                {index + 1}. {question.prompt}
              </legend>
              <div className="space-y-2">
                {question.options.map((option, optionIndex) => (
                  <label
                    key={option}
                    className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                      answers[question.id] === optionIndex
                        ? 'bg-cyan-950/70 border-cyan-500/40 text-cyan-100'
                        : 'bg-slate-900/80 border-slate-800 text-slate-300 hover:border-slate-700'
                    }`}
                  >
                    <input
                      type="radio"
                      name={question.id}
                      value={optionIndex}
                      checked={answers[question.id] === optionIndex}
                      onChange={() => setAnswers((prev) => ({ ...prev, [question.id]: optionIndex }))}
                      className="accent-cyan-400"
                    />
                    <span className="text-sm">{option}</span>
                  </label>
                ))}
              </div>
            </fieldset>
          ))}

          <div className="flex items-center justify-between gap-3 pt-2">
            <span className="text-xs font-semibold text-slate-400">
              {answeredCount}/{questions.length} answered
            </span>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={!canSubmit || isSubmitting}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-bold disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <CheckCircle2 className="w-4 h-4" />
              {isSubmitting ? 'Scoring' : 'Submit Assessment'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
