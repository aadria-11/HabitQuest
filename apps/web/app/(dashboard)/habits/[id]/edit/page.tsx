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

  if (isLoading) return <p className="px-4 py-8 text-amber-200">Loading...</p>;
  if (!habit) return <p className="px-4 py-8 text-amber-200">Habit not found</p>;

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
    <div className="mx-auto max-w-2xl space-y-6 px-4 py-8">
      <h1 className="text-3xl font-bold text-amber-400" style={{fontFamily: 'Georgia, serif', textShadow: '2px 2px 4px rgba(0,0,0,0.5)'}}>📜 Edit Quest</h1>
      <HabitForm
        initialData={habit}
        onSubmit={handleSubmit}
        isLoading={updateHabit.isPending}
      />
    </div>
  );
}
