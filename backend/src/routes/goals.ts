import { Router, Response } from 'express';
import axios from 'axios';
import { z } from 'zod';
import { query, pool } from '../config/db';
import { optionalAuthMiddleware, AuthenticatedRequest } from '../middleware/auth';

const router = Router();
const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:8000';
const AI_REQUEST_TIMEOUT_MS = Number(process.env.AI_REQUEST_TIMEOUT_MS || 60000);

const parseGoalSchema = z.object({
  raw_prompt: z.string().min(1, 'raw_prompt cannot be empty'),
  user_id: z.string().uuid().optional()
});

const recommendSchema = z.object({
  goal_id: z.string().uuid().optional(),
  user_id: z.string().uuid().optional(),
  target_role: z.string().optional(),
  target_skills: z.array(z.string()).optional(),
  limit: z.number().int().positive().max(50).optional().default(10)
});

const chatSchema = z.object({
  message: z.string().min(1, 'message cannot be empty'),
  context: z.object({
    user_id: z.string().uuid().optional(),
    goal_id: z.string().uuid().optional(),
    target_role: z.string().optional(),
    progress_percent: z.number().min(0).max(100).optional()
  }).optional()
});

const getNodeStatus = (rank: number, currentStep: number, scoreBreakdown: any) => {
  if (scoreBreakdown?.time_fit !== undefined && Number(scoreBreakdown.time_fit) < 0.65) {
    return 'ai_adjusted';
  }
  if (rank < currentStep) return 'completed';
  if (rank === currentStep) return 'in_progress';
  return 'locked';
};

const getFallbackUserId = async (candidateUserId?: string) => {
  if (candidateUserId) return candidateUserId;

  const demoUserRes = await query(`SELECT id FROM users WHERE email = 'alex.rivera@pathfinder.ai' LIMIT 1;`);
  if (demoUserRes.rows.length > 0) return demoUserRes.rows[0].id;

  const anyUserRes = await query('SELECT id FROM users LIMIT 1;');
  return anyUserRes.rows[0]?.id;
};

const inferGoalFromPrompt = (rawPrompt: string) => {
  const prompt = rawPrompt.trim();
  const lowerPrompt = prompt.toLowerCase();
  const monthsMatch = lowerPrompt.match(/(\d+)\s*(month|months|mo)\b/);
  const weeksMatch = lowerPrompt.match(/(\d+)\s*(week|weeks|wk|wks)\b/);
  const hoursMatch = lowerPrompt.match(/(\d+)\s*(hour|hours|hr|hrs)\s*(?:\/|per)?\s*(week|wk)?/);
  const targetRoleMatch = prompt.match(/(?:become|as|into|to be|transition to)\s+(?:an?\s+)?([^,.]+?)(?:\s+in\s+\d+|\s+within\s+\d+| with | focused | using |$)/i);

  const targetSkills = [
    ['sql', 'SQL'],
    ['postgres', 'PostgreSQL & Relational DBs'],
    ['pandas', 'Pandas'],
    ['powerbi', 'PowerBI'],
    ['power bi', 'PowerBI'],
    ['tableau', 'Tableau'],
    ['business intelligence', 'Business Intelligence'],
    ['bi ', 'Business Intelligence'],
    ['statistics', 'Statistics'],
    ['statistical', 'Statistics'],
    ['analytics', 'Data Analytics'],
    ['analyst', 'Data Analytics'],
    ['data visualization', 'Data Visualization'],
    ['llm', 'Large Language Models (LLMs)'],
    ['rag', 'Retrieval-Augmented Generation'],
    ['vector', 'Vector Databases'],
    ['fastapi', 'FastAPI'],
    ['python', 'Python'],
    ['react', 'React'],
    ['distributed', 'Distributed Systems'],
    ['agent', 'AI Agents & Tool Orchestration'],
    ['postgres', 'PostgreSQL'],
    ['go ', 'Go (Golang)'],
    ['rust', 'Rust']
  ]
    .filter(([needle]) => lowerPrompt.includes(needle))
    .map(([, skill]) => skill);

  const timeframeWeeks = weeksMatch
    ? Number(weeksMatch[1])
    : monthsMatch
      ? Number(monthsMatch[1]) * 4
      : 24;

  return {
    target_role: targetRoleMatch?.[1]?.trim() || (lowerPrompt.includes('data analyst') ? 'Data Analyst' : 'AI & Backend Software Engineer'),
    timeframe_weeks: Math.max(1, timeframeWeeks),
    weekly_hours: hoursMatch ? Math.max(1, Number(hoursMatch[1])) : 10,
    experience_level: lowerPrompt.includes('beginner')
      ? 'beginner'
      : lowerPrompt.includes('senior') || lowerPrompt.includes('advanced')
        ? 'advanced'
        : 'intermediate',
    preferred_learning_style: lowerPrompt.includes('reading')
      ? 'reading_theory'
      : lowerPrompt.includes('visual')
        ? 'visual'
        : lowerPrompt.includes('project') || lowerPrompt.includes('hands')
          ? 'hands_on_projects'
          : 'mixed',
    target_skills: targetSkills.length > 0 ? Array.from(new Set(targetSkills)) : ['Python', 'FastAPI', 'Large Language Models (LLMs)'],
    notes: prompt
  };
};

