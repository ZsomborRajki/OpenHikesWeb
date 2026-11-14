//
// The arithmetic of the sketch map: a flat window onto the ground, true to
// scale at its own latitude. Good for a trail, wrong for a continent, and
// that is all the sketch is for.
//

import type { Bounds, Coordinate } from '#lib/general/geodesy.ts';
import type { Insets } from '../map-surface.ts';

export interface Size {
	readonly width: number;
	readonly height: number;
}

export interface Point {
	readonly x: number;
	readonly y: number;
}

/** Which ground the sketch shows, and where on the page it puts it. */
export interface Viewport {
	/** The coordinate drawn at `origin`. */
	readonly center: Coordinate;
	/** Where `center` lands, in pixels from the sketch's top left corner. */
	readonly origin: Point;
	readonly degreesOfLatitudePerPixel: number;
	/** A degree of longitude is shorter than one of latitude by this factor. */
	readonly longitudeScale: number;
}

const RADIANS_PER_DEGREE = Math.PI / 180;

/** The viewport that fits `bounds` inside the part of `size` that `insets` leave clear. */
export function viewportShowing(bounds: Bounds, size: Size, insets: Insets): Viewport {
	const clearWidth = Math.max(size.width - insets.left - insets.right, 1);
	const clearHeight = Math.max(size.height - insets.top - insets.bottom, 1);
	const center = {
		latitude: (bounds.south + bounds.north) / 2,
		longitude: (bounds.west + bounds.east) / 2
	};
	const longitudeScale = Math.cos(center.latitude * RADIANS_PER_DEGREE);
	return {
		center,
		origin: { x: insets.left + clearWidth / 2, y: insets.top + clearHeight / 2 },
		degreesOfLatitudePerPixel: Math.max(
			(bounds.north - bounds.south) / clearHeight,
			((bounds.east - bounds.west) * longitudeScale) / clearWidth
		),
		longitudeScale
	};
}

export function project(coordinate: Coordinate, viewport: Viewport): Point {
	const { center, origin, degreesOfLatitudePerPixel, longitudeScale } = viewport;
	return {
		x:
			origin.x +
			((coordinate.longitude - center.longitude) * longitudeScale) / degreesOfLatitudePerPixel,
		y: origin.y - (coordinate.latitude - center.latitude) / degreesOfLatitudePerPixel
	};
}

export function unproject(point: Point, viewport: Viewport): Coordinate {
	const { center, origin, degreesOfLatitudePerPixel, longitudeScale } = viewport;
	return {
		latitude: center.latitude - (point.y - origin.y) * degreesOfLatitudePerPixel,
		longitude:
			center.longitude + ((point.x - origin.x) * degreesOfLatitudePerPixel) / longitudeScale
	};
}
