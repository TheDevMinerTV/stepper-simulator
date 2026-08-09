import { decodeConfig } from '@/lib/config-sharing';
import { calculateMaxPower, calculateRequiredTorque } from '@/lib/formulas';
import {
	autoMaxVelocity,
	buildTorqueCurve,
	crossingVelocity,
	DEFAULT_MAX_VELOCITY,
	stepperSeriesColor,
	stepperSeriesKey,
	type TorqueCurvePoint
} from '@/lib/torque-curve';

/**
 * Everything the OpenGraph image and the OpenGraph meta tags need, derived from a `?config=`
 * parameter. One model for both so the picture and the text of an unfurl cannot disagree.
 *
 * The parameter is attacker-controlled: every path here either produces a bounded model or the
 * generic card. Nothing throws.
 */

/** Longer than any link this app generates; a bigger one is not worth decoding */
const MAX_CONFIG_PARAM_LENGTH = 8192;
/** The colour palette cycles after this many, and the legend stops fitting */
const MAX_SERIES = 10;
const MAX_LABEL_LENGTH = 38;

export type OgSeries = {
	key: string;
	label: string;
	color: string;
	/** Velocity (mm/s) at which this motor drops below the required torque */
	crossing: number | null;
};

export type OgModel = {
	/** `generic` is the fallback card: no config, or one we could not decode */
	variant: 'config' | 'generic';
	title: string;
	subtitle: string;
	description: string;
	alt: string;
	points: TorqueCurvePoint[];
	series: OgSeries[];
	requiredTorque: number | null;
	maxVelocity: number;
	/** Selected steppers that did not fit in the image */
	omittedSteppers: number;
};

const GENERIC_MODEL: OgModel = {
	variant: 'generic',
	title: 'Stepper Simulator',
	subtitle: 'Quickly compare stepper motors',
	description: 'Quickly compare stepper motors',
	alt: 'Stepper Simulator',
	points: [],
	series: [],
	requiredTorque: null,
	maxVelocity: DEFAULT_MAX_VELOCITY,
	omittedSteppers: 0
};

export function formatNumber(value: number, maxDecimals = 1): string {
	if (!Number.isFinite(value)) return '?';

	return String(Number(value.toFixed(maxDecimals)));
}

function truncate(value: string, max = MAX_LABEL_LENGTH): string {
	return value.length <= max ? value : `${value.slice(0, max - 1)}…`;
}

function buildTitle(labels: string[]): string {
	if (labels.length === 0) return 'Stepper Simulator';
	if (labels.length <= 2) return labels.join(' vs ');

	return `${labels[0]} vs ${labels[1]} +${labels.length - 2} more`;
}

function buildDescription(model: Omit<OgModel, 'description' | 'alt'>): string {
	const fastest = model.series
		.filter((series): series is OgSeries & { crossing: number } => series.crossing !== null)
		.sort((a, b) => b.crossing - a.crossing)[0];

	const parts = [model.subtitle];
	if (fastest) {
		parts.push(`${fastest.label} holds required torque to ${formatNumber(fastest.crossing, 0)} mm/s`);
	} else if (model.series.length > 0 && model.requiredTorque !== null) {
		parts.push(`Required torque: ${formatNumber(model.requiredTorque, 1)} Ncm`);
	}

	return `${parts.join('. ')}.`;
}

/**
 * Decodes a share link into the OG model. Returns the generic card for anything that does not
 * decode into a configuration we can draw.
 */
export function buildOgModel(configParam: string | null | undefined): OgModel {
	if (!configParam || configParam.length > MAX_CONFIG_PARAM_LENGTH) return GENERIC_MODEL;

	let imported: ReturnType<typeof decodeConfig>;
	try {
		imported = decodeConfig(configParam);
	} catch {
		return GENERIC_MODEL;
	}
	if (!imported) return GENERIC_MODEL;

	const { driveSettings, gantrySettings } = imported.config;

	// A zero pulley circumference or gear ratio divides by zero all the way through the curve
	const pulleyCircumferenceMm = gantrySettings.pulleyTeeth * gantrySettings.toothPitch;
	if (!(pulleyCircumferenceMm > 0) || gantrySettings.gearB === 0) return GENERIC_MODEL;

	const selected = imported.config.selectedSteppers;
	const steppers = selected.slice(0, MAX_SERIES);

	const rawRequiredTorque = calculateRequiredTorque(gantrySettings);
	const requiredTorque = Number.isFinite(rawRequiredTorque) ? rawRequiredTorque : null;

	// Nobody gets to pan or zoom an unfurled image, so the range has to be right the first time
	const curveInput = {
		steppers,
		driveSettings,
		gantrySettings,
		maxPower: calculateMaxPower(driveSettings)
	};
	const maxVelocity = autoMaxVelocity({ ...curveInput, requiredTorque: requiredTorque ?? 0 });

	const points = buildTorqueCurve({ ...curveInput, maxVelocity }).map((point) => {
		const sanitized: TorqueCurvePoint = { velocity: point.velocity };
		for (const [key, value] of Object.entries(point)) {
			sanitized[key] = Number.isFinite(value) ? value : 0;
		}

		return sanitized;
	});

	const series: OgSeries[] = steppers.map((stepper, index) => {
		const key = stepperSeriesKey(stepper);

		return {
			key,
			label: truncate(key),
			color: stepperSeriesColor(index),
			crossing: requiredTorque === null ? null : crossingVelocity(points, key, requiredTorque)
		};
	});

	const subtitle = [
		`${formatNumber(driveSettings.inputVoltage)} V`,
		`${formatNumber(driveSettings.maxDriveCurrent, 2)} A`,
		`${formatNumber(gantrySettings.pulleyTeeth, 0)}T pulley`,
		`${formatNumber(gantrySettings.acceleration, 0)} mm/s²`,
		`${formatNumber(gantrySettings.toolheadAndYAxisMass, 0)} g`
	].join(' · ');

	const base = {
		variant: 'config' as const,
		title: buildTitle(series.map((entry) => entry.label)),
		subtitle,
		points,
		series,
		requiredTorque,
		maxVelocity,
		omittedSteppers: selected.length - steppers.length
	};

	return {
		...base,
		description: buildDescription(base),
		alt:
			series.length === 0
				? 'Torque graph with no motors selected'
				: `Torque over velocity for ${series.map((entry) => entry.label).join(', ')}`
	};
}
