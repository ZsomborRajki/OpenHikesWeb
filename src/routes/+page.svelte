<!-- The library: every trail on the map and in the list. -->
<script lang="ts">
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { useApp } from '#lib/app/app-context.ts';
	import type { ImportProblem } from '#lib/trails/trail-library.svelte.ts';
	import { libraryMapContent } from '#lib/trails/trail-map-content.ts';
	import TrailLibraryScreen from '#lib/trails/TrailLibraryScreen.svelte';

	const { library, scene } = useApp();

	let importProblem = $state<ImportProblem | null>(null);

	$effect(() => {
		scene.show(libraryMapContent(library.trails));
	});

	async function importGpx(file: File): Promise<void> {
		const outcome = await library.importGpx(file);
		importProblem = outcome.ok ? null : outcome.problem;
		if (outcome.ok) await goto(resolve('/trails/[id]', { id: outcome.trail.id }));
	}
</script>

<TrailLibraryScreen
	trails={library.trails}
	status={library.status}
	planHref={resolve('/plan')}
	trailHref={(trail) => resolve('/trails/[id]', { id: trail.id })}
	onImport={(file) => void importGpx(file)}
	{importProblem}
/>
