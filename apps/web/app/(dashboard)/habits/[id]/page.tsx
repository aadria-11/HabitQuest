'use client';

import { use } from 'react';
import { useHabit } from '@/hooks/useHabits';
import { useCheckIn } from '@/hooks/useCheckIn';
import { useCheckIns } from '@/hooks/useCheckIns';
import { useCancelCheckIn } from '@/hooks/useCancelCheckIn';
import { StreakBadge } from '@/components/habits/StreakBadge';
import { Dialog } from '@/components/ui/dialog';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';

export default function HabitDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { data: habit, isLoading } = useHabit(id);
  const checkIn = useCheckIn();
  const cancelCheckIn = useCancelCheckIn();
  const { data: checkIns } = useCheckIns(id);

  const today = new Date().toISOString().split('T')[0];
  const alreadyCheckedInToday = checkIns?.some(
    (ci) => new Date(ci.checkInDate).toISOString().split('T')[0] === today
  );

  const handleCheckIn = async () => {
    try {
      await checkIn.mutateAsync({ habitId: id, checkInDate: today });
    } catch {
      // Error is captured by React Query and displayed via the dialog below
    }
  };

  const handleCancelCheckIn = async (checkInId: string) => {
    if (!confirm('Cancel this check-in?')) return;
    try {
      await cancelCheckIn.mutateAsync({ habitId: id, checkInId });
    } catch {
      // Error is captured by React Query and displayed via the dialog below
    }
  };

  if (isLoading) return <p className="px-4 py-8 text-slate-600">Loading...</p>;
  if (!habit) return <p className="px-4 py-8 text-slate-600">Habit not found</p>;

  return (
    <div className="mx-auto max-w-4xl space-y-6 px-4 py-8">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-slate-900">{habit.name}</h1>
        <div className="flex gap-2">
          <Link href={`/habits/${id}/edit`}>
            <Button variant="outline">Edit</Button>
          </Link>
          <Link href="/dashboard">
            <Button variant="secondary">Back</Button>
          </Link>
        </div>
      </div>

      <StreakBadge current={habit.currentStreak} />

      <div className="rounded-lg border border-slate-200 bg-white p-6">
        <h2 className="mb-4 text-lg font-semibold text-slate-900">Details</h2>
        <p className="text-slate-600">{habit.description}</p>
        <p className="mt-4 text-sm text-slate-600">
          Started: {new Date(habit.startDate).toLocaleDateString()}
        </p>
        <p className="mt-2 text-sm text-slate-600">Status: {habit.status}</p>
      </div>

      <Button
        size="lg"
        onClick={handleCheckIn}
        disabled={checkIn.isPending || alreadyCheckedInToday}
        className="w-full"
      >
        {checkIn.isPending ? 'Checking in...' : alreadyCheckedInToday ? 'Already checked in today' : 'Check In Today'}
      </Button>

      <Dialog
        open={checkIn.isError}
        title="Warning"
        message={checkIn.error?.message ?? 'Already checked in today'}
        onClose={() => checkIn.reset()}
      />

      <Dialog
        open={cancelCheckIn.isError}
        title="Error"
        message={cancelCheckIn.error?.message ?? 'Failed to cancel check-in'}
        onClose={() => cancelCheckIn.reset()}
      />

      <div className="rounded-lg border border-slate-200 bg-white p-6">
        <h2 className="mb-4 text-lg font-semibold text-slate-900">Check-In History</h2>
        {checkIns && checkIns.length > 0 ? (
          <div className="space-y-2">
            {checkIns.map((ci) => {
              const isDeleting =
                cancelCheckIn.isPending && cancelCheckIn.variables?.checkInId === ci.id;
              return (
                <div
                  key={ci.id}
                  className="flex items-center justify-between border-b border-slate-100 py-2 last:border-0"
                >
                  <span className="text-slate-600">
                    {new Date(ci.checkInDate).toLocaleDateString()}
                  </span>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-medium text-green-600">✓</span>
                    <button
                      type="button"
                      onClick={() => handleCancelCheckIn(ci.id)}
                      disabled={isDeleting}
                      aria-label="Cancel check-in"
                      className="text-slate-400 transition-colors hover:text-red-600 disabled:pointer-events-none disabled:opacity-50"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-slate-600">No check-ins yet. Start tracking today!</p>
        )}
      </div>
    </div>
  );
}

