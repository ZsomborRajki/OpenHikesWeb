//
// Trails in the browser's IndexedDB.
//
// IndexedDB and not `localStorage`, because a recorded route is tens of
// thousands of points: a megabyte or two as text, against a quota of about
// five for everything `localStorage` holds.
//

import { openDB, type DBSchema, type IDBPDatabase } from 'idb';
import type { Trail } from '../trail.ts';
import type { TrailRepository } from '../trail-repository.ts';

interface TrailDatabase extends DBSchema {
	trails: { key: string; value: Trail };
}

const DATABASE_NAME = 'openhikes';
/** Raise it, with an upgrade step, when a stored trail changes shape. */
const DATABASE_VERSION = 1;
const TRAILS = 'trails';

export class IndexedDbTrailRepository implements TrailRepository {
	readonly #name: string;
	#database: Promise<IDBPDatabase<TrailDatabase>> | null = null;

	constructor(name: string = DATABASE_NAME) {
		this.#name = name;
	}

	async all(): Promise<Trail[]> {
		return (await this.#open()).getAll(TRAILS);
	}

	async save(trail: Trail): Promise<void> {
		await (await this.#open()).put(TRAILS, trail);
	}

	async remove(id: string): Promise<void> {
		await (await this.#open()).delete(TRAILS, id);
	}

	/**
	 * Opened on first use, not in the constructor, so building the app touches
	 * no storage and a browser that refuses IndexedDB fails where the library
	 * can report it.
	 */
	#open(): Promise<IDBPDatabase<TrailDatabase>> {
		this.#database ??= openDB<TrailDatabase>(this.#name, DATABASE_VERSION, {
			upgrade(database) {
				database.createObjectStore(TRAILS, { keyPath: 'id' });
			}
		});
		return this.#database;
	}
}
