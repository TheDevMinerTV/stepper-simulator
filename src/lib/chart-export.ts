/**
 * Saves the on-screen chart as an image.
 *
 * The chart is already SVG, so the vector path is a copy of the live element rather than a
 * redrawn one. Two things do not survive that copy on their own and are rebuilt here:
 *
 * - **Styling.** Nearly every colour in the chart comes from a CSS class or a custom property, and
 *   a detached SVG has no stylesheet. Computed values are inlined onto the clone.
 * - **The legend.** recharts renders it as HTML alongside the `<svg>`, not inside it, so an image
 *   of the SVG alone would not say which colour is which motor. It is redrawn as SVG.
 */

export type ChartImageFormat = 'svg' | 'png' | 'jpeg' | 'webp';

export type ChartExportSeries = {
	label: string;
	color: string;
};

/** Raster output is drawn at this multiple of the on-screen size, so it is not soft when zoomed */
const RASTER_SCALE = 2;

const LEGEND_FONT_SIZE = 13;
const LEGEND_SWATCH = 10;
const LEGEND_ROW_HEIGHT = 22;
const LEGEND_GAP = 24;
const LEGEND_PADDING_TOP = 8;
const LEGEND_PADDING_BOTTOM = 12;

/** Properties that carry the chart's appearance; anything else is layout the clone already has */
const INLINED_PROPERTIES = [
	'fill',
	'fill-opacity',
	'stroke',
	'stroke-width',
	'stroke-opacity',
	'stroke-dasharray',
	'stroke-linecap',
	'stroke-linejoin',
	'font-family',
	'font-size',
	'font-weight',
	'font-style',
	'letter-spacing',
	'opacity',
	'text-anchor',
	'dominant-baseline',
	'visibility',
	'display'
];

const FORMAT_MIME: Record<Exclude<ChartImageFormat, 'svg'>, string> = {
	png: 'image/png',
	jpeg: 'image/jpeg',
	webp: 'image/webp'
};

function inlineComputedStyles(source: SVGSVGElement, clone: SVGSVGElement) {
	// Both trees are the same shape, so a parallel walk pairs each node with its original
	const sourceNodes: Element[] = [source, ...source.querySelectorAll('*')];
	const cloneNodes: Element[] = [clone, ...clone.querySelectorAll('*')];

	for (let i = 0; i < sourceNodes.length; i++) {
		const computed = window.getComputedStyle(sourceNodes[i]);
		const declarations: string[] = [];

		for (const property of INLINED_PROPERTIES) {
			const value = computed.getPropertyValue(property);
			// `none` is kept: it is what stops a line's path from being filled in, and dropping it
			// would let the export paint solid shapes where the chart draws strokes. `currentColor`
			// and `var()` are already resolved by the time a property is computed.
			if (value) declarations.push(`${property}:${value}`);
		}

		cloneNodes[i].setAttribute('style', declarations.join(';'));
	}
}

/** Text has to be measured to be centred, and canvas is the only measurer available here */
function measureText(text: string, font: string): number {
	const canvas = document.createElement('canvas');
	const context = canvas.getContext('2d');
	if (!context) return text.length * LEGEND_FONT_SIZE * 0.55;

	context.font = font;
	return context.measureText(text).width;
}

