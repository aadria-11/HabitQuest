'use client';

import { ReactNode } from 'react';
import { useHabitSocket } from '@/hooks/useHabitSocket';

export function SocketProvider({ children }: { children: ReactNode }) {
  useHabitSocket();
  return <>{children}</>;
}
