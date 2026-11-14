import { describe, expect, it } from 'vitest';
import { mapInsets, panelLayout } from './panel-layout.ts';

describe('panel layout', () => {
	it.each([
		['a laptop', 1280, 800, 'sidePanel'],
		['a tablet upright', 820, 1180, 'sidePanel'],
		['the narrowest window with room for a map beside the panel', 768, 800, 'sidePanel'],
		['a window a pixel narrower than that', 767, 800, 'bottomSheet'],
		['a phone upright', 393, 852, 'bottomSheet'],
		['a phone on its side', 667, 375, 'sidePanel']
	])('lays out %s (%d × %d) with a %s', (_, width, height, expected) => {
		expect(panelLayout({ width, height })).toBe(expected);
	});

	it('covers the leading edge of the map with a side panel', () => {
		expect(mapInsets('sidePanel', 'medium', 800)).toEqual({
			top: 0,
			right: 0,
			bottom: 0,
			left: 384
		});
	});

	it('covers the bottom of the map with a sheet, as high as its detent', () => {
		expect(mapInsets('bottomSheet', 'compact', 852).bottom).toBe(104);
		expect(mapInsets('bottomSheet', 'medium', 852).bottom).toBe(383);
	});

	it('counts a full sheet as resting at its middle', () => {
		expect(mapInsets('bottomSheet', 'large', 852)).toEqual(mapInsets('bottomSheet', 'medium', 852));
	});
});
