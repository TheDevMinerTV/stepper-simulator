import type { MotorModel } from '@/lib/formulas';
import type {
	Ampere,
	Grams,
	MillimetersPerSecondSquared,
	NewtonCentimeter,
	Percent,
	StepperDefinition,
	Volts
} from '@/lib/stepper';

/**
 * The configuration shape and its defaults, kept free of anything browser-only.
 *
 * `@/state/atoms` touches `localStorage` at module scope, so everything that has to run in Node
 * as well (share-link decoding, the OpenGraph renderer) imports from here instead.
 */

export type DriveSettings = {
	inputVoltage: Volts;
	maxDriveCurrent: Ampere;
	maxDrivePercent: Percent;
	motorModel: MotorModel;
};

export type GantrySettings = {
	pulleyTeeth: number;
	toothPitch: number;
	gearA: number;
	gearB: number;
	acceleration: MillimetersPerSecondSquared;
	toolheadAndYAxisMass: Grams;
	manualRequiredTorque: NewtonCentimeter | null;
};

export type ShareableConfiguration = {
	driveSettings: DriveSettings;
	gantrySettings: GantrySettings;
	customSteppers: StepperDefinition[];
	debug: boolean;
	selectedSteppers: StepperDefinition[];
};

export const DEFAULT_DEBUG = false;

export const DEFAULT_DRIVE_SETTINGS: DriveSettings = {
	inputVoltage: 24 as Volts,
	maxDriveCurrent: 1 as Ampere,
	maxDrivePercent: 100 as Percent,
	motorModel: 'classic'
};

export const DEFAULT_GANTRY_SETTINGS: GantrySettings = {
	pulleyTeeth: 20,
	toothPitch: 2,
	gearA: 1,
	gearB: 1,
	acceleration: 20000 as MillimetersPerSecondSquared,
	toolheadAndYAxisMass: 500 as Grams,
	manualRequiredTorque: null
};
