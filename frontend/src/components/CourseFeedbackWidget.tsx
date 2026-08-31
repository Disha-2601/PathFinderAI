import React, { useState } from 'react';
import { Check, Gauge, Star } from 'lucide-react';
import { userApi } from '../services/api';
import { useToast } from '../context/ToastContext';

type DifficultyRating = 'Too Easy' | 'Just Right' | 'Too Difficult';

interface CourseFeedbackWidgetProps {
  courseId: string;
  courseTitle: string;
  compact?: boolean;
}

const difficultyOptions: DifficultyRating[] = ['Too Easy', 'Just Right', 'Too Difficult'];

export const CourseFeedbackWidget: React.FC<CourseFeedbackWidgetProps> = ({
  courseId,
  courseTitle,
  compact = false,
}) => {
  const [rating, setRating] = useState<number>(5);
  const [hoverRating, setHoverRating] = useState<number>(0);
  const [difficulty, setDifficulty] = useState<DifficultyRating>('Just Right');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const { showToast } = useToast();

  const handleSubmit = async () => {
    try {
      setIsSubmitting(true);
      await userApi.submitFeedback({
        course_id: courseId,
        rating,
        comments: `Difficulty rating: ${difficulty}`,
        relevance_score: difficulty === 'Just Right' ? 1 : 0.78,
      });
      showToast('success', 'Feedback Submitted', `Your rating for "${courseTitle}" was recorded.`);
    } catch (error: any) {
      showToast('error', 'Feedback Error', error.response?.data?.message || 'Failed to submit feedback.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={`${compact ? 'p-0' : 'p-4 rounded-2xl bg-slate-900/80 border border-slate-800'}`}>
      <div className="flex items-center justify-between gap-3 mb-3">
        <p className="text-sm font-bold text-white flex items-center gap-2">
          <Gauge className="w-4 h-4 text-cyan-400" />
          Course Feedback
        </p>
        <button
          type="button"
          onClick={handleSubmit}
          disabled={isSubmitting}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold disabled:opacity-50"
        >
          <Check className="w-3.5 h-3.5" />
          {isSubmitting ? 'Submitting' : 'Submit'}
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-2 mb-3">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => setRating(star)}
            onMouseEnter={() => setHoverRating(star)}
            onMouseLeave={() => setHoverRating(0)}
            className="p-1 text-slate-600 hover:scale-110 transition-transform"
            title={`${star} star${star === 1 ? '' : 's'}`}
          >
            <Star
              className={`w-5 h-5 transition-colors ${
                (hoverRating || rating) >= star ? 'text-amber-400 fill-amber-400' : 'text-slate-600'
              }`}
            />
          </button>
        ))}
        <span className="text-xs font-semibold text-slate-300">{hoverRating || rating} / 5</span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
        {difficultyOptions.map((option) => (
          <button
            key={option}
            type="button"
            onClick={() => setDifficulty(option)}
            className={`px-3 py-2 rounded-lg border text-xs font-bold transition-all ${
              difficulty === option
                ? 'bg-indigo-950 text-indigo-300 border-indigo-500/50'
                : 'bg-slate-950/70 text-slate-400 border-slate-800 hover:text-white'
            }`}
          >
            {option}
          </button>
        ))}
      </div>
    </div>
  );
};
