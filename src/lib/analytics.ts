import type { MotorModel } from '@/lib/formulas';
import type { CurrentUnit } from '@/lib/current-unit';

type PropValue = string | number | boolean;

export type AnalyticsEvents = {
	pageview: undefined;
	'Stepper Selected': { stepper: string; brand: string; source: 'cards' | 'table' };
	'Custom Stepper Created': undefined;
	'Config Shared': { steppers: number };
	'Shared Config Opened': { steppers: number; unresolved: number };
	'Shared Config Saved': undefined;
	'Motor Model Changed': { model: MotorModel };
	'Current Unit Changed': { unit: CurrentUnit };
	'View Mode Changed': { mode: 'table' | 'cards' };
	'Contribute Clicked': { steppers: number };
};

const DOMAIN: string | undefined = import.meta.env.VITE_PLAUSIBLE_DOMAIN;
const ENDPOINT = '/api/event';

const LOCALHOST = /^localhost$|^127(\.[0-9]+){0,2}\.[0-9]+$|^\[::1?\]$/;

function isEnabled(): boolean {
	if (!DOMAIN || typeof window === 'undefined') return false;
	if (LOCALHOST.test(window.location.hostname) || window.location.protocol === 'file:') return false;
	if (window.navigator.webdriver) return false;

	try {
		if (window.localStorage.getItem('plausible_ignore') === 'true') return false;
	} catch {
		// no-op
	}

	return true;
}

function pageUrl(): string {
	const url = new URL(window.location.href);
	url.search = '';
	url.hash = '';
	return url.toString();
}

export function track<N extends keyof AnalyticsEvents>(
	name: N,
	...args: AnalyticsEvents[N] extends undefined ? [] : [props: AnalyticsEvents[N]]
): void {
	if (!isEnabled()) return;

	const props = args[0] as Record<string, PropValue> | undefined;
	const body = JSON.stringify({
		name,
		url: pageUrl(),
		domain: DOMAIN,
		referrer: document.referrer || null,
		props
	});

	fetch(ENDPOINT, {
		method: 'POST',
		headers: { 'Content-Type': 'text/plain' },
		body,
		keepalive: true
	}).catch(() => {
		// no-op
	});
}

export function trackPageview(): void {
	track('pageview');
}

export function trackStepperSelected(stepper: { brand: string; model: string }, source: 'cards' | 'table'): void {
	track('Stepper Selected', { stepper: `${stepper.brand} ${stepper.model}`, brand: stepper.brand, source });
}
