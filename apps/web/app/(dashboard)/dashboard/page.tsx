'use client';

import { useState, useEffect, useCallback } from 'react';
import { useHabits } from '@/hooks/useHabits';
import { useCheckIns } from '@/hooks/useCheckIns';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/layout/EmptyState';

type Filter = 'ALL' | 'ACTIVE' | 'PAUSED' | 'ARCHIVED' | 'BEST_STREAK';
type CompletionFilter = null | 'COMPLETED_TODAY' | 'NOT_COMPLETED_TODAY';

export default function DashboardPage() {
  const { data, isLoading } = useHabits({ pageSize: 500 });
  const [activeFilter, setActiveFilter] = useState<Filter>('ALL');
  const [completionFilter, setCompletionFilter] = useState<CompletionFilter>(null);
  const [search, setSearch] = useState('');
  const [checkedInHabits, setCheckedInHabits] = useState<Set<string>>(new Set());

  const habits = data?.data || [];

  const today = new Date().toISOString().split('T')[0];

  const allCount = habits.length;
  const activeCount = habits.filter((h) => h.status === 'ACTIVE').length;
  const pausedCount = habits.filter((h) => h.status === 'PAUSED').length;
  const archivedCount = habits.filter((h) => h.status === 'ARCHIVED').length;
  const maxBestStreak = Math.max(...habits.map((h) => h.bestStreak || 0), 0);
  const bestStreakHabit = habits.find((h) => h.bestStreak === maxBestStreak && h.bestStreak > 0);

  const searchLower = search.toLowerCase();
  const searchedHabits = habits.filter(
    (h) =>
      h.name.toLowerCase().includes(searchLower) ||
      (h.description && h.description.toLowerCase().includes(searchLower))
  );

  const getFilteredHabits = () => {
    let filtered: typeof habits = [];

    switch (activeFilter) {
      case 'ACTIVE':
        filtered = searchedHabits.filter((h) => h.status === 'ACTIVE');
        break;
      case 'PAUSED':
        filtered = searchedHabits.filter((h) => h.status === 'PAUSED');
        break;
      case 'ARCHIVED':
        filtered = searchedHabits.filter((h) => h.status === 'ARCHIVED');
        break;
      case 'BEST_STREAK':
        filtered = searchedHabits.filter(
          (h) => h.status !== 'ARCHIVED' && h.bestStreak === maxBestStreak
        );
        break;
      default:
        filtered = searchedHabits;
    }

    if (completionFilter && (activeFilter === 'ACTIVE' || activeFilter === 'ALL')) {
      filtered = filtered.filter((h) => {
        const isCheckedInToday = checkedInHabits.has(h.id);
        if (completionFilter === 'COMPLETED_TODAY') {
          return isCheckedInToday;
        } else if (completionFilter === 'NOT_COMPLETED_TODAY') {
          return !isCheckedInToday;
        }
        return true;
      });
    }

    return filtered;
  };

  const getFilterLabel = () => {
    switch (activeFilter) {
      case 'ACTIVE':
        return 'Active Habits';
      case 'PAUSED':
        return 'Paused Habits';
      case 'ARCHIVED':
        return 'Archived Habits';
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

  const handleCheckInStatusChange = useCallback((habitId: string, isCheckedIn: boolean) => {
    setCheckedInHabits((prev) => {
      const newSet = new Set(prev);
      if (isCheckedIn) {
        newSet.add(habitId);
      } else {
        newSet.delete(habitId);
      }
      return newSet;
    });
  }, []);

  return (
    <div className="mx-auto max-w-7xl space-y-8 px-4 py-8">
      {/* Welcome Header */}
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl p-6 border border-blue-100">
        <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-1">
          🎯 Your Habit Dashboard
        </h1>
        <p className="text-slate-600 text-sm">
          Build better habits, one day at a time ✨
        </p>
      </div>

      {/* Search & Create */}
      <div className="flex items-center justify-between gap-4">
        <input
          type="text"
          placeholder="Search your habits..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 rounded-lg border border-slate-300 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
        />
        <Link href="/habits/new">
          <Button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
            ➕ Create Habit
          </Button>
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
        {bestStreakHabit ? (
          <Link href={`/habits/${bestStreakHabit.id}`}>
            <div className="rounded-lg border border-purple-200 bg-purple-50 p-4 text-left transition-all">
              <p className="text-xs font-medium text-purple-600">Best Streak</p>
              <p className="mt-2 text-sm font-medium text-purple-900">{bestStreakHabit.name}</p>
              <p className="text-2xl font-bold text-purple-900">{maxBestStreak} days ⭐</p>
            </div>
          </Link>
        ) : (
          <div className="rounded-lg border border-purple-200 bg-purple-50 p-4 text-left">
            <p className="text-xs font-medium text-purple-600">Best Streak</p>
            <p className="mt-2 text-2xl font-bold text-purple-900">— ⭐</p>
          </div>
        )}

      </div>

      <div>
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-900">{getFilterLabel()}</h2>
          {(activeFilter === 'ACTIVE' || activeFilter === 'ALL') && (
            <div className="flex gap-2">
              <button
                onClick={() => setCompletionFilter(completionFilter === 'COMPLETED_TODAY' ? null : 'COMPLETED_TODAY')}
                className={`rounded px-3 py-1 text-sm font-medium transition-colors ${
                  completionFilter === 'COMPLETED_TODAY'
                    ? 'bg-green-500 text-white'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                ✓ Completed Today
              </button>
              <button
                onClick={() => setCompletionFilter(completionFilter === 'NOT_COMPLETED_TODAY' ? null : 'NOT_COMPLETED_TODAY')}
                className={`rounded px-3 py-1 text-sm font-medium transition-colors ${
                  completionFilter === 'NOT_COMPLETED_TODAY'
                    ? 'bg-orange-500 text-white'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                ○ Not Completed Today
              </button>
            </div>
          )}
        </div>
        {isLoading ? (
          <p className="text-slate-600">Loading...</p>
        ) : filteredHabits.length > 0 ? (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {filteredHabits.map((habit) => (
              <HabitCardWithCheckIn
                key={habit.id}
                habit={habit}
                onCheckInStatusChange={handleCheckInStatusChange}
              />
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

interface HabitCardWithCheckInProps {
  habit: any;
  onCheckInStatusChange: (habitId: string, isCheckedIn: boolean) => void;
}

function HabitCardWithCheckIn({ habit, onCheckInStatusChange }: HabitCardWithCheckInProps) {
  const { data: checkIns, isLoading } = useCheckIns(habit.id);
  const [isCheckedIn, setIsCheckedIn] = useState(false);

  useEffect(() => {
    if (checkIns !== undefined) {
      const today = new Date().toISOString().split('T')[0];
      const checkedInToday = checkIns && checkIns.length > 0 && checkIns.some(
        (ci) => {
          const ciDate = new Date(ci.checkInDate);
          const ciDateStr = ciDate.toISOString().split('T')[0];
          return ciDateStr === today;
        }
      );
      setIsCheckedIn(checkedInToday);
      onCheckInStatusChange(habit.id, checkedInToday);
    }
  }, [checkIns, habit.id, onCheckInStatusChange]);

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
    <Link href={`/habits/${habit.id}`}>
      <div
        className={`group rounded-lg border p-4 shadow-sm transition-all hover:shadow-md ${statusColorClass}`}
      >
        <p className="font-semibold text-slate-900 group-hover:text-slate-700">{habit.name}</p>
        <div className="mt-3 flex items-center justify-between">
          <span className={`inline-block rounded px-2 py-1 text-xs font-medium ${statusLabelClass}`}>
            {habit.status}
          </span>
          {isCheckedIn && <span className="text-sm font-bold text-green-600">✓ Today</span>}
        </div>
      </div>
    </Link>
  );
}
