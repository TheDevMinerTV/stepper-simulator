import { StepperSpecs } from '@/components/specs.tsx';
import { Button } from '@/components/ui/button.tsx';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card.tsx';
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';
import { STEPPER_DB } from '@/lib/stepper-db.ts';
import type { StepperDefinition } from '@/lib/stepper.ts';
import { cn } from '@/lib/utils.ts';
import { steppersAtom } from '@/state/atoms.ts';
import { useAtom } from 'jotai';
import { BookIcon } from 'lucide-react';

export function StepperList() {
	return (
		<Dialog>
			<DialogTrigger asChild>
				<Button type="button" size="icon">
					<BookIcon className="w-5 h-5" />
				</Button>
			</DialogTrigger>
			<DialogContent className="sm:max-w-[1280px] max-h-[960px] min-h-[1px] h-full overflow-y-auto space-y-2">
				{Array.from(STEPPER_DB.entries()).map(([brand, steppers]) => (
					<section className="space-y-2">
						<h2 className="text-xl font-bold">{brand}</h2>
						<div className="flex flex-wrap gap-2" key={brand}>
							{Array.from(steppers.entries()).map(([stepperId, stepper]) => (
								<ToggleableStepperSpec key={stepperId} stepper={stepper} />
							))}
						</div>
					</section>
				))}
			</DialogContent>
		</Dialog>
	);
}

function ToggleableStepperSpec({ stepper }: { stepper: StepperDefinition }) {
	const [selectedSteppers, setSteppers] = useAtom(steppersAtom);

	const isEnabled = selectedSteppers.some((x) => x === stepper);

	return (
		<button
			type="button"
			className="w-full sm:w-[calc(50%-0.25rem)] xl:w-[calc(33.333%-0.5rem)] text-left"
			onClick={(e) => {
				e.preventDefault();
				e.stopPropagation();

				setSteppers((previous) =>
					isEnabled ? previous.filter((s) => s.model !== stepper.model) : [...previous, stepper]
				);
			}}
		>
			<Card className={cn(isEnabled && 'ring ring-white ring-offset-2')}>
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
