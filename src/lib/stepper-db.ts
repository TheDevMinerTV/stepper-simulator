import type {
	Ampere,
	Degree,
	GramSquareCentimeter,
	MilliHenry,
	Millimeter,
	NewtonCentimeter,
	Ohm,
	StepperDefinition
} from '@/lib/stepper';

export const STEPPER_DB: Map<string, Map<string, StepperDefinition>> = new Map([
	[
		'KeliMotor',
		new Map<string, StepperDefinition>([
			[
				'BJ42D41-14V19',
				{
					brand: 'KeliMotor',
					model: 'BJ42D41-14V19',
					nemaSize: 17,
					bodyLength: 60 as Millimeter,
					stepAngle: 1.8 as Degree,
					ratedCurrent: 2 as Ampere,
					torque: 65 as NewtonCentimeter,
					inductance: 2.8 as MilliHenry,
					resistance: 1.1 as Ohm,
					rotorInertia: 128 as GramSquareCentimeter
				}
			],
			[
				'BJ42D22-25V04',
				{
					brand: 'KeliMotor',
					model: 'BJ42D22-25V04',
					nemaSize: 17,
					bodyLength: 40 as Millimeter,
					stepAngle: 1.8 as Degree,
					ratedCurrent: 1.2 as Ampere,
					torque: 40 as NewtonCentimeter,
					inductance: 6 as MilliHenry,
					resistance: 2.9 as Ohm,
					rotorInertia: 57 as GramSquareCentimeter
				}
			]
		])
	],
	[
		'ACT',
		new Map<string, StepperDefinition>([
			[
				'17HS5425-06',
				{
					brand: 'ACT',
					model: '17HS5425-06',
					nemaSize: 17,
					bodyLength: 48 as Millimeter,
					stepAngle: 1.8 as Degree,
					ratedCurrent: 2.5 as Ampere,
					torque: 60 as NewtonCentimeter,
					inductance: 1.75 as MilliHenry,
					resistance: 1 as Ohm,
					rotorInertia: 68 as GramSquareCentimeter
				}
			]
		])
	],
	[
		'FYSETC',
		new Map<string, StepperDefinition>([
			[
				'35HSH7402-24B-400A',
				{
					brand: 'FYSETC',
					model: '35HSH7402-24B-400A',
					nemaSize: 14,
					bodyLength: 51 as Millimeter,
					stepAngle: 1.8 as Degree,
					ratedCurrent: 1.5 as Ampere,
					torque: 42 as NewtonCentimeter,
					inductance: 5.5 as MilliHenry,
					resistance: 2.8 as Ohm,
					rotorInertia: 48 as GramSquareCentimeter
				}
			],
			[
				'42HSC1404B-200N8',
				{
					brand: 'FYSETC',
					model: '42HSC1404B-200N8',
					nemaSize: 14,
					bodyLength: 34.5 as Millimeter,
					stepAngle: 1.8 as Degree,
					ratedCurrent: 0.4 as Ampere,
					torque: 32 as NewtonCentimeter,
					inductance: 38 as MilliHenry,
					resistance: 29 as Ohm,
					rotorInertia: 40 as GramSquareCentimeter
				}
			],
			[
				'G36HSY4407-6D-550',
				{
					brand: 'FYSETC',
					model: 'G36HSY4407-6D-550',
					nemaSize: 14,
					bodyLength: 20.5 as Millimeter,
					stepAngle: 1.8 as Degree,
					ratedCurrent: 0.5 as Ampere,
					torque: 12 as NewtonCentimeter,
					inductance: 10 as MilliHenry,
					resistance: 13 as Ohm,
					rotorInertia: 15 as GramSquareCentimeter
				}
			],
			[
				'TB-3544',
				{
					brand: 'FYSETC',
					model: 'TB-3544',
					nemaSize: 17,
					bodyLength: 39 as Millimeter,
					stepAngle: 1.8 as Degree,
					ratedCurrent: 1.5 as Ampere,
					torque: 50 as NewtonCentimeter,
					inductance: 3.8 as MilliHenry,
					resistance: 1.8 as Ohm,
					rotorInertia: 55 as GramSquareCentimeter
				}
			],
			[
				'17HS19-2004S-C',
				{
					brand: 'FYSETC',
					model: '17HS19-2004S-C',
					nemaSize: 17,
					bodyLength: 48 as Millimeter,
					stepAngle: 1.8 as Degree,
					ratedCurrent: 2 as Ampere,
					torque: 59 as NewtonCentimeter,
					inductance: 3 as MilliHenry,
					resistance: 1.4 as Ohm,
					rotorInertia: 82 as GramSquareCentimeter
				}
			],
			[
				'MS17HD2P420A-01',
				{
					brand: 'FYSETC',
					model: 'MS17HD2P420A-01',
					nemaSize: 17,
					bodyLength: 40 as Millimeter,
					stepAngle: 1.8 as Degree,
					ratedCurrent: 2 as Ampere,
					torque: 54 as NewtonCentimeter,
					inductance: 3.1 as MilliHenry,
					resistance: 1.37 as Ohm,
					rotorInertia: 57 as GramSquareCentimeter
				}
			]
		])
	],
	[
		'Hanpose',
		new Map<string, StepperDefinition>([
			[
				'23HS4128',
				{
					brand: 'Hanpose',
					model: '23HS4128',
					nemaSize: 23,
					bodyLength: 41 as Millimeter,
					stepAngle: 1.8 as Degree,
					ratedCurrent: 2.8 as Ampere,
					torque: 55 as NewtonCentimeter,
					inductance: 1.4 as MilliHenry,
					resistance: 0.7 as Ohm,
					rotorInertia: 120 as GramSquareCentimeter
				}
			],
			[
				'17HS8401',
				{
					brand: 'Hanpose',
					model: '17HS8401',
					nemaSize: 17,
					bodyLength: 48 as Millimeter,
					stepAngle: 1.8 as Degree,
					ratedCurrent: 1.8 as Ampere,
					torque: 52 as NewtonCentimeter,
					inductance: 3.2 as MilliHenry,
					resistance: 1.8 as Ohm,
					rotorInertia: 68 as GramSquareCentimeter
				}
			],
			[
				'42HS38',
				{
					brand: 'Hanpose',
					model: '42HS38',
					nemaSize: 17,
					bodyLength: 40 as Millimeter,
					stepAngle: 1.8 as Degree,
					ratedCurrent: 1.5 as Ampere,
					torque: 40 as NewtonCentimeter,
					inductance: 2.8 as MilliHenry,
					resistance: 1.5 as Ohm,
					rotorInertia: 54 as GramSquareCentimeter
				}
			],
			[
				'17HS8401S-MD',
				{
					brand: 'Hanpose',
					model: '17HS8401S-MD',
					nemaSize: 17,
					bodyLength: 48 as Millimeter,
					stepAngle: 1.8 as Degree,
					ratedCurrent: 1.8 as Ampere,
					torque: 52 as NewtonCentimeter,
					inductance: 3.4 as MilliHenry,
					resistance: 1.8 as Ohm,
					rotorInertia: 68 as GramSquareCentimeter
				}
			],
			[
				'17HS3401',
				{
					brand: 'Hanpose',
					model: '17HS3401',
					nemaSize: 17,
					bodyLength: 34 as Millimeter,
					stepAngle: 1.8 as Degree,
					ratedCurrent: 1.3 as Ampere,
					torque: 28 as NewtonCentimeter,
					inductance: 2.9 as MilliHenry,
					resistance: 2.2 as Ohm,
					rotorInertia: 34 as GramSquareCentimeter
				}
			],
			[
				'17HS6401S',
				{
					brand: 'Hanpose',
					model: '17HS6401S',
					nemaSize: 17,
					bodyLength: 60 as Millimeter,
					stepAngle: 1.8 as Degree,
					ratedCurrent: 1.8 as Ampere,
					torque: 73 as NewtonCentimeter,
					inductance: 5.4 as MilliHenry,
					resistance: 2.3 as Ohm,
					rotorInertia: 72 as GramSquareCentimeter
				}
			],
			[
				'17HS8402S-D',
				{
					brand: 'Hanpose',
					model: '17HS8402S-D',
					nemaSize: 17,
					bodyLength: 48 as Millimeter,
					stepAngle: 1.8 as Degree,
					ratedCurrent: 1.8 as Ampere,
					torque: 52 as NewtonCentimeter,
					inductance: 3.8 as MilliHenry,
					resistance: 1.8 as Ohm,
					rotorInertia: 68 as GramSquareCentimeter
				}
			],
			[
				'42HS60-HCZ',
				{
					brand: 'Hanpose',
					model: '42HS60-HCZ',
					nemaSize: 17,
					bodyLength: 60 as Millimeter,
					stepAngle: 1.8 as Degree,
					ratedCurrent: 1.8 as Ampere,
					torque: 70 as NewtonCentimeter,
					inductance: 5.4 as MilliHenry,
					resistance: 2.3 as Ohm,
					rotorInertia: 72 as GramSquareCentimeter
				}
			],
			[
				'17HS3401S-FS',
				{
					brand: 'Hanpose',
					model: '17HS3401S-FS',
					nemaSize: 17,
					bodyLength: 34 as Millimeter,
					stepAngle: 1.8 as Degree,
					ratedCurrent: 1.3 as Ampere,
					torque: 28 as NewtonCentimeter,
					inductance: 2.8 as MilliHenry,
					resistance: 2.4 as Ohm,
					rotorInertia: 34 as GramSquareCentimeter
				}
			],
			[
				'17HS9401',
				{
					brand: 'Hanpose',
					model: '17HS9401',
					nemaSize: 17,
					bodyLength: 80 as Millimeter,
					stepAngle: 1.8 as Degree,
					ratedCurrent: 2.8 as Ampere,
					torque: 92 as NewtonCentimeter,
					inductance: 3.8 as MilliHenry,
					resistance: 1.5 as Ohm,
					rotorInertia: 83 as GramSquareCentimeter
				}
			],
			[
				'17HS6401S-0.9',
				{
					brand: 'Hanpose',
					model: '17HS6401S-0.9',
					nemaSize: 17,
					bodyLength: 60 as Millimeter,
					stepAngle: 0.9 as Degree,
					ratedCurrent: 1.8 as Ampere,
					torque: 70 as NewtonCentimeter,
					inductance: 5.4 as MilliHenry,
					resistance: 2.3 as Ohm,
					rotorInertia: 72 as GramSquareCentimeter
				}
			]
		])
	],
	[
		'LDO',
		new Map<string, StepperDefinition>([
			[
				'35STH48-1504AH(VRN)',
				{
					brand: 'LDO',
					model: '35STH48-1504AH(VRN)',
					nemaSize: 14,
					bodyLength: 52 as Millimeter,
					stepAngle: 1.8 as Degree,
					ratedCurrent: 1.5 as Ampere,
					torque: 37 as NewtonCentimeter,
					inductance: 3.8 as MilliHenry,
					resistance: 2.8 as Ohm,
					rotorInertia: 51.8 as GramSquareCentimeter
				}
			],
			[
				'35STH48-1684AHVRN',
				{
					brand: 'LDO',
					model: '35STH48-1684AHVRN',
					nemaSize: 14,
					bodyLength: 48 as Millimeter,
					stepAngle: 1.8 as Degree,
					ratedCurrent: 1.68 as Ampere,
					torque: 40 as NewtonCentimeter,
					inductance: 2.8 as MilliHenry,
					resistance: 1.65 as Ohm,
					rotorInertia: 49 as GramSquareCentimeter
				}
			],
			[
				'36STH20-1004AHG(XH)',
				{
					brand: 'LDO',
					model: '36STH20-1004AHG(XH)',
					nemaSize: 14,
					bodyLength: 20 as Millimeter,
					stepAngle: 1.8 as Degree,
					ratedCurrent: 1 as Ampere,
					torque: 10 as NewtonCentimeter,
					inductance: 1.6 as MilliHenry,
					resistance: 2.1 as Ohm,
					rotorInertia: 16 as GramSquareCentimeter
				}
			],
			[
				'42STH20-1004ASH',
				{
					brand: 'LDO',
					model: '42STH20-1004ASH',
					nemaSize: 17,
					bodyLength: 20 as Millimeter,
					stepAngle: 1.8 as Degree,
					ratedCurrent: 1 as Ampere,
					torque: 18 as NewtonCentimeter,
					inductance: 5 as MilliHenry,
					resistance: 3.6 as Ohm,
					rotorInertia: 21.4 as GramSquareCentimeter
				}
			],
			[
				'42STH38-1684MAC',
				{
					brand: 'LDO',
					model: '42STH38-1684MAC',
					nemaSize: 17,
					bodyLength: 40 as Millimeter,
					stepAngle: 0.9 as Degree,
					ratedCurrent: 1.68 as Ampere,
					torque: 32 as NewtonCentimeter,
					inductance: 3.2 as MilliHenry,
					resistance: 1.65 as Ohm,
					rotorInertia: 54 as GramSquareCentimeter
				}
			],
			[
				'42STH40-1004MAH(VRN)',
				{
					brand: 'LDO',
					model: '42STH40-1004MAH(VRN)',
					nemaSize: 17,
					bodyLength: 40 as Millimeter,
					stepAngle: 0.9 as Degree,
					ratedCurrent: 1 as Ampere,
					torque: 39 as NewtonCentimeter,
					inductance: 11.5 as MilliHenry,
					resistance: 4.1 as Ohm,
					rotorInertia: 62 as GramSquareCentimeter
				}
			],
			[
				'42STH40-1684AC',
				{
					brand: 'LDO',
					model: '42STH40-1684AC',
					nemaSize: 17,
					bodyLength: 40 as Millimeter,
					stepAngle: 1.8 as Degree,
					ratedCurrent: 1.68 as Ampere,
					torque: 45 as NewtonCentimeter,
					inductance: 3.6 as MilliHenry,
					resistance: 1.65 as Ohm,
					rotorInertia: 53 as GramSquareCentimeter
				}
			],
			[
				'42STH40-2004MAH(VRN)',
				{
					brand: 'LDO',
					model: '42STH40-2004MAH(VRN)',
					nemaSize: 17,
					bodyLength: 40 as Millimeter,
					stepAngle: 0.9 as Degree,
					ratedCurrent: 2 as Ampere,
					torque: 35 as NewtonCentimeter,
					inductance: 2.8 as MilliHenry,
					resistance: 1.1 as Ohm,
					rotorInertia: 71 as GramSquareCentimeter
				}
			],
			[
				'42STH47-1684AC',
				{
					brand: 'LDO',
					model: '42STH47-1684AC',
					nemaSize: 17,
					bodyLength: 48 as Millimeter,
					stepAngle: 1.8 as Degree,
					ratedCurrent: 1.68 as Ampere,
					torque: 49 as NewtonCentimeter,
					inductance: 2.8 as MilliHenry,
					resistance: 1.65 as Ohm,
					rotorInertia: 68 as GramSquareCentimeter
				}
			],
			[
				'42STH47-2504AC',
				{
					brand: 'LDO',
					model: '42STH47-2504AC',
					nemaSize: 17,
					bodyLength: 48 as Millimeter,
					stepAngle: 1.8 as Degree,
					ratedCurrent: 2.5 as Ampere,
					torque: 53.9 as NewtonCentimeter,
					inductance: 1.8 as MilliHenry,
					resistance: 1.25 as Ohm,
					rotorInertia: 68 as GramSquareCentimeter
				}
			],
			[
				'42STH48-1684MAH',
				{
					brand: 'LDO',
					model: '42STH48-1684MAH',
					nemaSize: 17,
					bodyLength: 48 as Millimeter,
					stepAngle: 0.9 as Degree,
					ratedCurrent: 1.68 as Ampere,
					torque: 39 as NewtonCentimeter,
					inductance: 2.8 as MilliHenry,
					resistance: 1.65 as Ohm,
					rotorInertia: 68 as GramSquareCentimeter
				}
			],
			[
				'42STH48-2004AC(VRN)',
				{
					brand: 'LDO',
					model: '42STH48-2004AC(VRN)',
					nemaSize: 17,
					bodyLength: 48 as Millimeter,
					stepAngle: 1.8 as Degree,
					ratedCurrent: 2 as Ampere,
					torque: 59 as NewtonCentimeter,
					inductance: 3 as MilliHenry,
					resistance: 1.6 as Ohm,
					rotorInertia: 85 as GramSquareCentimeter
				}
			],
			[
				'42STH48-2004AH',
				{
					brand: 'LDO',
					model: '42STH48-2004AH',
					nemaSize: 17,
					bodyLength: 48 as Millimeter,
					stepAngle: 1.8 as Degree,
					ratedCurrent: 2 as Ampere,
					torque: 59 as NewtonCentimeter,
					inductance: 3 as MilliHenry,
					resistance: 1.4 as Ohm,
					rotorInertia: 68 as GramSquareCentimeter
				}
			],
			[
				'42STH48-2004MAH(VRN)',
				{
					brand: 'LDO',
					model: '42STH48-2004MAH(VRN)',
					nemaSize: 17,
					bodyLength: 48 as Millimeter,
					stepAngle: 0.9 as Degree,
					ratedCurrent: 2 as Ampere,
					torque: 40 as NewtonCentimeter,
					inductance: 2 as MilliHenry,
					resistance: 1.45 as Ohm,
					rotorInertia: 68 as GramSquareCentimeter
				}
			],
			[
				'42STH48-2504AC',
				{
					brand: 'LDO',
					model: '42STH48-2504AC',
					nemaSize: 17,
					bodyLength: 48 as Millimeter,
					stepAngle: 1.8 as Degree,
					ratedCurrent: 2.5 as Ampere,
					torque: 55 as NewtonCentimeter,
					inductance: 1.5 as MilliHenry,
					resistance: 1.2 as Ohm,
					rotorInertia: 84.5 as GramSquareCentimeter
				}
			],
			[
				'42STH48-2504AH',
				{
					brand: 'LDO',
					model: '42STH48-2504AH',
					nemaSize: 17,
					bodyLength: 48 as Millimeter,
					stepAngle: 1.8 as Degree,
					ratedCurrent: 2.5 as Ampere,
					torque: 55 as NewtonCentimeter,
					inductance: 1.5 as MilliHenry,
					resistance: 1.2 as Ohm,
					rotorInertia: 84.5 as GramSquareCentimeter
				}
			],
			[
				'42STH60-2004AH',
				{
					brand: 'LDO',
					model: '42STH60-2004AH',
					nemaSize: 17,
					bodyLength: 60 as Millimeter,
					stepAngle: 1.8 as Degree,
					ratedCurrent: 2 as Ampere,
					torque: 83 as NewtonCentimeter,
					inductance: 3.3 as MilliHenry,
					resistance: 2 as Ohm,
					rotorInertia: 102 as GramSquareCentimeter
				}
			],
			[
				'42STH60-2004MAC (Railcore)',
				{
					brand: 'LDO',
					model: '42STH60-2004MAC (Railcore)',
					nemaSize: 17,
					bodyLength: 60 as Millimeter,
					stepAngle: 0.9 as Degree,
					ratedCurrent: 2 as Ampere,
					torque: 59 as NewtonCentimeter,
					inductance: 3 as MilliHenry,
					resistance: 1.4 as Ohm,
					rotorInertia: 120 as GramSquareCentimeter
				}
			],
			[
				'42STH60-2004MAH',
				{
					brand: 'LDO',
					model: '42STH60-2004MAH',
					nemaSize: 17,
					bodyLength: 60 as Millimeter,
					stepAngle: 0.9 as Degree,
					ratedCurrent: 2 as Ampere,
					torque: 58.8 as NewtonCentimeter,
					inductance: 3 as MilliHenry,
					resistance: 1.4 as Ohm,
					rotorInertia: 120 as GramSquareCentimeter
				}
			],
			[
				'57STH41-2804MAC(HEV)',
				{
					brand: 'LDO',
					model: '57STH41-2804MAC(HEV)',
					nemaSize: 23,
					bodyLength: 41 as Millimeter,
					stepAngle: 0.9 as Degree,
					ratedCurrent: 2.8 as Ampere,
					torque: 60 as NewtonCentimeter,
					inductance: 1.4 as MilliHenry,
					resistance: 0.7 as Ohm,
					rotorInertia: 120 as GramSquareCentimeter
				}
			],
			[
				'57STH56-2804MAC(RC)',
				{
					brand: 'LDO',
					model: '57STH56-2804MAC(RC)',
					nemaSize: 23,
					bodyLength: 56 as Millimeter,
					stepAngle: 0.9 as Degree,
					ratedCurrent: 2.8 as Ampere,
					torque: 120 as NewtonCentimeter,
					inductance: 3.4 as MilliHenry,
					resistance: 1.1 as Ohm,
					rotorInertia: 305 as GramSquareCentimeter
				}
			],
			[
				'42STH48-2804AC',
				{
					brand: 'LDO',
					model: '42STH48-2804AC',
					nemaSize: 17,
					bodyLength: 48 as Millimeter,
					stepAngle: 1.8 as Degree,
					ratedCurrent: 2.8 as Ampere,
					torque: 42 as NewtonCentimeter,
					inductance: 0.6 as MilliHenry,
					resistance: 0.7 as Ohm,
					rotorInertia: 84.5 as GramSquareCentimeter
				}
			],
			[
				'42STH48-2504MAC(F)',
				{
					brand: 'LDO',
					model: '42STH48-2504MAC(F)',
					nemaSize: 17,
					bodyLength: 48 as Millimeter,
					stepAngle: 0.9 as Degree,
					ratedCurrent: 2.5 as Ampere,
					torque: 45 as NewtonCentimeter,
					inductance: 1.5 as MilliHenry,
					resistance: 1.2 as Ohm,
					rotorInertia: 85 as GramSquareCentimeter
				}
			],
			[
				'35STH52-1504AH',
				{
					brand: 'LDO',
					model: '35STH52-1504AH',
					nemaSize: 14,
					bodyLength: 52 as Millimeter,
					stepAngle: 1.8 as Degree,
					ratedCurrent: 1.5 as Ampere,
					torque: 37 as NewtonCentimeter,
					inductance: 3.8 as MilliHenry,
					resistance: 2.8 as Ohm,
					rotorInertia: 52 as GramSquareCentimeter
				}
			],
			[
				'42STH40-2004MAH',
				{
					brand: 'LDO',
					model: '42STH40-2004MAH',
					nemaSize: 17,
					bodyLength: 40 as Millimeter,
					stepAngle: 0.9 as Degree,
					ratedCurrent: 2 as Ampere,
					torque: 35 as NewtonCentimeter,
					inductance: 1.1 as MilliHenry,
					resistance: 2.8 as Ohm,
					rotorInertia: 71 as GramSquareCentimeter
				}
			],
			[
				'42STH48-2004AC',
				{
					brand: 'LDO',
					model: '42STH48-2004AC',
					nemaSize: 17,
					bodyLength: 48 as Millimeter,
					stepAngle: 1.8 as Degree,
					ratedCurrent: 2 as Ampere,
					torque: 59 as NewtonCentimeter,
					inductance: 3 as MilliHenry,
					resistance: 1.4 as Ohm,
					rotorInertia: 68 as GramSquareCentimeter
				}
			],
			[
				'42STH48-2504AH(S55)',
				{
					brand: 'LDO',
					model: '42STH48-2504AH(S55)',
					nemaSize: 17,
					bodyLength: 48 as Millimeter,
					stepAngle: 1.8 as Degree,
					ratedCurrent: 2.5 as Ampere,
					torque: 55 as NewtonCentimeter,
					inductance: 1.5 as MilliHenry,
					resistance: 1.2 as Ohm,
					rotorInertia: 84 as GramSquareCentimeter
				}
			],
			[
				'42STH48-2504AH(S46)',
				{
					brand: 'LDO',
					model: '42STH48-2504AH(S46)',
					nemaSize: 17,
					bodyLength: 48 as Millimeter,
					stepAngle: 1.8 as Degree,
					ratedCurrent: 2.5 as Ampere,
					torque: 55 as NewtonCentimeter,
					inductance: 1.5 as MilliHenry,
					resistance: 1.2 as Ohm,
					rotorInertia: 84 as GramSquareCentimeter
				}
			],
			[
				'42STH48-2804AC-R',
				{
					brand: 'LDO',
					model: '42STH48-2804AC-R',
					nemaSize: 17,
					bodyLength: 48 as Millimeter,
					stepAngle: 1.8 as Degree,
					ratedCurrent: 2.8 as Ampere,
					torque: 42 as NewtonCentimeter,
					inductance: 0.6 as MilliHenry,
					resistance: 0.7 as Ohm,
					rotorInertia: 84 as GramSquareCentimeter
				}
			],
			[
				'35STH52-2004AH(S35)',
				{
					brand: 'LDO',
					model: '35STH52-2004AH(S35)',
					nemaSize: 14,
					bodyLength: 52 as Millimeter,
					stepAngle: 1.8 as Degree,
					ratedCurrent: 2 as Ampere,
					torque: 40 as NewtonCentimeter,
					inductance: 2.1 as MilliHenry,
					resistance: 1.34 as Ohm,
					rotorInertia: 40 as GramSquareCentimeter
				}
			],
			[
				'42STH48-2804AH-R',
				{
					brand: 'LDO',
					model: '42STH48-2804AH-R',
					nemaSize: 17,
					bodyLength: 48 as Millimeter,
					stepAngle: 1.8 as Degree,
					ratedCurrent: 2.8 as Ampere,
					torque: 42 as NewtonCentimeter,
					inductance: 0.6 as MilliHenry,
					resistance: 0.7 as Ohm,
					rotorInertia: 84 as GramSquareCentimeter
				}
			],
			[
				'42STH48-2504MAH',
				{
					brand: 'LDO',
					model: '42STH48-2504MAH',
					nemaSize: 17,
					bodyLength: 48 as Millimeter,
					stepAngle: 0.9 as Degree,
					ratedCurrent: 2.5 as Ampere,
					torque: 45 as NewtonCentimeter,
					inductance: 1.5 as MilliHenry,
					resistance: 1.2 as Ohm,
					rotorInertia: 85 as GramSquareCentimeter
				}
			],
			[
				'42STH48-2804AH (S55)',
				{
					brand: 'LDO',
					model: '42STH48-2804AH (S55)',
					nemaSize: 17,
					bodyLength: 48 as Millimeter,
					stepAngle: 1.8 as Degree,
					ratedCurrent: 2.8 as Ampere,
					torque: 42 as NewtonCentimeter,
					inductance: 0.6 as MilliHenry,
					resistance: 0.7 as Ohm,
					rotorInertia: 84 as GramSquareCentimeter
				}
			],
			[
				'42STH48-2804AH',
				{
					brand: 'LDO',
					model: '42STH48-2804AH',
					nemaSize: 17,
					bodyLength: 48 as Millimeter,
					stepAngle: 1.8 as Degree,
					ratedCurrent: 2.8 as Ampere,
					torque: 42 as NewtonCentimeter,
					inductance: 0.6 as MilliHenry,
					resistance: 0.7 as Ohm,
					rotorInertia: 84 as GramSquareCentimeter
				}
			],
			[
				'42STH48-2804AH (S80)',
				{
					brand: 'LDO',
					model: '42STH48-2804AH (S80)',
					nemaSize: 17,
					bodyLength: 48 as Millimeter,
					stepAngle: 1.8 as Degree,
					ratedCurrent: 2.8 as Ampere,
					torque: 42 as NewtonCentimeter,
					inductance: 0.6 as MilliHenry,
					resistance: 0.7 as Ohm,
					rotorInertia: 84 as GramSquareCentimeter
				}
			]
		])
	],
	[
		'Moons',
		new Map<string, StepperDefinition>([
			[
				'MS14HA1P4150',
				{
					brand: 'Moons',
					model: 'MS14HA1P4150',
					nemaSize: 14,
					bodyLength: 27 as Millimeter,
					stepAngle: 0.9 as Degree,
					ratedCurrent: 1.5 as Ampere,
					torque: 11 as NewtonCentimeter,
					inductance: 1.8 as MilliHenry,
					resistance: 1.55 as Ohm,
					rotorInertia: 12 as GramSquareCentimeter
				}
			],
			[
				'MS14HA3P4150',
				{
					brand: 'Moons',
					model: 'MS14HA3P4150',
					nemaSize: 14,
					bodyLength: 36 as Millimeter,
					stepAngle: 0.9 as Degree,
					ratedCurrent: 1.5 as Ampere,
					torque: 18 as NewtonCentimeter,
					inductance: 2.2 as MilliHenry,
					resistance: 1.61 as Ohm,
					rotorInertia: 20 as GramSquareCentimeter
				}
			],
			[
				'MS17HA2P4150',
				{
					brand: 'Moons',
					model: 'MS17HA2P4150',
					nemaSize: 17,
					bodyLength: 39.8 as Millimeter,
					stepAngle: 0.9 as Degree,
					ratedCurrent: 1.5 as Ampere,
					torque: 40 as NewtonCentimeter,
					inductance: 5.4 as MilliHenry,
					resistance: 1.98 as Ohm,
					rotorInertia: 57 as GramSquareCentimeter
				}
			],
			[
				'MS17HA2P4200',
				{
					brand: 'Moons',
					model: 'MS17HA2P4200',
					nemaSize: 17,
					bodyLength: 40 as Millimeter,
					stepAngle: 0.9 as Degree,
					ratedCurrent: 2 as Ampere,
					torque: 39 as NewtonCentimeter,
					inductance: 2.8 as MilliHenry,
					resistance: 1.05 as Ohm,
					rotorInertia: 57 as GramSquareCentimeter
				}
			],
			[
				'MS17HDBP4100',
				{
					brand: 'Moons',
					model: 'MS17HDBP4100',
					nemaSize: 17,
					bodyLength: 63 as Millimeter,
					stepAngle: 1.8 as Degree,
					ratedCurrent: 1 as Ampere,
					torque: 82 as NewtonCentimeter,
					inductance: 14.6 as MilliHenry,
					resistance: 5.6 as Ohm,
					rotorInertia: 123 as GramSquareCentimeter
				}
			],
			[
				'MS17HD6P420I-05',
				{
					brand: 'Moons',
					model: 'MS17HD6P420I-05',
					nemaSize: 17,
					bodyLength: 48 as Millimeter,
					stepAngle: 1.8 as Degree,
					ratedCurrent: 2 as Ampere,
					torque: 67 as NewtonCentimeter,
					inductance: 2.7 as MilliHenry,
					resistance: 1.3 as Ohm,
					rotorInertia: 82 as GramSquareCentimeter
				}
			],
			[
				'MS17HD6P4150-01',
				{
					brand: 'Moons',
					model: 'MS17HD6P4150-01',
					nemaSize: 17,
					bodyLength: 48 as Millimeter,
					stepAngle: 1.8 as Degree,
					ratedCurrent: 1.5 as Ampere,
					torque: 62 as NewtonCentimeter,
					inductance: 4.9 as MilliHenry,
					resistance: 2.2 as Ohm,
					rotorInertia: 62 as GramSquareCentimeter
				}
			],
			[
				'MS17HD6P420I-04',
				{
					brand: 'Moons',
					model: 'MS17HD6P420I-04',
					nemaSize: 17,
					bodyLength: 48 as Millimeter,
					stepAngle: 1.8 as Degree,
					ratedCurrent: 2 as Ampere,
					torque: 67 as NewtonCentimeter,
					inductance: 2.7 as MilliHenry,
					resistance: 1.3 as Ohm,
					rotorInertia: 82 as GramSquareCentimeter
				}
			]
		])
	],
	[
		'Motech',
		new Map<string, StepperDefinition>([
			[
				'MT-1704HSM168RE',
				{
					brand: 'Motech',
					model: 'MT-1704HSM168RE',
					nemaSize: 17,
					bodyLength: 48 as Millimeter,
					stepAngle: 0.9 as Degree,
					ratedCurrent: 1.68 as Ampere,
					torque: 43 as NewtonCentimeter,
					inductance: 2.8 as MilliHenry,
					resistance: 1.65 as Ohm,
					rotorInertia: 68 as GramSquareCentimeter
				}
			]
		])
	],
	[
		'Nanotec',
		new Map<string, StepperDefinition>([
			[
				'ST4209L1704-A',
				{
					brand: 'Nanotec',
					model: 'ST4209L1704-A',
					nemaSize: 17,
					bodyLength: 48 as Millimeter,
					stepAngle: 0.9 as Degree,
					ratedCurrent: 1.68 as Ampere,
					torque: 44 as NewtonCentimeter,
					inductance: 5 as MilliHenry,
					resistance: 1.8 as Ohm,
					rotorInertia: 68 as GramSquareCentimeter
				}
			]
		])
	],
	[
		'Stepperonline',
		new Map<string, StepperDefinition>([
			[
				'14HS10-0404S',
				{
					brand: 'Stepperonline',
					model: '14HS10-0404S',
					nemaSize: 14,
					bodyLength: 26 as Millimeter,
					stepAngle: 1.8 as Degree,
					ratedCurrent: 0.4 as Ampere,
					torque: 14 as NewtonCentimeter,
					inductance: 30 as MilliHenry,
					resistance: 30 as Ohm,
					rotorInertia: 12 as GramSquareCentimeter
				}
			],
			[
				'14HS13-0804S',
				{
					brand: 'Stepperonline',
					model: '14HS13-0804S',
					nemaSize: 14,
					bodyLength: 34 as Millimeter,
					stepAngle: 1.8 as Degree,
					ratedCurrent: 0.8 as Ampere,
					torque: 18 as NewtonCentimeter,
					inductance: 10 as MilliHenry,
					resistance: 6.8 as Ohm,
					rotorInertia: 14 as GramSquareCentimeter
				}
			],
			[
				'14HS17-0504S',
				{
					brand: 'Stepperonline',
					model: '14HS17-0504S',
					nemaSize: 14,
					bodyLength: 42 as Millimeter,
					stepAngle: 1.8 as Degree,
					ratedCurrent: 0.5 as Ampere,
					torque: 23 as NewtonCentimeter,
					inductance: 26 as MilliHenry,
					resistance: 15 as Ohm,
					rotorInertia: 18 as GramSquareCentimeter
				}
			],
			[
				'14HS20-1504S',
				{
					brand: 'Stepperonline',
					model: '14HS20-1504S',
					nemaSize: 14,
					bodyLength: 52 as Millimeter,
					stepAngle: 1.8 as Degree,
					ratedCurrent: 1.5 as Ampere,
					torque: 40 as NewtonCentimeter,
					inductance: 3.8 as MilliHenry,
					resistance: 2.8 as Ohm,
					rotorInertia: 54 as GramSquareCentimeter
				}
			],
			[
				'17HM19-1684S',
				{
					brand: 'Stepperonline',
					model: '17HM19-1684S',
					nemaSize: 17,
					bodyLength: 48 as Millimeter,
					stepAngle: 0.9 as Degree,
					ratedCurrent: 1.68 as Ampere,
					torque: 44 as NewtonCentimeter,
					inductance: 4.1 as MilliHenry,
					resistance: 1.65 as Ohm,
					rotorInertia: 68 as GramSquareCentimeter
				}
			],
			[
				'17HM19-2004S',
				{
					brand: 'Stepperonline',
					model: '17HM19-2004S',
					nemaSize: 17,
					bodyLength: 48 as Millimeter,
					stepAngle: 0.9 as Degree,
					ratedCurrent: 2 as Ampere,
					torque: 46 as NewtonCentimeter,
					inductance: 4 as MilliHenry,
					resistance: 1.45 as Ohm,
					rotorInertia: 82 as GramSquareCentimeter
				}
			],
			[
				'17HS08-1004S',
				{
					brand: 'Stepperonline',
					model: '17HS08-1004S',
					nemaSize: 17,
					bodyLength: 20 as Millimeter,
					stepAngle: 1.8 as Degree,
					ratedCurrent: 1 as Ampere,
					torque: 16 as NewtonCentimeter,
					inductance: 3.7 as MilliHenry,
					resistance: 4.5 as Ohm,
					rotorInertia: 22 as GramSquareCentimeter
				}
			],
			[
				'17HS13-0404S1',
				{
					brand: 'Stepperonline',
					model: '17HS13-0404S1',
					nemaSize: 17,
					bodyLength: 34 as Millimeter,
					stepAngle: 1.8 as Degree,
					ratedCurrent: 0.4 as Ampere,
					torque: 26 as NewtonCentimeter,
					inductance: 37 as MilliHenry,
					resistance: 30 as Ohm,
					rotorInertia: 38 as GramSquareCentimeter
				}
			],
			[
				'17HS16-2004S1',
				{
					brand: 'Stepperonline',
					model: '17HS16-2004S1',
					nemaSize: 17,
					bodyLength: 40 as Millimeter,
					stepAngle: 1.8 as Degree,
					ratedCurrent: 2 as Ampere,
					torque: 45 as NewtonCentimeter,
					inductance: 2.6 as MilliHenry,
					resistance: 1.1 as Ohm,
					rotorInertia: 54 as GramSquareCentimeter
				}
			],
			[
				'17HS19-2004S1',
				{
					brand: 'Stepperonline',
					model: '17HS19-2004S1',
					nemaSize: 17,
					bodyLength: 48 as Millimeter,
					stepAngle: 1.8 as Degree,
					ratedCurrent: 2 as Ampere,
					torque: 59 as NewtonCentimeter,
					inductance: 3 as MilliHenry,
					resistance: 1.4 as Ohm,
					rotorInertia: 82 as GramSquareCentimeter
				}
			],
			[
				'17HS24-2104S',
				{
					brand: 'Stepperonline',
					model: '17HS24-2104S',
					nemaSize: 17,
					bodyLength: 60 as Millimeter,
					stepAngle: 1.8 as Degree,
					ratedCurrent: 2.1 as Ampere,
					torque: 65 as NewtonCentimeter,
					inductance: 3 as MilliHenry,
					resistance: 1.6 as Ohm,
					rotorInertia: 148 as GramSquareCentimeter
				}
			],
			[
				'17HS15-1504S-X1',
				{
					brand: 'Stepperonline',
					model: '17HS15-1504S-X1',
					nemaSize: 17,
					bodyLength: 39 as Millimeter,
					stepAngle: 1.8 as Degree,
					ratedCurrent: 1.5 as Ampere,
					torque: 45 as NewtonCentimeter,
					inductance: 4.4 as MilliHenry,
					resistance: 2.3 as Ohm,
					rotorInertia: 54 as GramSquareCentimeter
				}
			],
			[
				'17HE15-1504S',
				{
					brand: 'Stepperonline',
					model: '17HE15-1504S',
					nemaSize: 17,
					bodyLength: 38 as Millimeter,
					stepAngle: 1.8 as Degree,
					ratedCurrent: 1.5 as Ampere,
					torque: 42 as NewtonCentimeter,
					inductance: 4 as MilliHenry,
					resistance: 2.3 as Ohm,
					rotorInertia: 57 as GramSquareCentimeter
				}
			]
		])
	],
	[
		'Wantai',
		new Map<string, StepperDefinition>([
			[
				'42BYGHW811',
				{
					brand: 'Wantai',
					model: '42BYGHW811',
					nemaSize: 17,
					bodyLength: 48 as Millimeter,
					stepAngle: 1.8 as Degree,
					ratedCurrent: 2.5 as Ampere,
					torque: 47 as NewtonCentimeter,
					inductance: 1.8 as MilliHenry,
					resistance: 1.25 as Ohm,
					rotorInertia: 68 as GramSquareCentimeter
				}
			],
			[
				'42BYGHW804',
				{
					brand: 'Wantai',
					model: '42BYGHW804',
					nemaSize: 17,
					bodyLength: 48 as Millimeter,
					stepAngle: 1.8 as Degree,
					ratedCurrent: 1.2 as Ampere,
					torque: 45 as NewtonCentimeter,
					inductance: 5 as MilliHenry,
					resistance: 3 as Ohm,
					rotorInertia: 68 as GramSquareCentimeter
				}
			],
			[
				'42BYGHW811-06',
				{
					brand: 'Wantai',
					model: '42BYGHW811-06',
					nemaSize: 17,
					bodyLength: 48 as Millimeter,
					stepAngle: 1.8 as Degree,
					ratedCurrent: 2.5 as Ampere,
					torque: 60 as NewtonCentimeter,
					inductance: 1.75 as MilliHenry,
					resistance: 1 as Ohm,
					rotorInertia: 68 as GramSquareCentimeter
				}
			],
			[
				'42BYGHW609',
				{
					brand: 'Wantai',
					model: '42BYGHW609',
					nemaSize: 17,
					bodyLength: 40 as Millimeter,
					stepAngle: 1.8 as Degree,
					ratedCurrent: 1.7 as Ampere,
					torque: 40 as NewtonCentimeter,
					inductance: 2.8 as MilliHenry,
					resistance: 2 as Ohm,
					rotorInertia: 54 as GramSquareCentimeter
				}
			]
		])
	],
	[
		'Cloudray',
		new Map<string, StepperDefinition>([
			[
				'17CS03A-130E',
				{
					brand: 'Cloudray',
					model: '17CS03A-130E',
					nemaSize: 17,
					bodyLength: 34 as Millimeter,
					stepAngle: 1.8 as Degree,
					ratedCurrent: 1.3 as Ampere,
					torque: 28 as NewtonCentimeter,
					inductance: 2.8 as MilliHenry,
					resistance: 2.26 as Ohm,
					rotorInertia: 41 as GramSquareCentimeter
				}
			],
			[
				'17CS02A-120',
				{
					brand: 'Cloudray',
					model: '17CS02A-120',
					nemaSize: 17,
					bodyLength: 40 as Millimeter,
					stepAngle: 1.8 as Degree,
					ratedCurrent: 1.2 as Ampere,
					torque: 20 as NewtonCentimeter,
					inductance: 5.1 as MilliHenry,
					resistance: 2.6 as Ohm,
					rotorInertia: 57 as GramSquareCentimeter
				}
			],
			[
				'17CS01A-100',
				{
					brand: 'Cloudray',
					model: '17CS01A-100',
					nemaSize: 17,
					bodyLength: 34 as Millimeter,
					stepAngle: 1.8 as Degree,
					ratedCurrent: 1 as Ampere,
					torque: 15 as NewtonCentimeter,
					inductance: 1.89 as MilliHenry,
					resistance: 1.28 as Ohm,
					rotorInertia: 41 as GramSquareCentimeter
				}
			],
			[
				'17CS05A-180E',
				{
					brand: 'Cloudray',
					model: '17CS05A-180E',
					nemaSize: 17,
					bodyLength: 48 as Millimeter,
					stepAngle: 1.8 as Degree,
					ratedCurrent: 1.8 as Ampere,
					torque: 52 as NewtonCentimeter,
					inductance: 5.8 as MilliHenry,
					resistance: 2.4 as Ohm,
					rotorInertia: 82 as GramSquareCentimeter
				}
			],
			[
				'17CS03A-150E',
				{
					brand: 'Cloudray',
					model: '17CS03A-150E',
					nemaSize: 17,
					bodyLength: 47 as Millimeter,
					stepAngle: 1.8 as Degree,
					ratedCurrent: 1.5 as Ampere,
					torque: 30 as NewtonCentimeter,
					inductance: 5.8 as MilliHenry,
					resistance: 2.4 as Ohm,
					rotorInertia: 82 as GramSquareCentimeter
				}
			],
			[
				'17CS03A-150',
				{
					brand: 'Cloudray',
					model: '17CS03A-150',
					nemaSize: 17,
					bodyLength: 47 as Millimeter,
					stepAngle: 1.8 as Degree,
					ratedCurrent: 1.5 as Ampere,
					torque: 30 as NewtonCentimeter,
					inductance: 5.8 as MilliHenry,
					resistance: 2.4 as Ohm,
					rotorInertia: 82 as GramSquareCentimeter
				}
			],
			[
				'17CS04A-170E',
				{
					brand: 'Cloudray',
					model: '17CS04A-170E',
					nemaSize: 17,
					bodyLength: 40 as Millimeter,
					stepAngle: 1.8 as Degree,
					ratedCurrent: 1.7 as Ampere,
					torque: 42 as NewtonCentimeter,
					inductance: 5.1 as MilliHenry,
					resistance: 2.6 as Ohm,
					rotorInertia: 57 as GramSquareCentimeter
				}
			],
			[
				'17CS04A-170',
				{
					brand: 'Cloudray',
					model: '17CS04A-170',
					nemaSize: 17,
					bodyLength: 40 as Millimeter,
					stepAngle: 1.8 as Degree,
					ratedCurrent: 1.7 as Ampere,
					torque: 42 as NewtonCentimeter,
					inductance: 5.1 as MilliHenry,
					resistance: 2.6 as Ohm,
					rotorInertia: 57 as GramSquareCentimeter
				}
			],
			[
				'17CS07A-180',
				{
					brand: 'Cloudray',
					model: '17CS07A-180',
					nemaSize: 17,
					bodyLength: 60 as Millimeter,
					stepAngle: 1.8 as Degree,
					ratedCurrent: 1.8 as Ampere,
					torque: 71 as NewtonCentimeter,
					inductance: 96 as MilliHenry,
					resistance: 1.94 as Ohm,
					rotorInertia: 114 as GramSquareCentimeter
				}
			]
		])
	],
	[
		'JKongMotor',
		new Map<string, StepperDefinition>([
			[
				'JK42HS40-1004-02F',
				{
					brand: 'JKongMotor',
					model: 'JK42HS40-1004-02F',
					nemaSize: 17,
					bodyLength: 40 as Millimeter,
					stepAngle: 1.8 as Degree,
					ratedCurrent: 1 as Ampere,
					torque: 42 as NewtonCentimeter,
					inductance: 8.9 as MilliHenry,
					resistance: 3.9 as Ohm,
					rotorInertia: 54 as GramSquareCentimeter
				}
			],
			[
				'JK42HS40-1704',
				{
					brand: 'JKongMotor',
					model: 'JK42HS40-1704',
					nemaSize: 17,
					bodyLength: 40 as Millimeter,
					stepAngle: 1.8 as Degree,
					ratedCurrent: 1.7 as Ampere,
					torque: 42 as NewtonCentimeter,
					inductance: 2.3 as MilliHenry,
					resistance: 1.5 as Ohm,
					rotorInertia: 54 as GramSquareCentimeter
				}
			]
		])
	],
	[
		'Noname',
		new Map<string, StepperDefinition>([
			[
				'B0459',
				{
					brand: 'Noname',
					model: 'B0459',
					nemaSize: 17,
					bodyLength: 47 as Millimeter,
					stepAngle: 1.8 as Degree,
					ratedCurrent: 2 as Ampere,
					torque: 56 as NewtonCentimeter,
					inductance: 1.9 as MilliHenry,
					resistance: 1.3 as Ohm,
					rotorInertia: 82 as GramSquareCentimeter
				}
			],
			[
				'42x4',
				{
					brand: 'Noname',
					model: '42x4',
					nemaSize: 17,
					bodyLength: 48 as Millimeter,
					stepAngle: 1.8 as Degree,
					ratedCurrent: 1.68 as Ampere,
					torque: 44 as NewtonCentimeter,
					inductance: 2.3 as MilliHenry,
					resistance: 1.65 as Ohm,
					rotorInertia: 68 as GramSquareCentimeter
				}
			]
		])
	],
	[
		'G-Penny',
		new Map<string, StepperDefinition>([
			[
				'42HS4825A4',
				{
					brand: 'G-Penny',
					model: '42HS4825A4',
					nemaSize: 17,
					bodyLength: 48 as Millimeter,
					stepAngle: 1.8 as Degree,
					ratedCurrent: 2.5 as Ampere,
					torque: 50 as NewtonCentimeter,
					inductance: 1.8 as MilliHenry,
					resistance: 1.6 as Ohm,
					rotorInertia: 68 as GramSquareCentimeter
				}
			],
			[
				'42HS4017A4',
				{
					brand: 'G-Penny',
					model: '42HS4017A4',
					nemaSize: 17,
					bodyLength: 60 as Millimeter,
					stepAngle: 1.8 as Degree,
					ratedCurrent: 1.7 as Ampere,
					torque: 42 as NewtonCentimeter,
					inductance: 2.3 as MilliHenry,
					resistance: 1.5 as Ohm,
					rotorInertia: 54 as GramSquareCentimeter
				}
			]
		])
	],
	[
		'RATTM',
		new Map<string, StepperDefinition>([
			[
				'17HS3430',
				{
					brand: 'RATTM',
					model: '17HS3430',
					nemaSize: 17,
					bodyLength: 34 as Millimeter,
					stepAngle: 1.8 as Degree,
					ratedCurrent: 1.2 as Ampere,
					torque: 28 as NewtonCentimeter,
					inductance: 3.8 as MilliHenry,
					resistance: 2.3 as Ohm,
					rotorInertia: 34 as GramSquareCentimeter
				}
			],
			[
				'17HS8403',
				{
					brand: 'RATTM',
					model: '17HS8403',
					nemaSize: 17,
					bodyLength: 48 as Millimeter,
					stepAngle: 1.8 as Degree,
					ratedCurrent: 2.3 as Ampere,
					torque: 46 as NewtonCentimeter,
					inductance: 1.6 as MilliHenry,
					resistance: 1.2 as Ohm,
					rotorInertia: 68 as GramSquareCentimeter
				}
			],
			[
				'17HS3410',
				{
					brand: 'RATTM',
					model: '17HS3410',
					nemaSize: 17,
					bodyLength: 34 as Millimeter,
					stepAngle: 1.8 as Degree,
					ratedCurrent: 1.7 as Ampere,
					torque: 28 as NewtonCentimeter,
					inductance: 1.8 as MilliHenry,
					resistance: 1.2 as Ohm,
					rotorInertia: 34 as GramSquareCentimeter
				}
			],
			[
				'17HS4402',
				{
					brand: 'RATTM',
					model: '17HS4402',
					nemaSize: 17,
					bodyLength: 40 as Millimeter,
					stepAngle: 1.8 as Degree,
					ratedCurrent: 1.3 as Ampere,
					torque: 40 as NewtonCentimeter,
					inductance: 5 as MilliHenry,
					resistance: 2.5 as Ohm,
					rotorInertia: 54 as GramSquareCentimeter
				}
			],
			[
				'17HM8401C',
				{
					brand: 'RATTM',
					model: '17HM8401C',
					nemaSize: 17,
					bodyLength: 48 as Millimeter,
					stepAngle: 0.9 as Degree,
					ratedCurrent: 1.7 as Ampere,
					torque: 42 as NewtonCentimeter,
					inductance: 4 as MilliHenry,
					resistance: 1.8 as Ohm,
					rotorInertia: 68 as GramSquareCentimeter
				}
			],
			[
				'17HS4401J',
				{
					brand: 'RATTM',
					model: '17HS4401J',
					nemaSize: 17,
					bodyLength: 40 as Millimeter,
					stepAngle: 1.8 as Degree,
					ratedCurrent: 1.7 as Ampere,
					torque: 45 as NewtonCentimeter,
					inductance: 3.2 as MilliHenry,
					resistance: 1.7 as Ohm,
					rotorInertia: 54 as GramSquareCentimeter
				}
			]
		])
	],
	[
		'Leadshine / YunTaiKe',
		new Map<string, StepperDefinition>([
			[
				'42CM08',
				{
					brand: 'Leadshine / YunTaiKe',
					model: '42CM08',
					nemaSize: 17,
					bodyLength: 60 as Millimeter,
					stepAngle: 1.8 as Degree,
					ratedCurrent: 2.5 as Ampere,
					torque: 80 as NewtonCentimeter,
					inductance: 2.4 as MilliHenry,
					resistance: 1 as Ohm,
					rotorInertia: 110 as GramSquareCentimeter
				}
			],
			[
				'42CM06',
				{
					brand: 'Leadshine / YunTaiKe',
					model: '42CM06',
					nemaSize: 17,
					bodyLength: 47 as Millimeter,
					stepAngle: 1.8 as Degree,
					ratedCurrent: 2.5 as Ampere,
					torque: 60 as NewtonCentimeter,
					inductance: 1.6 as MilliHenry,
					resistance: 0.9 as Ohm,
					rotorInertia: 72 as GramSquareCentimeter
				}
			],
			[
				'42CM02',
				{
					brand: 'Leadshine / YunTaiKe',
					model: '42CM02',
					nemaSize: 17,
					bodyLength: 33 as Millimeter,
					stepAngle: 1.8 as Degree,
					ratedCurrent: 1.5 as Ampere,
					torque: 20 as NewtonCentimeter,
					inductance: 1.4 as MilliHenry,
					resistance: 1.4 as Ohm,
					rotorInertia: 35 as GramSquareCentimeter
				}
			],
			[
				'42CM04-1A',
				{
					brand: 'Leadshine / YunTaiKe',
					model: '42CM04-1A',
					nemaSize: 17,
					bodyLength: 39 as Millimeter,
					stepAngle: 1.8 as Degree,
					ratedCurrent: 1 as Ampere,
					torque: 45 as NewtonCentimeter,
					inductance: 7.9 as MilliHenry,
					resistance: 4 as Ohm,
					rotorInertia: 54 as GramSquareCentimeter
				}
			]
		])
	],
	[
		'Lerdge',
		new Map<string, StepperDefinition>([
			[
				'42BYGH40',
				{
					brand: 'Lerdge',
					model: '42BYGH40',
					nemaSize: 17,
					bodyLength: 40 as Millimeter,
					stepAngle: 1.8 as Degree,
					ratedCurrent: 1.5 as Ampere,
					torque: 35 as NewtonCentimeter,
					inductance: 3.6 as MilliHenry,
					resistance: 3.5 as Ohm,
					rotorInertia: 57 as GramSquareCentimeter
				}
			]
		])
	],
	[
		'Usongshine',
		new Map<string, StepperDefinition>([
			[
				'17HS4401',
				{
					brand: 'Usongshine',
					model: '17HS4401',
					nemaSize: 17,
					bodyLength: 38 as Millimeter,
					stepAngle: 1.8 as Degree,
					ratedCurrent: 1.5 as Ampere,
					torque: 42 as NewtonCentimeter,
					inductance: 3.7 as MilliHenry,
					resistance: 2.4 as Ohm,
					rotorInertia: 57 as GramSquareCentimeter
				}
			]
		])
	],
	[
		'Motech Motors',
		new Map<string, StepperDefinition>([
			[
				'1701HS140A',
				{
					brand: 'Motech Motors',
					model: '1701HS140A',
					nemaSize: 17,
					bodyLength: 26 as Millimeter,
					stepAngle: 1.8 as Degree,
					ratedCurrent: 1.4 as Ampere,
					torque: 15 as NewtonCentimeter,
					inductance: 2 as MilliHenry,
					resistance: 1.9 as Ohm,
					rotorInertia: 20 as GramSquareCentimeter
				}
			],
			[
				'1702HS133A',
				{
					brand: 'Motech Motors',
					model: '1702HS133A',
					nemaSize: 17,
					bodyLength: 34 as Millimeter,
					stepAngle: 1.8 as Degree,
					ratedCurrent: 1.3 as Ampere,
					torque: 32 as NewtonCentimeter,
					inductance: 2.5 as MilliHenry,
					resistance: 2.1 as Ohm,
					rotorInertia: 35 as GramSquareCentimeter
				}
			],
			[
				'1703HS168A',
				{
					brand: 'Motech Motors',
					model: '1703HS168A',
					nemaSize: 17,
					bodyLength: 40 as Millimeter,
					stepAngle: 1.8 as Degree,
					ratedCurrent: 1.7 as Ampere,
					torque: 44 as NewtonCentimeter,
					inductance: 3.6 as MilliHenry,
					resistance: 1.65 as Ohm,
					rotorInertia: 54 as GramSquareCentimeter
				}
			],
			[
				'1403HS100A',
				{
					brand: 'Motech Motors',
					model: '1403HS100A',
					nemaSize: 14,
					bodyLength: 34 as Millimeter,
					stepAngle: 1.8 as Degree,
					ratedCurrent: 1 as Ampere,
					torque: 18 as NewtonCentimeter,
					inductance: 4 as MilliHenry,
					resistance: 2.7 as Ohm,
					rotorInertia: 14 as GramSquareCentimeter
				}
			],
			[
				'1704HS168A',
				{
					brand: 'Motech Motors',
					model: '1704HS168A',
					nemaSize: 17,
					bodyLength: 48 as Millimeter,
					stepAngle: 1.8 as Degree,
					ratedCurrent: 1.7 as Ampere,
					torque: 55 as NewtonCentimeter,
					inductance: 2.8 as MilliHenry,
					resistance: 1.65 as Ohm,
					rotorInertia: 68 as GramSquareCentimeter
				}
			],
			[
				'1702HSM133A',
				{
					brand: 'Motech Motors',
					model: '1702HSM133A',
					nemaSize: 17,
					bodyLength: 34 as Millimeter,
					stepAngle: 0.9 as Degree,
					ratedCurrent: 1.3 as Ampere,
					torque: 25 as NewtonCentimeter,
					inductance: 2.5 as MilliHenry,
					resistance: 2.1 as Ohm,
					rotorInertia: 35 as GramSquareCentimeter
				}
			],
			[
				'1703HSM168A',
				{
					brand: 'Motech Motors',
					model: '1703HSM168A',
					nemaSize: 17,
					bodyLength: 40 as Millimeter,
					stepAngle: 0.9 as Degree,
					ratedCurrent: 1.7 as Ampere,
					torque: 35 as NewtonCentimeter,
					inductance: 3.6 as MilliHenry,
					resistance: 1.65 as Ohm,
					rotorInertia: 54 as GramSquareCentimeter
				}
			],
			[
				'1705HS200A',
				{
					brand: 'Motech Motors',
					model: '1705HS200A',
					nemaSize: 17,
					bodyLength: 60 as Millimeter,
					stepAngle: 1.8 as Degree,
					ratedCurrent: 2 as Ampere,
					torque: 82 as NewtonCentimeter,
					inductance: 3.3 as MilliHenry,
					resistance: 2 as Ohm,
					rotorInertia: 102 as GramSquareCentimeter
				}
			],
			[
				'1704HSM168A',
				{
					brand: 'Motech Motors',
					model: '1704HSM168A',
					nemaSize: 17,
					bodyLength: 48 as Millimeter,
					stepAngle: 0.9 as Degree,
					ratedCurrent: 1.7 as Ampere,
					torque: 44 as NewtonCentimeter,
					inductance: 2.8 as MilliHenry,
					resistance: 1.65 as Ohm,
					rotorInertia: 68 as GramSquareCentimeter
				}
			],
			[
				'1404HS100A',
				{
					brand: 'Motech Motors',
					model: '1404HS100A',
					nemaSize: 14,
					bodyLength: 48 as Millimeter,
					stepAngle: 1.8 as Degree,
					ratedCurrent: 1.7 as Ampere,
					torque: 37 as NewtonCentimeter,
					inductance: 2.3 as MilliHenry,
					resistance: 1.65 as Ohm,
					rotorInertia: 54 as GramSquareCentimeter
				}
			],
			[
				'1405HS100A',
				{
					brand: 'Motech Motors',
					model: '1405HS100A',
					nemaSize: 14,
					bodyLength: 52 as Millimeter,
					stepAngle: 1.8 as Degree,
					ratedCurrent: 1.5 as Ampere,
					torque: 41 as NewtonCentimeter,
					inductance: 3.8 as MilliHenry,
					resistance: 2.8 as Ohm,
					rotorInertia: 54 as GramSquareCentimeter
				}
			]
		])
	]
]);
