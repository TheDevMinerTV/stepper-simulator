/** Line colors, in the order steppers were selected, so every chart agrees on which motor is which */
export const CHART_COLORS = [
	'#2563eb', // blue
	'#dc2626', // red
	'#16a34a', // green
	'#ca8a04', // yellow
	'#9333ea', // purple
	'#c2410c', // orange
	'#0891b2', // cyan
	'#be123c', // rose
	'#059669', // emerald
	'#7c3aed' // violet
];

export const chartColor = (index: number) => CHART_COLORS[index % CHART_COLORS.length];
