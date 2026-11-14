import { describe, expect, it } from 'vitest';
import { distanceMeters, type Coordinate } from '#lib/general/geodesy.ts';
import { DirectLegRouter } from './adapters/direct-leg-router.ts';
import { InMemoryDraftStore } from './adapters/in-memory-draft-store.ts';
import type { DraftStore } from './draft-store.ts';
import type { LegRouter } from './leg-router.ts';
import { TrailDraft } from './trail-draft.svelte.ts';

const A = { latitude: 0, longitude: 0 };
const B = { latitude: 0, longitude: 0.01 };
const C = { latitude: 0.01, longitude: 0.01 };
/** A point off the straight line from A to B, which only a router would go through. */
const DETOUR = { latitude: -0.005, longitude: 0.005 };

/**
 * A router a test answers by hand, leg by leg, so the order answers arrive
 * in is the test's to choose.
 */
class ScriptedLegRouter implements LegRouter {
	readonly asked: (readonly [Coordinate, Coordinate])[] = [];
	readonly #requests: PromiseWithResolvers<readonly Coordinate[]>[] = [];

	route(from: Coordinate, to: Coordinate): Promise<readonly Coordinate[]> {
		this.asked.push([from, to]);
		const request = Promise.withResolvers<readonly Coordinate[]>();
		this.#requests.push(request);
		return request.promise;
	}

	/**
	 * Answers the `request`th question. Resolves once the draft has taken
	 * the answer in: the draft awaited the same promise first, so it is
	 * resumed first.
	 */
	async answer(request: number, path: readonly Coordinate[]): Promise<void> {
		this.#requests[request]?.resolve(path);
		await this.#requests[request]?.promise;
	}

	/** Fails the `request`th question, and resolves once the draft has seen it fail. */
	async refuse(request: number): Promise<void> {
		this.#requests[request]?.reject(new Error('no route'));
		await this.#requests[request]?.promise.catch(() => undefined);
	}
}

function draftWith({
	router = new DirectLegRouter(),
	store = new InMemoryDraftStore()
}: { router?: LegRouter; store?: DraftStore } = {}): TrailDraft {
	let ids = 0;
	return new TrailDraft({ router, store, newId: () => `stop-${String((ids += 1))}` });
}

describe('TrailDraft', () => {
	it('starts with nothing drawn', () => {
		const draft = draftWith();

		expect(draft.stops).toEqual([]);
		expect(draft.line).toEqual([]);
		expect(draft.distanceMeters).toBe(0);
		expect(draft.canSave).toBe(false);
	});

	it('adds stops in the order they are placed', () => {
		const draft = draftWith();

		draft.addStop(A);
		draft.addStop(B);

		expect(draft.stops).toEqual([
			{ id: 'stop-1', coordinate: A },
			{ id: 'stop-2', coordinate: B }
		]);
	});

	it('can be saved once it goes from somewhere to somewhere', () => {
		const draft = draftWith();

		draft.addStop(A);
		expect(draft.canSave).toBe(false);

		draft.addStop(B);
		expect(draft.canSave).toBe(true);
	});

	it('measures the line through its stops', () => {
		const draft = draftWith();

		draft.addStop(A);
		draft.addStop(B);
		draft.addStop(C);

		expect(draft.line).toEqual([A, B, C]);
		expect(draft.distanceMeters).toBeCloseTo(distanceMeters(A, B) + distanceMeters(B, C), 6);
	});

	it('removes a stop', () => {
		const draft = draftWith();
		draft.addStop(A);
		draft.addStop(B);
		draft.addStop(C);

		draft.removeStop('stop-2');

		expect(draft.line).toEqual([A, C]);
	});

	it('moves a stop along the trail', () => {
		const draft = draftWith();
		draft.addStop(A);
		draft.addStop(B);
		draft.addStop(C);

		draft.moveStop('stop-3', -1);

		expect(draft.line).toEqual([A, C, B]);
	});

	it('stores the plan on every change', () => {
		const store = new InMemoryDraftStore();
		const draft = draftWith({ store });

		draft.rename('Ridge Walk');
		draft.addStop(A);
		draft.addStop(B);
		draft.removeStop('stop-1');

		expect(store.load()).toEqual({ title: 'Ridge Walk', stops: [B] });
		expect(draft.plan).toEqual({ title: 'Ridge Walk', stops: [B] });
	});

	it('takes up the stored draft where it was left', () => {
		const store = new InMemoryDraftStore({ title: 'Ridge Walk', stops: [A, B] });

		const draft = draftWith({ store });

		expect(draft.title).toBe('Ridge Walk');
		expect(draft.stops.map((stop) => stop.id)).toEqual(['stop-1', 'stop-2']);
		expect(draft.line).toEqual([A, B]);
	});

	it('starts over when cleared, and takes the draft out of the store', () => {
		const store = new InMemoryDraftStore();
		const draft = draftWith({ store });
		draft.rename('Ridge Walk');
		draft.addStop(A);
		draft.addStop(B);

		draft.clear();

		expect(draft.title).toBe('');
		expect(draft.line).toEqual([]);
		expect(store.load()).toBeNull();
	});

	it('draws a leg straight until its route arrives, then along the route', async () => {
		const router = new ScriptedLegRouter();
		const draft = draftWith({ router });
		draft.addStop(A);
		draft.addStop(B);
		expect(draft.line).toEqual([A, B]);

		await router.answer(0, [A, DETOUR, B]);

		expect(draft.line).toEqual([A, DETOUR, B]);
		expect(draft.distanceMeters).toBeGreaterThan(distanceMeters(A, B));
	});

	it('does not ask again for a leg whose route is still on its way', () => {
		const router = new ScriptedLegRouter();
		const draft = draftWith({ router });
		draft.addStop(A);
		draft.addStop(B);

		draft.addStop(C);

		expect(router.asked).toEqual([
			[A, B],
			[B, C]
		]);
	});

	it('keeps a routed leg when the stops around it change', async () => {
		const router = new ScriptedLegRouter();
		const draft = draftWith({ router });
		draft.addStop(A);
		draft.addStop(B);
		await router.answer(0, [A, DETOUR, B]);

		draft.addStop(C);

		expect(draft.line).toEqual([A, DETOUR, B, C]);
		expect(router.asked).toHaveLength(2);
	});

	it('leaves a leg straight when no route can be had, and asks again on the next change', async () => {
		const router = new ScriptedLegRouter();
		const draft = draftWith({ router });
		draft.addStop(A);
		draft.addStop(B);

		await router.refuse(0);
		expect(draft.line).toEqual([A, B]);

		draft.addStop(C);

		expect(router.asked).toEqual([
			[A, B],
			[A, B],
			[B, C]
		]);
	});

	it('draws nothing from an answer for a leg it no longer has', async () => {
		const router = new ScriptedLegRouter();
		const draft = draftWith({ router });
		draft.addStop(A);
		draft.addStop(B);
		draft.removeStop('stop-2');
		draft.addStop(C);

		await router.answer(0, [A, DETOUR, B]);
		expect(draft.line).toEqual([A, C]);

		await router.answer(1, [A, DETOUR, C]);
		expect(draft.line).toEqual([A, DETOUR, C]);
	});

	it('forgets the route of a leg that is taken out', async () => {
		const router = new ScriptedLegRouter();
		const draft = draftWith({ router });
		draft.addStop(A);
		draft.addStop(B);
		await router.answer(0, [A, DETOUR, B]);

		draft.removeStop('stop-2');
		draft.addStop(B);

		expect(draft.line).toEqual([A, B]);
		expect(router.asked).toHaveLength(2);
	});
});
