'use client';

import { useHabit } from '@/hooks/useHabits';
import { useCheckIn } from '@/hooks/useCheckIn';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function HabitDetailsPage({ params }: { params: { id: string } }) {
  const { data: habit, isLoading } = useHabit(params.id);
  const checkIn = useCheckIn();

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

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-lg border border-slate-200 bg-white p-6">
          <p className="text-sm text-slate-600">Current Streak</p>
          <p className="mt-2 text-3xl font-bold text-slate-900">{habit.currentStreak}</p>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-6">
          <p className="text-sm text-slate-600">Best Streak</p>
          <p className="mt-2 text-3xl font-bold text-slate-900">{habit.bestStreak}</p>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-6">
          <p className="text-sm text-slate-600">Status</p>
          <p className="mt-2 font-bold text-slate-900">{habit.status}</p>
        </div>
      </div>

      <div className="rounded-lg border border-slate-200 bg-white p-6">
        <h2 className="mb-4 text-lg font-semibold text-slate-900">Details</h2>
        <p className="text-slate-600">{habit.description}</p>
        <p className="mt-4 text-sm text-slate-600">
          Started: {new Date(habit.startDate).toLocaleDateString()}
        </p>
      </div>

      <Button size="lg" onClick={handleCheckIn} disabled={checkIn.isPending}>
        {checkIn.isPending ? 'Checking in...' : 'Check In Today'}
      </Button>
    </div>
  );
}
