'use client';

import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api-client';
import { Habit } from '@shared/types';

interface ListResponse {
  data: Habit[];
  total: number;
  page: number;
  pageSize: number;
}

export function useHabits(options: {
  search?: string;
  status?: string;
  sortBy?: 'createdAt' | 'name';
  sortDir?: 'asc' | 'desc';
  page?: number;
  pageSize?: number;
}) {
  const params: Record<string, any> = {};
  if (options.search) params.search = options.search;
  if (options.status) params.status = options.status;
  if (options.sortBy) params.sortBy = options.sortBy;
  if (options.sortDir) params.sortDir = options.sortDir;
  if (options.page) params.page = options.page;
  if (options.pageSize) params.pageSize = options.pageSize;

  return useQuery({
    queryKey: ['habits', params],
    queryFn: () => api.get<ListResponse>('/api/habits', { params }),
    staleTime: 1000 * 60, // 1 minute
  });
}

export function useHabit(id: string) {
  return useQuery({
    queryKey: ['habit', id],
    queryFn: () => api.get<Habit>(`/api/habits/${id}`),
    enabled: !!id,
    staleTime: 1000 * 60, // 1 minute
  });
}
