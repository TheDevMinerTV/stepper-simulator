import {
	DEFAULT_DEBUG,
	DEFAULT_DRIVE_MODE,
	DEFAULT_DRIVE_SETTINGS,
	DEFAULT_EXTRUDER_SETTINGS,
	DEFAULT_GANTRY_SETTINGS,
	GEAR_RATIO_PRESETS,
	HOBBED_GEAR_PRESETS,
	HOBBED_GEAR_TO_GEAR_RATIO_PRESET,
	type DriveMode,
	type DriveSettings,
	type ExtruderSettings,
	type GantrySettings,
	type GearRatioPreset,
	type HobbedGearPreset,
	type ShareableConfiguration
} from '@/lib/configuration';
import { calculateMaxPower } from '@/lib/formulas';
import type { StepperDefinition, Watts } from '@/lib/stepper';
import { atom } from 'jotai';

type SetStateAction<T> = T | ((prev: T) => T);

// The configuration shape itself lives in `@/lib/configuration` so the server can import it
// without pulling in this module's `localStorage` access. Re-exported for the app's convenience
export {
	DEFAULT_DEBUG,
	DEFAULT_DRIVE_MODE,
	DEFAULT_DRIVE_SETTINGS,
	DEFAULT_EXTRUDER_SETTINGS,
	DEFAULT_GANTRY_SETTINGS,
	GEAR_RATIO_PRESETS,
	HOBBED_GEAR_PRESETS,
	HOBBED_GEAR_TO_GEAR_RATIO_PRESET,
	type DriveMode,
	type DriveSettings,
	type ExtruderSettings,
	type GantrySettings,
	type GearRatioPreset,
	type HobbedGearPreset,
	type ShareableConfiguration
};

export const isImportedConfigAtom = atom<boolean>(false);
export const showImportWarningAtom = atom<boolean>(false);
/** Ids (`brand|model`) referenced by an imported link that could not be resolved */
export const unresolvedImportedSteppersAtom = atom<string[]>([]);

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
const driveModeAtom = atomWithLocalStorage<DriveMode>('driveMode', DEFAULT_DRIVE_MODE);
const extruderSettingsAtom = atomWithLocalStorage<ExtruderSettings>('extruderSettings', DEFAULT_EXTRUDER_SETTINGS);
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

export const maxPowerAtom = atom<Watts>((get) => calculateMaxPower(get(currentDriveSettingsAtom)));

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
