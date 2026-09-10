'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { CreateHabitSchema } from '@shared/schemas';
import { Habit } from '@shared/types';

interface HabitFormProps {
  initialData?: Habit;
  onSubmit: (data: any) => Promise<void>;
  isLoading?: boolean;
}

export function HabitForm({ initialData, onSubmit, isLoading }: HabitFormProps) {
  const [formData, setFormData] = useState({
    name: initialData?.name || '',
    description: initialData?.description || '',
    startDate: initialData?.startDate
      ? new Date(initialData.startDate).toISOString().split('T')[0]
      : new Date().toISOString().split('T')[0],
    status: initialData?.status || 'ACTIVE',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  async function handleSubmit(e: React.FormEvent) {
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
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="name" className="block text-sm font-medium">
          Name
        </label>
        <input
          id="name"
          type="text"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2"
          required
        />
        {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name}</p>}
      </div>

      <div>
        <label htmlFor="description" className="block text-sm font-medium">
          Description
        </label>
        <textarea
          id="description"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2"
          rows={3}
        />
        {errors.description && <p className="mt-1 text-sm text-red-600">{errors.description}</p>}
      </div>

      <div>
        <label htmlFor="startDate" className="block text-sm font-medium">
          Start Date
        </label>
        <input
          id="startDate"
          type="date"
          value={formData.startDate}
          onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
          className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2"
          required
        />
        {errors.startDate && <p className="mt-1 text-sm text-red-600">{errors.startDate}</p>}
      </div>

      <div>
        <label htmlFor="status" className="block text-sm font-medium">
          Status
        </label>
        <select
          id="status"
          value={formData.status}
          onChange={(e) => setFormData({ ...formData, status: e.target.value })}
          className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2"
        >
          <option value="ACTIVE">Active</option>
          <option value="PAUSED">Paused</option>
          <option value="ARCHIVED">Archived</option>
        </select>
      </div>

      {errors.submit && <p className="text-sm text-red-600">{errors.submit}</p>}

      <Button type="submit" disabled={isLoading}>
        {isLoading ? 'Saving...' : 'Save Habit'}
      </Button>
    </form>
  );
}
