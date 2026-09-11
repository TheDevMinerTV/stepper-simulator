import { defineEventHandler, getHeader, getRequestIP, readRawBody, setResponseHeader, setResponseStatus } from 'h3';

// A Plausible event with props is a few hundred bytes; anything bigger is probably not from us
const MAX_BODY_BYTES = 4096;
const UPSTREAM_TIMEOUT_MS = 5000;

export default defineEventHandler(async (event) => {
	setResponseHeader(event, 'cache-control', 'no-store');

	const upstream = process.env.PLAUSIBLE_HOST?.replace(/\/+$/, '');
	if (!upstream) {
		setResponseStatus(event, 204);
		return null;
	}

	const body = await readRawBody(event, 'utf8');
	if (!body || Buffer.byteLength(body) > MAX_BODY_BYTES) {
		setResponseStatus(event, 400);
		return 'Bad request';
	}

	const headers: Record<string, string> = { 'content-type': 'text/plain' };
	const userAgent = getHeader(event, 'user-agent');
	if (userAgent) headers['user-agent'] = userAgent;

	const ip = getRequestIP(event, { xForwardedFor: true });
	if (ip) headers['x-forwarded-for'] = ip;

	try {
		const response = await fetch(`${upstream}/api/event`, {
			method: 'POST',
			headers,
			body,
			signal: AbortSignal.timeout(UPSTREAM_TIMEOUT_MS)
		});
		setResponseStatus(event, response.status);
		return await response.text();
	} catch {
		setResponseStatus(event, 502);
		return 'Analytics upstream unavailable';
	}
});
