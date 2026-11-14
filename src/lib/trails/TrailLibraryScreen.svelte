<!-- The first screen: every trail in the library, and the two ways to add one. -->
<script lang="ts">
	import Mountain from '@lucide/svelte/icons/mountain';
	import Route from '@lucide/svelte/icons/route';
	import ActionButton from '#lib/design/ActionButton.svelte';
	import ActionRow from '#lib/design/ActionRow.svelte';
	import EmptyState from '#lib/design/EmptyState.svelte';
	import GroupedList from '#lib/design/GroupedList.svelte';
	import Notice from '#lib/design/Notice.svelte';
	import Screen from '#lib/design/Screen.svelte';
	import ScreenHeader from '#lib/design/ScreenHeader.svelte';
	import GpxFileButton from './gpx/GpxFileButton.svelte';
	import type { Trail } from './trail.ts';
	import type { ImportProblem, LibraryStatus } from './trail-library.svelte.ts';
	import TrailRow from './TrailRow.svelte';

	interface Props {
		trails: readonly Trail[];
		status: LibraryStatus;
		planHref: string;
		trailHref: (trail: Trail) => string;
		onImport: (file: File) => void;
		/** What went wrong with the last import, when something did. */
		importProblem: ImportProblem | null;
	}

	let { trails, status, planHref, trailHref, onImport, importProblem }: Props = $props();

	const IMPORT_PROBLEMS: Readonly<Record<ImportProblem, string>> = {
		notOpened: 'That file could not be opened.',
		unreadable: 'That file is not a GPX file.',
		empty: 'That GPX file has no track in it.',
		notStored: 'The trail could not be stored in this browser.'
	};
</script>

<Screen>
	<ScreenHeader title="Trails" />

	<ActionRow>
		<ActionButton variant="prominent" href={planHref} icon={Route}>Plan a Trail</ActionButton>
		<GpxFileButton onPick={onImport} />
	</ActionRow>

	{#if importProblem !== null}<Notice>{IMPORT_PROBLEMS[importProblem]}</Notice>{/if}

	{#if status === 'unavailable'}
		<EmptyState icon={Mountain} title="Trails Cannot Be Kept">
			This browser is not letting the app store trails. Private browsing can do that.
		</EmptyState>
	{:else if status === 'ready' && trails.length === 0}
		<EmptyState icon={Mountain} title="No Trails Yet">
			Plan a trail on the map, or import a GPX file.
		</EmptyState>
	{:else if trails.length > 0}
		<GroupedList>
			{#each trails as trail (trail.id)}
				<TrailRow {trail} href={trailHref(trail)} />
			{/each}
		</GroupedList>
	{/if}
</Screen>
