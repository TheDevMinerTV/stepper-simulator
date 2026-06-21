import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartContainer, ChartLegend, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { Input } from '@/components/ui/input';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import {
	calculateDeratedMotorRotationsPerSecond,
	calculateDriveCurrent,
	calculateFilamentCrossSectionArea,
	calculateForceFromMotorTorque,
	calculateMaxCurrentAtSpecifiedPower,
	calculateMotorRotationsPerSecondForFlowRate,
	calculateRequiredTorque,
	calculateSingleCoilTorque
} from '@/lib/formulas';
import {
	DEFAULT_MAX_VELOCITY,
	autoMaxVelocity,
	buildTorqueCurve,
	stepperSeriesColor,
	stepperSeriesKey as generateKey
} from '@/lib/torque-curve';
import {
	currentDriveModeAtom,
	currentDriveSettingsAtom,
	currentExtruderSettingsAtom,
	currentGantrySettingsAtom,
	maxPowerAtom,
	steppersAtom
} from '@/state/atoms';
import { useAtomValue } from 'jotai';
import { useMemo, useState } from 'react';
import { CartesianGrid, Line, LineChart, ReferenceLine, XAxis, YAxis } from 'recharts';

/** Flow-rate resolution of the sampled extruder curve, in mm³/s */
const FLOW_STEP_SIZE = 2;
const DEFAULT_MAX_FLOW_RATE = 100;

