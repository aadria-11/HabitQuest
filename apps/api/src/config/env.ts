import { z } from 'zod';

const EnvSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  DATABASE_URL: z.string().url('DATABASE_URL must be a valid PostgreSQL connection string'),
  AUTH_SECRET: z.string().min(32, 'AUTH_SECRET must be at least 32 characters'),
  API_PORT: z.coerce.number().default(3001),
  CORS_ORIGIN: z.string().default('http://localhost:3000'),
  INTERNAL_SECRET: z.string().min(32, 'INTERNAL_SECRET must be at least 32 characters'),
});

type Env = z.infer<typeof EnvSchema>;

let env: Env;

export function loadEnv(): Env {
  if (env) return env;

  const parsed = EnvSchema.safeParse(process.env);
  if (!parsed.success) {
    console.error('Invalid environment variables:', parsed.error.errors);
    process.exit(1);
  }

  env = parsed.data;
  return env;
}

export function getEnv(): Env {
  if (!env) loadEnv();
  return env;
}
