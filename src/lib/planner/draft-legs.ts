//
// The legs of a drawn trail, and the line they add up to.
//
// A leg is remembered by its two ends, not by its place in the list, which
// is the iOS app's `TrailLegMemo`: reordering stops moves rows without
// moving anything on the ground, so only the legs whose ends changed are
// asked for again. It also makes a late answer harmless. An answer for a leg
// the drawing no longer has files under ends nothing looks up.
//

import type { Coordinate } from '#lib/general/geodesy.ts';
import { adjacentPairs } from '#lib/general/sequences.ts';
import type { DraftStop } from './draft-stops.ts';

export type LegPaths = ReadonlyMap<string, readonly Coordinate[]>;

export interface Leg {
	readonly key: string;
	readonly from: Coordinate;
	readonly to: Coordinate;
}

/** The legs between consecutive stops, in drawing order. */
export function legsBetween(stops: readonly DraftStop[]): Leg[] {
	return [...adjacentPairs(stops)].map(([from, to]) => ({
		key: legKey(from.coordinate, to.coordinate),
		from: from.coordinate,
		to: to.coordinate
	}));
}

/**
 * The line through every stop: each leg along its routed path, or straight
 * while it has none. A single stop is a line of one point.
 */
export function lineThrough(stops: readonly DraftStop[], paths: LegPaths): Coordinate[] {
	const first = stops[0];
	if (first === undefined) return [];
	const line = [first.coordinate];
	for (const leg of legsBetween(stops)) {
		const path = paths.get(leg.key) ?? [leg.from, leg.to];
		// A leg starts where the last one ended; the shared point is drawn once.
		line.push(...path.slice(1));
	}
	return line;
}

function legKey(from: Coordinate, to: Coordinate): string {
	return `${String(from.latitude)},${String(from.longitude)}>${String(to.latitude)},${String(to.longitude)}`;
}
