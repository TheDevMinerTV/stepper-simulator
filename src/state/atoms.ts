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

export const debugAtom = atomWithLocalStorage<boolean>('debug', false);

export const driveSettingsAtom = atomWithLocalStorage<DriveSettings>('driveSettings', {
	inputVoltage: 24 as Volts,
	maxDriveCurrent: 1 as Ampere,
	maxDrivePercent: 100 as Percent
});
export const maxPowerAtom = atom<Watts>((get) => {
	const driveSettings = get(driveSettingsAtom);
	return (driveSettings.inputVoltage * driveSettings.maxDriveCurrent) as Watts;
});

export const gantrySettingsAtom = atomWithLocalStorage<GantrySettings>('gantrySettings', {
	pulleyTeeth: 20,
	gearA: 1,
	gearB: 1,
	acceleration: 20000 as MillimetersPerSecondSquared,
	toolheadAndYAxisMass: 500 as Grams
});

export const steppersAtom = atom<StepperDefinition[]>([]);

function atomWithLocalStorage<T>(key: string, initialValue: T) {
	const getInitialValue = () => {
		const item = localStorage.getItem(key);
		if (item !== null) {
			return JSON.parse(item);
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
