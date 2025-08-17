import { Graph } from "@/components/graph";
import {
	AddStepperCard,
	DriveSettings,
	GantrySettings,
} from "@/components/settings";
import { StepperSpecs } from "@/components/specs";
import {
	Card,
	CardContent,
	CardHeader,
	CardTitle
} from "@/components/ui/card";
import {
	steppersAtom
} from "@/state/atoms";
import { useAtomValue } from "jotai";

export function App() {
	const steppers = useAtomValue(steppersAtom);

	return (
		<div className="flex gap-2 p-2 max-w-7xl mx-auto">
			<div className="flex flex-col gap-2 w-2/3">
				<Card>
					<CardHeader>
						<CardTitle>Steppers</CardTitle>
					</CardHeader>
					<CardContent className="flex flex-wrap gap-2">
						{steppers.map((stepper) => (
							<StepperSpecs key={stepper.model} stepper={stepper} />
						))}
					</CardContent>
				</Card>
				<Graph />
			</div>
			<div className="flex flex-col gap-2 w-1/3">
				<AddStepperCard />
				<DriveSettings />
				<GantrySettings />
			</div>
		</div>
	);
}
