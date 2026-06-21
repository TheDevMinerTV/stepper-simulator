import type { MotorModel } from '@/lib/formulas';
import type {
	Ampere,
	Grams,
	Kilogram,
	MillimetersPerSecondSquared,
	Millimeter,
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

export type DriveMode = 'gantry' | 'extruder';

export type HobbedGearPreset = 'bmg' | 'x1cc' | 'orbiter' | 'k1' | 'g2' | 'lgx' | 'tbg' | 'custom';

export const HOBBED_GEAR_PRESETS: Record<Exclude<HobbedGearPreset, 'custom'>, { label: string; diameter: Millimeter }> =
	{
		bmg: { label: 'BMG (8mm)', diameter: 8 as Millimeter },
		x1cc: { label: 'X1 / CC (10mm)', diameter: 10 as Millimeter },
		orbiter: { label: 'Orbiter (12mm)', diameter: 12 as Millimeter },
		k1: { label: 'K1 (14.5mm)', diameter: 14.5 as Millimeter },
		g2: { label: 'G2 (16mm)', diameter: 16 as Millimeter },
		lgx: { label: 'LGX (18mm)', diameter: 18 as Millimeter },
		tbg: { label: 'TBG (20mm)', diameter: 20 as Millimeter }
	};

export type GearRatioPreset =
	| 'ungeared'
	| 'titan'
	| 'bmg'
	| 'x1p1'
	| 'cc'
	| 'k1'
	| 'lgx'
	| 'orbiter'
	| 'g2'
	| 'lgxLite'
	| 'tbg'
	| 'custom';

export const GEAR_RATIO_PRESETS: Record<Exclude<GearRatioPreset, 'custom'>, { label: string; ratio: number }> = {
	ungeared: { label: 'Ungeared (1:1)', ratio: 1 },
	titan: { label: 'Titan (3:1)', ratio: 3 },
	bmg: { label: 'BMG (5:1)', ratio: 5 },
	x1p1: { label: 'X1 / P1 (4.417:1)', ratio: 4.417 },
	cc: { label: 'CC (5.2:1)', ratio: 5.2 },
	k1: { label: 'K1 (6.25:1)', ratio: 6.25 },
	lgx: { label: 'LGX (6.84:1)', ratio: 6.84 },
	orbiter: { label: 'Orbiter (7.5:1)', ratio: 7.5 },
	g2: { label: 'G2 (9:1)', ratio: 9 },
	lgxLite: { label: 'LGX Lite (9.576:1)', ratio: 9.576 },
	tbg: { label: 'TBG (11.531:1)', ratio: 11.531 }
};

// The drivetrain a given hobbed gear is normally paired with. Where a hobbed
// gear is shared between two common drivetrains with different ratios (e.g.
// LGX/LGX Lite both use an 18mm gear), this picks the more common option.
export const HOBBED_GEAR_TO_GEAR_RATIO_PRESET: Record<
	Exclude<HobbedGearPreset, 'custom'>,
	Exclude<GearRatioPreset, 'custom'>
> = {
	bmg: 'bmg',
	x1cc: 'x1p1',
	orbiter: 'orbiter',
	k1: 'k1',
	g2: 'g2',
	lgx: 'lgxLite',
	tbg: 'tbg'
};

export type ExtruderSettings = {
	hobbedGearPreset: HobbedGearPreset;
	hobbedGearNominalDiameter: Millimeter;
	gearRatioPreset: GearRatioPreset;
	gearA: number;
	gearB: number;
	manualRequiredForce: Kilogram | null;
	speedDeratingEnabled: boolean;
	speedDeratingFactor: Percent;
};

export type ShareableConfiguration = {
	driveSettings: DriveSettings;
	driveMode: DriveMode;
	gantrySettings: GantrySettings;
	extruderSettings: ExtruderSettings;
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

export const DEFAULT_DRIVE_MODE: DriveMode = 'gantry';

export const DEFAULT_EXTRUDER_SETTINGS: ExtruderSettings = {
	hobbedGearPreset: 'bmg',
	hobbedGearNominalDiameter: HOBBED_GEAR_PRESETS.bmg.diameter,
	gearRatioPreset: 'bmg',
	gearA: GEAR_RATIO_PRESETS.bmg.ratio,
	gearB: 1,
	manualRequiredForce: null,
	speedDeratingEnabled: true,
	speedDeratingFactor: 90 as Percent
};
