import { expect, test } from './support/app.ts';

test.describe('the layout', () => {
	test('puts the panel beside the map in a wide window', async ({ page }, testInfo) => {
		test.skip(testInfo.project.name !== 'desktop', 'A phone is not a wide window.');
		await page.goto('/');

		await expect(page.getByRole('main')).toHaveAttribute('data-layout', 'sidePanel');
		await expect(page.getByRole('button', { name: 'Resize panel' })).toHaveCount(0);
	});

	test('puts a sheet over the map on a phone, which steps through its detents', async ({
		page
	}, testInfo) => {
		test.skip(testInfo.project.name !== 'phone', 'A wide window has no sheet.');
		await page.goto('/');
		const sheet = page.getByRole('main');
		const grabber = page.getByRole('button', { name: 'Resize panel' });
		const height = async () => (await sheet.boundingBox())?.height ?? 0;
		await expect(sheet).toHaveAttribute('data-layout', 'bottomSheet');
		const medium = await height();

		await grabber.click();
		await expect.poll(height).toBeGreaterThan(medium);

		await grabber.click();
		await expect.poll(height).toBeLessThan(medium);

		await grabber.click();
		await expect.poll(height).toBe(medium);
	});

	test('keeps the screen through a window resized from a panel to a sheet', async ({
		page
	}, testInfo) => {
		test.skip(testInfo.project.name !== 'desktop', 'A phone does not resize its window.');
		await page.goto('/plan');
		await page.getByRole('textbox', { name: 'Name' }).fill('Typed Before the Resize');

		await page.setViewportSize({ width: 500, height: 800 });

		await expect(page.getByRole('main')).toHaveAttribute('data-layout', 'bottomSheet');
		await expect(page.getByRole('textbox', { name: 'Name' })).toHaveValue(
			'Typed Before the Resize'
		);
	});
});
