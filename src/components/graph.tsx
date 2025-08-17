import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
	ChartContainer,
	ChartLegend,
	ChartTooltip,
	ChartTooltipContent
} from "@/components/ui/chart";
import { Input } from "@/components/ui/input";
import {
	calculateDriveCurrent,
	calculateMaxCurrentAtSpecifiedPower,
	calculateRequiredTorque,
	calculateSingleCoilTorque,
	calculateTorqueRotor,
} from "@/lib/formulas";
import {
	driveSettingsAtom,
	gantrySettingsAtom,
	maxPowerAtom,
	steppersAtom,
} from "@/state/atoms";
import { useAtomValue } from "jotai";
import { useMemo, useState } from "react";
import {
	CartesianGrid,
	Line,
	LineChart,
	ReferenceLine,
	XAxis,
	YAxis,
} from "recharts";

const STEP_SIZE = 20;
const DEFAULT_MAX_VELOCITY = 2000;

export function Graph() {
	const driveSettings = useAtomValue(driveSettingsAtom);
	const gantrySettings = useAtomValue(gantrySettingsAtom);
	const maxPower = useAtomValue(maxPowerAtom);
	const [maxVelocity, setMaxVelocity] = useState(DEFAULT_MAX_VELOCITY);

	const steppers = useAtomValue(steppersAtom);
	const chartData = useMemo(() => {
		const velocityPoints = Array.from(
			{ length: Math.floor((maxVelocity + STEP_SIZE) / STEP_SIZE) },
			(_, i) => i * STEP_SIZE,
		);

		return velocityPoints.map((velocity, i) => {
			const dataPoint: Record<string, number> = { velocity };

			for (const stepper of steppers) {
				const maxCurrentAtSpecifiedPower = calculateMaxCurrentAtSpecifiedPower(
					maxPower,
					stepper,
				);
				const driveCurrent = calculateDriveCurrent(
					driveSettings,
					stepper,
					maxCurrentAtSpecifiedPower,
				);
				const torqueRotor = calculateTorqueRotor(gantrySettings, stepper);

				const index = i * 0.5;
				const rawTorque = calculateSingleCoilTorque(
					stepper.stepAngle,
					stepper.ratedCurrent,
					stepper.torque,
					stepper.inductance,
					stepper.resistance,
					driveSettings.inputVoltage,
					driveCurrent,
					index,
				);

				const torque = Math.max(rawTorque - torqueRotor, 0);
				dataPoint[`${stepper.manufacturer}__${stepper.model}`] = torque;
			}

			return dataPoint;
		});
	}, [steppers, driveSettings, gantrySettings, maxPower, maxVelocity]);

	const chartConfig = useMemo(() => {
		const colors = [
			"#2563eb", // blue
			"#dc2626", // red
			"#16a34a", // green
			"#ca8a04", // yellow
			"#9333ea", // purple
			"#c2410c", // orange
			"#0891b2", // cyan
			"#be123c", // rose
			"#059669", // emerald
			"#7c3aed", // violet
		];

		return steppers.reduce(
			(acc, stepper, index) => {
				acc[`${stepper.manufacturer}__${stepper.model}`] = {
					label: `${stepper.manufacturer} ${stepper.model}`,
					color: colors[index % colors.length],
				};
				return acc;
			},
			{} as Record<string, { label: string; color: string }>,
		);
	}, [steppers]);

	const requiredTorque = calculateRequiredTorque(gantrySettings);

	return (
		<Card className="pt-0">
			<CardHeader className="flex items-center gap-2 space-y-0 border-b py-5 sm:flex-row">
				<div className="grid flex-1 gap-1">
					<CardTitle>Torque Graph</CardTitle>
				</div>
				<div className="flex items-center gap-2">
					<Input
						type="number"
						value={maxVelocity}
						className="w-24"
						onChange={(e) => {
							setMaxVelocity(e.target.valueAsNumber);
						}}
					/>
					<span>mm/s</span>
				</div>
			</CardHeader>
			<CardContent className="px-2 pt-4 sm:px-6 sm:pt-6">
				{chartData.length === 0 ? (
					<div>No data to display</div>
				) : steppers.length === 0 ? (
					<div>No steppers selected</div>
				) : (
					<div style={{ width: "100%", height: "400px" }}>
						<ChartContainer
							config={chartConfig}
							className="aspect-auto h-[400px] w-full"
						>
							<LineChart data={chartData}>
								<CartesianGrid vertical={false} />
								<XAxis
									dataKey="velocity"
									tickLine={false}
									axisLine={false}
									tickMargin={8}
									minTickGap={20}
									tickFormatter={(value) => `${value} mm/s`}
								/>
								<YAxis
									tickLine={false}
									axisLine={false}
									tickMargin={8}
									minTickGap={20}
									tickFormatter={(value) => `${value} Ncm`}
								/>
								<ChartTooltip
									cursor={false}
									content={
										<ChartTooltipContent
											hideLabel
											formatter={(value, name) => (
												<>
													<div
														className="h-2.5 w-2.5 shrink-0 rounded-[2px] bg-[var(--color-bg)]"
														style={
															{
																"--color-bg":
																	chartConfig[name as keyof typeof chartConfig]
																		?.color || "#666",
															} as React.CSSProperties
														}
													/>
													{chartConfig[name as keyof typeof chartConfig]
														?.label || name}

													<div className="ml-auto flex items-baseline gap-0.5 font-mono font-medium tabular-nums text-foreground">
														{typeof value === "number"
															? `${value.toFixed(2)} Ncm`
															: value}
													</div>
												</>
											)}
										/>
									}
								/>
								{steppers.map((stepper) => {
									const key = `${stepper.manufacturer}__${stepper.model}`;
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
									y={requiredTorque}
									label="Required Torque"
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
