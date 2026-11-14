import { describe, expect, it } from 'vitest';
import { NO_INSETS } from '../map-surface.ts';
import { project, unproject, viewportShowing } from './sketch-projection.ts';

const SIZE = { width: 1000, height: 600 };
/** A box on the equator, where a degree is as long east as it is north. */
const WIDE = { south: -1, west: -5, north: 1, east: 5 };
const TALL = { south: -5, west: -1, north: 5, east: 1 };

describe('sketch projection', () => {
	it('puts the middle of the bounds in the middle of the sheet', () => {
		const viewport = viewportShowing(WIDE, SIZE, NO_INSETS);

		expect(project({ latitude: 0, longitude: 0 }, viewport)).toEqual({ x: 500, y: 300 });
	});

	it('fits wide bounds to the width', () => {
		const viewport = viewportShowing(WIDE, SIZE, NO_INSETS);

		expect(project({ latitude: 0, longitude: -5 }, viewport).x).toBeCloseTo(0, 6);
		expect(project({ latitude: 0, longitude: 5 }, viewport).x).toBeCloseTo(1000, 6);
	});

	it('fits tall bounds to the height, north at the top', () => {
		const viewport = viewportShowing(TALL, SIZE, NO_INSETS);

		expect(project({ latitude: 5, longitude: 0 }, viewport).y).toBeCloseTo(0, 6);
		expect(project({ latitude: -5, longitude: 0 }, viewport).y).toBeCloseTo(600, 6);
	});

	it('keeps the bounds clear of the insets', () => {
		const insets = { top: 0, right: 0, bottom: 200, left: 400 };

		const viewport = viewportShowing(WIDE, SIZE, insets);

		expect(project({ latitude: 0, longitude: -5 }, viewport).x).toBeCloseTo(400, 6);
		expect(project({ latitude: 0, longitude: 5 }, viewport).x).toBeCloseTo(1000, 6);
		expect(project({ latitude: 0, longitude: 0 }, viewport).y).toBeCloseTo(200, 6);
	});

	it('draws a degree of longitude shorter away from the equator', () => {
		const northern = { south: 59, west: -1, north: 61, east: 1 };

		const viewport = viewportShowing(northern, SIZE, NO_INSETS);
		const eastward = project({ latitude: 60, longitude: 1 }, viewport).x - viewport.origin.x;
		const northward = viewport.origin.y - project({ latitude: 61, longitude: 0 }, viewport).y;

		expect(eastward / northward).toBeCloseTo(0.5, 6);
	});

	it('reads a point back as the coordinate drawn there', () => {
		const viewport = viewportShowing(WIDE, SIZE, { top: 10, right: 20, bottom: 30, left: 40 });
		const coordinate = { latitude: 0.4, longitude: -3.2 };

		const roundTrip = unproject(project(coordinate, viewport), viewport);

		expect(roundTrip.latitude).toBeCloseTo(coordinate.latitude, 9);
		expect(roundTrip.longitude).toBeCloseTo(coordinate.longitude, 9);
	});

	it('survives a sheet with no room left', () => {
		const viewport = viewportShowing(
			WIDE,
			{ width: 100, height: 100 },
			{
				top: 80,
				right: 80,
				bottom: 80,
				left: 80
			}
		);

		expect(Number.isFinite(viewport.degreesOfLatitudePerPixel)).toBe(true);
	});
});
