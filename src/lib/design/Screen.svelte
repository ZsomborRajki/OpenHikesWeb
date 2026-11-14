<!-- A screen's contents, stacked with the app's one rhythm. -->
<script lang="ts">
	import type { Snippet } from 'svelte';

	let { children }: { children: Snippet } = $props();
</script>

<div class="screen">{@render children()}</div>

<style>
	.screen {
		display: grid;
		gap: var(--space-4);
	}
</style>
