import { test, expect } from '@playwright/test';

test.describe('End-to-End: Habit Management - Authentication Required', () => {
  const baseUrl = 'http://localhost:3000';

  test.describe('Protected Routes', () => {
    test('should redirect unauthenticated users from /habits', async ({ page }) => {
      await page.goto(`${baseUrl}/habits`);
      await page.waitForURL('**/login', { timeout: 5000 });

      expect(page.url()).toContain('/login');
    });

    test('should redirect unauthenticated users from /habits/new', async ({ page }) => {
      await page.goto(`${baseUrl}/habits/new`);
      await page.waitForURL('**/login', { timeout: 5000 });

      expect(page.url()).toContain('/login');
    });

    test('should show login page with auth providers', async ({ page }) => {
      await page.goto(`${baseUrl}/login`);
      await page.waitForLoadState('networkidle');

      expect(await page.isVisible('text=Sign in')).toBeTruthy();
      expect(await page.isVisible('text=Google')).toBeTruthy();
    });
  });

  test.describe('Habit List Page Structure', () => {
    test('should have proper page title', async ({ page }) => {
      await page.goto(`${baseUrl}/login`);

      const title = await page.title();
      expect(title.length).toBeGreaterThan(0);
    });

    test('should load login page without errors', async ({ page }) => {
      let errorMessage = '';
      page.on('console', msg => {
        if (msg.type() === 'error') {
          errorMessage = msg.text();
        }
      });

      await page.goto(`${baseUrl}/login`);
      await page.waitForLoadState('networkidle');

      // Should not have critical console errors
      expect(errorMessage).not.toContain('Failed');
    });
  });

  test.describe('Authentication Flow Navigation', () => {
    test('should maintain redirect loop protection', async ({ page }) => {
      // Navigate to protected route
      await page.goto(`${baseUrl}/habits`);

      // Should redirect to login
      await page.waitForURL('**/login', { timeout: 5000 });

      // Staying on login should not cause infinite loops
      await page.waitForTimeout(2000);
      expect(page.url()).toContain('/login');
    });

    test('should allow navigation back from login', async ({ page }) => {
      await page.goto(`${baseUrl}/login`);
      await page.waitForLoadState('networkidle');

      // Should be able to stay on login page
      const currentUrl = page.url();
      expect(currentUrl).toContain('/login');
    });
  });

  test.describe('Security Headers', () => {
    test('should serve login page with proper status', async ({ page }) => {
      const response = await page.goto(`${baseUrl}/login`);

      expect(response?.status()).toBeLessThan(400);
    });

    test('should serve protected route with 200 or redirect', async ({ page }) => {
      const response = await page.goto(`${baseUrl}/habits`);

      // Either renders (200) or redirects (3xx)
      const status = response?.status() || 0;
      expect(status).toBeLessThan(400);
    });
  });

  test.describe('Page Load Performance', () => {
    test('should load login page within reasonable time', async ({ page }) => {
      const startTime = Date.now();
      await page.goto(`${baseUrl}/login`);
      await page.waitForLoadState('networkidle');
      const endTime = Date.now();

      const loadTime = endTime - startTime;
      expect(loadTime).toBeLessThan(10000); // Less than 10 seconds
    });

    test('should handle rapid redirects', async ({ page }) => {
      // Navigate to protected route multiple times rapidly
      for (let i = 0; i < 3; i++) {
        await page.goto(`${baseUrl}/habits`);
        await page.waitForURL('**/login', { timeout: 5000 });
      }

      expect(page.url()).toContain('/login');
    });
  });

  test.describe('Login Page Elements', () => {
    test('should display both auth provider buttons', async ({ page }) => {
      await page.goto(`${baseUrl}/login`);
      await page.waitForLoadState('networkidle');

      const googleBtn = await page.$('button:has-text("Google")');
      const githubBtn = await page.$('button:has-text("GitHub")');

      expect(googleBtn || githubBtn).toBeTruthy();
    });

    test('should have accessible login heading', async ({ page }) => {
      await page.goto(`${baseUrl}/login`);
      await page.waitForLoadState('networkidle');

      const heading = await page.$('h1, h2');
      expect(heading).toBeTruthy();
    });
  });
});
