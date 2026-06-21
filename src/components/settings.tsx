import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import {
	calculateEffectiveHobbedGearDiameter,
	calculateEffectiveSpeedDeratingPercent,
	calculateGearRatio,
	calculateRequiredExtruderTorque,
	calculateRequiredTorque,
	type MotorModel
} from '@/lib/formulas';
import type {
	Ampere,
	Grams,
	Kilogram,
	Millimeter,
	MillimetersPerSecondSquared,
	NewtonCentimeter,
	Percent,
	Volts
} from '@/lib/stepper';
import {
	currentDebugAtom,
	currentDriveModeAtom,
	currentDriveSettingsAtom,
	currentExtruderSettingsAtom,
	currentGantrySettingsAtom,
	GEAR_RATIO_PRESETS,
	HOBBED_GEAR_PRESETS,
	HOBBED_GEAR_TO_GEAR_RATIO_PRESET,
	maxPowerAtom,
	type DriveMode,
	type GearRatioPreset,
	type HobbedGearPreset
} from '@/state/atoms';
import { useAtom, useAtomValue } from 'jotai';
import {
	ArrowRightFromLineIcon,
	CircleGaugeIcon,
	CircleHelpIcon,
	CogIcon,
	CpuIcon,
	GaugeIcon,
	PercentIcon,
	PlugIcon,
	WeightIcon,
	ZapIcon
} from 'lucide-react';

