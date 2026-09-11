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
    <div className="mx-auto max-w-7xl space-y-6 px-4 py-8">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-slate-900">Habits</h1>
        <Link href="/habits/new">
          <Button>Create New</Button>
        </Link>
      </div>

      <div className="space-y-4">
        <div className="flex gap-4">
          <input
            type="text"
            placeholder="Search habits..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="flex-1 rounded-md border border-slate-300 px-3 py-2"
          />
          <select
            value={status}
            onChange={(e) => {
              setStatus(e.target.value);
              setPage(1);
            }}
            className="rounded-md border border-slate-300 px-3 py-2"
          >
            <option value="">All Status</option>
            <option value="ACTIVE">Active</option>
            <option value="PAUSED">Paused</option>
            <option value="ARCHIVED">Archived</option>
          </select>
        </div>
      </div>

      {isLoading ? (
        <p className="text-slate-600">Loading...</p>
      ) : data?.data && data.data.length > 0 ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {data.data.map((habit) => (
            <div
              key={habit.id}
              className="group flex flex-col rounded-xl border border-slate-200 bg-white shadow-sm transition-all hover:shadow-md"
            >
              {/* Header - Details Section */}
              <div className="border-b border-slate-100 px-6 py-4">
                <h3 className="mb-2 text-lg font-semibold text-slate-900">{habit.name}</h3>
                <p className="text-sm text-slate-600 line-clamp-2">{habit.description}</p>
              </div>

              {/* Start Date Section */}
              <div className="border-b border-slate-100 px-6 py-3 text-center">
                <p className="text-xs font-medium uppercase tracking-wider text-slate-500 mb-1">
                  Started
                </p>
                <p className="text-sm font-medium text-slate-900">
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
                    className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wider ${
                      habit.status === 'ACTIVE'
                        ? 'bg-green-100 text-green-700'
                        : habit.status === 'PAUSED'
                          ? 'bg-yellow-100 text-yellow-700'
                          : 'bg-slate-100 text-slate-700'
                    }`}
                  >
                    {habit.status}
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div className="rounded-lg bg-yellow-50 px-3 py-3 text-center">
                    <p className="text-2xl font-bold text-yellow-900">{habit.currentStreak}</p>
                    <p className="text-xs font-medium text-yellow-700 mt-1">🔥 Current</p>
                  </div>
                  <div className="rounded-lg bg-purple-50 px-3 py-3 text-center">
                    <p className="text-2xl font-bold text-purple-900">{habit.bestStreak}</p>
                    <p className="text-xs font-medium text-purple-700 mt-1">⭐ Best</p>
                  </div>
                  <div className="rounded-lg bg-cyan-50 px-3 py-3 text-center">
                    <p className="text-2xl font-bold text-cyan-900">{habit.checkInCount}</p>
                    <p className="text-xs font-medium text-cyan-700 mt-1">📊 Total</p>
                  </div>
                </div>
              </div>

              {/* Actions Section */}
              <div className="border-t border-slate-100 px-6 py-4 flex flex-col gap-2">
                <Link href={`/habits/${habit.id}`} className="w-full">
                  <Button variant="secondary" size="sm" className="w-full">
                    View
                  </Button>
                </Link>
                <div className="flex gap-2">
                  {habit.status === 'ARCHIVED' ? (
                    <Button
                      variant="outline"
                      size="sm"
                      disabled
                      title="Archived habits are read-only"
                      className="flex-1"
                    >
                      Edit
                    </Button>
                  ) : (
                    <Link href={`/habits/${habit.id}/edit`} className="flex-1">
                      <Button variant="outline" size="sm" className="w-full">
                        Edit
                      </Button>
                    </Link>
                  )}
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleDelete(habit.id)}
                    disabled={deleteHabit.isPending}
                    className="flex-1"
                  >
                    Delete
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-slate-600">No habits found.</p>
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
