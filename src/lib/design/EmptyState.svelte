<!-- What a screen says when it has nothing to list: what is missing, and what to do next. -->
<script lang="ts">
	import type { LucideIcon } from '@lucide/svelte';
	import type { Snippet } from 'svelte';

	interface Props {
		icon: LucideIcon;
		title: string;
		children: Snippet;
	}

	let { icon: Icon, title, children }: Props = $props();
</script>

<div class="empty">
	<Icon size={40} strokeWidth={1.5} aria-hidden="true" />
	<h2>{title}</h2>
	<p>{@render children()}</p>
</div>

<style>
	.empty {
		display: grid;
		justify-items: center;
		gap: var(--space-2);
		padding: var(--space-6) var(--space-4);
		color: var(--secondary-label);
		text-align: center;
	}

	h2 {
		color: var(--label);
		font: var(--text-headline);
	}

	p {
		font: var(--text-subheadline);
	}
</style>
