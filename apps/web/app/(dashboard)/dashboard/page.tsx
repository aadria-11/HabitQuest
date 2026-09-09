'use client';

import { useHabits } from '@/hooks/useHabits';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function DashboardPage() {
  const { data, isLoading } = useHabits({});

  const totalHabits = data?.total || 0;
  const activeHabits = data?.data?.filter((h) => h.status === 'ACTIVE').length || 0;
  const bestStreak = Math.max(...(data?.data?.map((h) => h.bestStreak) || [0]), 0);

  return (
    <div className="mx-auto max-w-7xl space-y-8 px-4 py-8">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-slate-900">Dashboard</h1>
        <Link href="/habits/new">
          <Button>Create Habit</Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total Habits" value={totalHabits} />
        <StatCard label="Active Habits" value={activeHabits} />
        <StatCard label="Best Streak" value={bestStreak} />
        <StatCard label="Habits Tracking" value={activeHabits} />
      </div>

      <div>
        <h2 className="mb-4 text-xl font-semibold text-slate-900">Recent Habits</h2>
        {isLoading ? (
          <p className="text-slate-600">Loading...</p>
        ) : data?.data && data.data.length > 0 ? (
          <div className="space-y-2">
            {data.data.slice(0, 5).map((habit) => (
              <div
                key={habit.id}
                className="flex items-center justify-between rounded-lg border border-slate-200 p-4"
              >
                <div>
                  <p className="font-medium text-slate-900">{habit.name}</p>
                  <p className="text-sm text-slate-600">Current: {habit.currentStreak}</p>
                </div>
                <Link href={`/habits/${habit.id}`}>
                  <Button variant="secondary" size="sm">
                    View
                  </Button>
                </Link>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-slate-600">No habits yet. Create one to get started!</p>
        )}
      </div>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-6">
      <p className="text-sm text-slate-600">{label}</p>
      <p className="mt-2 text-3xl font-bold text-slate-900">{value}</p>
    </div>
  );
}
