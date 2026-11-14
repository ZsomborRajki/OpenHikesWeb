//
// A route indexed by distance: how high it is, and where it is, any number
// of meters along. The elevation chart draws from it and a scrub reads it, so
// the dot on the map and the figure under the finger are one answer.
//
// The iOS app's `RouteProfile` is the same idea.
//

import type { Coordinate } from '#lib/general/geodesy.ts';
import { legMeters } from './route-statistics.ts';
import type { RoutePoint } from './trail.ts';

/** One place along the route. */
export interface ProfileSample {
	readonly distanceMeters: number;
	readonly elevationMeters: number;
	readonly coordinate: Coordinate;
}

export interface RouteProfile {
	/** The points that carry a height, in route order. Never fewer than two. */
	readonly samples: readonly ProfileSample[];
	readonly startMeters: number;
	readonly endMeters: number;
	readonly minimumMeters: number;
	readonly maximumMeters: number;
}

/** The profile of `route`, or `null` when fewer than two of its points carry a height. */
export function routeProfile(route: readonly RoutePoint[]): RouteProfile | null {
	const samples: ProfileSample[] = [];
	let traveled = 0;
	let previous: RoutePoint | null = null;
	for (const point of route) {
		if (previous !== null) traveled += legMeters(previous, point);
		previous = point;
		if (point.elevation === undefined || !Number.isFinite(point.elevation)) continue;
		samples.push({
			distanceMeters: traveled,
			elevationMeters: point.elevation,
			coordinate: { latitude: point.latitude, longitude: point.longitude }
		});
	}

	const first = samples.at(0);
	const last = samples.at(-1);
	if (first === undefined || last === undefined || samples.length < 2) return null;
	const heights = samples.map((sample) => sample.elevationMeters);
	return {
		samples,
		startMeters: first.distanceMeters,
		endMeters: last.distanceMeters,
		minimumMeters: Math.min(...heights),
		maximumMeters: Math.max(...heights)
	};
}

/**
 * The route `distanceMeters` along, between the two samples either side of
 * it. A distance off either end answers with that end.
 */
export function sampleAt(profile: RouteProfile, distanceMeters: number): ProfileSample {
	const index = firstIndexAtOrPast(profile.samples, distanceMeters);
	const before = profile.samples[index - 1];
	const after = profile.samples[index];
	if (before === undefined || after === undefined) {
		const end = before ?? after;
		if (end === undefined) throw new RangeError('A route profile always has samples.');
		return end;
	}

	const span = after.distanceMeters - before.distanceMeters;
	const fraction = span === 0 ? 0 : (distanceMeters - before.distanceMeters) / span;
	return {
		distanceMeters,
		elevationMeters: mix(before.elevationMeters, after.elevationMeters, fraction),
		coordinate: {
			latitude: mix(before.coordinate.latitude, after.coordinate.latitude, fraction),
			longitude: mix(before.coordinate.longitude, after.coordinate.longitude, fraction)
		}
	};
}

/** The index of the first sample at or past `distanceMeters`, by bisection. */
function firstIndexAtOrPast(samples: readonly ProfileSample[], distanceMeters: number): number {
	let low = 0;
	let high = samples.length;
	while (low < high) {
		const middle = Math.floor((low + high) / 2);
		const sample = samples[middle];
		if (sample !== undefined && sample.distanceMeters < distanceMeters) low = middle + 1;
		else high = middle;
	}
	return low;
}

function mix(from: number, to: number, fraction: number): number {
	return from + (to - from) * fraction;
}
