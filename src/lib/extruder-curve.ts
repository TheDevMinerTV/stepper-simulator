import type { DriveSettings, ExtruderSettings } from '@/lib/configuration';
import {
	calculateDeratedMotorRotationsPerSecond,
	calculateDriveCurrent,
	calculateForceFromMotorTorque,
	calculateMaxCurrentAtSpecifiedPower,
	calculateMotorRotationsPerSecondForFlowRate,
	calculateSingleCoilTorque
} from '@/lib/formulas';
import type { StepperDefinition, Watts } from '@/lib/stepper';
import { seriesCrossing, stepperSeriesKey } from '@/lib/torque-curve';

/** Flow-rate resolution of the sampled curve, in mm³/s */
export const EXTRUDER_CURVE_STEP_SIZE = 2;
export const DEFAULT_MAX_FLOW_RATE = 100;

/** A sampled flow rate, plus one grip-force value per series key */
export type ExtruderCurvePoint = { flowRate: number } & Record<string, number>;

export type ExtruderCurveInput = {
	steppers: StepperDefinition[];
	driveSettings: DriveSettings;
	extruderSettings: ExtruderSettings;
	maxPower: Watts;
	maxFlowRate: number;
	stepSize?: number;
};

/**
 * Samples the grip force each stepper can still put on the filament across the flow-rate range.
 *
 * Faster flow means a faster motor, and a faster motor makes less torque, so this falls off the
 * same way the gantry torque curve does — just against volumetric flow instead of velocity.
 *
 * Lives outside the component because the OpenGraph renderer draws the same curves server-side
 * and must not reimplement them.
 */
export function buildExtruderCurve({
	steppers,
	driveSettings,
	extruderSettings,
	maxPower,
	maxFlowRate,
	stepSize = EXTRUDER_CURVE_STEP_SIZE
}: ExtruderCurveInput): ExtruderCurvePoint[] {
	// The endpoint is sampled even when it is not a whole number of steps in, so the curve covers
	// the range it was asked for rather than stopping at the last step short of it
	const flowPoints = Array.from({ length: Math.ceil(maxFlowRate / stepSize) }, (_, i) => i * stepSize);
	flowPoints.push(maxFlowRate);

	return flowPoints.map((flowRate) => {
		const dataPoint: ExtruderCurvePoint = { flowRate };

		const rawRps = calculateMotorRotationsPerSecondForFlowRate(extruderSettings, flowRate);
		const rps = calculateDeratedMotorRotationsPerSecond(extruderSettings, rawRps);

		for (const stepper of steppers) {
			const maxCurrentAtSpecifiedPower = calculateMaxCurrentAtSpecifiedPower(maxPower, stepper);
			const driveCurrent = calculateDriveCurrent(driveSettings, stepper, maxCurrentAtSpecifiedPower);

			const motorTorque = calculateSingleCoilTorque(
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

			dataPoint[stepperSeriesKey(stepper)] = Math.max(calculateForceFromMotorTorque(extruderSettings, motorTorque), 0);
		}

		return dataPoint;
	});
}

/**
 * Tick spacings that read well on a flow axis; the range is always five of one of them. Runs
 * finer than the velocity equivalent because a geared extruder gives out an order of magnitude
 * sooner than a gantry does.
 */
const NICE_FLOW_STEPS = [0.5, 1, 2, 2.5, 5, 7.5, 10, 15, 20, 25, 30, 40, 50];
/** Nothing sensible needs a wider range, and it bounds the work `autoMaxFlowRate` does */
const AUTO_MAX_FLOW_CAP = NICE_FLOW_STEPS[NICE_FLOW_STEPS.length - 1] * 5;
/**
 * Fraction of the range left past the point where the last motor stops being useful.
 *
 * Wider than the velocity axis allows itself. Where every motor clears the required force, the
 * range is decided by the crossings alone, and a curve is still high and steeply falling as it
 * reaches one — so a tight margin ends the plot mid-air. The extra room lets each curve bend over
 * on screen, which is what makes it readable as "this is where it gives up".
 */
const AUTO_FLOW_HEADROOM = 1.4;
/** A series below this fraction of its own standstill force has nothing left to show */
const AUTO_FLOW_FLOOR_FRACTION = 0.05;

function roundToNiceRange(flowRate: number): number {
	const step = NICE_FLOW_STEPS.find((candidate) => candidate * 5 >= flowRate);
	return step === undefined ? AUTO_MAX_FLOW_CAP : step * 5;
}

/**
 * Picks a flow-rate range that fits every selected stepper: wide enough that each curve is shown
 * falling off, but not so wide that they all collapse into the left edge.
 *
 * Mirrors `autoMaxVelocity`, including its handling of a motor that starts *below* the required
 * force: that one is followed down to a fraction of its own standstill force instead, so it does
 * not drag the range out to the cap as a flat line.
 */
export function autoMaxFlowRate({
	requiredForce,
	...input
}: Omit<ExtruderCurveInput, 'maxFlowRate' | 'stepSize'> & { requiredForce: number }): number {
	if (input.steppers.length === 0) return DEFAULT_MAX_FLOW_RATE;

	const stepSize = AUTO_MAX_FLOW_CAP / 500;
	const points = buildExtruderCurve({ ...input, maxFlowRate: AUTO_MAX_FLOW_CAP, stepSize });
	const keys = input.steppers.map(stepperSeriesKey);
	const required = Number.isFinite(requiredForce) ? Math.max(requiredForce, 0) : 0;

	const thresholds = new Map(
		keys.map((key) => {
			const floor = points[0][key] * AUTO_FLOW_FLOOR_FRACTION;
			return [key, points[0][key] > required ? Math.max(required, floor) : floor];
		})
	);

	// One step past the last sample where a series is still above its own threshold, so the point
	// where it gives up stays on screen
	let lastRelevant = 0;
	for (const point of points) {
		for (const key of keys) {
			if (point[key] > thresholds.get(key)!) lastRelevant = Math.max(lastRelevant, point.flowRate + stepSize);
		}
	}

	if (lastRelevant === 0) return roundToNiceRange(DEFAULT_MAX_FLOW_RATE);

	return roundToNiceRange(Math.min(lastRelevant * AUTO_FLOW_HEADROOM, AUTO_MAX_FLOW_CAP));
}

/**
 * Flow rate (mm³/s) at which a series drops below the required grip force, linearly interpolated
 * between samples. `null` when the series never crosses inside the sampled range.
 */
export function crossingFlowRate(
	points: ExtruderCurvePoint[],
	seriesKey: string,
	requiredForce: number
): number | null {
	return seriesCrossing(points, 'flowRate', seriesKey, requiredForce);
}
