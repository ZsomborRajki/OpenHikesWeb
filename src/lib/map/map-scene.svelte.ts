//
// What the map should be showing, as a value any screen can set.
//
// Screens describe; they never touch the map. The screen on show hands over
// one `MapContent`, and `scene-sync.svelte.ts` carries it to the engine.
//
// The highlight is separate state for the reason the iOS app keeps
// `RouteHighlight` apart: it moves on every pointer event of a scrub, and
// nothing that reads the content should run again for it.
//

import type { Coordinate } from '#lib/general/geodesy.ts';
import { EMPTY_MAP_CONTENT, type MapContent } from './map-content.ts';

export class MapScene {
	#content = $state.raw<MapContent>(EMPTY_MAP_CONTENT);
	#highlight = $state.raw<Coordinate | null>(null);

	get content(): MapContent {
		return this.#content;
	}

	get highlight(): Coordinate | null {
		return this.#highlight;
	}

	/** Puts `content` on the map. A highlight belonged to what was there, so it goes. */
	show(content: MapContent): void {
		this.#content = content;
		this.#highlight = null;
	}

	highlightAt(coordinate: Coordinate | null): void {
		this.#highlight = coordinate;
	}
}