export function Graph() {
	const driveMode = useAtomValue(currentDriveModeAtom);
	const driveSettings = useAtomValue(currentDriveSettingsAtom);
	const gantrySettings = useAtomValue(currentGantrySettingsAtom);
	const extruderSettings = useAtomValue(currentExtruderSettingsAtom);
	const maxPower = useAtomValue(maxPowerAtom);
	// `null` until the field is edited: the range follows the selection on its own, but a typed
	// value is never overwritten by it
	const [manualMaxVelocity, setManualMaxVelocity] = useState<number | null>(null);
	const [maxFlowRate, setMaxFlowRate] = useState(DEFAULT_MAX_FLOW_RATE);
	const [unit, setUnit] = useState<'mm/s' | 'rpm'>('mm/s');
	const [extruderUnit, setExtruderUnit] = useState<'volumetric' | 'linear'>('volumetric');

	const steppers = useAtomValue(steppersAtom);
	const isExtruderMode = driveMode === 'extruder';
	const pulleyCircumferenceMm = gantrySettings.pulleyTeeth * gantrySettings.toothPitch;
	const mmsToRpm = (mms: number) => (mms * 60) / pulleyCircumferenceMm;
	const rpmToMms = (rpm: number) => (rpm * pulleyCircumferenceMm) / 60;

	const requiredTorque = calculateRequiredTorque(gantrySettings);
	// Auto-fitting only describes the velocity axis, which extruder mode does not use
	const fittedMaxVelocity = useMemo(
		() =>
			isExtruderMode
				? DEFAULT_MAX_VELOCITY
				: autoMaxVelocity({ steppers, driveSettings, gantrySettings, maxPower, requiredTorque }),
		[isExtruderMode, steppers, driveSettings, gantrySettings, maxPower, requiredTorque]
	);
	const maxVelocity = manualMaxVelocity ?? fittedMaxVelocity;
	const displayedMax = unit === 'rpm' ? mmsToRpm(maxVelocity) : maxVelocity;

	const filamentCrossSectionArea = calculateFilamentCrossSectionArea();
	const flowToLinear = (flow: number) => flow / filamentCrossSectionArea;
	const linearToFlow = (linear: number) => linear * filamentCrossSectionArea;
	const displayedMaxFlow = extruderUnit === 'linear' ? flowToLinear(maxFlowRate) : maxFlowRate;

	const chartData = useMemo(() => {
		if (isExtruderMode) {
			const flowPoints = Array.from(
				{ length: Math.floor((maxFlowRate + FLOW_STEP_SIZE) / FLOW_STEP_SIZE) },
				(_, i) => i * FLOW_STEP_SIZE
			);

			return flowPoints.map((flowRate) => {
				const dataPoint: Record<string, number> = { flowRate };

				const rawRps = calculateMotorRotationsPerSecondForFlowRate(extruderSettings, flowRate);
				const rps = calculateDeratedMotorRotationsPerSecond(extruderSettings, rawRps);

				for (const stepper of steppers) {
					const maxCurrentAtSpecifiedPower = calculateMaxCurrentAtSpecifiedPower(maxPower, stepper);
					const driveCurrent = calculateDriveCurrent(driveSettings, stepper, maxCurrentAtSpecifiedPower);

					const motorTorque = calculateSingleCoilTorque(
						driveSettings.motorModel,
						stepper.stepAngle,
						stepper.ratedCurrent,
						stepper.torque,
						stepper.inductance,
						stepper.resistance,
						driveSettings.inputVoltage,
						driveCurrent,
						rps
					);

					const force = Math.max(calculateForceFromMotorTorque(extruderSettings, motorTorque), 0);
					dataPoint[generateKey(stepper)] = force;
				}

				return dataPoint;
			});
		}

		return buildTorqueCurve({ steppers, driveSettings, gantrySettings, maxPower, maxVelocity });
	}, [
		isExtruderMode,
		steppers,
		driveSettings,
		gantrySettings,
		extruderSettings,
		maxPower,
		maxVelocity,
		maxFlowRate
	]);

	const chartConfig = useMemo(
		() =>
			steppers.reduce(
				(acc, stepper, index) => {
					acc[generateKey(stepper)] = {
						label: generateKey(stepper),
						color: stepperSeriesColor(index)
					};
					return acc;
				},
				{} as Record<string, { label: string; color: string }>
			),
		[steppers]
	);

	const requiredForce = extruderSettings.manualRequiredForce ?? 0;
	const xAxisKey = isExtruderMode ? 'flowRate' : 'velocity';
	const yAxisUnit = isExtruderMode ? 'kgf' : 'Ncm';

	return (
		<Card className="pt-0">
			<CardHeader className="flex items-center gap-2 space-y-0 border-b py-5 sm:flex-row">
				<div className="grid flex-1 gap-1">
					<CardTitle>{isExtruderMode ? 'Grip Force Graph' : 'Torque Graph'}</CardTitle>
				</div>
				<div className="flex items-center gap-2">
					{isExtruderMode ? (
						<>
							<ToggleGroup
								type="single"
								variant="outline"
								size="sm"
								value={extruderUnit}
								onValueChange={(value) => {
									if (value === 'volumetric' || value === 'linear') setExtruderUnit(value);
								}}
							>
								<ToggleGroupItem value="volumetric">mm³/s</ToggleGroupItem>
								<ToggleGroupItem value="linear">mm/s</ToggleGroupItem>
							</ToggleGroup>
							<Input
								type="number"
								value={Number.isFinite(displayedMaxFlow) ? Math.round(displayedMaxFlow) : 0}
								className="w-24"
								onChange={(e) => {
									const v = e.target.valueAsNumber;
									if (Number.isNaN(v)) return;
									setMaxFlowRate(extruderUnit === 'linear' ? linearToFlow(v) : v);
								}}
							/>
						</>
					) : (
						<>
							<ToggleGroup
								type="single"
								variant="outline"
								size="sm"
								value={unit}
								onValueChange={(value) => {
									if (value === 'mm/s' || value === 'rpm') setUnit(value);
								}}
							>
								<ToggleGroupItem value="mm/s">mm/s</ToggleGroupItem>
								<ToggleGroupItem value="rpm">RPM</ToggleGroupItem>
							</ToggleGroup>
							<Input
								type="number"
								value={Number.isFinite(displayedMax) ? Math.round(displayedMax) : 0}
								className="w-24"
								step={100}
								onChange={(e) => {
									const v = e.target.valueAsNumber;
									if (Number.isNaN(v)) return;
									setManualMaxVelocity(unit === 'rpm' ? rpmToMms(v) : v);
								}}
							/>
						</>
					)}
					<span>{isExtruderMode ? (extruderUnit === 'linear' ? 'mm/s' : 'mm³/s') : unit}</span>
				</div>
			</CardHeader>
			<CardContent className="pt-0">
				{chartData.length === 0 ? (
					<div>No data to display</div>
				) : steppers.length === 0 ? (
					<div>No steppers selected</div>
				) : (
					<div style={{ width: '100%', height: '400px' }}>
						<ChartContainer config={chartConfig} className="aspect-auto h-[400px] w-full">
							<LineChart data={chartData}>
								<CartesianGrid vertical={false} />
								<XAxis
									dataKey={xAxisKey}
									tickLine={false}
									axisLine={false}
									tickMargin={8}
									minTickGap={20}
									tickFormatter={(value) =>
										isExtruderMode
											? extruderUnit === 'linear'
												? `${Math.round(flowToLinear(value))} mm/s`
												: `${value} mm³/s`
											: unit === 'rpm'
												? `${Math.round(mmsToRpm(value))} RPM`
												: `${value} mm/s`
									}
								/>
								<YAxis
									tickLine={false}
									axisLine={false}
									tickMargin={8}
									minTickGap={20}
									tickFormatter={(value) => `${value} ${yAxisUnit}`}
								/>
								<ChartTooltip
									cursor={false}
									content={
										<ChartTooltipContent
											labelFormatter={(_, payload) => {
												if (isExtruderMode) return null;

												const velocity = payload?.[0]?.payload?.velocity;
												if (typeof velocity !== 'number') return null;

												const mms = `${Math.round(velocity)} mm/s`;
												const rpmValue = mmsToRpm(velocity);
												if (!Number.isFinite(rpmValue)) return mms;

												const rpm = `${Math.round(rpmValue)} RPM`;
												return unit === 'rpm' ? `${rpm} · ${mms}` : `${mms} · ${rpm}`;
											}}
											formatter={(value, name) => (
												<>
													<div
														className="h-2.5 w-2.5 shrink-0 rounded-[2px] bg-[var(--color-bg)]"
														style={
															{
																'--color-bg':
																	chartConfig[name as keyof typeof chartConfig]
																		?.color || '#666'
															} as React.CSSProperties
														}
													/>
													{chartConfig[name as keyof typeof chartConfig]?.label || name}

													<div className="ml-auto flex items-baseline gap-0.5 font-mono font-medium tabular-nums text-foreground">
														{typeof value === 'number'
															? `${value.toFixed(2)} ${yAxisUnit}`
															: value}
													</div>
												</>
											)}
										/>
									}
								/>
								{steppers.map((stepper) => {
									const key = generateKey(stepper);
									return (
										<Line
											key={key}
											dataKey={key}
											type="monotone"
											dot={false}
											stroke={chartConfig[key]?.color}
											strokeWidth={2}
										/>
									);
								})}
								<ReferenceLine
									y={isExtruderMode ? requiredForce : requiredTorque}
									label={isExtruderMode ? 'Required Grip Force' : 'Required Torque'}
									stroke="red"
									strokeDasharray="6 6"
								/>

								<ChartLegend />
							</LineChart>
						</ChartContainer>
					</div>
				)}
			</CardContent>
		</Card>
	);
}
