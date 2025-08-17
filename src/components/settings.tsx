import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { calculateRequiredTorque } from '@/lib/formulas';
import type { Ampere, Grams, MillimetersPerSecondSquared, Percent, StepperDefinition, Volts } from '@/lib/stepper';
import { STEPPER_DB } from '@/lib/stepper-db';
import { driveSettingsAtom, gantrySettingsAtom, maxPowerAtom, steppersAtom } from '@/state/atoms';
import { useAtom, useAtomValue, useSetAtom } from 'jotai';
import { useState } from 'react';

export function DriveSettings() {
	const [driveSettings, setDriveSettings] = useAtom(driveSettingsAtom);
	const maxPower = useAtomValue(maxPowerAtom);

	return (
		<Card>
			<CardHeader>
				<CardTitle>Drive Settings</CardTitle>
			</CardHeader>
			<CardContent className='space-y-2'>
				<div className='flex w-full max-w-sm items-center gap-2'>
					<Input
						type='number'
						placeholder='Input Voltage'
						min={8}
						value={driveSettings.inputVoltage}
						onChange={(e) =>
							setDriveSettings({
								...driveSettings,
								inputVoltage: e.target.valueAsNumber as Volts
							})
						}
					/>
					<span>V</span>
				</div>
				<div className='flex w-full max-w-sm items-center gap-2'>
					<Input
						type='number'
						placeholder='Max Drive Current'
						min={0}
						max={5}
						value={driveSettings.maxDriveCurrent}
						onChange={(e) =>
							setDriveSettings({
								...driveSettings,
								maxDriveCurrent: e.target.valueAsNumber as Ampere
							})
						}
					/>
					<span>A</span>
				</div>
				<div className='flex w-full max-w-sm items-center gap-2'>
					<Input
						type='number'
						placeholder='Max Drive Percent'
						value={driveSettings.maxDrivePercent}
						max={100}
						onChange={(e) =>
							setDriveSettings({
								...driveSettings,
								maxDrivePercent: e.target.valueAsNumber as Percent
							})
						}
					/>
					<span>%</span>
				</div>

				<Separator />

				{/* TODO: check if we might need to specify this manually */}
				<div className='flex flex-col w-full max-w-sm gap-2'>
					<span>max power: {maxPower.toFixed(1)} W</span>
				</div>
			</CardContent>
		</Card>
	);
}

export function GantrySettings() {
	const [gantrySettings, setGantrySettings] = useAtom(gantrySettingsAtom);

	return (
		<Card>
			<CardHeader>
				<CardTitle>Gantry Settings</CardTitle>
			</CardHeader>
			<CardContent className='space-y-2'>
				<div className='flex w-full max-w-sm items-center gap-2'>
					<Input
						type='number'
						placeholder='Pulley Teeth'
						value={gantrySettings.pulleyTeeth}
						onChange={(e) =>
							setGantrySettings({
								...gantrySettings,
								pulleyTeeth: e.target.valueAsNumber
							})
						}
					/>
					<span>Teeth</span>
				</div>
				<Input
					type='number'
					placeholder='Gear Ratio'
					value={gantrySettings.gearRatio}
					onChange={(e) =>
						setGantrySettings({
							...gantrySettings,
							gearRatio: e.target.valueAsNumber
						})
					}
				/>
				<div className='flex w-full max-w-sm items-center gap-2'>
					<Input
						type='number'
						placeholder='Acceleration'
						value={gantrySettings.acceleration}
						onChange={(e) =>
							setGantrySettings({
								...gantrySettings,
								acceleration: e.target.valueAsNumber as MillimetersPerSecondSquared
							})
						}
					/>
					<span>mm/s²</span>
				</div>
				<div className='flex w-full max-w-sm items-center gap-2'>
					<Input
						type='number'
						placeholder='Toolhead and Y Axis Mass'
						value={gantrySettings.toolheadAndYAxisMass}
						onChange={(e) =>
							setGantrySettings({
								...gantrySettings,
								toolheadAndYAxisMass: e.target.valueAsNumber as Grams
							})
						}
					/>
					<span>g</span>
				</div>

				<Separator />

				<div className='flex flex-col w-full max-w-sm gap-2'>
					<span>{((gantrySettings.pulleyTeeth * 2) / (2 * Math.PI)).toFixed(2)} mm effective pulley diameter</span>
					<span>{calculateRequiredTorque(gantrySettings).toFixed(2)} Ncm required</span>
				</div>
			</CardContent>
		</Card>
	);
}

export function AddStepperCard() {
	const setSteppers = useSetAtom(steppersAtom);

	const [stepper, setStepper] = useState<StepperDefinition | null>(null);

	return (
		<form
			onSubmit={(ev) => {
				ev.preventDefault();
				if (!stepper) return;
				setSteppers((previous) => [...previous, stepper]);
			}}
			className='max-w-full'
		>
			<Card className='flex-1'>
				<CardHeader>
					<CardTitle>Add Stepper</CardTitle>
				</CardHeader>
				<CardContent>
					<Select
						name='stepper'
						value={stepper ? `${stepper.manufacturer}__${stepper.model}` : undefined}
						onValueChange={(value: string) => {
							const [manufacturer, model] = value.split('__');
							const stepper = STEPPER_DB.get(manufacturer)?.get(model) ?? null;
							setStepper(stepper);
						}}
					>
						<SelectTrigger className='w-full'>
							<SelectValue placeholder='Select a stepper' />
						</SelectTrigger>
						<SelectContent>
							{Array.from(STEPPER_DB.entries()).map(([brand, models]) => (
								<SelectGroup key={brand}>
									<SelectLabel>{brand}</SelectLabel>
									{Array.from(models.keys()).map((model) => {
										const key = `${brand}__${model}`;
										return (
											<SelectItem key={key} value={key}>
												{brand} {model}
											</SelectItem>
										);
									})}
								</SelectGroup>
							))}
						</SelectContent>
					</Select>
				</CardContent>
				<CardFooter className='flex justify-end'>
					<Button type='submit'>Add</Button>
				</CardFooter>
			</Card>
		</form>
	);
}
