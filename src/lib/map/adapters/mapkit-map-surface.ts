//
// Apple Maps, through MapKit JS.
//
// MapKit JS is not bundled: Apple's loader fetches it from Apple's CDN, and
// the token decides whether Apple serves it a map. So this adapter is the
// one file that needs a connection and a credential, and no suite runs it;
// the browser tests run `SketchMapSurface` in its place.
//

import {
	load,
	type Annotation,
	type Coordinate as AppleCoordinate,
	type CoordinateRegion,
	type Map as AppleMap,
	type MapEvent,
	type MapKit,
	type Overlay
} from '@apple/mapkit-loader';
import type { Bounds, Coordinate } from '#lib/general/geodesy.ts';
import { withBreathingRoom } from '../framing.ts';
import type { Insets, MapLine, MapMarker, MapSurface, TapHandler } from '../map-surface.ts';
import './mapkit-map-surface.css';

const LIBRARIES = ['map', 'annotations', 'overlays'];
const ROUTE_WIDTH = 5;
/** The border under a route, which keeps it legible over forest and rock alike. */
const CASING_WIDTH = 8;
/** The iOS app's figure for a library line beside the selected one. */
const FADED_OPACITY = 0.6;
const HIGHLIGHT_CLASS = 'mapkit-highlight';
/** Half the dot's height: MapKit anchors an annotation by its bottom edge. */
const HIGHLIGHT_ANCHOR_OFFSET = -11;

/**
 * Whether Apple accepted the token. One answer per page: MapKit JS says so
 * once, on the first map, and a second map would wait forever for it.
 */
let authorization: Promise<void> | null = null;

export async function createMapKitSurface(
	container: HTMLElement,
	token: string,
	opening: Bounds
): Promise<MapSurface> {
	const mapkit = await load({ token, libraries: LIBRARIES });
	authorization ??= new Promise<void>((resolve, reject) => {
		mapkit.addEventListener(
			'configuration-change',
			() => {
				resolve();
			},
			{ once: true }
		);
		mapkit.addEventListener(
			'error',
			() => {
				reject(new Error('MapKit JS could not be authorized.'));
			},
			{ once: true }
		);
	});

	const map = new mapkit.Map(container, {
		region: regionOf(mapkit, opening),
		colorScheme: mapkit.ColorScheme.Adaptive,
		isRotationEnabled: false,
		showsMapTypeControl: false
	});
	try {
		await authorization;
	} catch (error) {
		map.destroy();
		throw error;
	}
	return new MapKitMapSurface(mapkit, map, container);
}

class MapKitMapSurface implements MapSurface {
	readonly #mapkit: MapKit;
	readonly #map: AppleMap;
	readonly #container: HTMLElement;
	readonly #darkScheme = matchMedia('(prefers-color-scheme: dark)');
	readonly #reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
	#lines: readonly MapLine[] = [];
	#markers: readonly MapMarker[] = [];
	#overlays: Overlay[] = [];
	#annotations: Annotation[] = [];
	#highlight: Annotation | null = null;
	#tapHandler: TapHandler | null = null;

