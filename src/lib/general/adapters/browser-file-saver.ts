import type { FileSaver, TextFile } from '../file-saver.ts';

/** Saves through the browser's own download: a link to the file, clicked for the visitor. */
export class BrowserFileSaver implements FileSaver {
	save({ name, mimeType, contents }: TextFile): void {
		const url = URL.createObjectURL(new Blob([contents], { type: mimeType }));
		const link = document.createElement('a');
		link.href = url;
		link.download = name;
		link.click();
		URL.revokeObjectURL(url);
	}
}
