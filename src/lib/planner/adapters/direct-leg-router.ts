import type { Coordinate } from '#lib/general/geodesy.ts';
import type { LegRouter } from '../leg-router.ts';

/** The straight line between two stops. What the iOS app calls drawing freehand. */
export class DirectLegRouter implements LegRouter {
	route(from: Coordinate, to: Coordinate): Promise<readonly Coordinate[]> {
		return Promise.resolve([from, to]);
	}
}
