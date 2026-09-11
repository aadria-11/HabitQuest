import { describe, it, expect, beforeEach, vi } from 'vitest';
import { devAuthMiddleware, extractToken } from './dev-auth.js';
import { Request, Response, NextFunction } from 'express';

describe('Auth Middleware', () => {
  it('extracts token from Authorization Bearer header', () => {
    const req = {
      headers: {
        authorization: 'Bearer my-token-123',
      },
    } as unknown as Request;

    const token = extractToken(req);
    expect(token).toBe('my-token-123');
  });

  it('returns null when no token present', () => {
    const req = {
      headers: {},
    } as unknown as Request;

    const token = extractToken(req);
    expect(token).toBeNull();
  });

  it('rejects missing token', () => {
    const req = {
      headers: {},
    } as unknown as Request;

    const res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis(),
    } as unknown as Response;

    const next = vi.fn();

    devAuthMiddleware(req as any, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });
});
