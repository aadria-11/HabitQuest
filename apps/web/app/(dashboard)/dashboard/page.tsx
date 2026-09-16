'use client';

import { useState, useEffect, useCallback } from 'react';
import { useHabits } from '@/hooks/useHabits';
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
  const [formattedDate, setFormattedDate] = useState('');

  useEffect(() => {
    setFormattedDate(new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' }));
  }, []);

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
    <div className="mx-auto max-w-7xl space-y-4 sm:space-y-8 px-3 sm:px-4 py-4 sm:py-8">
      {/* Welcome Header - Lord of the Rings Theme */}
      <div className="bg-gradient-to-r from-amber-900 via-amber-800 to-green-900 rounded-2xl p-4 sm:p-8 border-2 border-amber-700 relative overflow-hidden">
        {/* Decorative background pattern */}
        <div className="absolute inset-0 opacity-10" style={{backgroundImage: 'radial-gradient(circle, #d4af37 1px, transparent 1px)', backgroundSize: '20px 20px'}}></div>
        <div className="relative">
          <h1 className="text-xl sm:text-3xl font-bold text-amber-300 mb-2" style={{fontFamily: 'Georgia, serif', textShadow: '2px 2px 4px rgba(0,0,0,0.5)', letterSpacing: '0.05em'}}>
            ⚔️ Welcome, Brave Adventurer
          </h1>
          <p className="text-amber-200 text-xs sm:text-sm italic font-medium">
            &quot;All we have to decide is what quests to undertake and when to undertake them.&quot; - Gandalf the Grey
          </p>
          <p className="text-amber-300 text-xs mt-2 font-semibold tracking-widest">
            Your daily quests await... {formattedDate}
          </p>
        </div>
      </div>

      {/* Search & Create */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
        <input
          type="text"
          placeholder="Search your quests..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 rounded-lg border-2 border-amber-700 bg-amber-50 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-600 transition-all text-slate-900 placeholder-slate-500"
        />
        <Link href="/habits/new" className="w-full sm:w-auto">
          <Button className="w-full bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 text-white font-bold border-2 border-amber-500">
            ⚔️ New Quest
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-2 xs:grid-cols-2 sm:gap-3 sm:grid-cols-3 lg:grid-cols-6">
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
            <div className="rounded-xl border-2 border-yellow-600 bg-gradient-to-br from-yellow-900 to-yellow-950 p-5 text-left transition-all hover:shadow-lg hover:scale-105 shadow-md">
              <p className="text-xs font-bold text-yellow-300 uppercase tracking-widest">👑 Legendary</p>
              <p className="mt-2 text-sm font-bold text-yellow-200">{bestStreakHabit.name}</p>
              <p className="text-3xl font-bold text-yellow-300" style={{fontFamily: 'Georgia, serif'}}>{maxBestStreak} <span className="text-xl">⭐</span></p>
            </div>
          </Link>
        ) : (
          <div className="rounded-xl border-2 border-yellow-600 bg-gradient-to-br from-yellow-900 to-yellow-950 p-5 text-left shadow-md">
            <p className="text-xs font-bold text-yellow-300 uppercase tracking-widest">👑 Legendary</p>
            <p className="mt-4 text-3xl font-bold text-yellow-300">— <span className="text-xl">⭐</span></p>
          </div>
        )}

      </div>

      <div>
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <span className="text-3xl">📜</span>
            <h2 className="text-2xl font-bold text-amber-900" style={{fontFamily: 'Georgia, serif', textShadow: '1px 1px 2px rgba(0,0,0,0.1)'}}>{getFilterLabel()}</h2>
          </div>
          {(activeFilter === 'ACTIVE' || activeFilter === 'ALL') && (
            <div className="flex flex-col gap-2 sm:flex-row sm:gap-3">
              <button
                onClick={() => setCompletionFilter(completionFilter === 'COMPLETED_TODAY' ? null : 'COMPLETED_TODAY')}
                className={`rounded-lg px-2 py-1.5 sm:px-4 sm:py-2 text-xs sm:text-sm font-bold transition-all border-2 uppercase tracking-wider ${
                  completionFilter === 'COMPLETED_TODAY'
                    ? 'bg-gradient-to-r from-emerald-700 to-emerald-800 text-amber-50 border-emerald-600 shadow-lg ring-2 ring-amber-400'
                    : 'bg-gradient-to-r from-amber-900 to-amber-950 text-amber-200 border-amber-700 hover:from-amber-800 hover:to-amber-900'
                }`}
              >
                <span className="hidden sm:inline">✓ Completed Quest</span>
                <span className="sm:hidden">✓ Completed</span>
              </button>
              <button
                onClick={() => setCompletionFilter(completionFilter === 'NOT_COMPLETED_TODAY' ? null : 'NOT_COMPLETED_TODAY')}
                className={`rounded-lg px-2 py-1.5 sm:px-4 sm:py-2 text-xs sm:text-sm font-bold transition-all border-2 uppercase tracking-wider ${
                  completionFilter === 'NOT_COMPLETED_TODAY'
                    ? 'bg-gradient-to-r from-amber-900 to-amber-950 text-amber-50 border-amber-600 shadow-lg ring-2 ring-amber-400'
                    : 'bg-gradient-to-r from-amber-900 to-amber-950 text-amber-200 border-amber-700 hover:from-amber-800 hover:to-amber-900'
                }`}
              >
                <span className="hidden sm:inline">⊘ Unfinished Quest</span>
                <span className="sm:hidden">⊘ Unfinished</span>
              </button>
            </div>
          )}
        </div>
        {isLoading ? (
          <p className="text-slate-600">Loading...</p>
        ) : filteredHabits.length > 0 ? (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-4">
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
    green: 'bg-gradient-to-br from-green-900 to-green-950 border-green-700',
    amber: 'bg-gradient-to-br from-amber-800 to-amber-900 border-amber-600',
    slate: 'bg-gradient-to-br from-amber-900 to-amber-950 border-amber-700',
    purple: 'bg-gradient-to-br from-purple-900 to-purple-950 border-purple-700',
    yellow: 'bg-gradient-to-br from-yellow-900 to-yellow-950 border-yellow-700',
  }[color];

  return (
    <button
      onClick={onClick}
      className={`rounded-xl border-2 p-3 sm:p-5 text-left transition-all hover:shadow-lg ${colorClass} ${
        isActive ? 'ring-2 ring-amber-400 ring-offset-2 ring-offset-amber-950 shadow-xl' : 'shadow-md'
      }`}
    >
      <p className="text-xs font-bold text-amber-300 uppercase tracking-widest">{label}</p>
      <p className="mt-2 sm:mt-3 text-2xl sm:text-3xl font-bold text-amber-400">{value}</p>
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
  if (!habit) return null;

  useEffect(() => {
    const isCheckedIn = habit.checkedInToday || false;
    onCheckInStatusChange(habit.id, isCheckedIn);
  }, [habit.id, habit.checkedInToday, onCheckInStatusChange]);

  const isCheckedIn = habit.checkedInToday || false;

  const statusColorMap: Record<string, string> = {
    ACTIVE: 'from-green-900 to-green-950 border-green-700',
    PAUSED: 'from-amber-800 to-amber-900 border-amber-700',
    ARCHIVED: 'from-gray-800 to-gray-900 border-gray-700',
  };
  const statusColorClass = statusColorMap[habit.status] || 'from-amber-900 to-amber-950 border-amber-700';

  const statusLabelMap: Record<string, string> = {
    ACTIVE: 'bg-green-700 text-green-100 border-green-600',
    PAUSED: 'bg-amber-700 text-amber-100 border-amber-600',
    ARCHIVED: 'bg-gray-700 text-gray-200 border-gray-600',
  };
  const statusLabelClass = statusLabelMap[habit.status] || 'bg-amber-700 text-amber-100 border-amber-600';

  return (
    <Link href={`/habits/${habit.id}`}>
      <div
        className={`group rounded-xl border-2 bg-gradient-to-br p-4 shadow-md transition-all hover:shadow-xl hover:scale-105 ${statusColorClass}`}
      >
        <p className="text-sm sm:text-base font-bold text-amber-300 group-hover:text-amber-200 line-clamp-2">{habit.name}</p>
        <div className="mt-3 flex items-center justify-between gap-2">
          <span className={`inline-block rounded-lg px-2 py-1 sm:px-3 sm:py-1.5 text-xs font-bold uppercase tracking-wider border-2 ${statusLabelMap[habit.status] || statusLabelClass}`}>
            {habit.status === 'ACTIVE'
              ? '🟢 Active'
              : habit.status === 'PAUSED'
                ? '⏸️ Paused'
                : '🔒 Sealed'}
          </span>
          {isCheckedIn && <span className="text-base sm:text-lg font-bold text-green-300">✓</span>}
        </div>
        <div className="mt-2 flex gap-2">
          <div className="flex-1 rounded-lg bg-black/20 px-2 py-1.5 text-center">
            <p className="text-xs text-amber-300 font-semibold">Current</p>
            <p className="text-base sm:text-lg font-bold text-amber-400">{habit.currentStreak}</p>
          </div>
          <div className="flex-1 rounded-lg bg-black/20 px-2 py-1.5 text-center">
            <p className="text-xs text-amber-300 font-semibold">Best</p>
            <p className="text-base sm:text-lg font-bold text-amber-400">{habit.bestStreak}</p>
          </div>
        </div>
      </div>
    </Link>
  );
}
