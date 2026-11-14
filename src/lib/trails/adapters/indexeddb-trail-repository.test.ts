import 'fake-indexeddb/auto';
import { describe, expect, it } from 'vitest';
import { aTrail } from '../trail.fixtures.ts';
import { describeTrailRepository } from '../trail-repository.contract.ts';
import { IndexedDbTrailRepository } from './indexeddb-trail-repository.ts';

let databases = 0;

/** A database no other test has written to. */
function freshDatabaseName(): string {
	databases += 1;
	return `suite-${String(databases)}`;
}

describeTrailRepository(
	'IndexedDbTrailRepository',
	() => new IndexedDbTrailRepository(freshDatabaseName())
);

describe('IndexedDbTrailRepository', () => {
	it('keeps its trails for the next visit', async () => {
		const name = freshDatabaseName();
		await new IndexedDbTrailRepository(name).save(aTrail());

		const nextVisit = new IndexedDbTrailRepository(name);

		expect(await nextVisit.all()).toEqual([aTrail()]);
	});
});
