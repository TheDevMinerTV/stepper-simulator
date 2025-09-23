import { AttributionCard } from '@/components/attribution';
import { Graph } from '@/components/graph';
import { ImportWarning } from '@/components/import-warning';
import { DriveSettings, GantrySettings } from '@/components/settings';
import { ShareConfigButton } from '@/components/share-config';
import { StepperSpecsCard } from '@/components/specs';
import { StepperSelection } from '@/components/stepper-management';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { clearUrlConfig, parseConfigFromUrl } from '@/lib/config-sharing';
import type { StepperDefinition } from '@/lib/stepper';
import { loadImportedConfigurationAtom, steppersAtom } from '@/state/atoms';
import { useAtomValue, useSetAtom } from 'jotai';
import { useEffect } from 'react';

export function App() {
	const steppers = useAtomValue(steppersAtom);
	const loadImportedConfig = useSetAtom(loadImportedConfigurationAtom);

	useEffect(() => {
		const configFromUrl = parseConfigFromUrl();
		if (configFromUrl) {
			loadImportedConfig(configFromUrl);
			clearUrlConfig();
		}
	}, [loadImportedConfig]);

	return (
		<div className="flex max-md:flex-col gap-2 p-2 max-w-7xl mx-auto">
			<div className="md:hidden flex flex-col gap-2">
				<ImportWarning />
				<StepperSelection />
			</div>
			<div className="md:hidden flex flex-row md:flex-col gap-2 w-full md:w-1/3">
				<DriveSettings />
				<GantrySettings />
			</div>

			<div className="flex flex-col gap-2 w-full md:w-2/3">
				<Card>
					<CardHeader className="flex justify-between items-center gap-2">
						<CardTitle>Steppers</CardTitle>
						<ShareConfigButton />
					</CardHeader>
					<CardContent className="flex flex-wrap gap-2">
						{steppers.map((stepper: StepperDefinition) => (
							<StepperSpecsCard showRemoveButton key={stepper.model} stepper={stepper} />
						))}
					</CardContent>
				</Card>
				<Graph />
			</div>
			<div className="hidden md:flex flex-row md:flex-col gap-2 w-full md:w-1/3">
				<ImportWarning />

				<StepperSelection />
				<DriveSettings />
				<GantrySettings />

				<AttributionCard className="max-md:hidden" />
			</div>

			<AttributionCard className="block md:hidden" />
		</div>
	);
}
