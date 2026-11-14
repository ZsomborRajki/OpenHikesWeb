//
// The trails the visitor keeps: the list every screen reads, and the only
// writer of the store behind it.
//
// A write goes to the repository first and to the list second, so the list
// never shows a trail the store refused. A refusal is an answer, not an
// exception: a browser can run out of room or have its storage switched off,
// and the screen that asked has something to say either way.
//

import type { NewId, Now } from '#lib/general/ambient.ts';
import type { Coordinate } from '#lib/general/geodesy.ts';
import { readGpx, type GpxProblem } from './gpx/gpx-reader.ts';
import { boundedTitle, type RoutePoint, type Trail } from './trail.ts';
import type { TrailRepository } from './trail-repository.ts';

/** `unavailable` when the browser would not hand over its storage. */
export type LibraryStatus = 'loading' | 'ready' | 'unavailable';

/** Why a file did not become a trail: the browser could not open it, the file itself, or the store. */
export type ImportProblem = 'notOpened' | GpxProblem | 'notStored';

/** A file the visitor picked: its name, and its text once it has been read. A browser's `File` is one. */
export interface PickedFile {
	readonly name: string;
	text(): Promise<string>;
}

export type GpxImport =
	| { readonly ok: true; readonly trail: Trail }
	| { readonly ok: false; readonly problem: ImportProblem };

/** A trail drawn in the planner, on its way into the library. */
export interface PlannedTrail {
	readonly title: string;
	readonly stops: readonly Coordinate[];
	readonly route: readonly RoutePoint[];
}

export interface TrailLibraryDependencies {
	readonly repository: TrailRepository;
	readonly newId: NewId;
	readonly now: Now;
}

const IMPORTED_TITLE_FALLBACK = 'Imported Trail';
const PLANNED_TITLE_FALLBACK = 'New Trail';

export class TrailLibrary {
	#trails = $state.raw<readonly Trail[]>([]);
	#status = $state<LibraryStatus>('loading');
	readonly #repository: TrailRepository;
	readonly #newId: NewId;
	readonly #now: Now;

	constructor({ repository, newId, now }: TrailLibraryDependencies) {
		this.#repository = repository;
		this.#newId = newId;
		this.#now = now;
	}

	/** Newest first. */
	get trails(): readonly Trail[] {
		return this.#trails;
	}

	get status(): LibraryStatus {
		return this.#status;
	}

	find(id: string): Trail | undefined {
		return this.#trails.find((trail) => trail.id === id);
	}

	async load(): Promise<void> {
		let stored: Trail[];
		try {
			stored = await this.#repository.all();
		} catch {
			this.#status = 'unavailable';
			return;
		}
		this.#trails = stored.toSorted((one, other) => other.addedAt - one.addedAt);
		this.#status = 'ready';
	}

	/** Adds the trail in a GPX file, named for its track or else for the file. */
	async importGpx(file: PickedFile): Promise<GpxImport> {
		let xml: string;
		try {
			xml = await file.text();
		} catch {
			// Picked and then out of reach: moved, deleted, or on a drive that has gone offline.
			return { ok: false, problem: 'notOpened' };
		}
		const reading = readGpx(xml);
		if (!reading.ok) return reading;
		const title = boundedTitle(reading.track.name ?? fileStem(file.name), IMPORTED_TITLE_FALLBACK);
		const trail = await this.#add({ title, route: reading.track.route });
		return trail === null ? { ok: false, problem: 'notStored' } : { ok: true, trail };
	}

	/** Adds a trail drawn in the planner. `null` when the store refused it. */
	async addPlanned({ title, stops, route }: PlannedTrail): Promise<Trail | null> {
		return this.#add({ title: boundedTitle(title, PLANNED_TITLE_FALLBACK), route, stops });
	}

	/** Removes a trail, and says whether it is gone. */
	async remove(id: string): Promise<boolean> {
		try {
			await this.#repository.remove(id);
		} catch {
			return false;
		}
		this.#trails = this.#trails.filter((trail) => trail.id !== id);
		return true;
	}

	async #add(contents: Omit<Trail, 'id' | 'addedAt'>): Promise<Trail | null> {
		const trail: Trail = { ...contents, id: this.#newId(), addedAt: this.#now() };
		try {
			await this.#repository.save(trail);
		} catch {
			return null;
		}
		this.#trails = [trail, ...this.#trails];
		return trail;
	}
}

/** "Thumsee Loop.gpx" without its extension. */
function fileStem(fileName: string): string {
	return fileName.replace(/\.[^.]*$/, '');
}
