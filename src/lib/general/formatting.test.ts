import { describe, expect, it } from 'vitest';
import { formatCoordinate, formatDistance, formatDuration, formatElevation } from './formatting.ts';

const LOCALE = 'en-US';

describe('formatting', () => {
	it.each([
		[0, '0 m'],
		[849.6, '850 m'],
		[999.6, '1 km'],
		[1000, '1 km'],
		[12_345, '12.3 km'],
		[123_456, '123 km']
	])('writes %d meters of distance as %s', (meters, expected) => {
		expect(formatDistance(meters, LOCALE)).toBe(expected);
	});

	it('writes a height in whole meters, grouped as the locale groups', () => {
		expect(formatElevation(1240.4, LOCALE)).toBe('1,240 m');
		expect(formatElevation(1240.4, 'de-DE')).toBe('1.240 m');
	});

	it.each([
		[2700, '45 min'],
		[7500, '2 hr 5 min'],
		[7200, '2 hr'],
		[29, '0 min']
	])('writes %d seconds as %s', (seconds, expected) => {
		expect(formatDuration(seconds, LOCALE)).toBe(expected);
	});

	it('writes a coordinate as latitude then longitude', () => {
		expect(formatCoordinate({ latitude: 47.55214, longitude: 11.87436 })).toBe('47.5521, 11.8744');
		expect(formatCoordinate({ latitude: -33.8568, longitude: -70.6483 })).toBe(
			'-33.8568, -70.6483'
		);
	});
});
