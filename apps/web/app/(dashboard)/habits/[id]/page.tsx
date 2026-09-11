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
          <h1 className="text-3xl font-bold text-amber-400" style={{fontFamily: 'Georgia, serif', textShadow: '2px 2px 4px rgba(0,0,0,0.5)'}}>{habit.name}</h1>
          {isArchived && (
            <span className="rounded-lg bg-gradient-to-r from-gray-700 to-gray-800 px-3 py-1 text-xs font-bold text-gray-200 border border-gray-600 uppercase tracking-wider">
              Quest Sealed
            </span>
          )}
        </div>
        <div className="flex gap-2">
          {!isArchived && (
            <Link href={`/habits/${id}/edit`}>
              <Button className="bg-amber-700 hover:bg-amber-600 text-amber-50 font-bold border-2 border-amber-600">
                📜 Edit Quest
              </Button>
            </Link>
          )}
          <Link href="/dashboard">
            <Button className="bg-amber-900 hover:bg-amber-800 text-amber-200 font-bold border-2 border-amber-700">
              🏰 Return Home
            </Button>
          </Link>
          <Button
            onClick={handleDelete}
            disabled={deleteHabit.isPending}
            className="bg-red-900 hover:bg-red-800 text-red-100 font-bold border-2 border-red-700"
          >
            {deleteHabit.isPending ? '⏳ Destroying...' : '🔥 Destroy Quest'}
          </Button>
        </div>
      </div>

      {/* Info Cards Grid */}
      <div className="grid gap-4 md:grid-cols-3">
        {/* Details Card */}
        <div className="rounded-xl border-2 border-amber-700 bg-gradient-to-br from-amber-900 to-amber-950 p-6 shadow-lg">
          <h3 className="mb-3 text-sm font-bold uppercase tracking-widest text-amber-400">
            📖 Quest Details
          </h3>
          <p className="text-amber-100">{habit.description}</p>
        </div>

        {/* Start Date Card */}
        <div className="rounded-xl border-2 border-amber-700 bg-gradient-to-br from-amber-900 to-amber-950 p-6 shadow-lg">
          <h3 className="mb-3 text-sm font-bold uppercase tracking-widest text-amber-400">
            ⏰ Quest Began
          </h3>
          <p className="text-2xl font-bold text-amber-300" style={{fontFamily: 'Georgia, serif'}}>
            {new Date(habit.startDate).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
              year: 'numeric',
            })}
          </p>
          <p className="mt-2 text-xs text-amber-300">
            {Math.floor(
              (new Date().getTime() - new Date(habit.startDate).getTime()) / (1000 * 60 * 60 * 24)
            )}{' '}
            days of service
          </p>
        </div>

        {/* Status Card */}
        <div className="rounded-xl border-2 border-amber-700 bg-gradient-to-br from-amber-900 to-amber-950 p-6 shadow-lg">
          <h3 className="mb-3 text-sm font-bold uppercase tracking-widest text-amber-400">
            ⚔️ Quest Status
          </h3>
          <div className="flex items-center justify-center">
            <span
              className={`rounded-lg px-4 py-2 text-sm font-bold uppercase tracking-wider border-2 ${
                habit.status === 'ACTIVE'
                  ? 'bg-green-900 text-green-200 border-green-700'
                  : habit.status === 'PAUSED'
                    ? 'bg-yellow-900 text-yellow-200 border-yellow-700'
                    : 'bg-gray-800 text-gray-300 border-gray-700'
              }`}
            >
              {habit.status === 'ACTIVE'
                ? '🟢 Active'
                : habit.status === 'PAUSED'
                  ? '⏸️ Paused'
                  : '🔒 Sealed'}
            </span>
          </div>
        </div>
      </div>

      {/* Streaks Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-xl border-2 border-yellow-700 bg-gradient-to-br from-yellow-900 to-yellow-950 p-6 text-center shadow-lg">
          <p className="text-5xl font-bold text-yellow-300" style={{fontFamily: 'Georgia, serif'}}>{habit.currentStreak}</p>
          <p className="mt-2 text-sm font-bold text-yellow-200">🔥 STREAK OF FIRE</p>
          <p className="mt-1 text-xs text-yellow-300">consecutive victories</p>
        </div>
        <div className="rounded-xl border-2 border-amber-600 bg-gradient-to-br from-amber-800 to-amber-900 p-6 text-center shadow-lg">
          <p className="text-5xl font-bold text-amber-300" style={{fontFamily: 'Georgia, serif'}}>{habit.bestStreak}</p>
          <p className="mt-2 text-sm font-bold text-amber-200">👑 LEGENDARY RECORD</p>
          <p className="mt-1 text-xs text-amber-300">greatest achievement</p>
        </div>
        <div className="rounded-xl border-2 border-cyan-700 bg-gradient-to-br from-cyan-900 to-cyan-950 p-6 text-center shadow-lg">
          <p className="text-5xl font-bold text-cyan-300" style={{fontFamily: 'Georgia, serif'}}>{habit.checkInCount}</p>
          <p className="mt-2 text-sm font-bold text-cyan-200">⚔️ BATTLES WON</p>
          <p className="mt-1 text-xs text-cyan-300">total victories</p>
        </div>
      </div>

      {canCheckIn ? (
        <Button
          size="lg"
          onClick={handleCheckIn}
          disabled={checkIn.isPending || alreadyCheckedInToday || checkInsLoading}
          className="w-full bg-gradient-to-r from-green-700 to-green-800 hover:from-green-600 hover:to-green-700 text-green-50 font-bold border-2 border-green-600 text-lg"
        >
          {checkIn.isPending ? '⏳ Completing Quest...' : checkInsLoading ? 'Loading...' : alreadyCheckedInToday ? '✓ Quest Completed Today!' : '⚔️ Complete Today\'s Quest'}
        </Button>
      ) : (
        <div className="rounded-lg border-2 border-gray-700 bg-gradient-to-r from-gray-800 to-gray-900 px-4 py-3 text-sm text-gray-300 font-semibold">
          {habit.status === 'PAUSED'
            ? 'This habit is paused — resume it to check in.'
            : 'This habit is archived and read-only — check-ins are disabled.'}
        </div>
      )}

      {checkIn.isError && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/75">
          <div className="w-full max-w-md rounded-xl bg-gradient-to-b from-amber-900 to-amber-950 p-6 shadow-2xl border-2 border-amber-700">
            <h2 className="mb-4 text-lg font-bold text-amber-300">⚠️ Quest Warning</h2>
            <p className="mb-6 text-amber-100">{checkIn.error?.message ?? 'Already completed today'}</p>
            <button
              onClick={() => checkIn.reset()}
              className="w-full rounded-lg bg-amber-700 hover:bg-amber-600 px-4 py-2 text-sm font-bold text-amber-50 border border-amber-600 transition-all"
            >
              Understood
            </button>
          </div>
        </div>
      )}

      {cancelCheckIn.isError && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/75">
          <div className="w-full max-w-md rounded-xl bg-gradient-to-b from-red-900 to-red-950 p-6 shadow-2xl border-2 border-red-700">
            <h2 className="mb-4 text-lg font-bold text-red-300">🔥 Error in Battle</h2>
            <p className="mb-6 text-red-100">{cancelCheckIn.error?.message ?? 'Failed to cancel victory'}</p>
            <button
              onClick={() => cancelCheckIn.reset()}
              className="w-full rounded-lg bg-red-700 hover:bg-red-600 px-4 py-2 text-sm font-bold text-red-50 border border-red-600 transition-all"
            >
              Understood
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

      <div className="rounded-xl border-2 border-amber-700 bg-gradient-to-br from-amber-900 to-amber-950 p-6 shadow-lg">
        <h2 className="mb-4 text-lg font-bold text-amber-400 uppercase tracking-widest">📜 Battle Records</h2>
        {checkIns && checkIns.length > 0 ? (
          <div className="space-y-3">
            {checkIns.map((ci) => {
              const isDeleting =
                cancelCheckIn.isPending && cancelCheckIn.variables?.checkInId === ci.id;
              return (
                <div
                  key={ci.id}
                  className="border-b border-amber-700 pb-3 last:border-0 bg-amber-950/50 p-3 rounded-lg"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-amber-300 font-medium">
                      ⚔️ {new Date(ci.checkInDate).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                    </span>
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-bold text-green-400">✓ Victory</span>
                      <button
                        type="button"
                        onClick={() => handleCancelCheckIn(ci.id)}
                        disabled={isDeleting || isArchived}
                        aria-label="Erase this victory"
                        className="text-amber-400 transition-colors hover:text-red-400 disabled:pointer-events-none disabled:opacity-50"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                  {ci.comment && (
                    <p className="mt-2 text-sm text-amber-200 italic border-l-2 border-amber-600 pl-2">
                      &quot;{ci.comment}&quot;
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-amber-300 italic">No battles recorded yet. Begin your quest today!</p>
        )}
      </div>
    </div>
  );
}

