import { renderToStaticMarkup } from 'react-dom/server';
import { CartesianGrid, Line, LineChart, ReferenceLine, XAxis, YAxis } from 'recharts';
import { formatNumber, type OgModel } from './model';

/**
 * Draws the OG card as a single SVG document.
 *
 * The plot itself is real recharts, rendered with `renderToStaticMarkup` at a fixed size, so the
 * curve geometry cannot drift from the in-app graph. Everything around it (title, subtitle,
 * legend) is hand-written SVG: recharts' own `<Legend>` renders HTML, which does not survive
 * being pulled out of the wrapper, and rasterizers have no CSS engine anyway.
 *
 * Consequences of "no CSS engine": every colour, font size and font family has to be an
 * attribute. Nothing here may rely on Tailwind classes or CSS variables.
 */

export const OG_WIDTH = 1200;
export const OG_HEIGHT = 630;

const COLORS = {
	background: '#09090b',
	foreground: '#fafafa',
	muted: '#a1a1aa',
	dim: '#71717a',
	/** Axis lines and grid share one grey, so the frame reads as a single system */
	grid: '#3f3f46',
	required: '#f87171'
};

const FONT_FAMILY = 'sans-serif';

const PADDING_X = 48;
const CHART_TOP = 132;
const LEGEND_ROW_HEIGHT = 32;
const LEGEND_FONT_SIZE = 20;
const LEGEND_COLUMNS = 2;
const BOTTOM_PADDING = 40;

/**
 * Nothing here can measure text: there is no DOM, and the rasterizer only sees the finished SVG.
 * These ratios are eyeballed for a sans-serif at the sizes used above, and only guard against
 * overflow, so being a few percent off is harmless.
 */
function estimateTextWidth(value: string, size: number, bold = false): number {
	return value.length * size * (bold ? 0.58 : 0.52);
}

function fitText(value: string, size: number, maxWidth: number, bold = false): string {
	if (estimateTextWidth(value, size, bold) <= maxWidth) return value;

	const maxChars = Math.max(1, Math.floor(maxWidth / (size * (bold ? 0.58 : 0.52))) - 1);
	return `${value.slice(0, maxChars)}…`;
}

