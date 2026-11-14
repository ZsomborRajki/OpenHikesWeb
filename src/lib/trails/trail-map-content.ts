import { boundsOf } from '#lib/general/geodesy.ts';
import type { MapContent } from '#lib/map/map-content.ts';
import type { LineEmphasis, MapLine, MapMarker } from '#lib/map/map-surface.ts';
import { routePieces, stopLabel, type Trail } from './trail.ts';

/** The map behind the library: every trail, framed together. */
export function libraryMapContent(trails: readonly Trail[]): MapContent {
	return {
		lines: trails.map((trail) => lineOf(trail, 'faded')),
		markers: [],
		frame: boundsOf(trails.flatMap((trail) => trail.route)),
		onTap: null
	};
}

/**
 * The map behind one trail: that trail over the rest of the library, as the
 * iOS app draws the selected route over its faded library lines, with a pin
 * on each stop of a planned one.
 */
export function trailMapContent(trails: readonly Trail[], selected: Trail): MapContent {
	const others = trails.filter((trail) => trail.id !== selected.id);
	return {
		lines: [...others.map((trail) => lineOf(trail, 'faded')), lineOf(selected, 'primary')],
		markers: stopMarkers(selected),
		frame: boundsOf(selected.route),
		onTap: null
	};
}

function lineOf(trail: Trail, emphasis: LineEmphasis): MapLine {
	return { id: trail.id, pieces: routePieces(trail.route), emphasis };
}

function stopMarkers(trail: Trail): MapMarker[] {
	return (trail.stops ?? []).map((coordinate, index) => ({
		id: `${trail.id}-stop-${String(index)}`,
		coordinate,
		glyph: String(index + 1),
		label: stopLabel(index)
	}));
}
