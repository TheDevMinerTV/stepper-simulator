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
	100 *
	calculateGearRatio(gantrySettings);

export const calculatePowerAtDriveCurrent = (driveCurrent: number, stepper: StepperDefinition) =>
	driveCurrent ** 2 * stepper.resistance * 2;

export const calculateRequiredTorque = (gantrySettings: GantrySettings) =>
	((((gantrySettings.acceleration / 1000) * gantrySettings.toolheadAndYAxisMass) / 1000) *
		((gantrySettings.pulleyTeeth * gantrySettings.toothPitch) / calculateGearRatio(gantrySettings))) /
	(2 * Math.PI * 10);

export type MotorModel = 'classic' | 'spreadCycle' | 'fieldWeakening';

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
	const impl =
		model === 'classic'
			? calculateSingleCoilTorqueClassic
			: model === 'spreadCycle'
				? calculateSingleCoilTorqueSpreadCycle
				: calculateSingleCoilTorqueFieldWeakening;
	return impl(
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

// Current-regulated chopper model. Phasor-accurate voltage constraint, but the
// driver has no mechanism to command d-axis current (no phase advance / no
// field weakening). Matches SpreadCycle behavior on TMC2xxx-class chips:
// torque is full until the voltage circle can no longer contain
// (i_d=0, i_q=I_drive); past that point torque falls off smoothly as the
// achievable i_q collapses, hitting zero near V_bus = V_bemf_peak.
export function calculateSingleCoilTorqueSpreadCycle(
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

	// Voltage-limited on i_d = 0 line. Solve |V|² = V_max² for max i_q:
	//   (ω²L² + R²)·i_q² + 2·R·ω·ψ·i_q + (ω²·ψ² − V_max²) = 0
	const a = omegaElec * omegaElec * L * L + R * R;
	const halfB = R * omegaElec * psi;
	const cTerm = omegaElec * omegaElec * psi * psi - vMax * vMax;
	const disc = halfB * halfB - a * cTerm;
	if (disc < 0) return 0;
	const iQ = (-halfB + Math.sqrt(disc)) / a;
	if (iQ <= 0) return 0;
	return Kt * Math.min(iQ, iMax) * 100;
}

// Upper-bound torque curve for a 2-phase hybrid stepper on a TMC4671
// FOC servo. FOC2 mode bypasses Clarke/iClarke, driving each coil from a
// dedicated full H-bridge. Peak U_x = V_bus with no SVPWM sqrt(3) boost,
// since SVPWM applies only to 3-phase drives.
// Treated as a non-salient PMSM with a current circle (|i_dq| <= I_drive) and
// a voltage circle (|u_dq| <= V_bus) matching the iPark default circular
// limiter.
// Above base speed, assumes optimal i_d (MTPV), the analytic max-torque
// solution of the two constraints. The TMC4671 itself does not schedule i_d.
// It regulates to a PID_FLUX_TARGET parameter, so this curve is the
// ceiling a well-tuned external MTPV scheduler could reach. Fixed
// flux-target tunings fall below it off the design speed.
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

