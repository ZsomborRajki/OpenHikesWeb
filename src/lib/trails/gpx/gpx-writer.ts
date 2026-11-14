//
// Writes a trail out as GPX 1.1: the way a trail leaves the web app, and the
// file the iOS app imports.
//
// The shape follows the iOS app's `GPXExport`, so a trail that crosses reads
// the same as one the app wrote: seven decimals of a degree, centimeters of
// height, a `<trkseg>` per unbroken piece of the line.
//

import type { TextFile } from '#lib/general/file-saver.ts';
import { routePieces, type RoutePoint, type Trail } from '../trail.ts';

/** Named in the file, so a track that turns up in another app says where it came from. */
const GPX_CREATOR = 'OpenHikes Web';
export const GPX_MIME_TYPE = 'application/gpx+xml';

/** About a centimeter on the ground, and fixed-point: `xsd:decimal` has no exponent. */
const COORDINATE_FRACTION_DIGITS = 7;
const ELEVATION_FRACTION_DIGITS = 2;
const MAXIMUM_FILE_STEM_LENGTH = 64;
const FALLBACK_FILE_STEM = 'Trail';

/** The trail as a file to save. */
export function gpxFile(trail: Trail): TextFile {
	return { name: gpxFileName(trail.title), mimeType: GPX_MIME_TYPE, contents: gpxDocument(trail) };
}

export function gpxDocument(trail: Trail): string {
	const name = xmlEscaped(trail.title);
	const segments = routePieces(trail.route).map(
		(piece) => `    <trkseg>\n${piece.map(trackPoint).join('')}    </trkseg>\n`
	);
	return (
		'<?xml version="1.0" encoding="UTF-8"?>\n' +
		`<gpx version="1.1" creator="${xmlEscaped(GPX_CREATOR)}"` +
		' xmlns="http://www.topografix.com/GPX/1/1">\n' +
		'  <metadata>\n' +
		`    <name>${name}</name>\n` +
		`    <time>${new Date(trail.addedAt).toISOString()}</time>\n` +
		'  </metadata>\n' +
		'  <trk>\n' +
		`    <name>${name}</name>\n` +
		// A track must have a segment, even one with nothing in it.
		(segments.length > 0 ? segments.join('') : '    <trkseg>\n    </trkseg>\n') +
		'  </trk>\n' +
		'</gpx>\n'
	);
}

/** A file name the title survives in: "Thumsee Loop.gpx". */
export function gpxFileName(title: string): string {
	const stem = Array.from(title, (character) =>
		isReservedInFileNames(character) ? '-' : character
	)
		.slice(0, MAXIMUM_FILE_STEM_LENGTH)
		.join('')
		// A leading dot would hide the file; a trailing one confuses Windows.
		.replace(/^[\s.]+|[\s.]+$/g, '');
	return `${stem === '' ? FALLBACK_FILE_STEM : stem}.gpx`;
}

/**
 * `text` made safe as element content or an attribute value. Characters XML
 * 1.0 cannot carry at all are dropped: a title pasted from elsewhere can hold
 * them, and a document with one in it is a document no parser reads back.
 */
export function xmlEscaped(text: string): string {
	let escaped = '';
	for (const character of text) {
		if (!isXmlCharacter(character)) continue;
		escaped += XML_ENTITIES[character] ?? character;
	}
	return escaped;
}

const XML_ENTITIES: Readonly<Record<string, string>> = {
	'&': '&amp;',
	'<': '&lt;',
	'>': '&gt;',
	'"': '&quot;',
	"'": '&apos;'
};

function trackPoint(point: RoutePoint): string {
	const position =
		`lat="${point.latitude.toFixed(COORDINATE_FRACTION_DIGITS)}"` +
		` lon="${point.longitude.toFixed(COORDINATE_FRACTION_DIGITS)}"`;
	// Infinity and NaN are not `xsd:decimal`: a strict reader refuses the whole file over one.
	const elevation =
		point.elevation !== undefined && Number.isFinite(point.elevation)
			? `        <ele>${point.elevation.toFixed(ELEVATION_FRACTION_DIGITS)}</ele>\n`
			: '';
	const time =
		point.time === undefined ? '' : `        <time>${new Date(point.time).toISOString()}</time>\n`;
	if (elevation === '' && time === '') return `      <trkpt ${position}/>\n`;
	return `      <trkpt ${position}>\n${elevation}${time}      </trkpt>\n`;
}

/** Tab, newline and carriage return are the only control characters XML 1.0 allows. */
function isXmlCharacter(character: string): boolean {
	const code = character.codePointAt(0) ?? 0;
	if (code < 0x20) return code === 0x9 || code === 0xa || code === 0xd;
	const isLoneSurrogate = code >= 0xd800 && code <= 0xdfff;
	return !isLoneSurrogate && code !== 0xfffe && code !== 0xffff;
}

/** Path separators, what Windows and iCloud Drive reject, and anything unprintable. */
function isReservedInFileNames(character: string): boolean {
	return '/\\:?%*|"<>'.includes(character) || (character.codePointAt(0) ?? 0) < 0x20;
}
