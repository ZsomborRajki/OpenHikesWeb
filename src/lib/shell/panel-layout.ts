//
// The shape the app takes in a window: a sheet over the map, or a panel
// beside it. The iOS app's `SheetLayout` rule, with the same two reasons.
//
// The numbers live here and nowhere else. The stylesheet reads them through
// custom properties the shell sets, so a breakpoint cannot drift from the
// rule that decides it.
//

import type { Insets } from '#lib/map/map-surface.ts';
import { detentHeight, type Detent } from './sheet-detents.ts';

export type PanelLayout = 'sidePanel' | 'bottomSheet';

export interface WindowSize {
	readonly width: number;
	readonly height: number;
}

export const PANEL_WIDTH = 360;
/** The gap between the panel and the window's edges. */
export const PANEL_MARGIN = 12;
/** What the panel takes from the map's leading edge. */
const PANEL_INSET = PANEL_WIDTH + 2 * PANEL_MARGIN;
/** Room for a map at least as wide as the panel beside it. */
const MINIMUM_SIDE_PANEL_WINDOW_WIDTH = 2 * PANEL_INSET;
/** Below this a sheet has no height to rest at: a phone held sideways. */
const COMPACT_WINDOW_HEIGHT = 480;

/**
 * A panel wherever there is room for a map beside it, and in any window too
 * short for a sheet. A sheet everywhere else: a phone held upright.
 */
export function panelLayout({ width, height }: WindowSize): PanelLayout {
	const hasRoomForPanel = width >= MINIMUM_SIDE_PANEL_WINDOW_WIDTH;
	const isCompactHeight = height < COMPACT_WINDOW_HEIGHT;
	return hasRoomForPanel || isCompactHeight ? 'sidePanel' : 'bottomSheet';
}

/**
 * The edges of the map the panel covers.
 *
 * A sheet pulled to full height counts as resting at its middle: the map
 * above a full sheet is a sliver, and a trail framed into it would be framed
 * for nobody.
 */
export function mapInsets(layout: PanelLayout, detent: Detent, windowHeight: number): Insets {
	if (layout === 'sidePanel') return { top: 0, right: 0, bottom: 0, left: PANEL_INSET };
	const covering = detent === 'large' ? 'medium' : detent;
	return { top: 0, right: 0, bottom: detentHeight(covering, windowHeight), left: 0 };
}
