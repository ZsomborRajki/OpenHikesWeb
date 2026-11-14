//
// The sketch map, as a test reads it and taps it. The one place the suites
// know how the stand-in map is built.
//

import type { Locator, Page } from '@playwright/test';

function map(page: Page): Locator {
	return page.getByRole('region', { name: 'Map' });
}

/** The numbered pins, in the order they were placed. */
export function pins(page: Page): Locator {
	return map(page).getByRole('img', { name: /^Stop \d+$/ });
}

/** The dot a scrub moves along the trail. */
export function highlight(page: Page): Locator {
	return map(page).getByRole('img', { name: 'Position on the trail' });
}

/** The lines drawn with `emphasis`. */
export function lines(page: Page, emphasis: 'primary' | 'faded'): Locator {
	return map(page).locator(`path.sketch-line-${emphasis}`);
}

/**
 * Taps the map `across` and `down` its uncovered part, each from 0 to 1, so
 * a test taps bare map whichever way the panel is laid out.
 */
export async function tapMap(page: Page, across: number, down: number): Promise<void> {
	const panel = page.getByRole('main');
	const [window, covered, layout] = [
		page.viewportSize(),
		await panel.boundingBox(),
		await panel.getAttribute('data-layout')
	];
	if (window === null || covered === null) throw new Error('The page has no panel to tap around.');

	const left = layout === 'sidePanel' ? covered.x + covered.width : 0;
	const bottom = layout === 'sidePanel' ? window.height : covered.y;
	await page.mouse.click(left + (window.width - left) * across, bottom * down);
}
