import { describe, expect, it } from 'vitest';
import { aTrail } from '../trail.fixtures.ts';
import { describeTrailRepository } from '../trail-repository.contract.ts';
import { InMemoryTrailRepository } from './in-memory-trail-repository.ts';

describeTrailRepository('InMemoryTrailRepository', () => new InMemoryTrailRepository());

describe('InMemoryTrailRepository', () => {
	it('starts with the trails it is built with', async () => {
		const repository = new InMemoryTrailRepository([aTrail()]);

		expect(await repository.all()).toEqual([aTrail()]);
	});
});