	constructor(mapkit: MapKit, map: AppleMap, container: HTMLElement) {
		this.#mapkit = mapkit;
		this.#map = map;
		this.#container = container;
		map.addEventListener('single-tap', this.#onSingleTap);
		this.#darkScheme.addEventListener('change', this.#onColorSchemeChange);
	}

	setLines(lines: readonly MapLine[]): void {
		this.#lines = lines;
		this.#map.removeOverlays(this.#overlays);
		this.#overlays = this.#map.addOverlays(lines.flatMap((line) => this.#overlaysFor(line)));
	}

	setMarkers(markers: readonly MapMarker[]): void {
		this.#markers = markers;
		const { MarkerAnnotation, FeatureVisibility } = this.#mapkit;
		const color = this.#token('--route-color');
		this.#map.removeAnnotations(this.#annotations);
		this.#annotations = this.#map.addAnnotations(
			markers.map(
				(marker) =>
					new MarkerAnnotation(this.#coordinate(marker.coordinate), {
						color,
						glyphText: marker.glyph,
						title: marker.label,
						accessibilityLabel: marker.label,
						titleVisibility: FeatureVisibility.Hidden,
						calloutEnabled: false
					})
			)
		);
	}

	setHighlight(coordinate: Coordinate | null): void {
		if (coordinate === null) {
			if (this.#highlight !== null) this.#map.removeAnnotation(this.#highlight);
			this.#highlight = null;
			return;
		}
		if (this.#highlight !== null) {
			this.#highlight.coordinate = this.#coordinate(coordinate);
			return;
		}
		this.#highlight = this.#map.addAnnotation(
			new this.#mapkit.Annotation(this.#coordinate(coordinate), highlightElement, {
				anchorOffset: new DOMPoint(0, HIGHLIGHT_ANCHOR_OFFSET),
				calloutEnabled: false,
				enabled: false
			})
		);
	}

	setTapHandler(handler: TapHandler | null): void {
		this.#tapHandler = handler;
	}

	setInsets({ top, right, bottom, left }: Insets): void {
		this.#map.padding = new this.#mapkit.Padding(top, right, bottom, left);
	}

	frame(bounds: Bounds): void {
		const region = regionOf(this.#mapkit, withBreathingRoom(bounds));
		this.#map.setRegionAnimated(region, !this.#reducedMotion.matches);
	}

	destroy(): void {
		this.#darkScheme.removeEventListener('change', this.#onColorSchemeChange);
		this.#map.removeEventListener('single-tap', this.#onSingleTap);
		this.#map.destroy();
	}

	readonly #onSingleTap = (event: Event): void => {
		if (this.#tapHandler === null || !isMapEvent(event)) return;
		const { latitude, longitude } = this.#map.convertPointOnPageToCoordinate(event.pointOnPage);
		this.#tapHandler({ latitude, longitude });
	};

	/** A line and a pin keep the color they were made with, so a new scheme means new ones. */
	readonly #onColorSchemeChange = (): void => {
		this.setLines(this.#lines);
		this.setMarkers(this.#markers);
	};

	#overlaysFor(line: MapLine): Overlay[] {
		const { PolylineOverlay, Style } = this.#mapkit;
		const stroke = new Style({
			lineWidth: ROUTE_WIDTH,
			lineJoin: 'round',
			lineCap: 'round',
			strokeColor: this.#token('--route-color'),
			strokeOpacity: line.emphasis === 'faded' ? FADED_OPACITY : 1
		});
		const casing = new Style({
			lineWidth: CASING_WIDTH,
			lineJoin: 'round',
			lineCap: 'round',
			strokeColor: this.#token('--route-casing-color')
		});

		const paths = line.pieces
			.filter((piece) => piece.length > 1)
			.map((piece) => piece.map((point) => this.#coordinate(point)));
		const casings =
			line.emphasis === 'primary'
				? paths.map((path) => new PolylineOverlay(path, { style: casing, enabled: false }))
				: [];
		const strokes = paths.map(
			(path) => new PolylineOverlay(path, { style: stroke, enabled: false })
		);
		return [...casings, ...strokes];
	}

	#coordinate({ latitude, longitude }: Coordinate): AppleCoordinate {
		return new this.#mapkit.Coordinate(latitude, longitude);
	}

	/** A design token's value: the map's colors are the page's, written once in `tokens.css`. */
	#token(name: string): string {
		return getComputedStyle(this.#container).getPropertyValue(name).trim();
	}
}

function regionOf(mapkit: MapKit, bounds: Bounds): CoordinateRegion {
	return new mapkit.BoundingRegion(
		bounds.north,
		bounds.east,
		bounds.south,
		bounds.west
	).toCoordinateRegion();
}

function isMapEvent(event: Event): event is MapEvent {
	return 'pointOnPage' in event;
}

function highlightElement(): HTMLElement {
	const element = document.createElement('div');
	element.className = HIGHLIGHT_CLASS;
	return element;
}
