import { Request, Response, NextFunction } from 'express';

interface RateLimitStore {
  [key: string]: { count: number; resetTime: number };
}

const store: RateLimitStore = {};

export function rateLimit(
  windowMs: number = 15 * 60 * 1000,
  maxRequests: number = 100,
) {
  return (req: Request, res: Response, next: NextFunction) => {
    const key = req.ip || req.socket.remoteAddress || 'unknown';
    const now = Date.now();

    if (!store[key]) {
      store[key] = { count: 1, resetTime: now + windowMs };
      return next();
    }

    if (now > store[key].resetTime) {
      store[key] = { count: 1, resetTime: now + windowMs };
      return next();
    }

    store[key].count++;

    if (store[key].count > maxRequests) {
      res.set('Retry-After', String(Math.ceil((store[key].resetTime - now) / 1000)));
      return res.status(429).json({
        error: 'Too many requests, please try again later.',
      });
    }

    next();
  };
}
