import { describe, expect, it } from 'vitest';
import { ElevationAccumulator, type ElevationChange } from './elevation-change.ts';

function changeOver(elevations: readonly (number | undefined)[]): ElevationChange | null {
	const accumulator = new ElevationAccumulator();
	for (const elevation of elevations) accumulator.record(elevation);
	return accumulator.change;
}

describe('ElevationAccumulator', () => {
	it('has no change to report for a single height', () => {
		expect(changeOver([500])).toBeNull();
	});

	it('counts a steady climb', () => {
		expect(changeOver([100, 130, 170, 200])).toEqual({
			gainMeters: 100,
			lossMeters: 0,
			minimumMeters: 100,
			maximumMeters: 200
		});
	});

	it('counts a climb and the descent after it', () => {
		const change = changeOver([100, 150, 120]);

		expect(change?.gainMeters).toBe(50);
		expect(change?.lossMeters).toBe(30);
	});

	it('counts a descent and the climb after it', () => {
		const change = changeOver([200, 150, 180]);

		expect(change?.lossMeters).toBe(50);
		expect(change?.gainMeters).toBe(30);
	});

	it('does not read a dip under the threshold as a descent', () => {
		const change = changeOver([100, 110, 108, 115]);

		expect(change?.gainMeters).toBe(15);
		expect(change?.lossMeters).toBe(0);
	});

	it('bounds sensor noise to its own size, however long it goes on', () => {
		const wobble = Array.from({ length: 2000 }, (_, index) => (index % 2 === 0 ? 500 : 501.5));

		const change = changeOver(wobble);

		expect(change?.gainMeters).toBe(1.5);
		expect(change?.lossMeters).toBe(0);
	});

	it('skips a point with no height, and a height that is not a number', () => {
		const change = changeOver([
			undefined,
			Number.NaN,
			100,
			undefined,
			120,
			Number.POSITIVE_INFINITY
		]);

		expect(change).toEqual({
			gainMeters: 20,
			lossMeters: 0,
			minimumMeters: 100,
			maximumMeters: 120
		});
	});

	it('counts no climb across a run that was ended', () => {
		const accumulator = new ElevationAccumulator();
		accumulator.record(100);
		accumulator.record(150);
		accumulator.endRun();
		accumulator.record(300);
		accumulator.record(310);

		expect(accumulator.change?.gainMeters).toBe(60);
		expect(accumulator.change?.maximumMeters).toBe(310);
	});

	it('counts a descent in progress', () => {
		expect(changeOver([200, 150])?.lossMeters).toBe(50);
	});
});
