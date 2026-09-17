import { vi } from 'vitest';

// Ensure required env vars exist for tests (inline instead of loading from .env)
if (!process.env.DATABASE_URL) {
  process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/habit-quest-test';
}
if (!process.env.AUTH_SECRET) {
  process.env.AUTH_SECRET = 'test-auth-secret-key-12345678901234567890';
}
if (!process.env.INTERNAL_SECRET) {
  process.env.INTERNAL_SECRET = 'test-internal-secret-key-1234567890123456';
}
if (!process.env.NODE_ENV) {
  process.env.NODE_ENV = 'test';
}

// Mock the prisma client with all necessary methods
vi.mock('./lib/prisma', () => {
  const createMockModel = () => ({
    findMany: vi.fn(),
    findFirst: vi.fn(),
    findUnique: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    updateMany: vi.fn(),
    delete: vi.fn(),
    deleteMany: vi.fn(),
    count: vi.fn().mockResolvedValue(0),
    aggregate: vi.fn(),
  });

  const mockPrisma = {
    habit: createMockModel(),
    habitCheckIn: createMockModel(),
    user: createMockModel(),
    $transaction: vi.fn(async (callback: any) => {
      if (Array.isArray(callback)) {
        return Promise.all(callback);
      }
      return callback(mockPrisma);
    }),
    $disconnect: vi.fn(),
  };

  return { prisma: mockPrisma };
});
