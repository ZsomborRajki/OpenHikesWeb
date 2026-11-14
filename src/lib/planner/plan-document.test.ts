import { describe, expect, it } from 'vitest';
import { decodePlan, encodePlan, PLAN_FORMAT, PLAN_VERSION, type Plan } from './plan-document.ts';

const PLAN: Plan = {
	title: 'Hochstaufen Traverse',
	stops: [
		{ latitude: 47.7145, longitude: 12.8461 },
		{ latitude: 47.7194, longitude: 12.8522 }
	]
};

function documentWith(overrides: Record<string, unknown>): string {
	return JSON.stringify({ ...(JSON.parse(encodePlan(PLAN)) as object), ...overrides });
}

describe('plan document', () => {
	it('reads back the plan it wrote', () => {
		expect(decodePlan(encodePlan(PLAN))).toEqual(PLAN);
	});

	it('writes its format and version, and nothing of a stop but its place', () => {
		const stop = { latitude: 1, longitude: 2, id: 'not part of the plan' };

		expect(JSON.parse(encodePlan({ title: 'T', stops: [stop] }))).toEqual({
			format: PLAN_FORMAT,
			version: PLAN_VERSION,
			title: 'T',
			stops: [{ latitude: 1, longitude: 2 }]
		});
	});

	it('reads a plan with no stops yet', () => {
		expect(decodePlan(encodePlan({ title: 'Just a name', stops: [] }))).toEqual({
			title: 'Just a name',
			stops: []
		});
	});

	it.each([
		['text that is not JSON', 'not a plan'],
		['JSON that is not an object', '[1, 2]'],
		['nothing', 'null'],
		['another format', documentWith({ format: 'something.else' })],
		['a later version', documentWith({ version: PLAN_VERSION + 1 })],
		['a title that is not text', documentWith({ title: 7 })],
		['stops that are not a list', documentWith({ stops: 'two' })],
		['a stop that is not an object', documentWith({ stops: [null] })],
		['a stop with no longitude', documentWith({ stops: [{ latitude: 1 }] })],
		['a stop off the globe', documentWith({ stops: [{ latitude: 91, longitude: 0 }] })]
	])('refuses %s', (_, text) => {
		expect(decodePlan(text)).toBeNull();
	});
});
