//
// A plan as text: the one encoded form of what a trail is drawn from.
//
// The draft store keeps it today. It is also the payload meant to cross to
// the iOS app, whose `DrawnRoute` holds the same facts (`waypoints`), so a
// plan made here can open in the app's trail maker and be routed again there
// instead of arriving as a finished line.
//
// A reader takes the version it knows and refuses every other, as the app's
// shared payloads do. Change the shape and the number together. The number
// is free to move until an app release reads it.
//

import { isCoordinate, type Coordinate } from '#lib/general/geodesy.ts';

/** What a trail is drawn from: a name and the stops, in order. */
export interface Plan {
	readonly title: string;
	readonly stops: readonly Coordinate[];
}

export const PLAN_FORMAT = 'openhikes.plan';
export const PLAN_VERSION = 1;

export function encodePlan({ title, stops }: Plan): string {
	return JSON.stringify({
		format: PLAN_FORMAT,
		version: PLAN_VERSION,
		title,
		stops: stops.map(({ latitude, longitude }) => ({ latitude, longitude }))
	});
}

/** The plan in `text`, or `null` when it is not a plan of this version. */
export function decodePlan(text: string): Plan | null {
	let document: unknown;
	try {
		document = JSON.parse(text);
	} catch {
		return null;
	}
	if (!isRecord(document)) return null;
	const { format, version, title, stops } = document;
	if (format !== PLAN_FORMAT || version !== PLAN_VERSION) return null;
	if (typeof title !== 'string' || !Array.isArray(stops)) return null;

	const decoded = stops.flatMap((stop: unknown) => {
		if (!isRecord(stop)) return [];
		const { latitude, longitude } = stop;
		if (typeof latitude !== 'number' || typeof longitude !== 'number') return [];
		return isCoordinate(latitude, longitude) ? [{ latitude, longitude }] : [];
	});
	// One bad stop spoils the plan: dropping it would draw a different trail.
	return decoded.length === stops.length ? { title, stops: decoded } : null;
}

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === 'object' && value !== null;
}
