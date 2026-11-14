import { describe, expect, it } from 'vitest';
import { aTrail } from './trail.fixtures.ts';
import { libraryMapContent, trailMapContent } from './trail-map-content.ts';

const NORTHERN = aTrail({
	id: 'northern',
	route: [
		{ latitude: 10, longitude: 5 },
		{ latitude: 11, longitude: 6 },
		{ latitude: 20, longitude: 20, startsSegment: true },
		{ latitude: 21, longitude: 21 }
	]
});
const EQUATORIAL = aTrail({ id: 'equatorial' });

describe('trail map content', () => {
	it('draws every trail of the library faded, and frames them together', () => {
		const content = libraryMapContent([NORTHERN, EQUATORIAL]);

		expect(content.lines.map((line) => [line.id, line.emphasis])).toEqual([
			['northern', 'faded'],
			['equatorial', 'faded']
		]);
		expect(content.frame).toEqual({ south: 0, west: 0, north: 21, east: 21 });
		expect(content.markers).toEqual([]);
		expect(content.onTap).toBeNull();
	});

	it('leaves the camera alone for an empty library', () => {
		expect(libraryMapContent([]).frame).toBeNull();
	});

	it('draws a line in its unbroken pieces', () => {
		const [line] = libraryMapContent([NORTHERN]).lines;

		expect(line?.pieces).toHaveLength(2);
	});

	it('draws the selected trail last, over the rest, and frames it alone', () => {
		const content = trailMapContent([EQUATORIAL, NORTHERN], EQUATORIAL);

		expect(content.lines.map((line) => [line.id, line.emphasis])).toEqual([
			['northern', 'faded'],
			['equatorial', 'primary']
		]);
		expect(content.frame).toEqual({ south: 0, west: 0, north: 0, east: 0.02 });
	});

	it('pins the stops of a planned trail, numbered in order', () => {
		const planned = aTrail({
			stops: [
				{ latitude: 0, longitude: 0 },
				{ latitude: 0, longitude: 0.02 }
			]
		});

		const { markers } = trailMapContent([planned], planned);

		expect(markers.map(({ glyph, label, coordinate }) => [glyph, label, coordinate])).toEqual([
			['1', 'Stop 1', { latitude: 0, longitude: 0 }],
			['2', 'Stop 2', { latitude: 0, longitude: 0.02 }]
		]);
		expect(new Set(markers.map((marker) => marker.id)).size).toBe(2);
	});

	it('pins nothing on an imported trail', () => {
		expect(trailMapContent([EQUATORIAL], EQUATORIAL).markers).toEqual([]);
	});
});
