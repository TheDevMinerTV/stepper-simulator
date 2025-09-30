import { StepperSpecs } from '@/components/specs.tsx';
import { Button } from '@/components/ui/button.tsx';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card.tsx';
import { Dialog, DialogClose, DialogContent, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input.tsx';
import { Switch } from '@/components/ui/switch.tsx';
import { STEPPER_DB } from '@/lib/stepper-db.ts';
import type { StepperDefinition } from '@/lib/stepper.ts';
import { cn } from '@/lib/utils.ts';
import { currentCustomSteppersAtom, searchModeAtom, steppersAtom } from '@/state/atoms.ts';
import Fuse from 'fuse.js';
import { useAtom, useAtomValue } from 'jotai';
import { BookIcon, XIcon } from 'lucide-react';
import { useMemo, useState } from 'react';

const createMergedDB = (customSteppers: StepperDefinition[]) => {
	const mergedDB = new Map(STEPPER_DB);

	// Pre-process custom steppers by brand to avoid multiple map operations
	const customByBrand = customSteppers.reduce(
		(acc, stepper) => {
			if (!acc[stepper.brand]) {
				acc[stepper.brand] = new Map<string, StepperDefinition>();
			}
			acc[stepper.brand].set(stepper.model, stepper);
			return acc;
		},
		{} as Record<string, Map<string, StepperDefinition>>
	);

	// Merge custom steppers into the DB
	Object.entries(customByBrand).forEach(([brand, steppers]) => {
		const existingBrand = mergedDB.get(brand);
		if (existingBrand) {
			for (const [model, stepper] of steppers) {
				existingBrand.set(model, stepper);
			}
		} else {
			mergedDB.set(brand, steppers);
		}
	});

	return mergedDB;
};

const initFuzzyStepperSearch = (mergedDB: Map<string, Map<string, StepperDefinition>>) => {
	const fuse = new Fuse(
		Array.from(mergedDB.values()).flatMap((steppers) => Array.from(steppers.values())),
		{
			keys: ['brand', 'model', 'comments'],
			threshold: 0.4,
			shouldSort: true,
			minMatchCharLength: 2
		}
	);

	return (search: string) => {
		const results = fuse.search(search);

		return results.reduce((acc: Map<string, Map<string, StepperDefinition>>, result) => {
			let brandMap = acc.get(result.item.brand);
			if (!brandMap) {
				brandMap = new Map();
				acc.set(result.item.brand, brandMap);
			}

			brandMap.set(result.item.model, result.item);

			return acc;
		}, new Map<string, Map<string, StepperDefinition>>());
	};
};

const initExactSearch = (mergedDB: Map<string, Map<string, StepperDefinition>>) => {
	return (search: string) => {
		const trimmed = search.trim();
		if (trimmed === '') return mergedDB;

		const lowercaseSearch = trimmed.toLowerCase();
		const result = new Map<string, Map<string, StepperDefinition>>();

		for (const [brand, steppers] of mergedDB) {
			// Check if brand matches
			if (brand.toLowerCase().includes(lowercaseSearch)) {
				result.set(brand, new Map(steppers));
				continue;
			}

			// If brand doesn't match, check each stepper
			const matches = new Map<string, StepperDefinition>();
			for (const [model, stepper] of steppers) {
				if (
					model.toLowerCase().includes(lowercaseSearch) ||
					stepper.comments.some((comment) => comment.toLowerCase().includes(lowercaseSearch))
				) {
					matches.set(model, stepper);
				}
			}

			if (matches.size > 0) {
				result.set(brand, matches);
			}
		}

		return result;
	};
};

export function StepperList() {
	const [searchMode, setSearchMode] = useAtom(searchModeAtom);
	const [search, setSearch] = useState('');
	const customSteppers = useAtomValue(currentCustomSteppersAtom);

	const {
		mergedDB,
		exact: exactStepperSearch,
		fuzzy: fuzzyStepperSearch
	} = useMemo(() => {
		const mergedDB = createMergedDB(customSteppers);
		return {
			mergedDB,
			exact: initExactSearch(mergedDB),
			fuzzy: initFuzzyStepperSearch(mergedDB)
		};
	}, [customSteppers]);

	const results = useMemo(() => {
		const trimmed = search.trim();

		if (trimmed === '') return mergedDB;

		if (searchMode === 'exact') {
			return exactStepperSearch(trimmed);
		} else if (searchMode === 'fuzzy') {
			return fuzzyStepperSearch(trimmed);
		}

		throw new Error('Invalid search mode, should never happen');
	}, [search, searchMode, mergedDB, exactStepperSearch, fuzzyStepperSearch]);

	return (
		<Dialog>
			<DialogTrigger asChild>
				<Button type="button" className="w-full">
					<BookIcon className="w-5 h-5" />
					<span>Select stepper motors</span>
				</Button>
			</DialogTrigger>
			<DialogContent
				className="sm:max-w-[1280px] max-h-[960px] min-h-[1px] h-full gap-4 flex flex-col"
				showCloseButton={false}
			>
				<DialogClose className="bg-white/20 cursor-pointer rounded border border-border ring-offset-background focus:ring-ring data-[state=open]:bg-accent data-[state=open]:text-muted-foreground absolute top-4 right-4 opacity-70 transition-opacity hover:opacity-100 focus:ring-2 focus:ring-offset-2 focus:outline-hidden disabled:pointer-events-none [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-5">
					<XIcon className="size-5" />
					<span className="sr-only">Close</span>
				</DialogClose>

				<DialogTitle>List of all stepper motors</DialogTitle>

				<div className="flex gap-4">
					<Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search..." />

					<div className="flex flex-row gap-2 items-center justify-between">
						<span>Exact</span>
						<Switch
							onCheckedChange={(v) => setSearchMode(v ? 'exact' : 'fuzzy')}
							checked={searchMode === 'exact'}
						/>
					</div>
				</div>

				<section className="overflow-y-auto space-y-4 flex-1 min-h-[1px] p-2">
					{Array.from(results).map(([brand, steppers]) => (
						<BrandSteppersList key={brand} brand={brand} steppers={steppers} />
					))}
				</section>
			</DialogContent>
		</Dialog>
	);
}

function BrandSteppersList({ brand, steppers }: { brand: string; steppers: Map<string, StepperDefinition> }) {
	if (steppers.size === 0) return null;

	return (
		<section key={brand} className="space-y-2">
			<h2 className="text-xl font-bold">{brand}</h2>
			<div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-2">
				{Array.from(steppers).map(([stepperId, stepper]) => (
					<ToggleableStepperSpec key={stepperId} stepper={stepper} />
				))}
			</div>
		</section>
	);
}

function ToggleableStepperSpec({ stepper }: { stepper: StepperDefinition }) {
	const [selectedSteppers, setSteppers] = useAtom(steppersAtom);

	const isEnabled = selectedSteppers.some((x) => x === stepper);

	return (
		<button
			type="button"
			className="text-left h-full cursor-pointer group focus:outline-none"
			onClick={(e) => {
				e.preventDefault();
				e.stopPropagation();

				setSteppers((previous) =>
					isEnabled ? previous.filter((s) => s.model !== stepper.model) : [...previous, stepper]
				);
			}}
		>
			<Card
				className={cn(
					'h-full transition-all group-focus:ring group-focus:ring-white group-focus:ring-offset-2',
					isEnabled && 'bg-white/5 ring ring-white ring-offset-2'
				)}
			>
				<CardHeader>
					<CardTitle>
						{stepper.brand} {stepper.model}
					</CardTitle>
				</CardHeader>
				<CardContent>
					<StepperSpecs stepper={stepper} />
				</CardContent>
			</Card>
		</button>
	);
}
