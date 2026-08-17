import {
	calculateDriveCurrent,
	calculateMaxCurrentAtSpecifiedPower,
	calculateSingleCoilTorque,
	calculateTorqueRotor
} from '@/lib/formulas';
import type { StepperDefinition, Watts } from '@/lib/stepper';
import type { DriveSettings, GantrySettings } from '@/lib/configuration';

/** Velocity resolution of the sampled curve, in mm/s */
export const TORQUE_CURVE_STEP_SIZE = 20;
export const DEFAULT_MAX_VELOCITY = 2000;

/** One colour per series, cycled. Shared so the OG image matches the in-app graph. */
export const STEPPER_SERIES_COLORS = [
	'#2563eb', // blue
	'#dc2626', // red
	'#16a34a', // green
	'#ca8a04', // yellow
	'#9333ea', // purple
	'#c2410c', // orange
	'#0891b2', // cyan
	'#be123c', // rose
	'#059669', // emerald
	'#7c3aed' // violet
];

export function stepperSeriesKey(stepper: Pick<StepperDefinition, 'brand' | 'model'>): string {
	return `${stepper.brand} ${stepper.model}`;
}

export function stepperSeriesColor(index: number): string {
	return STEPPER_SERIES_COLORS[index % STEPPER_SERIES_COLORS.length];
}

/** A sampled velocity, plus one torque value per series key */
export type TorqueCurvePoint = { velocity: number } & Record<string, number>;

export type TorqueCurveInput = {
	steppers: StepperDefinition[];
	driveSettings: DriveSettings;
	gantrySettings: GantrySettings;
	maxPower: Watts;
	maxVelocity: number;
	stepSize?: number;
};

/**
 * Samples the torque each stepper can still deliver across the velocity range, after the torque
 * the rotor spends accelerating itself is subtracted.
 *
 * Lives outside the component because the OpenGraph renderer draws the same curves server-side
 * and must not reimplement them.
 */
export function buildTorqueCurve({
	steppers,
	driveSettings,
	gantrySettings,
	maxPower,
	maxVelocity,
	stepSize = TORQUE_CURVE_STEP_SIZE
}: TorqueCurveInput): TorqueCurvePoint[] {
	const pulleyCircumferenceMm = gantrySettings.pulleyTeeth * gantrySettings.toothPitch;
	// The endpoint is sampled even when it is not a whole number of steps in, so the curve covers
	// the range it was asked for rather than stopping at the last step short of it
	const velocityPoints = Array.from({ length: Math.ceil(maxVelocity / stepSize) }, (_, i) => i * stepSize);
	velocityPoints.push(maxVelocity);

	return velocityPoints.map((velocity) => {
		const dataPoint: TorqueCurvePoint = { velocity };

		for (const stepper of steppers) {
			const maxCurrentAtSpecifiedPower = calculateMaxCurrentAtSpecifiedPower(maxPower, stepper);
			const driveCurrent = calculateDriveCurrent(driveSettings, stepper, maxCurrentAtSpecifiedPower);
			const torqueRotor = calculateTorqueRotor(gantrySettings, stepper);

			const rps = velocity / pulleyCircumferenceMm;
			const rawTorque = calculateSingleCoilTorque(
				driveSettings.motorModel,
				stepper.stepAngle,
				stepper.ratedCurrent,
				stepper.torque,
				stepper.inductance,
				stepper.resistance,
				driveSettings.inputVoltage,
				driveCurrent,
				rps
			);

			dataPoint[stepperSeriesKey(stepper)] = Math.max(rawTorque - torqueRotor, 0);
		}

		return dataPoint;
	});
}

/**
 * Tick spacings that read well on an axis; the range is always five of one of them. Kept dense
 * enough that rounding up to the next one cannot inflate the range by much.
 */
