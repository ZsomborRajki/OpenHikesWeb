import type { DraftStore } from '../draft-store.ts';
import type { Plan } from '../plan-document.ts';

/**
 * A draft kept for as long as the page lives. What the suites use, and what
 * the app falls back to in a browser that will not hand over `localStorage`.
 */
export class InMemoryDraftStore implements DraftStore {
	#plan: Plan | null;

	constructor(plan: Plan | null = null) {
		this.#plan = plan;
	}

	load(): Plan | null {
		return this.#plan;
	}

	save(plan: Plan): void {
		this.#plan = plan;
	}

	clear(): void {
		this.#plan = null;
	}
}
