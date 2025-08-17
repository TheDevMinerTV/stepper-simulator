import fs from 'node:fs';
import path from 'node:path';
import prettier from 'prettier';

const prettierConfig = JSON.parse(fs.readFileSync(path.join(import.meta.dirname, '..', '.prettierrc'), 'utf-8'));

async function convertCsvToTypeScript() {
	// Read the CSV file
	const csvPath = path.join(import.meta.dirname, 'steppers.csv');
	const csvContent = fs.readFileSync(csvPath, 'utf-8');

	// Parse CSV data
	const lines = csvContent.split('\n').filter((line) => line.trim());
	const dataLines = lines.slice(1).filter((line) => line.trim());

	// Function to convert European decimal format (comma) to US format (period)
	const parseNumber = (value: string): number | undefined => {
		const trimmed = value?.trim();
		if (!trimmed || trimmed === '') return undefined;
		const normalized = trimmed.replace(',', '.');
		const parsed = parseFloat(normalized);
		return isNaN(parsed) ? undefined : parsed;
	};

	// Function to escape manufacturer/model names if needed
	const sanitizeString = (value: string): string => {
		return value?.trim() || '';
	};

	// Convert CSV data to nested Map structure
	const steppersByBrand = new Map<string, Map<string, string>>();
	let totalEntries = 0;
	let skippedEntries = 0;

	for (const line of dataLines) {
		const columns = line.split('\t');
		totalEntries++;

		// Skip empty lines or lines with insufficient data
		if (columns.length < 10) {
			console.warn(`⚠️  Entry ${totalEntries}: Insufficient columns (${columns.length} < 10) - SKIPPED`);
			skippedEntries++;
			continue;
		}

		if (!columns[0]?.trim()) {
			console.warn(`⚠️  Entry ${totalEntries}: Empty first column - SKIPPED`);
			skippedEntries++;
			continue;
		}

		const [
			_brandModel,
			brand,
			model,
			nema,
			bodyLength,
			stepAngle,
			ratedCurrent,
			torque,
			inductance,
			resistance,
			rotorInertia
		] = columns;

		// Validate and parse values
		const missingFields: string[] = [];

		const brandStr = sanitizeString(brand);
		const modelStr = sanitizeString(model);
		const nemaSize = parseNumber(nema);
		const bodyLengthNum = parseNumber(bodyLength);
		const stepAngleNum = parseNumber(stepAngle);
		const ratedCurrentNum = parseNumber(ratedCurrent);
		const torqueNum = parseNumber(torque);
		const inductanceNum = parseNumber(inductance);
		const resistanceNum = parseNumber(resistance);
		const rotorInertiaNum = parseNumber(rotorInertia);

		// Check required fields
		if (!brandStr) missingFields.push('Brand');
		if (!modelStr) missingFields.push('Model');
		if (!nemaSize) missingFields.push('NEMA Size');
		if (!bodyLengthNum) missingFields.push('Body Length');
		if (!stepAngleNum) missingFields.push('Step Angle');
		if (!ratedCurrentNum) missingFields.push('Rated Current');
		if (!torqueNum) missingFields.push('Torque');
		if (!inductanceNum) missingFields.push('Inductance');
		if (!resistanceNum) missingFields.push('Resistance');
		if (!rotorInertiaNum) missingFields.push('Rotor Inertia');

		// Skip if essential values are missing
		if (missingFields.length > 0) {
			console.warn(
				`⚠️  Entry ${totalEntries}: ${brandStr || 'Unknown'} ${modelStr || 'Unknown'} - Missing required fields: ${missingFields.join(
					', '
				)} - SKIPPED`
			);
			skippedEntries++;
			continue;
		}

		const stepperDefinition = `{
		manufacturer: "${brandStr}",
		model: "${modelStr}",
		nemaSize: ${nemaSize},
		bodyLength: ${bodyLengthNum} as Millimeter,
		stepAngle: ${stepAngleNum} as Degree,
		ratedCurrent: ${ratedCurrentNum} as Ampere,
		torque: ${torqueNum} as NewtonCentimeter,
		inductance: ${inductanceNum} as MilliHenry,
		resistance: ${resistanceNum} as Ohm,
		rotorInertia: ${rotorInertiaNum} as GramSquareCentimeter,
		imageURL: undefined,
	}`;

		// Add to nested map structure
		if (!steppersByBrand.has(brandStr)) {
			steppersByBrand.set(brandStr, new Map<string, string>());
		}

		const brandMap = steppersByBrand.get(brandStr)!;
		if (brandMap.has(modelStr)) {
			console.warn(`⚠️  Duplicate entry found: ${brandStr} ${modelStr} - Overwriting previous entry`);
		}
		brandMap.set(modelStr, stepperDefinition);
	}

	// Generate the nested Map TypeScript content
	const brandEntries: string[] = [];

	for (const [brand, modelsMap] of steppersByBrand.entries()) {
		const modelEntries: string[] = [];

		for (const [model, definition] of modelsMap.entries()) {
			modelEntries.push(`\t\t["${model}", ${definition}]`);
		}

		const brandEntry = `\t["${brand}", new Map<string, StepperDefinition>([
${modelEntries.join(',\n')}
\t])]`;

		brandEntries.push(brandEntry);
	}

	const tsContent = `import type {
	Ampere,
	Degree,
	GramSquareCentimeter,
	MilliHenry,
	Millimeter,
	NewtonCentimeter,
	Ohm,
	StepperDefinition,
} from "@/lib/stepper";

export const STEPPER_DB: Map<string, Map<string, StepperDefinition>> = new Map([
${brandEntries.join(',\n')}
]);
`;

	// Write to stepper-db.ts
	const outputPath = path.join(import.meta.dirname, '..', 'src', 'lib', 'stepper-db.ts');

	// Format the content with prettier before writing
	try {
		const formattedContent = await prettier.format(tsContent, {
			...prettierConfig,
			parser: 'typescript'
		});
		fs.writeFileSync(outputPath, formattedContent, 'utf-8');
		console.log(`🎨 File formatted with prettier`);
	} catch (error) {
		console.warn(`⚠️  Failed to format with prettier: ${error instanceof Error ? error.message : 'Unknown error'}`);
		// Fallback to writing unformatted content
		fs.writeFileSync(outputPath, tsContent, 'utf-8');
	}

	const totalConverted = Array.from(steppersByBrand.values()).reduce((sum, brandMap) => sum + brandMap.size, 0);

	console.log(`\n✅ Conversion completed!`);
	console.log(`📊 Total entries processed: ${totalEntries}`);
	console.log(`✅ Successfully converted: ${totalConverted}`);
	console.log(`🏭 Unique brands: ${steppersByBrand.size}`);
	console.log(`⚠️  Skipped due to missing data: ${skippedEntries}`);
	console.log(`📄 Output written to: ${outputPath}`);
}

// Run the conversion
convertCsvToTypeScript().catch(console.error);
