const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.createContext({
    viewport: { width: 320, height: 1200 },
    deviceScaleFactor: 1,
  });
  const page = await context.newPage();

  try {
    // Navigate to dashboard
    await page.goto('http://localhost:3000/dashboard', { waitUntil: 'networkidle' });

    // Wait for habits to load
    await page.waitForTimeout(2000);

    // Take screenshot
    await page.screenshot({ path: '/tmp/responsive-320px.png' });
    console.log('Screenshot saved to /tmp/responsive-320px.png');

    // Check for layout issues
    const title = await page.textContent('h1');
    console.log('Page title:', title);

    // Check grid items are visible
    const cards = await page.locator('[href*="/habits/"]').count();
    console.log('Habit cards visible:', cards);

  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await browser.close();
  }
})();
