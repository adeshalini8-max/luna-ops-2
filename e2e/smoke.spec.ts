import { test, expect } from '@playwright/test';

test('loads the homepage and displays title', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveTitle(/Outpost Zero/i);
});
