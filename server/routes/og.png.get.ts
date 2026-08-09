import { defineEventHandler, getQuery, getRequestHeader, setResponseHeader, setResponseStatus } from 'h3';
import { renderOgImage } from '../og/render';
import { resolveBaseUrl } from '../site';

/**
 * The image behind `og:image`. Deterministic in `?config=`, so it is cached hard: a share link is
 * immutable, and an unfurl that changes under a reader would be worse than a stale one.
 *
 * Anything that fails to decode renders the generic card instead of an error: a crawler that gets
 * a 500 here drops the unfurl entirely.
 */
export default defineEventHandler((event) => {
	const config = getQuery(event).config;
	const configParam = typeof config === 'string' ? config : null;

	const { png, etag } = renderOgImage(configParam, resolveBaseUrl(event).replace(/^https?:\/\//, ''));

	setResponseHeader(event, 'content-type', 'image/png');
	setResponseHeader(event, 'cache-control', 'public, max-age=31536000, immutable');
	setResponseHeader(event, 'etag', etag);

	if (getRequestHeader(event, 'if-none-match') === etag) {
		setResponseStatus(event, 304);
		return null;
	}

	return png;
});
