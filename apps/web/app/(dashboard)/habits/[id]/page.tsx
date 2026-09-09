'use client';

import { useHabit } from '@/hooks/useHabits';
import { useCheckIn } from '@/hooks/useCheckIn';
import { useCheckIns } from '@/hooks/useCheckIns';
import { StreakBadge } from '@/components/habits/StreakBadge';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function HabitDetailsPage({ params }: { params: { id: string } }) {
  const { data: habit, isLoading } = useHabit(params.id);
  const checkIn = useCheckIn();
  const { data: checkIns } = useCheckIns(params.id);

  const handleCheckIn = async () => {
    const today = new Date().toISOString().split('T')[0];
    await checkIn.mutateAsync({ habitId: params.id, checkInDate: today });
  };

  if (isLoading) return <p className="px-4 py-8 text-slate-600">Loading...</p>;
  if (!habit) return <p className="px-4 py-8 text-slate-600">Habit not found</p>;

  return (
    <div className="mx-auto max-w-4xl space-y-6 px-4 py-8">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-slate-900">{habit.name}</h1>
        <div className="flex gap-2">
          <Link href={`/habits/${habit.id}/edit`}>
            <Button variant="outline">Edit</Button>
          </Link>
          <Link href="/habits">
            <Button variant="secondary">Back</Button>
          </Link>
        </div>
      </div>

      <StreakBadge current={habit.currentStreak} best={habit.bestStreak} />

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
        disabled={checkIn.isPending}
        className="w-full"
      >
        {checkIn.isPending ? 'Checking in...' : 'Check In Today'}
      </Button>

      <div className="rounded-lg border border-slate-200 bg-white p-6">
        <h2 className="mb-4 text-lg font-semibold text-slate-900">Check-In History</h2>
        {checkIns && checkIns.length > 0 ? (
          <div className="space-y-2">
            {checkIns.map((ci) => (
              <div key={ci.id} className="flex items-center justify-between border-b border-slate-100 py-2 last:border-0">
                <span className="text-slate-600">
                  {new Date(ci.checkInDate).toLocaleDateString()}
                </span>
                <span className="text-sm font-medium text-green-600">✓</span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-slate-600">No check-ins yet. Start tracking today!</p>
        )}
      </div>
    </div>
  );
}