const normalizeParsedGoalWithPrompt = (rawPrompt: string, parsedData: any) => {
  const inferred = inferGoalFromPrompt(rawPrompt);
  const promptText = rawPrompt.toLowerCase();
  const parsedRole = String(parsedData?.target_role || '');
  const genericParserRole = /ai\s*&?\s*backend|software engineer/i.test(parsedRole);
  const explicitDataAnalystGoal = /\bdata analyst\b|\banalytics?\b|\bsql\b|dashboard|business intelligence|power\s?bi|tableau|statistics/.test(promptText);

  const parsedSkills = (parsedData?.target_skills || []) as string[];
  const mergedSkills = Array.from(
    new Set([
      ...(explicitDataAnalystGoal && genericParserRole ? [] : parsedSkills),
      ...(explicitDataAnalystGoal ? inferred.target_skills : [])
    ].filter(Boolean))
  );

  return {
    ...parsedData,
    target_role: explicitDataAnalystGoal && genericParserRole ? inferred.target_role : parsedData?.target_role || inferred.target_role,
    timeframe_weeks: parsedData?.timeframe_weeks || inferred.timeframe_weeks,
    weekly_hours: parsedData?.weekly_hours || inferred.weekly_hours,
    experience_level: parsedData?.experience_level || inferred.experience_level,
    preferred_learning_style: parsedData?.preferred_learning_style || inferred.preferred_learning_style,
    target_skills: mergedSkills.length > 0 ? mergedSkills : inferred.target_skills,
    notes: parsedData?.notes || rawPrompt
  };
};

const inferTargetSkillsFromGoalText = (targetRole?: string, notes?: string | null) => {
  const text = `${targetRole || ''} ${notes || ''}`.toLowerCase();
  const skillMatchers: Array<[RegExp, string]> = [
    [/\bsql\b|postgres|relational database/, 'SQL'],
    [/pandas/, 'Pandas'],
    [/power\s?bi|powerbi/, 'PowerBI'],
    [/tableau/, 'Tableau'],
    [/business intelligence|\bbi\b/, 'Business Intelligence'],
    [/statistics|statistical/, 'Statistics'],
    [/data analy|analytics|analyst/, 'Data Analytics'],
    [/visuali[sz]ation|dashboard/, 'Data Visualization'],
    [/python/, 'Python Programming'],
    [/fastapi/, 'FastAPI & Async Python'],
    [/\bllm|large language model/, 'Large Language Models (LLMs)'],
    [/\brag\b|retrieval-augmented/, 'Retrieval-Augmented Generation (RAG)'],
    [/vector|pgvector/, 'Vector Databases & pgvector'],
    [/react/, 'React & Frontend Architecture'],
    [/typescript|javascript/, 'TypeScript & JavaScript']
  ];

  return Array.from(
    new Set(
      skillMatchers
        .filter(([pattern]) => pattern.test(text))
        .map(([, skill]) => skill)
    )
  );
};

