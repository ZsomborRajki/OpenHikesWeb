import { describe, expect, it } from 'vitest';
import { routeProfile, sampleAt, type RouteProfile } from './route-profile.ts';
import { EQUATOR_ROUTE, HUNDREDTH_OF_A_DEGREE_METERS } from './trail.fixtures.ts';

function equatorProfile(): RouteProfile {
	const profile = routeProfile(EQUATOR_ROUTE);
	if (profile === null) throw new Error('The fixture route has heights.');
	return profile;
}

describe('routeProfile', () => {
	it('indexes the points that carry a height by their distance along the route', () => {
		const profile = equatorProfile();

		expect(profile.samples.map((sample) => sample.elevationMeters)).toEqual([100, 200, 150]);
		expect(profile.startMeters).toBe(0);
		expect(profile.endMeters).toBeCloseTo(2 * HUNDREDTH_OF_A_DEGREE_METERS, 1);
		expect(profile.minimumMeters).toBe(100);
		expect(profile.maximumMeters).toBe(200);
	});

	it('runs from the first height to the last, measured from the start of the route', () => {
		const profile = routeProfile([
			{ latitude: 0, longitude: 0 },
			{ latitude: 0, longitude: 0.01, elevation: 300 },
			{ latitude: 0, longitude: 0.02, elevation: 320 },
			{ latitude: 0, longitude: 0.03 }
		]);

		expect(profile?.samples.map((sample) => sample.elevationMeters)).toEqual([300, 320]);
		expect(profile?.startMeters).toBeCloseTo(HUNDREDTH_OF_A_DEGREE_METERS, 1);
		expect(profile?.endMeters).toBeCloseTo(2 * HUNDREDTH_OF_A_DEGREE_METERS, 1);
	});

	it('gives a point without a height the one the line between its neighbors has there', () => {
		const profile = routeProfile([
			{ latitude: 0, longitude: 0, elevation: 300 },
			{ latitude: 0, longitude: 0.01 },
			{ latitude: 0, longitude: 0.02, elevation: Number.NaN },
			{ latitude: 0, longitude: 0.04, elevation: 340 }
		]);

		const heights = profile?.samples.map((sample) => sample.elevationMeters) ?? [];
		expect(heights).toHaveLength(4);
		expect(heights[1]).toBeCloseTo(310, 6);
		expect(heights[2]).toBeCloseTo(320, 6);
		expect(profile?.minimumMeters).toBe(300);
		expect(profile?.maximumMeters).toBe(340);
	});

	it('follows the route round a bend whose point has no height', () => {
		const profile = routeProfile([
			{ latitude: 0, longitude: 0, elevation: 100 },
			{ latitude: 0.01, longitude: 0.01 },
			{ latitude: 0, longitude: 0.02, elevation: 300 }
		]);
		if (profile === null) throw new Error('The route has two heights.');

		const halfway = sampleAt(profile, profile.endMeters / 2);

		expect(halfway.coordinate.latitude).toBeCloseTo(0.01, 6);
		expect(halfway.coordinate.longitude).toBeCloseTo(0.01, 6);
		expect(halfway.elevationMeters).toBeCloseTo(200, 3);
	});

	it('finds the extremes of a route of more points than a function takes arguments', () => {
		// About 125,000 in V8, and a day's recording at a point a second is longer.
		const route = Array.from({ length: 150_000 }, (_, index) => ({
			latitude: 0,
			longitude: index / 1_000_000,
			elevation: index % 500
		}));

		const profile = routeProfile(route);

		expect(profile?.minimumMeters).toBe(0);
		expect(profile?.maximumMeters).toBe(499);
	});

	it.each([
		['no heights', [{ latitude: 0, longitude: 0 }]],
		['one height', [{ latitude: 0, longitude: 0, elevation: 100 }]],
		['no points', []]
	])('has no profile for a route with %s', (_, route) => {
		expect(routeProfile(route)).toBeNull();
	});

	it('reads the route between two samples', () => {
		const sample = sampleAt(equatorProfile(), HUNDREDTH_OF_A_DEGREE_METERS / 2);

		expect(sample.elevationMeters).toBeCloseTo(150, 3);
		expect(sample.coordinate.latitude).toBe(0);
		expect(sample.coordinate.longitude).toBeCloseTo(0.005, 6);
	});

	it('answers with a sample when asked for its own distance', () => {
		const profile = equatorProfile();
		const middle = profile.samples[1];

		expect(sampleAt(profile, middle?.distanceMeters ?? Number.NaN)).toEqual(middle);
	});

	it('answers with an end for a distance off that end', () => {
		const profile = equatorProfile();

		expect(sampleAt(profile, -50)).toEqual(profile.samples[0]);
		expect(sampleAt(profile, 1_000_000)).toEqual(profile.samples[2]);
	});
});
