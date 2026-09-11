import { describe, it, expect } from 'vitest';
import * as checkinService from './checkin.service.js';

describe('CheckIn Service - Authorization', () => {
  it('cancelCheckIn throws for a habit that does not belong to the user', async () => {
    await expect(
      checkinService.cancelCheckIn('non-existent-habit', 'user-123', 'non-existent-checkin'),
    ).rejects.toThrow('Habit not found');
  });
});
