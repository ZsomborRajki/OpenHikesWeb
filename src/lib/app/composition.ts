//
// The composition root: where every port meets its adapter.
//
// This is the only module that names an adapter, which is what lets the rest
// of the app be tested against stand-ins, and it is the one place to look to
// see what the app is built from. The lint rules in `eslint.config.js` hold
// every other module to that.
//

import { BrowserFileSaver } from '#lib/general/adapters/browser-file-saver.ts';
import type { NewId, Now } from '#lib/general/ambient.ts';
import type { FileSaver } from '#lib/general/file-saver.ts';
import { OPENING_BOUNDS } from '#lib/map/framing.ts';
import { MapScene } from '#lib/map/map-scene.svelte.ts';
import type { MapSurfaceFactory } from '#lib/map/map-surface.ts';
import { DirectLegRouter } from '#lib/planner/adapters/direct-leg-router.ts';
import { InMemoryDraftStore } from '#lib/planner/adapters/in-memory-draft-store.ts';
import { LocalStorageDraftStore } from '#lib/planner/adapters/local-storage-draft-store.ts';
import type { DraftStore } from '#lib/planner/draft-store.ts';
import { TrailDraft } from '#lib/planner/trail-draft.svelte.ts';
import { IndexedDbTrailRepository } from '#lib/trails/adapters/indexeddb-trail-repository.ts';
import { TrailLibrary } from '#lib/trails/trail-library.svelte.ts';

/** Everything the screens are given to work with. */
export interface App {
	readonly library: TrailLibrary;
	readonly draft: TrailDraft;
	readonly scene: MapScene;
	readonly files: FileSaver;
	readonly createMapSurface: MapSurfaceFactory;
}

export interface AppConfiguration {
	/** The MapKit JS token, or `undefined` to run without Apple Maps. */
	readonly mapKitToken: string | undefined;
}

export function composeApp({ mapKitToken }: AppConfiguration): App {
	const newId: NewId = () => crypto.randomUUID();
	const now: Now = () => Date.now();
	return {
		library: new TrailLibrary({ repository: new IndexedDbTrailRepository(), newId, now }),
		draft: new TrailDraft({ router: new DirectLegRouter(), store: draftStore(), newId }),
		scene: new MapScene(),
		files: new BrowserFileSaver(),
		createMapSurface: mapSurfaceFactory(mapKitToken)
	};
}

/**
 * Apple Maps with a token, the sketch map without one. Each is imported when
 * the map starts, so a visitor downloads only the one in use.
 */
function mapSurfaceFactory(mapKitToken: string | undefined): MapSurfaceFactory {
	if (mapKitToken === undefined) {
		return async (container) => {
			const { createSketchSurface } = await import('#lib/map/adapters/sketch-map-surface.ts');
			return createSketchSurface(container, OPENING_BOUNDS);
		};
	}
	return async (container) => {
		const { createMapKitSurface } = await import('#lib/map/adapters/mapkit-map-surface.ts');
		return createMapKitSurface(container, mapKitToken, OPENING_BOUNDS);
	};
}

/** A browser with its storage switched off throws on the way to `localStorage`. */
function draftStore(): DraftStore {
	try {
		return new LocalStorageDraftStore(window.localStorage);
	} catch {
		return new InMemoryDraftStore();
	}
}
