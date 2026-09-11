'use client';

import { use, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useHabit } from '@/hooks/useHabits';
import { useCheckIn } from '@/hooks/useCheckIn';
import { useCheckIns } from '@/hooks/useCheckIns';
import { useCancelCheckIn } from '@/hooks/useCancelCheckIn';
import { useDeleteHabit } from '@/hooks';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';

export default function HabitDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { id } = use(params);
  const { data: habit, isLoading } = useHabit(id);
  const checkIn = useCheckIn();
  const cancelCheckIn = useCancelCheckIn();
  const deleteHabit = useDeleteHabit();
  const { data: checkIns, isLoading: checkInsLoading } = useCheckIns(id);
  const [showCommentDialog, setShowCommentDialog] = useState(false);
  const [comment, setComment] = useState('');

  const today = new Date().toISOString().split('T')[0];
  const alreadyCheckedInToday = checkIns?.some(
    (ci) => new Date(ci.checkInDate).toISOString().split('T')[0] === today
  );

  const handleCheckIn = async () => {
    setShowCommentDialog(true);
  };

  const handleConfirmCheckIn = async (comment: string) => {
    try {
      await checkIn.mutateAsync({ habitId: id, checkInDate: today, comment: comment || undefined });
      setComment('');
      setShowCommentDialog(false);
    } catch {
      // Error is captured by React Query and displayed via the dialog below
    }
  };

  useEffect(() => {
    if (!checkIn.isPending && checkIn.isSuccess && showCommentDialog) {
      setShowCommentDialog(false);
    }
  }, [checkIn.isPending, checkIn.isSuccess, showCommentDialog]);

  useEffect(() => {
    if (checkIn.isError && showCommentDialog) {
      setShowCommentDialog(false);
    }
  }, [checkIn.isError, showCommentDialog]);

  const handleCancelCheckIn = async (checkInId: string) => {
    if (!confirm('Cancel this check-in?')) return;
    try {
      await cancelCheckIn.mutateAsync({ habitId: id, checkInId });
    } catch {
      // Error is captured by React Query and displayed via the dialog below
    }
  };

  const handleDelete = async () => {
    if (!confirm('Delete this habit? This will permanently delete its check-in history too. This cannot be undone.')) return;
    try {
      await deleteHabit.mutateAsync(id);
      router.push('/dashboard');
    } catch {
      // Error is captured by React Query
    }
  };

  if (isLoading) return <p className="px-4 py-8 text-slate-600">Loading...</p>;
  if (!habit) return <p className="px-4 py-8 text-slate-600">Habit not found</p>;

  const isArchived = habit.status === 'ARCHIVED';
  const canCheckIn = habit.status === 'ACTIVE';

  return (
    <div className="mx-auto max-w-4xl space-y-6 px-4 py-8">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-3xl font-bold text-slate-900">{habit.name}</h1>
          {isArchived && (
            <span className="rounded bg-slate-100 px-2 py-1 text-xs font-medium text-slate-800">
              Read-only
            </span>
          )}
        </div>
        <div className="flex gap-2">
          {!isArchived && (
            <Link href={`/habits/${id}/edit`}>
              <Button variant="outline">Edit</Button>
            </Link>
          )}
          <Link href="/dashboard">
            <Button variant="secondary">Back</Button>
          </Link>
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={deleteHabit.isPending}
          >
            {deleteHabit.isPending ? 'Deleting...' : 'Delete'}
          </Button>
        </div>
      </div>

      {/* Info Cards Grid */}
      <div className="grid gap-4 md:grid-cols-3">
        {/* Details Card */}
        <div className="rounded-xl border border-slate-200 bg-white p-6">
          <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-slate-500">
            About
          </h3>
          <p className="text-slate-700">{habit.description}</p>
        </div>

        {/* Start Date Card */}
        <div className="rounded-xl border border-slate-200 bg-white p-6">
          <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-slate-500">
            Started
          </h3>
          <p className="text-2xl font-bold text-slate-900">
            {new Date(habit.startDate).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
              year: 'numeric',
            })}
          </p>
          <p className="mt-2 text-xs text-slate-500">
            {Math.floor(
              (new Date().getTime() - new Date(habit.startDate).getTime()) / (1000 * 60 * 60 * 24)
            )}{' '}
            days ago
          </p>
        </div>

        {/* Status Card */}
        <div className="rounded-xl border border-slate-200 bg-white p-6">
          <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-slate-500">
            Status
          </h3>
          <div className="flex items-center justify-center">
            <span
              className={`rounded-full px-4 py-2 text-sm font-semibold uppercase tracking-wider ${
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
        </div>
      </div>

      {/* Streaks Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-xl border border-yellow-200 bg-yellow-50 p-6 text-center">
          <p className="text-4xl font-bold text-yellow-900">{habit.currentStreak}</p>
          <p className="mt-2 text-sm font-medium text-yellow-700">🔥 Current Streak</p>
          <p className="mt-1 text-xs text-yellow-600">consecutive days</p>
        </div>
        <div className="rounded-xl border border-purple-200 bg-purple-50 p-6 text-center">
          <p className="text-4xl font-bold text-purple-900">{habit.bestStreak}</p>
          <p className="mt-2 text-sm font-medium text-purple-700">⭐ Best Streak</p>
          <p className="mt-1 text-xs text-purple-600">personal record</p>
        </div>
        <div className="rounded-xl border border-cyan-200 bg-cyan-50 p-6 text-center">
          <p className="text-4xl font-bold text-cyan-900">{habit.checkInCount}</p>
          <p className="mt-2 text-sm font-medium text-cyan-700">📊 Total Check-Ins</p>
          <p className="mt-1 text-xs text-cyan-600">all time</p>
        </div>
      </div>

      {canCheckIn ? (
        <Button
          size="lg"
          onClick={handleCheckIn}
          disabled={checkIn.isPending || alreadyCheckedInToday || checkInsLoading}
          className="w-full"
        >
          {checkIn.isPending ? 'Checking in...' : checkInsLoading ? 'Loading...' : alreadyCheckedInToday ? 'Already checked in today' : 'Check In'}
        </Button>
      ) : (
        <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
          {habit.status === 'PAUSED'
            ? 'This habit is paused — resume it to check in.'
            : 'This habit is archived and read-only — check-ins are disabled.'}
        </div>
      )}

      {checkIn.isError && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50">
          <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-lg">
            <h2 className="mb-4 text-lg font-semibold text-slate-900">Warning</h2>
            <p className="mb-6 text-slate-700">{checkIn.error?.message ?? 'Already checked in today'}</p>
            <button
              onClick={() => checkIn.reset()}
              className="w-full rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
            >
              OK
            </button>
          </div>
        </div>
      )}

      {cancelCheckIn.isError && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50">
          <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-lg">
            <h2 className="mb-4 text-lg font-semibold text-slate-900">Error</h2>
            <p className="mb-6 text-slate-700">{cancelCheckIn.error?.message ?? 'Failed to cancel check-in'}</p>
            <button
              onClick={() => cancelCheckIn.reset()}
              className="w-full rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
            >
              OK
            </button>
          </div>
        </div>
      )}

      {showCommentDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-lg">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-900">Add Check-In Note</h2>
              <button
                onClick={() => {
                  setShowCommentDialog(false);
                  setComment('');
                }}
                className="text-slate-400 hover:text-slate-600"
                aria-label="Close"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Optional: Add a note about today's check-in..."
              maxLength={500}
              className="mb-4 w-full rounded-md border border-slate-300 p-3 focus:border-blue-500 focus:outline-none"
              rows={4}
            />
            <p className="mb-4 text-xs text-slate-500">{comment.length}/500</p>
            <div className="flex gap-2">
              <button
                onClick={() => {
                  setShowCommentDialog(false);
                  setComment('');
                }}
                className="flex-1 rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                onClick={() => handleConfirmCheckIn(comment)}
                disabled={checkIn.isPending}
                className="flex-1 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
              >
                {checkIn.isPending ? 'Checking in...' : 'Check In'}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="rounded-lg border border-slate-200 bg-white p-6">
        <h2 className="mb-4 text-lg font-semibold text-slate-900">Check-In History</h2>
        {checkIns && checkIns.length > 0 ? (
          <div className="space-y-3">
            {checkIns.map((ci) => {
              const isDeleting =
                cancelCheckIn.isPending && cancelCheckIn.variables?.checkInId === ci.id;
              return (
                <div
                  key={ci.id}
                  className="border-b border-slate-100 pb-3 last:border-0"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-slate-600">
                      {new Date(ci.checkInDate).toLocaleDateString()}
                    </span>
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-medium text-green-600">✓</span>
                      <button
                        type="button"
                        onClick={() => handleCancelCheckIn(ci.id)}
                        disabled={isDeleting || isArchived}
                        aria-label="Cancel check-in"
                        className="text-slate-400 transition-colors hover:text-red-600 disabled:pointer-events-none disabled:opacity-50"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                  {ci.comment && (
                    <p className="mt-2 text-sm text-slate-600 italic">
                      "{ci.comment}"
                    </p>
                  )}
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

