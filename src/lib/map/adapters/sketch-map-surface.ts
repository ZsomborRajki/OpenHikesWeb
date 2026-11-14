//
// A map without a map service: trails drawn to scale on a blank sheet.
//
// It is what the app shows when no MapKit token is configured, so a fresh
// checkout runs with no credential. And it is what the browser tests run
// against, so no suite reaches Apple and a pin is an element a test can find.
// It does not pan or zoom; the camera goes where it is framed.
//

import type { Bounds, Coordinate } from '#lib/general/geodesy.ts';
import { withBreathingRoom } from '../framing.ts';
import {
	NO_INSETS,
	type Insets,
	type MapLine,
	type MapMarker,
	type MapSurface,
	type TapHandler
} from '../map-surface.ts';
import { project, unproject, viewportShowing, type Viewport } from './sketch-projection.ts';
import './sketch-map-surface.css';

const SVG_NAMESPACE = 'http://www.w3.org/2000/svg';
const NOTE = 'Add a MapKit token to see Apple Maps.';
const HIGHLIGHT_LABEL = 'Position on the trail';

export function createSketchSurface(container: HTMLElement, opening: Bounds): Promise<MapSurface> {
	return Promise.resolve(new SketchMapSurface(container, opening));
}

class SketchMapSurface implements MapSurface {
	readonly #sheet = element('div', 'sketch-map');
	readonly #drawing = document.createElementNS(SVG_NAMESPACE, 'svg');
	readonly #pins = element('div', 'sketch-pins');
	readonly #dot = element('div', 'sketch-dot');
	readonly #resizes = new ResizeObserver(() => {
		this.#draw();
	});
	#lines: readonly MapLine[] = [];
	#markers: readonly MapMarker[] = [];
	#highlight: Coordinate | null = null;
	#tapHandler: TapHandler | null = null;
	#insets: Insets = NO_INSETS;
	#shown: Bounds;

	constructor(container: HTMLElement, opening: Bounds) {
		this.#shown = opening;
		this.#drawing.setAttribute('aria-hidden', 'true');
		this.#dot.setAttribute('role', 'img');
		this.#dot.setAttribute('aria-label', HIGHLIGHT_LABEL);
		this.#dot.hidden = true;
		const note = element('p', 'sketch-note');
		note.textContent = NOTE;
		this.#sheet.append(this.#drawing, this.#pins, this.#dot, note);
		this.#sheet.addEventListener('click', this.#onClick);
		container.append(this.#sheet);
		this.#resizes.observe(this.#sheet);
	}

	setLines(lines: readonly MapLine[]): void {
		this.#lines = lines;
		this.#drawLines(this.#viewport());
	}

	setMarkers(markers: readonly MapMarker[]): void {
		this.#markers = markers;
		this.#drawMarkers(this.#viewport());
	}

	setHighlight(coordinate: Coordinate | null): void {
		this.#highlight = coordinate;
		this.#drawHighlight(this.#viewport());
	}

	setTapHandler(handler: TapHandler | null): void {
		this.#tapHandler = handler;
		this.#sheet.classList.toggle('sketch-map-tappable', handler !== null);
	}

	setInsets(insets: Insets): void {
		this.#insets = insets;
		this.#draw();
	}

	frame(bounds: Bounds): void {
		this.#shown = withBreathingRoom(bounds);
		this.#draw();
	}

	destroy(): void {
		this.#resizes.disconnect();
		this.#sheet.remove();
	}

	readonly #onClick = (event: MouseEvent): void => {
		if (this.#tapHandler === null) return;
		const sheet = this.#sheet.getBoundingClientRect();
		const point = { x: event.clientX - sheet.left, y: event.clientY - sheet.top };
		this.#tapHandler(unproject(point, this.#viewport()));
	};

	#viewport(): Viewport {
		const size = { width: this.#sheet.clientWidth, height: this.#sheet.clientHeight };
		return viewportShowing(this.#shown, size, this.#insets);
	}

	#draw(): void {
		const viewport = this.#viewport();
		this.#drawLines(viewport);
		this.#drawMarkers(viewport);
		this.#drawHighlight(viewport);
	}

	#drawLines(viewport: Viewport): void {
		this.#drawing.replaceChildren(
			...this.#lines.flatMap((line) => {
				const outline = pathData(line, viewport);
				const stroke = path(outline, `sketch-line sketch-line-${line.emphasis}`);
				return line.emphasis === 'primary' ? [path(outline, 'sketch-casing'), stroke] : [stroke];
			})
		);
	}

	#drawMarkers(viewport: Viewport): void {
		this.#pins.replaceChildren(
			...this.#markers.map((marker) => {
				const pin = element('div', 'sketch-pin');
				pin.setAttribute('role', 'img');
				pin.setAttribute('aria-label', marker.label);
				pin.textContent = marker.glyph;
				place(pin, marker.coordinate, viewport);
				return pin;
			})
		);
	}

	#drawHighlight(viewport: Viewport): void {
		this.#dot.hidden = this.#highlight === null;
		if (this.#highlight !== null) place(this.#dot, this.#highlight, viewport);
	}
}

function element<Name extends keyof HTMLElementTagNameMap>(
	name: Name,
	className: string
): HTMLElementTagNameMap[Name] {
	const created = document.createElement(name);
	created.className = className;
	return created;
}

function path(data: string, className: string): SVGPathElement {
	const created = document.createElementNS(SVG_NAMESPACE, 'path');
	created.setAttribute('d', data);
	created.setAttribute('class', className);
	return created;
}

function pathData(line: MapLine, viewport: Viewport): string {
	return line.pieces
		.map((piece) =>
			piece
				.map((coordinate, index) => {
					const { x, y } = project(coordinate, viewport);
					return `${index === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`;
				})
				.join(' ')
		)
		.join(' ');
}

function place(target: HTMLElement, coordinate: Coordinate, viewport: Viewport): void {
	const { x, y } = project(coordinate, viewport);
	target.style.left = `${x.toFixed(1)}px`;
	target.style.top = `${y.toFixed(1)}px`;
}
