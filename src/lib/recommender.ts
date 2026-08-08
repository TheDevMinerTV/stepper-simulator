import {
	calculateDriveCurrent,
	calculateLoadTorqueCoefficient,
	calculateMaxCurrentAtSpecifiedPower,
	calculateRotorTorqueCoefficient,
	calculateTorqueAtVelocity
} from '@/lib/formulas';
import type {
	Millimeter,
	MillimetersPerSecond,
	MillimetersPerSecondSquared,
	Seconds,
	StepperDefinition,
	Watts
} from '@/lib/stepper';
import type { DriveSettings, GantrySettings } from '@/state/atoms';

/** Far past any real machine: only ever used as the closed end of a bisection */
const SEARCH_VELOCITY_CEILING = 100_000;
const BISECTION_STEPS = 60;
/** Samples of the move-time curve before the winner is refined by golden section */
const COARSE_SAMPLES = 256;
const GOLDEN_SECTION_STEPS = 60;
/** Within this much of the triangular-profile limit, call the move path-limited */
const PATH_LIMITED_TOLERANCE = 0.999;

export type MoveRecommenderSettings = {
	/** Length of the move being optimized for, in mm */
	pathLength: Millimeter;
	/** Fraction of the computed acceleration ceiling held back as headroom, 0..1 */
	safetyMargin: number;
};

export type MoveRecommendation = {
	stepper: StepperDefinition;
	/** Peak velocity of the fastest feasible profile over the path */
	velocity: MillimetersPerSecond;
	/** Acceleration of that profile */
	acceleration: MillimetersPerSecondSquared;
	/** Time for the whole move, rest to rest */
	moveTime: Seconds;
	/**
	 * The path is too short to ever reach the motor's velocity ceiling: the profile is triangular,
	 * and a faster motor would not help unless the acceleration goes up with it.
	 */
	pathLimited: boolean;
	/** Acceleration ceiling at standstill, i.e. the best case the motor can ever offer */
	maxAcceleration: MillimetersPerSecondSquared;
	/**
	 * Fastest velocity that still holds the margin at the acceleration configured in Gantry
	 * Settings, or `null` when that acceleration is out of reach even at standstill.
	 */
	velocityAtConfiguredAcceleration: MillimetersPerSecond | null;
};

/**
 * Largest gantry acceleration the stepper can sustain while moving at `velocity`, in mm/s².
 *
 * Both torque sinks are linear in acceleration, so this is a division rather than a solve. The raw
 * (undegraded) torque goes in: subtracting the rotor term first would double-count it, since it is
 * already part of the divisor.
 */
export function createAccelerationLimit(
	driveSettings: DriveSettings,
	gantrySettings: GantrySettings,
	stepper: StepperDefinition
): ((velocity: number) => number) | null {
	const maxPower = (driveSettings.inputVoltage * driveSettings.maxDriveCurrent) as Watts;
	const driveCurrent = calculateDriveCurrent(
		driveSettings,
		stepper,
		calculateMaxCurrentAtSpecifiedPower(maxPower, stepper)
	);
	const rotorCoefficient = calculateRotorTorqueCoefficient(gantrySettings, stepper);

	// A manual required torque replaces the mass model with a flat torque sink, so it is a constant
	// on the wrong side of the division: only the rotor term still scales with acceleration
	if (gantrySettings.manualRequiredTorque !== null) {
		const manualTorque = gantrySettings.manualRequiredTorque;
		if (!(rotorCoefficient > 0)) return null;

		return (velocity) =>
			Math.max(
				calculateTorqueAtVelocity(driveSettings, gantrySettings, stepper, driveCurrent, velocity) -
					manualTorque,
				0
			) / rotorCoefficient;
	}

	const torqueCoefficient = calculateLoadTorqueCoefficient(gantrySettings) + rotorCoefficient;
	// Nothing to accelerate: acceleration is unbounded and there is no recommendation to make
	if (!(torqueCoefficient > 0)) return null;

	return (velocity) =>
		Math.max(calculateTorqueAtVelocity(driveSettings, gantrySettings, stepper, driveCurrent, velocity), 0) /
		torqueCoefficient;
}

/** Root of a function that is positive at `lower` and negative at `upper` */
function bisect(f: (x: number) => number, lower: number, upper: number) {
	let lo = lower;
	let hi = upper;
	for (let i = 0; i < BISECTION_STEPS; i++) {
		const mid = (lo + hi) / 2;
		if (f(mid) > 0) lo = mid;
		else hi = mid;
	}

	return lo;
}

