//
// The two facts a model may not reach for by itself. Both are handed in by the
// composition root, so a test decides what an id is and what time it is.
//

/** Makes an identifier nothing else has. */
export type NewId = () => string;

/** The current moment, in milliseconds since the epoch. */
export type Now = () => number;
