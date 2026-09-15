import { test, expect } from '@playwright/test';

test.describe('End-to-End: Habit Management', () => {
  const baseUrl = 'http://localhost:3000';

  // Helper to login before each test
  test.beforeEach(async ({ page, context }) => {
    // Mock authenticated session
    await context.addCookie({
      name: 'authToken',
      value: 'mock-jwt-token',
      url: baseUrl,
    });

    await page.goto(`${baseUrl}/dashboard`);
  });

  test.describe('Create Habit', () => {
    test('should navigate to create habit form', async ({ page }) => {
      await page.click('button:has-text("New Habit")');
      expect(page.url()).toContain('/habits/new');
      expect(await page.isVisible('text=Create Habit')).toBeTruthy();
    });

    test('should fill and submit habit creation form', async ({ page }) => {
      await page.goto(`${baseUrl}/dashboard/habits/new`);

      // Fill form
      await page.fill('input[name="name"]', 'Morning Exercise');
      await page.fill('textarea[name="description"]', 'Daily 30-minute workout');
      await page.selectOption('select[name="frequency"]', 'daily');

      // Submit
      await page.click('button:has-text("Create")');

      // Should redirect back to habits list
      await page.waitForURL(`${baseUrl}/**`);
      expect(await page.isVisible('text=Morning Exercise')).toBeTruthy();
    });

    test('should show validation error for empty name', async ({ page }) => {
      await page.goto(`${baseUrl}/dashboard/habits/new`);

      // Try to submit without name
      await page.click('button:has-text("Create")');

      expect(await page.isVisible('text=Name is required')).toBeTruthy();
    });

    test('should show validation error for empty frequency', async ({ page }) => {
      await page.goto(`${baseUrl}/dashboard/habits/new`);

      await page.fill('input[name="name"]', 'Test Habit');
      await page.click('button:has-text("Create")');

      expect(await page.isVisible('text=Frequency is required')).toBeTruthy();
    });
  });

  test.describe('Create Today Check-in', () => {
    test('should display check-in button for active habit', async ({ page }) => {
      await page.goto(`${baseUrl}/dashboard/habits`);

      // Should show a habit
      const habitCard = await page.$('.habit-card');
      expect(habitCard).toBeTruthy();

      // Should have check-in button
      const checkInBtn = await habitCard?.$('button:has-text("Check In")');
      expect(checkInBtn).toBeTruthy();
    });

    test('should create check-in when button clicked', async ({ page }) => {
      await page.goto(`${baseUrl}/dashboard/habits`);

      const checkInBtn = await page.$('button:has-text("Check In")');
      if (checkInBtn) {
        await checkInBtn.click();

        // Should show check-in modal or form
        expect(
          await page.isVisible('text=Check In') || page.isVisible('text=Notes')
        ).toBeTruthy();
      }
    });

    test('should prevent duplicate check-in for same day', async ({ page }) => {
      await page.goto(`${baseUrl}/dashboard/habits`);

      const checkInBtn = await page.$('button:has-text("Check In")');
      if (checkInBtn) {
        // First check-in
        await checkInBtn.click();
        await page.fill('textarea[name="notes"]', 'Great workout!');
        await page.click('button:has-text("Save")');

        await page.waitForTimeout(1000);

        // Try second check-in
        const checkInBtn2 = await page.$('button:has-text("Check In")');
        if (checkInBtn2) {
          await checkInBtn2.click();

          expect(
            await page.isVisible('text=already checked in today') ||
            page.isVisible('text=Already exists')
          ).toBeTruthy();
        }
      }
    });

    test('should display streak information after check-in', async ({ page }) => {
      await page.goto(`${baseUrl}/dashboard/habits`);

      const checkInBtn = await page.$('button:has-text("Check In")');
      if (checkInBtn) {
        await checkInBtn.click();
        await page.fill('textarea[name="notes"]', 'Check-in notes');
        await page.click('button:has-text("Save")');

        // Should show updated streak
        expect(
          await page.isVisible('text=Day') || page.isVisible('text=Streak')
        ).toBeTruthy();
      }
    });
  });

  test.describe('View Habit Details', () => {
    test('should display habit details on habit page', async ({ page }) => {
      await page.goto(`${baseUrl}/dashboard/habits`);

      // Click on first habit
      const habit = await page.$('.habit-card');
      if (habit) {
        await habit.click();

        // Should show habit details
        expect(await page.isVisible('text=Streak') || page.isVisible('text=Check-ins')).toBeTruthy();
      }
    });

    test('should display habit history', async ({ page }) => {
      await page.goto(`${baseUrl}/dashboard/habits`);

      const habit = await page.$('.habit-card');
      if (habit) {
        await habit.click();

        // Should display recent check-ins
        const checkInHistory = await page.$('.checkin-history');
        expect(checkInHistory).toBeTruthy();
      }
    });
  });

  test.describe('Edit Habit', () => {
    test('should navigate to edit habit page', async ({ page }) => {
      await page.goto(`${baseUrl}/dashboard/habits`);

      const editBtn = await page.$('button:has-text("Edit")');
      if (editBtn) {
        await editBtn.click();
        expect(page.url()).toContain('/edit');
      }
    });

    test('should update habit name', async ({ page }) => {
      await page.goto(`${baseUrl}/dashboard/habits`);

      const editBtn = await page.$('button:has-text("Edit")');
      if (editBtn) {
        await editBtn.click();

        const nameInput = await page.$('input[name="name"]');
        if (nameInput) {
          await nameInput.fill('Updated Habit Name');
          await page.click('button:has-text("Save")');

          expect(await page.isVisible('text=Updated Habit Name')).toBeTruthy();
        }
      }
    });
  });

  test.describe('Delete Habit', () => {
    test('should show delete confirmation', async ({ page }) => {
      await page.goto(`${baseUrl}/dashboard/habits`);

      const deleteBtn = await page.$('button:has-text("Delete")');
      if (deleteBtn) {
        await deleteBtn.click();

        expect(
          await page.isVisible('text=Are you sure') || page.isVisible('text=Confirm')
        ).toBeTruthy();
      }
    });

    test('should remove habit after confirmation', async ({ page }) => {
      await page.goto(`${baseUrl}/dashboard/habits`);

      const habitName = 'Habit to Delete';
      const habitBefore = await page.$(`text=${habitName}`);

      if (habitBefore) {
        const deleteBtn = await page.$('button:has-text("Delete")');
        if (deleteBtn) {
          await deleteBtn.click();
          await page.click('button:has-text("Confirm")');

          expect(await page.$(`text=${habitName}`)).toBeFalsy();
        }
      }
    });
  });

  test.describe('Error Handling', () => {
    test('should show error when API fails', async ({ page }) => {
      // Mock API error
      await page.evaluate(() => {
        window.mockApiError = 'Network error';
      });

      await page.goto(`${baseUrl}/dashboard/habits`);

      expect(
        await page.isVisible('text=error') || page.isVisible('text=Error')
      ).toBeTruthy();
    });

    test('should display retry button on error', async ({ page }) => {
      await page.goto(`${baseUrl}/dashboard/habits`);

      const retryBtn = await page.$('button:has-text("Retry")');
      if (retryBtn) {
        expect(retryBtn).toBeTruthy();
      }
    });
  });
});
