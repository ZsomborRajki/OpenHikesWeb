import { describe, expect, it } from 'vitest';
import { chartGeometry, chartPoint, distanceAtX } from './elevation-chart-geometry.ts';
import { routeProfile, type RouteProfile } from './route-profile.ts';
import { EQUATOR_ROUTE } from './trail.fixtures.ts';

const SIZE = { width: 200, height: 100 };

function profileOf(route: Parameters<typeof routeProfile>[0]): RouteProfile {
	const profile = routeProfile(route);
	if (profile === null) throw new Error('The route has heights.');
	return profile;
}

describe('elevation chart geometry', () => {
	it('draws the line from edge to edge, sampled every other pixel', () => {
		const { line } = chartGeometry(profileOf(EQUATOR_ROUTE), SIZE);
		const points = line.split(' ');

		expect(points).toHaveLength(100);
		expect(points[0]).toMatch(/^M0,/);
		expect(points.at(-1)).toMatch(/^L200,/);
	});

	it('closes the area along the bottom of the chart', () => {
		const { line, area } = chartGeometry(profileOf(EQUATOR_ROUTE), SIZE);

		expect(area).toBe(`${line} L200,100 L0,100 Z`);
	});

	it('leaves room above the summit and below the valley', () => {
		const profile = profileOf(EQUATOR_ROUTE);
		const [valley, summit] = profile.samples;
		if (valley === undefined || summit === undefined) throw new Error('The route has samples.');

		// A hundred meters of climb gets ten of room each way: 90 m to 210 m over 100 px.
		expect(chartPoint(profile, SIZE, valley).y).toBeCloseTo(91.67, 2);
		expect(chartPoint(profile, SIZE, summit).y).toBeCloseTo(8.33, 2);
		expect(chartPoint(profile, SIZE, summit).x).toBeCloseTo(100, 6);
	});

	it('draws a flat trail through the middle', () => {
		const flat = profileOf([
			{ latitude: 0, longitude: 0, elevation: 300 },
			{ latitude: 0, longitude: 0.01, elevation: 300 }
		]);
		const [start] = flat.samples;
		if (start === undefined) throw new Error('The route has samples.');

		expect(chartPoint(flat, SIZE, start).y).toBe(50);
	});

	it('draws a route that goes nowhere at the left edge', () => {
		const still = profileOf([
			{ latitude: 0, longitude: 0, elevation: 300 },
			{ latitude: 0, longitude: 0, elevation: 310 }
		]);
		const [, last] = still.samples;
		if (last === undefined) throw new Error('The route has samples.');

		expect(chartPoint(still, SIZE, last).x).toBe(0);
	});

	it('reads a pointer as a distance, kept inside the chart', () => {
		const profile = profileOf(EQUATOR_ROUTE);

		expect(distanceAtX(profile, SIZE, 100)).toBeCloseTo(profile.endMeters / 2, 6);
		expect(distanceAtX(profile, SIZE, -30)).toBe(profile.startMeters);
		expect(distanceAtX(profile, SIZE, 900)).toBe(profile.endMeters);
		expect(distanceAtX(profile, { width: 0, height: 100 }, 40)).toBe(profile.startMeters);
	});
});
