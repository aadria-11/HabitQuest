import { z } from 'zod';

export const HabitStatusSchema = z.enum(['ACTIVE', 'PAUSED', 'ARCHIVED']);

export const CreateHabitSchema = z.object({
  name: z.string().min(1, 'Name is required').max(255),
  description: z.string().max(1000).optional(),
  frequency: z.enum(['daily', 'weekly', 'monthly']).default('daily'),
  targetDays: z.number().optional(),
  status: HabitStatusSchema.default('ACTIVE'),
});

export const UpdateHabitSchema = CreateHabitSchema.partial();

export const CheckInSchema = z.object({
  date: z.string().date(),
  notes: z.string().max(500).optional().nullable(),
});

export const SyncUserSchema = z.object({
  provider: z.string().min(1),
  providerAccountId: z.string().min(1),
  email: z.string().email().optional().nullable(),
  name: z.string().optional().nullable(),
  image: z.string().url().optional().nullable(),
});

export const HabitListQuerySchema = z.object({
  search: z.string().max(255).optional(),
  status: HabitStatusSchema.optional(),
  sortBy: z.enum(['createdAt', 'name']).default('createdAt'),
  sortDir: z.enum(['asc', 'desc']).default('desc'),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(1000).default(10),
});

export type CreateHabit = z.infer<typeof CreateHabitSchema>;
export type UpdateHabit = z.infer<typeof UpdateHabitSchema>;
export type CheckIn = z.infer<typeof CheckInSchema>;
export type SyncUser = z.infer<typeof SyncUserSchema>;
export type HabitListQuery = z.infer<typeof HabitListQuerySchema>;
