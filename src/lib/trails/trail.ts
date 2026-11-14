//
// What a trail is. Plain data, so it goes to IndexedDB and back unchanged and
// every screen can share one copy.
//
// The names follow the iOS app's `Hike` where the two mean the same thing:
// a `route` of points, and the stops a drawn trail was drawn through.
//

import type { Coordinate } from '#lib/general/geodesy.ts';

/** One point of a trail's line. */
export interface RoutePoint extends Coordinate {
	/** Meters above sea level, when the source had one. */
	readonly elevation?: number;
	/** Milliseconds since the epoch, when the source had one. */
	readonly time?: number;
	/**
	 * The line does not continue from the point before this one: a GPX
	 * segment break, which the iOS app reads as a pause. No distance is
	 * measured across the gap and nothing is drawn across it.
	 */
	readonly startsSegment?: boolean;
}

export interface Trail {
	readonly id: string;
	readonly title: string;
	/** When the trail joined the library, in milliseconds since the epoch. */
	readonly addedAt: number;
	readonly route: readonly RoutePoint[];
	/**
	 * The stops a planned trail was drawn through, in order. Absent on an
	 * imported trail, which has no plan to reopen.
	 */
	readonly stops?: readonly Coordinate[];
}

/** As long as a title may be, the iOS app's limit. */
export const MAXIMUM_TITLE_LENGTH = 128;

/**
 * `raw` as a title: trimmed, cut to the limit, and replaced by `fallback`
 * when nothing is left. Every way to name a trail goes through here.
 */
export function boundedTitle(raw: string, fallback: string): string {
	// Counted in what a reader sees as characters, so the cut never lands inside an emoji.
	const characters = Array.from(new Intl.Segmenter().segment(raw.trim()), (part) => part.segment);
	const bounded = characters.slice(0, MAXIMUM_TITLE_LENGTH).join('').trim();
	return bounded === '' ? fallback : bounded;
}

/** The route cut into the pieces that are drawn and measured unbroken. */
export function routePieces(route: readonly RoutePoint[]): RoutePoint[][] {
	const pieces: RoutePoint[][] = [];
	let piece: RoutePoint[] = [];
	for (const point of route) {
		if (point.startsSegment === true && piece.length > 0) {
			pieces.push(piece);
			piece = [];
		}
		piece.push(point);
	}
	if (piece.length > 0) pieces.push(piece);
	return pieces;
}

/** What a stop is called in a list and on the map: "Stop 2". */
export function stopLabel(index: number): string {
	return `Stop ${String(index + 1)}`;
}
