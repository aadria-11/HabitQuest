import { describe, it, expect } from 'vitest';
import { calculateStreaks } from './streak.service.js';

describe('Streak Service', () => {
  it('returns 0 for empty history', () => {
    const { currentStreak, bestStreak } = calculateStreaks([]);
    expect(currentStreak).toBe(0);
    expect(bestStreak).toBe(0);
  });

  it('returns 1 for single check-in today', () => {
    const today = new Date();
    const { currentStreak, bestStreak } = calculateStreaks([today]);
    expect(currentStreak).toBe(1);
    expect(bestStreak).toBe(1);
  });

  it('returns 1 for single check-in yesterday', () => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const { currentStreak, bestStreak } = calculateStreaks([yesterday]);
    expect(currentStreak).toBe(1);
    expect(bestStreak).toBe(1);
  });

  it('returns 0 current streak for check-in 2+ days ago', () => {
    const twoDaysAgo = new Date();
    twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
    const { currentStreak, bestStreak } = calculateStreaks([twoDaysAgo]);
    expect(currentStreak).toBe(0);
    expect(bestStreak).toBe(1);
  });

  it('calculates consecutive streak correctly', () => {
    const dates = [];
    for (let i = 0; i < 5; i++) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      dates.push(d);
    }
    const { currentStreak, bestStreak } = calculateStreaks(dates);
    expect(currentStreak).toBe(5);
    expect(bestStreak).toBe(5);
  });

  it('breaks streak on gap', () => {
    const dates = [
      new Date(),
      new Date(new Date().setDate(new Date().getDate() - 1)),
      new Date(new Date().setDate(new Date().getDate() - 3)),
    ];
    const { currentStreak, bestStreak } = calculateStreaks(dates);
    expect(currentStreak).toBe(2);
    expect(bestStreak).toBe(2);
  });
});
