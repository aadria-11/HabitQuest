import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { createApp } from '../app.js';
import jwt from 'jsonwebtoken';

const app = createApp();
const AUTH_SECRET = process.env.AUTH_SECRET || 'test-secret-key-min-32-chars-long!';
const INTERNAL_SECRET = process.env.INTERNAL_SECRET || 'test-internal-secret';

// Helper function to create user and get token
async function createUserAndGetToken(email: string, name: string) {
  const syncRes = await request(app)
    .post('/internal/users/sync')
    .set('x-internal-secret', INTERNAL_SECRET)
    .send({
      provider: 'google',
      providerAccountId: `google-${Date.now()}`,
      email,
      name,
    });

  const userId = syncRes.body.userId;
  const token = jwt.sign(
    { userId, email, name },
    AUTH_SECRET,
    { expiresIn: '15m' },
  );

  return { userId, token };
}

describe('Habit Management Integration Tests', () => {
  let user1: { userId: string; token: string };
  let user2: { userId: string; token: string };
  let habitId: string;

  beforeAll(async () => {
    user1 = await createUserAndGetToken('user1@test.com', 'User One');
    user2 = await createUserAndGetToken('user2@test.com', 'User Two');
  });

  describe('[habit-001] Create Habit', () => {
    it('Authenticated user can create habit with valid data', async () => {
      const res = await request(app)
        .post('/api/habits')
        .set('Authorization', `Bearer ${user1.token}`)
        .send({
          name: 'Morning Exercise',
          description: 'Daily 30-minute workout',
          frequency: 'daily',
          targetDays: 30,
        });

      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty('id');
      expect(res.body.name).toBe('Morning Exercise');
      expect(res.body.userId).toBe(user1.userId);
      habitId = res.body.id;
    });

    it('Habit creation includes name, description, frequency, target', async () => {
      const habitData = {
        name: 'Read Books',
        description: 'Read 20 pages daily',
        frequency: 'daily',
        targetDays: 90,
      };

      const res = await request(app)
        .post('/api/habits')
        .set('Authorization', `Bearer ${user1.token}`)
        .send(habitData);

      expect(res.status).toBe(201);
      expect(res.body.name).toBe(habitData.name);
      expect(res.body.description).toBe(habitData.description);
      expect(res.body.frequency).toBe(habitData.frequency);
      expect(res.body.targetDays).toBe(habitData.targetDays);
    });

    it('Created habit belongs to authenticated user only', async () => {
      const res = await request(app)
        .post('/api/habits')
        .set('Authorization', `Bearer ${user1.token}`)
        .send({
          name: 'Meditation',
          description: '10-minute meditation',
          frequency: 'daily',
        });

      expect(res.status).toBe(201);
      expect(res.body.userId).toBe(user1.userId);
    });

    it('Cannot create habit without authentication', async () => {
      const res = await request(app)
        .post('/api/habits')
        .send({
          name: 'Test Habit',
          frequency: 'daily',
        });

      expect(res.status).toBe(401);
    });

    it('Cannot create habit with invalid frequency enum', async () => {
      const res = await request(app)
        .post('/api/habits')
        .set('Authorization', `Bearer ${user1.token}`)
        .send({
          name: 'Invalid Habit',
          frequency: 'invalid_frequency',
        });

      expect(res.status).toBe(400);
    });

    it('Cannot create habit without required fields', async () => {
      const res = await request(app)
        .post('/api/habits')
        .set('Authorization', `Bearer ${user1.token}`)
        .send({
          description: 'Missing name field',
        });

      expect(res.status).toBe(400);
    });
  });

  describe('List and Retrieve Habits', () => {
    it('User can list their own habits', async () => {
      const res = await request(app)
        .get('/api/habits')
        .set('Authorization', `Bearer ${user1.token}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.habits)).toBe(true);
      expect(res.body.total).toBeGreaterThanOrEqual(0);
    });

    it('User can retrieve specific habit they own', async () => {
      if (!habitId) {
        const createRes = await request(app)
          .post('/api/habits')
          .set('Authorization', `Bearer ${user1.token}`)
          .send({
            name: 'Test Habit',
            frequency: 'daily',
          });
        habitId = createRes.body.id;
      }

      const res = await request(app)
        .get(`/api/habits/${habitId}`)
        .set('Authorization', `Bearer ${user1.token}`);

      expect(res.status).toBe(200);
      expect(res.body.id).toBe(habitId);
      expect(res.body.userId).toBe(user1.userId);
    });
  });

  describe('[auth-002] Authorization - User Cannot Access Another User\'s Habits', () => {
    let user1HabitId: string;

    beforeAll(async () => {
      const res = await request(app)
        .post('/api/habits')
        .set('Authorization', `Bearer ${user1.token}`)
        .send({
          name: 'Private Habit',
          frequency: 'daily',
        });
      user1HabitId = res.body.id;
    });

    it('[auth-002] User cannot fetch another user\'s habit (GET /api/habits/:id)', async () => {
      const res = await request(app)
        .get(`/api/habits/${user1HabitId}`)
        .set('Authorization', `Bearer ${user2.token}`);

      expect([403, 404]).toContain(res.status);
    });

    it('[auth-002] User cannot update another user\'s habit', async () => {
      const res = await request(app)
        .put(`/api/habits/${user1HabitId}`)
        .set('Authorization', `Bearer ${user2.token}`)
        .send({
          name: 'Hacked Habit',
        });

      expect([403, 404]).toContain(res.status);
    });

    it('[auth-002] User cannot delete another user\'s habit', async () => {
      const res = await request(app)
        .delete(`/api/habits/${user1HabitId}`)
        .set('Authorization', `Bearer ${user2.token}`);

      expect([403, 404]).toContain(res.status);
    });

    it('[auth-002] User getHabits only returns their own habits', async () => {
      // User 1 creates habit
      const user1CreateRes = await request(app)
        .post('/api/habits')
        .set('Authorization', `Bearer ${user1.token}`)
        .send({ name: 'User1 Habit', frequency: 'daily' });

      // User 2 creates habit
      const user2CreateRes = await request(app)
        .post('/api/habits')
        .set('Authorization', `Bearer ${user2.token}`)
        .send({ name: 'User2 Habit', frequency: 'daily' });

      // User 1 lists habits
      const user1ListRes = await request(app)
        .get('/api/habits')
        .set('Authorization', `Bearer ${user1.token}`);

      const user1Ids = user1ListRes.body.habits.map((h: any) => h.id);
      expect(user1Ids).toContain(user1CreateRes.body.id);
      expect(user1Ids).not.toContain(user2CreateRes.body.id);
    });
  });

  describe('Habit Soft Delete', () => {
    it('User can delete their own habit', async () => {
      const createRes = await request(app)
        .post('/api/habits')
        .set('Authorization', `Bearer ${user1.token}`)
        .send({ name: 'Delete Me', frequency: 'daily' });

      const habitToDelete = createRes.body.id;

      const deleteRes = await request(app)
        .delete(`/api/habits/${habitToDelete}`)
        .set('Authorization', `Bearer ${user1.token}`);

      expect(deleteRes.status).toBe(200);
    });

    it('Deleted habit is not listed for user', async () => {
      const createRes = await request(app)
        .post('/api/habits')
        .set('Authorization', `Bearer ${user1.token}`)
        .send({ name: 'Will Be Deleted', frequency: 'daily' });

      const habitId = createRes.body.id;

      await request(app)
        .delete(`/api/habits/${habitId}`)
        .set('Authorization', `Bearer ${user1.token}`);

      const listRes = await request(app)
        .get('/api/habits')
        .set('Authorization', `Bearer ${user1.token}`);

      const ids = listRes.body.habits.map((h: any) => h.id);
      expect(ids).not.toContain(habitId);
    });
  });
});
