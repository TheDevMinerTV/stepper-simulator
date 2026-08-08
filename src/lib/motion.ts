import type { Degree, Millimeter, MillimetersPerSecond, MillimetersPerSecondSquared, Seconds } from '@/lib/stepper';

/** Klipper clamps the corner cosine to this, so a straight-through corner does not divide by zero */
const COS_THETA_CLAMP = 0.999999;

export type CornerSettings = {
	squareCornerVelocity: MillimetersPerSecond;
	/** How far the path turns at the corner: 0° carries straight through, 180° reverses */
	cornerAngle: Degree;
};

/**
 * Velocity Klipper carries through a corner, in mm/s. Ported from `Move.calc_junction` and
 * `ToolHead._calc_junction_deviation` in Klipper's `toolhead.py`.
 *
 * Klipper's `junction_cos_theta` is the negated dot product of the two move directions, so a corner
 * that turns the path by `cornerAngle` gives `-cos(cornerAngle)`.
 *
 * `junction_deviation` is `scv² · (√2 − 1) / max_accel` and the move multiplies it back by its own
 * acceleration. A recommended acceleration is exactly what would be configured as `max_accel`, so
 * those two cancel and the corner term depends only on the corner and the square corner velocity.
 * That is what makes a 90° corner come out at precisely the configured SCV.
 *
 * The second term is Klipper's "approximated centripetal velocity": the circle fitted into the
 * corner may not reach further than mid-move, which is what makes short moves corner slower.
 */
export function calculateJunctionVelocity(
	{ squareCornerVelocity, cornerAngle }: CornerSettings,
	acceleration: MillimetersPerSecondSquared | number,
	pathLength: Millimeter | number,
	cruiseVelocity: MillimetersPerSecond | number
) {
	const junctionCosTheta = -Math.cos((cornerAngle * Math.PI) / 180);
	// A full reversal has no velocity to carry: the toolhead has to come to a stop
	if (junctionCosTheta > COS_THETA_CLAMP) return 0;

	const cosTheta = Math.max(junctionCosTheta, -COS_THETA_CLAMP);
	const sinThetaD2 = Math.sqrt(0.5 * (1 - cosTheta));
	const cosThetaD2 = Math.sqrt(0.5 * (1 + cosTheta));
	const rJd = sinThetaD2 / (1 - sinThetaD2);
	const tanThetaD2 = sinThetaD2 / cosThetaD2;

	const cornerVelocitySquared = rJd * (Math.SQRT2 - 1) * squareCornerVelocity ** 2;
	const centripetalVelocitySquared = 0.5 * pathLength * tanThetaD2 * acceleration;

	return Math.sqrt(Math.min(cornerVelocitySquared, centripetalVelocitySquared, cruiseVelocity ** 2));
}

export type MoveProfile = {
	pathLength: Millimeter;
	/** Velocity the move starts and ends at, i.e. what the corners on either side allow */
	junctionVelocity: MillimetersPerSecond;
	peakVelocity: MillimetersPerSecond;
	acceleration: MillimetersPerSecondSquared;
	/** Distance spent on each of the two ramps */
	accelDistance: Millimeter;
	/** Distance spent at `peakVelocity`. Zero means the profile is triangular */
	cruiseDistance: Millimeter;
	moveTime: Seconds;
};

/**
 * Symmetric trapezoid: ramp up from the junction velocity, cruise, ramp back down to it.
 *
 * `cruiseDistance` comes out negative when the path is too short to reach `peakVelocity` at this
 * acceleration; callers are expected to have picked a reachable peak.
 */
export function buildMoveProfile(
	pathLength: Millimeter | number,
	peakVelocity: MillimetersPerSecond | number,
	junctionVelocity: MillimetersPerSecond | number,
	acceleration: MillimetersPerSecondSquared | number
): MoveProfile {
	const entry = Math.min(junctionVelocity, peakVelocity);
	const accelDistance = (peakVelocity ** 2 - entry ** 2) / (2 * acceleration);
	const cruiseDistance = pathLength - 2 * accelDistance;

	return {
		pathLength: pathLength as Millimeter,
		junctionVelocity: entry as MillimetersPerSecond,
		peakVelocity: peakVelocity as MillimetersPerSecond,
		acceleration: acceleration as MillimetersPerSecondSquared,
		accelDistance: accelDistance as Millimeter,
		cruiseDistance: cruiseDistance as Millimeter,
		moveTime: ((2 * (peakVelocity - entry)) / acceleration + cruiseDistance / peakVelocity) as Seconds
	};
}

/** Velocity a given distance into the move, for plotting the profile */
export function velocityAtDistance(profile: MoveProfile, distance: number) {
	const { junctionVelocity, peakVelocity, acceleration, accelDistance, pathLength } = profile;
	if (distance <= 0 || distance >= pathLength) return junctionVelocity;

	const ramped = Math.min(distance, pathLength - distance);
	if (ramped >= accelDistance) return peakVelocity;

	return Math.sqrt(junctionVelocity ** 2 + 2 * acceleration * ramped);
}
