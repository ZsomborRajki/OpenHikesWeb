import { describe, expect, it } from 'vitest';
import { boundedTitle, MAXIMUM_TITLE_LENGTH, routePieces, stopLabel } from './trail.ts';

describe('trail', () => {
	it('trims a title', () => {
		expect(boundedTitle('  Thumsee Loop \n', 'Trail')).toBe('Thumsee Loop');
	});

	it('falls back when a title is blank', () => {
		expect(boundedTitle('   ', 'Trail')).toBe('Trail');
	});

	it('cuts a title at the limit', () => {
		const title = boundedTitle('x'.repeat(MAXIMUM_TITLE_LENGTH + 20), 'Trail');

		expect(title).toHaveLength(MAXIMUM_TITLE_LENGTH);
	});

	it('never cuts a title inside an emoji', () => {
		const family = '👨‍👩‍👧';

		const title = boundedTitle(family.repeat(MAXIMUM_TITLE_LENGTH + 1), 'Trail');

		expect(title).toBe(family.repeat(MAXIMUM_TITLE_LENGTH));
	});

	it('keeps an unbroken route as one piece', () => {
		const route = [
			{ latitude: 0, longitude: 0 },
			{ latitude: 0, longitude: 1 }
		];

		expect(routePieces(route)).toEqual([route]);
	});

	it('cuts a route where a segment starts', () => {
		const first = { latitude: 0, longitude: 0 };
		const second = { latitude: 0, longitude: 1 };
		const third = { latitude: 5, longitude: 5, startsSegment: true };
		const fourth = { latitude: 5, longitude: 6 };

		expect(routePieces([first, second, third, fourth])).toEqual([
			[first, second],
			[third, fourth]
		]);
	});

	it('opens no empty piece for a break on the first point', () => {
		const route = [
			{ latitude: 0, longitude: 0, startsSegment: true },
			{ latitude: 0, longitude: 1 }
		];

		expect(routePieces(route)).toEqual([route]);
	});

	it('has no pieces in an empty route', () => {
		expect(routePieces([])).toEqual([]);
	});

	it('numbers stops from one', () => {
		expect(stopLabel(0)).toBe('Stop 1');
		expect(stopLabel(11)).toBe('Stop 12');
	});
});
