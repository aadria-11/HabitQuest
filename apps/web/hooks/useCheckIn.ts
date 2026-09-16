'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api-client';

export function useCheckIn() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ habitId, checkInDate, comment }: { habitId: string; checkInDate: string; comment?: string }) =>
      api.post(`/api/habits/${habitId}/checkin`, { checkInDate, comment }),
    onSuccess: (_, { habitId }) => {
      queryClient.invalidateQueries({ queryKey: ['checkins', habitId] });
      queryClient.invalidateQueries({ queryKey: ['habit', habitId] });
      queryClient.invalidateQueries({ predicate: (query) => query.queryKey[0] === 'habits' });
    },
  });
}