const clearGoalRecommendations = async (goalId?: string) => {
  if (!goalId) return;
  await query('DELETE FROM goal_recommendations WHERE goal_id = $1;', [goalId]);
};

const getGoalRecommendationContext = async (
  goalId?: string,
  explicitTargetRole?: string,
  explicitTargetSkills?: string[]
) => {
  const cleanExplicitSkills = (explicitTargetSkills || []).map((skill) => skill.trim()).filter(Boolean);
  if (!goalId) {
    return {
      targetRole: explicitTargetRole,
      targetSkills: cleanExplicitSkills
    };
  }

  const goalRes = await query('SELECT target_role, notes FROM goals WHERE id = $1;', [goalId]);
  const goal = goalRes.rows[0];
  const targetRole = explicitTargetRole || goal?.target_role;
  const inferredSkills = inferTargetSkillsFromGoalText(targetRole, goal?.notes);

  return {
    targetRole,
    targetSkills: cleanExplicitSkills.length > 0 ? cleanExplicitSkills : inferredSkills
  };
};

const persistGoalRecommendations = async (goalId: string, recommendations: any[]) => {
  if (!goalId || recommendations.length === 0) return;

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query('DELETE FROM goal_recommendations WHERE goal_id = $1;', [goalId]);

    for (let i = 0; i < recommendations.length; i++) {
      const rec = recommendations[i];
      await client.query(
        `INSERT INTO goal_recommendations (goal_id, course_id, rank, match_percentage, score_breakdown)
         VALUES ($1, $2, $3, $4, $5);`,
        [
          goalId,
          rec.id,
          i + 1,
          rec.match_percentage || (rec.score_breakdown?.final_score ? (rec.score_breakdown.final_score * 100).toFixed(1) : 90),
          JSON.stringify(rec.score_breakdown || {})
        ]
      );
    }

    await client.query('UPDATE goals SET updated_at = CURRENT_TIMESTAMP WHERE id = $1;', [goalId]);
    await client.query('COMMIT');
  } catch (dbErr) {
    await client.query('ROLLBACK');
    throw dbErr;
  } finally {
    client.release();
  }
};

const fetchGoalRecommendationRows = async (goalId: string, currentStep: number) => {
  const recsResult = await query(
    `SELECT 
       COALESCE((gr.score_breakdown->>'final_score')::numeric, gr.match_percentage / 100, 0) AS match_score,
       gr.rank,
       gr.match_percentage,
       gr.score_breakdown,
       c.id,
       c.title,
       c.provider,
       c.description,
       c.difficulty,
       c.duration_hours,
       c.rating,
       c.url,
       c.cost,
       COALESCE(
         json_agg(
           DISTINCT jsonb_build_object(
             'skill_id', s.id,
             'skill_name', s.name,
             'proficiency_level', cs.proficiency_level
           )
         ) FILTER (WHERE s.id IS NOT NULL), '[]'
       ) AS skills_covered,
       COALESCE(
         json_agg(
           DISTINCT jsonb_build_object(
             'course_id', pc.id,
             'title', pc.title,
             'is_mandatory', cp.is_mandatory,
             'status', CASE WHEN completed_gr.rank IS NOT NULL AND completed_gr.rank < gr.rank THEN 'met' ELSE 'pending' END
           )
         ) FILTER (WHERE pc.id IS NOT NULL), '[]'
       ) AS prerequisites
     FROM goal_recommendations gr
     JOIN courses c ON gr.course_id = c.id
     LEFT JOIN course_skills cs ON c.id = cs.course_id
     LEFT JOIN skills s ON cs.skill_id = s.id
     LEFT JOIN course_prerequisites cp ON c.id = cp.course_id
     LEFT JOIN courses pc ON cp.prerequisite_course_id = pc.id
     LEFT JOIN goal_recommendations completed_gr ON completed_gr.goal_id = gr.goal_id AND completed_gr.course_id = pc.id
     WHERE gr.goal_id = $1
     GROUP BY gr.id, gr.rank, gr.match_percentage, gr.score_breakdown, c.id, c.title, c.provider, c.description, c.difficulty, c.duration_hours, c.rating, c.url, c.cost
     ORDER BY match_score DESC, gr.rank ASC;`,
    [goalId]
  );

  return recsResult.rows.map((row) => {
    const scoreBreakdown = typeof row.score_breakdown === 'string' ? JSON.parse(row.score_breakdown) : row.score_breakdown;
    const rank = Number(row.rank);
    const nodeStatus = getNodeStatus(rank, currentStep, scoreBreakdown);

    return {
      ...row,
      rank,
      match_score: Number(row.match_score),
      match_percentage: Number(row.match_percentage),
      score_breakdown: scoreBreakdown,
      node_status: nodeStatus,
      ai_adjusted: nodeStatus === 'ai_adjusted'
    };
  });
};

