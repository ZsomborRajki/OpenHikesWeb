import { describe, expect, it } from 'vitest';
import { boundsOf, distanceMeters, isCoordinate, pathLengthMeters } from './geodesy.ts';

/** One degree of a great circle, on the sphere the app measures with. */
const DEGREE_METERS = 111_195.08;

describe('geodesy', () => {
	it('measures a degree of latitude', () => {
		const distance = distanceMeters({ latitude: 0, longitude: 0 }, { latitude: 1, longitude: 0 });

		expect(distance).toBeCloseTo(DEGREE_METERS, 1);
	});

	it('measures nothing between a point and itself', () => {
		const point = { latitude: 47.7165, longitude: 12.852 };

		expect(distanceMeters(point, point)).toBe(0);
	});

	it('crosses the antimeridian the short way', () => {
		const distance = distanceMeters(
			{ latitude: 0, longitude: 179.5 },
			{ latitude: 0, longitude: -179.5 }
		);

		expect(distance).toBeCloseTo(DEGREE_METERS, 1);
	});

	it('adds up the legs of a path', () => {
		const path = [
			{ latitude: 0, longitude: 0 },
			{ latitude: 1, longitude: 0 },
			{ latitude: 2, longitude: 0 }
		];

		expect(pathLengthMeters(path)).toBeCloseTo(2 * DEGREE_METERS, 1);
	});

	it('gives a path of one point no length', () => {
		expect(pathLengthMeters([{ latitude: 1, longitude: 1 }])).toBe(0);
	});

	it('draws the smallest box around points', () => {
		const bounds = boundsOf([
			{ latitude: 47.7, longitude: 12.9 },
			{ latitude: 47.8, longitude: 12.8 },
			{ latitude: 47.6, longitude: 12.85 }
		]);

		expect(bounds).toEqual({ south: 47.6, west: 12.8, north: 47.8, east: 12.9 });
	});

	it('has no box around nothing', () => {
		expect(boundsOf([])).toBeNull();
	});

	it.each([
		[47.7, 12.8, true],
		[90, 180, true],
		[90.1, 0, false],
		[0, -180.1, false],
		[Number.NaN, 0, false],
		[0, Number.POSITIVE_INFINITY, false]
	])('says whether %d, %d is a place on the globe', (latitude, longitude, expected) => {
		expect(isCoordinate(latitude, longitude)).toBe(expected);
	});
});
