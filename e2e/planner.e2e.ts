import type { Page } from '@playwright/test';
import { expect, test } from './support/app.ts';
import { lines, pins, tapMap } from './support/map.ts';

const stops = (page: Page) => page.getByRole('listitem');
const saveButton = (page: Page) => page.getByRole('button', { name: 'Save Trail' });

/** Opens the planner and places three stops across the map, west to east. */
async function drawThreeStops(page: Page): Promise<void> {
	await page.goto('/plan');
	await tapMap(page, 0.2, 0.6);
	await tapMap(page, 0.5, 0.3);
	await tapMap(page, 0.8, 0.6);
	await expect(stops(page)).toHaveCount(3);
}

test.describe('the planner', () => {
	test('starts with nothing drawn, and says what a tap does', async ({ page }) => {
		await page.goto('/plan');

		await expect(page.getByRole('heading', { name: 'Plan a Trail' })).toBeVisible();
		await expect(page.getByText('Tap or click the map to add a stop.')).toBeVisible();
		await expect(saveButton(page)).toBeDisabled();
	});

	test('adds a stop for each tap on the map, and draws the line through them', async ({ page }) => {
		await drawThreeStops(page);

		await expect(pins(page)).toHaveCount(3);
		await expect(lines(page, 'primary')).toHaveCount(1);
		await expect(page.getByText(/^[\d.,]+ km · about .+ on foot$/)).toBeVisible();
	});

	test('needs two stops before there is a trail to save', async ({ page }) => {
		await page.goto('/plan');

		await tapMap(page, 0.3, 0.5);
		await expect(page.getByText('Add another stop to make a trail.')).toBeVisible();
		await expect(saveButton(page)).toBeDisabled();

		await tapMap(page, 0.7, 0.5);
		await expect(saveButton(page)).toBeEnabled();
	});

	test('moves a stop along the trail', async ({ page }) => {
		await drawThreeStops(page);
		const lastPosition = await stops(page).nth(2).locator('.position').innerText();

		await page.getByRole('button', { name: 'Move Stop 3 earlier' }).click();

		await expect(stops(page).nth(1).locator('.position')).toHaveText(lastPosition);
		await expect(page.getByRole('button', { name: 'Move Stop 1 earlier' })).toBeDisabled();
		await expect(page.getByRole('button', { name: 'Move Stop 3 later' })).toBeDisabled();
	});

	test('removes a stop', async ({ page }) => {
		await drawThreeStops(page);

		await page.getByRole('button', { name: 'Remove Stop 2' }).click();

		await expect(stops(page)).toHaveCount(2);
		await expect(pins(page)).toHaveCount(2);
	});

	test('saves the trail to the library, with its stops on the map', async ({ page }) => {
		await drawThreeStops(page);
		await page.getByRole('textbox', { name: 'Name' }).fill('Hochstaufen Traverse');

		await saveButton(page).click();

		await expect(page.getByRole('heading', { name: 'Hochstaufen Traverse' })).toBeVisible();
		await expect(page.getByText('Planned trail · 3 stops')).toBeVisible();
		await expect(pins(page)).toHaveCount(3);

		await page.getByRole('link', { name: 'Trails' }).click();
		await expect(page.getByRole('link', { name: /^Hochstaufen Traverse/ })).toBeVisible();
	});

	test('starts a new drawing once a trail is saved', async ({ page }) => {
		await drawThreeStops(page);
		await saveButton(page).click();
		await expect(page.getByRole('heading', { name: 'New Trail' })).toBeVisible();

		await page.goto('/plan');

		await expect(page.getByText('Tap or click the map to add a stop.')).toBeVisible();
		await expect(page.getByRole('textbox', { name: 'Name' })).toHaveValue('');
	});

	test('keeps a drawing through a reload', async ({ page }) => {
		await drawThreeStops(page);
		await page.getByRole('textbox', { name: 'Name' }).fill('Half Drawn');

		await page.reload();

		await expect(page.getByRole('textbox', { name: 'Name' })).toHaveValue('Half Drawn');
		await expect(stops(page)).toHaveCount(3);
		await expect(pins(page)).toHaveCount(3);
	});

	test('clears a drawing', async ({ page }) => {
		await drawThreeStops(page);

		await page.getByRole('button', { name: 'Clear' }).click();

		await expect(stops(page)).toHaveCount(0);
		await expect(pins(page)).toHaveCount(0);
		await expect(lines(page, 'primary')).toHaveCount(0);
	});
});
