import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import { createApp } from '../app.js';
import jwt from 'jsonwebtoken';

const app = createApp();
const AUTH_SECRET = process.env.AUTH_SECRET || 'test-secret-key-min-32-chars-long!';
const INTERNAL_SECRET = process.env.INTERNAL_SECRET || 'test-internal-secret';

async function createUserAndGetToken(email: string, name: string) {
  const syncRes = await request(app)
    .post('/internal/users/sync')
    .set('x-internal-secret', INTERNAL_SECRET)
    .send({
      provider: 'google',
      providerAccountId: `google-${Date.now()}-${Math.random()}`,
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

describe('Check-in Management Integration Tests', () => {
  let user1: { userId: string; token: string };
  let user2: { userId: string; token: string };
  let habit1Id: string;
  let habit2Id: string;
  let testDateCounter = 0;

  function getUniqueTestDate(): string {
    const date = new Date(Date.now() - testDateCounter * 86400000);
    testDateCounter++;
    return date.toISOString().split('T')[0];
  }

  beforeAll(async () => {
    user1 = await createUserAndGetToken('checkin-user1@test.com', 'Check-in User 1');
    user2 = await createUserAndGetToken('checkin-user2@test.com', 'Check-in User 2');

    // Create habits for testing
    const h1 = await request(app)
      .post('/api/habits')
      .set('Authorization', `Bearer ${user1.token}`)
      .send({ name: 'Morning Exercise', frequency: 'daily' });
    habit1Id = h1.body.id;

    const h2 = await request(app)
      .post('/api/habits')
      .set('Authorization', `Bearer ${user2.token}`)
      .send({ name: 'Reading', frequency: 'daily' });
    habit2Id = h2.body.id;
  });

  describe('[checkin-001] Create Today\'s Check-in', () => {
    it('Authenticated user can create check-in for today', async () => {
      const testDate = getUniqueTestDate();

      const res = await request(app)
        .post(`/api/habits/${habit1Id}/checkin`)
        .set('Authorization', `Bearer ${user1.token}`)
        .send({
          date: testDate,
          notes: 'Great workout!',
        });

      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty('id');
      expect(res.body.date).toBe(testDate);
      expect(res.body.habitId).toBe(habit1Id);
    });

    it('Check-in includes habitId, date, notes', async () => {
      const testDate = getUniqueTestDate();

      const res = await request(app)
        .post(`/api/habits/${habit1Id}/checkin`)
        .set('Authorization', `Bearer ${user1.token}`)
        .send({
          date: testDate,
          notes: 'Test notes',
        });

      expect(res.status).toBe(201);
      expect(res.body.habitId).toBeDefined();
      expect(res.body.date).toBeDefined();
      expect(res.body.notes).toBeDefined();
    });

    it('Cannot create check-in without authentication', async () => {
      const testDate = getUniqueTestDate();

      const res = await request(app)
        .post(`/api/habits/${habit1Id}/checkin`)
        .send({ date: testDate });

      expect(res.status).toBe(401);
    });

    it('Cannot create check-in for non-existent habit', async () => {
      const testDate = getUniqueTestDate();

      const res = await request(app)
        .post(`/api/habits/non-existent-habit-id/checkin`)
        .set('Authorization', `Bearer ${user1.token}`)
        .send({ date: testDate });

      expect(res.status).toBe(404);
    });

    it('[auth-002] Cannot create check-in for another user\'s habit', async () => {
      const testDate = getUniqueTestDate();

      const res = await request(app)
        .post(`/api/habits/${habit2Id}/checkin`)
        .set('Authorization', `Bearer ${user1.token}`)
        .send({ date: testDate });

      expect([403, 404]).toContain(res.status);
    });
  });

  describe('[checkin-002] Prevent Duplicate Check-in', () => {
    it('Cannot create second check-in for same habit/date', async () => {
      const testDate = getUniqueTestDate();

      // First check-in
      await request(app)
        .post(`/api/habits/${habit1Id}/checkin`)
        .set('Authorization', `Bearer ${user1.token}`)
        .send({ date: testDate });

      // Second check-in (duplicate attempt)
      const res = await request(app)
        .post(`/api/habits/${habit1Id}/checkin`)
        .set('Authorization', `Bearer ${user1.token}`)
        .send({ date: testDate });

      expect(res.status).toBe(409);
    });

    it('[checkin-002] Duplicate check-in returns HTTP 409 Conflict', async () => {
      const testDate = getUniqueTestDate();

      // Create first check-in
      await request(app)
        .post(`/api/habits/${habit1Id}/checkin`)
        .set('Authorization', `Bearer ${user1.token}`)
        .send({ date: testDate });

      // Try to duplicate
      const res = await request(app)
        .post(`/api/habits/${habit1Id}/checkin`)
        .set('Authorization', `Bearer ${user1.token}`)
        .send({ date: testDate });

      expect(res.status).toBe(409);
    });

    it('[checkin-002] Error message indicates duplicate exists', async () => {
      const testDate = getUniqueTestDate();

      // Create first check-in
      await request(app)
        .post(`/api/habits/${habit1Id}/checkin`)
        .set('Authorization', `Bearer ${user1.token}`)
        .send({ date: testDate });

      // Try to duplicate
      const res = await request(app)
        .post(`/api/habits/${habit1Id}/checkin`)
        .set('Authorization', `Bearer ${user1.token}`)
        .send({ date: testDate });

      expect(res.status).toBe(409);
      expect(res.body.error || res.body.message).toBeDefined();
    });

    it('[checkin-002] User can create check-in for different dates', async () => {
      const date1 = getUniqueTestDate();
      const date2 = getUniqueTestDate();

      const res1 = await request(app)
        .post(`/api/habits/${habit1Id}/checkin`)
        .set('Authorization', `Bearer ${user1.token}`)
        .send({ date: date1 });

      expect(res1.status).toBe(201);

      const res2 = await request(app)
        .post(`/api/habits/${habit1Id}/checkin`)
        .set('Authorization', `Bearer ${user1.token}`)
        .send({ date: date2 });

      expect(res2.status).toBe(201);
      expect(res1.body.id).not.toBe(res2.body.id);
    });
  });

  describe('List Check-ins', () => {
    it('User can list check-ins for their habit', async () => {
      const testDate = getUniqueTestDate();

      // Create a check-in first
      await request(app)
        .post(`/api/habits/${habit1Id}/checkin`)
        .set('Authorization', `Bearer ${user1.token}`)
        .send({ date: testDate });

      // List check-ins
      const res = await request(app)
        .get(`/api/habits/${habit1Id}/checkin`)
        .set('Authorization', `Bearer ${user1.token}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.checkIns || res.body)).toBe(true);
    });
  });

  describe('[auth-002] Check-in Authorization', () => {
    it('[auth-002] User cannot fetch another user\'s check-ins', async () => {
      const res = await request(app)
        .get(`/api/habits/${habit2Id}/checkin`)
        .set('Authorization', `Bearer ${user1.token}`);

      expect([403, 404]).toContain(res.status);
    });
  });

  describe('Cancel Check-in', () => {
    it('User can cancel their own check-in', async () => {
      const testDate = getUniqueTestDate();

      // Create a check-in
      const createRes = await request(app)
        .post(`/api/habits/${habit1Id}/checkin`)
        .set('Authorization', `Bearer ${user1.token}`)
        .send({ date: testDate });

      const checkInId = createRes.body.id;

      // Cancel it
      const deleteRes = await request(app)
        .delete(`/api/habits/${habit1Id}/checkin/${checkInId}`)
        .set('Authorization', `Bearer ${user1.token}`);

      expect([200, 204]).toContain(deleteRes.status);
    });
  });
});
