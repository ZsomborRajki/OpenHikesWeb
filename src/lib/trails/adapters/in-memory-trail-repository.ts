import type { Trail } from '../trail.ts';
import type { TrailRepository } from '../trail-repository.ts';

/** Trails kept for as long as the page lives. What the suites store in. */
export class InMemoryTrailRepository implements TrailRepository {
	readonly #trails = new Map<string, Trail>();

	constructor(trails: readonly Trail[] = []) {
		for (const trail of trails) this.#trails.set(trail.id, trail);
	}

	all(): Promise<Trail[]> {
		return Promise.resolve([...this.#trails.values()]);
	}

	save(trail: Trail): Promise<void> {
		this.#trails.set(trail.id, trail);
		return Promise.resolve();
	}

	remove(id: string): Promise<void> {
		this.#trails.delete(id);
		return Promise.resolve();
	}
}
