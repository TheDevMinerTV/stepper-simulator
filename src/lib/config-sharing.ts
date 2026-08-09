import { ARCHIVED_STEPPER_DB, STEPPER_ALIASES, STEPPER_DB } from '@/lib/stepper-db';
import {
	DEFAULT_DEBUG,
	DEFAULT_DRIVE_SETTINGS,
	DEFAULT_GANTRY_SETTINGS,
	type DriveSettings,
	type GantrySettings,
	type ShareableConfiguration
} from '@/lib/configuration';
import { z } from 'zod/v4';
import {
	Ampere,
	Degree,
	GramSquareCentimeter,
	Grams,
	MilliHenry,
	Millimeter,
	MillimetersPerSecondSquared,
	NEMASize,
	NewtonCentimeter,
	Ohm,
	Percent,
	StepperDefinition,
	Volts
} from './stepper';

/**
 * Wire format of `?config=`. Bumped whenever the payload shape changes so old links can be
 * migrated instead of rejected. Version 0 is the legacy format: raw base64 of the full
 * `ShareableConfiguration` JSON, with no version marker.
 */
export const SHARE_FORMAT_VERSION = 1;

const MotorModel = z.enum(['classic', 'spreadCycle', 'fieldWeakening']);

const LegacyShareableConfigurationSchema = z.object({
	driveSettings: z.object({
		inputVoltage: Volts,
		maxDriveCurrent: Ampere,
		maxDrivePercent: Percent,
		motorModel: MotorModel.default('classic')
	}),
	gantrySettings: z.object({
		pulleyTeeth: z.number(),
		toothPitch: z.number().default(2),
		gearA: z.number(),
		gearB: z.number(),
		acceleration: MillimetersPerSecondSquared,
		toolheadAndYAxisMass: Grams.nullish().transform((v) => v ?? (500 as Grams)),
		manualRequiredTorque: NewtonCentimeter.nullable().default(null)
	}),
	customSteppers: z.array(StepperDefinition),
	debug: z.boolean(),
	selectedSteppers: z.array(StepperDefinition)
});

/** A `StepperDefinition` packed positionally: field names cost more than the values do */
const StepperTuple = z.tuple([
	z.string(), // brand
	z.string(), // model
	z.enum(NEMASize), // nemaSize
	Millimeter, // bodyLength
	Degree, // stepAngle
	Ampere, // ratedCurrent
	NewtonCentimeter, // torque
	MilliHenry, // inductance
	Ohm, // resistance
	GramSquareCentimeter, // rotorInertia
	z.array(z.string()) // comments
]);
type StepperTuple = z.infer<typeof StepperTuple>;

/** Either an id of a stepper that is already known (`brand|model`), or the full definition */
const StepperRef = z.union([z.string(), StepperTuple]);

/**
 * Short keys, and every field optional: anything equal to the default in `@/state/atoms` is
 * dropped on encode and restored on decode.
 */
const SharedConfigSchema = z.object({
	v: z.literal(SHARE_FORMAT_VERSION),
	d: z
		.object({
			v: Volts.optional(), // inputVoltage
			c: Ampere.optional(), // maxDriveCurrent
			p: Percent.optional(), // maxDrivePercent
			m: MotorModel.optional() // motorModel
		})
		.optional(),
	g: z
		.object({
			pt: z.number().optional(), // pulleyTeeth
			tp: z.number().optional(), // toothPitch
			ga: z.number().optional(), // gearA
			gb: z.number().optional(), // gearB
			a: MillimetersPerSecondSquared.optional(), // acceleration
			m: Grams.optional(), // toolheadAndYAxisMass
			t: NewtonCentimeter.optional() // manualRequiredTorque
		})
		.optional(),
	c: z.array(StepperTuple).optional(), // customSteppers
	b: z.boolean().optional(), // debug
	s: z.array(StepperRef).optional() // selectedSteppers
});
type SharedConfig = z.infer<typeof SharedConfigSchema>;

export type ImportedConfiguration = {
	config: ShareableConfiguration;
	/** Ids in the link that matched neither the stepper DB nor a custom stepper in the link */
	unresolvedSteppers: string[];
};

const STEPPER_ID_SEPARATOR = '|';

function stepperId(stepper: { brand: string; model: string }): string {
	return `${stepper.brand}${STEPPER_ID_SEPARATOR}${stepper.model}`;
}

/**
 * Every stepper a link may reference by id, keyed by `brand|model`. Archived steppers are in here
 * on purpose: they are hidden from the picker, but a link that was shared while they were still
 * listed has to keep resolving them.
 */
