/** Query an element that the markup guarantees, failing loudly if it moved. */
export function must<T extends Element>(selector: string, root: ParentNode = document): T {
	const el = root.querySelector<T>(selector);
	if (!el) throw new Error(`Expected element ${selector} to exist`);
	return el;
}
