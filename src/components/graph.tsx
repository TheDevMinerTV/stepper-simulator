import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { NumberInput } from '@/components/ui/number-input';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { calculateRequiredTorque } from '@/lib/formulas';
import {
	autoMaxVelocity,
	buildTorqueCurve,
	stepperSeriesKey as generateKey,
	stepperSeriesColor
} from '@/lib/torque-curve';
import { usePanZoom } from '@/lib/use-pan-zoom';
import { currentDriveSettingsAtom, currentGantrySettingsAtom, maxPowerAtom, steppersAtom } from '@/state/atoms';
import { useAtomValue } from 'jotai';
import { GrabIcon, SearchIcon } from 'lucide-react';
import { useMemo, useState, type ReactNode } from 'react';
import { CartesianGrid, Line, LineChart, ReferenceLine, XAxis, YAxis } from 'recharts';

const Y_AXIS_HEADROOM = 1.05;

function VisibleSeriesTooltip({
	yBounds,
	...props
}: React.ComponentProps<typeof ChartTooltipContent> & { yBounds: [number, number] }) {
	const payload = props.payload?.filter(
		(item) => typeof item.value === 'number' && item.value >= yBounds[0] && item.value <= yBounds[1]
	);

	if (!payload?.length) return null;

	return <ChartTooltipContent {...props} payload={payload} />;
}

export function Graph() {
	const driveSettings = useAtomValue(currentDriveSettingsAtom);
	const gantrySettings = useAtomValue(currentGantrySettingsAtom);
	const maxPower = useAtomValue(maxPowerAtom);
	// `null` until the field is edited: the range follows the selection on its own, but a typed
	// value is never overwritten by it
	const [manualMaxVelocity, setManualMaxVelocity] = useState<number | null>(null);
	const [unit, setUnit] = useState<'mm/s' | 'rpm'>('mm/s');

	const steppers = useAtomValue(steppersAtom);
	const pulleyCircumferenceMm = gantrySettings.pulleyTeeth * gantrySettings.toothPitch;
	const mmsToRpm = (mms: number) => (mms * 60) / pulleyCircumferenceMm;
	const rpmToMms = (rpm: number) => (rpm * pulleyCircumferenceMm) / 60;

	const requiredTorque = calculateRequiredTorque(gantrySettings);
	const fittedMaxVelocity = useMemo(
		() => autoMaxVelocity({ steppers, driveSettings, gantrySettings, maxPower, requiredTorque }),
		[steppers, driveSettings, gantrySettings, maxPower, requiredTorque]
	);
	const maxVelocity = manualMaxVelocity ?? fittedMaxVelocity;
	const displayedMax = unit === 'rpm' ? mmsToRpm(maxVelocity) : maxVelocity;

	const chartData = useMemo(
		() => buildTorqueCurve({ steppers, driveSettings, gantrySettings, maxPower, maxVelocity }),
		[steppers, driveSettings, gantrySettings, maxPower, maxVelocity]
	);

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

	const baseBounds = useMemo(() => {
		const keys = steppers.map(generateKey);
		const peak = chartData.reduce(
			(max, point) => keys.reduce((inner, key) => Math.max(inner, point[key] ?? 0), max),
			Number.isFinite(requiredTorque) ? Math.max(requiredTorque, 0) : 0
		);

		return {
			x: [0, maxVelocity] as [number, number],
			y: [0, Math.max(peak * Y_AXIS_HEADROOM, 1)] as [number, number]
		};
	}, [chartData, steppers, requiredTorque, maxVelocity]);

	const { bounds, zoomed, panning, reset, handlers } = usePanZoom(baseBounds);

	return (
		<Card className="pt-0">
			<CardHeader className="flex items-center gap-2 space-y-0 border-b py-5 sm:flex-row">
				<div className="grid flex-1 gap-1">
					<CardTitle>Torque Graph</CardTitle>
				</div>
				<div className="flex items-center gap-2">
					{zoomed && (
						<Button variant="outline" size="sm" onClick={reset}>
							Reset view
						</Button>
					)}
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
					<NumberInput
						value={Number.isFinite(displayedMax) ? Math.round(displayedMax) : 0}
						className="w-24"
						step={100}
						onValueChange={(v) =>
							setManualMaxVelocity(unit === 'rpm' ? rpmToMms(v as number) : (v as number))
						}
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
					<div className="flex flex-col gap-2">
						<div
							{...handlers}
							className={`touch-none select-none ${panning ? 'cursor-grabbing' : 'cursor-grab'}`}
						>
							<ChartContainer config={chartConfig} className="aspect-auto h-100 w-full">
								<LineChart data={chartData}>
									<CartesianGrid vertical={false} />
									<XAxis
										dataKey="velocity"
										type="number"
										domain={bounds.x}
										allowDataOverflow
										tickLine={false}
										axisLine={false}
										tickMargin={8}
										minTickGap={20}
										tickFormatter={(value) =>
											unit === 'rpm'
												? `${Math.round(mmsToRpm(value))} RPM`
												: `${Math.round(value)} mm/s`
										}
									/>
									<YAxis
										type="number"
										domain={bounds.y}
										allowDataOverflow
										tickLine={false}
										axisLine={false}
										tickMargin={8}
										minTickGap={20}
										tickFormatter={(value) => `${Math.round(value)} Ncm`}
									/>
									<ChartTooltip
										cursor={false}
										content={
											<VisibleSeriesTooltip
												yBounds={bounds.y}
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
															className="h-2.5 w-2.5 shrink-0 rounded-[2px] bg-(--color-bg)"
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
																? `${value.toFixed(2)} Ncm`
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
												isAnimationActive={false}
												stroke={chartConfig[key]?.color}
												strokeWidth={2}
											/>
										);
									})}
									<ReferenceLine
										y={requiredTorque}
										label="Required Torque"
										stroke="red"
										strokeDasharray="6 6"
									/>
								</LineChart>
							</ChartContainer>
						</div>

						<div className="flex max-h-24 flex-wrap items-center justify-center gap-x-4 gap-y-1 overflow-y-auto text-xs">
							{steppers.map((stepper) => {
								const key = generateKey(stepper);
								return (
									<div key={key} className="flex items-center gap-1.5">
										<div
											className="h-2 w-2 shrink-0 rounded-[2px]"
											style={{ backgroundColor: chartConfig[key]?.color }}
										/>
										{chartConfig[key]?.label}
									</div>
								);
							})}
						</div>

						<p className="text-center text-xs text-muted-foreground flex items-center justify-center gap-3">
							<span className="flex items-center gap-1">
								<GrabIcon className="h-4 w-4" />
								Drag to pan
							</span>
							<span className="flex items-center gap-1">
								<SearchIcon className="h-4 w-4" />
								Scroll to zoom
							</span>
							<span>
								<Kbd>Shift</Kbd> + Scroll to zoom X
							</span>
							<span>
								<Kbd>Alt</Kbd> + Scroll to zoom Y
							</span>
						</p>
					</div>
				)}
			</CardContent>
		</Card>
	);
}

function Kbd({ children }: { children: ReactNode }) {
	return <kbd className="px-1 py-1 border-border border rounded">{children}</kbd>;
}
