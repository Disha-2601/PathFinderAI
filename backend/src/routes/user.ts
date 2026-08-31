import { Router, Response } from 'express';
import { z } from 'zod';
import { query } from '../config/db';
import { optionalAuthMiddleware, AuthenticatedRequest } from '../middleware/auth';

const router = Router();

const feedbackSchema = z.object({
  user_id: z.string().uuid().optional(),
  course_id: z.string().uuid('Valid course_id UUID is required'),
  rating: z.number().int().min(1).max(5, 'Rating must be an integer between 1 and 5'),
  comments: z.string().optional(),
  relevance_score: z.number().min(0.0).max(1.0).optional().default(1.0)
});

const userSkillSchema = z.object({
  skill_id: z.string().uuid('Valid skill_id UUID is required'),
  proficiency_level: z.number().int().min(1).max(5, 'Proficiency level must be between 1 and 5'),
  verified: z.boolean().optional().default(false)
});

/**
 * GET /api/user/profile
 * Fetch current user profile, skills matrix, active goals, diagnostic assessments, and progress metrics.
 */
router.get('/profile', optionalAuthMiddleware, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    let userId = req.user?.id || (req.query.user_id as string);

    // Fallback: If no user specified or authenticated, pick demo user or first user in DB
    if (!userId) {
      const demoUserRes = await query(
        `SELECT id FROM users WHERE email = 'alex.rivera@pathfinder.ai' LIMIT 1;`
      );
      if (demoUserRes.rows.length > 0) {
        userId = demoUserRes.rows[0].id;
      } else {
        const anyUserRes = await query('SELECT id FROM users LIMIT 1;');
        if (anyUserRes.rows.length > 0) {
          userId = anyUserRes.rows[0].id;
        } else {
          res.status(404).json({
            status: 'error',
            message: 'No users found in system. Please register a user first.'
          });
          return;
        }
      }
    }

    // 1. Fetch user profile
    const userRes = await query(
      `SELECT id, email, full_name, role, target_role, experience_level, bio, created_at, updated_at
       FROM users 
       WHERE id = $1;`,
      [userId]
    );

    if (userRes.rows.length === 0) {
      res.status(404).json({
        status: 'error',
        message: `User with ID ${userId} not found.`
      });
      return;
    }

    const user = userRes.rows[0];

    // 2. Fetch User Skills
    const skillsRes = await query(
      `SELECT 
         s.id AS skill_id,
         s.name AS skill_name,
         s.category,
         s.description,
         us.proficiency_level,
         us.verified,
         us.updated_at
       FROM user_skills us
       JOIN skills s ON us.skill_id = s.id
       WHERE us.user_id = $1
       ORDER BY us.proficiency_level DESC, s.name ASC;`,
      [userId]
    );

    // 3. Fetch User Goals
    const goalsRes = await query(
      `SELECT g.*, 
              (SELECT COUNT(*) FROM goal_recommendations gr WHERE gr.goal_id = g.id) as recommendation_count
       FROM goals g
       WHERE g.user_id = $1
       ORDER BY g.created_at DESC;`,
      [userId]
    );

    // 4. Fetch User Assessments
    const assessmentsRes = await query(
      `SELECT 
         a.id,
         a.title,
         a.score,
         a.max_score,
         a.status,
         a.passed,
         a.assessment_data,
         a.created_at,
         s.name AS skill_name
       FROM assessments a
       LEFT JOIN skills s ON a.skill_id = s.id
       WHERE a.user_id = $1
       ORDER BY a.created_at DESC;`,
      [userId]
    );

    // 5. Fetch User Feedback Count
    const feedbackRes = await query(
      `SELECT COUNT(*) as feedback_count, AVG(rating) as avg_rating_given
       FROM user_feedback
       WHERE user_id = $1;`,
      [userId]
    );

    // 6. Compute progress statistics
    const skills = skillsRes.rows;
    const goals = goalsRes.rows;
    const assessments = assessmentsRes.rows;
    const feedbackSummary = feedbackRes.rows[0];

    const activeGoals = goals.filter((g: any) => g.status === 'active');
    const verifiedSkillsCount = skills.filter((s: any) => s.verified).length;
    const passedAssessmentsCount = assessments.filter((a: any) => a.passed).length;
    const avgAssessmentScore = assessments.length > 0
      ? Math.round(assessments.reduce((sum: number, a: any) => sum + (a.score || 0), 0) / assessments.length)
      : null;

    const totalWeeklyHours = activeGoals.reduce((sum: number, g: any) => sum + (g.weekly_study_hours || 0), 0);

    res.status(200).json({
      status: 'success',
      user,
      skills,
      goals,
      assessments,
      stats: {
        total_skills_tracked: skills.length,
        verified_skills_count: verifiedSkillsCount,
        active_goals_count: activeGoals.length,
        total_goals_count: goals.length,
        passed_assessments_count: passedAssessmentsCount,
        average_assessment_score: avgAssessmentScore,
        weekly_committed_hours: totalWeeklyHours,
        feedback_reviews_submitted: parseInt(feedbackSummary.feedback_count || '0', 10),
        average_feedback_rating: feedbackSummary.avg_rating_given ? parseFloat(feedbackSummary.avg_rating_given).toFixed(1) : null
      }
    });
  } catch (error: any) {
    console.error('❌ [Get User Profile Error]:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch user profile and progress.',
      detail: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * POST /api/user/feedback
 * Store user course ratings and qualitative feedback in `user_feedback` table.
 */
router.post('/feedback', optionalAuthMiddleware, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const parseResult = feedbackSchema.safeParse(req.body);
    if (!parseResult.success) {
      res.status(400).json({
        status: 'error',
        message: 'Validation failed',
        errors: parseResult.error.errors.map(e => ({ field: e.path.join('.'), message: e.message }))
      });
      return;
    }

    const { course_id, rating, comments, relevance_score } = parseResult.data;
    let userId = req.user?.id || parseResult.data.user_id;

    if (!userId) {
      // Fallback demo user
      const demoUserRes = await query(`SELECT id FROM users LIMIT 1;`);
      if (demoUserRes.rows.length > 0) {
        userId = demoUserRes.rows[0].id;
      } else {
        res.status(401).json({
          status: 'error',
          message: 'User authentication or user_id is required to submit feedback.'
        });
        return;
      }
    }

    // Verify course exists
    const courseCheck = await query('SELECT id, title FROM courses WHERE id = $1;', [course_id]);
    if (courseCheck.rows.length === 0) {
      res.status(404).json({
        status: 'error',
        message: `Course with ID ${course_id} not found.`
      });
      return;
    }

    const course = courseCheck.rows[0];

    // Insert user feedback
    const insertResult = await query(
      `INSERT INTO user_feedback (user_id, course_id, rating, comments, relevance_score)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, user_id, course_id, rating, comments, relevance_score, created_at;`,
      [userId, course_id, rating, comments || null, relevance_score]
    );

    res.status(201).json({
      status: 'success',
      message: `Feedback recorded for course "${course.title}".`,
      feedback: insertResult.rows[0]
    });
  } catch (error: any) {
    console.error('❌ [User Feedback Error]:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to record user feedback.',
      detail: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * POST /api/user/skills
 * Add or update user skill proficiency level.
 */
router.post('/skills', optionalAuthMiddleware, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const parseResult = userSkillSchema.safeParse(req.body);
    if (!parseResult.success) {
      res.status(400).json({
        status: 'error',
        message: 'Validation failed',
        errors: parseResult.error.errors.map(e => ({ field: e.path.join('.'), message: e.message }))
      });
      return;
    }

    const { skill_id, proficiency_level, verified } = parseResult.data;
    let userId = req.user?.id || (req.body.user_id as string);

    if (!userId) {
      const demoUserRes = await query(`SELECT id FROM users LIMIT 1;`);
      if (demoUserRes.rows.length > 0) {
        userId = demoUserRes.rows[0].id;
      } else {
        res.status(401).json({
          status: 'error',
          message: 'User authentication or user_id required.'
        });
        return;
      }
    }

    const upsertResult = await query(
      `INSERT INTO user_skills (user_id, skill_id, proficiency_level, verified, updated_at)
       VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP)
       ON CONFLICT (user_id, skill_id) 
       DO UPDATE SET proficiency_level = EXCLUDED.proficiency_level, 
                     verified = EXCLUDED.verified, 
                     updated_at = CURRENT_TIMESTAMP
       RETURNING user_id, skill_id, proficiency_level, verified, updated_at;`,
      [userId, skill_id, proficiency_level, verified]
    );

    res.status(200).json({
      status: 'success',
      message: 'User skill proficiency updated successfully.',
      skill: upsertResult.rows[0]
    });
  } catch (error: any) {
    console.error('❌ [User Skill Upsert Error]:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to update user skill.',
      detail: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

export default router;
