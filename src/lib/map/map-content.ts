import type { Bounds } from '#lib/general/geodesy.ts';
import type { MapLine, MapMarker, TapHandler } from './map-surface.ts';

/** Everything one screen puts on the map. */
export interface MapContent {
	readonly lines: readonly MapLine[];
	readonly markers: readonly MapMarker[];
	/**
	 * What the camera should take in, or `null` to leave it where it is. The
	 * camera moves when it is handed a frame it has not shown, so a screen
	 * that keeps one frame object through its updates frames once.
	 */
	readonly frame: Bounds | null;
	/** What a tap on bare map does, or `null` for nothing. */
	readonly onTap: TapHandler | null;
}

export const EMPTY_MAP_CONTENT: MapContent = { lines: [], markers: [], frame: null, onTap: null };
