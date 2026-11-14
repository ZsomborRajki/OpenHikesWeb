import type { Bounds } from '#lib/general/geodesy.ts';
import type { MapScene } from './map-scene.svelte.ts';
import type { Insets, MapSurface } from './map-surface.ts';

/**
 * Keeps `surface` showing what `scene` describes, until the returned function
 * is called.
 *
 * Three effects, so each kind of change reaches the engine alone: a scrub
 * moves the dot and redraws no line, and a panel that changes size moves the
 * insets and nothing else.
 */
export function syncScene(scene: MapScene, surface: MapSurface, insets: () => Insets): () => void {
	let framed: Bounds | null = null;

	return $effect.root(() => {
		// Declared first, so the first frame is taken inside the insets.
		$effect(() => {
			surface.setInsets(insets());
		});

		$effect(() => {
			const { lines, markers, frame, onTap } = scene.content;
			surface.setLines(lines);
			surface.setMarkers(markers);
			surface.setTapHandler(onTap);
			if (frame !== null && frame !== framed) surface.frame(frame);
			framed = frame;
		});

		$effect(() => {
			surface.setHighlight(scene.highlight);
		});
	});
}
