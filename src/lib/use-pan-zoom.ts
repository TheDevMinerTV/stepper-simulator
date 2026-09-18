import { useGesture } from '@use-gesture/react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

export type Domain = [number, number];
export type Bounds = { x: Domain; y: Domain };

const MIN_SPAN_FRACTION = 1 / 500;
const WHEEL_ZOOM_RATE = 0.0015;

const span = ([a, b]: Domain) => b - a;

function zoomAxis(domain: Domain, base: Domain, pivot: number, factor: number): Domain {
	const baseSpan = span(base);
	const wanted = Math.min(Math.max(span(domain) * factor, baseSpan * MIN_SPAN_FRACTION), baseSpan);
	const ratio = wanted / span(domain);

	return clampAxis([pivot - (pivot - domain[0]) * ratio, pivot + (domain[1] - pivot) * ratio], base);
}

function panAxis(domain: Domain, base: Domain, delta: number): Domain {
	return clampAxis([domain[0] + delta, domain[1] + delta], base);
}

function clampAxis(domain: Domain, base: Domain): Domain {
	const width = Math.min(span(domain), span(base));
	const start = Math.min(Math.max(domain[0], base[0]), base[1] - width);

	return [start, start + width];
}

type PinchMemo = { start: Bounds; pivot: { x: number; y: number } };

export function usePanZoom(base: Bounds) {
	const [container, setContainer] = useState<HTMLDivElement | null>(null);
	const [view, setView] = useState<Bounds | null>(null);
	const [panning, setPanning] = useState(false);

	const baseKey = `${base.x[0]},${base.x[1]},${base.y[0]},${base.y[1]}`;
	// biome-ignore lint/correctness/useExhaustiveDependencies: yep, the key is a dependency
	useEffect(() => setView(null), [baseKey]);

	const baseRef = useRef(base);
	baseRef.current = base;
	const viewRef = useRef(view);
	viewRef.current = view;

	const plotRect = useCallback(() => {
		if (!container) return null;

		const grid = container.querySelector('.recharts-cartesian-grid');
		const rect = (grid ?? container).getBoundingClientRect();

		return rect.width === 0 || rect.height === 0 ? null : rect;
	}, [container]);

	const toValues = useCallback(
		(clientX: number, clientY: number, current: Bounds) => {
			const rect = plotRect();
			if (!rect) return null;

			return {
				x: current.x[0] + ((clientX - rect.left) / rect.width) * span(current.x),
				y: current.y[1] - ((clientY - rect.top) / rect.height) * span(current.y)
			};
		},
		[plotRect]
	);

	const reset = useCallback(() => setView(null), []);

	useGesture(
		{
			onDrag: ({ delta: [dx, dy], touches, down }) => {
				setPanning(down);
				if (touches > 1) return;

				const rect = plotRect();
				if (!rect) return;

				const current = viewRef.current ?? baseRef.current;

				setView({
					x: panAxis(current.x, baseRef.current.x, (-dx / rect.width) * span(current.x)),
					y: panAxis(current.y, baseRef.current.y, (dy / rect.height) * span(current.y))
				});
			},
			onWheel: ({ delta: [, dy], event }) => {
				event.preventDefault();

				const current = viewRef.current ?? baseRef.current;
				const pivot = toValues(event.clientX, event.clientY, current);
				if (!pivot) return;

				const factor = Math.exp(dy * WHEEL_ZOOM_RATE);
				const zoomX = !event.altKey;
				const zoomY = !event.shiftKey;

				setView({
					x: zoomX ? zoomAxis(current.x, baseRef.current.x, pivot.x, factor) : current.x,
					y: zoomY ? zoomAxis(current.y, baseRef.current.y, pivot.y, factor) : current.y
				});
			},
			onPinch: ({ offset: [scale], origin: [originX, originY], first, event, memo }) => {
				event.preventDefault();

				const current = viewRef.current ?? baseRef.current;
				const started: PinchMemo | undefined = first
					? (() => {
							const pivot = toValues(originX, originY, current);
							return pivot ? { start: current, pivot } : undefined;
						})()
					: memo;
				if (!started) return undefined;

				const factor = 1 / Math.max(scale, Number.EPSILON);

				setView({
					x: zoomAxis(started.start.x, baseRef.current.x, started.pivot.x, factor),
					y: zoomAxis(started.start.y, baseRef.current.y, started.pivot.y, factor)
				});

				return started;
			}
		},
		{
			target: container ?? undefined,
			eventOptions: { passive: false },
			drag: { filterTaps: true, pointer: { buttons: 1 } },
			pinch: { from: [1, 0], scaleBounds: { min: 1, max: 1 / MIN_SPAN_FRACTION } }
		}
	);

	const handlers = useMemo(() => ({ ref: setContainer }), []);

	return { bounds: view ?? base, zoomed: view !== null, panning, reset, handlers };
}
