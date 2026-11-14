import { describe, expect, it } from 'vitest';
import { adjacentPairs } from './sequences.ts';

describe('adjacentPairs', () => {
	it('pairs each element with the next', () => {
		expect([...adjacentPairs(['a', 'b', 'c'])]).toEqual([
			['a', 'b'],
			['b', 'c']
		]);
	});

	it.each([[[]], [['only']]])('has no pairs in %j', (elements) => {
		expect([...adjacentPairs(elements)]).toEqual([]);
	});

	it('pairs elements that are undefined', () => {
		expect([...adjacentPairs([undefined, 1])]).toEqual([[undefined, 1]]);
	});
});
