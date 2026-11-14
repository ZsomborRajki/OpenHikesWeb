//
// The one suite that needs Apple: it runs the real MapKit JS adapter, with
// the token in `.env.local`, over the network. `npm run test:e2e:live` runs
// it. CI does not, and nothing here is asserted about what Apple draws.
//

import { expect, test } from '@playwright/test';

test.describe('Apple Maps', () => {
	test('starts, and turns a tap into a stop', async ({ page }) => {
		const refusals: string[] = [];
		page.on('console', (message) => {
			if (message.type() === 'error') refusals.push(message.text());
		});
		await page.goto('/plan');
		const map = page.getByRole('region', { name: 'Map' });

		await expect(map.locator('canvas').first()).toBeVisible({ timeout: 30_000 });
		await expect(map.getByRole('alert')).toHaveCount(0);

		// MapKit holds a tap for a moment, in case it is the first of two.
		await expect(async () => {
			const window = page.viewportSize();
			await page.mouse.click((window?.width ?? 0) * 0.75, (window?.height ?? 0) * 0.3);
			await expect(page.getByRole('listitem')).not.toHaveCount(0, { timeout: 2000 });
		}).toPass({ timeout: 30_000 });
		expect(refusals).toEqual([]);
	});
});
