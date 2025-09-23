import fs from 'node:fs';
import path from 'node:path';
import prettier from 'prettier';

const prettierConfig = JSON.parse(
	fs.readFileSync(path.join(path.dirname(import.meta.url.replace('file://', '')), '..', '.prettierrc'), 'utf-8')
);

interface ParsedStepperData {
	brand: string;
	model: string;
	nemaSize: number;
	bodyLength: number;
	stepAngle: number;
	ratedCurrent: number;
	torque: number;
	inductance: number;
	resistance: number;
	rotorInertia: number;
	comments: string[];
	sources: string[];
}

const CsvFormatType = {
	ORIGINAL: 'original',
	PERA: 'peras',
	Voron3DWiki: 'markdown'
} as const;
type CsvFormatType = (typeof CsvFormatType)[keyof typeof CsvFormatType];

// Function to parse markdown table format
const parseVoron3DWikiFormat = (line: string): ParsedStepperData | null => {
	// Split by pipe and trim each column
	const columns = line
		.split('|')
		.map((col) => col.trim())
		.filter((col) => col);

	if (columns.length < 10) return null;

	const [
		_fullName, // Contains both brand and model
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

	// Use the existing sanitize and parse functions from the outer scope
	const brandStr = brand?.trim() || '';
	const modelStr = model?.trim() || '';
	const nemaSize = parseFloat(nema);
	const bodyLengthNum = parseFloat(bodyLength);
	const stepAngleNum = parseFloat(stepAngle);
	const ratedCurrentNum = parseFloat(ratedCurrent);
	// Just use N-mm as N-cm (their label is wrong)
	const torqueNum = parseFloat(torque) ? parseFloat(torque) : undefined;
	const inductanceNum = parseFloat(inductance);
	const resistanceNum = parseFloat(resistance);
	const rotorInertiaNum = parseFloat(rotorInertia);

	if (
		!brandStr ||
		!modelStr ||
		isNaN(nemaSize) ||
		isNaN(bodyLengthNum) ||
		isNaN(stepAngleNum) ||
		isNaN(ratedCurrentNum) ||
		!torqueNum ||
		isNaN(inductanceNum) ||
		isNaN(resistanceNum) ||
		isNaN(rotorInertiaNum)
	) {
		console.log('not adding incomplete stepper from markdown', {
			brandStr,
			modelStr,
			nemaSize,
			bodyLengthNum,
			stepAngleNum,
			ratedCurrentNum,
			torqueNum,
			inductanceNum,
			resistanceNum,
			rotorInertiaNum
		});
		return null;
	}

	return {
		brand: brandStr,
		model: modelStr,
		nemaSize,
		bodyLength: bodyLengthNum,
		stepAngle: stepAngleNum,
		ratedCurrent: ratedCurrentNum,
		torque: torqueNum,
		inductance: inductanceNum,
		resistance: resistanceNum,
		rotorInertia: rotorInertiaNum,
		comments: [],
		sources: ['voron3dwiki']
	};
};

async function convertCsvToTypeScript() {
	// Read input files
	const originalCsvPath = path.join(import.meta.dirname, 'steppers.csv');
	const perasCsvPath = path.join(import.meta.dirname, 'peras-steppers.csv');
	const markdownPath = path.join(import.meta.dirname, 'voron3d-wiki.md');

	const originalCsvContent = fs.readFileSync(originalCsvPath, 'utf-8');
	const perasCsvContent = fs.readFileSync(perasCsvPath, 'utf-8');
	const markdownContent = fs.readFileSync(markdownPath, 'utf-8');

	// Function to convert European decimal format (comma) to US format (period)
	const parseNumber = (value: string): number | undefined => {
		const trimmed = value?.trim();
		if (!trimmed || trimmed === '') return undefined;
		const normalized = trimmed.replace(',', '.');
		const parsed = parseFloat(normalized);
		return isNaN(parsed) ? undefined : parsed;
	};

	// Function to parse number with unit (e.g., "1.8 deg" -> 1.8)
	const parseNumberWithUnit = (value: string): number | undefined => {
		const trimmed = value?.trim();
		if (!trimmed || trimmed === '') return undefined;
		// Extract number from string like "1.8 deg", "62 N/cm", "360 g"
		const match = trimmed.match(/([\d,]+\.?\d*)/);
		if (!match) return undefined;
		const normalized = match[1].replace(',', '.');
		const parsed = parseFloat(normalized);
		return isNaN(parsed) ? undefined : parsed;
	};

	// Function to extract NEMA size from body string (e.g., "N17" -> 17)
	const parseNemaSize = (body: string): number | undefined => {
		const trimmed = body?.trim();
		if (!trimmed || trimmed === '') return undefined;
		const match = trimmed.match(/N(\d+)/i);
		if (!match) return undefined;
		const parsed = parseInt(match[1]);
		return isNaN(parsed) ? undefined : parsed;
	};

	// Function to escape manufacturer/model names if needed
	const sanitizeString = (value: string): string => {
		return value?.trim() || '';
	};

	// Function to parse original format CSV line
	const parseOriginalFormat = (line: string): ParsedStepperData | null => {
		const columns = line.split('\t');

		if (columns.length < 10) return null;

		const [
			brand,
			model,
			nema,
			bodyLength,
			stepAngle,
			ratedCurrent,
			torque,
			inductance,
			resistance,
			rotorInertia,
			comments
		] = columns;

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

		if (
			!brandStr ||
			!modelStr ||
			!nemaSize ||
			!bodyLengthNum ||
			!stepAngleNum ||
			!ratedCurrentNum ||
			!torqueNum ||
			!inductanceNum ||
			!resistanceNum ||
			!rotorInertiaNum
		) {
			console.log('not adding incomplete stepper', {
				brandStr,
				modelStr,
				nemaSize,
				bodyLengthNum,
				stepAngle,
				ratedCurrentNum,
				torqueNum,
				inductanceNum,
				resistanceNum,
				rotorInertiaNum
			});
			return null;
		}

		return {
			brand: brandStr,
			model: modelStr,
			nemaSize,
			bodyLength: bodyLengthNum,
			stepAngle: stepAngleNum,
			ratedCurrent: ratedCurrentNum,
			torque: torqueNum,
			inductance: inductanceNum,
			resistance: resistanceNum,
			rotorInertia: rotorInertiaNum,
			comments: !comments ? [] : comments.split(';').map((x) => x.trim()),
			sources: ['original-csv']
		};
	};

	// Function to parse peras format CSV line
	const parsePerasFormat = (line: string): ParsedStepperData | null => {
		const columns = line.split('\t');

		if (columns.length < 16) return null;

		// Peras CSV has 18 columns, but we only need the first 16
		// The last 2 columns are empty
		const [
			brand,
			model,
			_price, // ignored
			_storeLocation, // ignored
			_storeLink, // ignored
			stepAngle,
			maxAmperage,
			holdingTorque,
			rotorInertia,
			inductance,
			resistance,
			_weight, // ignored
			body,
			length,
			_specsLink, // ignored
			comments
		] = columns;

		const brandStr = sanitizeString(brand);
		const modelStr = sanitizeString(model);
		const nemaSize = parseNemaSize(body);
		const bodyLengthNum = parseNumberWithUnit(length);
		const stepAngleNum = parseNumberWithUnit(stepAngle);
		const ratedCurrentNum = parseNumberWithUnit(maxAmperage);
		const torqueNum = parseNumberWithUnit(holdingTorque);
		const inductanceNum = parseNumberWithUnit(inductance);
		const resistanceNum = parseNumberWithUnit(resistance);
		const rotorInertiaNum = parseNumberWithUnit(rotorInertia);

		if (
			!brandStr ||
			!modelStr ||
			!nemaSize ||
			!bodyLengthNum ||
			!stepAngleNum ||
			!ratedCurrentNum ||
			!torqueNum ||
			!inductanceNum ||
			!resistanceNum ||
			!rotorInertiaNum
		) {
			console.log('not adding incomplete stepper', {
				brandStr,
				modelStr,
				nemaSize,
				bodyLengthNum,
				stepAngle,
				ratedCurrentNum,
				torqueNum,
				inductanceNum,
				resistanceNum,
				rotorInertiaNum
			});
			return null;
		}

		return {
			brand: brandStr,
			model: modelStr,
			nemaSize,
			bodyLength: bodyLengthNum,
			stepAngle: stepAngleNum,
			ratedCurrent: ratedCurrentNum,
			torque: torqueNum,
			inductance: inductanceNum,
			resistance: resistanceNum,
			rotorInertia: rotorInertiaNum,
			comments: !comments ? [] : comments.split(';').map((x) => x.trim()),
			sources: ['pera-csv']
		};
	};

	// Parse input files
	const parseInputFile = (content: string, format: CsvFormatType): ParsedStepperData[] => {
		const lines = content.split('\n').filter((line) => line.trim());
		// For markdown, skip the header and separator lines
		const dataLines =
			format === CsvFormatType.Voron3DWiki
				? lines.slice(2).filter((line) => line.trim() && !line.includes('---'))
				: lines.slice(1).filter((line) => line.trim());

		const parsedData: ParsedStepperData[] = [];

		for (const line of dataLines) {
			let parsed: ParsedStepperData | null = null;

			if (format === CsvFormatType.ORIGINAL) {
				parsed = parseOriginalFormat(line);
			} else if (format === CsvFormatType.PERA) {
				parsed = parsePerasFormat(line);
			} else if (format === CsvFormatType.Voron3DWiki) {
				parsed = parseVoron3DWikiFormat(line);
			}

			if (parsed) {
				parsedData.push(parsed);
			}
		}

		return parsedData;
	};

	// Parse files
	const originalData = parseInputFile(originalCsvContent, CsvFormatType.ORIGINAL);
	const perasData = parseInputFile(perasCsvContent, CsvFormatType.PERA);
	const voron3DWikiData = parseInputFile(markdownContent, CsvFormatType.Voron3DWiki);

	const allData = [...originalData, ...perasData, ...voron3DWikiData];

	console.log(`📊 Original CSV: ${originalData.length} entries parsed`);
	console.log(`📊 Peras CSV: ${perasData.length} entries parsed`);
	console.log(`📊 Voron3D Wiki: ${voron3DWikiData.length} entries parsed`);
	console.log(`📊 Total entries from all files: ${allData.length}`);

	// Helper function to check if two stepper data objects have the same specs
	const specsAreEqual = (a: ParsedStepperData, b: ParsedStepperData): boolean => {
		return (
			a.nemaSize === b.nemaSize &&
			a.bodyLength === b.bodyLength &&
			a.stepAngle === b.stepAngle &&
			a.ratedCurrent === b.ratedCurrent &&
			a.torque === b.torque &&
			a.inductance === b.inductance &&
			a.resistance === b.resistance &&
			a.rotorInertia === b.rotorInertia
		);
	};

	const stepperToString = (stepper: ParsedStepperData): string =>
		`${stepper.brand} ${stepper.model} (NEMA ${stepper.nemaSize}, ${stepper.bodyLength}mm, ${stepper.stepAngle}°, ${stepper.ratedCurrent}A, ${stepper.torque}N·cm, ${stepper.inductance}mH, ${stepper.resistance}Ω, ${stepper.rotorInertia}g·cm²) from ${stepper.sources.join(', ')}`;

	// Convert parsed data to nested Map structure
	const steppersByBrand = new Map<string, Map<string, ParsedStepperData>>();
	let totalEntries = 0;

	for (const data of allData) {
		totalEntries++;

		// Initialize brand map if it doesn't exist
		if (!steppersByBrand.has(data.brand)) {
			steppersByBrand.set(data.brand, new Map<string, ParsedStepperData>());
		}

		const rawBrandMap = steppersByBrand.get(data.brand)!;
		const existingRawData = rawBrandMap.get(data.model);

		if (existingRawData) {
			// Check if the specs are actually the same
			if (specsAreEqual(existingRawData, data)) {
				console.log(
					`📋 Duplicate entry found: ${data.brand} ${data.model} - Identical specs, keeping existing entry`
				);
			} else {
				console.warn(`🚨 Duplicate entry found: ${data.brand} ${data.model} - DIFFERENT SPECS!`);
				console.warn(stepperToString(existingRawData));
				console.warn(stepperToString(data));
				console.warn(`   Keeping the new entry (overwriting)`);
			}

			data.comments.push(...existingRawData.comments);
		}

		rawBrandMap.set(data.model, data);
	}

	// Generate the nested Map TypeScript content
	const brandEntries: string[] = [];

	for (const [brand, rawModelsMap] of steppersByBrand.entries()) {
		const modelEntries: string[] = [];

		for (const [model, data] of rawModelsMap.entries()) {
			const stepperDefinition = `{
				brand: ${JSON.stringify(data.brand)},
				model: ${JSON.stringify(data.model)},
				nemaSize: ${data.nemaSize},
				bodyLength: ${data.bodyLength} as Millimeter,
				stepAngle: ${data.stepAngle} as Degree,
				ratedCurrent: ${data.ratedCurrent} as Ampere,
				torque: ${data.torque} as NewtonCentimeter,
				inductance: ${data.inductance} as MilliHenry,
				resistance: ${data.resistance} as Ohm,
				rotorInertia: ${data.rotorInertia} as GramSquareCentimeter,
				comments: ${JSON.stringify(data.comments)}
			}`;
			modelEntries.push(`\t\t["${model}", ${stepperDefinition}]`);
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
	console.log(`📄 Output written to: ${outputPath}`);
}

// Run the conversion
convertCsvToTypeScript().catch(console.error);
