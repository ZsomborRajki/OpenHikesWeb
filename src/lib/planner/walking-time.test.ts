import { describe, expect, it } from 'vitest';
import { hikingSeconds } from './walking-time.ts';

describe('hikingSeconds', () => {
	it('walks four kilometers in an hour', () => {
		expect(hikingSeconds(4000)).toBe(3600);
	});

	it('takes no time to go nowhere', () => {
		expect(hikingSeconds(0)).toBe(0);
	});
});
