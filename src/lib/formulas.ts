import type { StepperDefinition, Watts } from '@/lib/stepper';
import type { DriveSettings, GantrySettings } from '@/state/atoms';

const PI = Math.PI;
const SQRT2 = Math.SQRT2;

export const calculateGearRatio = (gantrySettings: GantrySettings) => gantrySettings.gearA / gantrySettings.gearB;

export const calculateMaxCurrentAtSpecifiedPower = (maxPower: Watts, stepper: StepperDefinition) =>
	Math.sqrt(maxPower / 2 / stepper.resistance);

export const calculateDriveCurrent = (
	driveSettings: DriveSettings,
	stepper: StepperDefinition,
	maxCurrentAtSpecifiedPower: number
) =>
	Math.min(
		driveSettings.maxDriveCurrent,
		driveSettings.maxDrivePercent * stepper.ratedCurrent,
		maxCurrentAtSpecifiedPower
	);

export const calculateTorqueRotor = (gantrySettings: GantrySettings, stepper: StepperDefinition) =>
	(gantrySettings.acceleration / (gantrySettings.pulleyTeeth * 2)) *
	2 *
	PI *
	(stepper.rotorInertia / (1000 * 100 ** 2)) *
	100;

export const calculatePowerAtDriveCurrent = (driveCurrent: number, stepper: StepperDefinition) =>
	driveCurrent ** 2 * stepper.resistance * 2;

export const calculateRequiredTorque = (gantrySettings: GantrySettings) =>
	((((gantrySettings.acceleration / 1000) * gantrySettings.toolheadAndYAxisMass) / 1000) *
		((gantrySettings.pulleyTeeth * 2) / calculateGearRatio(gantrySettings))) /
	(2 * Math.PI * 10);

export function calculateSingleCoilTorque(
	stepAngle: number,
	ratedCurrent: number,
	torque: number,
	inductance: number,
	resistance: number,
	inputVoltage: number,
	driveCurrent: number,
	rotationsPerSecond: number
) {
	const fCoil = (rotationsPerSecond * (360 / stepAngle)) / 4;
	const xCoil = (2 * PI * fCoil * inductance) / 1000;
	const zCoil = xCoil + resistance;
	const vGen = 2 * PI * rotationsPerSecond * (torque / (100 * SQRT2) / ratedCurrent);
	const vAvail = inputVoltage > vGen ? inputVoltage - vGen : 0;
	const iAvail = vAvail / zCoil;
	const iActual = iAvail > driveCurrent ? driveCurrent : iAvail;
	const torquePercent = iActual / ratedCurrent;
	const t1Coil = (torquePercent * torque) / (100 * SQRT2);

	return t1Coil * 100;
}

export function calculateStepperPower(
	stepAngle: number,
	ratedCurrent: number,
	torque: number,
	inductance: number,
	resistance: number,
	inputVoltage: number,
	driveCurrent: number,
	rps: number
): number {
	const fCoil = (rps * (360 / stepAngle)) / 4;
	const xCoil = (2 * PI * fCoil * inductance) / 1000;
	const zCoil = xCoil + resistance;
	const vGen = 2 * PI * rps * (torque / (100 * SQRT2) / ratedCurrent);
	const vAvail = inputVoltage > vGen ? inputVoltage - vGen : 0;
	const iAvail = vAvail / zCoil;
	const iActual = iAvail > driveCurrent ? driveCurrent : iAvail;
	const vCoil = iActual * resistance;
	const power = (vCoil + vGen) * iActual;

	return power;
}
