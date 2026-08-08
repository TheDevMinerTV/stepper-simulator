import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { calculateBeltPitch } from '@/lib/formulas';
import { recommendMoves, resolvePathLength } from '@/lib/recommender';
import type { Millimeter, MillimetersPerSecondSquared, Percent } from '@/lib/stepper';
import {
	currentDebugAtom,
	currentDriveSettingsAtom,
	currentGantrySettingsAtom,
	steppersAtom,
	type GantrySettings
} from '@/state/atoms';
import { useAtom, useAtomValue } from 'jotai';
import { ArrowRightToLineIcon } from 'lucide-react';
import { useMemo, type ReactNode } from 'react';

const PATH_LENGTH_PRESETS = [
	{ key: 'short', label: '25 mm', of: () => 25 },
	{ key: 'half-bed', label: '½ bed', of: (bedSize: number) => bedSize / 2 },
	{ key: 'bed', label: 'Bed', of: (bedSize: number) => bedSize },
	{ key: 'diagonal', label: 'Diagonal', of: (bedSize: number) => bedSize * Math.SQRT2 }
] as const;

/** Presets are a shortcut for the input, not a mode: a preset is "active" while the number matches */
function matchingPreset(gantrySettings: GantrySettings) {
	const pathLength = resolvePathLength(gantrySettings);

	return (
		PATH_LENGTH_PRESETS.find((preset) => Math.abs(preset.of(gantrySettings.bedSize) - pathLength) < 0.5)?.key ?? ''
	);
}

function formatMoveTime(seconds: number) {
	return seconds < 1 ? `${(seconds * 1000).toFixed(0)} ms` : `${seconds.toFixed(2)} s`;
}

/** Units and secondary readings live under the number, so the columns stay narrow enough not to scroll */
function UnitHint({ children }: { children: ReactNode }) {
	return <div className="text-xs font-normal text-muted-foreground">{children}</div>;
}

