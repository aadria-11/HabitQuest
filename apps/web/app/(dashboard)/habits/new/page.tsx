'use client';

import { useRouter } from 'next/navigation';
import { HabitForm } from '@/components/habits/HabitForm';
import { useCreateHabit } from '@/hooks/useCreateHabit';

export default function CreateHabitPage() {
  const router = useRouter();
  const createHabit = useCreateHabit();

  async function handleSubmit(data: any) {
    await createHabit.mutateAsync(data);
    router.push('/dashboard');
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6 px-4 py-8">
      <h1 className="text-3xl font-bold text-slate-900">Create New Habit</h1>
      <HabitForm onSubmit={handleSubmit} isLoading={createHabit.isPending} />
    </div>
  );
}
