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
        <div className="space-y-2">
          {data.data.map((habit) => (
            <div
              key={habit.id}
              className="flex items-center justify-between rounded-lg border border-slate-200 p-4"
            >
              <div className="flex-1">
                <p className="font-medium text-slate-900">{habit.name}</p>
                <p className="text-sm text-slate-600">{habit.description}</p>
                <div className="mt-2 flex gap-4 text-sm">
                  <span className="text-slate-600">Current: {habit.currentStreak}</span>
                  <span className="text-slate-600">Best: {habit.bestStreak}</span>
                  <span className="rounded bg-slate-100 px-2 py-1 text-xs font-medium text-slate-700">
                    {habit.status}
                  </span>
                </div>
              </div>
              <div className="flex gap-2">
                <Link href={`/habits/${habit.id}`}>
                  <Button variant="secondary" size="sm">
                    View
                  </Button>
                </Link>
                {habit.status === 'ARCHIVED' ? (
                  <Button variant="outline" size="sm" disabled title="Archived habits are read-only">
                    Edit
                  </Button>
                ) : (
                  <Link href={`/habits/${habit.id}/edit`}>
                    <Button variant="outline" size="sm">
                      Edit
                    </Button>
                  </Link>
                )}
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => handleDelete(habit.id)}
                  disabled={deleteHabit.isPending}
                >
                  Delete
                </Button>
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
