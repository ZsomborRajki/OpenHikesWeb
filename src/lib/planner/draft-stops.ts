import type { Coordinate } from '#lib/general/geodesy.ts';

/** A stop of the trail being drawn. The id is what a list and a reorder know it by. */
export interface DraftStop {
	readonly id: string;
	readonly coordinate: Coordinate;
}

/** A trail goes from somewhere to somewhere. */
export const MINIMUM_STOPS = 2;

export function withoutStop(stops: readonly DraftStop[], id: string): DraftStop[] {
	return stops.filter((stop) => stop.id !== id);
}

/**
 * `stops` with one moved `offset` places along: -1 is one earlier. A move
 * past either end leaves the order as it was.
 */
export function withStopMoved(
	stops: readonly DraftStop[],
	id: string,
	offset: number
): DraftStop[] {
	const from = stops.findIndex((stop) => stop.id === id);
	const to = from + offset;
	const moving = stops[from];
	if (moving === undefined || to < 0 || to >= stops.length) return [...stops];
	const moved = withoutStop(stops, id);
	moved.splice(to, 0, moving);
	return moved;
}
