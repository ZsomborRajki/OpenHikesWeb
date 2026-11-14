<!--
	A button that is only a glyph. It always carries a label, because a glyph
	says nothing to a screen reader, and it is always a full tap target.
-->
<script lang="ts">
	import type { LucideIcon } from '@lucide/svelte';

	interface Props {
		label: string;
		icon: LucideIcon;
		tone?: 'standard' | 'destructive';
		disabled?: boolean;
		onclick: () => void;
	}

	let { label, icon: Icon, tone = 'standard', disabled = false, onclick }: Props = $props();
</script>

<button
	type="button"
	class="icon-button {tone}"
	aria-label={label}
	title={label}
	{disabled}
	{onclick}
>
	<Icon size={20} aria-hidden="true" />
</button>

<style>
	.icon-button {
		display: grid;
		place-items: center;
		width: var(--tap-target);
		height: var(--tap-target);
		border-radius: 50%;
		color: var(--accent);
		transition: background-color var(--duration-quick) ease-out;
	}

	.icon-button:disabled {
		opacity: 0.35;
	}

	.icon-button:hover:not(:disabled),
	.icon-button:active:not(:disabled) {
		background: var(--fill);
	}

	.destructive {
		color: var(--destructive);
	}
</style>
