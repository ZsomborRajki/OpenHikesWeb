import { describe, expect, it } from 'vitest';
import { describeDraftStore } from '../draft-store.contract.ts';
import type { Plan } from '../plan-document.ts';
import { LocalStorageDraftStore } from './local-storage-draft-store.ts';

const PLAN: Plan = { title: 'Ridge Walk', stops: [{ latitude: 1, longitude: 2 }] };

/** As much of `Storage` as a draft uses, kept in a map. */
class StorageDouble implements Storage {
	readonly #items = new Map<string, string>();
	isFull = false;

	get length(): number {
		return this.#items.size;
	}

	getItem(key: string): string | null {
		return this.#items.get(key) ?? null;
	}

	setItem(key: string, value: string): void {
		if (this.isFull) throw new DOMException('The quota has been exceeded.', 'QuotaExceededError');
		this.#items.set(key, value);
	}

	removeItem(key: string): void {
		this.#items.delete(key);
	}

	clear(): void {
		this.#items.clear();
	}

	key(index: number): string | null {
		return [...this.#items.keys()][index] ?? null;
	}
}

describeDraftStore('LocalStorageDraftStore', () => new LocalStorageDraftStore(new StorageDouble()));

describe('LocalStorageDraftStore', () => {
	it('keeps a draft for the next visit', () => {
		const storage = new StorageDouble();
		new LocalStorageDraftStore(storage).save(PLAN);

		expect(new LocalStorageDraftStore(storage).load()).toEqual(PLAN);
	});

	it('reads a stored draft it cannot make sense of as no draft', () => {
		const storage = new StorageDouble();
		new LocalStorageDraftStore(storage).save(PLAN);
		storage.setItem(storage.key(0) ?? '', 'left by an older build');

		expect(new LocalStorageDraftStore(storage).load()).toBeNull();
	});

	it('carries on when the browser will not store the draft', () => {
		const storage = new StorageDouble();
		storage.isFull = true;
		const store = new LocalStorageDraftStore(storage);

		expect(() => {
			store.save(PLAN);
		}).not.toThrow();
		expect(store.load()).toBeNull();
	});
});