const generateRecommendationsForGoal = async (
  goalId: string,
  userId?: string,
  targetRole?: string,
  targetSkills?: string[],
  limit: number = 12
) => {
  console.log('🔄 [Goals Recommend] Refreshing cached recommendations for goal:', goalId);
  const goalContext = await getGoalRecommendationContext(goalId, targetRole, targetSkills);
  const aiPayload: Record<string, any> = { goal_id: goalId, limit };
  if (userId) aiPayload.user_id = userId;
  if (goalContext.targetRole) aiPayload.target_role = goalContext.targetRole;
  if (goalContext.targetSkills.length > 0) aiPayload.target_skills = goalContext.targetSkills;

  await clearGoalRecommendations(goalId);

  const response = await axios.post(`${AI_SERVICE_URL}/ai/recommend`, aiPayload, {
    headers: { 'Content-Type': 'application/json' },
    timeout: AI_REQUEST_TIMEOUT_MS
  });

  const recommendations = response.data.recommendations || [];
  await persistGoalRecommendations(goalId, recommendations);
  console.log('✅ [Goals Recommend] Cached recommendations refreshed:', {
    goalId,
    count: recommendations.length
  });
  return recommendations.length;
};

/**
 * POST /api/goals/parse
 * Proxy goal parsing request to AI microservice (Gemini LLM entity & goal extractor).
 */
