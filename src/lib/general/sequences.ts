/** Each element paired with the one after it: `[a, b, c]` yields `[a, b]` then `[b, c]`. */
export function* adjacentPairs<Element>(
	elements: Iterable<Element>
): Generator<readonly [Element, Element]> {
	let previous: { readonly element: Element } | null = null;
	for (const element of elements) {
		if (previous !== null) yield [previous.element, element];
		previous = { element };
	}
}
