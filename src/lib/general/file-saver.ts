/** A document on its way out of the app. */
export interface TextFile {
	readonly name: string;
	readonly mimeType: string;
	readonly contents: string;
}

/** Hands a file to the person using the app, to keep wherever they choose. */
export interface FileSaver {
	save(file: TextFile): void;
}