router.post('/parse', optionalAuthMiddleware, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const parseResult = parseGoalSchema.safeParse(req.body);
    if (!parseResult.success) {
      res.status(400).json({
        status: 'error',
        message: 'Validation failed',
        errors: parseResult.error.errors.map(e => ({ field: e.path.join('.'), message: e.message }))
      });
      return;
    }

    const { raw_prompt } = parseResult.data;
    // Prefer authenticated user_id if token is present, else body, else undefined
    const userId = req.user?.id || parseResult.data.user_id;

    const aiPayload: Record<string, any> = { raw_prompt };
    if (userId) {
      aiPayload.user_id = userId;
    }

    // Call FastAPI AI service
    let parsedResponse: any = null;
    try {
      const response = await axios.post(`${AI_SERVICE_URL}/ai/parse-goal`, aiPayload, {
        headers: { 'Content-Type': 'application/json' },
        timeout: AI_REQUEST_TIMEOUT_MS
      });
      parsedResponse = response.data;
    } catch (aiErr: any) {
      console.warn('⚠️ [Goals Parse] AI parser unavailable, using deterministic parser fallback:', aiErr.response?.data || aiErr.message);
    }

    if (parsedResponse?.goal_id) {
      let recommendationCount = 0;
      let recommendationError: string | undefined;
      const parsedData = normalizeParsedGoalWithPrompt(raw_prompt, parsedResponse.parsed_data || {});
      parsedResponse.parsed_data = parsedData;

      await query(
        `UPDATE goals
         SET target_role = $1,
             target_timeline_months = $2,
             weekly_study_hours = $3,
             preferred_learning_style = $4,
             notes = $5,
             updated_at = CURRENT_TIMESTAMP
         WHERE id = $6;`,
        [
          parsedData.target_role,
          Math.max(1, Math.ceil(Number(parsedData.timeframe_weeks || 12) / 4)),
          Number(parsedData.weekly_hours || 10),
          parsedData.preferred_learning_style || 'hands_on_projects',
          parsedData.notes || raw_prompt,
          parsedResponse.goal_id
        ]
      );

      try {
        recommendationCount = await generateRecommendationsForGoal(
          parsedResponse.goal_id,
          parsedResponse.user_id || userId,
          parsedData.target_role,
          parsedData.target_skills
        );
      } catch (recErr: any) {
        recommendationError = recErr.response?.data?.detail || recErr.message;
        console.warn('⚠️ [Goals Parse] Goal created but recommendation refresh failed:', recErr.response?.data || recErr.message);
      }

      res.status(200).json({
        ...parsedResponse,
        recommendation_count: recommendationCount,
        recommendation_error: recommendationError
      });
      return;
    }

    const fallbackUserId = await getFallbackUserId(userId);
    if (!fallbackUserId) {
      res.status(503).json({
        status: 'error',
        message: 'AI goal parsing is temporarily unavailable and no fallback user exists for local goal creation.'
      });
      return;
    }

    const parsedData = inferGoalFromPrompt(raw_prompt);
    const insertResult = await query(
      `INSERT INTO goals (user_id, target_role, target_timeline_months, weekly_study_hours, preferred_learning_style, notes)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id;`,
      [
        fallbackUserId,
        parsedData.target_role,
        Math.max(1, Math.ceil(parsedData.timeframe_weeks / 4)),
        parsedData.weekly_hours,
        parsedData.preferred_learning_style,
        parsedData.notes
      ]
    );
    const fallbackGoalId = insertResult.rows[0].id;
    let recommendationCount = 0;
    let recommendationError: string | undefined;
    try {
      recommendationCount = await generateRecommendationsForGoal(
        fallbackGoalId,
        fallbackUserId,
        parsedData.target_role,
        parsedData.target_skills
      );
    } catch (recErr: any) {
      recommendationError = recErr.response?.data?.detail || recErr.message;
      console.warn('⚠️ [Goals Parse Fallback] Goal created but recommendation refresh failed:', recErr.response?.data || recErr.message);
    }

    res.status(200).json({
      status: 'fallback',
      goal_id: fallbackGoalId,
      user_id: fallbackUserId,
      parsed_data: parsedData,
      recommendation_count: recommendationCount,
      recommendation_error: recommendationError,
      message: 'AI service is unavailable; generated a deterministic fallback goal.'
    });
  } catch (error: any) {
    console.error('❌ [Goals Parse Error]:', error.response?.data || error.message);
    const statusCode = error.response?.status || 500;
    const detail = error.response?.data?.detail || error.message || 'Failed to parse goal with AI service';
    res.status(statusCode).json({
      status: 'error',
      message: 'Failed to parse career goal prompt.',
      detail
    });
  }
});

/**
 * POST /api/goals/recommend
 * Proxy goal recommendation request to AI microservice and persist the recommended learning path in the database.
 */
