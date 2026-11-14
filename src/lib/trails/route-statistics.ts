import { distanceMeters } from '#lib/general/geodesy.ts';
import { adjacentPairs } from '#lib/general/sequences.ts';
import { ElevationAccumulator, type ElevationChange } from './elevation-change.ts';
import type { RoutePoint } from './trail.ts';

/** What a route adds up to. */
export interface RouteStatistics {
	readonly distanceMeters: number;
	/** `null` when fewer than two points carry a height. */
	readonly elevation: ElevationChange | null;
	/** From the first timestamp to the last; `null` when the route was never walked. */
	readonly durationSeconds: number | null;
}

const MILLISECONDS_PER_SECOND = 1000;

export function routeStatistics(route: readonly RoutePoint[]): RouteStatistics {
	return {
		distanceMeters: routeLengthMeters(route),
		elevation: elevationChange(route),
		durationSeconds: durationSeconds(route)
	};
}

/** The length of the line, giving the gap before a new segment none. */
export function routeLengthMeters(route: readonly RoutePoint[]): number {
	let length = 0;
	for (const [previous, point] of adjacentPairs(route)) {
		length += legMeters(previous, point);
	}
	return length;
}

/** The distance `point` adds to the route after `previous`. */
export function legMeters(previous: RoutePoint, point: RoutePoint): number {
	return point.startsSegment === true ? 0 : distanceMeters(previous, point);
}

function elevationChange(route: readonly RoutePoint[]): ElevationChange | null {
	const accumulator = new ElevationAccumulator();
	for (const point of route) {
		if (point.startsSegment === true) accumulator.endRun();
		accumulator.record(point.elevation);
	}
	return accumulator.change;
}

function durationSeconds(route: readonly RoutePoint[]): number | null {
	const times = route.flatMap((point) => (point.time === undefined ? [] : [point.time]));
	const first = times.at(0);
	const last = times.at(-1);
	if (first === undefined || last === undefined || last <= first) return null;
	return (last - first) / MILLISECONDS_PER_SECOND;
}
