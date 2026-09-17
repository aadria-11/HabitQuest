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

interface SessionUser {
  id: string;
  email: string;
  name?: string;
  image?: string;
  provider?: string;
}

interface Session {
  user?: SessionUser;
  expires?: string;
  accessToken?: string;
  [key: string]: any;
}

export async function verifyAuthSession(session: Session): Promise<Session> {
  if (!session) {
    throw new Error('Invalid session');
  }

  if (!session.user || !session.user.id) {
    throw new Error('Invalid session');
  }

  if (session.expires) {
    const expiresAt = new Date(session.expires).getTime();
    if (expiresAt < Date.now()) {
      throw new Error('Session expired');
    }
  }

  if (session.user.provider === 'credentials') {
    throw new Error('Only SSO authentication is supported');
  }

  // Return a sanitized session without sensitive tokens
  const { accessToken, ...sanitized } = session;
  return sanitized;
}

export async function protectedRoute(req: any): Promise<boolean> {
  if (!req.session || !req.session.user || !req.session.user.id) {
    throw new Error('Unauthorized');
  }
  return true;
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