export function MoveRecommender() {
	const [gantrySettings, setGantrySettings] = useAtom(currentGantrySettingsAtom);
	const driveSettings = useAtomValue(currentDriveSettingsAtom);
	const steppers = useAtomValue(steppersAtom);
	const debug = useAtomValue(currentDebugAtom);

	const pathLength = resolvePathLength(gantrySettings);
	const beltPitchMm = calculateBeltPitch(gantrySettings);
	const mmsToRpm = (mms: number) => (mms * 60) / beltPitchMm;

	const results = useMemo(
		() =>
			recommendMoves(driveSettings, gantrySettings, steppers).sort((a, b) => {
				if (!a.recommendation) return 1;
				if (!b.recommendation) return -1;
				return a.recommendation.moveTime - b.recommendation.moveTime;
			}),
		[driveSettings, gantrySettings, steppers]
	);

	return (
		<Card className="pt-0">
			<CardHeader className="flex flex-col items-start gap-2 space-y-0 border-b py-5 sm:flex-row sm:items-center">
				<div className="grid flex-1 gap-1">
					<CardTitle>Move Recommender</CardTitle>
					<CardDescription>
						Fastest velocity/acceleration pair for a {Math.round(pathLength)} mm move, rest to rest
					</CardDescription>
				</div>
				<div className="flex items-center gap-2">
					<Input
						type="number"
						min={1}
						className="w-24"
						value={Math.round(pathLength)}
						onChange={(e) => {
							const v = e.target.valueAsNumber;
							setGantrySettings({
								...gantrySettings,
								movePathLength: Number.isFinite(v) ? (v as Millimeter) : null
							});
						}}
					/>
					<span>mm</span>
					<Input
						type="number"
						min={0}
						max={99}
						className="w-20"
						value={gantrySettings.safetyMarginPercent}
						onChange={(e) => {
							const v = e.target.valueAsNumber;
							if (Number.isNaN(v)) return;
							setGantrySettings({ ...gantrySettings, safetyMarginPercent: v as Percent });
						}}
					/>
					<span>% margin</span>
				</div>
			</CardHeader>
			<CardContent className="space-y-4">
				<ToggleGroup
					type="single"
					variant="outline"
					size="sm"
					value={matchingPreset(gantrySettings)}
					onValueChange={(value) => {
						const preset = PATH_LENGTH_PRESETS.find((p) => p.key === value);
						if (!preset) return;

						setGantrySettings({
							...gantrySettings,
							// Half the bed is the default, so following the bed size is the more useful state
							movePathLength:
								preset.key === 'half-bed'
									? null
									: (Math.round(preset.of(gantrySettings.bedSize)) as Millimeter)
						});
					}}
				>
					{PATH_LENGTH_PRESETS.map((preset) => (
						<ToggleGroupItem key={preset.key} value={preset.key}>
							{preset.label}
						</ToggleGroupItem>
					))}
				</ToggleGroup>

				{steppers.length === 0 ? (
					<div>No steppers selected</div>
				) : (
					// The table container is `h-full`, which leaves the horizontal scrollbar stranded far
					// below the last row in a card that is taller than its table
					<div className="[&_[data-slot=table-container]]:h-auto">
						<Table>
							<TableHeader>
								<TableRow>
									<TableHead>Stepper</TableHead>
									<TableHead className="text-right">
										Velocity
										<UnitHint>mm/s</UnitHint>
									</TableHead>
									<TableHead className="text-right">
										Accel
										<UnitHint>mm/s²</UnitHint>
									</TableHead>
									<TableHead className="text-right">
										Time
										<UnitHint>rest to rest</UnitHint>
									</TableHead>
									<TableHead className="text-right">
										v at set accel
										<UnitHint>{Math.round(gantrySettings.acceleration)} mm/s²</UnitHint>
									</TableHead>
									<TableHead className="w-9" />
								</TableRow>
							</TableHeader>
							<TableBody>
								{results.map(({ stepper, recommendation }) => (
									<TableRow key={`${stepper.brand}|${stepper.model}`}>
										<TableCell className="max-w-56">
											<div className="truncate" title={`${stepper.brand} ${stepper.model}`}>
												{stepper.brand} {stepper.model}
											</div>
											{recommendation && (
												<span
													className="text-[10px] uppercase tracking-wide text-muted-foreground border border-muted-foreground/40 rounded px-1 py-px leading-none"
													title={
														recommendation.pathLimited
															? 'The move ends before the motor runs out of speed'
															: 'A longer move would not go any faster'
													}
												>
													{recommendation.pathLimited ? 'path-limited' : 'motor-limited'}
												</span>
											)}
										</TableCell>
										{recommendation === null ? (
											<TableCell colSpan={5} className="text-right text-muted-foreground">
												cannot move this gantry
											</TableCell>
										) : (
											<>
												<TableCell className="text-right font-mono tabular-nums">
													{Math.round(recommendation.velocity)}
													<UnitHint>
														{Math.round(mmsToRpm(recommendation.velocity))} RPM
													</UnitHint>
												</TableCell>
												<TableCell className="text-right font-mono tabular-nums">
													{Math.round(recommendation.acceleration)}
													{debug && (
														<UnitHint>
															{Math.round(recommendation.maxAcceleration)} standstill
														</UnitHint>
													)}
												</TableCell>
												<TableCell className="text-right font-mono tabular-nums">
													{formatMoveTime(recommendation.moveTime)}
												</TableCell>
												<TableCell className="text-right font-mono tabular-nums">
													{recommendation.velocityAtConfiguredAcceleration === null
														? 'n/a'
														: Math.round(recommendation.velocityAtConfiguredAcceleration)}
												</TableCell>
												<TableCell className="text-right">
													<Button
														type="button"
														variant="ghost"
														size="icon"
														className="size-7"
														title="Use this acceleration in Gantry Settings"
														disabled={
															Math.round(recommendation.acceleration) ===
															Math.round(gantrySettings.acceleration)
														}
														onClick={() =>
															setGantrySettings({
																...gantrySettings,
																acceleration: Math.round(
																	recommendation.acceleration
																) as MillimetersPerSecondSquared
															})
														}
													>
														<ArrowRightToLineIcon />
													</Button>
												</TableCell>
											</>
										)}
									</TableRow>
								))}
							</TableBody>
						</Table>
					</div>
				)}

				<p className="text-xs text-muted-foreground">
					<span className="font-medium">path-limited</span> means the move ends before the motor runs out of
					speed, <span className="font-medium">motor-limited</span> that a longer move would not go any
					faster. Assumes one motor per axis, a rest-to-rest trapezoid with no junction velocity or jerk, and
					no friction beyond the modelled load. {gantrySettings.safetyMarginPercent}% of the computed
					acceleration ceiling is held back for what the model does not cover (belt compliance, resonance,
					mid-band losses).
				</p>
			</CardContent>
		</Card>
	);
}
