//
// The one definition of "climbed", ported from the iOS app's
// `ElevationAccumulator` so a trail climbs the same on both.
//
// Climb and descent are counted in runs, not in single steps. Sensor noise is
// symmetric but summing every rise is not: 2,000 points wandering ±1.5 m
// around one height add up to hundreds of meters of "climb". A run counts
// only once the height has reversed by the threshold, which bounds the error
// to the size of the noise instead of the size of the noise times the points.
//

export interface ElevationChange {
	readonly gainMeters: number;
	readonly lossMeters: number;
	readonly minimumMeters: number;
	readonly maximumMeters: number;
}

/**
 * How far the height has to reverse before the run it interrupted is counted.
 * Above a barometer's short-term noise, below anything a hiker calls a rise.
 */
const REVERSAL_THRESHOLD_METERS = 3;

export class ElevationAccumulator {
	#count = 0;
	#minimum = Infinity;
	#maximum = -Infinity;
	#committedGain = 0;
	#committedLoss = 0;
	/** Where the run in progress started, and the furthest it has reached. */
	#run: { anchor: number; extreme: number } | null = null;

	/**
	 * Feeds one point's height in. A point without one is skipped, and so is
	 * a height that is not a number: NaN loses every comparison, so one of
	 * them would replace the extremes of the whole route.
	 */
	record(elevation: number | undefined): void {
		if (elevation === undefined || !Number.isFinite(elevation)) return;
		this.#count += 1;
		this.#minimum = Math.min(this.#minimum, elevation);
		this.#maximum = Math.max(this.#maximum, elevation);

		const run = this.#run;
		if (run === null) {
			this.#run = { anchor: elevation, extreme: elevation };
			return;
		}

		const isClimbing = run.extreme >= run.anchor;
		const extendsRun = isClimbing ? elevation > run.extreme : elevation < run.extreme;
		if (extendsRun) {
			run.extreme = elevation;
			return;
		}
		if (Math.abs(elevation - run.extreme) < REVERSAL_THRESHOLD_METERS) return;

		// The height turned far enough to prove the run is over.
		if (isClimbing) this.#committedGain += run.extreme - run.anchor;
		else this.#committedLoss += run.anchor - run.extreme;
		this.#run = { anchor: run.extreme, extreme: elevation };
	}

	/**
	 * Closes the run in progress, so the next height starts a new one. For a
	 * gap whose rise is not ground anyone walked: a break in the line.
	 */
	endRun(): void {
		this.#committedGain = this.#gain;
		this.#committedLoss = this.#loss;
		this.#run = null;
	}

	/**
	 * The totals so far, the run in progress included. `null` until there are
	 * two heights: one height is a position, not a change.
	 */
	get change(): ElevationChange | null {
		if (this.#count < 2) return null;
		return {
			gainMeters: this.#gain,
			lossMeters: this.#loss,
			minimumMeters: this.#minimum,
			maximumMeters: this.#maximum
		};
	}

	get #gain(): number {
		const run = this.#run;
		return (
			this.#committedGain +
			(run !== null && run.extreme > run.anchor ? run.extreme - run.anchor : 0)
		);
	}

	get #loss(): number {
		const run = this.#run;
		return (
			this.#committedLoss +
			(run !== null && run.extreme < run.anchor ? run.anchor - run.extreme : 0)
		);
	}
}