const NICE_TICK_STEPS = [
	10, 20, 25, 50, 75, 100, 150, 200, 250, 300, 400, 500, 750, 1000, 1500, 2000, 2500, 3000, 4000, 5000
];
/** Nothing sensible needs a wider range, and it bounds the work `autoMaxVelocity` does */
const AUTO_MAX_VELOCITY_CAP = NICE_TICK_STEPS[NICE_TICK_STEPS.length - 1] * 5;
/** Fraction of the range left past the point where the last motor stops being useful */
const AUTO_VELOCITY_HEADROOM = 1.15;
/** A series below this fraction of its own standstill torque has nothing left to show */
const AUTO_VELOCITY_FLOOR_FRACTION = 0.05;

function roundToNiceRange(velocity: number): number {
	const step = NICE_TICK_STEPS.find((candidate) => candidate * 5 >= velocity);
	return step === undefined ? AUTO_MAX_VELOCITY_CAP : step * 5;
}

/**
 * Picks a velocity range that fits every selected stepper: wide enough that each curve is shown
 * falling off, but not so wide that they all collapse into the left edge.
 *
 * Each series gets its own cutoff. A motor that starts *below* the required torque never crosses
 * it, and thresholding the whole chart on the required torque would leave that motor as a flat
 * line running off the right edge, which is exactly the shape that says "nothing was fitted here".
 * Such a series is instead followed down to a fraction of its own standstill torque.
 *
 * Sampled coarsely on purpose. This only decides the axis, and the fine curve is built afterwards.
 */
export function autoMaxVelocity({
	requiredTorque,
	...input
}: Omit<TorqueCurveInput, 'maxVelocity' | 'stepSize'> & { requiredTorque: number }): number {
	if (input.steppers.length === 0) return DEFAULT_MAX_VELOCITY;

	const stepSize = AUTO_MAX_VELOCITY_CAP / 500;
	const points = buildTorqueCurve({ ...input, maxVelocity: AUTO_MAX_VELOCITY_CAP, stepSize });
	const keys = input.steppers.map(stepperSeriesKey);
	const required = Number.isFinite(requiredTorque) ? Math.max(requiredTorque, 0) : 0;

	const thresholds = new Map(
		keys.map((key) => {
			const floor = points[0][key] * AUTO_VELOCITY_FLOOR_FRACTION;
			return [key, points[0][key] > required ? Math.max(required, floor) : floor];
		})
	);

	// One step past the last sample where a series is still above its own threshold, so the point
	// where it gives up stays on screen
	let lastRelevant = 0;
	for (const point of points) {
		for (const key of keys) {
			if (point[key] > thresholds.get(key)!) lastRelevant = Math.max(lastRelevant, point.velocity + stepSize);
		}
	}

	if (lastRelevant === 0) return roundToNiceRange(DEFAULT_MAX_VELOCITY);

	return roundToNiceRange(Math.min(lastRelevant * AUTO_VELOCITY_HEADROOM, AUTO_MAX_VELOCITY_CAP));
}

/**
 * Position on `xKey` at which a series drops below `required`, linearly interpolated between
 * samples. `null` when the series never crosses inside the sampled range: either it is already
 * below the line at the origin, or it stays above it all the way to the end.
 *
 * Shared with the extruder curve, which has the same falling shape against a different axis.
 */
export function seriesCrossing(
	points: Record<string, number>[],
	xKey: string,
	seriesKey: string,
	required: number
): number | null {
	if (points.length === 0 || points[0][seriesKey] < required) return null;

	for (let i = 1; i < points.length; i++) {
		const previous = points[i - 1];
		const current = points[i];
		if (current[seriesKey] >= required) continue;

		const span = previous[seriesKey] - current[seriesKey];
		const ratio = span === 0 ? 0 : (previous[seriesKey] - required) / span;

		return previous[xKey] + ratio * (current[xKey] - previous[xKey]);
	}

	return null;
}

/**
 * Velocity (mm/s) at which a series drops below the required torque, linearly interpolated between
 * samples. `null` when the series never crosses inside the sampled range: either it is already
 * below the line at standstill, or it stays above it all the way to `maxVelocity`.
 */
export function crossingVelocity(points: TorqueCurvePoint[], seriesKey: string, requiredTorque: number): number | null {
	return seriesCrossing(points, 'velocity', seriesKey, requiredTorque);
}
