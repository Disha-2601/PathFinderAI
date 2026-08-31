import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRouter from './routes/auth';
import goalsRouter from './routes/goals';
import userRouter from './routes/user';
import { initDb, pool } from './config/db';

dotenv.config();

const app = express();
const DEFAULT_PORT = parseInt(process.env.PORT || '5000', 10);

// Enable CORS for frontend and development clients
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Enable JSON body parsing
app.use(express.json());

// API Info / Documentation route
app.get('/', (req: Request, res: Response) => {
  res.json({
    name: 'PathFinder AI Backend API Gateway',
    version: '1.0.0',
    status: 'running',
    docs: {
      health: 'GET /api/health',
      auth: {
        register: 'POST /api/auth/register',
        login: 'POST /api/auth/login',
        me: 'GET /api/auth/me'
      },
      goals: {
        parse: 'POST /api/goals/parse',
        recommend: 'POST /api/goals/recommend',
        getById: 'GET /api/goals/:id',
        list: 'GET /api/goals'
      },
      user: {
        profile: 'GET /api/user/profile',
        feedback: 'POST /api/user/feedback',
        skills: 'POST /api/user/skills'
      }
    }
  });
});

// Health check endpoint
app.get('/api/health', async (req: Request, res: Response) => {
  let dbStatus = 'disconnected';
  try {
    const dbRes = await pool.query('SELECT NOW() as current_time;');
    if (dbRes.rows.length > 0) {
      dbStatus = 'connected';
    }
  } catch (err: any) {
    dbStatus = `error: ${err.message}`;
  }

  res.status(200).json({
    status: 'ok',
    service: 'backend',
    database: dbStatus,
    timestamp: new Date().toISOString(),
    env: process.env.NODE_ENV || 'development'
  });
});

// Mount Routes
app.use('/api/auth', authRouter);
app.use('/api/goals', goalsRouter);
app.use('/api/user', userRouter);

// 404 Not Found Handler
app.use((req: Request, res: Response) => {
  res.status(404).json({
    status: 'error',
    message: `Cannot ${req.method} ${req.originalUrl} - Route not found on PathFinder API`
  });
});

// Global Error Handler
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.error('💥 [Unhandled Exception]:', err);
  res.status(err.status || 500).json({
    status: 'error',
    message: err.message || 'Internal server error occurred',
    detail: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
});

// Start Server and verify DB connection with fallback handling for port conflict
const startServer = (port: number) => {
  const server = app.listen(port, async () => {
    console.log(`🚀 [Backend] PathFinder API Gateway running on http://localhost:${port}`);
    console.log(`🩺 [Backend] Health check: http://localhost:${port}/api/health`);
    await initDb();
  });

  server.on('error', (err: any) => {
    if (err.code === 'EADDRINUSE') {
      console.warn(`⚠️ [Backend] Port ${port} in use (e.g. macOS AirPlay Receiver). Attempting port ${port + 1}...`);
      startServer(port + 1);
    } else {
      console.error('❌ [Backend Server Error]:', err);
    }
  });

  return server;
};

startServer(DEFAULT_PORT);

export default app;
