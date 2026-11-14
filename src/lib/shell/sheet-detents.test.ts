import { describe, expect, it } from 'vitest';
import { detentHeight, nearestDetent, nextDetent } from './sheet-detents.ts';

const WINDOW_HEIGHT = 852;

describe('sheet detents', () => {
	it.each([
		['compact', 104],
		['medium', 383],
		['large', 796]
	] as const)('rests at %s, %d pixels high', (detent, height) => {
		expect(detentHeight(detent, WINDOW_HEIGHT)).toBe(height);
	});

	it('never rests lower than its compact height, however short the window', () => {
		expect(detentHeight('medium', 120)).toBe(104);
		expect(detentHeight('large', 120)).toBe(104);
	});

	it.each([
		[50, 'compact'],
		[240, 'compact'],
		[250, 'medium'],
		[580, 'medium'],
		[600, 'large'],
		[2000, 'large']
	] as const)('settles a sheet let go at %d pixels to %s', (height, detent) => {
		expect(nearestDetent(height, WINDOW_HEIGHT)).toBe(detent);
	});

	it('steps up through the detents and back to the bottom', () => {
		expect(nextDetent('compact')).toBe('medium');
		expect(nextDetent('medium')).toBe('large');
		expect(nextDetent('large')).toBe('compact');
	});
});
