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
  app.use('/api/habits', (await import('./routes/habit.routes.js')).default);

  // Health check
  app.get('/health', (_req, res) => {
    res.json({ status: 'ok' });
  });

  // Error handler
  app.use(errorHandler);

  return app;
}
