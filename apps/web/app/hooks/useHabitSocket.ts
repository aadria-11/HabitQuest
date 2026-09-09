'use client';

import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { initSocket } from '@/lib/socket';
import { Habit } from '@shared/types';

export function useHabitSocket() {
  const queryClient = useQueryClient();
  const socket = initSocket();

  useEffect(() => {
    socket.on('habit:created', (habit: Habit) => {
      queryClient.invalidateQueries({ queryKey: ['habits'] });
    });

    socket.on('habit:updated', (habit: Habit) => {
      queryClient.setQueryData(['habit', habit.id], habit);
      queryClient.invalidateQueries({ queryKey: ['habits'] });
    });

    socket.on('habit:deleted', (habitId: string) => {
      queryClient.removeQueries({ queryKey: ['habit', habitId] });
      queryClient.invalidateQueries({ queryKey: ['habits'] });
    });

    socket.on('habit:checkedin', ({ habitId }: { habitId: string; checkInDate: string }) => {
      queryClient.invalidateQueries({ queryKey: ['habit', habitId] });
      queryClient.invalidateQueries({ queryKey: ['checkins', habitId] });
    });

    socket.on(
      'streak:updated',
      ({ habitId, currentStreak, bestStreak }: { habitId: string; currentStreak: number; bestStreak: number }) => {
        queryClient.setQueryData(['habit', habitId], (old: Habit | undefined) => {
          if (!old) return old;
          return { ...old, currentStreak, bestStreak };
        });
      },
    );

    return () => {
      socket.off('habit:created');
      socket.off('habit:updated');
      socket.off('habit:deleted');
      socket.off('habit:checkedin');
      socket.off('streak:updated');
    };
  }, [socket, queryClient]);
}
