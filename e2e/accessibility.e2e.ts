//
// Every screen, audited by axe. The audit finds what a rule can: missing
// names, bad roles, contrast. What it cannot judge, such as whether a name
// is the right one, the other suites assert by finding controls by role
// and name.
//

import AxeBuilder from '@axe-core/playwright';
import type { Page } from '@playwright/test';
import { expect, openThumseeLoop, test } from './support/app.ts';
import { tapMap } from './support/map.ts';

async function violations(page: Page): Promise<string[]> {
	const { violations: found } = await new AxeBuilder({ page }).analyze();
	return found.map(({ id, nodes }) => `${id}: ${nodes.map((node) => node.html).join(' ')}`);
}

test.describe('accessibility', () => {
	test('the empty library', async ({ page }) => {
		await page.goto('/');
		await expect(page.getByText('No Trails Yet')).toBeVisible();

		expect(await violations(page)).toEqual([]);
	});

	test('the library with a trail in it', async ({ page }) => {
		await openThumseeLoop(page);
		await page.getByRole('link', { name: 'Trails' }).click();
		await expect(page.getByRole('link', { name: /^Thumsee Loop/ })).toBeVisible();

		expect(await violations(page)).toEqual([]);
	});

	test('a trail', async ({ page }) => {
		await openThumseeLoop(page);

		expect(await violations(page)).toEqual([]);
	});

	test('a trail being deleted', async ({ page }) => {
		await openThumseeLoop(page);
		await page.getByRole('button', { name: 'Delete' }).click();
		await expect(page.getByRole('dialog')).toBeVisible();

		expect(await violations(page)).toEqual([]);
	});

	test('the planner, empty and with stops', async ({ page }) => {
		await page.goto('/plan');
		await expect(page.getByRole('heading', { name: 'Plan a Trail' })).toBeVisible();

		expect(await violations(page)).toEqual([]);

		await tapMap(page, 0.3, 0.5);
		await tapMap(page, 0.7, 0.5);
		await expect(page.getByRole('listitem')).toHaveCount(2);

		expect(await violations(page)).toEqual([]);
	});

	test('a trail the library does not have', async ({ page }) => {
		await page.goto('/trails/never-added');
		await expect(page.getByRole('heading', { name: 'Trail Not Found' })).toBeVisible();

		expect(await violations(page)).toEqual([]);
	});
});