export function DriveModeSelector() {
	const [driveMode, setDriveMode] = useAtom(currentDriveModeAtom);

	return (
		<Card className="w-full">
			<CardHeader>
				<CardTitle>Mode</CardTitle>
			</CardHeader>
			<CardContent>
				<RadioGroup
					value={driveMode}
					onValueChange={(value) => setDriveMode(value as DriveMode)}
					className="gap-3"
				>
					<div className="flex items-center gap-2">
						<RadioGroupItem value="gantry" id="drive-mode-gantry" />
						<Label htmlFor="drive-mode-gantry">Gantry (toolhead / AB motion)</Label>
					</div>
					<div className="flex items-center gap-2">
						<RadioGroupItem value="extruder" id="drive-mode-extruder" />
						<Label htmlFor="drive-mode-extruder" className="gap-1.5">
							Extruder
							<span className="text-[10px] uppercase tracking-wide text-muted-foreground border border-muted-foreground/40 rounded px-1 py-px leading-none">
								alpha
							</span>
						</Label>
					</div>
				</RadioGroup>
			</CardContent>
		</Card>
	);
}

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
				<div className="flex w-full max-w-sm items-start gap-2">
					<div className="size-5 pt-1.5">
						<CpuIcon className="w-5 h-5" />
					</div>
					<ToggleGroup
						type="single"
						variant="outline"
						size="sm"
						spacing={1}
						className="flex-1 flex-col"
						value={driveSettings.motorModel}
						onValueChange={(value) => {
							if (value === 'classic' || value === 'spreadCycle' || value === 'fieldWeakening') {
								setDriveSettings({
									...driveSettings,
									motorModel: value satisfies MotorModel
								});
							}
						}}
					>
						<ToggleGroupItem value="classic" className="w-full">
							Classic (naive)
						</ToggleGroupItem>
						<ToggleGroupItem value="spreadCycle" className="w-full gap-1.5">
							SpreadCycle / StealthChop
							<span className="text-[10px] uppercase tracking-wide text-muted-foreground border border-muted-foreground/40 rounded px-1 py-px leading-none">
								alpha
							</span>
						</ToggleGroupItem>
						<ToggleGroupItem value="fieldWeakening" className="w-full gap-1.5">
							TMC4671 (FOC)
							<span className="text-[10px] uppercase tracking-wide text-muted-foreground border border-muted-foreground/40 rounded px-1 py-px leading-none">
								alpha
							</span>
						</ToggleGroupItem>
					</ToggleGroup>
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
					<Select
						value={String(gantrySettings.toothPitch)}
						onValueChange={(value) =>
							setGantrySettings({
								...gantrySettings,
								toothPitch: Number(value)
							})
						}
					>
						<SelectTrigger className="w-full">
							<SelectValue placeholder="Tooth Pitch" />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="1.5">GT1.5 (1.5mm)</SelectItem>
							<SelectItem value="2">GT2 (2mm)</SelectItem>
							<SelectItem value="3">GT3 (3mm)</SelectItem>
						</SelectContent>
					</Select>
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
				<div className="flex w-full max-w-sm items-center gap-2">
					<div className="size-5">
						<GaugeIcon className="w-5 h-5" />
					</div>
					<Input
						type="number"
						placeholder="Required Torque (auto)"
						min={0}
						value={gantrySettings.manualRequiredTorque ?? ''}
						onChange={(e) => {
							const v = e.target.valueAsNumber;
							setGantrySettings({
								...gantrySettings,
								manualRequiredTorque: Number.isFinite(v) ? (v as NewtonCentimeter) : null
							});
						}}
					/>
					<span>Ncm</span>
				</div>

				{debug && (
					<>
						<Separator />

						<div className="flex flex-col w-full max-w-sm gap-2">
							<span>
								{((gantrySettings.pulleyTeeth * gantrySettings.toothPitch) / (2 * Math.PI)).toFixed(2)}{' '}
								mm effective pulley radius
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

export function ExtruderSettings() {
	const [extruderSettings, setExtruderSettings] = useAtom(currentExtruderSettingsAtom);
	const debug = useAtomValue(currentDebugAtom);
	const gearRatio = calculateGearRatio(extruderSettings);
	const effectiveDiameter = calculateEffectiveHobbedGearDiameter(extruderSettings);

	return (
		<Card className="w-full">
			<CardHeader>
				<CardTitle>Extruder Settings</CardTitle>
			</CardHeader>
			<CardContent className="space-y-2">
				<div className="flex items-center gap-1.5 text-sm font-medium">
					Hobbed Gear
					<Tooltip>
						<TooltipTrigger asChild>
							<CircleHelpIcon className="w-3.5 h-3.5 text-muted-foreground" />
						</TooltipTrigger>
						<TooltipContent>
							This is the nominal diameter of gear (the outer rim of hobbed region). The diameter 
							actually used for calculations is 0.6mm smaller, since standard hobbing depth cuts 
							into the gear and reduces its effective grip diameter.
						</TooltipContent>
					</Tooltip>
				</div>
				<div className="flex w-full max-w-sm items-center gap-2">
					<Select
						value={extruderSettings.hobbedGearPreset}
						onValueChange={(value) => {
							const preset = value as HobbedGearPreset;
							const matchedGearRatioPreset = preset === 'custom' ? null : HOBBED_GEAR_TO_GEAR_RATIO_PRESET[preset];
							const shouldUpdateGearRatio =
								matchedGearRatioPreset !== null && extruderSettings.gearRatioPreset !== 'custom';

							setExtruderSettings({
								...extruderSettings,
								hobbedGearPreset: preset,
								hobbedGearNominalDiameter:
									preset === 'custom'
										? extruderSettings.hobbedGearNominalDiameter
										: HOBBED_GEAR_PRESETS[preset].diameter,
								...(shouldUpdateGearRatio
									? {
											gearRatioPreset: matchedGearRatioPreset,
											gearA: GEAR_RATIO_PRESETS[matchedGearRatioPreset].ratio,
											gearB: 1
										}
									: {})
							});
						}}
					>
						<SelectTrigger className="w-full">
							<SelectValue placeholder="Hobbed Gear" />
						</SelectTrigger>
						<SelectContent>
							{Object.entries(HOBBED_GEAR_PRESETS).map(([key, preset]) => (
								<SelectItem key={key} value={key}>
									{preset.label}
								</SelectItem>
							))}
							<SelectItem value="custom">Custom</SelectItem>
						</SelectContent>
					</Select>
				</div>
				<div className="flex w-full max-w-sm items-center gap-2">
					<div className="size-5">
						<CircleGaugeIcon className="w-5 h-5" />
					</div>
					<Input
						type="number"
						placeholder="Hobbed Gear Nominal Diameter"
						min={1}
						step={0.1}
						disabled={extruderSettings.hobbedGearPreset !== 'custom'}
						value={extruderSettings.hobbedGearNominalDiameter}
						onChange={(e) =>
							setExtruderSettings({
								...extruderSettings,
								hobbedGearNominalDiameter: e.target.valueAsNumber as Millimeter
							})
						}
					/>
					<span>mm</span>
				</div>
				<div className="text-sm font-medium">Gear Reduction</div>
				<div className="flex w-full max-w-sm items-center gap-2">
					<Select
						value={extruderSettings.gearRatioPreset}
						onValueChange={(value) => {
							const preset = value as GearRatioPreset;
							setExtruderSettings({
								...extruderSettings,
								gearRatioPreset: preset,
								gearA: preset === 'custom' ? extruderSettings.gearA : GEAR_RATIO_PRESETS[preset].ratio,
								gearB: preset === 'custom' ? extruderSettings.gearB : 1
							});
						}}
					>
						<SelectTrigger className="w-full">
							<SelectValue placeholder="Gear Ratio" />
						</SelectTrigger>
						<SelectContent>
							{Object.entries(GEAR_RATIO_PRESETS).map(([key, preset]) => (
								<SelectItem key={key} value={key}>
									{preset.label}
								</SelectItem>
							))}
							<SelectItem value="custom">Custom</SelectItem>
						</SelectContent>
					</Select>
				</div>
				<div className="flex w-full max-w-sm items-center gap-2">
					<div className="size-5">
						<CogIcon className="w-5 h-5" />
					</div>
					<Input
						type="number"
						placeholder="Gear A"
						value={extruderSettings.gearA}
						min={1}
						onChange={(e) =>
							setExtruderSettings({
								...extruderSettings,
								gearRatioPreset: 'custom',
								gearA: e.target.valueAsNumber
							})
						}
					/>
					<span>:</span>
					<Input
						type="number"
						placeholder="Gear B"
						value={extruderSettings.gearB}
						min={1}
						onChange={(e) =>
							setExtruderSettings({
								...extruderSettings,
								gearRatioPreset: 'custom',
								gearB: e.target.valueAsNumber
							})
						}
					/>
				</div>
				<div className="flex w-full max-w-sm items-center gap-2">
					<div className="size-5">
						<GaugeIcon className="w-5 h-5" />
					</div>
					<Input
						type="number"
						placeholder="Required Extrusion Force"
						min={0}
						step={0.1}
						value={extruderSettings.manualRequiredForce ?? ''}
						onChange={(e) => {
							const v = e.target.valueAsNumber;
							setExtruderSettings({
								...extruderSettings,
								manualRequiredForce: Number.isFinite(v) ? (v as Kilogram) : null
							});
						}}
					/>
					<span>kgf</span>
				</div>
				<div className="flex w-full max-w-sm items-center gap-2">
					<Checkbox
						id="speed-derating-enabled"
						checked={extruderSettings.speedDeratingEnabled}
						onCheckedChange={(checked) =>
							setExtruderSettings({
								...extruderSettings,
								speedDeratingEnabled: checked === true
							})
						}
					/>
					<Label htmlFor="speed-derating-enabled" className="flex items-center gap-1.5 flex-1">
						Speed Derating Factor
						<Tooltip>
							<TooltipTrigger asChild>
								<CircleHelpIcon className="w-3.5 h-3.5 text-muted-foreground" />
							</TooltipTrigger>
							<TooltipContent>
								Extrusion is a sustained, direct-contact load with no flywheel to smooth over
								cogging and current ripple, so real motors fall well short of the idealized
								torque/speed curve. This derates speed to better match that. Treat the absolute
								numbers loosely - it's most useful for comparing motors on the same drivetrain,
								not for predicting an exact maximum flow rate. For retractions non-derated is 
								more applicable
							</TooltipContent>
						</Tooltip>
					</Label>
					<Input
						type="number"
						placeholder="Speed Derating Factor"
						min={1}
						max={100}
						className="w-24"
						disabled={!extruderSettings.speedDeratingEnabled}
						value={extruderSettings.speedDeratingFactor}
						onChange={(e) =>
							setExtruderSettings({
								...extruderSettings,
								speedDeratingFactor: e.target.valueAsNumber as Percent
							})
						}
					/>
					<span>%</span>
				</div>

				{debug && (
					<>
						<Separator />

						<div className="flex flex-col w-full max-w-sm gap-2">
							<span>{effectiveDiameter.toFixed(2)} mm effective hobbed gear diameter</span>
							<span>{calculateRequiredExtruderTorque(extruderSettings).toFixed(2)} Ncm required</span>
							<span>Gear Ratio: {gearRatio.toFixed(2)}</span>
							{extruderSettings.speedDeratingEnabled && (
								<span>
									Effective speed derating:{' '}
									{calculateEffectiveSpeedDeratingPercent(extruderSettings).toFixed(1)}%
								</span>
							)}
						</div>
					</>
				)}
			</CardContent>
		</Card>
	);
}
