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
    <div className="mx-auto max-w-2xl space-y-8 px-4 py-8">
      <div className="bg-gradient-to-r from-amber-900 via-amber-800 to-green-900 rounded-2xl p-8 border-2 border-amber-700">
        <h1 className="text-4xl font-bold text-amber-300 mb-2" style={{fontFamily: 'Georgia, serif', textShadow: '2px 2px 4px rgba(0,0,0,0.5)'}}>⚔️ Begin a New Quest</h1>
        <p className="text-amber-200 text-sm italic">Choose a meaningful habit and embark on your journey</p>
      </div>
      <HabitForm onSubmit={handleSubmit} isLoading={createHabit.isPending} />
    </div>
  );
}
