import { decodeConfig } from '@/lib/config-sharing';
import type { DriveSettings, ExtruderSettings, GantrySettings } from '@/lib/configuration';
import { autoMaxFlowRate, buildExtruderCurve } from '@/lib/extruder-curve';
import {
	calculateEffectiveHobbedGearDiameter,
	calculateGearRatio,
	calculateMaxPower,
	calculateRequiredTorque
} from '@/lib/formulas';
import type { StepperDefinition, Watts } from '@/lib/stepper';
import {
	autoMaxVelocity,
	buildTorqueCurve,
	DEFAULT_MAX_VELOCITY,
	seriesCrossing,
	stepperSeriesColor,
	stepperSeriesKey
} from '@/lib/torque-curve';

/**
 * Everything the OpenGraph image and the OpenGraph meta tags need, derived from a `?config=`
 * parameter. One model for both so the picture and the text of an unfurl cannot disagree.
 *
 * Both drive modes land in the same shape — a falling curve per motor against a threshold line —
 * so the renderer draws one picture and only the axes and units differ.
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
	/** Position on the x axis at which this motor drops below the required value */
	crossing: number | null;
	/** Already short of the required value at the origin, so it never has a crossing to report */
	belowRequired: boolean;
};

/** The parts of the model that differ between drive modes */
type OgShape = {
	mode: 'gantry' | 'extruder';
	/** Key in `points` holding the x value */
	xKey: string;
	xUnit: string;
	yUnit: string;
	/** The dashed threshold: required torque (Ncm), or required grip force (kgf) */
	required: number | null;
	requiredLabel: string;
	maxX: number;
	points: Record<string, number>[];
	subtitle: string;
};

export type OgModel = OgShape & {
	/** `generic` is the fallback card: no config, or one we could not decode */
	variant: 'config' | 'generic';
	title: string;
	description: string;
	alt: string;
	series: OgSeries[];
	/** Selected steppers that did not fit in the image */
	omittedSteppers: number;
};

const GENERIC_MODEL: OgModel = {
	variant: 'generic',
	mode: 'gantry',
	title: 'Stepper Simulator',
	subtitle: 'Quickly compare stepper motors',
	description: 'Quickly compare stepper motors',
	alt: 'Stepper Simulator',
	points: [],
	series: [],
	xKey: 'velocity',
	xUnit: 'mm/s',
	yUnit: 'Ncm',
	required: null,
	requiredLabel: 'Required torque',
	maxX: DEFAULT_MAX_VELOCITY,
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

	const noun = model.mode === 'extruder' ? 'required grip force' : 'required torque';
	const parts = [model.subtitle];
	if (fastest) {
		parts.push(`${fastest.label} holds ${noun} to ${formatNumber(fastest.crossing, 0)} ${model.xUnit}`);
	} else if (model.series.length > 0 && model.required !== null) {
		parts.push(`${model.requiredLabel}: ${formatNumber(model.required, 1)} ${model.yUnit}`);
	}

	return `${parts.join('. ')}.`;
}

type ShapeInput = {
	steppers: StepperDefinition[];
	driveSettings: DriveSettings;
	maxPower: Watts;
};

/** `null` for a configuration whose numbers would divide by zero all the way through the curve */
function buildGantryShape(
	{ steppers, driveSettings, maxPower }: ShapeInput,
	gantrySettings: GantrySettings
): OgShape | null {
	const pulleyCircumferenceMm = gantrySettings.pulleyTeeth * gantrySettings.toothPitch;
	if (!(pulleyCircumferenceMm > 0) || gantrySettings.gearB === 0) return null;

	const rawRequiredTorque = calculateRequiredTorque(gantrySettings);
	const required = Number.isFinite(rawRequiredTorque) ? rawRequiredTorque : null;

	// Nobody gets to pan or zoom an unfurled image, so the range has to be right the first time
	const curveInput = { steppers, driveSettings, gantrySettings, maxPower };
	const maxX = autoMaxVelocity({ ...curveInput, requiredTorque: required ?? 0 });

	return {
		mode: 'gantry',
		xKey: 'velocity',
		xUnit: 'mm/s',
		yUnit: 'Ncm',
		required,
		requiredLabel: 'Required torque',
		maxX,
		points: buildTorqueCurve({ ...curveInput, maxVelocity: maxX }),
		subtitle: [
			`${formatNumber(driveSettings.inputVoltage)} V`,
			`${formatNumber(driveSettings.maxDriveCurrent, 2)} A`,
			`${formatNumber(gantrySettings.pulleyTeeth, 0)}T pulley`,
			`${formatNumber(gantrySettings.acceleration, 0)} mm/s²`,
			`${formatNumber(gantrySettings.toolheadAndYAxisMass, 0)} g`
		].join(' · ')
	};
}