let stepperDbById: Map<string, StepperDefinition> | null = null;
function stepperDbIndex(): Map<string, StepperDefinition> {
	if (!stepperDbById) {
		stepperDbById = new Map();
		for (const db of [ARCHIVED_STEPPER_DB, STEPPER_DB]) {
			for (const steppers of db.values()) {
				for (const stepper of steppers.values()) {
					stepperDbById.set(stepperId(stepper), stepper);
				}
			}
		}
	}

	return stepperDbById;
}

/** Custom steppers shadow the DB, same as in the stepper picker; renames resolve through the alias map */
function resolveStepperRef(id: string, customById: Map<string, StepperDefinition>): StepperDefinition | undefined {
	const aliasedId = STEPPER_ALIASES.get(id);

	return (
		customById.get(id) ??
		stepperDbIndex().get(id) ??
		(aliasedId ? (customById.get(aliasedId) ?? stepperDbIndex().get(aliasedId)) : undefined)
	);
}

function packStepper(stepper: StepperDefinition): StepperTuple {
	return [
		stepper.brand,
		stepper.model,
		stepper.nemaSize,
		stepper.bodyLength,
		stepper.stepAngle,
		stepper.ratedCurrent,
		stepper.torque,
		stepper.inductance,
		stepper.resistance,
		stepper.rotorInertia,
		stepper.comments
	];
}

function unpackStepper(tuple: StepperTuple): StepperDefinition {
	const [
		brand,
		model,
		nemaSize,
		bodyLength,
		stepAngle,
		ratedCurrent,
		torque,
		inductance,
		resistance,
		rotorInertia,
		comments
	] = tuple;

	return {
		brand,
		model,
		nemaSize,
		bodyLength,
		stepAngle,
		ratedCurrent,
		torque,
		inductance,
		resistance,
		rotorInertia,
		comments
	};
}

function packDriveSettings(settings: DriveSettings): SharedConfig['d'] {
	const packed: NonNullable<SharedConfig['d']> = {};

	if (settings.inputVoltage !== DEFAULT_DRIVE_SETTINGS.inputVoltage) packed.v = settings.inputVoltage;
	if (settings.maxDriveCurrent !== DEFAULT_DRIVE_SETTINGS.maxDriveCurrent) packed.c = settings.maxDriveCurrent;
	if (settings.maxDrivePercent !== DEFAULT_DRIVE_SETTINGS.maxDrivePercent) packed.p = settings.maxDrivePercent;
	if (settings.motorModel !== DEFAULT_DRIVE_SETTINGS.motorModel) packed.m = settings.motorModel;

	return Object.keys(packed).length > 0 ? packed : undefined;
}

function unpackDriveSettings(packed: SharedConfig['d']): DriveSettings {
	return {
		inputVoltage: packed?.v ?? DEFAULT_DRIVE_SETTINGS.inputVoltage,
		maxDriveCurrent: packed?.c ?? DEFAULT_DRIVE_SETTINGS.maxDriveCurrent,
		maxDrivePercent: packed?.p ?? DEFAULT_DRIVE_SETTINGS.maxDrivePercent,
		motorModel: packed?.m ?? DEFAULT_DRIVE_SETTINGS.motorModel
	};
}

function packGantrySettings(settings: GantrySettings): SharedConfig['g'] {
	const packed: NonNullable<SharedConfig['g']> = {};

	if (settings.pulleyTeeth !== DEFAULT_GANTRY_SETTINGS.pulleyTeeth) packed.pt = settings.pulleyTeeth;
	if (settings.toothPitch !== DEFAULT_GANTRY_SETTINGS.toothPitch) packed.tp = settings.toothPitch;
	if (settings.gearA !== DEFAULT_GANTRY_SETTINGS.gearA) packed.ga = settings.gearA;
	if (settings.gearB !== DEFAULT_GANTRY_SETTINGS.gearB) packed.gb = settings.gearB;
	if (settings.acceleration !== DEFAULT_GANTRY_SETTINGS.acceleration) packed.a = settings.acceleration;
	if (settings.toolheadAndYAxisMass !== DEFAULT_GANTRY_SETTINGS.toolheadAndYAxisMass)
		packed.m = settings.toolheadAndYAxisMass;
	if (settings.manualRequiredTorque !== null) packed.t = settings.manualRequiredTorque;

	return Object.keys(packed).length > 0 ? packed : undefined;
}

function unpackGantrySettings(packed: SharedConfig['g']): GantrySettings {
	return {
		pulleyTeeth: packed?.pt ?? DEFAULT_GANTRY_SETTINGS.pulleyTeeth,
		toothPitch: packed?.tp ?? DEFAULT_GANTRY_SETTINGS.toothPitch,
		gearA: packed?.ga ?? DEFAULT_GANTRY_SETTINGS.gearA,
		gearB: packed?.gb ?? DEFAULT_GANTRY_SETTINGS.gearB,
		acceleration: packed?.a ?? DEFAULT_GANTRY_SETTINGS.acceleration,
		toolheadAndYAxisMass: packed?.m ?? DEFAULT_GANTRY_SETTINGS.toolheadAndYAxisMass,
		manualRequiredTorque: packed?.t ?? null
	};
}

