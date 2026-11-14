//
// The map, as the rest of the app is allowed to know it.
//
// A port, and an imperative one on purpose, as the iOS app keeps MapKit
// behind `MapView.Coordinator`: the engine is told what changed and redraws
// that, so nothing reactive sits between a scrub and the dot it moves.
// `scene-sync.svelte.ts` is the only caller.
//
// Two adapters implement it. `MapKitMapSurface` is Apple Maps, and
// `SketchMapSurface` draws without a map service at all.
//

import type { Bounds, Coordinate } from '#lib/general/geodesy.ts';

/** How much a line asks for the eye: the trail on screen, or the library behind it. */
export type LineEmphasis = 'primary' | 'faded';

export interface MapLine {
	readonly id: string;
	/** The line's unbroken pieces. Nothing is drawn from one to the next. */
	readonly pieces: readonly (readonly Coordinate[])[];
	readonly emphasis: LineEmphasis;
}

export interface MapMarker {
	readonly id: string;
	readonly coordinate: Coordinate;
	/** A character or two drawn in the pin: a stop's number. */
	readonly glyph: string;
	/** What the pin is, for someone who cannot see it. */
	readonly label: string;
}

/** The edges of the map that something else covers, in pixels. */
export interface Insets {
	readonly top: number;
	readonly right: number;
	readonly bottom: number;
	readonly left: number;
}

export const NO_INSETS: Insets = { top: 0, right: 0, bottom: 0, left: 0 };

export type TapHandler = (coordinate: Coordinate) => void;

export interface MapSurface {
	/** Replaces every line. Later lines are drawn over earlier ones. */
	setLines(lines: readonly MapLine[]): void;
	/** Replaces every marker. */
	setMarkers(markers: readonly MapMarker[]): void;
	/** Moves the highlight dot, or takes it away. */
	setHighlight(coordinate: Coordinate | null): void;
	/** What a tap on bare map does, or `null` for nothing. */
	setTapHandler(handler: TapHandler | null): void;
	/** Says which edges are covered, so the map keeps its subject clear of them. */
	setInsets(insets: Insets): void;
	/** Moves the camera to show all of `bounds`. */
	frame(bounds: Bounds): void;
	/** Takes the map out of the page. The surface is not used again. */
	destroy(): void;
}

/**
 * Starts a map inside `container`. Resolves once the map can be drawn on, and
 * rejects when it cannot start: no connection, or a token Apple turns down.
 */
export type MapSurfaceFactory = (container: HTMLElement) => Promise<MapSurface>;
