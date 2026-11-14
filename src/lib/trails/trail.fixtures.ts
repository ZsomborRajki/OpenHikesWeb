import type { RoutePoint, Trail } from './trail.ts';

/** Three points along the equator, a hundredth of a degree apart, with heights. */
export const EQUATOR_ROUTE: readonly RoutePoint[] = [
	{ latitude: 0, longitude: 0, elevation: 100 },
	{ latitude: 0, longitude: 0.01, elevation: 200 },
	{ latitude: 0, longitude: 0.02, elevation: 150 }
];

/** A hundredth of a degree along the equator, in meters. */
export const HUNDREDTH_OF_A_DEGREE_METERS = 1111.95;

/** A trail for a suite to store, list or draw. */
export function aTrail(overrides: Partial<Trail> = {}): Trail {
	return {
		id: 'trail-1',
		title: 'Thumsee Loop',
		addedAt: 1_000,
		route: EQUATOR_ROUTE,
		...overrides
	};
}
