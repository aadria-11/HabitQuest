import { Request, Response, NextFunction } from 'express';

export interface AuthenticatedRequest {
  user?: {
    userId: string;
  };
}

export function devAuthMiddleware(
  req: Request & AuthenticatedRequest,
  res: Response,
  next: NextFunction,
) {
  const userId = req.headers['x-user-id'];

  if (!userId || typeof userId !== 'string') {
    return res.status(401).json({
      error: 'Missing user id',
    });
  }

  req.user = {
    userId,
  };

  next();
}