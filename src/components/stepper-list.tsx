import { StepperSpecs } from '@/components/specs.tsx';
import { Button } from '@/components/ui/button.tsx';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card.tsx';
import { Dialog, DialogClose, DialogContent, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input.tsx';
import { STEPPER_DB } from '@/lib/stepper-db.ts';
import type { StepperDefinition } from '@/lib/stepper.ts';
import { cn } from '@/lib/utils.ts';
import { steppersAtom } from '@/state/atoms.ts';
import { useAtom } from 'jotai';
import { BookIcon, XIcon } from 'lucide-react';
import { useMemo, useState } from 'react';

export function StepperList() {
	const [search, setSearch] = useState('');

	const trimmedSearch = search.trim();

	return (
		<Dialog>
			<DialogTrigger asChild>
				<Button type="button" size="icon">
					<BookIcon className="w-5 h-5" />
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

				<Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search..." />

				<section className="overflow-y-auto space-y-4 flex-1 min-h-[1px] p-2">
					{Array.from(STEPPER_DB.entries()).map(([brand, steppers]) => (
						<BrandSteppersList key={brand} brand={brand} search={trimmedSearch} steppers={steppers} />
					))}
				</section>
			</DialogContent>
		</Dialog>
	);
}

function BrandSteppersList({
	brand,
	steppers,
	search
}: {
	brand: string;
	steppers: Map<string, StepperDefinition>;
	search: string;
}) {
	const filteredSteppers = useMemo(() => {
		console.log('refiltering');

		const filteredSteppers = Array.from(steppers.entries());

		if (search === '') return filteredSteppers;

		const lowercaseSearch = search.toLowerCase();

		return filteredSteppers.filter(
			([_, stepper]) =>
				brand.toLowerCase().includes(lowercaseSearch) || stepper.model.toLowerCase().includes(lowercaseSearch)
		);
	}, [steppers, search, brand]);

	if (filteredSteppers.length === 0) return null;

	return (
		<section key={brand} className="space-y-2">
			<h2 className="text-xl font-bold">{brand}</h2>
			<div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-2">
				{filteredSteppers.map(([stepperId, stepper]) => (
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
			className="text-left h-full cursor-pointer"
			onClick={(e) => {
				e.preventDefault();
				e.stopPropagation();

				setSteppers((previous) =>
					isEnabled ? previous.filter((s) => s.model !== stepper.model) : [...previous, stepper]
				);
			}}
		>
			<Card className={cn('h-full', isEnabled && 'bg-white/5 transition-all ring ring-white ring-offset-2')}>
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
