import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartContainer, ChartLegend, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { Button } from '@/components/ui/button';
import { saveChartImage } from '@/lib/chart-export';
import { calculateFilamentCrossSectionArea, calculateRequiredTorque } from '@/lib/formulas';
import { DEFAULT_MAX_FLOW_RATE, autoMaxFlowRate, buildExtruderCurve } from '@/lib/extruder-curve';
import {
	DEFAULT_MAX_VELOCITY,
	autoMaxVelocity,
	buildTorqueCurve,
	seriesCrossing,
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
import { SaveIcon } from 'lucide-react';
import { useMemo, useRef, useState } from 'react';
import { CartesianGrid, Line, LineChart, ReferenceLine, XAxis, YAxis, type TooltipProps } from 'recharts';

const DEFAULT_EXTRUSION_WIDTH = 0.4;
const DEFAULT_LAYER_HEIGHT = 0.2;
const AXIS_TICK_COUNT = 6;

/**
 * Axis lines and grid share one grey, so the frame reads as a single system.
 *
 * The colour arrives as `currentColor` off a Tailwind class rather than a `var()` in the `stroke`
 * attribute: `var()` is only dependable in a CSS property, not in a presentation attribute. Naming
 * a stroke at all is also what opts these lines out of `ChartContainer`'s `stroke-border/50` rule,
 * which is keyed on recharts' default `stroke="#ccc"` and is too faint to read on a dark ground.
 */
const AXIS_LINE = { stroke: 'currentColor', className: 'text-border' } as const;

/** The verticals are a reading aid, not part of the frame, so they sit back from the solid lines */
const GRID_LINE_OPACITY = 0.5;

/** Width of the invisible band that makes a curve clickable, in pixels */
const CLICK_TARGET_WIDTH = 16;

/** Crossings closer together than this fraction of the axis get their labels stacked */
const CROSSING_LABEL_MIN_GAP = 0.06;
/** Vertical step between stacked crossing labels, in pixels */
const CROSSING_LABEL_STEP = 14;

type GridLineProps = { x1: number; y1: number; x2: number; y2: number; key?: string };

/**
 * recharts only renders the first `CartesianGrid` child, so the dashed verticals cannot be a
 * second grid laid over the solid horizontals; they are a custom line renderer on the one grid.
 *
 * The grid's own props are spread onto the lines recharts draws itself, but a custom renderer is
 * handed only geometry — so the colour has to be restated here or `currentColor` falls through to
 * the inherited foreground and the lines come out white.
 */
function dashedGridLine({ x1, y1, x2, y2, key }: GridLineProps) {
	return (
		<line
			key={key}
			className="text-border"
			x1={x1}
			y1={y1}
			x2={x2}
			y2={y2}
			stroke="currentColor"
			strokeOpacity={GRID_LINE_OPACITY}
			strokeDasharray="4 4"
		/>
	);
}

/**
 * Which series a legend entry stands for. The lines carry no `name`, so recharts fills `value`
 * with the dataKey; `dataKey` itself is still preferred when it is there.
 */
function legendKey(entry: { dataKey?: string | number | ((item: unknown) => unknown); value?: unknown }): string {
	return String(typeof entry?.dataKey === 'string' ? entry.dataKey : (entry?.value ?? ''));
}

// Evenly spaced ticks in display units, always including 0 and the exact max
// (rather than relying on the chart's auto-picked "nice" values in the raw
// data domain, which drift when the unit conversion factor changes).
function generateEvenTicks(max: number, count: number) {
	if (!Number.isFinite(max) || max <= 0) return [0];
	return Array.from({ length: count }, (_, i) => Math.round((max * i) / (count - 1)));
}

export function Graph() {
	const driveMode = useAtomValue(currentDriveModeAtom);
	const driveSettings = useAtomValue(currentDriveSettingsAtom);
	const gantrySettings = useAtomValue(currentGantrySettingsAtom);
	const extruderSettings = useAtomValue(currentExtruderSettingsAtom);
	const maxPower = useAtomValue(maxPowerAtom);
	// `null` until the field is edited: the range follows the selection on its own, but a typed
	// value is never overwritten by it
	const [manualMaxVelocity, setManualMaxVelocity] = useState<number | null>(null);
	const [manualMaxFlowRate, setManualMaxFlowRate] = useState<number | null>(null);
	const [manualMaxPrintSpeed, setManualMaxPrintSpeed] = useState<number | null>(null);
	const [unit, setUnit] = useState<'mm/s' | 'rpm'>('mm/s');
	const [extruderUnit, setExtruderUnit] = useState<'volumetric' | 'linear' | 'print'>('volumetric');
	const [extrusionWidth, setExtrusionWidth] = useState(DEFAULT_EXTRUSION_WIDTH);
	const [layerHeight, setLayerHeight] = useState(DEFAULT_LAYER_HEIGHT);

	const chartRef = useRef<HTMLDivElement>(null);
	const steppers = useAtomValue(steppersAtom);
	const isExtruderMode = driveMode === 'extruder';
	const pulleyCircumferenceMm = gantrySettings.pulleyTeeth * gantrySettings.toothPitch;
	const mmsToRpm = (mms: number) => (mms * 60) / pulleyCircumferenceMm;
	const rpmToMms = (rpm: number) => (rpm * pulleyCircumferenceMm) / 60;

	const requiredTorque = calculateRequiredTorque(gantrySettings);
	const requiredForce = extruderSettings.manualRequiredForce ?? 0;

	// Each mode only fits the axis it actually draws; the other value is inert
	const fittedMaxVelocity = useMemo(
		() =>
			isExtruderMode
				? DEFAULT_MAX_VELOCITY
				: autoMaxVelocity({ steppers, driveSettings, gantrySettings, maxPower, requiredTorque }),
		[isExtruderMode, steppers, driveSettings, gantrySettings, maxPower, requiredTorque]
	);
	const fittedMaxFlowRate = useMemo(
		() =>
			isExtruderMode
				? autoMaxFlowRate({ steppers, driveSettings, extruderSettings, maxPower, requiredForce })
				: DEFAULT_MAX_FLOW_RATE,
		[isExtruderMode, steppers, driveSettings, extruderSettings, maxPower, requiredForce]
	);
	const maxVelocity = manualMaxVelocity ?? fittedMaxVelocity;
	const displayedMax = unit === 'rpm' ? mmsToRpm(maxVelocity) : maxVelocity;

	const filamentCrossSectionArea = calculateFilamentCrossSectionArea();
	const flowToLinear = (flow: number) => flow / filamentCrossSectionArea;
	const linearToFlow = (linear: number) => linear * filamentCrossSectionArea;
	const printLineCrossSectionArea = extrusionWidth * layerHeight;
	const flowToPrintSpeed = (flow: number) => flow / printLineCrossSectionArea;
	const printSpeedToFlow = (printSpeed: number) => printSpeed * printLineCrossSectionArea;

	const maxFlowRate = manualMaxFlowRate ?? fittedMaxFlowRate;
	// Once a print speed has been typed it becomes the canonical axis bound, so the displayed max
	// stays put and the curves shift against it as line width/height change. Until then the fitted
	// flow range is canonical and it is the axis that gets restated in the new units.
	const maxPrintSpeed = manualMaxPrintSpeed ?? flowToPrintSpeed(fittedMaxFlowRate);
	const effectiveMaxFlowRate = extruderUnit === 'print' ? printSpeedToFlow(maxPrintSpeed) : maxFlowRate;
	const displayedMaxFlow =
		extruderUnit === 'linear' ? flowToLinear(maxFlowRate) : extruderUnit === 'print' ? maxPrintSpeed : maxFlowRate;

	const chartData = useMemo(() => {
		if (isExtruderMode) {
			return buildExtruderCurve({
				steppers,
				driveSettings,
				extruderSettings,
				maxPower,
				maxFlowRate: effectiveMaxFlowRate
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
		effectiveMaxFlowRate
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

	const xAxisKey = isExtruderMode ? 'flowRate' : 'velocity';
	const yAxisUnit = isExtruderMode ? 'kgf' : 'Ncm';

	const displayToFlow =
		extruderUnit === 'linear' ? linearToFlow : extruderUnit === 'print' ? printSpeedToFlow : (v: number) => v;

	// Both axes state their own bounds and ticks. Left to itself a numeric axis rounds the range
	// out to the next tick it likes, which strands the end of every curve short of the right edge
	const xAxisMax = isExtruderMode ? effectiveMaxFlowRate : maxVelocity;
	const xAxisTicks = isExtruderMode
		? generateEvenTicks(displayedMaxFlow, AXIS_TICK_COUNT).map(displayToFlow)
		: generateEvenTicks(maxVelocity, AXIS_TICK_COUNT);

	// Series switched off by clicking their line or legend entry. They keep their place in the
	// legend and their colour there, so the chart still says what has been set aside
	const [hiddenSeries, setHiddenSeries] = useState<ReadonlySet<string>>(() => new Set());
	const toggleSeries = (key: string) =>
		setHiddenSeries((previous) => {
			const next = new Set(previous);
			if (!next.delete(key)) next.add(key);

			return next;
		});

	// Each motor's crossing of the requirement, to be marked on the axis. A motor that never
	// crosses has nothing to mark: it is either short of the line already or still above it at
	// the end of the range.
	const requiredValue = isExtruderMode ? requiredForce : requiredTorque;
	const axisMax = isExtruderMode ? effectiveMaxFlowRate : maxVelocity;
	const crossings = useMemo(() => {
		if (!Number.isFinite(requiredValue) || requiredValue <= 0) return [];

		const found = steppers.flatMap((stepper) => {
			const key = generateKey(stepper);
			const x = seriesCrossing(chartData, xAxisKey, key, requiredValue);

			return x === null ? [] : [{ key, x, color: chartConfig[key]?.color ?? '#666', level: 0 }];
		});

		// Motors often give up within a hair of each other, which prints their labels on top of
		// one another. Anything landing too close to its neighbour is stacked above it instead.
		found.sort((a, b) => a.x - b.x);
		let previousX = Number.NEGATIVE_INFINITY;
		let level = 0;
		for (const crossing of found) {
			level = crossing.x - previousX < axisMax * CROSSING_LABEL_MIN_GAP ? level + 1 : 0;
			crossing.level = level;
			previousX = crossing.x;
		}

		return found;
	}, [steppers, chartData, xAxisKey, requiredValue, chartConfig, axisMax]);

	/** A stub off the axis rather than a full-height rule, which would crowd the plot */
	const crossingTickHeight = useMemo(() => {
		const peak = chartData.reduce((highest, point) => {
			for (const stepper of steppers) {
				const value = point[generateKey(stepper)];
				if (typeof value === 'number' && value > highest) highest = value;
			}

			return highest;
		}, 0);

		return peak * 0.06;
	}, [chartData, steppers]);

	const [saveError, setSaveError] = useState<string | null>(null);

	async function saveGraph() {
		const container = chartRef.current;
		const svg = container?.querySelector('svg');
		if (!container || !svg) return;

		// Read the theme off the live card rather than assuming one, so a saved image looks like
		// what was on screen in either light or dark
		const card = container.closest('[data-slot="card"]') ?? container;
		const background = window.getComputedStyle(card).backgroundColor;

		try {
			setSaveError(null);
			await saveChartImage({
				svg,
				series: steppers.map((stepper) => {
					const key = generateKey(stepper);
					return { label: chartConfig[key]?.label ?? key, color: chartConfig[key]?.color ?? '#666' };
				}),
				background,
				foreground: window.getComputedStyle(container).color || '#000000',
				filename: isExtruderMode ? 'extrusion-force-graph' : 'torque-graph'
			});
		} catch (error) {
			setSaveError(error instanceof Error ? error.message : 'the image could not be saved');
		}
	}

	/** The x value in whatever units the axis is currently showing, bare of them */
	const toDisplayedX = (value: number) =>
		isExtruderMode
			? extruderUnit === 'linear'
				? flowToLinear(value)
				: extruderUnit === 'print'
					? flowToPrintSpeed(value)
					: value
			: unit === 'rpm'
				? mmsToRpm(value)
				: value;

	const formatXAxisValue = (value: number) => {
		const displayed = Math.round(toDisplayedX(value));
		if (isExtruderMode) return extruderUnit === 'volumetric' ? `${displayed} mm³/s` : `${displayed} mm/s`;

		return unit === 'rpm' ? `${displayed} RPM` : `${displayed} mm/s`;
	};

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
										<Label htmlFor="extrusion-width" className="whitespace-nowrap text-xs">
											Line Width (mm)
										</Label>
										<Input
											id="extrusion-width"
											type="number"
											step={0.05}
											min={0.05}
											value={extrusionWidth}
											className="w-16"
											onChange={(e) => {
												const v = e.target.valueAsNumber;
												if (Number.isNaN(v) || v <= 0) return;
												setExtrusionWidth(v);
											}}
										/>
									</div>
									<div className="flex items-center gap-2">
										<Label htmlFor="layer-height" className="whitespace-nowrap text-xs">
											Layer Height (mm)
										</Label>
										<Input
											id="layer-height"
											type="number"
											step={0.05}
											min={0.05}
											value={layerHeight}
											className="w-16"
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
								<ToggleGroupItem value="volumetric" className="text-xs">
									Flow
								</ToggleGroupItem>
								<ToggleGroupItem value="linear" className="text-xs">
									Retraction Speed
								</ToggleGroupItem>
								<ToggleGroupItem value="print" className="text-xs">
									Print Speed
								</ToggleGroupItem>
							</ToggleGroup>
							<Input
								type="number"
								value={Number.isFinite(displayedMaxFlow) ? Math.round(displayedMaxFlow) : 0}
								className="w-18"
								onChange={(e) => {
									const v = e.target.valueAsNumber;
									if (Number.isNaN(v)) return;
									if (extruderUnit === 'linear') setManualMaxFlowRate(linearToFlow(v));
									else if (extruderUnit === 'print') setManualMaxPrintSpeed(v);
									else setManualMaxFlowRate(v);
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
					<span>
						{isExtruderMode
							? extruderUnit === 'linear' || extruderUnit === 'print'
								? 'mm/s'
								: 'mm³/s'
							: unit}
					</span>
					<Button
						type="button"
						variant="outline"
						size="icon"
						onClick={saveGraph}
						title="Save graph as an image"
						aria-label="Save graph as an image"
					>
						<SaveIcon />
					</Button>
				</div>
				{saveError && <p className="text-destructive w-full text-right text-xs">Could not save: {saveError}</p>}
			</CardHeader>
			<CardContent className="pt-0">
				{chartData.length === 0 ? (
					<div>No data to display</div>
				) : steppers.length === 0 ? (
					<div>No steppers selected</div>
				) : (
					<div ref={chartRef} style={{ width: '100%', height: '400px' }}>
						<ChartContainer config={chartConfig} className="aspect-auto h-[400px] w-full">
							<LineChart data={chartData}>
								<CartesianGrid
									className="text-border"
									stroke="currentColor"
									vertical={dashedGridLine}
								/>
								<XAxis
									dataKey={xAxisKey}
									type="number"
									tickLine={false}
									axisLine={AXIS_LINE}
									tickMargin={8}
									minTickGap={20}
									domain={[0, xAxisMax]}
									ticks={xAxisTicks}
									tickFormatter={formatXAxisValue}
								/>
								<YAxis
									tickLine={false}
									axisLine={AXIS_LINE}
									tickMargin={8}
									minTickGap={20}
									tickFormatter={(value) => `${value} ${yAxisUnit}`}
								/>
								<ChartTooltip
									cursor={false}
									// The payload is filtered here rather than left to each line's
									// `tooltipType`, which recharts does not honour: every curve has an
									// invisible twin carrying its hit area, so without this each motor is
									// listed twice. Switched-off series are dropped on the way through too.
									content={(props: TooltipProps<number, string>) => {
										const seen = new Set<string>();
										const payload = (props.payload ?? []).filter((entry) => {
											const key = String(entry.dataKey ?? '');
											if (hiddenSeries.has(key) || seen.has(key)) return false;

											seen.add(key);
											return true;
										});

										return (
											<ChartTooltipContent
												// `ChartTooltipContent` mixes recharts' tooltip props with a
												// div's, and the two disagree on what `content` is; the cast
												// settles that rather than either type being wrong
												{...(props as React.ComponentProps<typeof ChartTooltipContent>)}
												payload={payload}
												labelFormatter={() => {
													const raw = payload[0]?.payload?.[xAxisKey] as number | undefined;
													if (raw === undefined) return null;
													if (isExtruderMode) return formatXAxisValue(raw);

													// Gantry mode shows both units at once, so the reading
													// is useful whichever one the axis is currently in
													const mms = `${Math.round(raw)} mm/s`;
													const rpmValue = mmsToRpm(raw);
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
										);
									}}
								/>
								{steppers.map((stepper) => {
									const key = generateKey(stepper);
									const hidden = hiddenSeries.has(key);

									return (
										<Line
											key={key}
											dataKey={key}
											type="monotone"
											dot={false}
											// A switched-off curve is out of the hover entirely: no marker riding an
											// invisible line, and the tooltip drops its row too (see the filter
											// on `ChartTooltip`). `true` is spelled out rather than left as
											// `undefined`: relying on the default that way turned the marker off
											// for every series, not only the hidden ones.
											activeDot={hidden ? false : true}
											// `stroke` stays put while only its opacity changes, so the legend —
											// which takes its colour from this prop — keeps saying which motor
											// the entry belongs to after the curve is switched off
											stroke={chartConfig[key]?.color}
											strokeOpacity={hidden ? 0 : 1}
											strokeWidth={2}
											style={{ pointerEvents: 'none' }}
										/>
									);
								})}
								{/*
								 * A 2px stroke is far too fine to click, so each curve gets an invisible
								 * companion carrying the hit area and the handler. `pointer-events: stroke`
								 * makes the whole band clickable despite there being nothing to see, and
								 * keeping the handler solely here means one click is one toggle.
								 *
								 * These share their curve's `dataKey`, so they would otherwise double every
								 * entry in the tooltip; `ChartTooltip` filters them back out.
								 */}
								{steppers.map((stepper) => {
									const key = generateKey(stepper);
									const hidden = hiddenSeries.has(key);

									return (
										<Line
											key={`${key}-hit`}
											dataKey={key}
											type="monotone"
											dot={false}
											activeDot={false}
											stroke="transparent"
											strokeWidth={CLICK_TARGET_WIDTH}
											legendType="none"
											isAnimationActive={false}
											onClick={() => toggleSeries(key)}
											style={{ cursor: 'pointer', pointerEvents: hidden ? 'none' : 'stroke' }}
										/>
									);
								})}
								<ReferenceLine
									y={isExtruderMode ? requiredForce : requiredTorque}
									label={isExtruderMode ? 'Required Extrusion Force' : 'Required Torque'}
									stroke="red"
									strokeDasharray="6 6"
								/>
								{/* Where each motor gives up, marked on the axis in that motor's own colour */}
								{crossings
									.filter(({ key }) => !hiddenSeries.has(key))
									.map(({ key, x, color, level }) => (
										<ReferenceLine
											key={`${key}-crossing`}
											segment={[
												{ x, y: 0 },
												{ x, y: crossingTickHeight }
											]}
											stroke={color}
											strokeWidth={2}
											// Bare number: the axis right below it already names the unit
											label={{
												value: String(Math.round(toDisplayedX(x))),
												position: 'top',
												offset: 6 + level * CROSSING_LABEL_STEP,
												fill: color,
												fontSize: 11
											}}
										/>
									))}

								<ChartLegend
									onClick={(entry) => toggleSeries(legendKey(entry))}
									formatter={(value, entry) => {
										const hidden = hiddenSeries.has(legendKey(entry));

										return (
											<Tooltip>
												<TooltipTrigger asChild>
													<span className="cursor-pointer" style={{ opacity: hidden ? 0.4 : 1 }}>
														{value}
													</span>
												</TooltipTrigger>
												{/* Naming the direction beats "show/hide" when the state is
												    already known */}
												<TooltipContent>{hidden ? 'Click to show' : 'Click to hide'}</TooltipContent>
											</Tooltip>
										);
									}}
								/>
							</LineChart>
						</ChartContainer>
					</div>
				)}
			</CardContent>
		</Card>
	);
}
