import { AttributionCard } from '@/components/attribution';
import { Graph } from '@/components/graph';
import { AddStepperCard, DebugSettings, DriveSettings, GantrySettings } from '@/components/settings';
import { StepperSpecs } from '@/components/specs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { steppersAtom } from '@/state/atoms';
import { useAtomValue } from 'jotai';

export function App() {
	const steppers = useAtomValue(steppersAtom);

	return (
		<div className="flex max-md:flex-col gap-2 p-2 max-w-7xl mx-auto">
			<div className="md:hidden flex flex-row md:flex-col gap-2 w-full md:w-1/3">
				<DriveSettings />
				<GantrySettings />
			</div>

			<div className="flex flex-col gap-2 w-full md:w-2/3">
				<Card>
					<CardHeader className="flex flex-row items-center justify-between">
						<CardTitle>Steppers</CardTitle>
						<div className="flex flex-row gap-4 items-center">
							<AddStepperCard />
							<DebugSettings />
						</div>
					</CardHeader>
					<CardContent className="flex flex-wrap gap-2">
						{steppers.map((stepper) => (
							<StepperSpecs key={stepper.model} stepper={stepper} />
						))}
					</CardContent>
				</Card>
				<Graph />
			</div>
			<div className="hidden md:flex flex-row md:flex-col gap-2 w-full md:w-1/3">
				<DriveSettings />
				<GantrySettings />

				<AttributionCard className="max-md:hidden" />
			</div>

			<AttributionCard className="block md:hidden" />
		</div>
	);
}
