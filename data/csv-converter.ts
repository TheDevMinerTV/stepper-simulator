import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
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

/**
 * A stepper that used to be in the DB and is not in any source file anymore. Share links reference
 * steppers by `brand|model`, so dropping an entry would silently break every link that used it.
 * Archived entries stay resolvable by `src/lib/config-sharing.ts` but are hidden from the picker.
 */
interface ArchivedStepper extends Omit<ParsedStepperData, 'sources'> {
	archivedAt: string;
}

const archivePath = path.join(import.meta.dirname, 'archived-steppers.json');
const aliasPath = path.join(import.meta.dirname, 'stepper-aliases.json');
const stepperDbPath = path.join(import.meta.dirname, '..', 'src', 'lib', 'stepper-db.ts');

const stepperId = (stepper: { brand: string; model: string }) => `${stepper.brand}|${stepper.model}`;

const readJsonFile = <T>(filePath: string, fallback: T): T => {
	if (!fs.existsSync(filePath)) return fallback;
	return JSON.parse(fs.readFileSync(filePath, 'utf-8')) as T;
};

/** What the previous run published as live, read back out of the generated file */
const readPublishedSteppers = async (): Promise<Map<string, ParsedStepperData>> => {
	const published = new Map<string, ParsedStepperData>();
	if (!fs.existsSync(stepperDbPath)) return published;

	const { STEPPER_DB } = (await import(pathToFileURL(stepperDbPath).href)) as {
		STEPPER_DB: Map<string, Map<string, ParsedStepperData>>;
	};

	for (const brandMap of STEPPER_DB.values()) {
		for (const stepper of brandMap.values()) {
			published.set(stepperId(stepper), stepper);
		}
	}

	return published;
};

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
	const originalCsvPath = path.join(import.meta.dirname, 'steppers.tsv');
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
			comments: !comments || !comments.trim() ? [] : comments.split(';').map((x) => x.trim()),
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

	// Archive whatever the previous run published and no source file carries anymore, so share
	// links that reference it by `brand|model` keep resolving
	const currentById = new Map<string, ParsedStepperData>();
	for (const brandMap of steppersByBrand.values()) {
		for (const stepper of brandMap.values()) {
			currentById.set(stepperId(stepper), stepper);
		}
	}

	const archive = readJsonFile<{ steppers: ArchivedStepper[] }>(archivePath, { steppers: [] });
	const archiveById = new Map(archive.steppers.map((stepper) => [stepperId(stepper), stepper]));

	// A stepper that came back into a source file is live again
	for (const id of archiveById.keys()) {
		if (currentById.has(id)) {
			console.log(`♻️  Un-archiving ${id}: it is back in a source file`);
			archiveById.delete(id);
		}
	}

	const archivedAt = new Date().toISOString().slice(0, 10);
	for (const [id, stepper] of await readPublishedSteppers()) {
		if (currentById.has(id) || archiveById.has(id)) continue;

		console.log(`📦 Archiving ${id}: gone from every source file, share links keep resolving it`);
		const { sources: _sources, ...definition } = stepper;
		archiveById.set(id, { ...definition, archivedAt });
	}

	const aliases = readJsonFile<{ aliases: Record<string, string> }>(aliasPath, { aliases: {} });

	// Generate the nested Map TypeScript content
	const renderStepperDefinition = (data: Omit<ParsedStepperData, 'sources'>) => `{
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

	const renderBrandMaps = (steppers: Iterable<Omit<ParsedStepperData, 'sources'>>) => {
		const byBrand = new Map<string, string[]>();

		for (const data of steppers) {
			const modelEntries = byBrand.get(data.brand) ?? [];
			modelEntries.push(`\t\t["${data.model}", ${renderStepperDefinition(data)}]`);
			byBrand.set(data.brand, modelEntries);
		}

		return Array.from(byBrand.entries())
			.map(
				([brand, modelEntries]) => `\t["${brand}", new Map<string, StepperDefinition>([
${modelEntries.join(',\n')}
\t])]`
			)
			.join(',\n');
	};

	const liveSteppers = Array.from(steppersByBrand.values()).flatMap((brandMap) => Array.from(brandMap.values()));

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
		${renderBrandMaps(liveSteppers)}
	]);

	/**
	 * Steppers that left the source data. Hidden from the picker, but still resolvable so that
	 * share links referencing them by \`brand|model\` keep working. Edit \`data/archived-steppers.json\`.
	 */
	export const ARCHIVED_STEPPER_DB: Map<string, Map<string, StepperDefinition>> = new Map([
		${renderBrandMaps(archiveById.values())}
	]);

	/** \`brand|model\` of a renamed stepper -> its current \`brand|model\`. Edit \`data/stepper-aliases.json\`. */
	export const STEPPER_ALIASES: Map<string, string> = new Map(${JSON.stringify(Object.entries(aliases.aliases))});
	`;

	const archivedSteppers = Array.from(archiveById.values()).sort((a, b) => stepperId(a).localeCompare(stepperId(b)));
	fs.writeFileSync(archivePath, `${JSON.stringify({ steppers: archivedSteppers }, null, '\t')}\n`, 'utf-8');

	// Write to stepper-db.ts
	const outputPath = stepperDbPath;

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
	console.log(`📦 Archived (link-resolvable only): ${archivedSteppers.length}`);
	console.log(`🔗 Aliases: ${Object.keys(aliases.aliases).length}`);
	console.log(`📄 Output written to: ${outputPath}`);
}

// Run the conversion
convertCsvToTypeScript().catch(console.error);
