import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { calculateGearRatio, calculateRequiredTorque } from '@/lib/formulas';
import type {
	Ampere,
	Grams,
	MillimetersPerSecondSquared,
	Percent,
	Volts
} from '@/lib/stepper';
import {
	currentDebugAtom,
	currentDriveSettingsAtom,
	currentGantrySettingsAtom,
	maxPowerAtom
} from '@/state/atoms';
import { useAtom, useAtomValue } from 'jotai';
import {
	ArrowRightFromLineIcon,
	CogIcon,
	PercentIcon,
	PlugIcon,
	WeightIcon,
	ZapIcon
} from 'lucide-react';

export function DriveSettings() {
	const [driveSettings, setDriveSettings] = useAtom(currentDriveSettingsAtom);
	const maxPower = useAtomValue(maxPowerAtom);
	const debug = useAtomValue(currentDebugAtom);

	return (
		<Card className="w-full">
			<CardHeader>
				<div className="flex items-center justify-between">
					<CardTitle>Drive Settings</CardTitle>
				</div>
			</CardHeader>
			<CardContent className="space-y-2">
				<div className="flex w-full max-w-sm items-center gap-2">
					<div className="size-5">
						<PlugIcon className="w-5 h-5" />
					</div>
					<Input
						type="number"
						placeholder="Input Voltage"
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
				<div className="flex w-full max-w-sm items-center gap-2">
					<div className="size-5">
						<ZapIcon className="w-5 h-5" />
					</div>
					<Input
						type="number"
						placeholder="Max Drive Current"
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
				<div className="flex w-full max-w-sm items-center gap-2">
					<div className="size-5">
						<PercentIcon className="w-5 h-5" />
					</div>
					<Input
						type="number"
						placeholder="Max Drive Percent"
						value={driveSettings.maxDrivePercent}
						min={0}
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

				{debug && (
					<>
						<Separator />

						{/* TODO: check if we might need to specify this manually */}
						<div className="flex flex-col w-full max-w-sm gap-2">
							<span>max power: {maxPower.toFixed(1)} W</span>
						</div>
					</>
				)}
			</CardContent>
		</Card>
	);
}

export function GantrySettings() {
	const [gantrySettings, setGantrySettings] = useAtom(currentGantrySettingsAtom);
	const debug = useAtomValue(currentDebugAtom);
	const gearRatio = calculateGearRatio(gantrySettings);

	return (
		<Card className="w-full">
			<CardHeader>
				<CardTitle>Gantry Settings</CardTitle>
			</CardHeader>
			<CardContent className="space-y-2">
				<div className="flex w-full max-w-sm items-center gap-2">
					<Input
						type="number"
						placeholder="Pulley Teeth"
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
				<div className="flex w-full max-w-sm items-center gap-2">
					<div className="size-5">
						<CogIcon className="w-5 h-5" />
					</div>
					<Input
						type="number"
						placeholder="Gear A"
						value={gantrySettings.gearA}
						min={1}
						onChange={(e) =>
							setGantrySettings({
								...gantrySettings,
								gearA: e.target.valueAsNumber
							})
						}
					/>
					<span>:</span>
					<Input
						type="number"
						placeholder="Gear B"
						value={gantrySettings.gearB}
						min={1}
						onChange={(e) =>
							setGantrySettings({
								...gantrySettings,
								gearB: e.target.valueAsNumber
							})
						}
					/>
				</div>
				<div className="flex w-full max-w-sm items-center gap-2">
					<div className="size-5">
						<ArrowRightFromLineIcon className="w-5 h-5" />
					</div>
					<Input
						type="number"
						placeholder="Acceleration"
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
				<div className="flex w-full max-w-sm items-center gap-2">
					<div className="size-5">
						<WeightIcon className="w-5 h-5" />
					</div>
					<Input
						type="number"
						placeholder="Toolhead and Y Axis Mass"
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

				{debug && (
					<>
						<Separator />

						<div className="flex flex-col w-full max-w-sm gap-2">
							<span>
								{((gantrySettings.pulleyTeeth * 2) / (2 * Math.PI)).toFixed(2)} mm effective pulley
								diameter
							</span>
							<span>{calculateRequiredTorque(gantrySettings).toFixed(2)} Ncm required</span>
							<span>Gear Ratio: {gearRatio.toFixed(2)}</span>
						</div>
					</>
				)}
			</CardContent>
		</Card>
	);
}
