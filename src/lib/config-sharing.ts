import { type ShareableConfiguration } from '@/state/atoms';
import { z } from 'zod';
import {
	Ampere,
	Grams,
	Kilogram,
	Millimeter,
	MillimetersPerSecondSquared,
	NewtonCentimeter,
	Percent,
	StepperDefinition,
	Volts
} from './stepper';

const ShareableConfigurationSchema = z.object({
	driveSettings: z.object({
		inputVoltage: Volts,
		maxDriveCurrent: Ampere,
		maxDrivePercent: Percent,
		motorModel: z.enum(['classic', 'spreadCycle', 'fieldWeakening']).default('classic')
	}),
	driveMode: z.enum(['gantry', 'extruder']).default('gantry'),
	gantrySettings: z.object({
		pulleyTeeth: z.number(),
		toothPitch: z.number().default(2),
		gearA: z.number(),
		gearB: z.number(),
		acceleration: MillimetersPerSecondSquared,
		toolheadAndYAxisMass: Grams.nullish().transform((v) => v ?? (500 as Grams)),
		manualRequiredTorque: NewtonCentimeter.nullable().default(null)
	}),
	extruderSettings: z
		.object({
			hobbedGearPreset: z
				.enum(['bmg', 'x1cc', 'orbiter', 'k1', 'g2', 'lgx', 'tbg', 'boombox', 'custom'])
				.default('bmg'),
			hobbedGearNominalDiameter: Millimeter,
			gearRatioPreset: z
				.enum(['ungeared', 'titan', 'bmg', 'x1p1', 'cc', 'k1', 'lgx', 'orbiter', 'g2', 'lgxLite', 'tbg', 'custom'])
				.default('bmg'),
			gearA: z.number(),
			gearB: z.number(),
			manualRequiredForce: Kilogram.nullable().default(null),
			speedDeratingEnabled: z.boolean().default(true),
			speedDeratingFactor: Percent.default(90 as Percent)
		})
		.default({
			hobbedGearPreset: 'bmg',
			hobbedGearNominalDiameter: 8 as Millimeter,
			gearRatioPreset: 'bmg',
			gearA: 5,
			gearB: 1,
			manualRequiredForce: 5 as Kilogram,
			speedDeratingEnabled: true,
			speedDeratingFactor: 90 as Percent
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