function buildLegend(
	series: ChartExportSeries[],
	width: number,
	fontFamily: string,
	foreground: string
): { markup: string; height: number } {
	if (series.length === 0) return { markup: '', height: 0 };

	const font = `${LEGEND_FONT_SIZE}px ${fontFamily}`;
	const entries = series.map((entry) => ({
		...entry,
		width: LEGEND_SWATCH + 6 + measureText(entry.label, font)
	}));

	// Greedy wrap, then centre each row on the chart the way the on-screen legend sits
	const rows: (typeof entries)[] = [[]];
	let used = 0;
	for (const entry of entries) {
		const current = rows[rows.length - 1];
		if (current.length > 0 && used + LEGEND_GAP + entry.width > width) {
			rows.push([entry]);
			used = entry.width;
		} else {
			current.push(entry);
			used += (current.length > 1 ? LEGEND_GAP : 0) + entry.width;
		}
	}

	const parts: string[] = [];
	rows.forEach((row, rowIndex) => {
		const rowWidth = row.reduce((total, entry) => total + entry.width, 0) + LEGEND_GAP * (row.length - 1);
		let x = Math.max(0, (width - rowWidth) / 2);
		const y = LEGEND_PADDING_TOP + rowIndex * LEGEND_ROW_HEIGHT;

		for (const entry of row) {
			parts.push(
				`<rect x="${x}" y="${y + (LEGEND_FONT_SIZE - LEGEND_SWATCH) / 2}" width="${LEGEND_SWATCH}" height="${LEGEND_SWATCH}" rx="2" fill="${entry.color}" />`,
				`<text x="${x + LEGEND_SWATCH + 6}" y="${y + LEGEND_FONT_SIZE}" font-family="${escapeXml(fontFamily)}" font-size="${LEGEND_FONT_SIZE}" fill="${foreground}">${escapeXml(entry.label)}</text>`
			);
			x += entry.width + LEGEND_GAP;
		}
	});

	return {
		markup: parts.join(''),
		height: LEGEND_PADDING_TOP + rows.length * LEGEND_ROW_HEIGHT + LEGEND_PADDING_BOTTOM
	};
}

function escapeXml(value: string): string {
	return value
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
		.replace(/"/g, '&quot;')
		.replace(/'/g, '&apos;');
}

export type BuildSvgOptions = {
	svg: SVGSVGElement;
	series: ChartExportSeries[];
	/** Painted behind the chart so the image is readable outside the app's theme */
	background: string;
	/** Colour for legend labels, matching the app's foreground */
	foreground: string;
};

/** JPEG has no alpha, so a transparent ground would flatten to black rather than to the page */
function opaque(color: string): string {
	if (!color) return '#ffffff';

	const transparent = color === 'transparent' || /^rgba\(.*,\s*0\s*\)$/.test(color.replace(/\s/g, ' '));
	return transparent ? '#ffffff' : color;
}

export function buildChartSvg({ svg, series, background, foreground }: BuildSvgOptions): string {
	const bounds = svg.getBoundingClientRect();
	const width = Math.round(bounds.width) || Number(svg.getAttribute('width')) || 800;
	const height = Math.round(bounds.height) || Number(svg.getAttribute('height')) || 400;

	const clone = svg.cloneNode(true) as SVGSVGElement;
	inlineComputedStyles(svg, clone);

	const fontFamily = window.getComputedStyle(svg).fontFamily || 'sans-serif';
	const legend = buildLegend(series, width, fontFamily, foreground);

	clone.removeAttribute('style');
	clone.setAttribute('x', '0');
	clone.setAttribute('y', '0');
	clone.setAttribute('width', String(width));
	clone.setAttribute('height', String(height));

	const inner = new XMLSerializer().serializeToString(clone);
	const total = height + legend.height;

	return [
		`<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="${width}" height="${total}" viewBox="0 0 ${width} ${total}">`,
		`<rect width="${width}" height="${total}" fill="${opaque(background)}" />`,
		inner,
		legend.markup ? `<g transform="translate(0 ${height})">${legend.markup}</g>` : '',
		'</svg>'
	].join('');
}

async function rasterize(svgMarkup: string, format: Exclude<ChartImageFormat, 'svg'>): Promise<Blob> {
	const source = URL.createObjectURL(new Blob([svgMarkup], { type: 'image/svg+xml;charset=utf-8' }));

	try {
		const image = new Image();
		image.decoding = 'sync';
		await new Promise<void>((resolve, reject) => {
			image.onload = () => resolve();
			image.onerror = () => reject(new Error('the chart could not be rendered as an image'));
			image.src = source;
		});

		const canvas = document.createElement('canvas');
		canvas.width = image.width * RASTER_SCALE;
		canvas.height = image.height * RASTER_SCALE;

		const context = canvas.getContext('2d');
		if (!context) throw new Error('this browser did not provide a 2D canvas');
		context.scale(RASTER_SCALE, RASTER_SCALE);
		context.drawImage(image, 0, 0);

		const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, FORMAT_MIME[format]));
		if (!blob) throw new Error(`this browser cannot write ${format.toUpperCase()}`);

		return blob;
	} finally {
		URL.revokeObjectURL(source);
	}
}

