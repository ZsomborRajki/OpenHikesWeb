<!--
	An alert that asks before something that cannot be undone. A native
	`<dialog>`, so the browser traps focus in it and Escape cancels.
-->
<script lang="ts">
	import ActionButton from './ActionButton.svelte';

	interface Props {
		open: boolean;
		title: string;
		message: string;
		confirmLabel: string;
		onConfirm: () => void;
	}

	let { open = $bindable(), title, message, confirmLabel, onConfirm }: Props = $props();

	const id = $props.id();

	let dialog = $state<HTMLDialogElement>();

	$effect(() => {
		if (open) dialog?.showModal();
		else dialog?.close();
	});

	function confirm(): void {
		open = false;
		onConfirm();
	}
</script>

<dialog
	bind:this={dialog}
	aria-labelledby="{id}-title"
	aria-describedby="{id}-message"
	onclose={() => (open = false)}
>
	<h2 id="{id}-title">{title}</h2>
	<p id="{id}-message">{message}</p>
	<div class="choices">
		<ActionButton onclick={() => (open = false)}>Cancel</ActionButton>
		<ActionButton variant="destructive" onclick={confirm}>{confirmLabel}</ActionButton>
	</div>
</dialog>

<style>
	dialog {
		width: min(320px, calc(100vw - 2 * var(--space-6)));
		padding: var(--space-5);
		border: 0;
		border-radius: var(--radius-panel);
		background: var(--material);
		box-shadow: var(--shadow);
		color: var(--label);
		text-align: center;
		backdrop-filter: var(--material-blur);
	}

	dialog::backdrop {
		background: var(--scrim);
	}

	h2 {
		font: var(--text-headline);
		overflow-wrap: anywhere;
	}

	p {
		margin-top: var(--space-1);
		color: var(--secondary-label);
		font: var(--text-footnote);
	}

	.choices {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: var(--space-2);
		margin-top: var(--space-4);
	}
</style>
