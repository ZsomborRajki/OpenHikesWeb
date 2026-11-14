import { readFile, writeFile } from 'node:fs/promises';
import { expect, importGpx, openThumseeLoop, test } from './support/app.ts';
import { highlight, lines } from './support/map.ts';

test.describe('the library', () => {
	test('starts empty, and says how to begin', async ({ page }) => {
		await page.goto('/');

		await expect(page.getByRole('heading', { name: 'Trails', exact: true })).toBeVisible();
		await expect(page.getByText('Plan a trail on the map, or import a GPX file.')).toBeVisible();
	});

	test('imports a GPX file and shows what the trail adds up to', async ({ page }) => {
		await openThumseeLoop(page);

		await expect(page.getByText('Imported trail')).toBeVisible();
		await expect(page.getByRole('term')).toHaveText([
			'Distance',
			'Ascent',
			'Descent',
			'Highest Point',
			'Duration'
		]);
		await expect(page.getByRole('definition')).toHaveText([
			'5.4 km',
			'202 m',
			'202 m',
			'721 m',
			'2 hr'
		]);
		await expect(lines(page, 'primary')).toHaveCount(1);
	});

	test('lists an imported trail, and keeps it for the next visit', async ({ page }) => {
		await openThumseeLoop(page);

		await page.reload();
		await page.getByRole('link', { name: 'Trails' }).click();

		await expect(
			page.getByRole('link', { name: /^Thumsee Loop\s+5\.4 km · 202 m ascent$/ })
		).toBeVisible();
		await expect(lines(page, 'faded')).toHaveCount(1);
	});

	test('says so when a file is not a GPX file', async ({ page }, testInfo) => {
		const notes = testInfo.outputPath('notes.gpx');
		await writeFile(notes, 'a walk in the hills');
		await page.goto('/');

		await importGpx(page, notes);

		await expect(page.getByRole('alert')).toHaveText('That file is not a GPX file.');
		await expect(page.getByRole('heading', { name: 'Trails', exact: true })).toBeVisible();
	});

	test('reads out the height under a scrub, and marks the place on the map', async ({ page }) => {
		await openThumseeLoop(page);
		const chart = page.getByRole('slider', { name: 'Position along the trail' });
		await expect(highlight(page)).toBeHidden();

		await chart.focus();
		await chart.press('End');

		await expect(chart).toHaveAttribute('aria-valuetext', '5.4 km · 528 m');
		await expect(highlight(page)).toBeVisible();

		await chart.blur();

		await expect(highlight(page)).toBeHidden();
	});

	test('exports a trail as a GPX file', async ({ page }) => {
		await openThumseeLoop(page);

		const downloading = page.waitForEvent('download');
		await page.getByRole('button', { name: 'Export GPX' }).click();
		const download = await downloading;

		expect(download.suggestedFilename()).toBe('Thumsee Loop.gpx');
		const contents = await readFile(await download.path(), 'utf8');
		expect(contents).toContain('creator="OpenHikes Web"');
		expect(contents.match(/<trkpt /g)).toHaveLength(49);
	});

	test('deletes a trail only once it is confirmed', async ({ page }) => {
		await openThumseeLoop(page);
		const confirmation = page.getByRole('dialog', { name: 'Delete “Thumsee Loop”?' });

		await page.getByRole('button', { name: 'Delete' }).click();
		await confirmation.getByRole('button', { name: 'Cancel' }).click();
		await expect(confirmation).toBeHidden();
		await expect(page.getByRole('heading', { name: 'Thumsee Loop' })).toBeVisible();

		await page.getByRole('button', { name: 'Delete' }).click();
		await confirmation.getByRole('button', { name: 'Delete' }).click();

		await expect(page.getByText('No Trails Yet')).toBeVisible();
		await expect(lines(page, 'faded')).toHaveCount(0);
	});

	test('says so when a link leads to a trail the library does not have', async ({ page }) => {
		await page.goto('/trails/never-added');

		await expect(page.getByRole('heading', { name: 'Trail Not Found' })).toBeVisible();

		await page.getByRole('link', { name: 'Trails' }).click();

		await expect(page.getByRole('heading', { name: 'Trails', exact: true })).toBeVisible();
	});
});
