import { expect, test as base, type Page } from '@playwright/test';
import path from 'node:path';

/** A walked loop of 5.4 km with heights and timestamps. */
const THUMSEE_LOOP = path.join(import.meta.dirname, '../fixtures/thumsee-loop.gpx');

/**
 * `test`, with the network shut. A request that leaves the machine is
 * dropped, and fails the test that made it: the suites run on the sketch
 * map, and nothing in them has a reason to reach a service.
 */
export const test = base.extend<{ shutNetwork: undefined }>({
	shutNetwork: [
		async ({ context }, use) => {
			const strays: string[] = [];
			await context.route(
				(url) => url.hostname !== 'localhost',
				(route) => {
					strays.push(route.request().url());
					return route.abort();
				}
			);
			await use(undefined);
			expect(strays, 'A suite never reaches the network.').toEqual([]);
		},
		{ auto: true }
	]
});

export { expect };

/** Imports a GPX file through the button, as a visitor would, and lands on its trail. */
export async function importGpx(page: Page, file: string = THUMSEE_LOOP): Promise<void> {
	const chooser = page.waitForEvent('filechooser');
	await page.getByRole('button', { name: 'Import GPX' }).click();
	await (await chooser).setFiles(file);
}

/** Opens the library with the Thumsee Loop already in it, on that trail's screen. */
export async function openThumseeLoop(page: Page): Promise<void> {
	await page.goto('/');
	await importGpx(page);
	await expect(page.getByRole('heading', { name: 'Thumsee Loop' })).toBeVisible();
}
