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

  if (isLoading) return <p className="px-4 py-8 text-slate-600">Loading...</p>;
  if (!habit) return <p className="px-4 py-8 text-slate-600">Habit not found</p>;

  if (habit.status === 'ARCHIVED') {
    return (
      <div className="mx-auto max-w-2xl space-y-6 px-4 py-8">
        <h1 className="text-3xl font-bold text-slate-900">Edit Habit</h1>
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-6">
          <p className="text-slate-600">This habit is archived and read-only. It cannot be edited.</p>
          <Link href={`/habits/${id}`}>
            <Button className="mt-4" variant="outline">
              Back to Habit
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6 px-4 py-8">
      <h1 className="text-3xl font-bold text-slate-900">Edit Habit</h1>
      <HabitForm
        initialData={habit}
        onSubmit={handleSubmit}
        isLoading={updateHabit.isPending}
      />
    </div>
  );
}
