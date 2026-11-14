import { adjacentPairs } from './sequences.ts';

/** A point on the ground, in degrees. */
export interface Coordinate {
	readonly latitude: number;
	readonly longitude: number;
}

/** The smallest box around a set of points, in degrees. */
export interface Bounds {
	readonly south: number;
	readonly west: number;
	readonly north: number;
	readonly east: number;
}

/**
 * The mean Earth radius the iOS app measures with, so a trail is the same
 * length on both.
 */
const EARTH_RADIUS_METERS = 6_371_008.8;

const RADIANS_PER_DEGREE = Math.PI / 180;

/** Great-circle distance between two points, by the haversine formula. */
export function distanceMeters(from: Coordinate, to: Coordinate): number {
	const fromLatitude = from.latitude * RADIANS_PER_DEGREE;
	const toLatitude = to.latitude * RADIANS_PER_DEGREE;
	const latitudeDelta = (to.latitude - from.latitude) * RADIANS_PER_DEGREE;
	const longitudeDelta = shortestLongitudeDelta(to.longitude - from.longitude) * RADIANS_PER_DEGREE;

	const latitudeTerm = Math.sin(latitudeDelta / 2);
	const longitudeTerm = Math.sin(longitudeDelta / 2);
	const haversine =
		latitudeTerm * latitudeTerm +
		Math.cos(fromLatitude) * Math.cos(toLatitude) * longitudeTerm * longitudeTerm;
	// Rounding can push the term a hair outside [0, 1], where the root is NaN.
	const bounded = Math.min(Math.max(haversine, 0), 1);
	return 2 * EARTH_RADIUS_METERS * Math.atan2(Math.sqrt(bounded), Math.sqrt(1 - bounded));
}

/** The length of a line through `path`, in meters. */
export function pathLengthMeters(path: readonly Coordinate[]): number {
	let length = 0;
	for (const [from, to] of adjacentPairs(path)) {
		length += distanceMeters(from, to);
	}
	return length;
}

/** The box around `points`, or `null` when there are none. */
export function boundsOf(points: Iterable<Coordinate>): Bounds | null {
	let bounds: Bounds | null = null;
	for (const { latitude, longitude } of points) {
		bounds =
			bounds === null
				? { south: latitude, west: longitude, north: latitude, east: longitude }
				: {
						south: Math.min(bounds.south, latitude),
						west: Math.min(bounds.west, longitude),
						north: Math.max(bounds.north, latitude),
						east: Math.max(bounds.east, longitude)
					};
	}
	return bounds;
}

/** Whether both numbers are a real place on the globe. */
export function isCoordinate(latitude: number, longitude: number): boolean {
	return (
		Number.isFinite(latitude) &&
		Number.isFinite(longitude) &&
		Math.abs(latitude) <= 90 &&
		Math.abs(longitude) <= 180
	);
}

/** `delta` taken the short way round the globe, so 179° to -179° is 2° and not 358°. */
function shortestLongitudeDelta(delta: number): number {
	const wrapped = ((delta + 540) % 360) - 180;
	return wrapped === -180 ? 180 : wrapped;
}
