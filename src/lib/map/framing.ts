import type { Bounds } from '#lib/general/geodesy.ts';

/** What the map shows before it has a trail to show: the Alps. */
export const OPENING_BOUNDS: Bounds = { south: 45.5, west: 6.5, north: 48.5, east: 14.5 };

/** Room around a framed subject, as a share of its size, on every side. */
const BREATHING_ROOM = 0.15;
/**
 * The least a frame spans, in degrees: about a kilometer of latitude. A
 * single stop has no size at all, and a camera asked to show nothing zooms
 * until the map has no detail left.
 */
const MINIMUM_SPAN_DEGREES = 0.01;

/**
 * `bounds` with room around it, which is what a camera is asked to show.
 * Both map adapters frame through here, so a trail sits the same in each.
 */
export function withBreathingRoom(bounds: Bounds): Bounds {
	const latitudeRoom = roomFor(bounds.north - bounds.south);
	const longitudeRoom = roomFor(bounds.east - bounds.west);
	return {
		south: Math.max(bounds.south - latitudeRoom, -90),
		west: bounds.west - longitudeRoom,
		north: Math.min(bounds.north + latitudeRoom, 90),
		east: bounds.east + longitudeRoom
	};
}

/** How far to move each of two opposite edges apart. */
function roomFor(span: number): number {
	const padded = span * (1 + 2 * BREATHING_ROOM);
	return (Math.max(padded, MINIMUM_SPAN_DEGREES) - span) / 2;
}
