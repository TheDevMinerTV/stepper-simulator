import { format } from 'prettier';
import { STEPPER_DB } from '../src/lib/stepper-db';

const headers = [
	'Brand',
	'Model',
	'NEMA',
	'Body Length mm',
	'Step Angle (deg)',
	'Rated Current (A)',
	'Torque (N-cm)',
	'Inductance (mH)',
	'Resistance (Ohms)',
	'Rotor Inertia (g-cm^2)',
	'Comments'
];

// Helper function to pad strings to a minimum length
const pad = (str: string | number, length: number): string => {
	return String(str).padEnd(length);
};

// First pass: determine maximum width for each column
const columnWidths = headers.map((header) => header.length);
Array.from(STEPPER_DB.values()).forEach((models) => {
	Array.from(models.values()).forEach((stepper) => {
		const values = [
			stepper.brand,
			stepper.model,
			stepper.nemaSize,
			stepper.bodyLength,
			stepper.stepAngle,
			stepper.ratedCurrent,
			stepper.torque,
			stepper.inductance,
			stepper.resistance,
			stepper.rotorInertia,
			stepper.comments ? stepper.comments.map((c) => `- ${c}`).join('\\n') : ''
		];
		values.forEach((value, index) => {
			columnWidths[index] = Math.max(columnWidths[index], String(value).length);
		});
	});
});

// Create the header row
let markdownTable = '| ';
headers.forEach((header, index) => {
	markdownTable += pad(header, columnWidths[index]) + ' | ';
});
markdownTable += '\n|';

// Create the separator row
headers.forEach((_, index) => {
	markdownTable += ' ' + '-'.repeat(columnWidths[index]) + ' |';
});
markdownTable += '\n';

// Create data rows
Array.from(STEPPER_DB.values()).forEach((models) => {
	Array.from(models.values()).forEach((stepper) => {
		const values = [
			stepper.brand,
			stepper.model,
			stepper.nemaSize,
			stepper.bodyLength,
			stepper.stepAngle,
			stepper.ratedCurrent,
			stepper.torque,
			stepper.inductance,
			stepper.resistance,
			stepper.rotorInertia,
			stepper.comments ? stepper.comments.join(', ') : ''
		];

		markdownTable += '| ';
		values.forEach((value, index) => {
			if (index === values.length - 1) {
				// For comments column, preserve newlines
				markdownTable += value.replace('\\n', '\n') + ' | ';
			} else {
				markdownTable += pad(value, columnWidths[index]) + ' | ';
			}
		});
		markdownTable += '\n';
	});
});

// Format the markdown using prettier
format(markdownTable, { parser: 'markdown' })
	.then((formattedTable) => {
		console.log(formattedTable);
	})
	.catch((error) => {
		console.error('Error formatting markdown:', error);
		// If formatting fails, output unformatted table
		console.log(markdownTable);
	});
