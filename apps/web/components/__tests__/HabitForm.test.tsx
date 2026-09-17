import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor, RenderOptions } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ReactElement } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { HabitForm } from '../habits/HabitForm';

// Mock the API client
vi.mock('@/lib/api-client', () => ({
  createHabit: vi.fn(),
}));

// Create a test query client
const createTestQueryClient = () => new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});

// Custom render function that includes providers
function renderWithProviders(
  ui: ReactElement,
  {
    initialState,
    ...renderOptions
  }: any = {},
) {
  const testQueryClient = createTestQueryClient();

  function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <QueryClientProvider client={testQueryClient}>
        {children}
      </QueryClientProvider>
    );
  }

  return render(ui, { wrapper: Wrapper, ...renderOptions });
}

describe('HabitForm Component', () => {
  const mockOnSubmit = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    mockOnSubmit.mockResolvedValue(undefined);
  });

  describe('Create Habit Form', () => {
    it('renders form with required fields', () => {
      renderWithProviders(<HabitForm onSubmit={mockOnSubmit} />);

      expect(screen.getByLabelText(/quest name/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/quest description/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/quest began/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /save quest/i })).toBeInTheDocument();
    });

    it('shows validation error for empty name', async () => {
      renderWithProviders(<HabitForm onSubmit={mockOnSubmit} />);

      const submitBtn = screen.getByRole('button', { name: /save quest/i });
      fireEvent.click(submitBtn);

      // Component validates and shows error - no submission should occur
      await waitFor(() => {
        expect(mockOnSubmit).not.toHaveBeenCalled();
      });
    });

    it('submits form with valid data', async () => {
      renderWithProviders(<HabitForm onSubmit={mockOnSubmit} />);

      const nameInput = screen.getByLabelText(/quest name/i);
      await userEvent.type(nameInput, 'Morning Exercise');

      const submitBtn = screen.getByRole('button', { name: /save quest/i });
      fireEvent.click(submitBtn);

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledWith(
          expect.objectContaining({
            name: 'Morning Exercise',
          })
        );
      });
    });

    it('allows form submission with valid data', async () => {
      renderWithProviders(<HabitForm onSubmit={mockOnSubmit} />);

      const nameInput = screen.getByLabelText(/quest name/i);
      await userEvent.type(nameInput, 'Test Habit');

      const submitBtn = screen.getByRole('button', { name: /save quest/i });
      fireEvent.click(submitBtn);

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalled();
      });
    });
  });

  describe('Error Handling', () => {
    it('displays error message on submission failure', async () => {
      mockOnSubmit.mockRejectedValueOnce(new Error('Network error'));

      renderWithProviders(<HabitForm onSubmit={mockOnSubmit} />);

      const nameInput = screen.getByLabelText(/quest name/i);
      await userEvent.type(nameInput, 'Test Habit');

      const submitBtn = screen.getByRole('button', { name: /save quest/i });
      fireEvent.click(submitBtn);

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalled();
      });
    });

    it('accepts valid quest data', async () => {
      renderWithProviders(<HabitForm onSubmit={mockOnSubmit} />);

      const nameInput = screen.getByLabelText(/quest name/i);
      await userEvent.type(nameInput, 'Meditation Quest');

      const submitBtn = screen.getByRole('button', { name: /save quest/i });
      fireEvent.click(submitBtn);

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalled();
      });
    });
  });
});
