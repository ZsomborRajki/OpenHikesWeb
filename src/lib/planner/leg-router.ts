import type { Coordinate } from '#lib/general/geodesy.ts';

/**
 * Where the line between two stops goes.
 *
 * A port, as the iOS app's `TrailLegRouting` is: a router worth having asks a
 * service, and no suite may. `DirectLegRouter` answers with a straight line
 * today; a router over OpenStreetMap's paths, or Apple's walking directions,
 * takes its place without the planner changing.
 */
export interface LegRouter {
	/**
	 * The path from `from` to `to`, both ends included. Rejects when there is
	 * no answer to give, and the planner draws that leg straight.
	 */
	route(from: Coordinate, to: Coordinate): Promise<readonly Coordinate[]>;
}
