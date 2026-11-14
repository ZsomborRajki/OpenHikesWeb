import { describe, expect, it } from 'vitest';
import { withBreathingRoom } from './framing.ts';

describe('withBreathingRoom', () => {
	it('gives a subject room on every side, in proportion to its size', () => {
		const framed = withBreathingRoom({ south: 10, west: 20, north: 12, east: 24 });

		expect(framed.south).toBeCloseTo(9.7, 9);
		expect(framed.north).toBeCloseTo(12.3, 9);
		expect(framed.west).toBeCloseTo(19.4, 9);
		expect(framed.east).toBeCloseTo(24.6, 9);
	});

	it('gives a single point a frame with some size to it', () => {
		const framed = withBreathingRoom({ south: 47, west: 12, north: 47, east: 12 });

		expect(framed.north - framed.south).toBeCloseTo(0.01, 9);
		expect(framed.east - framed.west).toBeCloseTo(0.01, 9);
		expect((framed.north + framed.south) / 2).toBeCloseTo(47, 9);
	});

	it('stops at the poles', () => {
		const framed = withBreathingRoom({ south: -89.9, west: 0, north: 89.9, east: 1 });

		expect(framed.south).toBe(-90);
		expect(framed.north).toBe(90);
	});
});
