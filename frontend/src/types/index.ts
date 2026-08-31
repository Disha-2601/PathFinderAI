export interface User {
  id: string;
  email: string;
  full_name: string;
  role: 'student' | 'professional' | 'mentor' | 'admin';
  target_role?: string;
  experience_level?: string;
  bio?: string;
  created_at?: string;
  updated_at?: string;
}

export interface Skill {
  skill_id: string;
  skill_name: string;
  category: string;
  description?: string;
  proficiency_level: number;
  initial_proficiency_level?: number;
  verified: boolean;
  updated_at?: string;
}

export interface Goal {
  id: string;
  user_id: string;
  target_role: string;
  target_timeline_months: number;
  weekly_study_hours: number;
  preferred_learning_style: 'visual' | 'hands_on_projects' | 'reading_theory' | 'mixed';
  status: 'active' | 'paused' | 'completed' | 'archived';
  current_step: number;
  notes?: string;
  created_at: string;
  updated_at: string;
  user_name?: string;
  experience_level?: string;
  recommendation_count?: number | string;
}

export interface ScoreBreakdown {
  skill_gap_score: number;
  semantic_similarity: number;
  prerequisite_fit: number;
  difficulty_match: number;
  time_fit: number;
  feedback_rating_score: number;
  final_score: number;
}

export interface CourseSkill {
  skill_id: string;
  skill_name: string;
  proficiency_level?: number;
}

export type CourseNodeStatus = 'completed' | 'in_progress' | 'locked' | 'ai_adjusted';

export interface CoursePrerequisite {
  course_id: string;
  title: string;
  is_mandatory: boolean;
  status: 'met' | 'pending';
}

export interface Course {
  id: string;
  title: string;
  provider: string;
  description: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  duration_hours: number;
  rating: number | string;
  url: string;
  cost: number | string;
  rank?: number;
  match_percentage?: number | string;
  score_breakdown?: ScoreBreakdown;
  skills_covered?: CourseSkill[] | string[];
  prerequisites?: CoursePrerequisite[];
  node_status?: CourseNodeStatus;
  ai_adjusted?: boolean;
  phase?: string;
  is_foundational_review?: boolean;
}

export interface AssessmentQuestion {
  id: string;
  prompt: string;
  options: string[];
  correctIndex: number;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

export interface Assessment {
  id: string;
  title: string;
  score: number;
  max_score: number;
  status: string;
  passed: boolean;
  assessment_data?: any;
  created_at: string;
  skill_name?: string;
}

export interface UserStats {
  total_skills_tracked: number;
  verified_skills_count: number;
  active_goals_count: number;
  total_goals_count: number;
  passed_assessments_count: number;
  average_assessment_score: number | null;
  weekly_committed_hours: number;
  feedback_reviews_submitted: number;
  average_feedback_rating: string | null;
}

export interface ParsedGoalData {
  target_role: string;
  timeframe_weeks: number;
  weekly_hours: number;
  experience_level: string;
  preferred_learning_style: string;
  target_skills: string[];
  notes?: string;
}

export interface ParseGoalResponse {
  status: string;
  goal_id: string;
  user_id: string;
  parsed_data: ParsedGoalData;
}
