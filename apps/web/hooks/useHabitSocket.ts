'use client';

import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { initSocket } from '@/lib/socket';
import { Habit } from '@shared/types';
import { useSession } from 'next-auth/react';

export function useHabitSocket(addToast?: (title: string, message: string) => void) {
  const queryClient = useQueryClient();
  const { data: session } = useSession();

  useEffect(() => {
    if (!session?.user?.id || !session?.apiToken) return;

    const socket = initSocket(session.apiToken);
    socket.emit('subscribe');

    socket.on('habit:created', (habit: Habit) => {
      queryClient.invalidateQueries({ predicate: (query) => query.queryKey[0] === 'habits' });
    });

    socket.on('habit:updated', (habit: Habit) => {
      queryClient.setQueryData(['habit', habit.id], habit);
      queryClient.invalidateQueries({ predicate: (query) => query.queryKey[0] === 'habits' });
    });

    socket.on('habit:deleted', (habitId: string) => {
      queryClient.removeQueries({ queryKey: ['habit', habitId] });
      queryClient.invalidateQueries({ predicate: (query) => query.queryKey[0] === 'habits' });
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

    socket.on('milestone', (data) => {
      if (addToast) {
        addToast(
          `${data.habitName}`,
          `Reached a ${data.milestone}-day streak!`
        );
      }

      socket.emit('milestone:ack', {
        notificationId: data.notificationId,
      });
    });

    return () => {
      socket.off('habit:created');
      socket.off('habit:updated');
      socket.off('habit:deleted');
      socket.off('habit:checkedin');
      socket.off('streak:updated');
      socket.off('milestone');
    };
  }, [queryClient, session, addToast]);
}