function bytesToBase64Url(bytes: Uint8Array): string {
	let binary = '';
	for (const byte of bytes) {
		binary += String.fromCharCode(byte);
	}

	return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function base64UrlToBytes(value: string): Uint8Array {
	// `+` also survives as a space when a legacy link is read back out of a query string
	const base64 = value.replace(/-/g, '+').replace(/_/g, '/').replace(/ /g, '+');
	const padding = base64.length % 4 === 0 ? '' : '='.repeat(4 - (base64.length % 4));
	const binary = atob(base64 + padding);

	const bytes = new Uint8Array(binary.length);
	for (let i = 0; i < binary.length; i++) {
		bytes[i] = binary.charCodeAt(i);
	}

	return bytes;
}

/**
 * Serializes a configuration into the value of the `config` query parameter.
 *
 * Steppers that the receiving client can look up itself (stepper DB entries, and custom steppers
 * that travel along in the same link) are referenced by id instead of being written out in full.
 */
export function encodeConfig(config: ShareableConfiguration): string {
	const payload: SharedConfig = { v: SHARE_FORMAT_VERSION };

	const drive = packDriveSettings(config.driveSettings);
	if (drive) payload.d = drive;

	const gantry = packGantrySettings(config.gantrySettings);
	if (gantry) payload.g = gantry;

	if (config.debug !== DEFAULT_DEBUG) payload.b = config.debug;

	// Only custom steppers that a selection actually points at travel with the link. The rest of
	// the sender's library is dead weight to the recipient and not theirs to hand out
	const selectedIds = new Set(config.selectedSteppers.map((stepper) => stepperId(stepper)));
	const sharedCustomSteppers = config.customSteppers.filter((stepper) => selectedIds.has(stepperId(stepper)));
	if (sharedCustomSteppers.length > 0) payload.c = sharedCustomSteppers.map(packStepper);

	if (config.selectedSteppers.length > 0) {
		const referenceable = new Set([
			...stepperDbIndex().keys(),
			...sharedCustomSteppers.map((stepper) => stepperId(stepper))
		]);

		payload.s = config.selectedSteppers.map((stepper) => {
			const id = stepperId(stepper);
			// An id is only unambiguous if it round-trips through a `brand|model` split
			return !stepper.brand.includes(STEPPER_ID_SEPARATOR) && referenceable.has(id) ? id : packStepper(stepper);
		});
	}

	return bytesToBase64Url(new TextEncoder().encode(JSON.stringify(payload)));
}

function decodeSharedConfig(payload: SharedConfig): ImportedConfiguration {
	const customSteppers = (payload.c ?? []).map(unpackStepper);
	const customById = new Map(customSteppers.map((stepper) => [stepperId(stepper), stepper]));

	const unresolvedSteppers: string[] = [];
	const selectedSteppers = (payload.s ?? []).flatMap((ref) => {
		if (typeof ref !== 'string') return [unpackStepper(ref)];

		const stepper = resolveStepperRef(ref, customById);
		if (!stepper) {
			unresolvedSteppers.push(ref);
			return [];
		}

		return [stepper];
	});

	return {
		config: {
			driveSettings: unpackDriveSettings(payload.d),
			gantrySettings: unpackGantrySettings(payload.g),
			customSteppers,
			debug: payload.b ?? DEFAULT_DEBUG,
			selectedSteppers
		},
		unresolvedSteppers
	};
}

/**
 * Parses the value of the `config` query parameter. Accepts both the current format and the
 * legacy one (raw base64 of the full configuration JSON).
 */
export function decodeConfig(param: string): ImportedConfiguration | null {
	let payload: unknown;
	try {
		payload = JSON.parse(new TextDecoder().decode(base64UrlToBytes(param)));
	} catch (error) {
		console.error('Failed to decode configuration from URL:', error);
		return null;
	}

	const isVersioned = typeof payload === 'object' && payload !== null && 'v' in payload;

	if (isVersioned) {
		const result = SharedConfigSchema.safeParse(payload);
		if (!result.success) {
			console.warn('Invalid configuration found in URL', result.error);
			return null;
		}

		return decodeSharedConfig(result.data);
	}

	const legacy = LegacyShareableConfigurationSchema.safeParse(payload);
	if (!legacy.success) {
		console.warn('Invalid configuration found in URL', legacy.error);
		return null;
	}

	return { config: legacy.data as ShareableConfiguration, unresolvedSteppers: [] };
}

