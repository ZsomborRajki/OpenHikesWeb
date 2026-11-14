import type { Trail } from './trail.ts';

/**
 * Where trails are kept between visits.
 *
 * A port: the library knows this interface and nothing about the store behind
 * it. `trail-repository.contract.ts` is the behavior every adapter owes.
 */
export interface TrailRepository {
	/** Every stored trail, in no particular order. */
	all(): Promise<Trail[]>;
	/** Stores `trail`, replacing the one with its id. */
	save(trail: Trail): Promise<void>;
	/** Forgets the trail with `id`. Forgetting one that is not there is not an error. */
	remove(id: string): Promise<void>;
}