function escapeXml(value: string): string {
	return value
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
		.replace(/"/g, '&quot;')
		.replace(/'/g, '&apos;');
}

function text(
	value: string,
	{
		x,
		y,
		size,
		fill,
		weight = 'normal',
		anchor = 'start'
	}: { x: number; y: number; size: number; fill: string; weight?: string; anchor?: 'start' | 'middle' | 'end' }
): string {
	return `<text x="${x}" y="${y}" font-family="${FONT_FAMILY}" font-size="${size}" font-weight="${weight}" fill="${fill}" text-anchor="${anchor}">${escapeXml(value)}</text>`;
}

/** The verticals are a reading aid, not part of the frame, so they sit back from the solid lines */
const GRID_LINE_OPACITY = 0.5;

type GridLineProps = { x1: number; y1: number; x2: number; y2: number; key?: string };

/**
 * recharts only renders the first `CartesianGrid` child, so the dashed verticals cannot be a
 * second grid laid over the solid horizontals; they are a custom line renderer on the one grid.
 */
function dashedGridLine({ x1, y1, x2, y2, key }: GridLineProps) {
	return (
		<line
			key={key}
			x1={x1}
			y1={y1}
			x2={x2}
			y2={y2}
			stroke={COLORS.grid}
			strokeOpacity={GRID_LINE_OPACITY}
			strokeDasharray="4 4"
		/>
	);
}

/** Crossings closer together than this fraction of the axis get their labels stacked */
const CROSSING_LABEL_MIN_GAP = 0.06;
/** Vertical step between stacked crossing labels, in pixels */
const CROSSING_LABEL_STEP = 22;

/**
 * How many labels each crossing has to clear. Motors often give up within a hair of each other,
 * which would print their numbers on top of one another.
 */
function crossingLevels(model: OgModel): Map<string, number> {
	const ordered = model.series
		.filter((series): series is typeof series & { crossing: number } => series.crossing !== null)
		.sort((a, b) => a.crossing - b.crossing);

	const levels = new Map<string, number>();
	let previous = Number.NEGATIVE_INFINITY;
	let level = 0;

	for (const series of ordered) {
		level = series.crossing - previous < model.maxX * CROSSING_LABEL_MIN_GAP ? level + 1 : 0;
		levels.set(series.key, level);
		previous = series.crossing;
	}

	return levels;
}

/** A stub off the axis rather than a full-height rule, which would crowd the plot */
function crossingTickHeight(model: OgModel): number {
	const peak = model.points.reduce((highest, point) => {
		for (const series of model.series) {
			const value = point[series.key];
			if (typeof value === 'number' && value > highest) highest = value;
		}

		return highest;
	}, 0);

	return peak * 0.06;
}

/** Six evenly spaced ticks: recharts cannot measure text server-side, so tick placement is ours */
function xAxisTicks(maxX: number): number[] {
	return Array.from({ length: 6 }, (_, i) => Math.round((maxX / 5) * i));
}

function renderPlot(model: OgModel, width: number, height: number): string {
	const levels = crossingLevels(model);
	const markup = renderToStaticMarkup(
		<LineChart
			width={width}
			height={height}
			data={model.points}
			// The right margin has to clear half of the last x tick label; recharts cannot measure
			// it server-side and would let it run off the canvas
			margin={{ top: 8, right: 72, bottom: 8, left: 8 }}
		>
			<CartesianGrid stroke={COLORS.grid} vertical={dashedGridLine} />
			<XAxis
				dataKey={model.xKey}
				type="number"
				domain={[0, model.maxX]}
				ticks={xAxisTicks(model.maxX)}
				interval={0}
				tickLine={false}
				axisLine={{ stroke: COLORS.grid }}
				tickMargin={12}
				height={44}
				tick={{ fill: COLORS.muted, fontSize: 20, fontFamily: FONT_FAMILY }}
				tickFormatter={(value: number) => `${formatNumber(value, 0)} ${model.xUnit}`}
			/>
			<YAxis
				tickLine={false}
				axisLine={{ stroke: COLORS.grid }}
				tickMargin={12}
				width={110}
				tick={{ fill: COLORS.muted, fontSize: 20, fontFamily: FONT_FAMILY }}
				// Grip force runs 0-10 kgf, where whole numbers throw away most of the range
				tickFormatter={(value: number) => `${formatNumber(value, model.yUnit === 'kgf' ? 1 : 0)} ${model.yUnit}`}
			/>
			{model.series.map((series) => (
				<Line
					key={series.key}
					dataKey={series.key}
					type="monotone"
					dot={false}
					stroke={series.color}
					strokeWidth={3}
					isAnimationActive={false}
				/>
			))}
			{model.required !== null && (
				<ReferenceLine y={model.required} stroke={COLORS.required} strokeWidth={2} strokeDasharray="10 8" />
			)}
			{/* Where each motor gives up, marked on the axis in that motor's own colour */}
			{model.series.map((series) =>
				series.crossing === null ? null : (
					<ReferenceLine
						key={`${series.key}-crossing`}
						segment={[
							{ x: series.crossing, y: 0 },
							{ x: series.crossing, y: crossingTickHeight(model) }
						]}
						stroke={series.color}
						strokeWidth={3}
						// Bare number: the axis right below it already names the unit
						label={{
							value: formatNumber(series.crossing, 0),
							position: 'top',
							offset: 6 + (levels.get(series.key) ?? 0) * CROSSING_LABEL_STEP,
							fill: series.color,
							fontSize: 18,
							fontFamily: FONT_FAMILY
						}}
					/>
				)
			)}
		</LineChart>
	);

	// recharts wraps its `<svg>` in a positioned `<div>`; only the svg is of any use here
	const svg = markup.match(/<svg[\s\S]*<\/svg>/)?.[0];
	if (!svg) throw new Error('recharts produced no <svg>');

	return svg;
}

function renderLegend(model: OgModel, top: number): string {
	const columnWidth = (OG_WIDTH - PADDING_X * 2) / LEGEND_COLUMNS;

	const entries = model.series.map((series, index) => {
		const column = index % LEGEND_COLUMNS;
		const row = Math.floor(index / LEGEND_COLUMNS);
		const x = PADDING_X + column * columnWidth;
		const y = top + row * LEGEND_ROW_HEIGHT;
		// A motor that is short of the required torque standing still has no crossing to name, and
		// a bare label there reads as missing data rather than as the answer
		const verdict =
			series.crossing !== null
				? ` · ${formatNumber(series.crossing, 0)} ${model.xUnit}`
				: series.belowRequired
					? ' · below required'
					: '';

		// The verdict is the point of the entry, so the model name is what gives way when the two
		// together do not fit the column
		const label = fitText(
			series.label,
			LEGEND_FONT_SIZE,
			columnWidth - 42 - estimateTextWidth(verdict, LEGEND_FONT_SIZE)
		);

		return [
			`<rect x="${x}" y="${y}" width="16" height="16" rx="4" fill="${series.color}" />`,
			text(`${label}${verdict}`, { x: x + 26, y: y + 14, size: LEGEND_FONT_SIZE, fill: COLORS.foreground })
		].join('');
	});

	if (model.omittedSteppers > 0) {
		const row = Math.ceil(model.series.length / LEGEND_COLUMNS);
		entries.push(
			text(`+${model.omittedSteppers} more not shown`, {
				x: PADDING_X,
				y: top + row * LEGEND_ROW_HEIGHT + 14,
				size: 18,
				fill: COLORS.dim
			})
		);
	}

	return entries.join('');
}

function legendHeight(model: OgModel): number {
	if (model.series.length === 0) return 0;

	const rows = Math.ceil(model.series.length / LEGEND_COLUMNS) + (model.omittedSteppers > 0 ? 1 : 0);
	return rows * LEGEND_ROW_HEIGHT;
}

function renderGenericCard(model: OgModel, siteName: string): string {
	const centre = OG_WIDTH / 2;

	return [
		text(model.title, { x: centre, y: 300, size: 64, fill: COLORS.foreground, weight: 'bold', anchor: 'middle' }),
		text(model.subtitle, { x: centre, y: 356, size: 30, fill: COLORS.muted, anchor: 'middle' }),
		text(siteName, { x: centre, y: 424, size: 22, fill: COLORS.dim, anchor: 'middle' })
	].join('');
}

/** Renders the whole card, chart included, as one standalone SVG document */
export function renderOgSvg(model: OgModel, siteName: string): string {
	const body: string[] = [
		`<rect width="${OG_WIDTH}" height="${OG_HEIGHT}" fill="${COLORS.background}" />`,
		`<rect x="0" y="0" width="${OG_WIDTH}" height="6" fill="#2563eb" />`
	];

	if (model.variant === 'generic') {
		body.push(renderGenericCard(model, siteName));
	} else {
		// The site name sits in the bottom-right corner, so the title owns the full width
		const legendTop = OG_HEIGHT - BOTTOM_PADDING - Math.max(legendHeight(model), LEGEND_ROW_HEIGHT);
		const plotHeight = Math.max(200, legendTop - 24 - CHART_TOP);
		const plotWidth = OG_WIDTH - PADDING_X;
		const titleSize = 36;

		body.push(
			text(fitText(model.title, titleSize, OG_WIDTH - PADDING_X * 2, true), {
				x: PADDING_X,
				y: 70,
				size: titleSize,
				fill: COLORS.foreground,
				weight: 'bold'
			}),
			text(model.subtitle, { x: PADDING_X, y: 108, size: 22, fill: COLORS.muted }),
			renderPlot(model, plotWidth, plotHeight).replace('<svg ', `<svg x="${PADDING_X / 2}" y="${CHART_TOP}" `),
			renderLegend(model, legendTop),
			text(siteName, {
				x: OG_WIDTH - PADDING_X,
				y: OG_HEIGHT - 20,
				size: 18,
				fill: COLORS.dim,
				anchor: 'end'
			})
		);

		if (model.required !== null) {
			body.push(
				text(`${model.requiredLabel}: ${formatNumber(model.required, 1)} ${model.yUnit}`, {
					x: OG_WIDTH - PADDING_X,
					y: 108,
					size: 20,
					fill: COLORS.required,
					anchor: 'end'
				})
			);
		}
	}

	return `<svg xmlns="http://www.w3.org/2000/svg" width="${OG_WIDTH}" height="${OG_HEIGHT}" viewBox="0 0 ${OG_WIDTH} ${OG_HEIGHT}">${body.join('')}</svg>`;
}
