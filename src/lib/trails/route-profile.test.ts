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

	it('measures past a point without a height, and leaves it out of the samples', () => {
		const profile = routeProfile([
			{ latitude: 0, longitude: 0 },
			{ latitude: 0, longitude: 0.01, elevation: 300 },
			{ latitude: 0, longitude: 0.02, elevation: Number.NaN },
			{ latitude: 0, longitude: 0.03, elevation: 320 }
		]);

		expect(profile?.samples).toHaveLength(2);
		expect(profile?.startMeters).toBeCloseTo(HUNDREDTH_OF_A_DEGREE_METERS, 1);
		expect(profile?.endMeters).toBeCloseTo(3 * HUNDREDTH_OF_A_DEGREE_METERS, 1);
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
