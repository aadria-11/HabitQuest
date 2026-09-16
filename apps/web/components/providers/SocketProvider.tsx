'use client';

import { ReactNode, useEffect, useRef } from 'react';
import { useHabitSocket } from '@/hooks/useHabitSocket';
import { useMilestoneNotifications } from '@/hooks/useMilestoneNotifications';
import { ToastContainer, useToastQueue } from '@/components/ui/toast';

export function SocketProvider({ children }: { children: ReactNode }) {
  const { toasts, addToast, dismissToast } = useToastQueue();
  const { notifications, acknowledgeNotification } = useMilestoneNotifications();
  const initialLoadRef = useRef(false);

  const handleAcknowledge = (notificationId: string) => {
    acknowledgeNotification(notificationId);
  };

  useHabitSocket(addToast, handleAcknowledge);

  useEffect(() => {
    // Show initial unacknowledged notifications on first load
    if (!initialLoadRef.current && notifications.length > 0) {
      initialLoadRef.current = true;
      notifications.forEach((notification) => {
        addToast(
          notification.habit.name,
          `Reached a ${notification.milestone}-day streak!`,
          undefined,
          {
            persistent: true,
            action: {
              label: 'OK',
              onClick: () => handleAcknowledge(notification.id),
            },
          }
        );
      });
    }
  }, [notifications, addToast, handleAcknowledge]);

  return (
    <>
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
      {children}
    </>
  );
}
