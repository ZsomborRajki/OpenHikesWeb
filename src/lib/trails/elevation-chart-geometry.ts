//
// Where an elevation profile lands in a chart of a given size. Kept out of
// the component so the arithmetic is tested without a browser.
//

import { sampleAt, type ProfileSample, type RouteProfile } from './route-profile.ts';

export interface ChartSize {
	readonly width: number;
	readonly height: number;
}

export interface ChartPoint {
	readonly x: number;
	readonly y: number;
}

/** SVG path data for the profile's outline and for the fill under it. */
export interface ChartGeometry {
	readonly line: string;
	readonly area: string;
}

/**
 * How far apart the line is sampled, in pixels. The line is drawn from the
 * profile read at even steps, never from every point of the route, so a
 * 20,000-point recording costs the same to draw as a short walk.
 */
const COLUMN_SPACING = 2;
/** Room above the summit and below the valley, as a share of the climb between them. */
const HEADROOM_FRACTION = 0.1;
/** The least room either gets, so a flat trail is a line and not the chart's edge. */
const MINIMUM_HEADROOM_METERS = 5;

export function chartGeometry(profile: RouteProfile, size: ChartSize): ChartGeometry {
	const columns = Math.max(2, Math.round(size.width / COLUMN_SPACING));
	const span = profile.endMeters - profile.startMeters;
	const points = Array.from({ length: columns }, (_, column) => {
		const distance = profile.startMeters + (span * column) / (columns - 1);
		return chartPoint(profile, size, sampleAt(profile, distance));
	});

	const line = points
		.map(({ x, y }, index) => `${index === 0 ? 'M' : 'L'}${rounded(x)},${rounded(y)}`)
		.join(' ');
	const area = `${line} L${rounded(size.width)},${rounded(size.height)} L0,${rounded(size.height)} Z`;
	return { line, area };
}

/** Where `sample` is drawn. */
export function chartPoint(
	profile: RouteProfile,
	size: ChartSize,
	sample: ProfileSample
): ChartPoint {
	const span = profile.endMeters - profile.startMeters;
	const headroom = Math.max(
		(profile.maximumMeters - profile.minimumMeters) * HEADROOM_FRACTION,
		MINIMUM_HEADROOM_METERS
	);
	const floor = profile.minimumMeters - headroom;
	const ceiling = profile.maximumMeters + headroom;
	return {
		x: span === 0 ? 0 : ((sample.distanceMeters - profile.startMeters) / span) * size.width,
		y: ((ceiling - sample.elevationMeters) / (ceiling - floor)) * size.height
	};
}

/** The distance along the route under a pointer at `x`, kept inside the chart. */
export function distanceAtX(profile: RouteProfile, size: ChartSize, x: number): number {
	const fraction = size.width === 0 ? 0 : Math.min(Math.max(x / size.width, 0), 1);
	return profile.startMeters + (profile.endMeters - profile.startMeters) * fraction;
}

/** A tenth of a pixel is finer than a screen draws, and keeps the path short. */
function rounded(value: number): string {
	return String(Math.round(value * 10) / 10);
}
