'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api-client';

export function useCheckIn() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ habitId, checkInDate }: { habitId: string; checkInDate: string }) =>
      api.post(`/api/habits/${habitId}/checkin`, { checkInDate }),
    onSuccess: (_, { habitId }) => {
      queryClient.invalidateQueries({ queryKey: ['habit', habitId] });
      queryClient.invalidateQueries({ queryKey: ['habits'] });
    },
  });
}
