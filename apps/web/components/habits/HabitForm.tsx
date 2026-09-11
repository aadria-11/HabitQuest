'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { CreateHabitSchema } from '@shared/schemas';
import { Habit, HabitStatus } from '@shared/types';

interface HabitFormProps {
  initialData?: Habit;
  onSubmit: (data: any) => Promise<void>;
  isLoading?: boolean;
}

export function HabitForm({ initialData, onSubmit, isLoading }: HabitFormProps) {
  const [formData, setFormData] = useState<{
    name: string;
    description: string;
    startDate: string;
    status: HabitStatus;
  }>({
    name: initialData?.name || '',
    description: initialData?.description || '',
    startDate: initialData?.startDate
      ? new Date(initialData.startDate).toISOString().split('T')[0]
      : new Date().toISOString().split('T')[0],
    status: (initialData?.status || 'ACTIVE') as HabitStatus,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErrors({});

    try {
      const parsed = CreateHabitSchema.safeParse(formData);
      if (!parsed.success) {
        const newErrors: Record<string, string> = {};
        parsed.error.errors.forEach((err) => {
          if (err.path[0]) {
            newErrors[err.path[0] as string] = err.message;
          }
        });
        setErrors(newErrors);
        return;
      }

      await onSubmit(parsed.data);
    } catch (error) {
      setErrors({ submit: error instanceof Error ? error.message : 'Unknown error' });
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 rounded-xl border-2 border-amber-700 bg-gradient-to-br from-amber-900 to-amber-950 p-6 shadow-lg">
      <div>
        <label htmlFor="name" className="block text-sm font-bold text-amber-300 uppercase tracking-wider">
          Quest Name
        </label>
        <input
          id="name"
          type="text"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          className="mt-2 block w-full rounded-lg border-2 border-amber-700 bg-amber-950 px-3 py-2 text-amber-100 focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-400"
          required
        />
        {errors.name && <p className="mt-1 text-sm text-red-400 font-semibold">{errors.name}</p>}
      </div>

      <div>
        <label htmlFor="description" className="block text-sm font-bold text-amber-300 uppercase tracking-wider">
          Quest Description
        </label>
        <textarea
          id="description"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          className="mt-2 block w-full rounded-lg border-2 border-amber-700 bg-amber-950 px-3 py-2 text-amber-100 focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-400"
          rows={3}
        />
        {errors.description && <p className="mt-1 text-sm text-red-400 font-semibold">{errors.description}</p>}
      </div>

      <div>
        <label htmlFor="startDate" className="block text-sm font-bold text-amber-300 uppercase tracking-wider">
          Quest Began
        </label>
        <input
          id="startDate"
          type="date"
          value={formData.startDate}
          onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
          className="mt-2 block w-full rounded-lg border-2 border-amber-700 bg-amber-950 px-3 py-2 text-amber-100 focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-400"
          required
        />
        {errors.startDate && <p className="mt-1 text-sm text-red-400 font-semibold">{errors.startDate}</p>}
      </div>

      <div>
        <label htmlFor="status" className="block text-sm font-bold text-amber-300 uppercase tracking-wider">
          Quest Status
        </label>
        <select
          id="status"
          value={formData.status}
          onChange={(e) => setFormData({ ...formData, status: e.target.value as HabitStatus })}
          className="mt-2 block w-full rounded-lg border-2 border-amber-700 bg-amber-950 px-3 py-2 text-amber-100 focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-400"
        >
          <option value="ACTIVE">🟢 Active</option>
          <option value="PAUSED">⏸️ Paused</option>
          <option value="ARCHIVED">🔒 Sealed</option>
        </select>
      </div>

      {errors.submit && <p className="text-sm text-red-400 font-semibold">{errors.submit}</p>}

      <Button type="submit" disabled={isLoading} className="w-full bg-gradient-to-r from-amber-700 to-amber-800 hover:from-amber-600 hover:to-amber-700 text-amber-50 font-bold border-2 border-amber-600 text-lg">
        {isLoading ? '⏳ Saving Quest...' : '💾 Save Quest'}
      </Button>
    </form>
  );
}
