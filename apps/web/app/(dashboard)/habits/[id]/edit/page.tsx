'use client';

import { use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useHabit } from '@/hooks/useHabits';
import { useUpdateHabit } from '@/hooks/useCreateHabit';
import { HabitForm } from '@/components/habits/HabitForm';
import { Button } from '@/components/ui/button';

export default function EditHabitPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { data: habit, isLoading } = useHabit(id);
  const updateHabit = useUpdateHabit();

  async function handleSubmit(data: any) {
    await updateHabit.mutateAsync({ id, data });
    router.push(`/habits/${id}`);
  }

  if (isLoading)
    return (
      <div className="mx-auto max-w-2xl px-4 py-8">
        <div className="flex items-center justify-center rounded-xl border-2 border-amber-700 bg-gradient-to-br from-amber-900 to-amber-950 p-12 shadow-lg">
          <div className="text-center">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-amber-400 border-t-transparent mb-4"></div>
            <p className="text-amber-300 font-semibold">Loading quest details...</p>
          </div>
        </div>
      </div>
    );
  if (!habit)
    return (
      <div className="mx-auto max-w-2xl px-4 py-8">
        <div className="rounded-xl border-2 border-amber-700 bg-gradient-to-br from-amber-900 to-amber-950 p-8 text-center shadow-lg">
          <p className="text-2xl mb-3">🔍</p>
          <p className="text-xl font-bold text-amber-300">Quest not found</p>
          <Link href="/habits">
            <Button className="mt-6 bg-amber-700 hover:bg-amber-600 text-amber-50 font-bold border-2 border-amber-600">
              🏰 Return to Habits
            </Button>
          </Link>
        </div>
      </div>
    );

  if (habit.status === 'ARCHIVED') {
    return (
      <div className="mx-auto max-w-2xl space-y-6 px-4 py-8">
        <h1 className="text-3xl font-bold text-amber-400" style={{fontFamily: 'Georgia, serif', textShadow: '2px 2px 4px rgba(0,0,0,0.5)'}}>📜 Edit Quest</h1>
        <div className="rounded-xl border-2 border-gray-700 bg-gradient-to-br from-gray-800 to-gray-900 p-6 shadow-lg">
          <p className="text-gray-300">This quest is sealed and read-only. It cannot be edited.</p>
          <Link href={`/habits/${id}`}>
            <Button className="mt-4 bg-amber-700 hover:bg-amber-600 text-amber-50 font-bold border-2 border-amber-600">
              🏰 Return Home
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-8 px-4 py-8">
      <div className="bg-gradient-to-r from-amber-900 via-amber-800 to-green-900 rounded-2xl p-8 border-2 border-amber-700">
        <h1 className="text-4xl font-bold text-amber-300 mb-2" style={{fontFamily: 'Georgia, serif', textShadow: '2px 2px 4px rgba(0,0,0,0.5)'}}>📜 Edit Quest</h1>
        <p className="text-amber-200 text-sm italic">Refine the details of your quest</p>
      </div>
      <HabitForm
        initialData={habit}
        onSubmit={handleSubmit}
        isLoading={updateHabit.isPending}
      />
    </div>
  );
}