/** Minimum of a unimodal function bracketed by `lower` and `upper` */
function goldenSectionMinimum(f: (x: number) => number, lower: number, upper: number) {
	const invPhi = (Math.sqrt(5) - 1) / 2;
	let lo = lower;
	let hi = upper;
	let a = hi - (hi - lo) * invPhi;
	let b = lo + (hi - lo) * invPhi;
	let fa = f(a);
	let fb = f(b);

	for (let i = 0; i < GOLDEN_SECTION_STEPS; i++) {
		if (fa < fb) {
			hi = b;
			b = a;
			fb = fa;
			a = hi - (hi - lo) * invPhi;
			fa = f(a);
		} else {
			lo = a;
			a = b;
			fa = fb;
			b = lo + (hi - lo) * invPhi;
			fb = f(b);
		}
	}

	return (lo + hi) / 2;
}

/**
 * Fastest velocity/acceleration pair a stepper can run over a path of `pathLength`.
 *
 * The move is a rest-to-rest trapezoid. For a peak velocity `p` the largest usable acceleration is
 * whatever the motor still makes at `p` (the limit curve only falls as velocity rises, so the top of
 * the ramp is the binding point), and the move takes `d/p + p/a`. Both terms fight each other, so
 * the answer is the minimum of that curve, not either extreme.
 *
 * Returns `null` when the stepper cannot move the gantry at all, or when there is nothing to move.
 */
export function recommendMove(
	driveSettings: DriveSettings,
	gantrySettings: GantrySettings,
	stepper: StepperDefinition,
	{ pathLength, safetyMargin }: MoveRecommenderSettings
): MoveRecommendation | null {
	if (!(pathLength > 0)) return null;

	const limit = createAccelerationLimit(driveSettings, gantrySettings, stepper);
	if (!limit) return null;

	const accelerationLimit = (velocity: number) => limit(velocity) * (1 - safetyMargin);

	const maxAcceleration = accelerationLimit(0);
	if (!(maxAcceleration > 0) || !Number.isFinite(maxAcceleration)) return null;

	// Peak velocities above this cannot be reached inside the path even at the motor's own ceiling:
	// `a(p) · d - p²` starts positive and falls monotonically, since `a` only ever decreases
	const reachable = (peak: number) => accelerationLimit(peak) * pathLength - peak * peak;
	if (reachable(SEARCH_VELOCITY_CEILING) >= 0) return null;
	const peakCeiling = bisect(reachable, 0, SEARCH_VELOCITY_CEILING);
	if (!(peakCeiling > 0)) return null;

	const moveTimeAt = (peak: number) => pathLength / peak + peak / accelerationLimit(peak);

	let bestIndex = COARSE_SAMPLES;
	let bestTime = Infinity;
	for (let i = 1; i <= COARSE_SAMPLES; i++) {
		const time = moveTimeAt((peakCeiling * i) / COARSE_SAMPLES);
		if (time < bestTime) {
			bestTime = time;
			bestIndex = i;
		}
	}

	const bracketLow = (peakCeiling * Math.max(bestIndex - 1, 0.01)) / COARSE_SAMPLES;
	const bracketHigh = (peakCeiling * Math.min(bestIndex + 1, COARSE_SAMPLES)) / COARSE_SAMPLES;
	const velocity = goldenSectionMinimum(moveTimeAt, bracketLow, bracketHigh);
	const acceleration = accelerationLimit(velocity);

	const configuredAcceleration = gantrySettings.acceleration;
	const velocityAtConfiguredAcceleration =
		configuredAcceleration > 0 && maxAcceleration >= configuredAcceleration
			? (bisect(
					(v) => accelerationLimit(v) - configuredAcceleration,
					0,
					SEARCH_VELOCITY_CEILING
				) as MillimetersPerSecond)
			: null;

	return {
		stepper,
		velocity: velocity as MillimetersPerSecond,
		acceleration: acceleration as MillimetersPerSecondSquared,
		moveTime: (pathLength / velocity + velocity / acceleration) as Seconds,
		pathLimited: velocity * velocity >= PATH_LIMITED_TOLERANCE * acceleration * pathLength,
		maxAcceleration: maxAcceleration as MillimetersPerSecondSquared,
		velocityAtConfiguredAcceleration
	};
}

/** Path length the recommender defaults to when the user has not picked one: half the bed */
export const defaultPathLength = (bedSize: Millimeter) => (bedSize / 2) as Millimeter;

export const resolvePathLength = (gantrySettings: GantrySettings) =>
	gantrySettings.movePathLength ?? defaultPathLength(gantrySettings.bedSize);

export const resolveSafetyMargin = (gantrySettings: GantrySettings) =>
	Math.min(Math.max(gantrySettings.safetyMarginPercent, 0), 99) / 100;

export function recommendMoves(
	driveSettings: DriveSettings,
	gantrySettings: GantrySettings,
	steppers: StepperDefinition[]
) {
	const settings: MoveRecommenderSettings = {
		pathLength: resolvePathLength(gantrySettings),
		safetyMargin: resolveSafetyMargin(gantrySettings)
	};

	return steppers.map((stepper) => ({
		stepper,
		recommendation: recommendMove(driveSettings, gantrySettings, stepper, settings)
	}));
}
