'use client';

import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api-client';
import { HabitCheckIn } from '@shared/types';

export function useCheckIns(habitId: string) {
  return useQuery({
    queryKey: ['checkins', habitId],
    queryFn: () => api.get<HabitCheckIn[]>(`/api/habits/${habitId}/checkin`),
    enabled: !!habitId,
  });
}
