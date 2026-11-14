<!--
	Drawing a trail: a name, the stops in order, and what the line through
	them adds up to. The map adds stops; this screen arranges and saves them.
-->
<script lang="ts">
	import ActionButton from '#lib/design/ActionButton.svelte';
	import ActionRow from '#lib/design/ActionRow.svelte';
	import GroupedList from '#lib/design/GroupedList.svelte';
	import Notice from '#lib/design/Notice.svelte';
	import Screen from '#lib/design/Screen.svelte';
	import ScreenHeader from '#lib/design/ScreenHeader.svelte';
	import { formatDistance, formatDuration } from '#lib/general/formatting.ts';
	import { MAXIMUM_TITLE_LENGTH } from '#lib/trails/trail.ts';
	import StopRow from './StopRow.svelte';
	import type { TrailDraft } from './trail-draft.svelte.ts';
	import { hikingSeconds } from './walking-time.ts';

	interface Props {
		draft: TrailDraft;
		backHref: string;
		onSave: () => void;
		/** True while a save is on its way to the library. */
		isSaving: boolean;
		/** True once a save has been refused by the store. */
		hasSaveFailed: boolean;
	}

	let { draft, backHref, onSave, isSaving, hasSaveFailed }: Props = $props();

	const summary = $derived(
		`${formatDistance(draft.distanceMeters)} · about ${formatDuration(hikingSeconds(draft.distanceMeters))} on foot`
	);
</script>

<Screen>
	<ScreenHeader title="Plan a Trail" back={{ href: backHref, label: 'Trails' }} />

	<label class="field">
		<span class="caption">Name</span>
		<input
			type="text"
			placeholder="New Trail"
			maxlength={MAXIMUM_TITLE_LENGTH}
			autocomplete="off"
			bind:value={() => draft.title, (title) => draft.rename(title)}
		/>
	</label>

	{#if draft.stops.length === 0}
		<p class="hint">Tap or click the map to add a stop.</p>
	{:else}
		<GroupedList ordered>
			{#each draft.stops as stop, index (stop.id)}
				<StopRow
					{stop}
					{index}
					isFirst={index === 0}
					isLast={index === draft.stops.length - 1}
					onMove={(offset) => draft.moveStop(stop.id, offset)}
					onRemove={() => draft.removeStop(stop.id)}
				/>
			{/each}
		</GroupedList>
	{/if}

	{#if draft.canSave}
		<p class="summary">{summary}</p>
	{:else if draft.stops.length > 0}
		<p class="hint">Add another stop to make a trail.</p>
	{/if}

	{#if hasSaveFailed}<Notice>The trail could not be stored in this browser.</Notice>{/if}

	<ActionRow>
		<ActionButton variant="prominent" disabled={!draft.canSave || isSaving} onclick={onSave}>
			Save Trail
		</ActionButton>
		<ActionButton disabled={draft.stops.length === 0} onclick={() => draft.clear()}>
			Clear
		</ActionButton>
	</ActionRow>
</Screen>

<style>
	.field {
		display: grid;
		gap: var(--space-1);
	}

	.caption {
		padding-left: var(--space-4);
		color: var(--secondary-label);
		font: var(--text-caption);
	}

	input {
		min-height: var(--tap-target);
		padding: 0 var(--space-4);
		border: 0;
		border-radius: var(--radius-control);
		background: var(--group);
	}

	input::placeholder {
		color: var(--secondary-label);
	}

	.hint,
	.summary {
		padding: 0 var(--space-4);
		font: var(--text-subheadline);
	}

	.hint {
		color: var(--secondary-label);
	}

	.summary {
		font-variant-numeric: tabular-nums;
	}
</style>
