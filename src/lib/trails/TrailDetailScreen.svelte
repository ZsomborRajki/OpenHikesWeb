<!-- One trail: its figures, its elevation, and the two things to do with it. -->
<script lang="ts">
	import Download from '@lucide/svelte/icons/download';
	import Trash2 from '@lucide/svelte/icons/trash-2';
	import ActionButton from '#lib/design/ActionButton.svelte';
	import ActionRow from '#lib/design/ActionRow.svelte';
	import ConfirmDialog from '#lib/design/ConfirmDialog.svelte';
	import Notice from '#lib/design/Notice.svelte';
	import Screen from '#lib/design/Screen.svelte';
	import ScreenHeader from '#lib/design/ScreenHeader.svelte';
	import type { Coordinate } from '#lib/general/geodesy.ts';
	import ElevationChart from './ElevationChart.svelte';
	import { routeProfile } from './route-profile.ts';
	import { routeStatistics } from './route-statistics.ts';
	import type { Trail } from './trail.ts';
	import { trailOrigin } from './trail-summary.ts';
	import TrailStatistics from './TrailStatistics.svelte';

	interface Props {
		trail: Trail;
		backHref: string;
		onExport: () => void;
		onDelete: () => void;
		onScrub: (coordinate: Coordinate | null) => void;
		/** True once a delete has been refused by the store. */
		hasDeleteFailed: boolean;
	}

	let { trail, backHref, onExport, onDelete, onScrub, hasDeleteFailed }: Props = $props();

	let isConfirmingDelete = $state(false);

	const statistics = $derived(routeStatistics(trail.route));
	const profile = $derived(routeProfile(trail.route));
</script>

<Screen>
	<ScreenHeader
		title={trail.title}
		subtitle={trailOrigin(trail)}
		back={{ href: backHref, label: 'Trails' }}
	/>

	<TrailStatistics {statistics} />

	{#if profile !== null}
		<ElevationChart {profile} {onScrub} />
	{/if}

	{#if hasDeleteFailed}<Notice>The trail could not be deleted.</Notice>{/if}

	<ActionRow>
		<ActionButton icon={Download} onclick={onExport}>Export GPX</ActionButton>
		<ActionButton variant="destructive" icon={Trash2} onclick={() => (isConfirmingDelete = true)}>
			Delete
		</ActionButton>
	</ActionRow>
</Screen>

<ConfirmDialog
	bind:open={isConfirmingDelete}
	title="Delete “{trail.title}”?"
	message="The trail is removed from this browser."
	confirmLabel="Delete"
	onConfirm={onDelete}
/>
