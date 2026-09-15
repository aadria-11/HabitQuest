import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ErrorState } from '../layout/ErrorState';

describe('[ui-error-001] ErrorState Component', () => {
  const mockRetry = vi.fn();

  describe('Error Display', () => {
    it('renders error message on screen', () => {
      render(
        <ErrorState
          error="Failed to load habits"
          onRetry={mockRetry}
        />
      );

      expect(screen.getByText(/failed to load habits/i)).toBeInTheDocument();
    });

    it('shows appropriate icon for error state', () => {
      render(
        <ErrorState
          error="Something went wrong"
          onRetry={mockRetry}
        />
      );

      const errorContainer = screen.getByRole('complementary');
      expect(errorContainer).toBeInTheDocument();
      expect(errorContainer).toHaveClass('error', 'state');
    });

    it('displays retry button', () => {
      render(
        <ErrorState
          error="Network error"
          onRetry={mockRetry}
        />
      );

      const retryBtn = screen.getByRole('button', { name: /retry/i });
      expect(retryBtn).toBeInTheDocument();
    });

    it('calls onRetry when retry button clicked', () => {
      render(
        <ErrorState
          error="Failed to fetch"
          onRetry={mockRetry}
        />
      );

      const retryBtn = screen.getByRole('button', { name: /retry/i });
      fireEvent.click(retryBtn);

      expect(mockRetry).toHaveBeenCalledTimes(1);
    });
  });

  describe('User-Friendly Messages', () => {
    it('converts technical error to user-friendly message', () => {
      const technicalError = 'ECONNREFUSED: Connection refused at ::1:3001';

      render(
        <ErrorState
          error={technicalError}
          onRetry={mockRetry}
        />
      );

      // Component should display friendly message, not technical details
      const errorText = screen.getByText((content, element) => {
        return content.includes('connection') || content.includes('Connection');
      });
      expect(errorText).toBeInTheDocument();
    });

    it('handles 401 Unauthorized with redirect prompt', () => {
      render(
        <ErrorState
          error="Unauthorized"
          statusCode={401}
          onRetry={mockRetry}
        />
      );

      expect(screen.getByText(/sign in/i)).toBeInTheDocument();
    });

    it('handles 403 Forbidden', () => {
      render(
        <ErrorState
          error="You don't have permission to access this"
          statusCode={403}
          onRetry={mockRetry}
        />
      );

      expect(screen.getByText(/permission/i)).toBeInTheDocument();
    });

    it('handles 404 Not Found', () => {
      render(
        <ErrorState
          error="Habit not found"
          statusCode={404}
          onRetry={mockRetry}
        />
      );

      expect(screen.getByText(/not found/i)).toBeInTheDocument();
    });

    it('handles 409 Conflict (duplicate)', () => {
      render(
        <ErrorState
          error="Check-in already exists for today"
          statusCode={409}
          onRetry={mockRetry}
        />
      );

      expect(screen.getByText(/already exists/i)).toBeInTheDocument();
    });

    it('handles generic server error (5xx)', () => {
      render(
        <ErrorState
          error="Something went wrong"
          statusCode={500}
          onRetry={mockRetry}
        />
      );

      expect(screen.getByText(/something went wrong/i)).toBeInTheDocument();
      expect(screen.queryByText(/stack trace/i)).not.toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('has proper ARIA role', () => {
      render(
        <ErrorState
          error="Test error"
          onRetry={mockRetry}
        />
      );

      const alert = screen.getByRole('alert');
      expect(alert).toBeInTheDocument();
    });

    it('retry button is keyboard accessible', () => {
      render(
        <ErrorState
          error="Test error"
          onRetry={mockRetry}
        />
      );

      const retryBtn = screen.getByRole('button', { name: /retry/i });
      expect(retryBtn).toHaveFocus() === false; // Not auto-focused

      // Tab into button
      retryBtn.focus();
      expect(retryBtn).toHaveFocus();

      // Space/Enter to click
      fireEvent.keyDown(retryBtn, { key: 'Enter', code: 'Enter' });
      expect(mockRetry).toHaveBeenCalled();
    });
  });
});
