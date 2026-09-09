'use client';

import { useRouter } from 'next/navigation';
import { useHabit } from '@/hooks/useHabits';
import { useUpdateHabit } from '@/hooks/useCreateHabit';
import { HabitForm } from '@/components/habits/HabitForm';

export default function EditHabitPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const { data: habit, isLoading } = useHabit(params.id);
  const updateHabit = useUpdateHabit();

  async function handleSubmit(data: any) {
    await updateHabit.mutateAsync({ id: params.id, data });
    router.push(`/habits/${params.id}`);
  }

  if (isLoading) return <p className="px-4 py-8 text-slate-600">Loading...</p>;
  if (!habit) return <p className="px-4 py-8 text-slate-600">Habit not found</p>;

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
