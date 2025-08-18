import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { saveImportedConfigurationAtom, showImportWarningAtom } from '@/state/atoms';
import { useAtom, useSetAtom } from 'jotai';
import { SaveIcon, XIcon } from 'lucide-react';

export function ImportWarning() {
	const [showWarning, setShowWarning] = useAtom(showImportWarningAtom);
	const saveConfiguration = useSetAtom(saveImportedConfigurationAtom);

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
			<CardContent>
				<p className="text-orange-800 dark:text-orange-200">
					Changes are not being saved automatically. You can save this configuration permanently if you want
					to keep it.
				</p>
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
