import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  resolve: {
    alias: {
      '@shared': path.resolve(__dirname, '../../packages/shared/src'),
      '@api': path.resolve(__dirname, './src'),
    },
  },
  test: {
    globals: true,
    environment: 'node',
    setupFiles: ['./src/test-setup.ts'],
    testTimeout: 10000,
    hookTimeout: 10000,
    exclude: ['**/**.integration.test.ts', '**/node_modules/**'],
  },
  define: {
    'process.env.DATABASE_URL': JSON.stringify('postgresql://test:test@localhost:5432/habit-quest-test'),
  },
});
