import {
	calculateDriveCurrent,
	calculateLoadTorqueCoefficient,
	calculateMaxCurrentAtSpecifiedPower,
	calculateRotorTorqueCoefficient,
	calculateTorqueAtVelocity
} from '@/lib/formulas';
import {
	buildMoveProfile,
	calculateJunctionVelocity,
	solveTimeOptimalProfile,
	type CornerSettings,
	type MoveProfile,
	type TimeOptimalProfile
} from '@/lib/motion';
import type {
	Millimeter,
	MillimetersPerSecond,
	MillimetersPerSecondSquared,
	Seconds,
	StepperDefinition,
	Watts
} from '@/lib/stepper';
import type { DriveSettings, GantrySettings, KlipperSettings } from '@/state/atoms';

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
	/** Fraction of the computed acceleration ceiling held back, 0..1 */
	headroom: number;
	/** The corners on either side of the move, which set the velocity it enters and leaves at */
	corner: CornerSettings;
	/** Klipper's `minimum_cruise_ratio`: share of the move that has to be spent cruising, 0..1 */
	minimumCruiseRatio: number;
};

export type MoveRecommendation = {
	stepper: StepperDefinition;
	/** Peak velocity of the fastest feasible profile over the path */
	velocity: MillimetersPerSecond;
	/** Acceleration of that profile */
	acceleration: MillimetersPerSecondSquared;
	/** Time for the whole move, corner to corner */
	moveTime: Seconds;
	/** Velocity carried through the corners on either side */
	junctionVelocity: MillimetersPerSecond;
	profile: MoveProfile;
	/**
	 * Same motor and the same headroom, but with acceleration free to follow the torque curve instead
	 * of being one constant. A floor Klipper cannot reach, not a recommendation.
	 */
	timeOptimal: TimeOptimalProfile | null;
	/**
	 * The path is too short to ever reach the motor's velocity ceiling: the profile is triangular,
	 * and a faster motor would not help unless the acceleration goes up with it.
	 */
	pathLimited: boolean;
	/** Acceleration ceiling at standstill, i.e. the best case the motor can ever offer */
	maxAcceleration: MillimetersPerSecondSquared;
	/**
	 * Fastest velocity that still keeps the headroom at the acceleration configured in Gantry
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
 * The move is a symmetric trapezoid between two identical corners: it enters and leaves at whatever
 * junction velocity Klipper would carry through them, rather than starting from rest. For a peak
 * velocity `p` the largest usable acceleration is whatever the motor still makes at `p` (the limit
 * curve only falls as velocity rises, so the top of the ramp is the binding point). Ramping and
 * cruising fight each other, so the answer is the minimum of the move-time curve over `p`, not
 * either extreme.
 *
 * Returns `null` when the stepper cannot move the gantry at all, or when there is nothing to move.
 */
export function recommendMove(
	driveSettings: DriveSettings,
	gantrySettings: GantrySettings,
	stepper: StepperDefinition,
	{ pathLength, headroom, corner, minimumCruiseRatio }: MoveRecommenderSettings
): MoveRecommendation | null {
	if (!(pathLength > 0)) return null;

	const limit = createAccelerationLimit(driveSettings, gantrySettings, stepper);
	if (!limit) return null;

	const accelerationLimit = (velocity: number) => limit(velocity) * (1 - headroom);

	const maxAcceleration = accelerationLimit(0);
	if (!(maxAcceleration > 0) || !Number.isFinite(maxAcceleration)) return null;

	const profileAt = (peak: number) => {
		const acceleration = accelerationLimit(peak);
		const junctionVelocity = calculateJunctionVelocity(corner, acceleration, pathLength, peak);

		return buildMoveProfile(pathLength, peak, junctionVelocity, acceleration);
	};

	// Klipper's lookahead refuses to plan a move that is all ramp and no cruise. In `flush()` the
	// peak is held to `(smoothed_v2 + reachable_smoothed_v2) · 0.5`, where the reachable term uses
	// `smooth_delta_v2 = 2·d·max_accel_to_decel` and `max_accel_to_decel = accel·(1 − ratio)`. For a
	// move between two equal corners that collapses to `peak² ≤ v_j² + d·a·(1 − ratio)`, which is the
	// same thing as insisting that `ratio` of the distance is spent at the peak
	const minimumCruiseDistance = minimumCruiseRatio * pathLength;

	// Peak velocities above this cannot be reached inside the path even at the motor's own ceiling.
	// The corner velocity is capped by the peak, so for small peaks the whole move is a cruise and
	// this is trivially positive; past that it falls monotonically, since acceleration only decreases
	const reachable = (peak: number) => {
		if (!(accelerationLimit(peak) > 0)) return -1;
		return profileAt(peak).cruiseDistance - minimumCruiseDistance;
	};
	if (reachable(SEARCH_VELOCITY_CEILING) >= 0) return null;
	const peakCeiling = bisect(reachable, 0, SEARCH_VELOCITY_CEILING);
	if (!(peakCeiling > 0)) return null;

	const moveTimeAt = (peak: number) => profileAt(peak).moveTime;

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
	const profile = profileAt(velocity);

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
		// Same corners, so the floor and the recommendation share their endpoints and compare directly
		timeOptimal: solveTimeOptimalProfile(accelerationLimit, pathLength, profile.junctionVelocity),
		velocity: profile.peakVelocity,
		acceleration: profile.acceleration,
		moveTime: profile.moveTime,
		junctionVelocity: profile.junctionVelocity,
		profile,
		// Sitting on the cruise floor means the path ran out first, not the motor
		pathLimited: profile.cruiseDistance <= minimumCruiseDistance + (1 - PATH_LIMITED_TOLERANCE) * pathLength,
		maxAcceleration: maxAcceleration as MillimetersPerSecondSquared,
		velocityAtConfiguredAcceleration
	};
}

/** Path length the recommender defaults to when the user has not picked one: half the bed */
export const defaultPathLength = (bedSize: Millimeter) => (bedSize / 2) as Millimeter;

export const resolvePathLength = (gantrySettings: GantrySettings) =>
	gantrySettings.movePathLength ?? defaultPathLength(gantrySettings.bedSize);

export const resolveHeadroom = (gantrySettings: GantrySettings) =>
	Math.min(Math.max(gantrySettings.headroomPercent, 0), 99) / 100;

/** A ratio of 1 would leave no distance to accelerate over, so the knob stops short of it */
export const resolveMinimumCruiseRatio = (klipperSettings: KlipperSettings) =>
	Math.min(Math.max(klipperSettings.minimumCruiseRatio, 0), 0.95);

export function recommendMoves(
	driveSettings: DriveSettings,
	gantrySettings: GantrySettings,
	klipperSettings: KlipperSettings,
	steppers: StepperDefinition[]
) {
	const settings: MoveRecommenderSettings = {
		pathLength: resolvePathLength(gantrySettings),
		headroom: resolveHeadroom(gantrySettings),
		// The corner mixes a firmware value with a property of the path being simulated
		corner: {
			squareCornerVelocity: klipperSettings.squareCornerVelocity,
			cornerAngle: gantrySettings.cornerAngle
		},
		minimumCruiseRatio: resolveMinimumCruiseRatio(klipperSettings)
	};

	return steppers.map((stepper) => ({
		stepper,
		recommendation: recommendMove(driveSettings, gantrySettings, stepper, settings)
	}));
}
