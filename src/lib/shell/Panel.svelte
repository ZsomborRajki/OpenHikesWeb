<!--
	The glass surface every screen is drawn on: a panel beside the map, or a
	sheet over it that rests at detents and follows a drag on its grabber.

	One element in both layouts. A window resized across the breakpoint
	restyles the panel and leaves the screen inside mounted, with whatever it
	was in the middle of.

	The drag is state of this component alone. A sheet following a finger
	runs nothing but this component's own style.
-->
<script lang="ts">
	import { untrack, type Snippet } from 'svelte';
	import type { PanelLayout } from './panel-layout.ts';
	import { detentHeight, nearestDetent, nextDetent, type Detent } from './sheet-detents.ts';

	interface Props {
		layout: PanelLayout;
		detent: Detent;
		windowHeight: number;
		/** Names the screen inside. A new screen starts at its top. */
		contentKey: string;
		children: Snippet;
	}

	let { layout, detent = $bindable(), windowHeight, contentKey, children }: Props = $props();

	/** How far a pointer travels before a press on the grabber is a drag and not a tap. */
	const DRAG_THRESHOLD = 4;

	interface Drag {
		readonly startY: number;
		readonly startHeight: number;
		readonly height: number;
		readonly moved: boolean;
	}

	let drag = $state.raw<Drag | null>(null);
	/** A drag ends in a click event too. This is how that click is told from a tap. */
	let endedInDrag = false;
	let content = $state<HTMLDivElement>();
	/** The screen last shown, so a new screen can be told from the same one redrawn. */
	let shownKey = untrack(() => contentKey);

	const height = $derived(drag?.height ?? detentHeight(detent, windowHeight));

	$effect(() => {
		if (contentKey === shownKey) return;
		shownKey = contentKey;
		content?.scrollTo({ top: 0 });
	});

	function beginDrag(event: PointerEvent & { currentTarget: HTMLButtonElement }): void {
		event.currentTarget.setPointerCapture(event.pointerId);
		endedInDrag = false;
		drag = { startY: event.clientY, startHeight: height, height, moved: false };
	}

	function continueDrag(event: PointerEvent): void {
		if (drag === null) return;
		const travel = drag.startY - event.clientY;
		const lowest = detentHeight('compact', windowHeight);
		const highest = detentHeight('large', windowHeight);
		drag = {
			...drag,
			height: Math.min(Math.max(drag.startHeight + travel, lowest), highest),
			moved: drag.moved || Math.abs(travel) > DRAG_THRESHOLD
		};
	}

	function endDrag(): void {
		if (drag === null) return;
		if (drag.moved) {
			detent = nearestDetent(drag.height, windowHeight);
			endedInDrag = true;
		}
		drag = null;
	}

	/** A tap on the grabber, or Enter on it: the next detent up. */
	function stepDetent(): void {
		if (endedInDrag) {
			endedInDrag = false;
			return;
		}
		detent = nextDetent(detent);
	}
</script>

<main
	class="panel"
	class:dragging={drag !== null}
	data-layout={layout}
	style:height={layout === 'bottomSheet' ? `${String(height)}px` : null}
>
	{#if layout === 'bottomSheet'}
		<button
			type="button"
			class="grabber"
			aria-label="Resize panel"
			onpointerdown={beginDrag}
			onpointermove={continueDrag}
			onpointerup={endDrag}
			onpointercancel={endDrag}
			onclick={stepDetent}
		></button>
	{/if}
	<div class="content" bind:this={content}>
		{@render children()}
	</div>
</main>

<style>
	.panel {
		position: absolute;
		display: flex;
		flex-direction: column;
		border: 0.5px solid var(--material-edge);
		background: var(--material);
		box-shadow: var(--shadow);
		backdrop-filter: var(--material-blur);
	}

	.panel[data-layout='sidePanel'] {
		top: var(--panel-margin);
		bottom: var(--panel-margin);
		left: var(--panel-margin);
		width: var(--panel-width);
		border-radius: var(--radius-panel);
	}

	.panel[data-layout='bottomSheet'] {
		right: 0;
		bottom: 0;
		left: 0;
		border-bottom: 0;
		border-radius: var(--radius-panel) var(--radius-panel) 0 0;
		transition: height var(--duration-settle) var(--ease-spring);
	}

	/* A sheet under a finger keeps up with it; the spring is for letting go. */
	.panel.dragging {
		transition: none;
	}

	.grabber {
		display: grid;
		flex: none;
		place-items: center;
		width: 100%;
		height: 32px;
		border-radius: var(--radius-panel) var(--radius-panel) 0 0;
		cursor: grab;

		/* The drag is the sheet's, not the page's to scroll. */
		touch-action: none;
	}

	.grabber::before {
		width: 36px;
		height: 5px;
		border-radius: 3px;
		background: var(--secondary-label);
		content: '';
		opacity: 0.5;
	}

	.content {
		flex: 1;
		min-height: 0;
		padding: var(--space-5) var(--space-4) calc(var(--space-5) + env(safe-area-inset-bottom));
		overflow-y: auto;
		overscroll-behavior: contain;
	}

	.panel[data-layout='bottomSheet'] .content {
		padding-top: 0;
	}
</style>
