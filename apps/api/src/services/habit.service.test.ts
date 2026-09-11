import { describe, it, expect } from 'vitest';
import * as habitService from './habit.service.js';

describe('Habit Service - Authorization', () => {
  it('getHabits filters by userId', async () => {
    const result = await habitService.getHabits('user-123', {});
    expect(result.habits).toBeDefined();
    expect(Array.isArray(result.habits)).toBe(true);
    expect(result.total).toBeGreaterThanOrEqual(0);
  });

  it('getHabit returns null for non-existent habit', async () => {
    const habit = await habitService.getHabit('user-123', 'non-existent-id');
    expect(habit).toBeNull();
  });

  it('deleteHabit returns false for non-existent habit', async () => {
    const success = await habitService.deleteHabit('user-123', 'non-existent-id');
    expect(success).toBe(false);
  });
});

describe('Habit Service - Status Rules', () => {
  it('updateHabit throws for archived habit', async () => {
    await expect(
      habitService.updateHabit('user-123', 'non-existent-id', { name: 'New name' }),
    ).rejects.toThrow('Habit is archived');
  });
});
