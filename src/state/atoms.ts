import type { MotorModel } from '@/lib/formulas';
import type {
	Ampere,
	Degree,
	Grams,
	Millimeter,
	MillimetersPerSecond,
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
	/** Travel of the axis, used to suggest a path length for the move recommender */
	bedSize: Millimeter;
	/** Move the recommender optimizes for. `null` follows the bed size at half of it */
	movePathLength: Millimeter | null;
	/** Share of the computed acceleration ceiling the recommender holds back as headroom */
	safetyMarginPercent: Percent;
	/** How far the path turns at the corners the recommended move runs between */
	cornerAngle: Degree;
};

/** Values copied straight out of a Klipper `printer.cfg`, named after the config keys they mirror */
export type KlipperSettings = {
	/** `square_corner_velocity`: how fast a 90° corner is taken */
	squareCornerVelocity: MillimetersPerSecond;
	/** `minimum_cruise_ratio`: share of a move that has to be spent at the peak velocity, 0..1 */
	minimumCruiseRatio: number;
};

export type ShareableConfiguration = {
	driveSettings: DriveSettings;
	gantrySettings: GantrySettings;
	klipperSettings: KlipperSettings;
	customSteppers: StepperDefinition[];
	debug: boolean;
	selectedSteppers: StepperDefinition[];
};

export const isImportedConfigAtom = atom<boolean>(false);
export const showImportWarningAtom = atom<boolean>(false);
/** Ids (`brand|model`) referenced by an imported link that could not be resolved */
export const unresolvedImportedSteppersAtom = atom<string[]>([]);

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
	manualRequiredTorque: null,
	bedSize: 300 as Millimeter,
	movePathLength: null,
	safetyMarginPercent: 25 as Percent,
	cornerAngle: 90 as Degree
};
export const DEFAULT_KLIPPER_SETTINGS: KlipperSettings = {
	squareCornerVelocity: 5 as MillimetersPerSecond,
	minimumCruiseRatio: 0.5
};

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

// Persisted layer: private on purpose. Components must use the `current*` atoms so
// imported (shared-link) configs are respected
const debugAtom = atomWithLocalStorage<boolean>('debug', DEFAULT_DEBUG);
const driveSettingsAtom = atomWithLocalStorage<DriveSettings>('driveSettings', DEFAULT_DRIVE_SETTINGS);
const gantrySettingsAtom = atomWithLocalStorage<GantrySettings>('gantrySettings', DEFAULT_GANTRY_SETTINGS);
const klipperSettingsAtom = atomWithLocalStorage<KlipperSettings>('klipperSettings', DEFAULT_KLIPPER_SETTINGS);
const rawCustomSteppersAtom = atomWithLocalStorage<StepperDefinition[]>('customSteppers', []);
const customSteppersAtom = atom(
	(get) => {
		const steppers = get(rawCustomSteppersAtom);

		return steppers.map(
			(stepper) => ({ ...stepper, comments: stepper.comments ?? [] }) satisfies StepperDefinition
		);
	},
	(_get, set, value) => set(rawCustomSteppersAtom, value)
);

const tempDriveSettingsAtom = atom<DriveSettings | null>(null);
const tempGantrySettingsAtom = atom<GantrySettings | null>(null);
const tempKlipperSettingsAtom = atom<KlipperSettings | null>(null);
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

export const currentKlipperSettingsAtom = atom(
	(get) => {
		const isImported = get(isImportedConfigAtom);
		const temp = get(tempKlipperSettingsAtom);
		return isImported && temp ? temp : get(klipperSettingsAtom);
	},
	(get, set, update: SetStateAction<KlipperSettings>) => {
		const isImported = get(isImportedConfigAtom);
		const temp = get(tempKlipperSettingsAtom);
		const prev = isImported && temp ? temp : get(klipperSettingsAtom);
		const nextValue =
			typeof update === 'function' ? (update as (prev: KlipperSettings) => KlipperSettings)(prev) : update;

		if (isImported) {
			set(tempKlipperSettingsAtom, nextValue);
		} else {
			set(klipperSettingsAtom, nextValue);
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
	gantrySettings: get(currentGantrySettingsAtom),
	klipperSettings: get(currentKlipperSettingsAtom),
	customSteppers: get(currentCustomSteppersAtom),
	debug: get(currentDebugAtom),
	selectedSteppers: get(steppersAtom)
}));

export const loadImportedConfigurationAtom = atom(null, (_get, set, config: ShareableConfiguration) => {
	set(tempDriveSettingsAtom, config.driveSettings);
	set(tempGantrySettingsAtom, config.gantrySettings);
	set(tempKlipperSettingsAtom, config.klipperSettings);
	set(tempCustomSteppersAtom, config.customSteppers);
	set(tempDebugAtom, config.debug);
	set(steppersAtom, config.selectedSteppers);

	set(isImportedConfigAtom, true);
	set(showImportWarningAtom, true);
});

export const saveImportedConfigurationAtom = atom(null, (get, set) => {
	const driveSettings = get(tempDriveSettingsAtom);
	const gantrySettings = get(tempGantrySettingsAtom);
	const klipperSettings = get(tempKlipperSettingsAtom);
	const customSteppers = get(tempCustomSteppersAtom);
	const debug = get(tempDebugAtom);

	if (driveSettings) set(driveSettingsAtom, driveSettings);
	if (gantrySettings) set(gantrySettingsAtom, gantrySettings);
	if (klipperSettings) set(klipperSettingsAtom, klipperSettings);
	if (customSteppers) set(customSteppersAtom, customSteppers);
	if (debug !== null) set(debugAtom, debug);

	set(tempDriveSettingsAtom, null);
	set(tempGantrySettingsAtom, null);
	set(tempKlipperSettingsAtom, null);
	set(tempCustomSteppersAtom, null);
	set(tempDebugAtom, null);

	set(isImportedConfigAtom, false);
	set(showImportWarningAtom, false);
});
