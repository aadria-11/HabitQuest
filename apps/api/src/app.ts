import express from 'express';
import cors from 'cors';
import { getEnv } from './config/env.js';
import { errorHandler } from './middleware/errorHandler.js';
import internalRoutes from './routes/internal.routes.js';

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

  // Routes
  app.use('/internal', internalRoutes);
  const habitRoutes = (await import('./routes/habit.routes.js')).default;
  const checkinRoutes = (await import('./routes/checkin.routes.js')).default;
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
