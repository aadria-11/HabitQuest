import { z } from 'zod';

export const HabitStatusSchema = z.enum(['ACTIVE', 'PAUSED', 'ARCHIVED']);

export const CreateHabitSchema = z.object({
  name: z.string().min(1, 'Name is required').max(255),
  description: z.string().max(1000).optional(),
  startDate: z.string().datetime(),
  status: HabitStatusSchema.default('ACTIVE'),
});

export const UpdateHabitSchema = CreateHabitSchema.partial();

export const CheckInSchema = z.object({
  checkInDate: z.string().date(),
});

export type CreateHabit = z.infer<typeof CreateHabitSchema>;
export type UpdateHabit = z.infer<typeof UpdateHabitSchema>;
export type CheckIn = z.infer<typeof CheckInSchema>;
