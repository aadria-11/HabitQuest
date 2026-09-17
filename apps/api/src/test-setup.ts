import { vi } from 'vitest';

// Mock the prisma client with all necessary methods
vi.mock('./lib/prisma', () => {
  const mockPrisma = {
    habit: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      count: vi.fn(),
    },
    habitCheckIn: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      delete: vi.fn(),
      count: vi.fn(),
    },
    user: {
      findFirst: vi.fn(),
      findUnique: vi.fn(),
      upsert: vi.fn(),
      create: vi.fn(),
    },
    $transaction: vi.fn(async (callback: any) => {
      return callback(mockPrisma);
    }),
  };

  return { prisma: mockPrisma };
});
