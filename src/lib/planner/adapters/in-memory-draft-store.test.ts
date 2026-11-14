import { describe, expect, it } from 'vitest';
import { describeDraftStore } from '../draft-store.contract.ts';
import { InMemoryDraftStore } from './in-memory-draft-store.ts';

describeDraftStore('InMemoryDraftStore', () => new InMemoryDraftStore());

describe('InMemoryDraftStore', () => {
	it('starts with the draft it is built with', () => {
		const plan = { title: 'Ridge Walk', stops: [] };

		expect(new InMemoryDraftStore(plan).load()).toEqual(plan);
	});
});
