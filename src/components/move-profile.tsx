import { ChartContainer, ChartLegend, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { timeOptimalVelocityAt, velocityAtDistance } from '@/lib/motion';
import type { MoveRecommendation } from '@/lib/recommender';
import { useMemo } from 'react';
import { CartesianGrid, Line, LineChart, XAxis, YAxis } from 'recharts';

const SAMPLES = 200;

/** The dashed floor rides alongside its stepper's own line, under a key that cannot collide with one */
export const floorKey = (key: string) => `floor:${key}`;

export type ChartConfig = Record<string, { label: string; color: string }>;

/**
 * The recommended move drawn out: velocity against distance travelled.
 *
 * Distance rather than time on the X axis, so every stepper's line spans the same range and the
 * ramps line up. The move enters and leaves at the junction velocity, so the curve starts and ends
 * above zero unless the corner is a full reversal.
 */
export function MoveProfileChart({
	recommendations,
	chartConfig,
	pathLength
}: {
	recommendations: { key: string; recommendation: MoveRecommendation }[];
	chartConfig: ChartConfig;
	pathLength: number;
}) {
	const chartData = useMemo(
		() =>
			Array.from({ length: SAMPLES + 1 }, (_, i) => {
				const distance = (pathLength * i) / SAMPLES;
				const point: Record<string, number> = { distance };

				for (const { key, recommendation } of recommendations) {
					point[key] = velocityAtDistance(recommendation.profile, distance);
					if (recommendation.timeOptimal) {
						point[floorKey(key)] = timeOptimalVelocityAt(recommendation.timeOptimal, pathLength, distance);
					}
				}

				return point;
			}),
		[recommendations, pathLength]
	);

	if (recommendations.length === 0) return null;

	return (
		<div style={{ width: '100%', height: '260px' }}>
			<ChartContainer config={chartConfig} className="aspect-auto h-[260px] w-full">
				<LineChart data={chartData}>
					<CartesianGrid vertical={false} />
					<XAxis
						dataKey="distance"
						type="number"
						domain={[0, pathLength]}
						tickLine={false}
						axisLine={false}
						tickMargin={8}
						minTickGap={20}
						tickFormatter={(value) => `${Math.round(value)} mm`}
					/>
					<YAxis
						tickLine={false}
						axisLine={false}
						tickMargin={8}
						minTickGap={20}
						tickFormatter={(value) => `${Math.round(value)}`}
					/>
					<ChartTooltip
						cursor={false}
						content={
							<ChartTooltipContent
								labelFormatter={(_, payload) => {
									const distance = payload?.[0]?.payload?.distance;
									return typeof distance === 'number' ? `${distance.toFixed(1)} mm in` : null;
								}}
								formatter={(value, name) => (
									<>
										<div
											className="h-2.5 w-2.5 shrink-0 rounded-[2px] bg-[var(--color-bg)]"
											style={
												{
													'--color-bg': chartConfig[name as string]?.color || '#666'
												} as React.CSSProperties
											}
										/>
										{chartConfig[name as string]?.label || name}
										<div className="ml-auto flex items-baseline gap-0.5 font-mono font-medium tabular-nums text-foreground">
											{typeof value === 'number' ? `${value.toFixed(0)} mm/s` : value}
										</div>
									</>
								)}
							/>
						}
					/>
					{recommendations.map(({ key }) => (
						<Line
							key={key}
							dataKey={key}
							type="linear"
							dot={false}
							stroke={chartConfig[key]?.color}
							strokeWidth={2}
						/>
					))}
					{/* Kept out of the legend: it is the same motor, not another one */}
					{recommendations
						.filter(({ recommendation }) => recommendation.timeOptimal)
						.map(({ key }) => (
							<Line
								key={floorKey(key)}
								dataKey={floorKey(key)}
								type="linear"
								dot={false}
								stroke={chartConfig[key]?.color}
								strokeWidth={1.5}
								strokeDasharray="5 5"
								strokeOpacity={0.7}
								legendType="none"
							/>
						))}
					<ChartLegend />
				</LineChart>
			</ChartContainer>
		</div>
	);
}
