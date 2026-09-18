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

// Create reusable mock model factory
const createMockModel = () => ({
  create: vi.fn(),
  findMany: vi.fn(),
  findFirst: vi.fn(),
  findUnique: vi.fn(),
  update: vi.fn(),
  updateMany: vi.fn(),
  delete: vi.fn(),
  deleteMany: vi.fn(),
  count: vi.fn(),
  aggregate: vi.fn(),
  upsert: vi.fn(),
});

// Mock Prisma with per-test configuration support
vi.mock('./lib/prisma', () => ({
  prisma: {
    habit: createMockModel(),
    habitCheckIn: createMockModel(),
    user: createMockModel(),
    $transaction: vi.fn(async (callback: any) => {
      if (Array.isArray(callback)) return Promise.all(callback);
      return callback({
        habit: createMockModel(),
        habitCheckIn: createMockModel()
      });
    }),
    $disconnect: vi.fn(),
  },
}));

// Mock Socket.IO globally to prevent connection issues in tests
vi.mock('../sockets/index.js', () => ({
  getSocketIO: vi.fn(() => null),
}));
