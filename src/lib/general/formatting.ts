//
// Figures as the reader's locale writes them. Every screen formats through
// here, so a distance reads the same in a list, a statistic and a chart.
//
// `locale` is a parameter only so a test can pin it; screens leave it out and
// get the browser's.
//

import type { Coordinate } from './geodesy.ts';

const METERS_PER_KILOMETER = 1000;
const SECONDS_PER_MINUTE = 60;
const MINUTES_PER_HOUR = 60;
/** Past this a tenth of a kilometer is noise. */
const WHOLE_KILOMETERS_FROM = 100;
const COORDINATE_FRACTION_DIGITS = 4;

/** "850 m" below a kilometer, "12.4 km" above. */
export function formatDistance(meters: number, locale?: string): string {
	// The unit is chosen by the figure that is written, so 999.6 m is "1 km" and never "1,000 m".
	const wholeMeters = Math.round(meters);
	if (wholeMeters < METERS_PER_KILOMETER) return formatUnit(wholeMeters, 'meter', 0, locale);
	const kilometers = meters / METERS_PER_KILOMETER;
	return formatUnit(kilometers, 'kilometer', kilometers < WHOLE_KILOMETERS_FROM ? 1 : 0, locale);
}

/** A height or a climb, in whole meters: "1,240 m". */
export function formatElevation(meters: number, locale?: string): string {
	return formatUnit(Math.round(meters), 'meter', 0, locale);
}

/** "45 min" below an hour, "2 hr 5 min" above, and "2 hr" on the hour. */
export function formatDuration(seconds: number, locale?: string): string {
	const totalMinutes = Math.round(seconds / SECONDS_PER_MINUTE);
	const hours = Math.floor(totalMinutes / MINUTES_PER_HOUR);
	const minutes = totalMinutes % MINUTES_PER_HOUR;
	if (hours === 0) return formatUnit(minutes, 'minute', 0, locale);
	if (minutes === 0) return formatUnit(hours, 'hour', 0, locale);
	return `${formatUnit(hours, 'hour', 0, locale)} ${formatUnit(minutes, 'minute', 0, locale)}`;
}

/**
 * Latitude then longitude, in decimal degrees: "47.5521, 11.8743". Four
 * decimals is about ten meters, and short enough for a row in the panel.
 */
export function formatCoordinate({ latitude, longitude }: Coordinate): string {
	return `${latitude.toFixed(COORDINATE_FRACTION_DIGITS)}, ${longitude.toFixed(COORDINATE_FRACTION_DIGITS)}`;
}

function formatUnit(
	value: number,
	unit: 'meter' | 'kilometer' | 'minute' | 'hour',
	fractionDigits: number,
	locale: string | undefined
): string {
	return new Intl.NumberFormat(locale, {
		style: 'unit',
		unit,
		unitDisplay: 'short',
		maximumFractionDigits: fractionDigits
	}).format(value);
}