/** `null` when the name says nothing useful, leaving the format that was chosen in the app to stand */
function formatFromFilename(name: string): ChartImageFormat | null {
	const extension = name.slice(name.lastIndexOf('.') + 1).toLowerCase();
	if (extension === 'png') return 'png';
	if (extension === 'svg') return 'svg';
	if (extension === 'jpg' || extension === 'jpeg') return 'jpeg';
	if (extension === 'webp') return 'webp';

	return null;
}

async function toBlob(svgMarkup: string, format: ChartImageFormat): Promise<Blob> {
	return format === 'svg'
		? new Blob([svgMarkup], { type: 'image/svg+xml;charset=utf-8' })
		: rasterize(svgMarkup, format);
}

/**
 * File types offered to the save dialog, in the order they are listed.
 *
 * Whether they all reach the dialog's "Save as type" list is the browser's call — Chrome has been
 * seen offering only the first. That is survivable rather than fatal, because the dialog also
 * offers "All Files": the format is taken from the name that comes back, so typing `graph.svg`
 * writes real SVG whatever the type list happened to show.
 */
const SAVE_TYPES: { description: string; accept: Record<string, string[]> }[] = [
	{ description: 'PNG image', accept: { 'image/png': ['.png'] } },
	{ description: 'SVG image (vector)', accept: { 'image/svg+xml': ['.svg'] } },
	{ description: 'JPEG image', accept: { 'image/jpeg': ['.jpg', '.jpeg'] } },
	{ description: 'WebP image', accept: { 'image/webp': ['.webp'] } }
];

/** What a name with no useful extension is written as */
const DEFAULT_FORMAT: ChartImageFormat = 'png';

type SaveFilePickerOptions = {
	suggestedName?: string;
	types?: readonly { description: string; accept: Record<string, readonly string[]> }[];
};
type FileSystemWritable = { write: (data: Blob) => Promise<void>; close: () => Promise<void> };
type FileSystemHandle = { name: string; createWritable: () => Promise<FileSystemWritable> };
type PickerWindow = Window & {
	showSaveFilePicker?: (options?: SaveFilePickerOptions) => Promise<FileSystemHandle>;
};

function downloadFallback(blob: Blob, filename: string) {
	const url = URL.createObjectURL(blob);
	const link = document.createElement('a');
	link.href = url;
	link.download = filename;
	document.body.appendChild(link);
	link.click();
	link.remove();
	URL.revokeObjectURL(url);
}

export type SaveChartOptions = BuildSvgOptions & {
	/** Without an extension; the file type settles that */
	filename: string;
};

/**
 * Writes the chart, asking the system save dialog for both the location and the file type.
 *
 * Resolves to `false` when the dialog was dismissed. Browsers without the File System Access API
 * (Firefox and Safari at the time of writing) have no such dialog to open, so the file is
 * downloaded as a PNG instead.
 */
export async function saveChartImage({ filename, ...options }: SaveChartOptions): Promise<boolean> {
	const markup = buildChartSvg(options);
	const suggestedName = `${filename}.${DEFAULT_FORMAT}`;
	const showSaveFilePicker = (window as PickerWindow).showSaveFilePicker;

	if (!showSaveFilePicker) {
		downloadFallback(await toBlob(markup, DEFAULT_FORMAT), suggestedName);
		return true;
	}

	let handle: FileSystemHandle;
	try {
		handle = await showSaveFilePicker({ suggestedName, types: SAVE_TYPES });
	} catch (error) {
		// Dismissing the dialog is an ordinary outcome, not a failure worth reporting
		if (error instanceof DOMException && error.name === 'AbortError') return false;
		throw error;
	}

	const writable = await handle.createWritable();
	try {
		await writable.write(await toBlob(markup, formatFromFilename(handle.name) ?? DEFAULT_FORMAT));
	} finally {
		await writable.close();
	}

	return true;
}
