import { CurrentUnit } from '@/lib/current-unit';
import type { MotorModel as MotorModelName } from '@/lib/formulas';
import {
	Ampere,
	Grams,
	MillimetersPerSecondSquared,
	NewtonCentimeter,
	Percent,
	type StepperDefinition,
	Volts
} from '@/lib/stepper';
import z from 'zod/v4';

/**
 * The configuration shape and its defaults, kept free of anything browser-only.
 *
 * `@/state/atoms` touches `localStorage` at module scope, so everything that has to run in Node
 * as well (share-link decoding, the OpenGraph renderer) imports from here instead.
 */

export const MotorModel = z.enum(['classic', 'spreadCycle', 'fieldWeakening']) satisfies z.ZodType<MotorModelName>;

export type DriveSettings = {
	inputVoltage: Volts;
	/** stored in peak current */
	maxDriveCurrent: Ampere;
	/** just how it's displayed */
	currentUnit: CurrentUnit;
	maxDrivePercent: Percent;
	motorModel: MotorModelName;
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
	currentUnit: 'peak',
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

export const DriveSettingsSchema = z.object({
	inputVoltage: Volts.catch(DEFAULT_DRIVE_SETTINGS.inputVoltage),
	maxDriveCurrent: Ampere.catch(DEFAULT_DRIVE_SETTINGS.maxDriveCurrent),
	currentUnit: CurrentUnit.catch(DEFAULT_DRIVE_SETTINGS.currentUnit),
	maxDrivePercent: Percent.catch(DEFAULT_DRIVE_SETTINGS.maxDrivePercent),
	motorModel: MotorModel.catch(DEFAULT_DRIVE_SETTINGS.motorModel)
}) satisfies z.ZodType<DriveSettings>;

export const GantrySettingsSchema = z.object({
	pulleyTeeth: z.number().catch(DEFAULT_GANTRY_SETTINGS.pulleyTeeth),
	toothPitch: z.number().catch(DEFAULT_GANTRY_SETTINGS.toothPitch),
	gearA: z.number().catch(DEFAULT_GANTRY_SETTINGS.gearA),
	gearB: z.number().catch(DEFAULT_GANTRY_SETTINGS.gearB),
	acceleration: MillimetersPerSecondSquared.catch(DEFAULT_GANTRY_SETTINGS.acceleration),
	toolheadAndYAxisMass: Grams.catch(DEFAULT_GANTRY_SETTINGS.toolheadAndYAxisMass),
	manualRequiredTorque: NewtonCentimeter.nullable().catch(DEFAULT_GANTRY_SETTINGS.manualRequiredTorque)
}) satisfies z.ZodType<GantrySettings>;
