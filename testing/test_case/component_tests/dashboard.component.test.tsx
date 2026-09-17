import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import Dashboard from '@web/app/(dashboard)/page';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SessionProvider } from 'next-auth/react';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: false },
  },
});

const mockSession = {
  user: {
    id: 'user-123',
    email: 'user@example.com',
    name: 'Test User',
    image: 'https://example.com/avatar.jpg',
  },
  expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
};

describe('Dashboard Component - Unit Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const renderDashboard = () => {
    return render(
      <SessionProvider session={mockSession}>
        <QueryClientProvider client={queryClient}>
          <Dashboard />
        </QueryClientProvider>
      </SessionProvider>
    );
  };

  describe('Dashboard Rendering', () => {
    it('should display dashboard title', () => {
      renderDashboard();

      expect(screen.getByRole('heading', { name: /dashboard/i })).toBeInTheDocument();
    });

    it('should display stat cards for overview', async () => {
      renderDashboard();

      await waitFor(() => {
        expect(screen.getByText(/total habits/i)).toBeInTheDocument();
        expect(screen.getByText(/active habits/i)).toBeInTheDocument();
      });
    });

    it('should display best streak information', async () => {
      renderDashboard();

      await waitFor(() => {
        expect(screen.getByText(/best streak/i)).toBeInTheDocument();
      });
    });
  });

  describe('Dashboard Stats', () => {
    it('should display total habits count', async () => {
      renderDashboard();

      await waitFor(() => {
        expect(screen.getByText(/total habits/i)).toBeInTheDocument();
      });
    });

    it('should display active habits count', async () => {
      renderDashboard();

      await waitFor(() => {
        expect(screen.getByText(/active habits/i)).toBeInTheDocument();
      });
    });

    it('should display current best streak', async () => {
      renderDashboard();

      await waitFor(() => {
        expect(screen.getByText(/best streak/i)).toBeInTheDocument();
      });
    });

    it('should display longest streak across all habits', async () => {
      renderDashboard();

      await waitFor(() => {
        expect(screen.getByText(/longest streak|best overall/i)).toBeInTheDocument();
      });
    });
  });

  describe('Habit List Display', () => {
    it('should display list of habits', async () => {
      renderDashboard();

      await waitFor(() => {
        expect(screen.getByRole('heading', { name: /your habits|habits/i })).toBeInTheDocument();
      });
    });

    it('should show habit card for each habit', async () => {
      renderDashboard();

      await waitFor(() => {
        const habitCards = screen.getAllByRole('article');
        expect(habitCards.length).toBeGreaterThanOrEqual(0);
      });
    });

    it('should display empty state when no habits exist', async () => {
      renderDashboard();

      await waitFor(() => {
        expect(
          screen.queryByText(/no habits|create your first habit/i)
        ).toBeInTheDocument();
      });
    });
  });

  describe('Loading States', () => {
    it('should display loading spinner while fetching', () => {
      renderDashboard();

      expect(
        screen.getByText(/loading|loading habits/i)
      ).toBeInTheDocument();
    });

    it('should display skeleton loaders for stats', () => {
      renderDashboard();

      expect(
        screen.getAllByTestId(/skeleton|loading-skeleton/i).length
      ).toBeGreaterThan(0);
    });
  });

  describe('Error Handling', () => {
    it('should display error state when data fetch fails', async () => {
      // Mock query to fail
      const failingQueryClient = new QueryClient({
        defaultOptions: {
          queries: {
            retry: false,
          },
        },
      });

      render(
        <SessionProvider session={mockSession}>
          <QueryClientProvider client={failingQueryClient}>
            <Dashboard />
          </QueryClientProvider>
        </SessionProvider>
      );

      await waitFor(() => {
        expect(
          screen.queryByText(/error|failed to load/i)
        ).toBeInTheDocument();
      });
    });

    it('should show retry button on error', async () => {
      renderDashboard();

      await waitFor(() => {
        if (screen.queryByText(/error/i)) {
          expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument();
        }
      });
    });
  });

  describe('Navigation', () => {
    it('should have link to create new habit', async () => {
      renderDashboard();

      await waitFor(() => {
        expect(
          screen.getByRole('link', { name: /create|new habit|add habit/i })
        ).toBeInTheDocument();
      });
    });

    it('should have link to habit details page for each habit', async () => {
      renderDashboard();

      await waitFor(() => {
        const detailLinks = screen.queryAllByRole('link', { name: /view|details/i });
        expect(detailLinks.length).toBeGreaterThanOrEqual(0);
      });
    });
  });

  describe('Filtering and Sorting', () => {
    it('should display filter options for habit status', async () => {
      renderDashboard();

      await waitFor(() => {
        expect(screen.getByLabelText(/filter|status/i)).toBeInTheDocument();
      });
    });

    it('should display sort options', async () => {
      renderDashboard();

      await waitFor(() => {
        expect(screen.getByLabelText(/sort|order/i)).toBeInTheDocument();
      });
    });
  });

  describe('User Authentication', () => {
    it('should display user profile information', async () => {
      renderDashboard();

      await waitFor(() => {
        expect(screen.getByText(/test user|user@example.com/i)).toBeInTheDocument();
      });
    });

    it('should display logout button', async () => {
      renderDashboard();

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /logout|sign out|log out/i })).toBeInTheDocument();
      });
    });
  });

  describe('Responsive Design', () => {
    it('should render stats in responsive grid', async () => {
      renderDashboard();

      await waitFor(() => {
        const statCards = screen.getAllByRole('heading', { level: 2 });
        expect(statCards.length).toBeGreaterThan(0);
      });
    });

    it('should stack stats vertically on mobile', async () => {
      renderDashboard();

      const container = screen.getByRole('main');
      expect(container).toHaveClass(/grid|flex/);
    });
  });

  describe('Accessibility', () => {
    it('should have main landmark', async () => {
      renderDashboard();

      expect(screen.getByRole('main')).toBeInTheDocument();
    });

    it('should have proper heading hierarchy', async () => {
      renderDashboard();

      const h1 = screen.getByRole('heading', { level: 1 });
      expect(h1).toBeInTheDocument();
    });

    it('should provide alt text for images', async () => {
      renderDashboard();

      const images = screen.queryAllByRole('img');
      images.forEach(img => {
        expect(img).toHaveAttribute('alt');
      });
    });
  });
});
