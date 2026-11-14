<!--
	A trail's elevation along its length. Scrubbing it, by pointer or by the
	arrow keys, reads out the height at that point and reports where on the
	ground it is, which is how the dot on the map follows.

	The scrub is this component's own state. A pointer moving across the
	chart runs the chart and the map's dot, and nothing in between.
-->
<script lang="ts">
	import { formatDistance, formatElevation } from '#lib/general/formatting.ts';
	import type { Coordinate } from '#lib/general/geodesy.ts';
	import { chartGeometry, chartPoint, distanceAtX } from './elevation-chart-geometry.ts';
	import { sampleAt, type ProfileSample, type RouteProfile } from './route-profile.ts';

	interface Props {
		profile: RouteProfile;
		/** Where the scrub is on the ground, or `null` when it has ended. */
		onScrub: (coordinate: Coordinate | null) => void;
	}

	let { profile, onScrub }: Props = $props();

	const HEIGHT = 132;
	/** How far one press of an arrow key moves, as a share of the trail. */
	const KEY_STEP = 0.02;

	let width = $state(0);
	let scrubbed = $state.raw<ProfileSample | null>(null);

	const size = $derived({ width, height: HEIGHT });
	const length = $derived(profile.endMeters - profile.startMeters);
	const geometry = $derived(width > 0 ? chartGeometry(profile, size) : null);
	const marker = $derived(scrubbed === null ? null : chartPoint(profile, size, scrubbed));
	const readout = $derived(
		scrubbed === null
			? `${formatElevation(profile.minimumMeters)} to ${formatElevation(profile.maximumMeters)}`
			: `${formatDistance(scrubbed.distanceMeters - profile.startMeters)} · ${formatElevation(scrubbed.elevationMeters)}`
	);

	function scrubTo(distanceMeters: number): void {
		const clamped = Math.min(Math.max(distanceMeters, profile.startMeters), profile.endMeters);
		scrubbed = sampleAt(profile, clamped);
		onScrub(scrubbed.coordinate);
	}

	function endScrub(): void {
		scrubbed = null;
		onScrub(null);
	}

	function scrubToPointer(event: PointerEvent & { currentTarget: HTMLElement }): void {
		const x = event.clientX - event.currentTarget.getBoundingClientRect().left;
		scrubTo(distanceAtX(profile, size, x));
	}

	function scrubByKey(event: KeyboardEvent): void {
		const from = scrubbed?.distanceMeters ?? profile.startMeters;
		const step = length * KEY_STEP;
		// The keys a slider answers to: up is further along, as right is.
		const destinations: Record<string, number> = {
			ArrowRight: from + step,
			ArrowUp: from + step,
			ArrowLeft: from - step,
			ArrowDown: from - step,
			Home: profile.startMeters,
			End: profile.endMeters
		};
		const destination = destinations[event.key];
		if (destination === undefined) return;
		event.preventDefault();
		scrubTo(destination);
	}
</script>

<figure class="chart">
	<figcaption>
		<span class="caption">Elevation</span>
		<span class="readout">{readout}</span>
	</figcaption>
	<div
		class="plot"
		bind:clientWidth={width}
		role="slider"
		tabindex="0"
		aria-label="Position along the trail"
		aria-valuemin={0}
		aria-valuemax={Math.round(length)}
		aria-valuenow={Math.round(
			(scrubbed?.distanceMeters ?? profile.startMeters) - profile.startMeters
		)}
		aria-valuetext={readout}
		onpointerdown={scrubToPointer}
		onpointermove={scrubToPointer}
		onpointerleave={endScrub}
		onkeydown={scrubByKey}
		onblur={endScrub}
	>
		<svg {width} height={HEIGHT} aria-hidden="true">
			{#if geometry}
				<path class="area" d={geometry.area} />
				<path class="line" d={geometry.line} />
			{/if}
			{#if marker}
				<line class="rule" x1={marker.x} y1="0" x2={marker.x} y2={HEIGHT} />
				<circle class="dot" cx={marker.x} cy={marker.y} r="5" />
			{/if}
		</svg>
	</div>
</figure>

<style>
	.chart {
		display: grid;
		gap: var(--space-2);
		margin: 0;
		padding: var(--space-3) var(--space-4) var(--space-4);
		border-radius: var(--radius-group);
		background: var(--group);
	}

	figcaption {
		display: flex;
		align-items: baseline;
		justify-content: space-between;
		gap: var(--space-3);
	}

	.caption {
		color: var(--secondary-label);
		font: var(--text-caption);
	}

	.readout {
		font: var(--text-subheadline);
		font-variant-numeric: tabular-nums;
	}

	.plot {
		border-radius: var(--space-1);
		cursor: crosshair;

		/* A drag across the chart is a scrub, not a scroll of the panel. */
		touch-action: none;
	}

	svg {
		display: block;
		overflow: visible;
	}

	.area {
		fill: var(--accent);
		opacity: 0.18;
	}

	.line {
		fill: none;
		stroke: var(--accent);
		stroke-linejoin: round;
		stroke-width: 2px;
	}

	.rule {
		stroke: var(--secondary-label);
		stroke-width: 1px;
	}

	.dot {
		fill: var(--accent);
		stroke: var(--group);
		stroke-width: 2px;
	}
</style>
