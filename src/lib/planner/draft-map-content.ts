import type { Bounds, Coordinate } from '#lib/general/geodesy.ts';
import type { MapContent } from '#lib/map/map-content.ts';
import type { TapHandler } from '#lib/map/map-surface.ts';
import { stopLabel } from '#lib/trails/trail.ts';
import type { DraftStop } from './draft-stops.ts';

/**
 * The map while a trail is being drawn: the line so far, a numbered pin on
 * each stop, and a tap that adds the next one.
 */
export function draftMapContent(
	stops: readonly DraftStop[],
	line: readonly Coordinate[],
	frame: Bounds | null,
	onTap: TapHandler
): MapContent {
	return {
		lines: line.length > 1 ? [{ id: 'draft', pieces: [line], emphasis: 'primary' }] : [],
		markers: stops.map((stop, index) => ({
			id: stop.id,
			coordinate: stop.coordinate,
			glyph: String(index + 1),
			label: stopLabel(index)
		})),
		frame,
		onTap
	};
}
