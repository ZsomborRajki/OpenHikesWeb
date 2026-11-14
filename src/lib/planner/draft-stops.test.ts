import { describe, expect, it } from 'vitest';
import { withStopMoved, withoutStop, type DraftStop } from './draft-stops.ts';

const STOPS: readonly DraftStop[] = ['a', 'b', 'c'].map((id, index) => ({
	id,
	coordinate: { latitude: index, longitude: index }
}));

function ids(stops: readonly DraftStop[]): string[] {
	return stops.map((stop) => stop.id);
}

describe('draft stops', () => {
	it('takes a stop out', () => {
		expect(ids(withoutStop(STOPS, 'b'))).toEqual(['a', 'c']);
	});

	it.each([
		['b', -1, ['b', 'a', 'c']],
		['b', 1, ['a', 'c', 'b']],
		['a', 2, ['b', 'c', 'a']]
	])('moves stop %s by %d', (id, offset, expected) => {
		expect(ids(withStopMoved(STOPS, id, offset))).toEqual(expected);
	});

	it.each([
		['the first stop earlier', 'a', -1],
		['the last stop later', 'c', 1],
		['a stop it does not have', 'z', 1]
	])('leaves the order alone when asked to move %s', (_, id, offset) => {
		expect(ids(withStopMoved(STOPS, id, offset))).toEqual(['a', 'b', 'c']);
	});
});
