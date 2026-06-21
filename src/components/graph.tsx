import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartContainer, ChartLegend, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import {
	calculateDeratedMotorRotationsPerSecond,
	calculateDriveCurrent,
	calculateFilamentCrossSectionArea,
	calculateForceFromMotorTorque,
	calculateMaxCurrentAtSpecifiedPower,
	calculateMotorRotationsPerSecondForFlowRate,
	calculateRequiredTorque,
	calculateSingleCoilTorque,
	calculateTorqueRotor
} from '@/lib/formulas';
import type { StepperDefinition } from '@/lib/stepper';
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

const STEP_SIZE = 20;
const FLOW_STEP_SIZE = 2;
const DEFAULT_MAX_VELOCITY = 2000;
const DEFAULT_MAX_FLOW_RATE = 100;
const DEFAULT_EXTRUSION_WIDTH = 0.4;
const DEFAULT_LAYER_HEIGHT = 0.2;
const DEFAULT_MAX_PRINT_SPEED = DEFAULT_MAX_FLOW_RATE / (DEFAULT_EXTRUSION_WIDTH * DEFAULT_LAYER_HEIGHT);
const AXIS_TICK_COUNT = 6;

// Evenly spaced ticks in display units, always including 0 and the exact max
// (rather than relying on the chart's auto-picked "nice" values in the raw
// data domain, which drift when the unit conversion factor changes).
function generateEvenTicks(max: number, count: number) {
	if (!Number.isFinite(max) || max <= 0) return [0];
	return Array.from({ length: count }, (_, i) => Math.round((max * i) / (count - 1)));
}

function generateKey(stepper: StepperDefinition) {
	return `${stepper.brand} ${stepper.model}`;
}

