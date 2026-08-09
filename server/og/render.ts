import { Resvg } from '@resvg/resvg-js';
import { createHash } from 'node:crypto';
import { OG_HEIGHT, OG_WIDTH, renderOgSvg } from './chart';
import { buildOgModel } from './model';

/**
 * SVG to PNG, plus the small cache in front of it.
 *
 * A link posted in a busy channel is fetched by every client that unfurls it, and the image is a
 * pure function of the `config` parameter, so rendering it more than once is wasted work.
 */

/** Rendered cards held in memory. Each is ~50 kB, so this is a few MB at worst */
const CACHE_LIMIT = 200;
const cache = new Map<string, OgImage>();

export type OgImage = { png: Buffer; etag: string };

/**
 * Fonts are resolved by the rasterizer from the system font set: there is no CSS engine and no
 * webfont loading, so the container has to ship a font. `OG_FONT_FAMILY` follows whatever it is.
 */
const FONT_FAMILY = process.env.OG_FONT_FAMILY || 'DejaVu Sans';

function rasterize(svg: string): Buffer {
	const resvg = new Resvg(svg, {
		fitTo: { mode: 'width', value: OG_WIDTH },
		font: { loadSystemFonts: true, defaultFontFamily: FONT_FAMILY }
	});

	return Buffer.from(resvg.render().asPng());
}

export function renderOgImage(configParam: string | null | undefined, siteName: string): OgImage {
	const key = `${siteName}\n${configParam ?? ''}`;
	const cached = cache.get(key);
	if (cached) return cached;

	const png = rasterize(renderOgSvg(buildOgModel(configParam), siteName));
	const image: OgImage = { png, etag: `"${createHash('sha256').update(png).digest('base64url').slice(0, 27)}"` };

	cache.set(key, image);
	if (cache.size > CACHE_LIMIT) {
		// Oldest insertion first; good enough for a cache whose entries are all the same cost
		const oldest = cache.keys().next();
		if (!oldest.done) cache.delete(oldest.value);
	}

	return image;
}

export { OG_HEIGHT, OG_WIDTH };
