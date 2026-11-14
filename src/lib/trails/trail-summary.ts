//
// A trail's figures, in the words the screens show them in.
//

import { formatDistance, formatDuration, formatElevation } from '#lib/general/formatting.ts';
import type { RouteStatistics } from './route-statistics.ts';
import type { Trail } from './trail.ts';

/** One figure with its caption: "Ascent", "640 m". */
export interface StatisticTile {
	readonly caption: string;
	readonly value: string;
}

/** A row's second line: "12.4 km · 640 m ascent". */
export function trailSummary(statistics: RouteStatistics, locale?: string): string {
	const distance = formatDistance(statistics.distanceMeters, locale);
	if (statistics.elevation === null) return distance;
	return `${distance} · ${formatElevation(statistics.elevation.gainMeters, locale)} ascent`;
}

/** Where a trail came from: "Planned trail · 4 stops", or "Imported trail". */
export function trailOrigin(trail: Trail): string {
	// A planned trail has two stops at least, so the count is always a plural.
	return trail.stops === undefined
		? 'Imported trail'
		: `Planned trail · ${String(trail.stops.length)} stops`;
}

/** The figures a trail has, in reading order. One it cannot know is left out, not shown as zero. */
export function statisticTiles(statistics: RouteStatistics, locale?: string): StatisticTile[] {
	const { distanceMeters, elevation, durationSeconds } = statistics;
	return [
		{ caption: 'Distance', value: formatDistance(distanceMeters, locale) },
		...(elevation === null
			? []
			: [
					{ caption: 'Ascent', value: formatElevation(elevation.gainMeters, locale) },
					{ caption: 'Descent', value: formatElevation(elevation.lossMeters, locale) },
					{ caption: 'Highest Point', value: formatElevation(elevation.maximumMeters, locale) }
				]),
		...(durationSeconds === null
			? []
			: [{ caption: 'Duration', value: formatDuration(durationSeconds, locale) }])
	];
}
