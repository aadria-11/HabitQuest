'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useHabits, useDeleteHabit } from '@/hooks';
import { Button } from '@/components/ui/button';

export default function HabitsPage() {
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<string>('');
  const [page, setPage] = useState(1);
  const pageSize = 10;

  const { data, isLoading } = useHabits({ search, status, page, pageSize });
  const deleteHabit = useDeleteHabit();

  const handleDelete = async (id: string) => {
    if (confirm('Delete this habit? This will permanently delete its check-in history too. This cannot be undone.')) {
      await deleteHabit.mutateAsync(id);
    }
  };

  return (
    <div className="mx-auto max-w-7xl space-y-8 px-4 py-8">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-slate-900">Habits</h1>
        <Link href="/habits/new" data-test="new-habit-btn">
          <Button className="bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 text-white font-bold border-2 border-amber-500">
            ⚔️ Create New
          </Button>
        </Link>
      </div>

      <div className="space-y-4 rounded-xl border-2 border-amber-700 bg-gradient-to-br from-amber-50 to-amber-100 p-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center">
          <input
            type="text"
            placeholder="Search habits by name or description..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="flex-1 rounded-lg border-2 border-amber-700 bg-white px-4 py-2.5 text-slate-900 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-600 transition-all"
          />
          <select
            value={status}
            onChange={(e) => {
              setStatus(e.target.value);
              setPage(1);
            }}
            className="rounded-lg border-2 border-amber-700 bg-white px-4 py-2.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-600 transition-all"
          >
            <option value="">All Status</option>
            <option value="ACTIVE">🟢 Active</option>
            <option value="PAUSED">⏸️ Paused</option>
            <option value="ARCHIVED">🔒 Archived</option>
          </select>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center rounded-xl border-2 border-amber-700 bg-gradient-to-br from-amber-900 to-amber-950 p-12 shadow-lg">
          <div className="text-center">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-amber-400 border-t-transparent mb-4"></div>
            <p className="text-amber-300 font-semibold">Loading your quests...</p>
          </div>
        </div>
      ) : data?.data && data.data.length > 0 ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {data.data.map((habit) => (
            <div
              key={habit.id}
              data-test="habit-card"
              className="group flex flex-col rounded-xl border-2 border-amber-700 bg-gradient-to-br from-amber-900 to-amber-950 shadow-md hover:shadow-lg transition-all duration-200 hover:scale-105 focus-within:ring-2 focus-within:ring-amber-400"
            >
              {/* Header - Details Section */}
              <div className="border-b border-amber-700 px-6 py-4">
                <h3 className="mb-2 text-lg font-bold text-amber-300">{habit.name}</h3>
                <p className="text-sm text-amber-200 line-clamp-2">{habit.description}</p>
              </div>

              {/* Start Date Section */}
              <div className="border-b border-amber-700 px-6 py-3 text-center">
                <p className="text-xs font-bold uppercase tracking-wider text-amber-400 mb-1">
                  Started
                </p>
                <p className="text-sm font-semibold text-amber-100">
                  {new Date(habit.startDate).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                </p>
              </div>

              {/* Status & Streaks Section */}
              <div className="px-6 py-4">
                <div className="mb-4 flex justify-center">
                  <span
                    className={`rounded-lg px-3 py-1.5 text-xs font-bold uppercase tracking-wider border-2 ${
                      habit.status === 'ACTIVE'
                        ? 'bg-green-900 text-green-200 border-green-700'
                        : habit.status === 'PAUSED'
                          ? 'bg-amber-800 text-amber-200 border-amber-700'
                          : 'bg-gray-800 text-gray-300 border-gray-700'
                    }`}
                  >
                    {habit.status === 'ACTIVE' ? '🟢 Active' : habit.status === 'PAUSED' ? '⏸️ Paused' : '🔒 Sealed'}
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div className="rounded-lg bg-yellow-900 px-3 py-3 text-center border border-yellow-700">
                    <p className="text-2xl font-bold text-yellow-300">{habit.currentStreak}</p>
                    <p className="text-xs font-bold text-yellow-200 mt-1">🔥 Current</p>
                  </div>
                  <div className="rounded-lg bg-purple-900 px-3 py-3 text-center border border-purple-700">
                    <p className="text-2xl font-bold text-purple-300">{habit.bestStreak}</p>
                    <p className="text-xs font-bold text-purple-200 mt-1">⭐ Best</p>
                  </div>
                  <div className="rounded-lg bg-cyan-900 px-3 py-3 text-center border border-cyan-700">
                    <p className="text-2xl font-bold text-cyan-300">{habit.checkInCount}</p>
                    <p className="text-xs font-bold text-cyan-200 mt-1">📊 Total</p>
                  </div>
                </div>
              </div>

              {/* Actions Section */}
              <div className="border-t border-amber-700 px-6 py-4 flex flex-col gap-2">
                <Link href={`/habits/${habit.id}`} className="w-full" data-test={`habit-view-${habit.id}`}>
                  <Button className="w-full bg-amber-700 hover:bg-amber-600 text-amber-50 font-bold border-2 border-amber-600 transition-all">
                    📖 View Quest
                  </Button>
                </Link>
                <div className="flex gap-2">
                  {habit.status === 'ARCHIVED' ? (
                    <Button
                      disabled
                      title="Archived habits are read-only"
                      className="flex-1 bg-gray-700 text-gray-400 cursor-not-allowed opacity-60"
                    >
                      Edit
                    </Button>
                  ) : (
                    <Link href={`/habits/${habit.id}/edit`} className="flex-1" data-test={`habit-edit-${habit.id}`}>
                      <Button className="w-full bg-amber-800 hover:bg-amber-700 text-amber-50 font-bold border-2 border-amber-700 transition-all">
                        ✏️ Edit
                      </Button>
                    </Link>
                  )}
                  <Button
                    onClick={() => handleDelete(habit.id)}
                    disabled={deleteHabit.isPending}
                    data-test={`habit-delete-${habit.id}`}
                    className="flex-1 bg-red-900 hover:bg-red-800 text-red-100 font-bold border-2 border-red-700 transition-all disabled:opacity-60"
                  >
                    🔥 Delete
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : search || status ? (
        <div className="rounded-xl border-2 border-amber-700 bg-gradient-to-br from-amber-900 to-amber-950 p-12 text-center shadow-lg">
          <p className="text-4xl mb-4">🔍</p>
          <p className="text-xl font-bold text-amber-300 mb-2">No quests match your search</p>
          <p className="text-amber-200 mb-6">Try adjusting your filters or search terms</p>
          <button
            onClick={() => {
              setSearch('');
              setStatus('');
              setPage(1);
            }}
            className="rounded-lg bg-amber-700 hover:bg-amber-600 text-amber-50 px-6 py-2.5 font-bold border-2 border-amber-600 transition-all"
          >
            Clear Filters
          </button>
        </div>
      ) : (
        <div className="rounded-xl border-2 border-amber-700 bg-gradient-to-br from-amber-900 to-amber-950 p-12 text-center shadow-lg">
          <p className="text-4xl mb-4">⚔️</p>
          <p className="text-xl font-bold text-amber-300 mb-2">No quests yet</p>
          <p className="text-amber-200 mb-6">Begin your adventure by creating your first habit</p>
          <Link href="/habits/new">
            <Button className="bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 text-white font-bold border-2 border-amber-500">
              ⚔️ Create First Quest
            </Button>
          </Link>
        </div>
      )}

      {data && data.total > pageSize && (
        <div className="flex justify-center gap-2">
          <Button
            variant="outline"
            disabled={page === 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
          >
            Previous
          </Button>
          <span className="px-3 py-2">
            Page {page} of {Math.ceil(data.total / pageSize)}
          </span>
          <Button
            variant="outline"
            disabled={page * pageSize >= data.total}
            onClick={() => setPage((p) => p + 1)}
          >
            Next
          </Button>
        </div>
      )}
    </div>
  );
}
