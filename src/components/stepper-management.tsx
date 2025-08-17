import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
	Select,
	SelectContent,
	SelectGroup,
	SelectItem,
	SelectLabel,
	SelectTrigger,
	SelectValue
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import type {
	Ampere,
	Degree,
	GramSquareCentimeter,
	MilliHenry,
	Millimeter,
	NewtonCentimeter,
	Ohm,
	StepperDefinition
} from '@/lib/stepper';
import { NEMASize } from '@/lib/stepper';
import { STEPPER_DB } from '@/lib/stepper-db';
import { customSteppersAtom, debugAtom, steppersAtom } from '@/state/atoms';
import { useAtom, useAtomValue } from 'jotai';
import { PlusIcon, SaveIcon, SettingsIcon, ShareIcon, TrashIcon } from 'lucide-react';
import { useState } from 'react';

export function StepperSelection() {
	return (
		<Card className="w-full">
			<CardHeader>
				<CardTitle>Stepper Selection</CardTitle>
			</CardHeader>
			<CardContent className="space-y-2">
				<AddStepperWidget />
				<div className="flex items-center gap-2 mb-4">
					<CustomStepperModal />
					<ContributeSteppersButton />
				</div>
				<DebugSettings />
			</CardContent>
		</Card>
	);
}

export function AddStepperWidget() {
	const [steppers, setSteppers] = useAtom(steppersAtom);
	const customSteppers = useAtomValue(customSteppersAtom);

	const [stepper, setStepper] = useState<StepperDefinition | null>(null);

	const isValidSelection = stepper !== null && !steppers.includes(stepper);

	const findStepper = (manufacturer: string, model: string): StepperDefinition | null => {
		const predefinedStepper = STEPPER_DB.get(manufacturer)?.get(model);
		if (predefinedStepper) {
			return predefinedStepper;
		}

		const customStepper = customSteppers.find(
			(s: StepperDefinition) => s.manufacturer === manufacturer && s.model === model
		);
		return customStepper || null;
	};

	return (
		<form
			onSubmit={(ev) => {
				ev.preventDefault();
				if (!isValidSelection) return;

				setSteppers((previous: StepperDefinition[]) => [...previous, stepper]);
			}}
			className="flex flex-row gap-2"
		>
			<Select
				name="stepper"
				value={stepper ? `${stepper.manufacturer}__${stepper.model}` : undefined}
				onValueChange={(value: string) => {
					const [manufacturer, model] = value.split('__');
					const foundStepper = findStepper(manufacturer, model);
					setStepper(foundStepper);
				}}
			>
				<SelectTrigger className="w-full">
					<SelectValue placeholder="Select a stepper" />
				</SelectTrigger>
				<SelectContent>
					{customSteppers.length > 0 && (
						<SelectGroup>
							<SelectLabel>Custom Steppers</SelectLabel>
							{customSteppers.map((stepper: StepperDefinition) => {
								const key = `${stepper.manufacturer}__${stepper.model}`;
								return (
									<SelectItem key={key} value={key} disabled={steppers.includes(stepper)}>
										{stepper.manufacturer} {stepper.model} (Custom)
									</SelectItem>
								);
							})}
						</SelectGroup>
					)}

					{Array.from(STEPPER_DB.entries()).map(([brand, models]) => (
						<SelectGroup key={brand}>
							<SelectLabel>{brand}</SelectLabel>
							{Array.from(models.entries()).map(([model, stepper]) => {
								const key = `${brand}__${model}`;
								return (
									<SelectItem key={key} value={key} disabled={steppers.includes(stepper)}>
										{brand} {model}
									</SelectItem>
								);
							})}
						</SelectGroup>
					))}
				</SelectContent>
			</Select>
			<Button type="submit" size="icon" disabled={!isValidSelection}>
				<PlusIcon className="w-5 h-5" />
			</Button>
		</form>
	);
}

function convertSteppersToCSV(steppers: StepperDefinition[]): string {
	if (steppers.length === 0) return '';

	const formatNumber = (num: number): string => {
		return num.toString().replace('.', ',');
	};

	const csvRows = steppers.map((stepper) => {
		return [
			`${stepper.manufacturer}__${stepper.model}`,
			stepper.manufacturer,
			stepper.model,
			stepper.nemaSize.toString(),
			formatNumber(stepper.bodyLength),
			formatNumber(stepper.stepAngle),
			formatNumber(stepper.ratedCurrent),
			formatNumber(stepper.torque),
			formatNumber(stepper.inductance),
			formatNumber(stepper.resistance),
			formatNumber(stepper.rotorInertia)
		].join('\t');
	});

	return csvRows.join('\n');
}

