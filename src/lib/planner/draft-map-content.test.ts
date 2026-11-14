import { describe, expect, it } from 'vitest';
import { draftMapContent } from './draft-map-content.ts';

const A = { latitude: 0, longitude: 0 };
const B = { latitude: 0, longitude: 1 };
const STOPS = [
	{ id: 'first', coordinate: A },
	{ id: 'second', coordinate: B }
];
const onTap = (): void => undefined;

describe('draftMapContent', () => {
	it('draws the line through the stops', () => {
		const content = draftMapContent(STOPS, [A, B], null, onTap);

		expect(content.lines).toEqual([{ id: 'draft', pieces: [[A, B]], emphasis: 'primary' }]);
	});

	it('draws no line through a single stop', () => {
		expect(draftMapContent(STOPS.slice(0, 1), [A], null, onTap).lines).toEqual([]);
	});

	it('pins each stop with its number', () => {
		const { markers } = draftMapContent(STOPS, [A, B], null, onTap);

		expect(markers).toEqual([
			{ id: 'first', coordinate: A, glyph: '1', label: 'Stop 1' },
			{ id: 'second', coordinate: B, glyph: '2', label: 'Stop 2' }
		]);
	});

	it('hands on the frame and the tap it was given', () => {
		const frame = { south: 0, west: 0, north: 0, east: 1 };

		const content = draftMapContent(STOPS, [A, B], frame, onTap);

		expect(content.frame).toBe(frame);
		expect(content.onTap).toBe(onTap);
	});
});
