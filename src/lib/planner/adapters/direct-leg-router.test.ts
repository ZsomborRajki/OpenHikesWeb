import { describe, expect, it } from 'vitest';
import { DirectLegRouter } from './direct-leg-router.ts';

describe('DirectLegRouter', () => {
	it('goes straight from one stop to the next', async () => {
		const from = { latitude: 0, longitude: 0 };
		const to = { latitude: 1, longitude: 1 };

		expect(await new DirectLegRouter().route(from, to)).toEqual([from, to]);
	});
});
