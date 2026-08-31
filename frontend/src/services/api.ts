import axios from 'axios';
import { User, Goal, Course, Skill, Assessment, UserStats, ParseGoalResponse } from '../types';

// Use relative /api to benefit from Vite proxy or environment override
const API_BASE_URL = import.meta.env?.VITE_API_URL || '/api';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000,
});

// Attach JWT token from localStorage to every outgoing request
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('pathfinder_token');
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => Promise.reject(error));

// Global response error handler
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      console.warn('⚠️ [API Client] 401 Unauthorized');
    }
    return Promise.reject(error);
  }
);

// 1. Auth API
export const authApi = {
  login: async (email: string, password: string) => {
    const res = await apiClient.post<{ status: string; token: string; user: User }>('/auth/login', { email, password });
    return res.data;
  },
  register: async (userData: {
    email: string;
    password: string;
    full_name: string;
    role?: string;
    target_role?: string;
    experience_level?: string;
    bio?: string;
  }) => {
    const res = await apiClient.post<{ status: string; token: string; user: User }>('/auth/register', userData);
    return res.data;
  },
  me: async () => {
    const res = await apiClient.get<{ status: string; user: User }>('/auth/me');
    return res.data;
  },
};

// 2. Goals & AI Recommendation API
export const goalsApi = {
  parse: async (raw_prompt: string, user_id?: string) => {
    const res = await apiClient.post<ParseGoalResponse>('/goals/parse', { raw_prompt, user_id });
    return res.data;
  },
  recommend: async (
    goal_id?: string,
    user_id?: string,
    limit: number = 10,
    target_role?: string,
    target_skills?: string[]
  ) => {
    const res = await apiClient.post<{
      status: string;
      goal_id: string;
      user_id: string;
      target_role: string;
      total_evaluated: number;
      recommendations: Course[];
    }>('/goals/recommend', { goal_id, user_id, limit, target_role, target_skills });
    return res.data;
  },
  getById: async (id: string) => {
    const res = await apiClient.get<{
      status: string;
      goal: Goal;
      target_skills?: string[];
      recommendations: Course[];
    }>(`/goals/${id}`);
    return res.data;
  },
  list: async (userId?: string) => {
    const params = userId ? { user_id: userId } : {};
    const res = await apiClient.get<{ status: string; goals: Goal[] }>('/goals', { params });
    return res.data;
  },
  chat: async (payload: {
    message: string;
    context?: {
      user_id?: string;
      goal_id?: string;
      target_role?: string;
      progress_percent?: number;
    };
  }) => {
    const res = await apiClient.post<{
      status: string;
      reply: string;
      source?: string;
    }>('/goals/chat', payload);
    return res.data;
  },
};

// 3. User Progress & Feedback API
export const userApi = {
  getProfile: async (userId?: string) => {
    const params = userId ? { user_id: userId } : {};
    const res = await apiClient.get<{
      status: string;
      user: User;
      skills: Skill[];
      goals: Goal[];
      assessments: Assessment[];
      stats: UserStats;
    }>('/user/profile', { params });
    return res.data;
  },
  submitFeedback: async (feedback: {
    course_id: string;
    rating: number;
    comments?: string;
    relevance_score?: number;
    user_id?: string;
  }) => {
    const res = await apiClient.post<{
      status: string;
      message: string;
      feedback: any;
    }>('/user/feedback', feedback);
    return res.data;
  },
  upsertSkill: async (skillData: {
    skill_id: string;
    proficiency_level: number;
    verified?: boolean;
    user_id?: string;
  }) => {
    const res = await apiClient.post<{
      status: string;
      message: string;
      skill: any;
    }>('/user/skills', skillData);
    return res.data;
  },
};
