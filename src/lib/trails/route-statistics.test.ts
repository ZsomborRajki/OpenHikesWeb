import { describe, expect, it } from 'vitest';
import { routeLengthMeters, routeStatistics } from './route-statistics.ts';
import { EQUATOR_ROUTE, HUNDREDTH_OF_A_DEGREE_METERS } from './trail.fixtures.ts';

describe('routeStatistics', () => {
	it('measures the length of the line', () => {
		expect(routeLengthMeters(EQUATOR_ROUTE)).toBeCloseTo(2 * HUNDREDTH_OF_A_DEGREE_METERS, 1);
	});

	it('gives the gap before a new segment no length', () => {
		const route = [
			{ latitude: 0, longitude: 0 },
			{ latitude: 0, longitude: 0.01 },
			{ latitude: 10, longitude: 10, startsSegment: true },
			{ latitude: 10, longitude: 10.01 }
		];

		const withoutTheGap = routeLengthMeters(route.slice(0, 2)) + routeLengthMeters(route.slice(2));

		expect(routeLengthMeters(route)).toBeCloseTo(withoutTheGap, 6);
	});

	it('counts the climb along the route', () => {
		const { elevation } = routeStatistics(EQUATOR_ROUTE);

		expect(elevation).toEqual({
			gainMeters: 100,
			lossMeters: 50,
			minimumMeters: 100,
			maximumMeters: 200
		});
	});

	it('counts no climb across a segment break', () => {
		const route = [
			{ latitude: 0, longitude: 0, elevation: 100 },
			{ latitude: 0, longitude: 0.01, elevation: 150 },
			{ latitude: 1, longitude: 1, elevation: 900, startsSegment: true },
			{ latitude: 1, longitude: 1.01, elevation: 920 }
		];

		expect(routeStatistics(route).elevation?.gainMeters).toBe(70);
	});

	it('has no climb to report for a route without heights', () => {
		const route = [
			{ latitude: 0, longitude: 0 },
			{ latitude: 0, longitude: 0.01 }
		];

		expect(routeStatistics(route).elevation).toBeNull();
	});

	it('times a route from its first timestamp to its last', () => {
		const route = [
			{ latitude: 0, longitude: 0, time: 1_000_000 },
			{ latitude: 0, longitude: 0.01 },
			{ latitude: 0, longitude: 0.02, time: 4_600_000 }
		];

		expect(routeStatistics(route).durationSeconds).toBe(3600);
	});

	it.each([
		['no timestamps', [{ latitude: 0, longitude: 0 }]],
		['one timestamp', [{ latitude: 0, longitude: 0, time: 5 }]],
		[
			'timestamps that run backwards',
			[
				{ latitude: 0, longitude: 0, time: 9 },
				{ latitude: 0, longitude: 1, time: 3 }
			]
		]
	])('has no duration for a route with %s', (_, route) => {
		expect(routeStatistics(route).durationSeconds).toBeNull();
	});
});
