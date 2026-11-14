// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import { readGpx, type GpxTrack } from './gpx-reader.ts';

/**
 * More points than an engine lets one call take as arguments: about 125,000
 * in V8. A day's recording at a point a second is longer than that.
 */
const LONG_RECORDING_POINTS = 150_000;

function gpx(body: string): string {
	return `<?xml version="1.0" encoding="UTF-8"?>
<gpx version="1.1" creator="A Suite" xmlns="http://www.topografix.com/GPX/1/1">${body}</gpx>`;
}

function trackIn(xml: string): GpxTrack {
	const reading = readGpx(xml);
	if (!reading.ok) throw new Error(`The file should read, and was ${reading.problem}.`);
	return reading.track;
}

describe('readGpx', () => {
	it('reads a track point with its height and its time', () => {
		const track = trackIn(
			gpx(`<trk><trkseg>
				<trkpt lat="47.7165" lon="12.852">
					<ele>528.4</ele>
					<time>2026-06-12T07:30:00.250Z</time>
				</trkpt>
			</trkseg></trk>`)
		);

		expect(track.route).toEqual([
			{
				latitude: 47.7165,
				longitude: 12.852,
				elevation: 528.4,
				time: Date.UTC(2026, 5, 12, 7, 30, 0, 250)
			}
		]);
	});

	it('leaves out a height or a time that is missing or is not one', () => {
		const track = trackIn(
			gpx(`<trk><trkseg>
				<trkpt lat="1" lon="2"/>
				<trkpt lat="1" lon="3"><ele>high</ele><time>yesterday</time></trkpt>
				<trkpt lat="1" lon="4"><ele> </ele></trkpt>
			</trkseg></trk>`)
		);

		expect(track.route).toEqual([
			{ latitude: 1, longitude: 2 },
			{ latitude: 1, longitude: 3 },
			{ latitude: 1, longitude: 4 }
		]);
	});

	it('starts a segment at each track segment after the first', () => {
		const track = trackIn(
			gpx(`<trk>
				<trkseg><trkpt lat="1" lon="1"/><trkpt lat="1" lon="2"/></trkseg>
				<trkseg></trkseg>
				<trkseg><trkpt lat="5" lon="5"/><trkpt lat="5" lon="6"/></trkseg>
			</trk>
			<trk><trkseg><trkpt lat="9" lon="9"/></trkseg></trk>`)
		);

		expect(track.route).toEqual([
			{ latitude: 1, longitude: 1 },
			{ latitude: 1, longitude: 2 },
			{ latitude: 5, longitude: 5, startsSegment: true },
			{ latitude: 5, longitude: 6 },
			{ latitude: 9, longitude: 9, startsSegment: true }
		]);
	});

	it('leaves out a point that is no place on the globe', () => {
		const track = trackIn(
			gpx(`<trk><trkseg>
				<trkpt lat="123" lon="1"/>
				<trkpt lon="1"/>
				<trkpt lat="" lon="1"/>
				<trkpt lat="1" lon="1"/>
			</trkseg></trk>`)
		);

		expect(track.route).toEqual([{ latitude: 1, longitude: 1 }]);
	});

	it('reads a segment of more points than a function takes arguments', () => {
		const points = '<trkpt lat="1" lon="1"/>'.repeat(LONG_RECORDING_POINTS);

		const track = trackIn(gpx(`<trk><trkseg>${points}</trkseg></trk>`));

		expect(track.route).toHaveLength(LONG_RECORDING_POINTS);
	});

	it('reads a route when the file has no track', () => {
		const track = trackIn(
			gpx(`<rte><name>Planned</name><rtept lat="1" lon="1"/><rtept lat="1" lon="2"/></rte>`)
		);

		expect(track.name).toBe('Planned');
		expect(track.route).toHaveLength(2);
	});

	it('names the trail for its track before the file', () => {
		const track = trackIn(
			gpx(`<metadata><name>A File</name></metadata>
			<trk><name> Thumsee Loop </name><trkseg><trkpt lat="1" lon="1"/></trkseg></trk>`)
		);

		expect(track.name).toBe('Thumsee Loop');
	});

	it('names the trail for the file when its track has no name', () => {
		const track = trackIn(
			gpx(`<metadata><name>A File</name></metadata>
			<trk><name> </name><trkseg><trkpt lat="1" lon="1"/></trkseg></trk>`)
		);

		expect(track.name).toBe('A File');
	});

	it('has no name for a file that carries none', () => {
		const track = trackIn(gpx(`<trk><trkseg><trkpt lat="1" lon="1"/></trkseg></trk>`));

		expect(track.name).toBeNull();
	});

	it('reads a file whose elements carry a namespace prefix', () => {
		const track = trackIn(`<g:gpx xmlns:g="http://www.topografix.com/GPX/1/1">
			<g:trk><g:trkseg><g:trkpt lat="1" lon="1"><g:ele>7</g:ele></g:trkpt></g:trkseg></g:trk>
		</g:gpx>`);

		expect(track.route).toEqual([{ latitude: 1, longitude: 1, elevation: 7 }]);
	});

	it.each([
		['text that is not XML', 'a walk in the hills'],
		['XML that is cut short', '<gpx><trk>'],
		['XML that is not GPX', '<kml><Placemark/></kml>']
	])('cannot read %s', (_, xml) => {
		expect(readGpx(xml)).toEqual({ ok: false, problem: 'unreadable' });
	});

	it('finds a file with no points empty', () => {
		expect(readGpx(gpx('<trk><trkseg></trkseg></trk><wpt lat="1" lon="1"/>'))).toEqual({
			ok: false,
			problem: 'empty'
		});
	});
});
