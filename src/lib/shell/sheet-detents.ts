//
// The heights a sheet rests at, named as iOS names them.
//

export type Detent = 'compact' | 'medium' | 'large';

const DETENTS: readonly Detent[] = ['compact', 'medium', 'large'];

/** Enough for the grabber and a screen's title. */
const COMPACT_HEIGHT = 104;
const MEDIUM_FRACTION = 0.45;
/** The strip of map a full sheet leaves showing, which says there is a map. */
const LARGE_TOP_GAP = 56;

export function detentHeight(detent: Detent, windowHeight: number): number {
	switch (detent) {
		case 'compact':
			return COMPACT_HEIGHT;
		case 'medium':
			return Math.max(Math.round(windowHeight * MEDIUM_FRACTION), COMPACT_HEIGHT);
		case 'large':
			return Math.max(windowHeight - LARGE_TOP_GAP, COMPACT_HEIGHT);
	}
}

/** The detent a sheet let go at `height` settles to. */
export function nearestDetent(height: number, windowHeight: number): Detent {
	return DETENTS.reduce((nearest, detent) => {
		const distance = Math.abs(detentHeight(detent, windowHeight) - height);
		return distance < Math.abs(detentHeight(nearest, windowHeight) - height) ? detent : nearest;
	});
}

/** The next detent up, and from the top back to the bottom: what a tap on the grabber does. */
export function nextDetent(detent: Detent): Detent {
	return DETENTS[(DETENTS.indexOf(detent) + 1) % DETENTS.length] ?? detent;
}
