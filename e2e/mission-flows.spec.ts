import { expect, test, type Page } from '@playwright/test';

const BALANCED_DESIGN = [
  'Solar Array',
  'Kilopower Reactor',
  'Battery Bank',
  'O₂ Generator',
  'Water Recycler',
  'Greenhouse',
  'Regolith Shield',
  'Storm Shelter',
  'Habitat / Crew Quarters',
];

async function configureMission(page: Page) {
  await page.goto('/');
  await page.getByTestId('start-mission').click();
  await page.getByRole('button', { name: 'mars', exact: false }).click();
  await page.getByLabel('Include interactive 90-second briefing').uncheck();
  await page.getByTestId('continue-selection').click();
}

async function deployBalancedDesign(page: Page) {
  for (const moduleName of BALANCED_DESIGN) {
    await page.getByRole('button', { name: `Deploy ${moduleName}` }).click();
  }
  await page.getByTestId('start-operations').click();
}

async function advanceUntilMissionReport(page: Page, timeoutMs = 60_000) {
  const deadline = Date.now() + timeoutMs;
  const reportHeading = page.getByRole('heading', {
    name: /Mission debrief|Outpost sustained/,
  });
  while (Date.now() < deadline) {
    if (await reportHeading.isVisible()) return;

    const shelter = page.getByRole('button', { name: 'Order shelter' });
    if (await shelter.isVisible()) await shelter.click();

    const repair = page.getByRole('button', { name: /^Repair / }).first();
    if (await repair.isVisible()) await repair.click();

    const resume = page.getByRole('button', { name: 'Resume simulation' });
    if (await resume.isVisible()) await resume.click();

    await page.waitForTimeout(80);
  }
  throw new Error('Mission did not reach a debrief or success report before the timeout.');
}

test('a balanced Mars Cadet design survives the 30-day mission', async ({ page }) => {
  await configureMission(page);
  await deployBalancedDesign(page);
  await page.getByRole('button', { name: '5x', exact: true }).click();

  await advanceUntilMissionReport(page);

  await expect(page.getByRole('heading', { name: 'Outpost sustained' })).toBeVisible();
  await expect(page.getByText('Mission complete')).toBeVisible();
  await expect(page.locator('header')).toContainText('DAY 30 / 30');
});

test('the demo failure shows a causal debrief and can be retried', async ({ page }) => {
  await page.goto('/?demo=1');

  await expect(page.getByRole('heading', { name: 'Mission debrief' })).toBeVisible({
    timeout: 60_000,
  });
  await expect(page.getByRole('heading', { name: 'Root cause timeline' })).toBeVisible();
  await expect(page.locator('ol li').first()).toContainText(/Day \d+ ·/);
  await expect(page.getByText(/depleted|failure|critical/i).first()).toBeVisible();

  await page.getByRole('button', { name: 'Retry mission' }).click();
  await expect(page.getByRole('heading', { name: 'Build your outpost' })).toBeVisible();
});

test('a share link deterministically replays the failed mission and cause chain', async ({
  page,
  context,
}) => {
  await page.goto('/?demo=1');
  await expect(page.getByRole('heading', { name: 'Mission debrief' })).toBeVisible({
    timeout: 60_000,
  });
  const originalDay = await page.locator('header').innerText();
  const originalChain = await page.locator('ol').innerText();

  await page.getByRole('button', { name: 'Share replay' }).click();
  const replayUrl = await page.getByLabel('Replay link').inputValue();
  expect(replayUrl).toContain('?share=');

  const replayPage = await context.newPage();
  await replayPage.goto(replayUrl);
  await advanceUntilMissionReport(replayPage);

  await expect(replayPage.getByRole('heading', { name: 'Mission debrief' })).toBeVisible();
  await expect(replayPage.locator('header')).toContainText(originalDay.match(/DAY\s+\d+\s*\/\s*30/i)?.[0] ?? 'DAY');
  const replayChain = await replayPage.locator('ol').innerText();
  expect(replayChain.replace(/\s+/gu, ' ').trim()).toBe(
    originalChain.replace(/\s+/gu, ' ').trim(),
  );
});
