// @vitest-environment jsdom
import { flushSync } from 'svelte';
import { describe, expect, it } from 'vitest';
import type { Bounds, Coordinate } from '#lib/general/geodesy.ts';
import { EMPTY_MAP_CONTENT, type MapContent } from './map-content.ts';
import { MapScene } from './map-scene.svelte.ts';
import {
	NO_INSETS,
	type Insets,
	type MapLine,
	type MapMarker,
	type MapSurface,
	type TapHandler
} from './map-surface.ts';
import { syncScene } from './scene-sync.svelte.ts';

/** A map that draws nothing and writes down everything it is told. */
class RecordingSurface implements MapSurface {
	readonly calls: string[] = [];
	lines: readonly MapLine[] = [];
	markers: readonly MapMarker[] = [];
	highlight: Coordinate | null = null;
	tapHandler: TapHandler | null = null;
	insets: Insets | null = null;
	readonly framed: Bounds[] = [];

	setLines(lines: readonly MapLine[]): void {
		this.calls.push('setLines');
		this.lines = lines;
	}

	setMarkers(markers: readonly MapMarker[]): void {
		this.calls.push('setMarkers');
		this.markers = markers;
	}

	setHighlight(coordinate: Coordinate | null): void {
		this.calls.push('setHighlight');
		this.highlight = coordinate;
	}

	setTapHandler(handler: TapHandler | null): void {
		this.calls.push('setTapHandler');
		this.tapHandler = handler;
	}

	setInsets(insets: Insets): void {
		this.calls.push('setInsets');
		this.insets = insets;
	}

	frame(bounds: Bounds): void {
		this.calls.push('frame');
		this.framed.push(bounds);
	}

	destroy(): void {
		this.calls.push('destroy');
	}
}

const LINE: MapLine = { id: 'line', pieces: [], emphasis: 'primary' };
const MARKER: MapMarker = {
	id: 'pin',
	coordinate: { latitude: 1, longitude: 2 },
	glyph: '1',
	label: 'Stop 1'
};
const FRAME: Bounds = { south: 0, west: 0, north: 1, east: 1 };

function contentWith(overrides: Partial<MapContent>): MapContent {
	return { ...EMPTY_MAP_CONTENT, ...overrides };
}

/** A synced scene and surface, with the calls of the first sync already forgotten. */
function synced(insets: () => Insets = () => NO_INSETS): {
	scene: MapScene;
	surface: RecordingSurface;
	stop: () => void;
} {
	const scene = new MapScene();
	const surface = new RecordingSurface();
	const stop = syncScene(scene, surface, insets);
	flushSync();
	surface.calls.length = 0;
	return { scene, surface, stop };
}

describe('syncScene', () => {
	it('tells a new surface where the insets are before anything is framed', () => {
		const scene = new MapScene();
		scene.show(contentWith({ frame: FRAME }));
		const surface = new RecordingSurface();

		syncScene(scene, surface, () => ({ ...NO_INSETS, left: 384 }));
		flushSync();

		expect(surface.insets).toEqual({ top: 0, right: 0, bottom: 0, left: 384 });
		expect(surface.calls.indexOf('setInsets')).toBeLessThan(surface.calls.indexOf('frame'));
	});

	it('carries the content of the scene to the surface', () => {
		const { scene, surface } = synced();
		const onTap = (): void => undefined;

		scene.show(contentWith({ lines: [LINE], markers: [MARKER], onTap }));
		flushSync();

		expect(surface.lines).toEqual([LINE]);
		expect(surface.markers).toEqual([MARKER]);
		expect(surface.tapHandler).toBe(onTap);
	});

	it('frames what the content asks it to', () => {
		const { scene, surface } = synced();

		scene.show(contentWith({ frame: FRAME }));
		flushSync();

		expect(surface.framed).toEqual([FRAME]);
	});

	it('leaves the camera alone for content with no frame', () => {
		const { scene, surface } = synced();

		scene.show(contentWith({ lines: [LINE] }));
		flushSync();

		expect(surface.framed).toEqual([]);
	});

	it('frames once for content that keeps handing over the same frame', () => {
		const { scene, surface } = synced();

		scene.show(contentWith({ frame: FRAME }));
		flushSync();
		scene.show(contentWith({ frame: FRAME, lines: [LINE] }));
		flushSync();

		expect(surface.framed).toHaveLength(1);
	});

	it('frames again when handed the frame it showed before the last one', () => {
		const { scene, surface } = synced();

		scene.show(contentWith({ frame: FRAME }));
		flushSync();
		scene.show(contentWith({ frame: null }));
		flushSync();
		scene.show(contentWith({ frame: FRAME }));
		flushSync();

		expect(surface.framed).toHaveLength(2);
	});

	it('moves the highlight without redrawing anything else', () => {
		const { scene, surface } = synced();
		const position = { latitude: 47.7, longitude: 12.8 };

		scene.highlightAt(position);
		flushSync();

		expect(surface.highlight).toBe(position);
		expect(surface.calls).toEqual(['setHighlight']);
	});

	it('takes the highlight away when new content is shown', () => {
		const { scene, surface } = synced();
		scene.highlightAt({ latitude: 47.7, longitude: 12.8 });
		flushSync();

		scene.show(contentWith({ lines: [LINE] }));
		flushSync();

		expect(surface.highlight).toBeNull();
	});

	it('moves the insets without redrawing anything else', () => {
		let insets = $state.raw(NO_INSETS);
		const { surface } = synced(() => insets);

		insets = { ...NO_INSETS, bottom: 320 };
		flushSync();

		expect(surface.insets).toEqual({ top: 0, right: 0, bottom: 320, left: 0 });
		expect(surface.calls).toEqual(['setInsets']);
	});

	it('stops following the scene once it is stopped', () => {
		const { scene, surface, stop } = synced();

		stop();
		scene.show(contentWith({ lines: [LINE] }));
		flushSync();

		expect(surface.calls).toEqual([]);
	});
});
