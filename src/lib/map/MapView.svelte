<!--
	The map on the page. It starts a map surface once, keeps it showing what
	the scene describes, and takes it down with the page.

	Nothing here reads the scene. `syncScene` does, in effects of its own, so
	a change to the map never runs this component again.
-->
<script lang="ts">
	import { onMount } from 'svelte';
	import type { MapScene } from './map-scene.svelte.ts';
	import type { Insets, MapSurfaceFactory } from './map-surface.ts';
	import { syncScene } from './scene-sync.svelte.ts';

	interface Props {
		scene: MapScene;
		createSurface: MapSurfaceFactory;
		/** The edges of the map that the panel covers. */
		insets: Insets;
	}

	let { scene, createSurface, insets }: Props = $props();

	let container = $state<HTMLDivElement>();
	let failed = $state(false);

	onMount(() => {
		if (container === undefined) return;
		let unmounted = false;
		let tearDown: (() => void) | null = null;

		createSurface(container).then(
			(surface) => {
				if (unmounted) {
					surface.destroy();
					return;
				}
				const stopSync = syncScene(scene, surface, () => insets);
				tearDown = () => {
					stopSync();
					surface.destroy();
				};
			},
			() => {
				failed = true;
			}
		);

		return () => {
			unmounted = true;
			tearDown?.();
		};
	});
</script>

<section class="map" aria-label="Map">
	<div class="surface" bind:this={container}></div>
	{#if failed}
		<p class="failure" role="alert">
			The map could not load. Check the connection and the map token.
		</p>
	{/if}
</section>

<style>
	.map,
	.surface {
		position: absolute;
		inset: 0;
	}

	.failure {
		position: absolute;
		top: var(--space-4);
		right: var(--space-4);
		max-width: 280px;
		padding: var(--space-3) var(--space-4);
		border-radius: var(--radius-group);
		background: var(--material);
		box-shadow: var(--shadow);
		font: var(--text-subheadline);
		backdrop-filter: var(--material-blur);
	}
</style>
