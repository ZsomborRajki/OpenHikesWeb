// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import { aTrail } from '../trail.fixtures.ts';
import { readGpx } from './gpx-reader.ts';
import { gpxDocument, gpxFile, gpxFileName, xmlEscaped } from './gpx-writer.ts';

describe('gpx writer', () => {
	it('writes a point with its height and its time', () => {
		const document = gpxDocument(
			aTrail({
				route: [
					{
						latitude: 47.7165,
						longitude: 12.852,
						elevation: 528.456,
						time: Date.UTC(2026, 5, 12, 7, 30)
					}
				]
			})
		);

		expect(document).toContain(
			'      <trkpt lat="47.7165000" lon="12.8520000">\n' +
				'        <ele>528.46</ele>\n' +
				'        <time>2026-06-12T07:30:00.000Z</time>\n' +
				'      </trkpt>\n'
		);
	});

	it('closes a point with nothing in it on its own tag', () => {
		const document = gpxDocument(aTrail({ route: [{ latitude: 1, longitude: 2 }] }));

		expect(document).toContain('      <trkpt lat="1.0000000" lon="2.0000000"/>\n');
	});

	it('leaves out a height that is not a number', () => {
		const document = gpxDocument(
			aTrail({ route: [{ latitude: 1, longitude: 2, elevation: Number.POSITIVE_INFINITY }] })
		);

		expect(document).not.toContain('<ele>');
	});

	it('names the file and the track for the trail, escaped', () => {
		const document = gpxDocument(aTrail({ title: 'Ben & Jerry’s <Ridge>', addedAt: 0 }));

		expect(document).toContain(
			'  <metadata>\n' +
				'    <name>Ben &amp; Jerry’s &lt;Ridge&gt;</name>\n' +
				'    <time>1970-01-01T00:00:00.000Z</time>\n' +
				'  </metadata>\n'
		);
		expect(document).toContain('  <trk>\n    <name>Ben &amp; Jerry’s &lt;Ridge&gt;</name>\n');
	});

	it('writes one segment for a route with no points', () => {
		const document = gpxDocument(aTrail({ route: [] }));

		expect(document.match(/<trkseg>/g)).toHaveLength(1);
	});

	it('reads back what it wrote, breaks included', () => {
		const route = [
			{ latitude: 47.7165, longitude: 12.852, elevation: 528.25, time: 1_781_249_400_000 },
			{ latitude: 47.7171, longitude: 12.8533 },
			{ latitude: 47.72, longitude: 12.86, elevation: 600, startsSegment: true },
			{ latitude: 47.7204, longitude: 12.8611, elevation: 612.5 }
		];

		const reading = readGpx(gpxDocument(aTrail({ title: 'Round Trip', route })));

		expect(reading).toEqual({ ok: true, track: { name: 'Round Trip', route } });
	});

	it('escapes the five characters XML reserves', () => {
		expect(xmlEscaped(`<a href="x">Tom & Jerry's</a>`)).toBe(
			'&lt;a href=&quot;x&quot;&gt;Tom &amp; Jerry&apos;s&lt;/a&gt;'
		);
	});

	it('drops the characters XML cannot carry, and keeps the ones it can', () => {
		expect(xmlEscaped('a\u0000b\u0008c\td\ne￾f\uD800g🏔')).toBe('abc\td\nefg🏔');
	});

	it.each([
		['Thumsee Loop', 'Thumsee Loop.gpx'],
		['Up/Down: the "long" way?', 'Up-Down- the -long- way-.gpx'],
		['  .hidden.  ', 'hidden.gpx'],
		['', 'Trail.gpx'],
		['...', 'Trail.gpx'],
		['x'.repeat(100), `${'x'.repeat(64)}.gpx`]
	])('names the file for the title %j', (title, expected) => {
		expect(gpxFileName(title)).toBe(expected);
	});

	it('hands over the document as a GPX file', () => {
		const trail = aTrail();

		expect(gpxFile(trail)).toEqual({
			name: 'Thumsee Loop.gpx',
			mimeType: 'application/gpx+xml',
			contents: gpxDocument(trail)
		});
	});
});
