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
	const velocityPoints = Array.from(
		{ length: Math.floor((maxVelocity + stepSize) / stepSize) },
		(_, i) => i * stepSize
	);

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
 * Velocity (mm/s) at which a series drops below the required torque, linearly interpolated between
 * samples. `null` when the series never crosses inside the sampled range: either it is already
 * below the line at standstill, or it stays above it all the way to `maxVelocity`.
 */
export function crossingVelocity(points: TorqueCurvePoint[], seriesKey: string, requiredTorque: number): number | null {
	if (points.length === 0 || points[0][seriesKey] < requiredTorque) return null;

	for (let i = 1; i < points.length; i++) {
		const previous = points[i - 1];
		const current = points[i];
		if (current[seriesKey] >= requiredTorque) continue;

		const span = previous[seriesKey] - current[seriesKey];
		const ratio = span === 0 ? 0 : (previous[seriesKey] - requiredTorque) / span;

		return previous.velocity + ratio * (current.velocity - previous.velocity);
	}

	return null;
}
