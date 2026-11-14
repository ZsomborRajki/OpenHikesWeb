<!-- One trail in the library list. The whole row is the link, read as one name. -->
<script lang="ts">
	import ChevronRight from '@lucide/svelte/icons/chevron-right';
	import { routeStatistics } from './route-statistics.ts';
	import type { Trail } from './trail.ts';
	import { trailSummary } from './trail-summary.ts';

	interface Props {
		trail: Trail;
		href: string;
	}

	let { trail, href }: Props = $props();

	const summary = $derived(trailSummary(routeStatistics(trail.route)));
</script>

<li>
	<a class="row" {href}>
		<span class="text">
			<span class="title">{trail.title}</span>
			<span class="summary">{summary}</span>
		</span>
		<span class="chevron"><ChevronRight size={18} aria-hidden="true" /></span>
	</a>
</li>

<style>
	.row {
		display: flex;
		align-items: center;
		gap: var(--space-3);
		min-height: 60px;
		padding: var(--space-2) var(--space-3) var(--space-2) var(--space-4);
		transition: background-color var(--duration-quick) ease-out;
	}

	.row:hover,
	.row:active {
		background: var(--fill);
	}

	/* The outline would be clipped by the list's rounded corners. */
	.row:focus-visible {
		outline-offset: -3px;
		border-radius: var(--radius-group);
	}

	.text {
		display: grid;
		flex: 1;
		gap: 2px;
		min-width: 0;
	}

	.title {
		overflow: hidden;
		font: var(--text-headline);
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.summary {
		color: var(--secondary-label);
		font: var(--text-subheadline);
	}

	.chevron {
		display: grid;
		color: var(--secondary-label);
	}
</style>
