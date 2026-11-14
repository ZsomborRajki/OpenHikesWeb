const METERS_PER_KILOMETER = 1000;
const SECONDS_PER_HOUR = 3600;

/**
 * The iOS app's pace for a hiking leg: 4 km/h, not walking's 5, because a
 * path is not a pavement.
 */
const HIKING_KILOMETERS_PER_HOUR = 4;

/**
 * How long `distanceMeters` takes on foot, on the flat. The climb is not
 * counted, because a line drawn here has no heights to count.
 */
export function hikingSeconds(distanceMeters: number): number {
	return (distanceMeters / METERS_PER_KILOMETER / HIKING_KILOMETERS_PER_HOUR) * SECONDS_PER_HOUR;
}
