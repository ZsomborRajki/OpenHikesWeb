<!--
	The top of a screen: the way back, and a large title.

	The title names the page as well. Every screen is one page to the browser,
	and a page's name is what a tab and a history entry show, and what a
	screen reader is told when a link has taken it somewhere new.
-->
<script lang="ts">
	import ChevronLeft from '@lucide/svelte/icons/chevron-left';

	interface Props {
		title: string;
		subtitle?: string;
		/** Where the screen came from. Left out on the first screen. */
		back?: { readonly href: string; readonly label: string };
	}

	let { title, subtitle, back }: Props = $props();
</script>

<svelte:head>
	<title>{title} · OpenHikes</title>
</svelte:head>

<header class="header">
	{#if back}
		<a class="back" href={back.href}>
			<ChevronLeft size={20} aria-hidden="true" />
			<span>{back.label}</span>
		</a>
	{/if}
	<h1>{title}</h1>
	{#if subtitle}<p class="subtitle">{subtitle}</p>{/if}
</header>

<style>
	.header {
		display: grid;
		gap: var(--space-1);
	}

	.back {
		display: inline-flex;
		align-items: center;
		justify-self: start;
		min-height: var(--tap-target);

		/* Pulls the chevron out to the edge the title starts at. */
		margin-left: -6px;
		padding-right: var(--space-2);
		color: var(--accent);
		font: var(--text-body);
	}

	h1 {
		font: var(--text-large-title);
		letter-spacing: -0.02em;
		overflow-wrap: anywhere;
	}

	.subtitle {
		color: var(--secondary-label);
		font: var(--text-subheadline);
	}
</style>