/** `null` for a configuration whose numbers would divide by zero all the way through the curve */
function buildExtruderShape(
	{ steppers, driveSettings, maxPower }: ShapeInput,
	extruderSettings: ExtruderSettings
): OgShape | null {
	// The hobbed gear's effective radius and the gear ratio are both divisors of the force curve
	if (!(calculateEffectiveHobbedGearDiameter(extruderSettings) > 0) || extruderSettings.gearB === 0) return null;

	const gearRatio = calculateGearRatio(extruderSettings);
	if (!Number.isFinite(gearRatio) || gearRatio <= 0) return null;

	const required =
		extruderSettings.manualRequiredForce !== null && Number.isFinite(extruderSettings.manualRequiredForce)
			? extruderSettings.manualRequiredForce
			: null;

	// Nobody gets to pan or zoom an unfurled image, so the range has to be right the first time
	const curveInput = { steppers, driveSettings, extruderSettings, maxPower };
	const maxX = autoMaxFlowRate({ ...curveInput, requiredForce: required ?? 0 });

	return {
		mode: 'extruder',
		xKey: 'flowRate',
		xUnit: 'mm³/s',
		yUnit: 'kgf',
		required,
		requiredLabel: 'Required grip force',
		maxX,
		points: buildExtruderCurve({ ...curveInput, maxFlowRate: maxX }),
		subtitle: [
			`${formatNumber(driveSettings.inputVoltage)} V`,
			`${formatNumber(driveSettings.maxDriveCurrent, 2)} A`,
			`${formatNumber(extruderSettings.hobbedGearNominalDiameter, 1)} mm hob`,
			`${formatNumber(gearRatio, 2)}:1`,
			extruderSettings.speedDeratingEnabled
				? `${formatNumber(extruderSettings.speedDeratingFactor, 0)}% derating`
				: 'no derating'
		].join(' · ')
	};
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

	const { driveSettings, driveMode, gantrySettings, extruderSettings } = imported.config;

	const selected = imported.config.selectedSteppers;
	const steppers = selected.slice(0, MAX_SERIES);
	const shapeInput = { steppers, driveSettings, maxPower: calculateMaxPower(driveSettings) };

	const shape =
		driveMode === 'extruder'
			? buildExtruderShape(shapeInput, extruderSettings)
			: buildGantryShape(shapeInput, gantrySettings);
	if (!shape) return GENERIC_MODEL;

	const points = shape.points.map((point) => {
		const sanitized: Record<string, number> = {};
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
			crossing: shape.required === null ? null : seriesCrossing(points, shape.xKey, key, shape.required),
			belowRequired: shape.required !== null && points.length > 0 && points[0][key] < shape.required
		};
	});

	const base = {
		...shape,
		variant: 'config' as const,
		title: buildTitle(series.map((entry) => entry.label)),
		points,
		series,
		omittedSteppers: selected.length - steppers.length
	};

	const quantity = shape.mode === 'extruder' ? 'Grip force over flow rate' : 'Torque over velocity';

	return {
		...base,
		description: buildDescription(base),
		alt:
			series.length === 0
				? `${quantity} with no motors selected`
				: `${quantity} for ${series.map((entry) => entry.label).join(', ')}`
	};
}
