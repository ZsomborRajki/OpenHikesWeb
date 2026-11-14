<!--
	The app's one window: the map edge to edge, and the panel over it.

	The only place that measures the window. The layout rule is
	`panelLayout`, and everything that depends on the shape of the window is
	handed the answer.
-->
<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { MapScene } from '#lib/map/map-scene.svelte.ts';
	import type { MapSurfaceFactory } from '#lib/map/map-surface.ts';
	import MapView from '#lib/map/MapView.svelte';
	import Panel from './Panel.svelte';
	import { mapInsets, PANEL_MARGIN, PANEL_WIDTH, panelLayout } from './panel-layout.ts';
	import type { Detent } from './sheet-detents.ts';

	interface Props {
		scene: MapScene;
		createMapSurface: MapSurfaceFactory;
		/** Names the screen in the panel; see `Panel`. */
		screenKey: string;
		children: Snippet;
	}

	let { scene, createMapSurface, screenKey, children }: Props = $props();

	let windowWidth = $state(window.innerWidth);
	let windowHeight = $state(window.innerHeight);
	let detent = $state<Detent>('medium');

	const layout = $derived(panelLayout({ width: windowWidth, height: windowHeight }));
	const insets = $derived(mapInsets(layout, detent, windowHeight));
</script>

<svelte:window bind:innerWidth={windowWidth} bind:innerHeight={windowHeight} />

<div class="shell" style:--panel-width="{PANEL_WIDTH}px" style:--panel-margin="{PANEL_MARGIN}px">
	<MapView {scene} createSurface={createMapSurface} {insets} />
	<Panel {layout} bind:detent {windowHeight} contentKey={screenKey}>
		{@render children()}
	</Panel>
</div>

<style>
	.shell {
		position: fixed;
		inset: 0;
		overflow: hidden;
	}
</style>
