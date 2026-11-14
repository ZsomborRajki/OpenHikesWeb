//
// Reads a GPX file into a route.
//
// The rules follow the iOS app's `GPXImport` where they overlap: a track's
// points are the line, each `<trkseg>` after the first is a break in it, and
// a file with no track is read from its `<rte>` instead. A point with a
// coordinate that is no place on the globe is left out, not guessed at.
//

import { isCoordinate } from '#lib/general/geodesy.ts';
import type { RoutePoint } from '../trail.ts';

export interface GpxTrack {
	/** The track's own name, or the file's, or `null` when it carries neither. */
	readonly name: string | null;
	readonly route: readonly RoutePoint[];
}

/** Why a file could not become a trail. */
export type GpxProblem = 'unreadable' | 'empty';

export type GpxReading =
	| { readonly ok: true; readonly track: GpxTrack }
	| { readonly ok: false; readonly problem: GpxProblem };

const ANY_NAMESPACE = '*';

export function readGpx(xml: string): GpxReading {
	const document = new DOMParser().parseFromString(xml, 'application/xml');
	const isGpx =
		document.getElementsByTagName('parsererror').length === 0 &&
		document.documentElement.localName === 'gpx';
	if (!isGpx) return { ok: false, problem: 'unreadable' };

	const track = lineOf(document, 'trkseg', 'trkpt');
	const route = track.length > 0 ? track : lineOf(document, 'rte', 'rtept');
	if (route.length === 0) return { ok: false, problem: 'empty' };
	return { ok: true, track: { name: nameOf(document), route } };
}

/** Every `pointName` point, with a break wherever a new `runName` element begins. */
function lineOf(document: Document, runName: string, pointName: string): RoutePoint[] {
	const line: RoutePoint[] = [];
	for (const run of document.getElementsByTagNameNS(ANY_NAMESPACE, runName)) {
		const points = [...run.getElementsByTagNameNS(ANY_NAMESPACE, pointName)].flatMap(routePoint);
		const [first, ...rest] = points;
		if (first === undefined) continue;
		line.push(line.length > 0 ? { ...first, startsSegment: true } : first, ...rest);
	}
	return line;
}

/** The point an element describes, or nothing when its coordinate is not one. */
function routePoint(element: Element): RoutePoint[] {
	const latitude = numberIn(element.getAttribute('lat'));
	const longitude = numberIn(element.getAttribute('lon'));
	if (latitude === undefined || longitude === undefined || !isCoordinate(latitude, longitude)) {
		return [];
	}
	const elevation = numberIn(childText(element, 'ele'));
	const time = Date.parse(childText(element, 'time') ?? '');
	return [
		{
			latitude,
			longitude,
			...(elevation === undefined ? {} : { elevation }),
			...(Number.isFinite(time) ? { time } : {})
		}
	];
}

function nameOf(document: Document): string | null {
	for (const parentName of ['trk', 'rte', 'metadata']) {
		const parent = document.getElementsByTagNameNS(ANY_NAMESPACE, parentName).item(0);
		const name = parent === null ? '' : (childText(parent, 'name') ?? '').trim();
		if (name !== '') return name;
	}
	return null;
}

/** The text of the first direct child called `name`. */
function childText(element: Element, name: string): string | null {
	const child = [...element.children].find((candidate) => candidate.localName === name);
	return child?.textContent ?? null;
}

/** `text` as a finite number. Blank text is no number, though `Number('')` is 0. */
function numberIn(text: string | null): number | undefined {
	if (text === null || text.trim() === '') return undefined;
	const value = Number(text);
	return Number.isFinite(value) ? value : undefined;
}
