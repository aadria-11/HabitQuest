import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import HabitForm from '@web/components/habits/HabitForm';

describe('HabitForm Component - Unit Tests', () => {
  const mockOnSubmit = vi.fn();

  beforeEach(() => {
    mockOnSubmit.mockClear();
  });

  describe('Form Rendering', () => {
    it('should render all form fields', () => {
      render(<HabitForm onSubmit={mockOnSubmit} />);

      expect(screen.getByLabelText(/name/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/description/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/start date/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/status/i)).toBeInTheDocument();
    });

    it('should render submit button', () => {
      render(<HabitForm onSubmit={mockOnSubmit} />);

      expect(screen.getByRole('button', { name: /create|save/i })).toBeInTheDocument();
    });

    it('should display form title', () => {
      render(<HabitForm onSubmit={mockOnSubmit} />);

      expect(screen.getByRole('heading', { name: /create|new habit/i })).toBeInTheDocument();
    });
  });

  describe('Form Validation', () => {
    it('should validate required fields', async () => {
      render(<HabitForm onSubmit={mockOnSubmit} />);

      const submitButton = screen.getByRole('button', { name: /create|save/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/name is required/i)).toBeInTheDocument();
      });
    });

    it('should require habit name', async () => {
      render(<HabitForm onSubmit={mockOnSubmit} />);

      const nameField = screen.getByLabelText(/name/i);
      await userEvent.type(nameField, '');

      const submitButton = screen.getByRole('button', { name: /create|save/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/name is required/i)).toBeInTheDocument();
      });
    });

    it('should require valid start date', async () => {
      render(<HabitForm onSubmit={mockOnSubmit} />);

      const nameField = screen.getByLabelText(/name/i);
      await userEvent.type(nameField, 'Test Habit');

      const dateField = screen.getByLabelText(/start date/i);
      await userEvent.type(dateField, 'invalid-date');

      const submitButton = screen.getByRole('button', { name: /create|save/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/invalid date/i)).toBeInTheDocument();
      });
    });

    it('should validate status is one of allowed values', async () => {
      render(<HabitForm onSubmit={mockOnSubmit} />);

      const statusSelect = screen.getByLabelText(/status/i);
      const options = statusSelect.querySelectorAll('option');

      const allowedStatuses = ['active', 'paused', 'archived'];
      options.forEach(option => {
        if (option.value) {
          expect(allowedStatuses).toContain(option.value);
        }
      });
    });

    it('should limit name length', async () => {
      render(<HabitForm onSubmit={mockOnSubmit} />);

      const nameField = screen.getByLabelText(/name/i) as HTMLInputElement;
      const longName = 'a'.repeat(256);

      await userEvent.type(nameField, longName);

      expect(nameField.maxLength).toBeLessThan(256);
    });
  });

  describe('Form Submission', () => {
    it('should call onSubmit with form data on successful submission', async () => {
      render(<HabitForm onSubmit={mockOnSubmit} />);

      const nameField = screen.getByLabelText(/name/i);
      const descriptionField = screen.getByLabelText(/description/i);
      const dateField = screen.getByLabelText(/start date/i);
      const statusField = screen.getByLabelText(/status/i);

      await userEvent.type(nameField, 'Morning Run');
      await userEvent.type(descriptionField, 'Run 5km daily');
      await userEvent.type(dateField, '2026-01-01');
      await userEvent.selectOptions(statusField, 'active');

      const submitButton = screen.getByRole('button', { name: /create|save/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledWith(
          expect.objectContaining({
            name: 'Morning Run',
            description: 'Run 5km daily',
            status: 'active',
          })
        );
      });
    });

    it('should disable submit button while submitting', async () => {
      mockOnSubmit.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)));

      render(<HabitForm onSubmit={mockOnSubmit} />);

      const nameField = screen.getByLabelText(/name/i);
      await userEvent.type(nameField, 'Test Habit');

      const submitButton = screen.getByRole('button', { name: /create|save/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(submitButton).toBeDisabled();
      });
    });

    it('should show error message on submission failure', async () => {
      mockOnSubmit.mockRejectedValue(new Error('Network error'));

      render(<HabitForm onSubmit={mockOnSubmit} />);

      const nameField = screen.getByLabelText(/name/i);
      await userEvent.type(nameField, 'Test Habit');

      const submitButton = screen.getByRole('button', { name: /create|save/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/network error|failed/i)).toBeInTheDocument();
      });
    });

    it('should clear form on successful submission', async () => {
      render(<HabitForm onSubmit={mockOnSubmit} />);

      const nameField = screen.getByLabelText(/name/i) as HTMLInputElement;
      await userEvent.type(nameField, 'Test Habit');

      const submitButton = screen.getByRole('button', { name: /create|save/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(nameField.value).toBe('');
      });
    });
  });

  describe('Edit Mode', () => {
    it('should populate form with existing habit data in edit mode', () => {
      const existingHabit = {
        id: '1',
        name: 'Morning Run',
        description: 'Run 5km daily',
        startDate: new Date('2026-01-01'),
        status: 'active',
      };

      render(<HabitForm onSubmit={mockOnSubmit} habit={existingHabit} />);

      expect((screen.getByLabelText(/name/i) as HTMLInputElement).value).toBe('Morning Run');
      expect((screen.getByLabelText(/description/i) as HTMLInputElement).value).toBe('Run 5km daily');
    });

    it('should change button text to Save in edit mode', () => {
      const existingHabit = {
        id: '1',
        name: 'Test',
        description: 'Test',
        startDate: new Date(),
        status: 'active',
      };

      render(<HabitForm onSubmit={mockOnSubmit} habit={existingHabit} />);

      expect(screen.getByRole('button', { name: /save/i })).toBeInTheDocument();
    });
  });

  describe('Status Selection', () => {
    it('should display status options', () => {
      render(<HabitForm onSubmit={mockOnSubmit} />);

      const statusSelect = screen.getByLabelText(/status/i);
      const options = Array.from((statusSelect as HTMLSelectElement).options).map(opt => opt.value);

      expect(options).toContain('active');
      expect(options).toContain('paused');
      expect(options).toContain('archived');
    });

    it('should allow status change', async () => {
      render(<HabitForm onSubmit={mockOnSubmit} />);

      const statusSelect = screen.getByLabelText(/status/i) as HTMLSelectElement;
      await userEvent.selectOptions(statusSelect, 'paused');

      expect(statusSelect.value).toBe('paused');
    });
  });

  describe('Date Input', () => {
    it('should accept valid date format', async () => {
      render(<HabitForm onSubmit={mockOnSubmit} />);

      const dateField = screen.getByLabelText(/start date/i) as HTMLInputElement;
      await userEvent.type(dateField, '2026-01-15');

      expect(dateField.value).toBe('2026-01-15');
    });

    it('should not allow future dates', async () => {
      render(<HabitForm onSubmit={mockOnSubmit} />);

      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const futureDate = tomorrow.toISOString().split('T')[0];

      const dateField = screen.getByLabelText(/start date/i);
      await userEvent.type(dateField, futureDate);

      const submitButton = screen.getByRole('button', { name: /create|save/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/cannot be in the future/i)).toBeInTheDocument();
      });
    });
  });

  describe('Accessibility', () => {
    it('should have proper label associations', () => {
      render(<HabitForm onSubmit={mockOnSubmit} />);

      expect(screen.getByLabelText(/name/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/description/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/start date/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/status/i)).toBeInTheDocument();
    });

    it('should have submit button accessible via keyboard', async () => {
      render(<HabitForm onSubmit={mockOnSubmit} />);

      const submitButton = screen.getByRole('button', { name: /create|save/i });
      submitButton.focus();

      expect(submitButton).toHaveFocus();
    });

    it('should support tab navigation', async () => {
      render(<HabitForm onSubmit={mockOnSubmit} />);

      const nameField = screen.getByLabelText(/name/i);
      nameField.focus();

      expect(nameField).toHaveFocus();
    });
  });
});
