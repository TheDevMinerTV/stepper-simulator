import type { Ampere } from '@/lib/stepper';

/**
 * Internally every current value is the per-phase peak amplitude, as the datasheets specify them.
 * Firmware (TMC `run_current` in Klipper, etc.) uses RMS so the UI can convert at the boundary.
 */
export type CurrentUnit = 'peak' | 'rms';

export const CURRENT_UNIT_LABEL: Record<CurrentUnit, string> = {
	peak: 'A peak',
	rms: 'A RMS'
};

export const peakToUnit = (peak: Ampere, unit: CurrentUnit): Ampere =>
	(unit === 'rms' ? peak / Math.SQRT2 : peak) as Ampere;

export const unitToPeak = (value: Ampere, unit: CurrentUnit): Ampere =>
	(unit === 'rms' ? value * Math.SQRT2 : value) as Ampere;

export const formatCurrent = (value: number, digits = 2) => Number(value.toFixed(digits));
