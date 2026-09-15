import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { HabitForm } from '../habits/HabitForm';

// Mock the API client
vi.mock('@/lib/api', () => ({
  createHabit: vi.fn(),
}));

describe('HabitForm Component', () => {
  const mockOnSuccess = vi.fn();
  const mockOnError = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Create Habit Form', () => {
    it('renders form with required fields', () => {
      render(<HabitForm onSuccess={mockOnSuccess} />);

      expect(screen.getByLabelText(/habit name/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/description/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/frequency/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /create/i })).toBeInTheDocument();
    });

    it('shows validation error for empty name', async () => {
      render(<HabitForm onSuccess={mockOnSuccess} />);

      const submitBtn = screen.getByRole('button', { name: /create/i });
      fireEvent.click(submitBtn);

      await waitFor(() => {
        expect(screen.getByText(/name is required/i)).toBeInTheDocument();
      });
    });

    it('shows validation error for invalid frequency', async () => {
      render(<HabitForm onSuccess={mockOnSuccess} />);

      const nameInput = screen.getByLabelText(/habit name/i);
      await userEvent.type(nameInput, 'Test Habit');

      const frequencySelect = screen.getByLabelText(/frequency/i);
      fireEvent.change(frequencySelect, { target: { value: '' } });

      const submitBtn = screen.getByRole('button', { name: /create/i });
      fireEvent.click(submitBtn);

      await waitFor(() => {
        expect(screen.getByText(/frequency is required/i)).toBeInTheDocument();
      });
    });

    it('submits form with valid data', async () => {
      const { createHabit } = await import('@/lib/api');
      (createHabit as any).mockResolvedValue({ id: 'habit-1', name: 'Test' });

      render(<HabitForm onSuccess={mockOnSuccess} />);

      const nameInput = screen.getByLabelText(/habit name/i);
      await userEvent.type(nameInput, 'Morning Exercise');

      const descInput = screen.getByLabelText(/description/i);
      await userEvent.type(descInput, 'Daily workout');

      const frequencySelect = screen.getByLabelText(/frequency/i);
      fireEvent.change(frequencySelect, { target: { value: 'daily' } });

      const submitBtn = screen.getByRole('button', { name: /create/i });
      fireEvent.click(submitBtn);

      await waitFor(() => {
        expect(createHabit).toHaveBeenCalledWith({
          name: 'Morning Exercise',
          description: 'Daily workout',
          frequency: 'daily',
        });
        expect(mockOnSuccess).toHaveBeenCalled();
      });
    });
  });

  describe('Error Handling', () => {
    it('displays error message on submission failure', async () => {
      const { createHabit } = await import('@/lib/api');
      (createHabit as any).mockRejectedValue(new Error('Network error'));

      render(<HabitForm onSuccess={mockOnSuccess} />);

      const nameInput = screen.getByLabelText(/habit name/i);
      await userEvent.type(nameInput, 'Test Habit');

      const frequencySelect = screen.getByLabelText(/frequency/i);
      fireEvent.change(frequencySelect, { target: { value: 'daily' } });

      const submitBtn = screen.getByRole('button', { name: /create/i });
      fireEvent.click(submitBtn);

      await waitFor(() => {
        expect(screen.getByText(/error creating habit/i)).toBeInTheDocument();
      });
    });

    it('shows validation errors for duplicate habit name (409)', async () => {
      const { createHabit } = await import('@/lib/api');
      const error = new Error('Habit already exists');
      (error as any).status = 409;
      (createHabit as any).mockRejectedValue(error);

      render(<HabitForm onSuccess={mockOnSuccess} />);

      const nameInput = screen.getByLabelText(/habit name/i);
      await userEvent.type(nameInput, 'Existing Habit');

      const frequencySelect = screen.getByLabelText(/frequency/i);
      fireEvent.change(frequencySelect, { target: { value: 'daily' } });

      const submitBtn = screen.getByRole('button', { name: /create/i });
      fireEvent.click(submitBtn);

      await waitFor(() => {
        expect(screen.getByText(/already exists/i)).toBeInTheDocument();
      });
    });
  });
});
