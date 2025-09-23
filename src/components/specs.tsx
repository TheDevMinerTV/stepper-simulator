import { Button } from '@/components/ui/button.tsx';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card.tsx';
import { Separator } from '@/components/ui/separator';
import { calculatePowerAtDriveCurrent, calculateTorqueRotor } from '@/lib/formulas';
import type { StepperDefinition } from '@/lib/stepper';
import { debugAtom, driveSettingsAtom, gantrySettingsAtom, maxPowerAtom, steppersAtom } from '@/state/atoms';
import { useAtomValue, useSetAtom } from 'jotai';
import {
	BicepsFlexedIcon,
	CircuitBoardIcon,
	MessageSquareIcon,
	OmegaIcon,
	RedoDotIcon,
	RulerDimensionLineIcon,
	TriangleRightIcon,
	XIcon,
	ZapIcon
} from 'lucide-react';

export function StepperSpecs({ stepper }: { stepper: StepperDefinition }) {
	const debug = useAtomValue(debugAtom);
	const driveSettings = useAtomValue(driveSettingsAtom);
	const gantrySettings = useAtomValue(gantrySettingsAtom);
	const maxPower = useAtomValue(maxPowerAtom);

	const maxCurrentAtSpecifiedPower = Math.sqrt(maxPower / 2 / stepper.resistance);
	const driveCurrent = Math.min(
		driveSettings.maxDriveCurrent,
		driveSettings.maxDrivePercent * stepper.ratedCurrent,
		maxCurrentAtSpecifiedPower
	);
	const torqueRotor = calculateTorqueRotor(gantrySettings, stepper);
	const powerAtDriveCurrent = calculatePowerAtDriveCurrent(driveCurrent, stepper);

	return (
		<div className="flex flex-col gap-2">
			<div className="flex items-center gap-2">
				<RulerDimensionLineIcon />
				<span>
					NEMA {stepper.nemaSize} x {stepper.bodyLength} mm
				</span>
			</div>
			<div className="flex items-center gap-2">
				<TriangleRightIcon />
				<span>{stepper.stepAngle}°</span>
			</div>
			<div className="flex items-center gap-2">
				<ZapIcon />
				<span>{stepper.ratedCurrent.toFixed(1)} A</span>
			</div>
			<div className="flex items-center gap-2">
				<BicepsFlexedIcon />
				<span>{stepper.torque.toFixed(1)} Ncm</span>
			</div>
			<div className="flex items-center gap-2">
				<CircuitBoardIcon />
				<span>{stepper.inductance.toFixed(1)} mH</span>
			</div>
			<div className="flex items-center gap-2">
				<OmegaIcon />
				<span>{stepper.resistance.toFixed(1)} Ω</span>
			</div>
			<div className="flex items-center gap-2">
				<RedoDotIcon />
				<span>{stepper.rotorInertia.toFixed(1)} gcm²</span>
			</div>
			{stepper.comments.length > 0 && (
				<div className="flex">
					<MessageSquareIcon />
					<ul className="list-disc list-inside">
						{stepper.comments.map((comment) => (
							<li className="pl-4" key={comment}>
								{comment}
							</li>
						))}
					</ul>
				</div>
			)}

			{debug && (
				<>
					<Separator />

					<div className="flex items-center gap-2">
						<span>max current at specified power</span>
						<span>{maxCurrentAtSpecifiedPower.toFixed(2)} A</span>
					</div>
					<div className="flex items-center gap-2">
						<span>drive current</span>
						<span>{driveCurrent.toFixed(2)} A</span>
					</div>
					<div className="flex items-center gap-2">
						<span>torque rotor</span>
						<span>{torqueRotor.toFixed(2)} Ncm</span>
					</div>
					<div className="flex items-center gap-2">
						<span>power at drive current</span>
						<span>{powerAtDriveCurrent.toFixed(2)} W</span>
					</div>
				</>
			)}
		</div>
	);
}

export function StepperSpecsCard({
	stepper,
	showRemoveButton = false
}: {
	stepper: StepperDefinition;
	showRemoveButton?: boolean;
}) {
	const setSteppers = useSetAtom(steppersAtom);

	return (
		<Card className="w-full sm:w-[calc(50%-0.25rem)] xl:w-[calc(33.333%-0.5rem)]">
			<CardHeader>
				<CardTitle>
					{stepper.brand} {stepper.model}
				</CardTitle>
			</CardHeader>
			<CardContent className="flex-1">
				<StepperSpecs stepper={stepper} />
			</CardContent>
			<CardFooter className="flex justify-end gap-2">
				{showRemoveButton && (
					<Button
						type="button"
						variant="destructive"
						size="icon"
						onClick={() => setSteppers((previous) => previous.filter((s) => s.model !== stepper.model))}
					>
						<XIcon />
					</Button>
				)}
			</CardFooter>
		</Card>
	);
}
