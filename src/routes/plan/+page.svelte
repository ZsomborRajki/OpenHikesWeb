<!-- The planner: a tap on the map adds a stop, and the panel arranges and saves them. -->
<script lang="ts">
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { useApp } from '#lib/app/app-context.ts';
	import { boundsOf } from '#lib/general/geodesy.ts';
	import { draftMapContent } from '#lib/planner/draft-map-content.ts';
	import PlannerScreen from '#lib/planner/PlannerScreen.svelte';

	const { draft, library, scene } = useApp();

	let isSaving = $state(false);
	let hasSaveFailed = $state(false);

	// The camera opens on a draft already in progress, and follows nothing
	// after that: a new stop must not move the map under the next tap.
	const openingFrame = boundsOf(draft.stops.map((stop) => stop.coordinate));

	$effect(() => {
		scene.show(
			draftMapContent(draft.stops, draft.line, openingFrame, (coordinate) => {
				draft.addStop(coordinate);
			})
		);
	});

	async function save(): Promise<void> {
		isSaving = true;
		const trail = await library.addPlanned({
			title: draft.title,
			stops: draft.plan.stops,
			route: draft.line
		});
		isSaving = false;
		hasSaveFailed = trail === null;
		if (trail === null) return;

		draft.clear();
		await goto(resolve('/trails/[id]', { id: trail.id }));
	}
</script>

<PlannerScreen
	{draft}
	backHref={resolve('/')}
	onSave={() => void save()}
	{isSaving}
	{hasSaveFailed}
/>