export function ContributeSteppersButton() {
	const customSteppers = useAtomValue(customSteppersAtom);

	const handleContribute = async () => {
		if (customSteppers.length === 0) {
			alert('No custom steppers to contribute. Create some custom steppers first!');
			return;
		}

		try {
			const csvData = convertSteppersToCSV(customSteppers);

			await navigator.clipboard.writeText(csvData);

			const githubEditUrl = 'https://github.com/TheDevMinerTV/stepper-simulator/edit/main/data/steppers.csv';
			window.open(githubEditUrl, '_blank');

			alert(
				`Copied ${customSteppers.length} custom stepper(s) to clipboard as CSV! Paste them into the GitHub file editor that just opened.`
			);
		} catch (error) {
			console.error('Failed to copy to clipboard:', error);
			alert('Failed to copy to clipboard. Please try again.');
		}
	};

	return (
		<Button
			variant="outline"
			className="flex items-center gap-2 flex-1"
			onClick={handleContribute}
			disabled={customSteppers.length === 0}
		>
			<ShareIcon className="w-4 h-4" />
			Contribute
		</Button>
	);
}

export function CustomStepperModal() {
	const [customSteppers, setCustomSteppers] = useAtom(customSteppersAtom);
	const [open, setOpen] = useState(false);
	const [formData, setFormData] = useState({
		manufacturer: '',
		model: '',
		nemaSize: 17 as (typeof NEMASize)[keyof typeof NEMASize],
		bodyLength: 48,
		stepAngle: 1.8,
		ratedCurrent: 2.0,
		torque: 50,
		inductance: 3.0,
		resistance: 1.5,
		rotorInertia: 68
	});

	const [errors, setErrors] = useState<Record<string, string>>({});

	const validateForm = () => {
		const newErrors: Record<string, string> = {};

		if (!formData.manufacturer.trim()) newErrors.manufacturer = 'Manufacturer is required';
		if (!formData.model.trim()) newErrors.model = 'Model is required';
		if (formData.bodyLength <= 0) newErrors.bodyLength = 'Body length must be positive';
		if (formData.stepAngle <= 0) newErrors.stepAngle = 'Step angle must be positive';
		if (formData.ratedCurrent <= 0) newErrors.ratedCurrent = 'Rated current must be positive';
		if (formData.torque <= 0) newErrors.torque = 'Torque must be positive';
		if (formData.inductance <= 0) newErrors.inductance = 'Inductance must be positive';
		if (formData.resistance <= 0) newErrors.resistance = 'Resistance must be positive';
		if (formData.rotorInertia <= 0) newErrors.rotorInertia = 'Rotor inertia must be positive';

		setErrors(newErrors);
		return Object.keys(newErrors).length === 0;
	};

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();

		if (!validateForm()) return;

		const customStepper: StepperDefinition = {
			manufacturer: formData.manufacturer,
			model: formData.model,
			nemaSize: formData.nemaSize,
			bodyLength: formData.bodyLength as Millimeter,
			stepAngle: formData.stepAngle as Degree,
			ratedCurrent: formData.ratedCurrent as Ampere,
			torque: formData.torque as NewtonCentimeter,
			inductance: formData.inductance as MilliHenry,
			resistance: formData.resistance as Ohm,
			rotorInertia: formData.rotorInertia as GramSquareCentimeter
		};

		setCustomSteppers((previous: StepperDefinition[]) => [...previous, customStepper]);

		// Reset form and close modal
		setFormData({
			manufacturer: '',
			model: '',
			nemaSize: 17 as (typeof NEMASize)[keyof typeof NEMASize],
			bodyLength: 48,
			stepAngle: 1.8,
			ratedCurrent: 2.0,
			torque: 50,
			inductance: 3.0,
			resistance: 1.5,
			rotorInertia: 68
		});
		setErrors({});
		setOpen(false);
	};

	return (
		<Dialog open={open} onOpenChange={setOpen}>
			<DialogTrigger asChild>
				<Button variant="outline" className="flex-1 flex items-center gap-2">
					<SettingsIcon className="w-4 h-4" />
					Custom
				</Button>
			</DialogTrigger>
			<DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
				<DialogHeader>
					<DialogTitle>Custom Steppers</DialogTitle>
				</DialogHeader>

				<div className="space-y-2">
					{/* Custom Steppers */}
					{customSteppers.map((stepper) => (
						<div key={`${stepper.manufacturer}__${stepper.model}`} className="flex flex-row gap-2">
							<span>
								{stepper.manufacturer} {stepper.model}
							</span>

							<Button
								variant="destructive"
								size="icon"
								className="p-0 ml-auto"
								onClick={() => {
									setCustomSteppers((previous: StepperDefinition[]) =>
										previous.filter(
											(s) => s.manufacturer !== stepper.manufacturer && s.model !== stepper.model
										)
									);
								}}
							>
								<TrashIcon className="w-3 h-3" />
							</Button>
						</div>
					))}
				</div>

				<form onSubmit={handleSubmit} className="space-y-4">
					<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
						<div className="space-y-2">
							<Label htmlFor="manufacturer">Manufacturer</Label>
							<Input
								id="manufacturer"
								type="text"
								placeholder="e.g., LDO, FYSETC"
								value={formData.manufacturer}
								onChange={(e) => setFormData({ ...formData, manufacturer: e.target.value })}
								className={errors.manufacturer ? 'border-red-500' : ''}
							/>
							{errors.manufacturer && <span className="text-sm text-red-500">{errors.manufacturer}</span>}
						</div>

						<div className="space-y-2">
							<Label htmlFor="model">Model</Label>
							<Input
								id="model"
								type="text"
								placeholder="e.g., 42STH48-2004AC"
								value={formData.model}
								onChange={(e) => setFormData({ ...formData, model: e.target.value })}
								className={errors.model ? 'border-red-500' : ''}
							/>
							{errors.model && <span className="text-sm text-red-500">{errors.model}</span>}
						</div>

						<div className="space-y-2">
							<Label htmlFor="nemaSize">NEMA Size</Label>
							<Select
								value={formData.nemaSize.toString()}
								onValueChange={(value) =>
									setFormData({
										...formData,
										nemaSize: parseInt(value) as (typeof NEMASize)[keyof typeof NEMASize]
									})
								}
							>
								<SelectTrigger className="w-full">
									<SelectValue />
								</SelectTrigger>
								<SelectContent>
									{Object.values(NEMASize).map((size) => (
										<SelectItem key={size} value={size.toString()}>
											NEMA {size}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>

						<div className="space-y-2">
							<Label htmlFor="bodyLength">Body Length (mm)</Label>
							<Input
								id="bodyLength"
								type="number"
								step="0.1"
								min="0"
								value={formData.bodyLength}
								onChange={(e) => setFormData({ ...formData, bodyLength: e.target.valueAsNumber })}
								className={errors.bodyLength ? 'border-red-500' : ''}
							/>
							{errors.bodyLength && <span className="text-sm text-red-500">{errors.bodyLength}</span>}
						</div>

						<div className="space-y-2">
							<Label htmlFor="stepAngle">Step Angle (°)</Label>
							<Input
								id="stepAngle"
								type="number"
								step="0.1"
								min="0"
								value={formData.stepAngle}
								onChange={(e) => setFormData({ ...formData, stepAngle: e.target.valueAsNumber })}
								className={errors.stepAngle ? 'border-red-500' : ''}
							/>
							{errors.stepAngle && <span className="text-sm text-red-500">{errors.stepAngle}</span>}
						</div>

						<div className="space-y-2">
							<Label htmlFor="ratedCurrent">Rated Current (A)</Label>
							<Input
								id="ratedCurrent"
								type="number"
								step="0.01"
								min="0"
								value={formData.ratedCurrent}
								onChange={(e) => setFormData({ ...formData, ratedCurrent: e.target.valueAsNumber })}
								className={errors.ratedCurrent ? 'border-red-500' : ''}
							/>
							{errors.ratedCurrent && <span className="text-sm text-red-500">{errors.ratedCurrent}</span>}
						</div>

						<div className="space-y-2">
							<Label htmlFor="torque">Torque (Ncm)</Label>
							<Input
								id="torque"
								type="number"
								step="0.1"
								min="0"
								value={formData.torque}
								onChange={(e) => setFormData({ ...formData, torque: e.target.valueAsNumber })}
								className={errors.torque ? 'border-red-500' : ''}
							/>
							{errors.torque && <span className="text-sm text-red-500">{errors.torque}</span>}
						</div>

						<div className="space-y-2">
							<Label htmlFor="inductance">Inductance (mH)</Label>
							<Input
								id="inductance"
								type="number"
								step="0.1"
								min="0"
								value={formData.inductance}
								onChange={(e) => setFormData({ ...formData, inductance: e.target.valueAsNumber })}
								className={errors.inductance ? 'border-red-500' : ''}
							/>
							{errors.inductance && <span className="text-sm text-red-500">{errors.inductance}</span>}
						</div>

						<div className="space-y-2">
							<Label htmlFor="resistance">Resistance (Ω)</Label>
							<Input
								id="resistance"
								type="number"
								step="0.01"
								min="0"
								value={formData.resistance}
								onChange={(e) => setFormData({ ...formData, resistance: e.target.valueAsNumber })}
								className={errors.resistance ? 'border-red-500' : ''}
							/>
							{errors.resistance && <span className="text-sm text-red-500">{errors.resistance}</span>}
						</div>

						<div className="space-y-2">
							<Label htmlFor="rotorInertia">Rotor Inertia (gcm²)</Label>
							<Input
								id="rotorInertia"
								type="number"
								step="0.1"
								min="0"
								value={formData.rotorInertia}
								onChange={(e) => setFormData({ ...formData, rotorInertia: e.target.valueAsNumber })}
								className={errors.rotorInertia ? 'border-red-500' : ''}
							/>
							{errors.rotorInertia && <span className="text-sm text-red-500">{errors.rotorInertia}</span>}
						</div>
					</div>

					<div className="flex justify-end gap-2 pt-4">
						<Button type="button" variant="outline" onClick={() => setOpen(false)}>
							Cancel
						</Button>
						<Button type="submit" className="flex items-center gap-2">
							<SaveIcon className="w-4 h-4" />
							Save Custom Stepper
						</Button>
					</div>
				</form>
			</DialogContent>
		</Dialog>
	);
}

export function DebugSettings() {
	const [debug, setDebug] = useAtom(debugAtom);

	return (
		<div className="flex flex-row gap-2 items-center justify-between">
			<span>Debug Mode</span>
			<Switch checked={debug} onCheckedChange={setDebug} />
		</div>
	);
}
