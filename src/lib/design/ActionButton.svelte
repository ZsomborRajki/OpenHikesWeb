<!--
	A capsule button with words on it. A link when it goes somewhere, a button
	when it does something, and the same to look at either way.
-->
<script lang="ts">
	import type { LucideIcon } from '@lucide/svelte';
	import type { Snippet } from 'svelte';

	interface Props {
		/** `prominent` for the one thing a screen is for. */
		variant?: 'prominent' | 'standard' | 'destructive';
		href?: string;
		disabled?: boolean;
		icon?: LucideIcon;
		onclick?: () => void;
		children: Snippet;
	}

	let {
		variant = 'standard',
		href,
		disabled = false,
		icon: Icon,
		onclick,
		children
	}: Props = $props();
</script>

{#snippet content()}
	{#if Icon}<Icon size={18} aria-hidden="true" />{/if}
	<span>{@render children()}</span>
{/snippet}

{#if href !== undefined}
	<a class="button {variant}" {href}>{@render content()}</a>
{:else}
	<button type="button" class="button {variant}" {disabled} {onclick}>{@render content()}</button>
{/if}

<style>
	.button {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		gap: var(--space-2);
		min-height: var(--tap-target);
		padding: 0 var(--space-4);
		border-radius: 999px;
		background: var(--fill);
		color: var(--accent);
		font: var(--text-headline);
		white-space: nowrap;
		transition:
			background-color var(--duration-quick) ease-out,
			transform var(--duration-quick) ease-out;
	}

	.button:disabled {
		opacity: 0.45;
	}

	.button:active:not(:disabled) {
		background: var(--fill-pressed);
		transform: scale(0.97);
	}

	.prominent {
		background: var(--accent);
		color: var(--on-accent);
	}

	.prominent:active:not(:disabled) {
		background: var(--accent);
		filter: brightness(0.92);
	}

	.destructive {
		color: var(--destructive);
	}
</style>