router.post('/recommend', optionalAuthMiddleware, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const parseResult = recommendSchema.safeParse(req.body);
    if (!parseResult.success) {
      res.status(400).json({
        status: 'error',
        message: 'Validation failed',
        errors: parseResult.error.errors.map(e => ({ field: e.path.join('.'), message: e.message }))
      });
      return;
    }

    const { goal_id, limit, target_role, target_skills } = parseResult.data;
    const userId = req.user?.id || parseResult.data.user_id;
    const goalContext = await getGoalRecommendationContext(goal_id, target_role, target_skills);

    const aiPayload: Record<string, any> = { limit };
    if (goal_id) aiPayload.goal_id = goal_id;
    if (userId) aiPayload.user_id = userId;
    if (goalContext.targetRole) aiPayload.target_role = goalContext.targetRole;
    if (goalContext.targetSkills.length > 0) aiPayload.target_skills = goalContext.targetSkills;

    // Call FastAPI AI service for multi-factor ranking & recommendations
    try {
      await clearGoalRecommendations(goal_id);

      const response = await axios.post(`${AI_SERVICE_URL}/ai/recommend`, aiPayload, {
        headers: { 'Content-Type': 'application/json' },
        timeout: AI_REQUEST_TIMEOUT_MS
      });

      const data = response.data;
      const resolvedGoalId = data.goal_id;
      const recommendations = data.recommendations || [];

      if (resolvedGoalId && recommendations.length > 0) {
        try {
          await persistGoalRecommendations(resolvedGoalId, recommendations);
        } catch (dbErr) {
          console.error('⚠️ [Goals Recommend DB Persistence Error]:', dbErr);
        }
      }

      res.status(200).json(data);
      return;
    } catch (aiErr: any) {
      console.warn('⚠️ [Goals Recommend] AI service unavailable; no generic local fallback will be returned:', aiErr.response?.data || aiErr.message);
      res.status(aiErr.response?.status || 503).json({
        status: 'error',
        message: 'AI vector recommendation service is unavailable; stale cached recommendations were cleared and no generic fallback courses were returned.',
        detail: aiErr.response?.data?.detail || aiErr.message
      });
      return;
    }
  } catch (error: any) {
    console.error('❌ [Goals Recommend Error]:', error.response?.data || error.message);
    const statusCode = error.response?.status || 500;
    const detail = error.response?.data?.detail || error.message || 'Failed to generate recommendations with AI service';
    res.status(statusCode).json({
      status: 'error',
      message: 'Failed to generate course recommendations.',
      detail
    });
  }
});

/**
 * POST /api/goals/chat
 * Roadmap-aware assistant endpoint. Proxies to the AI service when available and falls back to local progress context.
 */
