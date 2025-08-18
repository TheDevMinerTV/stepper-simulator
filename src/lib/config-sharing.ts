import type { ShareableConfiguration } from '@/state/atoms';

export function parseConfigFromUrl(): ShareableConfiguration | null {
	try {
		const urlParams = new URLSearchParams(window.location.search);
		const configParam = urlParams.get('config');
		
		if (!configParam) {
			return null;
		}

		const decodedConfig = decodeURIComponent(configParam);
		const configString = atob(decodedConfig);
		const config = JSON.parse(configString) as ShareableConfiguration;
		
		// Validate the configuration structure
		if (!isValidConfiguration(config)) {
			console.warn('Invalid configuration found in URL');
			return null;
		}
		
		return config;
	} catch (error) {
		console.error('Failed to parse configuration from URL:', error);
		return null;
	}
}

function isValidConfiguration(config: any): config is ShareableConfiguration {
	return (
		config &&
		typeof config === 'object' &&
		config.driveSettings &&
		typeof config.driveSettings.inputVoltage === 'number' &&
		typeof config.driveSettings.maxDriveCurrent === 'number' &&
		typeof config.driveSettings.maxDrivePercent === 'number' &&
		config.gantrySettings &&
		typeof config.gantrySettings.pulleyTeeth === 'number' &&
		typeof config.gantrySettings.gearA === 'number' &&
		typeof config.gantrySettings.gearB === 'number' &&
		typeof config.gantrySettings.acceleration === 'number' &&
		typeof config.gantrySettings.toolheadAndYAxisMass === 'number' &&
		Array.isArray(config.customSteppers) &&
		typeof config.debug === 'boolean' &&
		Array.isArray(config.selectedSteppers)
	);
}

export function clearUrlConfig() {
	const url = new URL(window.location.href);
	url.searchParams.delete('config');
	window.history.replaceState({}, '', url.toString());
} 