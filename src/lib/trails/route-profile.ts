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
	/**
	 * Every point of the route from the first that carries a height to the
	 * last, in route order. Never fewer than two. A point between them with
	 * no height of its own is kept, at the height the line between its
	 * neighbors has there: it is still a bend in the route, and a scrub that
	 * cut the corner would put the dot where the trail is not.
	 */
	readonly samples: readonly ProfileSample[];
	readonly startMeters: number;
	readonly endMeters: number;
	readonly minimumMeters: number;
	readonly maximumMeters: number;
}

/** A point of the route by its distance along it, with the height its source gave it, if any. */
interface Place {
	readonly distanceMeters: number;
	readonly elevationMeters: number | undefined;
	readonly coordinate: Coordinate;
}

/** The profile of `route`, or `null` when fewer than two of its points carry a height. */
export function routeProfile(route: readonly RoutePoint[]): RouteProfile | null {
	const samples: ProfileSample[] = [];
	/** The points since the last height. The next height says what theirs are. */
	let waiting: Place[] = [];
	// Kept as the heights go by: a recording has more of them than `Math.min` takes arguments.
	let minimumMeters = Infinity;
	let maximumMeters = -Infinity;
	for (const place of placesAlong(route)) {
		const { elevationMeters } = place;
		const before = samples.at(-1);
		if (elevationMeters === undefined) {
			// Ahead of the first height there is no line to take one from.
			if (before !== undefined) waiting.push(place);
			continue;
		}

		const sample = { ...place, elevationMeters };
		if (before !== undefined) {
			for (const between of waiting) {
				const fraction = fractionBetween(before, sample, between.distanceMeters);
				const height = mix(before.elevationMeters, elevationMeters, fraction);
				samples.push({ ...between, elevationMeters: height });
			}
		}
		waiting = [];
		samples.push(sample);
		minimumMeters = Math.min(minimumMeters, elevationMeters);
		maximumMeters = Math.max(maximumMeters, elevationMeters);
	}

	const first = samples.at(0);
	const last = samples.at(-1);
	if (first === undefined || last === undefined || samples.length < 2) return null;
	return {
		samples,
		startMeters: first.distanceMeters,
		endMeters: last.distanceMeters,
		minimumMeters,
		maximumMeters
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

	const fraction = fractionBetween(before, after, distanceMeters);
	return {
		distanceMeters,
		elevationMeters: mix(before.elevationMeters, after.elevationMeters, fraction),
		coordinate: {
			latitude: mix(before.coordinate.latitude, after.coordinate.latitude, fraction),
			longitude: mix(before.coordinate.longitude, after.coordinate.longitude, fraction)
		}
	};
}

/** Every point of `route`, with how far along the route it is. */
function* placesAlong(route: readonly RoutePoint[]): Generator<Place> {
	let traveled = 0;
	let previous: RoutePoint | null = null;
	for (const point of route) {
		if (previous !== null) traveled += legMeters(previous, point);
		previous = point;
		const { latitude, longitude, elevation } = point;
		yield {
			distanceMeters: traveled,
			elevationMeters: Number.isFinite(elevation) ? elevation : undefined,
			coordinate: { latitude, longitude }
		};
	}
}

/**
 * How far `distanceMeters` is on the way from `before` to `after`, from 0 to
 * 1. Two samples at one distance have no way between them.
 */
function fractionBetween(
	before: ProfileSample,
	after: ProfileSample,
	distanceMeters: number
): number {
	const span = after.distanceMeters - before.distanceMeters;
	return span === 0 ? 0 : (distanceMeters - before.distanceMeters) / span;
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