router.post('/chat', optionalAuthMiddleware, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const parseResult = chatSchema.safeParse(req.body);
    if (!parseResult.success) {
      res.status(400).json({
        status: 'error',
        message: 'Validation failed',
        errors: parseResult.error.errors.map(e => ({ field: e.path.join('.'), message: e.message }))
      });
      return;
    }

    const { message, context } = parseResult.data;
    const userId = req.user?.id || context?.user_id;

    try {
      const aiResponse = await axios.post(`${AI_SERVICE_URL}/ai/chat`, {
        message,
        context: {
          ...context,
          user_id: userId
        }
      }, {
        headers: { 'Content-Type': 'application/json' },
        timeout: 20000
      });

      res.status(200).json({
        status: 'success',
        reply: aiResponse.data.reply || aiResponse.data.message || 'I reviewed your roadmap and recommend continuing your next available module.',
        source: 'ai-service'
      });
      return;
    } catch (aiErr: any) {
      console.warn('⚠️ [Goals Chat] AI service unavailable, using local assistant fallback:', aiErr.response?.data || aiErr.message);
    }

    let activeGoal: any = null;
    let recommendations: any[] = [];
    if (context?.goal_id) {
      const goalRes = await query(
        `SELECT id, target_role, current_step, weekly_study_hours, target_timeline_months
         FROM goals
         WHERE id = $1
         LIMIT 1;`,
        [context.goal_id]
      );
      activeGoal = goalRes.rows[0] || null;
    } else if (userId) {
      const goalRes = await query(
        `SELECT id, target_role, current_step, weekly_study_hours, target_timeline_months
         FROM goals
         WHERE user_id = $1 AND status = 'active'
         ORDER BY created_at DESC
         LIMIT 1;`,
        [userId]
      );
      activeGoal = goalRes.rows[0] || null;
    }

    if (activeGoal?.id) {
      recommendations = await fetchGoalRecommendationRows(activeGoal.id, Number(activeGoal.current_step || 1));
    }

    const completed = recommendations.filter((course) => course.node_status === 'completed').length;
    const inProgress = recommendations.find((course) => course.node_status === 'in_progress') || recommendations[completed] || recommendations[0];
    const progress = recommendations.length > 0 ? Math.round((completed / recommendations.length) * 100) : context?.progress_percent || 0;
    const targetRole = activeGoal?.target_role || context?.target_role || 'your target role';
    const reply = [
      `You are about ${progress}% through the ${targetRole} roadmap.`,
      inProgress
        ? `Your recommended next step is "${inProgress.title}" because it is the next available course node in the DAG.`
        : 'Create or refresh a roadmap so I can recommend the next course node.',
      'After completing a module, take the checkpoint assessment; scores below 60% should trigger a foundational review before you advance.'
    ].join(' ');

    res.status(200).json({
      status: 'success',
      reply,
      source: 'local-fallback'
    });
  } catch (error: any) {
    console.error('❌ [Goals Chat Error]:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to generate roadmap assistant response.',
      detail: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * GET /api/goals/:id
 * Fetch saved goal details and recommended course items.
 */
router.get('/:id', optionalAuthMiddleware, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    let goalId = String(req.params.id);
    const requestedActiveGoal = goalId === 'active' || goalId === 'latest';

    if (requestedActiveGoal) {
      const userId = await getFallbackUserId(req.user?.id || (req.query.user_id as string | undefined));
      if (!userId) {
        res.status(404).json({
          status: 'error',
          message: 'No user found for active goal lookup.'
        });
        return;
      }

      const activeGoalResult = await query(
        `SELECT id
         FROM goals
         WHERE user_id = $1 AND status = 'active'
         ORDER BY updated_at DESC, created_at DESC
         LIMIT 1;`,
        [userId]
      );

      if (activeGoalResult.rows.length === 0) {
        res.status(404).json({
          status: 'error',
          message: 'No active goal found for this user.'
        });
        return;
      }

      goalId = activeGoalResult.rows[0].id;
    }

    // Fetch goal
    const goalResult = await query(
      `SELECT g.id, g.user_id, g.target_role, g.target_timeline_months, g.weekly_study_hours, 
              g.preferred_learning_style, g.status, g.current_step, g.notes, g.created_at, g.updated_at,
              u.full_name as user_name, u.experience_level
       FROM goals g
       LEFT JOIN users u ON g.user_id = u.id
       WHERE g.id = $1;`,
      [goalId]
    );

    if (goalResult.rows.length === 0) {
      res.status(404).json({
        status: 'error',
        message: `Goal with ID ${goalId} not found.`
      });
      return;
    }

    const goal = goalResult.rows[0];

    let recommendations = await fetchGoalRecommendationRows(goalId, Number(goal.current_step || 1));

    if (recommendations.length === 0) {
      await generateRecommendationsForGoal(goalId, goal.user_id);
      recommendations = await fetchGoalRecommendationRows(goalId, Number(goal.current_step || 1));
    }

    const targetSkills = Array.from(
      new Set([
        ...inferTargetSkillsFromGoalText(goal.target_role, goal.notes),
        ...recommendations.flatMap((course: any) =>
          (course.skills_covered || []).map((skill: any) => skill.skill_name).filter(Boolean)
        )
      ])
    );

    res.status(200).json({
      status: 'success',
      goal,
      target_skills: targetSkills,
      recommendations
    });
  } catch (error: any) {
    console.error('❌ [Get Goal By ID Error]:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch goal details.',
      detail: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * GET /api/goals
 * List all goals for the user (or latest goals if user is unspecified).
 */
router.get('/', optionalAuthMiddleware, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id || (req.query.user_id as string);

    let goalsResult;
    if (userId) {
      goalsResult = await query(
        `SELECT g.*, 
                (SELECT COUNT(*) FROM goal_recommendations gr WHERE gr.goal_id = g.id) as recommendation_count
         FROM goals g
         WHERE g.user_id = $1
         ORDER BY g.created_at DESC;`,
        [userId]
      );
    } else {
      goalsResult = await query(
        `SELECT g.*, 
                (SELECT COUNT(*) FROM goal_recommendations gr WHERE gr.goal_id = g.id) as recommendation_count
         FROM goals g
         ORDER BY g.created_at DESC
         LIMIT 20;`
      );
    }

    res.status(200).json({
      status: 'success',
      goals: goalsResult.rows
    });
  } catch (error: any) {
    console.error('❌ [Get Goals Error]:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to list goals.',
      detail: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

export default router;
