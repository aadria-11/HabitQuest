import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import { createApp } from '@api/app';

describe('Habit API - Integration Tests', () => {
  let app: any;
  let authToken: string;
  let habitId: string;
  const AUTH_SECRET = process.env.AUTH_SECRET || 'test-secret-key-min-32-chars-long!';

  beforeEach(async () => {
    app = createApp();
    const userId = 'test-user-' + Date.now();
    // Generate real JWT token
    authToken = jwt.sign(
      { userId, email: 'test@example.com', name: 'Test User' },
      AUTH_SECRET,
      { expiresIn: '15m' }
    );
  });

  describe('GET /api/habits', () => {
    it('should retrieve all habits for authenticated user', async () => {
      const response = await request(app)
        .get('/api/habits')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('habits');
      expect(Array.isArray(response.body.habits)).toBe(true);
    });

    it('should return 401 without authentication', async () => {
      await request(app).get('/api/habits').expect(401);
    });

    it('should filter habits by status', async () => {
      const response = await request(app)
        .get('/api/habits?status=active')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.habits).toBeDefined();
      response.body.habits.forEach((habit: any) => {
        expect(habit.status).toBe('active');
      });
    });

    it('should support pagination', async () => {
      const response = await request(app)
        .get('/api/habits?page=1&limit=10')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('habits');
      expect(response.body).toHaveProperty('total');
      expect(response.body).toHaveProperty('page');
    });

    it('should only return user\'s own habits', async () => {
      const response = await request(app)
        .get('/api/habits')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      response.body.habits.forEach((habit: any) => {
        const decoded: any = jwt.decode(authToken);
        expect(habit.userId).toBe(decoded.userId);
      });
    });
  });

  describe('POST /api/habits', () => {
    it('should create a new habit', async () => {
      const habitData = {
        name: 'Morning Jog',
        description: 'Daily 5km jog',
        startDate: new Date('2026-01-01'),
        status: 'active',
      };

      const response = await request(app)
        .post('/api/habits')
        .set('Authorization', `Bearer ${authToken}`)
        .send(habitData)
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body.name).toBe(habitData.name);
      expect(response.body.currentStreak).toBe(0);
      expect(response.body.bestStreak).toBe(0);

      habitId = response.body.id;
    });

    it('should require authentication to create habit', async () => {
      const habitData = {
        name: 'Morning Jog',
        description: 'Daily 5km jog',
        startDate: new Date(),
        status: 'active',
      };

      await request(app).post('/api/habits').send(habitData).expect(401);
    });

    it('should validate required fields', async () => {
      const incompleteData = {
        name: 'Morning Jog',
      };

      await request(app)
        .post('/api/habits')
        .set('Authorization', `Bearer ${authToken}`)
        .send(incompleteData)
        .expect(400);
    });

    it('should validate habit status', async () => {
      const habitData = {
        name: 'Morning Jog',
        description: 'Daily 5km jog',
        startDate: new Date(),
        status: 'invalid-status',
      };

      await request(app)
        .post('/api/habits')
        .set('Authorization', `Bearer ${authToken}`)
        .send(habitData)
        .expect(400);
    });

    it('should assign habit to authenticated user', async () => {
      const habitData = {
        name: 'Meditation',
        description: 'Daily meditation',
        startDate: new Date(),
        status: 'active',
      };

      const response = await request(app)
        .post('/api/habits')
        .set('Authorization', `Bearer ${authToken}`)
        .set('X-User-Id', 'user-123')
        .send(habitData)
        .expect(201);

      expect(response.body.userId).toBe('user-123');
    });
  });

  describe('GET /api/habits/:id', () => {
    beforeEach(async () => {
      const habitData = {
        name: 'Test Habit',
        description: 'Test description',
        startDate: new Date(),
        status: 'active',
      };

      const response = await request(app)
        .post('/api/habits')
        .set('Authorization', `Bearer ${authToken}`)
        .set('X-User-Id', 'user-123')
        .send(habitData);

      habitId = response.body.id;
    });

    it('should retrieve habit by ID', async () => {
      const response = await request(app)
        .get(`/api/habits/${habitId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .set('X-User-Id', 'user-123')
        .expect(200);

      expect(response.body.id).toBe(habitId);
      expect(response.body.name).toBe('Test Habit');
    });

    it('should return 404 for non-existent habit', async () => {
      await request(app)
        .get('/api/habits/non-existent-id')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);
    });

    it('should prevent access to other user\'s habits', async () => {
      await request(app)
        .get(`/api/habits/${habitId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .set('X-User-Id', 'different-user')
        .expect(403);
    });
  });

  describe('PUT /api/habits/:id', () => {
    it('should update habit', async () => {
      const updateData = {
        name: 'Updated Habit Name',
        status: 'paused',
      };

      const response = await request(app)
        .put(`/api/habits/${habitId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .set('X-User-Id', 'user-123')
        .send(updateData)
        .expect(200);

      expect(response.body.name).toBe('Updated Habit Name');
      expect(response.body.status).toBe('paused');
    });

    it('should validate status on update', async () => {
      const updateData = {
        status: 'invalid-status',
      };

      await request(app)
        .put(`/api/habits/${habitId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData)
        .expect(400);
    });

    it('should prevent unauthorized updates', async () => {
      const updateData = {
        name: 'Hacked Habit',
      };

      await request(app)
        .put(`/api/habits/${habitId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .set('X-User-Id', 'different-user')
        .send(updateData)
        .expect(403);
    });

    it('should require authentication', async () => {
      await request(app)
        .put(`/api/habits/${habitId}`)
        .send({ name: 'Updated' })
        .expect(401);
    });
  });

  describe('DELETE /api/habits/:id', () => {
    it('should delete habit', async () => {
      await request(app)
        .delete(`/api/habits/${habitId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .set('X-User-Id', 'user-123')
        .expect(204);
    });

    it('should prevent deletion of other user\'s habits', async () => {
      await request(app)
        .delete(`/api/habits/${habitId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .set('X-User-Id', 'different-user')
        .expect(403);
    });

    it('should return 404 when deleting non-existent habit', async () => {
      await request(app)
        .delete('/api/habits/non-existent')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);
    });

    it('should require authentication', async () => {
      await request(app).delete(`/api/habits/${habitId}`).expect(401);
    });
  });

  describe('User Isolation', () => {
    it('should not allow user1 to access user2\'s habits', async () => {
      const user1Token = 'token-user-1';
      const user2Token = 'token-user-2';

      // Create habit as user1
      const createResponse = await request(app)
        .post('/api/habits')
        .set('Authorization', `Bearer ${user1Token}`)
        .set('X-User-Id', 'user-1')
        .send({
          name: 'User1 Habit',
          description: 'User1 only',
          startDate: new Date(),
          status: 'active',
        })
        .expect(201);

      const user1HabitId = createResponse.body.id;

      // Try to access as user2
      await request(app)
        .get(`/api/habits/${user1HabitId}`)
        .set('Authorization', `Bearer ${user2Token}`)
        .set('X-User-Id', 'user-2')
        .expect(403);
    });
  });

  describe('Habit Status Validation', () => {
    it('should accept valid statuses: active, paused, archived', async () => {
      const validStatuses = ['active', 'paused', 'archived'];

      for (const status of validStatuses) {
        const response = await request(app)
          .post('/api/habits')
          .set('Authorization', `Bearer ${authToken}`)
          .send({
            name: `Habit ${status}`,
            description: 'Test',
            startDate: new Date(),
            status,
          })
          .expect(201);

        expect(response.body.status).toBe(status);
      }
    });

    it('should reject invalid statuses', async () => {
      const invalidStatuses = ['completed', 'deleted', 'unknown'];

      for (const status of invalidStatuses) {
        await request(app)
          .post('/api/habits')
          .set('Authorization', `Bearer ${authToken}`)
          .send({
            name: 'Test Habit',
            description: 'Test',
            startDate: new Date(),
            status,
          })
          .expect(400);
      }
    });
  });
});
