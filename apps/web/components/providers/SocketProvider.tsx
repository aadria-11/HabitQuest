'use client';

import { ReactNode } from 'react';
import { useHabitSocket } from '@/hooks/useHabitSocket';
import { ToastContainer, useToastQueue } from '@/components/ui/toast';

export function SocketProvider({ children }: { children: ReactNode }) {
  const { toasts, addToast, dismissToast } = useToastQueue();
  useHabitSocket(addToast);

  return (
    <>
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
      {children}
    </>
  );
}
