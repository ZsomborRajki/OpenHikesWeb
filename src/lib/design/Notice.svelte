<!-- Something went wrong, said where it happened. Announced when it appears. -->
<script lang="ts">
	import type { Snippet } from 'svelte';

	let { children }: { children: Snippet } = $props();
</script>

<p class="notice" role="alert">{@render children()}</p>

<style>
	.notice {
		padding: var(--space-3) var(--space-4);
		border-radius: var(--radius-control);
		background: var(--fill);
		color: var(--destructive);
		font: var(--text-subheadline);
	}
</style>
