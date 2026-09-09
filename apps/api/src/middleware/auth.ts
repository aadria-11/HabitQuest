import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { getEnv } from '../config/env.js';
import { JWTPayload, AuthenticatedRequest } from '@shared/types';

declare global {
  namespace Express {
    interface Request {
      user?: JWTPayload;
    }
  }
}

export function authMiddleware(
  req: Request & AuthenticatedRequest,
  res: Response,
  next: NextFunction,
) {
  try {
    const token = extractToken(req);
    if (!token) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const env = getEnv();
    const decoded = jwt.verify(token, env.AUTH_SECRET) as JWTPayload;
    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Unauthorized' });
  }
}

export function extractToken(req: Request): string | null {
  const authHeader = req.headers.authorization;
  if (authHeader?.startsWith('Bearer ')) {
    return authHeader.slice(7);
  }

  const cookies = req.headers.cookie;
  if (!cookies) return null;

  const match = cookies.split(';').find((c) => c.trim().startsWith('authToken='));
  return match ? decodeURIComponent(match.split('=')[1]) : null;
}

export function internalAuthMiddleware(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const env = getEnv();
  const secret = req.headers['x-internal-secret'];

  if (secret !== env.INTERNAL_SECRET) {
    return res.status(403).json({ error: 'Forbidden' });
  }

  next();
}
