import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { NumberInput } from '@/components/ui/number-input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { track } from '@/lib/analytics';
import { CURRENT_UNIT_LABEL, type CurrentUnit, formatCurrent, peakToUnit, unitToPeak } from '@/lib/current-unit';
import { calculateGearRatio, calculateRequiredTorque, type MotorModel } from '@/lib/formulas';
import type { Ampere, Grams, MillimetersPerSecondSquared, NewtonCentimeter, Volts } from '@/lib/stepper';
import { currentDebugAtom, currentDriveSettingsAtom, currentGantrySettingsAtom, maxPowerAtom } from '@/state/atoms';
import { useAtom, useAtomValue } from 'jotai';
import {
	ArrowRightFromLineIcon,
	CogIcon,
	CpuIcon,
	GaugeIcon,
	PlugIcon,
	TriangleAlertIcon,
	WeightIcon,
	ZapIcon
} from 'lucide-react';

export function DriveSettings() {
	const [driveSettings, setDriveSettings] = useAtom(currentDriveSettingsAtom);
	const maxPower = useAtomValue(maxPowerAtom);
	const debug = useAtomValue(currentDebugAtom);
	const currentUnit = driveSettings.currentUnit ?? 'peak';

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
					<NumberInput
						placeholder="Input Voltage"
						min={8}
						value={driveSettings.inputVoltage}
						onValueChange={(v) => setDriveSettings({ ...driveSettings, inputVoltage: v as Volts })}
					/>
					<span>V</span>
				</div>
				<div className="flex w-full max-w-sm flex-col gap-1">
					<div className="flex w-full items-center gap-2">
						<div className="size-5">
							<ZapIcon className="w-5 h-5" />
						</div>
						<NumberInput
							placeholder={`Max Drive Current (${CURRENT_UNIT_LABEL[currentUnit]}, per phase)`}
							min={0}
							max={5}
							step="any"
							value={formatCurrent(peakToUnit(driveSettings.maxDriveCurrent, currentUnit))}
							onValueChange={(v) =>
								setDriveSettings({
									...driveSettings,
									maxDriveCurrent: unitToPeak(v as Ampere, currentUnit)
								})
							}
						/>
						<ToggleGroup
							type="single"
							variant="outline"
							size="sm"
							value={currentUnit}
							onValueChange={(value) => {
								if (value === 'peak' || value === 'rms') {
									setDriveSettings({ ...driveSettings, currentUnit: value satisfies CurrentUnit });
									track('Current Unit Changed', { unit: value });
								}
							}}
						>
							<ToggleGroupItem value="peak">Peak</ToggleGroupItem>
							<ToggleGroupItem value="rms">RMS</ToggleGroupItem>
						</ToggleGroup>
					</div>
					<span className="flex items-start gap-1.5 pl-7 text-xs text-muted-foreground">
						<TriangleAlertIcon className="mt-px size-3.5 shrink-0 text-amber-500" />
						{currentUnit === 'rms'
							? 'RMS is not what datasheets quote. Rated currents in the stepper DB are peak per phase.'
							: 'Peak is not what Klipper / TMC drivers take. Their run_current is RMS. Switch to RMS to enter that value directly.'}
					</span>
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
								track('Motor Model Changed', { model: value });
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
					<NumberInput
						placeholder="Pulley Teeth"
						value={gantrySettings.pulleyTeeth}
						onValueChange={(v) => setGantrySettings({ ...gantrySettings, pulleyTeeth: v as number })}
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
					<NumberInput
						placeholder="Gear A"
						value={gantrySettings.gearA}
						min={1}
						onValueChange={(v) => setGantrySettings({ ...gantrySettings, gearA: v as number })}
					/>
					<span>:</span>
					<NumberInput
						placeholder="Gear B"
						value={gantrySettings.gearB}
						min={1}
						onValueChange={(v) => setGantrySettings({ ...gantrySettings, gearB: v as number })}
					/>
				</div>
				<div className="flex w-full max-w-sm items-center gap-2">
					<div className="size-5">
						<ArrowRightFromLineIcon className="w-5 h-5" />
					</div>
					<NumberInput
						placeholder="Acceleration"
						value={gantrySettings.acceleration}
						onValueChange={(v) =>
							setGantrySettings({ ...gantrySettings, acceleration: v as MillimetersPerSecondSquared })
						}
					/>
					<span>mm/s²</span>
				</div>
				<div className="flex w-full max-w-sm items-center gap-2">
					<div className="size-5">
						<WeightIcon className="w-5 h-5" />
					</div>
					<NumberInput
						placeholder="Toolhead and Y Axis Mass"
						value={gantrySettings.toolheadAndYAxisMass}
						onValueChange={(v) =>
							setGantrySettings({ ...gantrySettings, toolheadAndYAxisMass: v as Grams })
						}
					/>
					<span>g</span>
				</div>
				<div className="flex w-full max-w-sm items-center gap-2">
					<div className="size-5">
						<GaugeIcon className="w-5 h-5" />
					</div>
					<NumberInput
						placeholder="Required Torque (auto)"
						min={0}
						allowEmpty
						value={gantrySettings.manualRequiredTorque}
						onValueChange={(v) =>
							setGantrySettings({ ...gantrySettings, manualRequiredTorque: v as NewtonCentimeter | null })
						}
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
