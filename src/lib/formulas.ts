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
		(driveSettings.maxDrivePercent / 100) * stepper.ratedCurrent,
		maxCurrentAtSpecifiedPower
	);

export const calculateTorqueRotor = (gantrySettings: GantrySettings, stepper: StepperDefinition) =>
	(gantrySettings.acceleration / (gantrySettings.pulleyTeeth * gantrySettings.toothPitch)) *
	2 *
	PI *
	(stepper.rotorInertia / (1000 * 100 ** 2)) *
	100;

export const calculatePowerAtDriveCurrent = (driveCurrent: number, stepper: StepperDefinition) =>
	driveCurrent ** 2 * stepper.resistance * 2;

export const calculateRequiredTorque = (gantrySettings: GantrySettings) =>
	((((gantrySettings.acceleration / 1000) * gantrySettings.toolheadAndYAxisMass) / 1000) *
		((gantrySettings.pulleyTeeth * gantrySettings.toothPitch) / calculateGearRatio(gantrySettings))) /
	(2 * Math.PI * 10);

export type MotorModel = 'classic' | 'fieldWeakening';

export function calculateSingleCoilTorque(
	model: MotorModel,
	stepAngle: number,
	ratedCurrent: number,
	torque: number,
	inductance: number,
	resistance: number,
	inputVoltage: number,
	driveCurrent: number,
	rotationsPerSecond: number
) {
	return model === 'classic'
		? calculateSingleCoilTorqueClassic(
				stepAngle,
				ratedCurrent,
				torque,
				inductance,
				resistance,
				inputVoltage,
				driveCurrent,
				rotationsPerSecond
			)
		: calculateSingleCoilTorqueFieldWeakening(
				stepAngle,
				ratedCurrent,
				torque,
				inductance,
				resistance,
				inputVoltage,
				driveCurrent,
				rotationsPerSecond
			);
}

// Naive model: treats back-EMF as a simple voltage subtracted from the bus and
// impedance as a linear sum. Approximates a fixed-zero-lead-angle chopper driver
// (e.g. DRV8825). Produces a hard torque cliff at V_bus = V_bemf_peak.
export function calculateSingleCoilTorqueClassic(
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

// Models a 2-phase hybrid stepper as a non-salient PMSM with current-circle
// (|i| ≤ I_drive) and voltage-circle (|v| ≤ V_bus) constraints in the dq frame.
// Assumes a modern driver that commutates with a tunable lead angle (TMC2209/5160
// StealthChop/PWM_AUTO etc.), so the d-axis can carry field-weakening current
// above base speed.
export function calculateSingleCoilTorqueFieldWeakening(
	stepAngle: number,
	ratedCurrent: number,
	torque: number,
	inductance: number,
	resistance: number,
	inputVoltage: number,
	driveCurrent: number,
	rotationsPerSecond: number
) {
	const polePairs = 360 / (4 * stepAngle);
	const Kt = torque / (100 * SQRT2) / ratedCurrent;
	const psi = Kt / polePairs;
	const L = inductance / 1000;
	const R = resistance;
	const omegaElec = 2 * PI * polePairs * rotationsPerSecond;
	const vMax = inputVoltage;
	const iMax = driveCurrent;

	const vSqAtIMax = (omegaElec * L * iMax) ** 2 + (R * iMax + omegaElec * psi) ** 2;
	if (vSqAtIMax <= vMax * vMax) {
		return Kt * iMax * 100;
	}

	const c = psi / L;
	const rV = vMax / (omegaElec * L);

	if (c * c + rV * rV <= iMax * iMax) {
		return Kt * rV * 100;
	}

	const iD = (rV * rV - iMax * iMax - c * c) / (2 * c);
	if (iD >= 0) return Kt * iMax * 100;
	const iQSq = iMax * iMax - iD * iD;
	if (iQSq <= 0) return 0;
	return Kt * Math.sqrt(iQSq) * 100;
}

