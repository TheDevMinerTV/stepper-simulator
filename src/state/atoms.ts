import type {
	Ampere,
	Grams,
	MillimetersPerSecondSquared,
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
};
export type GantrySettings = {
	pulleyTeeth: number;
	gearA: number;
	gearB: number;
	acceleration: MillimetersPerSecondSquared;
	toolheadAndYAxisMass: Grams;
};

export type ShareableConfiguration = {
	driveSettings: DriveSettings;
	gantrySettings: GantrySettings;
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
			return JSON.parse(item) as T;
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

export const debugAtom = atomWithLocalStorage<boolean>('debug', false);
export const driveSettingsAtom = atomWithLocalStorage<DriveSettings>('driveSettings', {
	inputVoltage: 24 as Volts,
	maxDriveCurrent: 1 as Ampere,
	maxDrivePercent: 100 as Percent
});
export const gantrySettingsAtom = atomWithLocalStorage<GantrySettings>('gantrySettings', {
	pulleyTeeth: 20,
	gearA: 1,
	gearB: 1,
	acceleration: 20000 as MillimetersPerSecondSquared,
	toolheadAndYAxisMass: 500 as Grams
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
const tempGantrySettingsAtom = atom<GantrySettings | null>(null);
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
	customSteppers: get(currentCustomSteppersAtom),
	debug: get(currentDebugAtom),
	selectedSteppers: get(steppersAtom)
}));

export const loadImportedConfigurationAtom = atom(null, (_get, set, config: ShareableConfiguration) => {
	set(tempDriveSettingsAtom, config.driveSettings);
	set(tempGantrySettingsAtom, config.gantrySettings);
	set(tempCustomSteppersAtom, config.customSteppers);
	set(tempDebugAtom, config.debug);
	set(steppersAtom, config.selectedSteppers);

	set(isImportedConfigAtom, true);
	set(showImportWarningAtom, true);
});

export const saveImportedConfigurationAtom = atom(null, (get, set) => {
	const driveSettings = get(tempDriveSettingsAtom);
	const gantrySettings = get(tempGantrySettingsAtom);
	const customSteppers = get(tempCustomSteppersAtom);
	const debug = get(tempDebugAtom);

	if (driveSettings) set(driveSettingsAtom, driveSettings);
	if (gantrySettings) set(gantrySettingsAtom, gantrySettings);
	if (customSteppers) set(customSteppersAtom, customSteppers);
	if (debug !== null) set(debugAtom, debug);

	set(tempDriveSettingsAtom, null);
	set(tempGantrySettingsAtom, null);
	set(tempCustomSteppersAtom, null);
	set(tempDebugAtom, null);

	set(isImportedConfigAtom, false);
	set(showImportWarningAtom, false);
});
