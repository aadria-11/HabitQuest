'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api-client';

export function useCancelCheckIn() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ habitId, checkInId }: { habitId: string; checkInId: string }) =>
      api.delete(`/api/habits/${habitId}/checkin/${checkInId}`),
    onSuccess: (_, { habitId }) => {
      queryClient.invalidateQueries({ queryKey: ['checkins', habitId] });
      queryClient.invalidateQueries({ queryKey: ['habit', habitId] });
      queryClient.invalidateQueries({ queryKey: ['habits'] });
    },
  });
}
