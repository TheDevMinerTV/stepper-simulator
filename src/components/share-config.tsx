import { Button } from '@/components/ui/button';
import { getCurrentConfigurationAtom, type ShareableConfiguration } from '@/state/atoms';
import { useAtomValue } from 'jotai';
import { LinkIcon } from 'lucide-react';
import { useState } from 'react';

export function ShareConfigButton() {
	const currentConfig = useAtomValue(getCurrentConfigurationAtom);
	const [copied, setCopied] = useState(false);

	const generateShareUrl = (config: ShareableConfiguration): string => {
		const baseUrl = window.location.origin + window.location.pathname;
		const configString = btoa(JSON.stringify(config));
		return `${baseUrl}?config=${encodeURIComponent(configString)}`;
	};

	const handleShare = async () => {
		const shareUrl = generateShareUrl(currentConfig);

		await navigator.clipboard.writeText(shareUrl);
		setCopied(true);
		setTimeout(() => setCopied(false), 2000);
	};

	return (
		<Button onClick={handleShare} variant="outline" size="sm" className="gap-2">
			<LinkIcon className="w-4 h-4" />
			{copied ? 'Copied!' : 'Share Configuration'}
		</Button>
	);
}
