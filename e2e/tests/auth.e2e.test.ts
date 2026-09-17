import { test, expect } from '@playwright/test';

test.describe('End-to-End: Authentication Flow', () => {
  const baseUrl = 'http://localhost:3000';

  test('should redirect unauthenticated user to login page', async ({ page }) => {
    await page.goto(`${baseUrl}/habits`);
    await page.waitForURL('**/login', { timeout: 5000 });

    expect(page.url()).toContain('/login');
    expect(await page.isVisible('text=Sign in')).toBeTruthy();
  });

  test('should display login options with Google and GitHub', async ({ page }) => {
    await page.goto(`${baseUrl}/login`);

    expect(await page.isVisible('text=Google')).toBeTruthy();
    expect(await page.isVisible('text=GitHub')).toBeTruthy();
  });

  test('should navigate to login page when accessing protected route', async ({ page }) => {
    await page.goto(`${baseUrl}/habits/new`);
    await page.waitForURL('**/login', { timeout: 5000 });

    expect(page.url()).toContain('/login');
  });

  test('should display sign in heading on login page', async ({ page }) => {
    await page.goto(`${baseUrl}/login`);

    // Wait for page to fully load
    await page.waitForLoadState('networkidle');

    expect(await page.isVisible('text=Sign in')).toBeTruthy();
  });
});

test.describe('Session Management', () => {
  test('should maintain login page accessibility', async ({ page }) => {
    await page.goto('http://localhost:3000/login');

    await page.waitForLoadState('networkidle');
    expect(await page.isVisible('text=Sign in')).toBeTruthy();
  });

  test('should redirect dashboard access without session', async ({ page }) => {
    await page.goto('http://localhost:3000/habits');
    await page.waitForURL('**/login', { timeout: 5000 });

    expect(page.url()).toContain('/login');
  });
});
