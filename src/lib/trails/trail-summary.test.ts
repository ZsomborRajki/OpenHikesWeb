import { describe, expect, it } from 'vitest';
import { routeStatistics } from './route-statistics.ts';
import { aTrail, EQUATOR_ROUTE } from './trail.fixtures.ts';
import { statisticTiles, trailOrigin, trailSummary } from './trail-summary.ts';

const LOCALE = 'en-US';
const WITHOUT_HEIGHTS = [
	{ latitude: 0, longitude: 0 },
	{ latitude: 0, longitude: 0.01 }
];

describe('trail summary', () => {
	it('sums a trail up as its length and its climb', () => {
		expect(trailSummary(routeStatistics(EQUATOR_ROUTE), LOCALE)).toBe('2.2 km · 100 m ascent');
	});

	it('sums a trail without heights up as its length', () => {
		expect(trailSummary(routeStatistics(WITHOUT_HEIGHTS), LOCALE)).toBe('1.1 km');
	});

	it('says where a trail came from', () => {
		const stops = [
			{ latitude: 0, longitude: 0 },
			{ latitude: 0, longitude: 1 },
			{ latitude: 0, longitude: 2 }
		];

		expect(trailOrigin(aTrail())).toBe('Imported trail');
		expect(trailOrigin(aTrail({ stops }))).toBe('Planned trail · 3 stops');
	});

	it('shows every figure a walked trail has', () => {
		const walked = EQUATOR_ROUTE.map((point, index) => ({ ...point, time: index * 1_800_000 }));

		expect(statisticTiles(routeStatistics(walked), LOCALE)).toEqual([
			{ caption: 'Distance', value: '2.2 km' },
			{ caption: 'Ascent', value: '100 m' },
			{ caption: 'Descent', value: '50 m' },
			{ caption: 'Highest Point', value: '200 m' },
			{ caption: 'Duration', value: '1 hr' }
		]);
	});

	it('leaves out the figures a drawn line cannot know', () => {
		expect(statisticTiles(routeStatistics(WITHOUT_HEIGHTS), LOCALE)).toEqual([
			{ caption: 'Distance', value: '1.1 km' }
		]);
	});
});
