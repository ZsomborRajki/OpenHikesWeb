// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import { InMemoryTrailRepository } from './adapters/in-memory-trail-repository.ts';
import { aTrail } from './trail.fixtures.ts';
import { TrailLibrary, type PickedFile } from './trail-library.svelte.ts';
import type { TrailRepository } from './trail-repository.ts';

const NOW = 1_781_249_400_000;
const GPX = `<gpx xmlns="http://www.topografix.com/GPX/1/1"><trk><name>Thumsee Loop</name><trkseg>
	<trkpt lat="47.7165" lon="12.852"/><trkpt lat="47.7171" lon="12.8533"/>
</trkseg></trk></gpx>`;
const UNNAMED_GPX = GPX.replace('<name>Thumsee Loop</name>', '');

/** A store that refuses everything: a browser with its storage full or switched off. */
const REFUSING_REPOSITORY: TrailRepository = {
	all: () => Promise.reject(new Error('refused')),
	save: () => Promise.reject(new Error('refused')),
	remove: () => Promise.reject(new Error('refused'))
};

/** A file as the browser hands one over once it is picked. */
function fileOf(name: string, xml: string): PickedFile {
	return { name, text: () => Promise.resolve(xml) };
}

function libraryOver(repository: TrailRepository): TrailLibrary {
	let ids = 0;
	return new TrailLibrary({
		repository,
		newId: () => `id-${String((ids += 1))}`,
		now: () => NOW
	});
}

describe('TrailLibrary', () => {
	it('is loading until it has read the store', () => {
		const library = libraryOver(new InMemoryTrailRepository([aTrail()]));

		expect(library.status).toBe('loading');
		expect(library.trails).toEqual([]);
	});

	it('lists the stored trails newest first', async () => {
		const older = aTrail({ id: 'older', addedAt: 100 });
		const newer = aTrail({ id: 'newer', addedAt: 200 });
		const library = libraryOver(new InMemoryTrailRepository([older, newer]));

		await library.load();

		expect(library.status).toBe('ready');
		expect(library.trails).toEqual([newer, older]);
	});

	it('is unavailable when the store cannot be read', async () => {
		const library = libraryOver(REFUSING_REPOSITORY);

		await library.load();

		expect(library.status).toBe('unavailable');
	});

	it('finds a trail by its id', async () => {
		const library = libraryOver(new InMemoryTrailRepository([aTrail({ id: 'wanted' })]));
		await library.load();

		expect(library.find('wanted')?.id).toBe('wanted');
		expect(library.find('missing')).toBeUndefined();
	});

	it('imports a GPX file as a trail of its own, stored and listed first', async () => {
		const repository = new InMemoryTrailRepository([aTrail({ id: 'earlier' })]);
		const library = libraryOver(repository);
		await library.load();

		const outcome = await library.importGpx(fileOf('download.gpx', GPX));

		const imported = {
			id: 'id-1',
			title: 'Thumsee Loop',
			addedAt: NOW,
			route: [
				{ latitude: 47.7165, longitude: 12.852 },
				{ latitude: 47.7171, longitude: 12.8533 }
			]
		};
		expect(outcome).toEqual({ ok: true, trail: imported });
		expect(library.trails.map((trail) => trail.id)).toEqual(['id-1', 'earlier']);
		expect(await repository.all()).toContainEqual(imported);
	});

	it.each([
		['Karwendel Traverse.gpx', 'Karwendel Traverse'],
		['no-extension', 'no-extension'],
		['.gpx', 'Imported Trail']
	])('names an unnamed track from the file %s', async (fileName, title) => {
		const library = libraryOver(new InMemoryTrailRepository());

		const outcome = await library.importGpx(fileOf(fileName, UNNAMED_GPX));

		expect(outcome.ok && outcome.trail.title).toBe(title);
	});

	it('says why a file is not a trail, and adds nothing', async () => {
		const library = libraryOver(new InMemoryTrailRepository());

		const outcome = await library.importGpx(fileOf('notes.txt', 'not a track'));

		expect(outcome).toEqual({ ok: false, problem: 'unreadable' });
		expect(library.trails).toEqual([]);
	});

	it('says so when the browser cannot open the file, and adds nothing', async () => {
		const library = libraryOver(new InMemoryTrailRepository());
		const gone: PickedFile = {
			name: 'gone.gpx',
			text: () => Promise.reject(new Error('The file is out of reach.'))
		};

		const outcome = await library.importGpx(gone);

		expect(outcome).toEqual({ ok: false, problem: 'notOpened' });
		expect(library.trails).toEqual([]);
	});

	it('lists nothing the store refused', async () => {
		const library = libraryOver(REFUSING_REPOSITORY);

		const outcome = await library.importGpx(fileOf('download.gpx', GPX));

		expect(outcome).toEqual({ ok: false, problem: 'notStored' });
		expect(library.trails).toEqual([]);
	});

	it('adds a planned trail with the stops it was drawn through', async () => {
		const library = libraryOver(new InMemoryTrailRepository());
		const stops = [
			{ latitude: 1, longitude: 1 },
			{ latitude: 1, longitude: 2 }
		];

		const trail = await library.addPlanned({ title: ' Ridge Walk ', stops, route: stops });

		expect(trail).toEqual({ id: 'id-1', title: 'Ridge Walk', addedAt: NOW, route: stops, stops });
		expect(library.trails).toEqual([trail]);
	});

	it('names a planned trail that was given no name', async () => {
		const library = libraryOver(new InMemoryTrailRepository());

		const trail = await library.addPlanned({ title: '', stops: [], route: [] });

		expect(trail?.title).toBe('New Trail');
	});

	it('answers with nothing when the store refuses a planned trail', async () => {
		const library = libraryOver(REFUSING_REPOSITORY);

		expect(await library.addPlanned({ title: 'Ridge Walk', stops: [], route: [] })).toBeNull();
	});

	it('removes a trail from the list and from the store', async () => {
		const repository = new InMemoryTrailRepository([
			aTrail({ id: 'kept' }),
			aTrail({ id: 'gone' })
		]);
		const library = libraryOver(repository);
		await library.load();

		const removed = await library.remove('gone');

		expect(removed).toBe(true);
		expect(library.trails.map((trail) => trail.id)).toEqual(['kept']);
		expect((await repository.all()).map((trail) => trail.id)).toEqual(['kept']);
	});

	it('keeps listing a trail the store would not remove', async () => {
		const stored = new InMemoryTrailRepository([aTrail()]);
		const library = libraryOver({ ...REFUSING_REPOSITORY, all: () => stored.all() });
		await library.load();

		const removed = await library.remove('trail-1');

		expect(removed).toBe(false);
		expect(library.trails).toEqual([aTrail()]);
	});
});
