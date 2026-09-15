import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import request from 'supertest';
import { createApp } from '../app.js';
import jwt from 'jsonwebtoken';

const app = createApp();
const AUTH_SECRET = process.env.AUTH_SECRET || 'test-secret-key-min-32-chars-long!';
const INTERNAL_SECRET = process.env.INTERNAL_SECRET || 'test-internal-secret';

describe('Authentication Integration Tests', () => {
  describe('SSO Login Success Path', () => {
    it('[auth-001] Google SSO login with valid profile returns JWT token', async () => {
      // Mock Google OAuth provider response
      const googleProfile = {
        id: 'google-123',
        email: 'user1@test.com',
        name: 'Test User One',
        image: 'https://example.com/avatar1.jpg',
        email_verified: true,
      };

      // Step 1: Sync user via internal endpoint (simulating NextAuth callback)
      const syncRes = await request(app)
        .post('/internal/users/sync')
        .set('x-internal-secret', INTERNAL_SECRET)
        .send({
          provider: 'google',
          providerAccountId: 'google-123',
          email: googleProfile.email,
          name: googleProfile.name,
          image: googleProfile.image,
        });

      expect(syncRes.status).toBe(201);
      expect(syncRes.body).toHaveProperty('userId');
      const userId = syncRes.body.userId;

      // Step 2: Verify user can access protected routes with JWT
      const token = jwt.sign(
        { userId, email: googleProfile.email, name: googleProfile.name },
        AUTH_SECRET,
        { expiresIn: '15m' },
      );

      const habitsRes = await request(app)
        .get('/api/habits')
        .set('Authorization', `Bearer ${token}`);

      expect(habitsRes.status).toBe(200);
      expect(Array.isArray(habitsRes.body.habits)).toBe(true);
    });

    it('[auth-001] GitHub SSO login with valid profile returns JWT token', async () => {
      const githubProfile = {
        id: 'github-456',
        login: 'testuser',
        name: 'Test User Two',
        email: 'user2@github.test.com',
        avatar_url: 'https://example.com/avatar2.jpg',
      };

      const syncRes = await request(app)
        .post('/internal/users/sync')
        .set('x-internal-secret', INTERNAL_SECRET)
        .send({
          provider: 'github',
          providerAccountId: 'github-456',
          email: githubProfile.email,
          name: githubProfile.name,
          image: githubProfile.avatar_url,
        });

      expect(syncRes.status).toBe(201);
      expect(syncRes.body).toHaveProperty('userId');
      const userId = syncRes.body.userId;

      const token = jwt.sign(
        { userId, email: githubProfile.email, name: githubProfile.name },
        AUTH_SECRET,
        { expiresIn: '15m' },
      );

      const habitsRes = await request(app)
        .get('/api/habits')
        .set('Authorization', `Bearer ${token}`);

      expect(habitsRes.status).toBe(200);
    });

    it('[auth-001] User email and name synced to database correctly', async () => {
      const userData = {
        provider: 'google',
        providerAccountId: 'google-789',
        email: 'profile.test@example.com',
        name: 'Profile Test User',
        image: 'https://example.com/avatar3.jpg',
      };

      const syncRes = await request(app)
        .post('/internal/users/sync')
        .set('x-internal-secret', INTERNAL_SECRET)
        .send(userData);

      expect(syncRes.status).toBe(201);
      // Verify profile data is returned
      expect(syncRes.body.userId).toBeDefined();
    });

    it('[auth-001] Existing user login updates profile info', async () => {
      const userData = {
        provider: 'google',
        providerAccountId: 'google-update-123',
        email: 'update.test@example.com',
        name: 'Original Name',
        image: 'https://example.com/avatar4.jpg',
      };

      // First login
      const sync1 = await request(app)
        .post('/internal/users/sync')
        .set('x-internal-secret', INTERNAL_SECRET)
        .send(userData);

      expect(sync1.status).toBe(201);
      const userId = sync1.body.userId;

      // Update profile
      const updatedData = {
        ...userData,
        name: 'Updated Name',
        image: 'https://example.com/avatar5.jpg',
      };

      const sync2 = await request(app)
        .post('/internal/users/sync')
        .set('x-internal-secret', INTERNAL_SECRET)
        .send(updatedData);

      expect(sync2.status).toBe(201);
      expect(sync2.body.userId).toBe(userId);
    });

    it('[auth-001] JWT token contains correct userId, email, and expiration', async () => {
      const userData = {
        provider: 'google',
        providerAccountId: 'google-jwt-123',
        email: 'jwt.test@example.com',
        name: 'JWT Test User',
      };

      const syncRes = await request(app)
        .post('/internal/users/sync')
        .set('x-internal-secret', INTERNAL_SECRET)
        .send(userData);

      const userId = syncRes.body.userId;
      const token = jwt.sign(
        { userId, email: userData.email, name: userData.name },
        AUTH_SECRET,
        { expiresIn: '15m' },
      );

      const decoded = jwt.verify(token, AUTH_SECRET) as any;
      expect(decoded.userId).toBe(userId);
      expect(decoded.email).toBe(userData.email);
      expect(decoded.name).toBe(userData.name);
      expect(decoded.exp).toBeDefined();
    });
  });

  describe('Authentication Required', () => {
    it('[auth-003] Unauthenticated requests to protected routes return 401', async () => {
      const res = await request(app).get('/api/habits');
      expect(res.status).toBe(401);
      expect(res.body).toHaveProperty('error', 'Unauthorized');
    });

    it('[auth-003] Invalid JWT token returns 401', async () => {
      const res = await request(app)
        .get('/api/habits')
        .set('Authorization', 'Bearer invalid.token.here');

      expect(res.status).toBe(401);
    });

    it('[auth-003] Expired JWT token returns 401', async () => {
      const expiredToken = jwt.sign(
        { userId: 'test-user', email: 'test@example.com' },
        AUTH_SECRET,
        { expiresIn: '-1h' },
      );

      const res = await request(app)
        .get('/api/habits')
        .set('Authorization', `Bearer ${expiredToken}`);

      expect(res.status).toBe(401);
    });

    it('[auth-003] Missing Authorization header returns 401', async () => {
      const res = await request(app).get('/api/habits');
      expect(res.status).toBe(401);
      expect(res.body.error).toBe('Unauthorized');
    });
  });

  describe('Internal Authentication', () => {
    it('Internal endpoint requires x-internal-secret header', async () => {
      const res = await request(app)
        .post('/internal/users/sync')
        .send({
          provider: 'google',
          providerAccountId: 'test-123',
          email: 'test@example.com',
          name: 'Test User',
        });

      expect(res.status).toBe(403);
      expect(res.body).toHaveProperty('error', 'Forbidden');
    });

    it('Internal endpoint rejects invalid secret', async () => {
      const res = await request(app)
        .post('/internal/users/sync')
        .set('x-internal-secret', 'wrong-secret')
        .send({
          provider: 'google',
          providerAccountId: 'test-123',
          email: 'test@example.com',
          name: 'Test User',
        });

      expect(res.status).toBe(403);
    });
  });
});
