import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartContainer, ChartLegend, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { Input } from '@/components/ui/input';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { chartColor } from '@/lib/chart-colors';
import {
	calculateBeltPitch,
	calculateDriveCurrent,
	calculateMaxCurrentAtSpecifiedPower,
	calculateRequiredTorque,
	calculateTorqueAtVelocity,
	calculateTorqueRotor
} from '@/lib/formulas';
import type { StepperDefinition } from '@/lib/stepper';
import { currentDriveSettingsAtom, currentGantrySettingsAtom, maxPowerAtom, steppersAtom } from '@/state/atoms';
import { useAtomValue } from 'jotai';
import { useMemo, useState } from 'react';
import { CartesianGrid, Line, LineChart, ReferenceLine, XAxis, YAxis } from 'recharts';

const STEP_SIZE = 20;
const DEFAULT_MAX_VELOCITY = 2000;

function generateKey(stepper: StepperDefinition) {
	return `${stepper.brand} ${stepper.model}`;
}

export function Graph() {
	const driveSettings = useAtomValue(currentDriveSettingsAtom);
	const gantrySettings = useAtomValue(currentGantrySettingsAtom);
	const maxPower = useAtomValue(maxPowerAtom);
	const [maxVelocity, setMaxVelocity] = useState(DEFAULT_MAX_VELOCITY);
	const [unit, setUnit] = useState<'mm/s' | 'rpm'>('mm/s');

	const steppers = useAtomValue(steppersAtom);
	const beltPitchMm = calculateBeltPitch(gantrySettings);
	const mmsToRpm = (mms: number) => (mms * 60) / beltPitchMm;
	const rpmToMms = (rpm: number) => (rpm * beltPitchMm) / 60;
	const displayedMax = unit === 'rpm' ? mmsToRpm(maxVelocity) : maxVelocity;

	const chartData = useMemo(() => {
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

				const rawTorque = calculateTorqueAtVelocity(
					driveSettings,
					gantrySettings,
					stepper,
					driveCurrent,
					velocity
				);

				const torque = Math.max(rawTorque - torqueRotor, 0);
				dataPoint[generateKey(stepper)] = torque;
			}

			return dataPoint;
		});
	}, [steppers, driveSettings, gantrySettings, maxPower, maxVelocity]);

	const chartConfig = useMemo(
		() =>
			steppers.reduce(
				(acc, stepper, index) => {
					acc[generateKey(stepper)] = {
						label: `${stepper.brand} ${stepper.model}`,
						color: chartColor(index)
					};
					return acc;
				},
				{} as Record<string, { label: string; color: string }>
			),
		[steppers]
	);

	const requiredTorque = calculateRequiredTorque(gantrySettings);

	return (
		<Card className="pt-0">
			<CardHeader className="flex items-center gap-2 space-y-0 border-b py-5 sm:flex-row">
				<div className="grid flex-1 gap-1">
					<CardTitle>Torque Graph</CardTitle>
				</div>
				<div className="flex items-center gap-2">
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
					<span>{unit}</span>
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
							<LineChart data={chartData} margin={{ top: 16, right: 12, bottom: 0, left: 0 }}>
								<CartesianGrid vertical={false} />
								<XAxis
									dataKey="velocity"
									tickLine={false}
									axisLine={false}
									tickMargin={8}
									minTickGap={20}
									tickFormatter={(value) =>
										unit === 'rpm' ? `${Math.round(mmsToRpm(value))} RPM` : `${value} mm/s`
									}
								/>
								<YAxis
									tickLine={false}
									axisLine={false}
									tickMargin={8}
									minTickGap={20}
									// Headroom so the required-torque line and its label never sit on the top edge
									domain={[
										0,
										(dataMax: number) => Math.ceil(Math.max(dataMax, requiredTorque) * 1.1)
									]}
									tickFormatter={(value) => `${value} Ncm`}
								/>
								<ChartTooltip
									cursor={false}
									content={
										<ChartTooltipContent
											labelFormatter={(_, payload) => {
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
														{typeof value === 'number' ? `${value.toFixed(2)} Ncm` : value}
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
								{/* Required torque above every curve is the interesting case, not one to hide:
								    extend the axis instead of clipping the line out of view */}
								<ReferenceLine
									y={requiredTorque}
									label="Required Torque"
									stroke="red"
									strokeDasharray="6 6"
									ifOverflow="extendDomain"
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
