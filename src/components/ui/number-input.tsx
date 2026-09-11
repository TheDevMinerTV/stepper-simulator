import * as React from 'react';

import { Input } from '@/components/ui/input';

type NumberInputProps = Omit<React.ComponentProps<typeof Input>, 'type' | 'value' | 'onChange'> & {
	/** The committed value. `null` renders an empty field (for optional settings). */
	value: number | null;
	/** Called only with finite numbers, or with `null` when `allowEmpty` is set and the field is cleared */
	onValueChange: (value: number | null) => void;
	/** When set, clearing the field commits `null` instead of being treated as unfinished input */
	allowEmpty?: boolean;
};

const toDraft = (value: number | null) => (value === null ? '' : String(value));

/**
 * `<input type="number">` that never lets `NaN` escape.
 *
 * `valueAsNumber` is `NaN` whenever the field is empty or half-typed ("1.", "-"), and a bare
 * controlled input would push that straight into the settings atoms, the share link and every
 * formula downstream. This keeps the raw text as a local draft, commits only finite values, and
 * snaps the draft back to the last committed value on blur if what's left isn't a number.
 */
function NumberInput({ value, onValueChange, allowEmpty = false, onBlur, ...props }: NumberInputProps) {
	const [draft, setDraft] = React.useState(() => toDraft(value));

	// Follow external changes (imported config, unit toggle) without clobbering an in-progress edit
	// that already parses to the current value, like "1." while value is 1.
	React.useEffect(() => {
		const parsed = draft.trim() === '' ? null : Number(draft);
		if (parsed !== value) setDraft(toDraft(value));
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [value]);

	return (
		<Input
			{...props}
			type="number"
			value={draft}
			onChange={(e) => {
				const text = e.target.value;
				setDraft(text);
				if (text.trim() === '') {
					if (allowEmpty) onValueChange(null);
					return;
				}
				const parsed = e.target.valueAsNumber;
				if (Number.isFinite(parsed)) onValueChange(parsed);
			}}
			onBlur={(e) => {
				const parsed = draft.trim() === '' ? null : Number(draft);
				const valid = parsed === null ? allowEmpty : Number.isFinite(parsed);
				if (!valid) setDraft(toDraft(value));
				onBlur?.(e);
			}}
		/>
	);
}

export { NumberInput };
