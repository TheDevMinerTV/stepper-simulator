import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { saveImportedConfigurationAtom, showImportWarningAtom, unresolvedImportedSteppersAtom } from '@/state/atoms';
import { useAtom, useAtomValue, useSetAtom } from 'jotai';
import { SaveIcon, XIcon } from 'lucide-react';

export function ImportWarning() {
	const [showWarning, setShowWarning] = useAtom(showImportWarningAtom);
	const saveConfiguration = useSetAtom(saveImportedConfigurationAtom);
	const unresolvedSteppers = useAtomValue(unresolvedImportedSteppersAtom);

	if (!showWarning) {
		return null;
	}

	const handleSave = () => {
		saveConfiguration();
	};

	const handleDismiss = () => {
		setShowWarning(false);
	};

	return (
		<Card className="w-full border-orange-200 bg-orange-50 dark:border-orange-800 dark:bg-orange-950">
			<CardHeader>
				<CardTitle>Imported Configuration</CardTitle>
			</CardHeader>
			<CardContent className="flex flex-col gap-2">
				<p className="text-orange-800 dark:text-orange-200">
					Changes are not being saved automatically. You can save this configuration permanently if you want
					to keep it.
				</p>
				{unresolvedSteppers.length > 0 && (
					<p className="text-orange-800 dark:text-orange-200">
						{unresolvedSteppers.length === 1 ? 'One stepper' : `${unresolvedSteppers.length} steppers`} in
						this link {unresolvedSteppers.length === 1 ? 'is' : 'are'} not in the database anymore and{' '}
						{unresolvedSteppers.length === 1 ? 'was' : 'were'} skipped:{' '}
						{unresolvedSteppers.map((id) => id.replace('|', ' ')).join(', ')}
					</p>
				)}
			</CardContent>
			<CardFooter className="flex justify-end gap-2">
				<Button onClick={handleSave} size="sm" className="gap-2">
					<SaveIcon className="w-4 h-4" />
					Save
				</Button>
				<Button onClick={handleDismiss} variant="secondary" size="sm" className="gap-2">
					<XIcon className="w-4 h-4" />
					Dismiss
				</Button>
			</CardFooter>
		</Card>
	);
}
