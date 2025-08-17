import z from 'zod/v4';

export const NEMASize = {
	NEMA14: 14,
	NEMA17: 17,
	NEMA23: 23,
	NEMA34: 34
} as const;
export type NEMASize = (typeof NEMASize)[keyof typeof NEMASize];

export const Degree = z.number().brand('°');
export type Degree = z.infer<typeof Degree>;
export const Millimeter = z.number().brand('mm');
export type Millimeter = z.infer<typeof Millimeter>;
export const Ampere = z.number().brand('A');
export type Ampere = z.infer<typeof Ampere>;
export const NewtonCentimeter = z.number().brand('Ncm');
export type NewtonCentimeter = z.infer<typeof NewtonCentimeter>;
export const MilliHenry = z.number().brand('mH');
export type MilliHenry = z.infer<typeof MilliHenry>;
export const Ohm = z.number().brand('Ω');
export type Ohm = z.infer<typeof Ohm>;
export const GramSquareCentimeter = z.number().brand('gcm²');
export type GramSquareCentimeter = z.infer<typeof GramSquareCentimeter>;
export const Volts = z.number().brand('V');
export type Volts = z.infer<typeof Volts>;
export const Percent = z.number().brand('%');
export type Percent = z.infer<typeof Percent>;
export const Watts = z.number().brand('W');
export type Watts = z.infer<typeof Watts>;
export const MillimetersPerSecondSquared = z.number().brand('mm/s²');
export type MillimetersPerSecondSquared = z.infer<typeof MillimetersPerSecondSquared>;
export const Grams = z.number().brand('g');
export type Grams = z.infer<typeof Grams>;

export const StepperDefinition = z.object({
	manufacturer: z.string(),
	model: z.string(),
	nemaSize: z.enum(NEMASize),
	bodyLength: Millimeter,
	stepAngle: Degree,
	ratedCurrent: Ampere,
	torque: NewtonCentimeter,
	inductance: MilliHenry,
	resistance: Ohm,
	rotorInertia: GramSquareCentimeter,
});
export type StepperDefinition = z.infer<typeof StepperDefinition>;
