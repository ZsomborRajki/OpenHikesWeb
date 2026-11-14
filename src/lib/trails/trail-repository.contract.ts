//
// What every `TrailRepository` owes, as a suite an adapter's own test file
// runs against itself. A new adapter is done when this passes.
//

import { describe, expect, it } from 'vitest';
import { aTrail } from './trail.fixtures.ts';
import type { TrailRepository } from './trail-repository.ts';

export function describeTrailRepository(name: string, create: () => TrailRepository): void {
	describe(`${name}, as a trail repository`, () => {
		it('starts with no trails', async () => {
			expect(await create().all()).toEqual([]);
		});

		it('hands back the trails it was given, whole', async () => {
			const repository = create();
			const imported = aTrail({ id: 'imported' });
			const planned = aTrail({ id: 'planned', stops: [{ latitude: 1, longitude: 2 }] });

			await repository.save(imported);
			await repository.save(planned);

			const stored = await repository.all();
			expect(stored).toHaveLength(2);
			expect(stored).toEqual(expect.arrayContaining([imported, planned]));
		});

		it('replaces a trail saved again under its id', async () => {
			const repository = create();
			await repository.save(aTrail({ title: 'Before' }));

			await repository.save(aTrail({ title: 'After' }));

			expect(await repository.all()).toEqual([aTrail({ title: 'After' })]);
		});

		it('removes one trail and keeps the rest', async () => {
			const repository = create();
			await repository.save(aTrail({ id: 'kept' }));
			await repository.save(aTrail({ id: 'removed' }));

			await repository.remove('removed');

			expect(await repository.all()).toEqual([aTrail({ id: 'kept' })]);
		});

		it('removes a trail it does not have without complaint', async () => {
			const repository = create();

			await expect(repository.remove('never-stored')).resolves.toBeUndefined();
		});
	});
}
