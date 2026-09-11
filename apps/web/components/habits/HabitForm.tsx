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
    <form onSubmit={handleSubmit} className="space-y-6 rounded-xl border-2 border-amber-700 bg-gradient-to-br from-amber-900 to-amber-950 p-8 shadow-lg">
      <div>
        <label htmlFor="name" className="block text-sm font-bold text-amber-300 uppercase tracking-widest mb-2">
          Quest Name <span className="text-red-400">*</span>
        </label>
        <input
          id="name"
          type="text"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          className={`block w-full rounded-lg border-2 bg-amber-950 px-4 py-3 text-amber-100 placeholder-amber-600 focus:outline-none focus:ring-2 transition-all ${
            errors.name ? 'border-red-500 focus:ring-red-400' : 'border-amber-700 focus:border-amber-500 focus:ring-amber-400'
          }`}
          placeholder="e.g., Morning Meditation"
          required
        />
        {errors.name && (
          <div className="mt-2 flex items-center gap-2 rounded-lg bg-red-900/30 p-2.5 border border-red-700">
            <span className="text-lg">⚠️</span>
            <p className="text-sm text-red-300 font-semibold">{errors.name}</p>
          </div>
        )}
      </div>

      <div>
        <label htmlFor="description" className="block text-sm font-bold text-amber-300 uppercase tracking-widest mb-2">
          Quest Description
        </label>
        <textarea
          id="description"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          className={`block w-full rounded-lg border-2 bg-amber-950 px-4 py-3 text-amber-100 placeholder-amber-600 focus:outline-none focus:ring-2 transition-all ${
            errors.description ? 'border-red-500 focus:ring-red-400' : 'border-amber-700 focus:border-amber-500 focus:ring-amber-400'
          }`}
          placeholder="Why is this habit important to you?"
          rows={3}
        />
        {errors.description && (
          <div className="mt-2 flex items-center gap-2 rounded-lg bg-red-900/30 p-2.5 border border-red-700">
            <span className="text-lg">⚠️</span>
            <p className="text-sm text-red-300 font-semibold">{errors.description}</p>
          </div>
        )}
      </div>

      <div>
        <label htmlFor="startDate" className="block text-sm font-bold text-amber-300 uppercase tracking-widest mb-2">
          Quest Began <span className="text-red-400">*</span>
        </label>
        <input
          id="startDate"
          type="date"
          value={formData.startDate}
          onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
          className={`block w-full rounded-lg border-2 bg-amber-950 px-4 py-3 text-amber-100 focus:outline-none focus:ring-2 transition-all ${
            errors.startDate ? 'border-red-500 focus:ring-red-400' : 'border-amber-700 focus:border-amber-500 focus:ring-amber-400'
          }`}
          required
        />
        {errors.startDate && (
          <div className="mt-2 flex items-center gap-2 rounded-lg bg-red-900/30 p-2.5 border border-red-700">
            <span className="text-lg">⚠️</span>
            <p className="text-sm text-red-300 font-semibold">{errors.startDate}</p>
          </div>
        )}
      </div>

      <div>
        <label htmlFor="status" className="block text-sm font-bold text-amber-300 uppercase tracking-widest mb-2">
          Quest Status
        </label>
        <select
          id="status"
          value={formData.status}
          onChange={(e) => setFormData({ ...formData, status: e.target.value as HabitStatus })}
          className="block w-full rounded-lg border-2 border-amber-700 bg-amber-950 px-4 py-3 text-amber-100 focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-400 transition-all hover:border-amber-600"
        >
          <option value="ACTIVE">🟢 Active</option>
          <option value="PAUSED">⏸️ Paused</option>
          <option value="ARCHIVED">🔒 Sealed</option>
        </select>
      </div>

      {errors.submit && (
        <div className="rounded-lg bg-red-900/40 p-4 border-2 border-red-700">
          <p className="text-sm text-red-300 font-semibold">❌ {errors.submit}</p>
        </div>
      )}

      <Button
        type="submit"
        disabled={isLoading}
        className="w-full bg-gradient-to-r from-amber-700 to-amber-800 hover:from-amber-600 hover:to-amber-700 text-amber-50 font-bold border-2 border-amber-600 text-lg py-3 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {isLoading ? '⏳ Saving Quest...' : '💾 Save Quest'}
      </Button>
    </form>
  );
}
