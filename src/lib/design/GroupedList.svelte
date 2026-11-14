<!--
	An inset grouped list: rows on one rounded card, a hairline between them.
	The rows are the caller's own `<li>` elements.
-->
<script lang="ts">
	import type { Snippet } from 'svelte';

	interface Props {
		/** Numbered when the order is the point: the stops of a trail. */
		ordered?: boolean;
		children: Snippet;
	}

	let { ordered = false, children }: Props = $props();
</script>

<svelte:element this={ordered ? 'ol' : 'ul'} class="group">
	{@render children()}
</svelte:element>

<style>
	.group {
		overflow: hidden;
		border-radius: var(--radius-group);
		background: var(--group);
	}

	.group > :global(li + li) {
		border-top: 0.5px solid var(--separator);
	}
</style>
