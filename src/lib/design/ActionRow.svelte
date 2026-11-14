<!-- A screen's buttons, side by side, wrapping when the panel is narrow. -->
<script lang="ts">
	import type { Snippet } from 'svelte';

	let { children }: { children: Snippet } = $props();
</script>

<div class="actions">{@render children()}</div>

<style>
	.actions {
		display: flex;
		flex-wrap: wrap;
		gap: var(--space-2);
	}
</style>
