import express from 'express';
import cors from 'cors';
import { getEnv } from './config/env.js';
import { errorHandler } from './middleware/errorHandler.js';
import { rateLimit } from './middleware/rateLimit.js';
import internalRoutes from './routes/internal.routes.js';
import habitRoutes from './routes/habit.routes.js';
import checkinRoutes from './routes/checkin.routes.js';

export function createApp() {
  const app = express();
  const env = getEnv();

  // Middleware
  app.use(
    cors({
      origin: env.CORS_ORIGIN,
      credentials: true,
    }),
  );
  app.use(express.json());
  app.use(rateLimit(15 * 60 * 1000, 100));

  // Routes
  app.use('/internal', internalRoutes);
  app.use('/api/habits', habitRoutes);
  app.use('/api/habits/:id/checkin', checkinRoutes);

  // Health check
  app.get('/health', (_req, res) => {
    res.json({ status: 'ok' });
  });

  // Error handler
  app.use(errorHandler);

  return app;
}
