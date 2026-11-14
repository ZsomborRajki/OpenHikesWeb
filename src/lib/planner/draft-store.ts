import type { Plan } from './plan-document.ts';

/**
 * Where the trail being drawn waits between visits.
 *
 * Apart from the trail repository on purpose, as the iOS app keeps its
 * `TrailDraftRecord` apart from its hikes: a half-drawn line is not a trail
 * yet, and it is one browser's work.
 */
export interface DraftStore {
	/** The stored draft, or `null` when there is none that can be read. */
	load(): Plan | null;
	save(plan: Plan): void;
	clear(): void;
}
