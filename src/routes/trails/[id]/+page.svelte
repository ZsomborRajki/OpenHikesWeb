<!-- One trail: drawn over the rest of the library, with its figures in the panel. -->
<script lang="ts">
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { useApp } from '#lib/app/app-context.ts';
	import { gpxFile } from '#lib/trails/gpx/gpx-writer.ts';
	import MissingTrailScreen from '#lib/trails/MissingTrailScreen.svelte';
	import { libraryMapContent, trailMapContent } from '#lib/trails/trail-map-content.ts';
	import TrailDetailScreen from '#lib/trails/TrailDetailScreen.svelte';
	import type { PageProps } from './$types';

	let { params }: PageProps = $props();

	const { library, scene, files } = useApp();

	const trail = $derived(library.find(params.id));
	let hasDeleteFailed = $state(false);
	/** True from a delete to the navigation after it, so the trail is not "not found" in between. */
	let isLeaving = $state(false);

	$effect(() => {
		scene.show(
			trail === undefined
				? libraryMapContent(library.trails)
				: trailMapContent(library.trails, trail)
		);
	});

	async function deleteTrail(id: string): Promise<void> {
		isLeaving = true;
		hasDeleteFailed = !(await library.remove(id));
		if (hasDeleteFailed) isLeaving = false;
		else await goto(resolve('/'));
	}
</script>

{#if trail !== undefined}
	<TrailDetailScreen
		{trail}
		backHref={resolve('/')}
		onExport={() => files.save(gpxFile(trail))}
		onDelete={() => void deleteTrail(trail.id)}
		onScrub={(coordinate) => scene.highlightAt(coordinate)}
		{hasDeleteFailed}
	/>
{:else if library.status !== 'loading' && !isLeaving}
	<MissingTrailScreen backHref={resolve('/')} />
{/if}
