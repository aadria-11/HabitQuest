'use client';

import { useEffect, useState } from 'react';
import { Button } from './button';

export interface ToastItem {
  id: string;
  title: string;
  message: string;
  duration?: number;
  persistent?: boolean;
  action?: {
    label: string;
    onClick: () => void;
  };
}

interface ToastProps {
  toast: ToastItem;
  onDismiss: (id: string) => void;
}

export function Toast({ toast, onDismiss }: ToastProps) {
  useEffect(() => {
    if (!toast.duration || toast.persistent) return;

    const timer = setTimeout(() => {
      onDismiss(toast.id);
    }, toast.duration);

    return () => clearTimeout(timer);
  }, [toast, onDismiss]);

  return (
    <div className="w-full max-w-md rounded-lg border border-orange-200 bg-white p-4 shadow-lg">
      <div className="flex flex-col gap-3">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <h3 className="font-semibold text-slate-900">{toast.title}</h3>
            <p className="mt-1 text-sm text-slate-600">{toast.message}</p>
          </div>
          {!toast.persistent && (
            <button
              onClick={() => onDismiss(toast.id)}
              className="mt-1 text-slate-400 hover:text-slate-600"
              aria-label="Dismiss"
            >
              ✕
            </button>
          )}
        </div>
        {toast.action && (
          <div className="flex justify-end gap-2">
            <Button
              onClick={() => {
                toast.action!.onClick();
                onDismiss(toast.id);
              }}
              className="bg-orange-500 hover:bg-orange-600 text-white"
            >
              {toast.action.label}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

interface ToastContainerProps {
  toasts: ToastItem[];
  onDismiss: (id: string) => void;
}

export function ToastContainer({ toasts, onDismiss }: ToastContainerProps) {
  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
      {toasts.map((toast) => (
        <Toast key={toast.id} toast={toast} onDismiss={onDismiss} />
      ))}
    </div>
  );
}

export function useToastQueue() {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const addToast = (
    title: string,
    message: string,
    duration = 5000,
    options?: { persistent?: boolean; action?: { label: string; onClick: () => void } }
  ) => {
    const id = Math.random().toString(36).slice(2);
    setToasts((prev) => [
      ...prev,
      {
        id,
        title,
        message,
        duration: options?.persistent ? undefined : duration,
        persistent: options?.persistent,
        action: options?.action,
      },
    ]);
  };

  const dismissToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  return { toasts, addToast, dismissToast };
}
