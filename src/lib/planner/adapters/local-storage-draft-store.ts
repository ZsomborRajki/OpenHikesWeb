import type { DraftStore } from '../draft-store.ts';
import { decodePlan, encodePlan, type Plan } from '../plan-document.ts';

const DRAFT_KEY = 'openhikes.draft';

/**
 * The draft in `localStorage`: a few hundred bytes, read once at launch.
 *
 * Storing is best effort. A browser with its storage full or switched off
 * throws on a write, and a draft that cannot be kept is still a draft the
 * visitor can finish and save in this visit.
 */
export class LocalStorageDraftStore implements DraftStore {
	readonly #storage: Storage;

	constructor(storage: Storage) {
		this.#storage = storage;
	}

	load(): Plan | null {
		const stored = this.#storage.getItem(DRAFT_KEY);
		return stored === null ? null : decodePlan(stored);
	}

	save(plan: Plan): void {
		try {
			this.#storage.setItem(DRAFT_KEY, encodePlan(plan));
		} catch {
			// Kept in memory by the draft itself; see the note above.
		}
	}

	clear(): void {
		this.#storage.removeItem(DRAFT_KEY);
	}
}
