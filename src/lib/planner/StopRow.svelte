<!-- One stop of the trail being drawn: where it is, and the buttons that move or remove it. -->
<script lang="ts">
	import ArrowDown from '@lucide/svelte/icons/arrow-down';
	import ArrowUp from '@lucide/svelte/icons/arrow-up';
	import X from '@lucide/svelte/icons/x';
	import IconButton from '#lib/design/IconButton.svelte';
	import { formatCoordinate } from '#lib/general/formatting.ts';
	import { stopLabel } from '#lib/trails/trail.ts';
	import type { DraftStop } from './draft-stops.ts';

	interface Props {
		stop: DraftStop;
		index: number;
		isFirst: boolean;
		isLast: boolean;
		/** Moves the stop along the trail: -1 is one earlier. */
		onMove: (offset: number) => void;
		onRemove: () => void;
	}

	let { stop, index, isFirst, isLast, onMove, onRemove }: Props = $props();

	const label = $derived(stopLabel(index));
</script>

<li class="row">
	<span class="number" aria-hidden="true">{index + 1}</span>
	<span class="text">
		<span class="label">{label}</span>
		<span class="position">{formatCoordinate(stop.coordinate)}</span>
	</span>
	<IconButton
		label="Move {label} earlier"
		icon={ArrowUp}
		disabled={isFirst}
		onclick={() => onMove(-1)}
	/>
	<IconButton
		label="Move {label} later"
		icon={ArrowDown}
		disabled={isLast}
		onclick={() => onMove(1)}
	/>
	<IconButton label="Remove {label}" icon={X} tone="destructive" onclick={onRemove} />
</li>

<style>
	.row {
		display: flex;
		align-items: center;
		min-height: 60px;
		padding: var(--space-2) var(--space-1) var(--space-2) var(--space-3);
	}

	.number {
		display: grid;
		flex: none;
		place-items: center;
		width: 28px;
		height: 28px;
		margin-right: var(--space-3);
		border-radius: 50%;
		background: var(--accent);
		color: var(--on-accent);
		font: var(--text-caption);
		font-weight: 700;
	}

	.text {
		display: grid;
		flex: 1;
		gap: 2px;
		min-width: 0;
	}

	.label {
		font: var(--text-headline);
	}

	.position {
		overflow: hidden;
		color: var(--secondary-label);
		font: var(--text-footnote);
		font-variant-numeric: tabular-nums;
		text-overflow: ellipsis;
		white-space: nowrap;
	}
</style>
