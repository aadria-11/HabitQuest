'use client';

import { useState } from 'react';
import { useHabits } from '@/hooks/useHabits';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/layout/EmptyState';

type Filter = 'ALL' | 'ACTIVE' | 'PAUSED' | 'ARCHIVED' | 'TRACKING' | 'BEST_STREAK';

export default function DashboardPage() {
  const { data, isLoading } = useHabits({ pageSize: 500 });
  const [activeFilter, setActiveFilter] = useState<Filter>('ALL');

  const habits = data?.data || [];

  const allCount = habits.length;
  const activeCount = habits.filter((h) => h.status === 'ACTIVE').length;
  const pausedCount = habits.filter((h) => h.status === 'PAUSED').length;
  const archivedCount = habits.filter((h) => h.status === 'ARCHIVED').length;
  const trackingCount = habits.filter((h) => h.currentStreak > 0).length;
  const maxBestStreak = Math.max(...(habits.map((h) => h.bestStreak) || [0]), 0);

  const getFilteredHabits = () => {
    switch (activeFilter) {
      case 'ACTIVE':
        return habits.filter((h) => h.status === 'ACTIVE');
      case 'PAUSED':
        return habits.filter((h) => h.status === 'PAUSED');
      case 'ARCHIVED':
        return habits.filter((h) => h.status === 'ARCHIVED');
      case 'TRACKING':
        return habits.filter((h) => h.currentStreak > 0);
      case 'BEST_STREAK':
        return habits.filter(
          (h) => h.status !== 'ARCHIVED' && h.bestStreak === maxBestStreak
        );
      default:
        return habits;
    }
  };

  const getFilterLabel = () => {
    switch (activeFilter) {
      case 'ACTIVE':
        return 'Active Habits';
      case 'PAUSED':
        return 'Paused Habits';
      case 'ARCHIVED':
        return 'Archived Habits';
      case 'TRACKING':
        return 'Habits Tracking';
      case 'BEST_STREAK':
        return 'Best Streak';
      default:
        return 'All Habits';
    }
  };

  const filteredHabits = getFilteredHabits();

  const toggleFilter = (filter: Filter) => {
    setActiveFilter(activeFilter === filter ? 'ALL' : filter);
  };

  return (
    <div className="mx-auto max-w-7xl space-y-8 px-4 py-8">
      <div className="flex items-center justify-end">
        <Link href="/habits/new">
          <Button>Create Habit</Button>
        </Link>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <StatTile
          label="All Habits"
          value={allCount}
          isActive={activeFilter === 'ALL'}
          onClick={() => toggleFilter('ALL')}
        />
        <StatTile
          label="Active"
          value={activeCount}
          isActive={activeFilter === 'ACTIVE'}
          onClick={() => toggleFilter('ACTIVE')}
          color="green"
        />
        <StatTile
          label="Paused"
          value={pausedCount}
          isActive={activeFilter === 'PAUSED'}
          onClick={() => toggleFilter('PAUSED')}
          color="amber"
        />
        <StatTile
          label="Archived"
          value={archivedCount}
          isActive={activeFilter === 'ARCHIVED'}
          onClick={() => toggleFilter('ARCHIVED')}
          color="slate"
        />
        <StatTile
          label="Tracking"
          value={trackingCount}
          isActive={activeFilter === 'TRACKING'}
          onClick={() => toggleFilter('TRACKING')}
          color="purple"
        />
        <StatTile
          label="Best Streak"
          value={maxBestStreak}
          isActive={activeFilter === 'BEST_STREAK'}
          onClick={() => toggleFilter('BEST_STREAK')}
          color="yellow"
        />
      </div>

      <div>
        <h2 className="mb-6 text-lg font-semibold text-slate-900">{getFilterLabel()}</h2>
        {isLoading ? (
          <p className="text-slate-600">Loading...</p>
        ) : filteredHabits.length > 0 ? (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {filteredHabits.map((habit) => (
              <Link key={habit.id} href={`/habits/${habit.id}`}>
                <HabitCard habit={habit} />
              </Link>
            ))}
          </div>
        ) : (
          <EmptyState title="No habits found." description={`Try creating a new habit or changing your filter.`} />
        )}
      </div>
    </div>
  );
}

interface StatTileProps {
  label: string;
  value: number;
  isActive: boolean;
  onClick: () => void;
  color?: 'green' | 'amber' | 'slate' | 'purple' | 'yellow';
}

function StatTile({
  label,
  value,
  isActive,
  onClick,
  color = 'slate',
}: StatTileProps) {
  const colorClass = {
    green: 'bg-green-50 border-green-200',
    amber: 'bg-amber-50 border-amber-200',
    slate: 'bg-slate-50 border-slate-200',
    purple: 'bg-purple-50 border-purple-200',
    yellow: 'bg-yellow-50 border-yellow-200',
  }[color];

  return (
    <button
      onClick={onClick}
      className={`rounded-lg border p-4 text-left transition-all ${colorClass} ${
        isActive ? 'ring-2 ring-slate-900 ring-offset-1' : ''
      }`}
    >
      <p className="text-xs font-medium text-slate-600">{label}</p>
      <p className="mt-2 text-2xl font-bold text-slate-900">{value}</p>
    </button>
  );
}

interface HabitCardProps {
  habit: {
    id: string;
    name: string;
    status: string;
  };
}

function HabitCard({ habit }: HabitCardProps) {
  const statusColorMap: Record<string, string> = {
    ACTIVE: 'bg-green-50 border-green-200',
    PAUSED: 'bg-amber-50 border-amber-200',
    ARCHIVED: 'bg-slate-50 border-slate-200',
  };
  const statusColorClass = statusColorMap[habit.status] || 'bg-white border-slate-200';

  const statusLabelMap: Record<string, string> = {
    ACTIVE: 'bg-green-100 text-green-800',
    PAUSED: 'bg-amber-100 text-amber-800',
    ARCHIVED: 'bg-slate-100 text-slate-800',
  };
  const statusLabelClass = statusLabelMap[habit.status] || 'bg-slate-100 text-slate-800';

  return (
    <div
      className={`group rounded-lg border p-4 shadow-sm transition-all hover:shadow-md ${statusColorClass}`}
    >
      <p className="font-semibold text-slate-900 group-hover:text-slate-700">{habit.name}</p>
      <div className="mt-3 flex items-center justify-between">
        <span className={`inline-block rounded px-2 py-1 text-xs font-medium ${statusLabelClass}`}>
          {habit.status}
        </span>
      </div>
    </div>
  );
}
