import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import { createApp } from '@api/app';

describe('Check-In API - Integration Tests', () => {
  let app: any;
  let authToken: string;
  let habitId: string;
  let userId: string;
  const AUTH_SECRET = process.env.AUTH_SECRET || 'test-secret-key-min-32-chars-long!';

  beforeEach(async () => {
    app = createApp();
    userId = 'user-' + Date.now();
    // Generate real JWT token
    authToken = jwt.sign(
      { userId, email: 'test@example.com', name: 'Test User' },
      AUTH_SECRET,
      { expiresIn: '15m' }
    );

    // Create a test habit
    const habitResponse = await request(app)
      .post('/api/habits')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        name: 'Test Habit',
        description: 'Test habit for check-ins',
        startDate: new Date('2026-01-01'),
        status: 'active',
      });

    habitId = habitResponse.body.id;
  });

  describe('POST /api/habits/:id/checkin', () => {
    it('should create a check-in for a habit', async () => {
      const response = await request(app)
        .post(`/api/habits/${habitId}/checkin`)
        .set('Authorization', `Bearer ${authToken}`)
          .send({
          checkInDate: new Date().toISOString().split('T')[0],
        })
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body.habitId).toBe(habitId);
      expect(response.body).toHaveProperty('checkInDate');
    });

    it('should require authentication', async () => {
      await request(app)
        .post(`/api/habits/${habitId}/checkin`)
        .send({
          checkInDate: new Date().toISOString().split('T')[0],
        })
        .expect(401);
    });

    it('should prevent duplicate check-in on same day', async () => {
      const today = new Date().toISOString().split('T')[0];

      // First check-in
      await request(app)
        .post(`/api/habits/${habitId}/checkin`)
        .set('Authorization', `Bearer ${authToken}`)
          .send({ checkInDate: today })
        .expect(201);

      // Second check-in attempt
      await request(app)
        .post(`/api/habits/${habitId}/checkin`)
        .set('Authorization', `Bearer ${authToken}`)
          .send({ checkInDate: today })
        .expect(409);
    });

    it('should prevent check-in for paused habit', async () => {
      // Pause the habit
      await request(app)
        .put(`/api/habits/${habitId}`)
        .set('Authorization', `Bearer ${authToken}`)
          .send({ status: 'paused' });

      // Try to check in
      await request(app)
        .post(`/api/habits/${habitId}/checkin`)
        .set('Authorization', `Bearer ${authToken}`)
          .send({
          checkInDate: new Date().toISOString().split('T')[0],
        })
        .expect(400);
    });

    it('should prevent check-in for archived habit', async () => {
      // Archive the habit
      await request(app)
        .put(`/api/habits/${habitId}`)
        .set('Authorization', `Bearer ${authToken}`)
          .send({ status: 'archived' });

      // Try to check in
      await request(app)
        .post(`/api/habits/${habitId}/checkin`)
        .set('Authorization', `Bearer ${authToken}`)
          .send({
          checkInDate: new Date().toISOString().split('T')[0],
        })
        .expect(400);
    });

    it('should not allow check-in for future dates', async () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);

      await request(app)
        .post(`/api/habits/${habitId}/checkin`)
        .set('Authorization', `Bearer ${authToken}`)
          .send({
          checkInDate: tomorrow.toISOString().split('T')[0],
        })
        .expect(400);
    });

    it('should not allow check-in for other user\'s habits', async () => {
      await request(app)
        .post(`/api/habits/${habitId}/checkin`)
        .set('Authorization', `Bearer ${authToken}`)
        .set('X-User-Id', 'different-user')
        .send({
          checkInDate: new Date().toISOString().split('T')[0],
        })
        .expect(403);
    });

    it('should update habit streaks on check-in', async () => {
      await request(app)
        .post(`/api/habits/${habitId}/checkin`)
        .set('Authorization', `Bearer ${authToken}`)
          .send({
          checkInDate: new Date().toISOString().split('T')[0],
        })
        .expect(201);

      // Verify streak was updated
      const habitResponse = await request(app)
        .get(`/api/habits/${habitId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .set('X-User-Id', userId);

      expect(habitResponse.body.currentStreak).toBeGreaterThan(0);
    });
  });

  describe('GET /api/habits/:id/checkins', () => {
    it('should retrieve check-in history for a habit', async () => {
      // Create a check-in
      await request(app)
        .post(`/api/habits/${habitId}/checkin`)
        .set('Authorization', `Bearer ${authToken}`)
          .send({
          checkInDate: new Date().toISOString().split('T')[0],
        });

      const response = await request(app)
        .get(`/api/habits/${habitId}/checkins`)
        .set('Authorization', `Bearer ${authToken}`)
          .expect(200);

      expect(Array.isArray(response.body.checkins)).toBe(true);
      expect(response.body.checkins.length).toBeGreaterThan(0);
    });

    it('should return empty array if no check-ins exist', async () => {
      const response = await request(app)
        .get(`/api/habits/${habitId}/checkins`)
        .set('Authorization', `Bearer ${authToken}`)
          .expect(200);

      expect(response.body.checkins).toEqual([]);
    });

    it('should require authentication', async () => {
      await request(app)
        .get(`/api/habits/${habitId}/checkins`)
        .expect(401);
    });

    it('should enforce user isolation', async () => {
      await request(app)
        .get(`/api/habits/${habitId}/checkins`)
        .set('Authorization', `Bearer ${authToken}`)
        .set('X-User-Id', 'different-user')
        .expect(403);
    });

    it('should return check-ins in reverse chronological order', async () => {
      // Create multiple check-ins
      const dates = [
        new Date('2026-01-13').toISOString().split('T')[0],
        new Date('2026-01-14').toISOString().split('T')[0],
        new Date('2026-01-15').toISOString().split('T')[0],
      ];

      for (const date of dates) {
        await request(app)
          .post(`/api/habits/${habitId}/checkin`)
          .set('Authorization', `Bearer ${authToken}`)
              .send({ checkInDate: date });
      }

      const response = await request(app)
        .get(`/api/habits/${habitId}/checkins`)
        .set('Authorization', `Bearer ${authToken}`)
          .expect(200);

      expect(response.body.checkins[0].checkInDate).toBeGreaterThan(
        response.body.checkins[response.body.checkins.length - 1].checkInDate
      );
    });
  });

  describe('Streak Calculation Integration', () => {
    it('should correctly calculate current streak with consecutive check-ins', async () => {
      const baseDate = new Date('2026-01-13');

      for (let i = 0; i < 3; i++) {
        const date = new Date(baseDate);
        date.setDate(date.getDate() + i);
        const dateStr = date.toISOString().split('T')[0];

        await request(app)
          .post(`/api/habits/${habitId}/checkin`)
          .set('Authorization', `Bearer ${authToken}`)
              .send({ checkInDate: dateStr });
      }

      const response = await request(app)
        .get(`/api/habits/${habitId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .set('X-User-Id', userId);

      expect(response.body.currentStreak).toBe(3);
    });

    it('should break streak when a day is missed', async () => {
      const baseDate = new Date('2026-01-13');

      // Check in for day 1 and day 2
      for (let i = 0; i < 2; i++) {
        const date = new Date(baseDate);
        date.setDate(date.getDate() + i);
        const dateStr = date.toISOString().split('T')[0];

        await request(app)
          .post(`/api/habits/${habitId}/checkin`)
          .set('Authorization', `Bearer ${authToken}`)
              .send({ checkInDate: dateStr });
      }

      // Skip day 3

      // Check in for day 4
      const day4 = new Date(baseDate);
      day4.setDate(day4.getDate() + 3);
      const day4Str = day4.toISOString().split('T')[0];

      await request(app)
        .post(`/api/habits/${habitId}/checkin`)
        .set('Authorization', `Bearer ${authToken}`)
          .send({ checkInDate: day4Str });

      const response = await request(app)
        .get(`/api/habits/${habitId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .set('X-User-Id', userId);

      expect(response.body.currentStreak).toBe(1);
    });
  });

  describe('User Isolation for Check-Ins', () => {
    it('should not allow user2 to see user1\'s check-in history', async () => {
      // User 1 creates a check-in
      await request(app)
        .post(`/api/habits/${habitId}/checkin`)
        .set('Authorization', `Bearer ${authToken}`)
          .send({
          checkInDate: new Date().toISOString().split('T')[0],
        });

      // User 2 tries to access
      await request(app)
        .get(`/api/habits/${habitId}/checkins`)
        .set('Authorization', `Bearer ${authToken}`)
        .set('X-User-Id', 'different-user')
        .expect(403);
    });
  });
});
