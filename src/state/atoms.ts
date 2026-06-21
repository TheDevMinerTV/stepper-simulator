import type { MotorModel } from '@/lib/formulas';
import type {
	Ampere,
	Grams,
	Kilogram,
	Millimeter,
	MillimetersPerSecondSquared,
	NewtonCentimeter,
	Percent,
	StepperDefinition,
	Volts,
	Watts
} from '@/lib/stepper';
import { atom } from 'jotai';

type SetStateAction<T> = T | ((prev: T) => T);

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

export type HobbedGearPreset = 'bmg' | 'x1cc' | 'orbiter' | 'k1' | 'g2' | 'lgx' | 'tbg' | 'boombox' | 'custom';

export const HOBBED_GEAR_PRESETS: Record<Exclude<HobbedGearPreset, 'custom'>, { label: string; diameter: Millimeter }> = {
	bmg: { label: 'BMG (8mm)', diameter: 8 as Millimeter },
	x1cc: { label: 'X1 / CC (10mm)', diameter: 10 as Millimeter },
	orbiter: { label: 'Orbiter (12mm)', diameter: 12 as Millimeter },
	k1: { label: 'K1 (14.5mm)', diameter: 14.5 as Millimeter },
	g2: { label: 'G2 (16mm)', diameter: 16 as Millimeter },
	lgx: { label: 'LGX (18mm)', diameter: 18 as Millimeter },
	tbg: { label: 'TBG (20mm)', diameter: 20 as Millimeter },
	boombox: { label: 'Boombox (8mm, dual motor)', diameter: 8 as Millimeter }
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
	tbg: 'tbg',
	boombox: 'ungeared'
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

export const isImportedConfigAtom = atom<boolean>(false);
export const showImportWarningAtom = atom<boolean>(false);

function atomWithLocalStorage<T>(key: string, initialValue: T) {
	const getInitialValue = () => {
		const item = localStorage.getItem(key);
		if (item !== null) {
			const parsed = JSON.parse(item) as T;
			if (typeof initialValue === 'object' && initialValue !== null && !Array.isArray(initialValue)) {
				return { ...initialValue, ...parsed };
			}
			return parsed;
		}
		return initialValue;
	};
	const baseAtom = atom(getInitialValue());
	const derivedAtom = atom(
		(get) => get(baseAtom),
		(get, set, update) => {
			const nextValue = typeof update === 'function' ? update(get(baseAtom)) : update;
			set(baseAtom, nextValue);
			localStorage.setItem(key, JSON.stringify(nextValue));
		}
	);
	return derivedAtom;
}

export type SearchMode = 'exact' | 'fuzzy';
export const searchModeAtom = atomWithLocalStorage<SearchMode>('searchMode', 'fuzzy');

export type ViewMode = 'table' | 'cards';
export const viewModeAtom = atomWithLocalStorage<ViewMode>('viewMode', 'cards');

export const debugAtom = atomWithLocalStorage<boolean>('debug', false);
export const driveSettingsAtom = atomWithLocalStorage<DriveSettings>('driveSettings', {
	inputVoltage: 24 as Volts,
	maxDriveCurrent: 1 as Ampere,
	maxDrivePercent: 100 as Percent,
	motorModel: 'classic'
});
export const gantrySettingsAtom = atomWithLocalStorage<GantrySettings>('gantrySettings', {
	pulleyTeeth: 20,
	toothPitch: 2,
	gearA: 1,
	gearB: 1,
	acceleration: 20000 as MillimetersPerSecondSquared,
	toolheadAndYAxisMass: 500 as Grams,
	manualRequiredTorque: null
});
export const driveModeAtom = atomWithLocalStorage<DriveMode>('driveMode', 'gantry');
export const extruderSettingsAtom = atomWithLocalStorage<ExtruderSettings>('extruderSettings', {
	hobbedGearPreset: 'bmg',
	hobbedGearNominalDiameter: HOBBED_GEAR_PRESETS.bmg.diameter,
	gearRatioPreset: 'bmg',
	gearA: GEAR_RATIO_PRESETS.bmg.ratio,
	gearB: 1,
	manualRequiredForce: 5 as Kilogram,
	speedDeratingEnabled: true,
	speedDeratingFactor: 90 as Percent
});
const rawCustomSteppersAtom = atomWithLocalStorage<StepperDefinition[]>('customSteppers', []);
export const customSteppersAtom = atom(
	(get) => {
		const steppers = get(rawCustomSteppersAtom);

		return steppers.map(
			(stepper) => ({ ...stepper, comments: stepper.comments ?? [] }) satisfies StepperDefinition
		);
	},
	(_get, set, value) => set(rawCustomSteppersAtom, value)
);

const tempDriveSettingsAtom = atom<DriveSettings | null>(null);
const tempDriveModeAtom = atom<DriveMode | null>(null);
const tempGantrySettingsAtom = atom<GantrySettings | null>(null);
const tempExtruderSettingsAtom = atom<ExtruderSettings | null>(null);
const tempCustomSteppersAtom = atom<StepperDefinition[] | null>(null);
const tempDebugAtom = atom<boolean | null>(null);

export const currentDriveSettingsAtom = atom(
	(get) => {
		const isImported = get(isImportedConfigAtom);
		const temp = get(tempDriveSettingsAtom);
		return isImported && temp ? temp : get(driveSettingsAtom);
	},
	(get, set, update: SetStateAction<DriveSettings>) => {
		const isImported = get(isImportedConfigAtom);
		const temp = get(tempDriveSettingsAtom);
		const prev = isImported && temp ? temp : get(driveSettingsAtom);
		const nextValue =
			typeof update === 'function' ? (update as (prev: DriveSettings) => DriveSettings)(prev) : update;

		if (isImported) {
			set(tempDriveSettingsAtom, nextValue);
		} else {
			set(driveSettingsAtom, nextValue);
		}
	}
);

export const currentGantrySettingsAtom = atom(
	(get) => {
		const isImported = get(isImportedConfigAtom);
		const temp = get(tempGantrySettingsAtom);
		return isImported && temp ? temp : get(gantrySettingsAtom);
	},
	(get, set, update: SetStateAction<GantrySettings>) => {
		const isImported = get(isImportedConfigAtom);
		const temp = get(tempGantrySettingsAtom);
		const prev = isImported && temp ? temp : get(gantrySettingsAtom);
		const nextValue =
			typeof update === 'function' ? (update as (prev: GantrySettings) => GantrySettings)(prev) : update;

		if (isImported) {
			set(tempGantrySettingsAtom, nextValue);
		} else {
			set(gantrySettingsAtom, nextValue);
		}
	}
);

export const currentDriveModeAtom = atom(
	(get) => {
		const isImported = get(isImportedConfigAtom);
		const temp = get(tempDriveModeAtom);
		return isImported && temp ? temp : get(driveModeAtom);
	},
	(get, set, update: SetStateAction<DriveMode>) => {
		const isImported = get(isImportedConfigAtom);
		const temp = get(tempDriveModeAtom);
		const prev = isImported && temp ? temp : get(driveModeAtom);
		const nextValue = typeof update === 'function' ? (update as (prev: DriveMode) => DriveMode)(prev) : update;

		if (isImported) {
			set(tempDriveModeAtom, nextValue);
		} else {
			set(driveModeAtom, nextValue);
		}
	}
);

export const currentExtruderSettingsAtom = atom(
	(get) => {
		const isImported = get(isImportedConfigAtom);
		const temp = get(tempExtruderSettingsAtom);
		return isImported && temp ? temp : get(extruderSettingsAtom);
	},
	(get, set, update: SetStateAction<ExtruderSettings>) => {
		const isImported = get(isImportedConfigAtom);
		const temp = get(tempExtruderSettingsAtom);
		const prev = isImported && temp ? temp : get(extruderSettingsAtom);
		const nextValue =
			typeof update === 'function' ? (update as (prev: ExtruderSettings) => ExtruderSettings)(prev) : update;

		if (isImported) {
			set(tempExtruderSettingsAtom, nextValue);
		} else {
			set(extruderSettingsAtom, nextValue);
		}
	}
);

export const currentCustomSteppersAtom = atom(
	(get) => {
		const isImported = get(isImportedConfigAtom);
		const temp = get(tempCustomSteppersAtom);
		return isImported && temp ? temp : get(customSteppersAtom);
	},
	(get, set, update: SetStateAction<StepperDefinition[]>) => {
		const isImported = get(isImportedConfigAtom);
		const temp = get(tempCustomSteppersAtom);
		const prev = isImported && temp ? temp : get(customSteppersAtom);
		const nextValue =
			typeof update === 'function'
				? (update as (prev: StepperDefinition[]) => StepperDefinition[])(prev)
				: update;

		if (isImported) {
			set(tempCustomSteppersAtom, nextValue);
		} else {
			set(customSteppersAtom, nextValue);
		}
	}
);

export const currentDebugAtom = atom(
	(get) => {
		const isImported = get(isImportedConfigAtom);
		const temp = get(tempDebugAtom);
		return isImported && temp !== null ? temp : get(debugAtom);
	},
	(get, set, update: SetStateAction<boolean>) => {
		const isImported = get(isImportedConfigAtom);
		const temp = get(tempDebugAtom);
		const prev = isImported && temp !== null ? temp : get(debugAtom);
		const nextValue = typeof update === 'function' ? (update as (prev: boolean) => boolean)(prev) : update;

		if (isImported) {
			set(tempDebugAtom, nextValue);
		} else {
			set(debugAtom, nextValue);
		}
	}
);

export const maxPowerAtom = atom<Watts>((get) => {
	const driveSettings = get(currentDriveSettingsAtom);
	return (driveSettings.inputVoltage * driveSettings.maxDriveCurrent) as Watts;
});

export const steppersAtom = atom<StepperDefinition[]>([]);

export const getCurrentConfigurationAtom = atom<ShareableConfiguration>((get) => ({
	driveSettings: get(currentDriveSettingsAtom),
	driveMode: get(currentDriveModeAtom),
	gantrySettings: get(currentGantrySettingsAtom),
	extruderSettings: get(currentExtruderSettingsAtom),
	customSteppers: get(currentCustomSteppersAtom),
	debug: get(currentDebugAtom),
	selectedSteppers: get(steppersAtom)
}));

export const loadImportedConfigurationAtom = atom(null, (_get, set, config: ShareableConfiguration) => {
	set(tempDriveSettingsAtom, config.driveSettings);
	set(tempDriveModeAtom, config.driveMode);
	set(tempGantrySettingsAtom, config.gantrySettings);
	set(tempExtruderSettingsAtom, config.extruderSettings);
	set(tempCustomSteppersAtom, config.customSteppers);
	set(tempDebugAtom, config.debug);
	set(steppersAtom, config.selectedSteppers);

	set(isImportedConfigAtom, true);
	set(showImportWarningAtom, true);
});

export const saveImportedConfigurationAtom = atom(null, (get, set) => {
	const driveSettings = get(tempDriveSettingsAtom);
	const driveMode = get(tempDriveModeAtom);
	const gantrySettings = get(tempGantrySettingsAtom);
	const extruderSettings = get(tempExtruderSettingsAtom);
	const customSteppers = get(tempCustomSteppersAtom);
	const debug = get(tempDebugAtom);

	if (driveSettings) set(driveSettingsAtom, driveSettings);
	if (driveMode) set(driveModeAtom, driveMode);
	if (gantrySettings) set(gantrySettingsAtom, gantrySettings);
	if (extruderSettings) set(extruderSettingsAtom, extruderSettings);
	if (customSteppers) set(customSteppersAtom, customSteppers);
	if (debug !== null) set(debugAtom, debug);

	set(tempDriveSettingsAtom, null);
	set(tempDriveModeAtom, null);
	set(tempGantrySettingsAtom, null);
	set(tempExtruderSettingsAtom, null);
	set(tempCustomSteppersAtom, null);
	set(tempDebugAtom, null);

	set(isImportedConfigAtom, false);
	set(showImportWarningAtom, false);
});
