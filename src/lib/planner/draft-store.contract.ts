//
// What every `DraftStore` owes, as a suite an adapter's own test file runs
// against itself.
//

import { describe, expect, it } from 'vitest';
import type { DraftStore } from './draft-store.ts';
import type { Plan } from './plan-document.ts';

const PLAN: Plan = { title: 'Ridge Walk', stops: [{ latitude: 1, longitude: 2 }] };

export function describeDraftStore(name: string, create: () => DraftStore): void {
	describe(`${name}, as a draft store`, () => {
		it('has no draft until one is saved', () => {
			expect(create().load()).toBeNull();
		});

		it('hands back the draft it was given', () => {
			const store = create();

			store.save(PLAN);

			expect(store.load()).toEqual(PLAN);
		});

		it('keeps the last draft saved', () => {
			const store = create();
			store.save(PLAN);

			store.save({ ...PLAN, title: 'Renamed' });

			expect(store.load()).toEqual({ ...PLAN, title: 'Renamed' });
		});

		it('forgets a draft that was cleared', () => {
			const store = create();
			store.save(PLAN);

			store.clear();

			expect(store.load()).toBeNull();
		});
	});
}
