import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSession } from 'next-auth/react';

export interface MilestoneNotification {
  id: string;
  habitId: string;
  milestone: number;
  habit: {
    id: string;
    name: string;
  };
}

export function useMilestoneNotifications() {
  const { data: session } = useSession();
  const queryClient = useQueryClient();

  const { data: notifications = [] } = useQuery({
    queryKey: ['milestoneNotifications'],
    queryFn: async () => {
      if (!session) return [];

      const res = await fetch('/api/habits/milestones/notifications/unacknowledged');

      if (!res.ok) throw new Error('Failed to fetch notifications');
      return res.json();
    },
    enabled: !!session,
    staleTime: 30000,
    gcTime: 5 * 60 * 1000,
  });

  const acknowledgeMutation = useMutation({
    mutationFn: async (notificationId: string) => {
      const res = await fetch(`/api/habits/milestones/notifications/${notificationId}/acknowledge`, {
        method: 'PUT',
      });

      if (!res.ok) throw new Error('Failed to acknowledge notification');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['milestoneNotifications'] });
    },
  });

  return {
    notifications,
    acknowledgeNotification: (id: string) => acknowledgeMutation.mutate(id),
  };
}
