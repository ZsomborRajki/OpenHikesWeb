import { describe, expect, it } from 'vitest';
import type { Coordinate } from '#lib/general/geodesy.ts';
import { legsBetween, lineThrough } from './draft-legs.ts';
import type { DraftStop } from './draft-stops.ts';

const A = { latitude: 0, longitude: 0 };
const B = { latitude: 0, longitude: 1 };
const C = { latitude: 1, longitude: 1 };

function stopsAt(...coordinates: Coordinate[]): DraftStop[] {
	return coordinates.map((coordinate, index) => ({ id: `stop-${String(index)}`, coordinate }));
}

describe('draft legs', () => {
	it('has a leg between each stop and the next', () => {
		const legs = legsBetween(stopsAt(A, B, C));

		expect(legs.map(({ from, to }) => [from, to])).toEqual([
			[A, B],
			[B, C]
		]);
	});

	it('knows a leg by its ends, whichever stops they belong to', () => {
		const [forward] = legsBetween(stopsAt(A, B));
		const [again] = legsBetween(stopsAt(C, A, B)).slice(1);
		const [backward] = legsBetween(stopsAt(B, A));

		expect(again?.key).toBe(forward?.key);
		expect(backward?.key).not.toBe(forward?.key);
	});

	it('draws a straight line through stops whose legs have no path', () => {
		expect(lineThrough(stopsAt(A, B, C), new Map())).toEqual([A, B, C]);
	});

	it('follows a leg along its path, and draws the shared stop once', () => {
		const stops = stopsAt(A, B, C);
		const [first] = legsBetween(stops);
		const detour = { latitude: -0.5, longitude: 0.5 };
		const paths = new Map([[first?.key ?? '', [A, detour, B]]]);

		expect(lineThrough(stops, paths)).toEqual([A, detour, B, C]);
	});

	it('draws one stop as a line of one point, and none as no line', () => {
		expect(lineThrough(stopsAt(A), new Map())).toEqual([A]);
		expect(lineThrough([], new Map())).toEqual([]);
	});
});
