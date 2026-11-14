<!-- A trail's figures as tiles: a caption over each value. -->
<script lang="ts">
	import type { RouteStatistics } from './route-statistics.ts';
	import { statisticTiles } from './trail-summary.ts';

	let { statistics }: { statistics: RouteStatistics } = $props();

	const tiles = $derived(statisticTiles(statistics));
</script>

<dl class="tiles">
	{#each tiles as tile (tile.caption)}
		<div class="tile">
			<dt>{tile.caption}</dt>
			<dd>{tile.value}</dd>
		</div>
	{/each}
</dl>

<style>
	.tiles {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: var(--space-2);
		margin: 0;
	}

	.tile {
		display: grid;
		gap: 2px;
		padding: var(--space-3) var(--space-4);
		border-radius: var(--radius-group);
		background: var(--group);
	}

	dt {
		color: var(--secondary-label);
		font: var(--text-caption);
	}

	dd {
		font: var(--text-headline);
		font-variant-numeric: tabular-nums;
	}
</style>
