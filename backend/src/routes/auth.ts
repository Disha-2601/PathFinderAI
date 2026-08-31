import { Router, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { query } from '../config/db';
import { authMiddleware, AuthenticatedRequest } from '../middleware/auth';

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_pathfinder_jwt_key_2026';
const JWT_EXPIRES_IN = '7d';

const registerSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  full_name: z.string().min(1, 'Full name is required'),
  role: z.enum(['student', 'professional', 'mentor', 'admin']).optional().default('student'),
  target_role: z.string().optional(),
  experience_level: z.string().optional().default('beginner'),
  bio: z.string().optional()
});

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required')
});

/**
 * POST /api/auth/register
 * Register a new user account, hash password, and return a signed JWT.
 */
router.post('/register', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const parseResult = registerSchema.safeParse(req.body);
    if (!parseResult.success) {
      res.status(400).json({
        status: 'error',
        message: 'Validation failed',
        errors: parseResult.error.errors.map(e => ({ field: e.path.join('.'), message: e.message }))
      });
      return;
    }

    const { email, password, full_name, role, target_role, experience_level, bio } = parseResult.data;

    // Check if user already exists
    const existingUser = await query('SELECT id FROM users WHERE email = $1;', [email.toLowerCase().trim()]);
    if (existingUser.rows.length > 0) {
      res.status(409).json({
        status: 'error',
        message: 'A user with this email address already exists.'
      });
      return;
    }

    // Hash password
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // Insert user into database
    const insertResult = await query(
      `INSERT INTO users (email, password_hash, full_name, role, target_role, experience_level, bio)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING id, email, full_name, role, target_role, experience_level, bio, created_at;`,
      [email.toLowerCase().trim(), passwordHash, full_name.trim(), role, target_role, experience_level, bio]
    );

    const user = insertResult.rows[0];

    // Generate JWT token
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    res.status(201).json({
      status: 'success',
      message: 'User registered successfully',
      token,
      user
    });
  } catch (error: any) {
    console.error('❌ [Auth Register Error]:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to register user.',
      detail: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * POST /api/auth/login
 * Authenticate user credentials and return a signed JWT.
 */
router.post('/login', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const parseResult = loginSchema.safeParse(req.body);
    if (!parseResult.success) {
      res.status(400).json({
        status: 'error',
        message: 'Validation failed',
        errors: parseResult.error.errors.map(e => ({ field: e.path.join('.'), message: e.message }))
      });
      return;
    }

    const { email, password } = parseResult.data;

    // Retrieve user by email
    const userResult = await query(
      `SELECT id, email, password_hash, full_name, role, target_role, experience_level, bio, created_at
       FROM users 
       WHERE email = $1;`,
      [email.toLowerCase().trim()]
    );

    if (userResult.rows.length === 0) {
      res.status(401).json({
        status: 'error',
        message: 'Invalid email or password.'
      });
      return;
    }

    const user = userResult.rows[0];

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password_hash);
    if (!isPasswordValid) {
      res.status(401).json({
        status: 'error',
        message: 'Invalid email or password.'
      });
      return;
    }

    // Strip password_hash from response
    const { password_hash, ...userProfile } = user;

    // Generate JWT token
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    res.status(200).json({
      status: 'success',
      message: 'Login successful',
      token,
      user: userProfile
    });
  } catch (error: any) {
    console.error('❌ [Auth Login Error]:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to log in.',
      detail: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * GET /api/auth/me
 * Protected endpoint returning the profile of the authenticated user.
 */
router.get('/me', authMiddleware, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ status: 'error', message: 'Unauthorized' });
      return;
    }

    const userResult = await query(
      `SELECT id, email, full_name, role, target_role, experience_level, bio, created_at, updated_at
       FROM users 
       WHERE id = $1;`,
      [userId]
    );

    if (userResult.rows.length === 0) {
      res.status(404).json({
        status: 'error',
        message: 'User profile not found.'
      });
      return;
    }

    res.status(200).json({
      status: 'success',
      user: userResult.rows[0]
    });
  } catch (error: any) {
    console.error('❌ [Auth Me Error]:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch current user profile.',
      detail: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

export default router;