export function Graph() {
	const driveMode = useAtomValue(currentDriveModeAtom);
	const driveSettings = useAtomValue(currentDriveSettingsAtom);
	const gantrySettings = useAtomValue(currentGantrySettingsAtom);
	const extruderSettings = useAtomValue(currentExtruderSettingsAtom);
	const maxPower = useAtomValue(maxPowerAtom);
	const [maxVelocity, setMaxVelocity] = useState(DEFAULT_MAX_VELOCITY);
	const [maxFlowRate, setMaxFlowRate] = useState(DEFAULT_MAX_FLOW_RATE);
	const [maxPrintSpeed, setMaxPrintSpeed] = useState(DEFAULT_MAX_PRINT_SPEED);
	const [unit, setUnit] = useState<'mm/s' | 'rpm'>('mm/s');
	const [extruderUnit, setExtruderUnit] = useState<'volumetric' | 'linear' | 'print'>('volumetric');
	const [extrusionWidth, setExtrusionWidth] = useState(DEFAULT_EXTRUSION_WIDTH);
	const [layerHeight, setLayerHeight] = useState(DEFAULT_LAYER_HEIGHT);

	const steppers = useAtomValue(steppersAtom);
	const pulleyCircumferenceMm = gantrySettings.pulleyTeeth * gantrySettings.toothPitch;
	const mmsToRpm = (mms: number) => (mms * 60) / pulleyCircumferenceMm;
	const rpmToMms = (rpm: number) => (rpm * pulleyCircumferenceMm) / 60;
	const displayedMax = unit === 'rpm' ? mmsToRpm(maxVelocity) : maxVelocity;

	const filamentCrossSectionArea = calculateFilamentCrossSectionArea();
	const flowToLinear = (flow: number) => flow / filamentCrossSectionArea;
	const linearToFlow = (linear: number) => linear * filamentCrossSectionArea;
	const printLineCrossSectionArea = extrusionWidth * layerHeight;
	const flowToPrintSpeed = (flow: number) => flow / printLineCrossSectionArea;
	const printSpeedToFlow = (printSpeed: number) => printSpeed * printLineCrossSectionArea;

	// In print speed mode, maxPrintSpeed (not maxFlowRate) is the canonical axis
	// bound, so the displayed max stays put when line width/height change.
	// The underlying flow domain is re-derived from it instead, which is what
	// makes the curves shift relative to a fixed axis as width/height change.
	const effectiveMaxFlowRate = extruderUnit === 'print' ? printSpeedToFlow(maxPrintSpeed) : maxFlowRate;
	const displayedMaxFlow =
		extruderUnit === 'linear' ? flowToLinear(maxFlowRate) : extruderUnit === 'print' ? maxPrintSpeed : maxFlowRate;

	const chartData = useMemo(() => {
		if (driveMode === 'extruder') {
			const flowPoints = Array.from(
				{ length: Math.floor((effectiveMaxFlowRate + FLOW_STEP_SIZE) / FLOW_STEP_SIZE) },
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

		const velocityPoints = Array.from(
			{ length: Math.floor((maxVelocity + STEP_SIZE) / STEP_SIZE) },
			(_, i) => i * STEP_SIZE
		);

		return velocityPoints.map((velocity) => {
			const dataPoint: Record<string, number> = { velocity };

			for (const stepper of steppers) {
				const maxCurrentAtSpecifiedPower = calculateMaxCurrentAtSpecifiedPower(maxPower, stepper);
				const driveCurrent = calculateDriveCurrent(driveSettings, stepper, maxCurrentAtSpecifiedPower);
				const torqueRotor = calculateTorqueRotor(gantrySettings, stepper);

				const rps = velocity / pulleyCircumferenceMm;
				const rawTorque = calculateSingleCoilTorque(
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

				const torque = Math.max(rawTorque - torqueRotor, 0);
				dataPoint[generateKey(stepper)] = torque;
			}

			return dataPoint;
		});
	}, [
		driveMode,
		steppers,
		driveSettings,
		gantrySettings,
		extruderSettings,
		maxPower,
		maxVelocity,
		effectiveMaxFlowRate,
		pulleyCircumferenceMm
	]);

	const chartConfig = useMemo(() => {
		const colors = [
			'#2563eb', // blue
			'#dc2626', // red
			'#16a34a', // green
			'#ca8a04', // yellow
			'#9333ea', // purple
			'#c2410c', // orange
			'#0891b2', // cyan
			'#be123c', // rose
			'#059669', // emerald
			'#7c3aed' // violet
		];

		return steppers.reduce(
			(acc, stepper, index) => {
				acc[generateKey(stepper)] = {
					label: `${stepper.brand} ${stepper.model}`,
					color: colors[index % colors.length]
				};
				return acc;
			},
			{} as Record<string, { label: string; color: string }>
		);
	}, [steppers]);

	const isExtruderMode = driveMode === 'extruder';
	const requiredTorque = calculateRequiredTorque(gantrySettings);
	const requiredForce = extruderSettings.manualRequiredForce ?? 0;
	const xAxisKey = isExtruderMode ? 'flowRate' : 'velocity';
	const yAxisUnit = isExtruderMode ? 'kgf' : 'Ncm';

	const displayToFlow =
		extruderUnit === 'linear' ? linearToFlow : extruderUnit === 'print' ? printSpeedToFlow : (v: number) => v;
	const extruderAxisTicks = isExtruderMode
		? generateEvenTicks(displayedMaxFlow, AXIS_TICK_COUNT).map(displayToFlow)
		: undefined;

	const formatXAxisValue = (value: number) =>
		isExtruderMode
			? extruderUnit === 'linear'
				? `${Math.round(flowToLinear(value))} mm/s`
				: extruderUnit === 'print'
					? `${Math.round(flowToPrintSpeed(value))} mm/s`
					: `${value} mm³/s`
			: unit === 'rpm'
				? `${Math.round(mmsToRpm(value))} RPM`
				: `${value} mm/s`;

	return (
		<Card className="pt-0">
			<CardHeader className="flex items-center gap-2 space-y-0 border-b py-5 sm:flex-row">
				<div className="grid flex-1 gap-1 min-w-fit">
					<CardTitle>{isExtruderMode ? 'Extrusion Force Graph' : 'Torque Graph'}</CardTitle>
				</div>
				<div className="flex items-center gap-2 flex-wrap justify-end">
					{isExtruderMode ? (
						<>
							{extruderUnit === 'print' && (
								<div className="flex flex-col gap-1.5">
									<div className="flex items-center gap-2">
										<Label htmlFor="extrusion-width" className="whitespace-nowrap">
											Line Width (mm)
										</Label>
										<Input
											id="extrusion-width"
											type="number"
											step={0.05}
											min={0.05}
											value={extrusionWidth}
											className="w-20"
											onChange={(e) => {
												const v = e.target.valueAsNumber;
												if (Number.isNaN(v) || v <= 0) return;
												setExtrusionWidth(v);
											}}
										/>
									</div>
									<div className="flex items-center gap-2">
										<Label htmlFor="layer-height" className="whitespace-nowrap">
											Layer Height (mm)
										</Label>
										<Input
											id="layer-height"
											type="number"
											step={0.05}
											min={0.05}
											value={layerHeight}
											className="w-20"
											onChange={(e) => {
												const v = e.target.valueAsNumber;
												if (Number.isNaN(v) || v <= 0) return;
												setLayerHeight(v);
											}}
										/>
									</div>
								</div>
							)}
							<ToggleGroup
								type="single"
								variant="outline"
								size="sm"
								value={extruderUnit}
								onValueChange={(value) => {
									if (value === 'volumetric' || value === 'linear' || value === 'print')
										setExtruderUnit(value);
								}}
							>
								<ToggleGroupItem value="volumetric">Flow</ToggleGroupItem>
								<ToggleGroupItem value="linear">Retraction Speed</ToggleGroupItem>
								<ToggleGroupItem value="print">Print Speed</ToggleGroupItem>
							</ToggleGroup>
							<Input
								type="number"
								value={Number.isFinite(displayedMaxFlow) ? Math.round(displayedMaxFlow) : 0}
								className="w-24"
								onChange={(e) => {
									const v = e.target.valueAsNumber;
									if (Number.isNaN(v)) return;
									if (extruderUnit === 'linear') setMaxFlowRate(linearToFlow(v));
									else if (extruderUnit === 'print') setMaxPrintSpeed(v);
									else setMaxFlowRate(v);
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
								onChange={(e) => {
									const v = e.target.valueAsNumber;
									if (Number.isNaN(v)) return;
									setMaxVelocity(unit === 'rpm' ? rpmToMms(v) : v);
								}}
							/>
						</>
					)}
					<span>
						{isExtruderMode
							? extruderUnit === 'linear' || extruderUnit === 'print'
								? 'mm/s'
								: 'mm³/s'
							: unit}
					</span>
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
									type="number"
									tickLine={false}
									axisLine={false}
									tickMargin={8}
									minTickGap={20}
									domain={isExtruderMode ? [0, effectiveMaxFlowRate] : undefined}
									ticks={extruderAxisTicks}
									tickFormatter={formatXAxisValue}
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
												const raw = payload?.[0]?.payload?.[xAxisKey] as number | undefined;
												return raw === undefined ? null : formatXAxisValue(raw);
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
									label={isExtruderMode ? 'Required Extrusion Force' : 'Required Torque'}
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
