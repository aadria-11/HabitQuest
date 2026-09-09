'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api-client';
import { CreateHabit } from '@shared/schemas';
import { Habit } from '@shared/types';

export function useCreateHabit() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateHabit) => api.post<Habit>('/api/habits', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['habits'] });
    },
  });
}

export function useUpdateHabit() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      api.put<Habit>(`/api/habits/${id}`, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['habit', id] });
      queryClient.invalidateQueries({ queryKey: ['habits'] });
    },
  });
}

export function useDeleteHabit() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => api.delete(`/api/habits/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['habits'] });
    },
  });
}
