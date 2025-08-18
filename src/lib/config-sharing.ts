import { type ShareableConfiguration } from '@/state/atoms';
import { z } from 'zod';
import {
	Ampere,
	Grams,
	MillimetersPerSecondSquared,
	Percent,
	StepperDefinition,
	Volts
} from './stepper';

const ShareableConfigurationSchema = z.object({
	driveSettings: z.object({
		inputVoltage: Volts,
		maxDriveCurrent: Ampere,
		maxDrivePercent: Percent
	}),
	gantrySettings: z.object({
		pulleyTeeth: z.number(),
		gearA: z.number(),
		gearB: z.number(),
		acceleration: MillimetersPerSecondSquared,
		toolheadAndYAxisMass: Grams
	}),
	customSteppers: z.array(StepperDefinition),
	debug: z.boolean(),
	selectedSteppers: z.array(StepperDefinition)
});

export function parseConfigFromUrl(): ShareableConfiguration | null {
	try {
		const urlParams = new URLSearchParams(window.location.search);
		const configParam = urlParams.get('config');

		if (!configParam) {
			return null;
		}

		const decodedConfig = decodeURIComponent(configParam);
		const configString = atob(decodedConfig);
		const config = JSON.parse(configString);

		// Validate the configuration structure
		const validationResult = ShareableConfigurationSchema.safeParse(config);
		if (!validationResult.success) {
			console.warn('Invalid configuration found in URL', validationResult.error);
			return null;
		}

		return validationResult.data as ShareableConfiguration;
	} catch (error) {
		console.error('Failed to parse configuration from URL:', error);
		return null;
	}
}

export function clearUrlConfig() {
	const url = new URL(window.location.href);
	url.searchParams.delete('config');
	window.history.replaceState({}, '', url.toString());
} 