//
// The trail being drawn: its stops, the line through them, and its name.
//
// One draft for the whole app, as the iOS app has one `TrailDraft`. It is
// stored on every change, so closing the tab mid-drawing loses nothing, and
// it leaves the store when it is saved as a trail or cleared.
//

import { SvelteMap } from 'svelte/reactivity';
import type { NewId } from '#lib/general/ambient.ts';
import { pathLengthMeters, type Coordinate } from '#lib/general/geodesy.ts';
import type { Trail } from '#lib/trails/trail.ts';
import type { TrailLibrary } from '#lib/trails/trail-library.svelte.ts';
import { legsBetween, lineThrough, type Leg } from './draft-legs.ts';
import { MINIMUM_STOPS, withStopMoved, withoutStop, type DraftStop } from './draft-stops.ts';
import type { DraftStore } from './draft-store.ts';
import type { LegRouter } from './leg-router.ts';
import { isSamePlan, type Plan } from './plan-document.ts';

export interface TrailDraftDependencies {
	readonly router: LegRouter;
	readonly store: DraftStore;
	readonly newId: NewId;
}

export class TrailDraft {
	#title = $state('');
	#stops = $state.raw<readonly DraftStop[]>([]);
	/** Each routed leg's path, by the leg's key. A leg with no entry is drawn straight. */
	readonly #legPaths = new SvelteMap<string, readonly Coordinate[]>();
	/** The legs asked for and not yet answered, so none is asked for twice. */
	// eslint-disable-next-line svelte/prefer-svelte-reactivity -- bookkeeping that nothing draws from
	readonly #routing = new Set<string>();
	readonly #router: LegRouter;
	readonly #store: DraftStore;
	readonly #newId: NewId;

	/** The line through the stops: routed where a leg has an answer, straight where not. */
	readonly line = $derived(lineThrough(this.#stops, this.#legPaths));
	readonly distanceMeters = $derived(pathLengthMeters(this.line));
	readonly canSave = $derived(this.#stops.length >= MINIMUM_STOPS);

	constructor({ router, store, newId }: TrailDraftDependencies) {
		this.#router = router;
		this.#store = store;
		this.#newId = newId;

		const stored = store.load();
		if (stored === null) return;
		this.#title = stored.title;
		this.#stops = stored.stops.map((coordinate) => ({ id: newId(), coordinate }));
		this.#routeNewLegs();
	}

	get title(): string {
		return this.#title;
	}

	get stops(): readonly DraftStop[] {
		return this.#stops;
	}

	/** What the draft is drawn from: what the store keeps, and what a saved trail remembers. */
	get plan(): Plan {
		return { title: this.#title, stops: this.#stops.map((stop) => stop.coordinate) };
	}

	rename(title: string): void {
		this.#title = title;
		this.#store.save(this.plan);
	}

	addStop(coordinate: Coordinate): void {
		this.#replaceStops([...this.#stops, { id: this.#newId(), coordinate }]);
	}

	removeStop(id: string): void {
		this.#replaceStops(withoutStop(this.#stops, id));
	}

	/** Moves a stop `offset` places along the trail: -1 is one earlier. */
	moveStop(id: string, offset: number): void {
		this.#replaceStops(withStopMoved(this.#stops, id, offset));
	}

	/** Starts over, and takes the draft out of the store. */
	clear(): void {
		this.#title = '';
		this.#stops = [];
		this.#legPaths.clear();
		this.#store.clear();
	}

	/**
	 * Saves the drawing to `library` as a trail, and starts over once it is
	 * kept. Answers with the trail, or with `null` when the library could not
	 * store it, and then the drawing stays as it is.
	 *
	 * A store can take its time, and the planner is live while it does. A
	 * drawing that has changed by the time the trail is kept is no longer the
	 * one that was saved, so it stays too: starting over would throw away
	 * every stop added since.
	 */
	async saveTo(library: TrailLibrary): Promise<Trail | null> {
		const saved = this.plan;
		const trail = await library.addPlanned({ ...saved, route: this.line });
		if (trail !== null && isSamePlan(this.plan, saved)) this.clear();
		return trail;
	}

	#replaceStops(stops: readonly DraftStop[]): void {
		this.#stops = stops;
		this.#store.save(this.plan);
		this.#routeNewLegs();
	}

	/** Forgets the legs the drawing no longer has, and asks for the ones it has gained. */
	#routeNewLegs(): void {
		const legs = legsBetween(this.#stops);
		const drawn = legs.map((leg) => leg.key);
		for (const key of [...this.#legPaths.keys()]) {
			if (!drawn.includes(key)) this.#legPaths.delete(key);
		}

		for (const leg of legs) {
			if (this.#legPaths.has(leg.key) || this.#routing.has(leg.key)) continue;
			this.#routing.add(leg.key);
			void this.#route(leg);
		}
	}

	async #route(leg: Leg): Promise<void> {
		try {
			this.#legPaths.set(leg.key, await this.#router.route(leg.from, leg.to));
		} catch {
			// No answer. The leg stays straight, and is asked for again when the stops next change.
		} finally {
			this.#routing.delete(leg.key);
		}
	}
}
