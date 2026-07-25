import {
	Button,
	Card,
	CardContent,
	Collapsible,
	CollapsibleContent,
	CollapsibleTrigger,
	Input,
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
	Switch,
} from "@/components";
import { Typography } from "@/components/typography";
import type { Condition, Step } from "@shared/macro-types";
import { ArrowDown, ArrowUp, ChevronDown, GitBranch, Trash2 } from "lucide-react";
import { useState } from "react";
import { AddStepMenu } from "./add-step-menu";
import { ImagePickerField } from "./image-picker-field";
import { PointPickerButton } from "./step-row";
import { StepList } from "./step-list";

type IfStep = Extract<Step, { type: "if" }>;

type IfStepRowProps = {
	step: IfStep;
	index: number;
	total: number;
	onChange: (step: Step) => void;
	onRemove: () => void;
	onMoveUp: () => void;
	onMoveDown: () => void;
};

const DEFAULT_PIXEL_CONDITION: Condition = { kind: "pixelColor", x: 0, y: 0, color: "#000000", tolerance: 10 };
const DEFAULT_IMAGE_CONDITION: Condition = { kind: "imageFound", imagePath: "", tolerance: 0.9 };

type BranchProps = {
	title: string;
	steps: Step[];
	onChange: (steps: Step[]) => void;
};

const Branch = ({ title, steps, onChange }: BranchProps) => {
	const [open, setOpen] = useState(true);
	return (
		<Collapsible open={open} onOpenChange={setOpen} className="border-border rounded-lg border pl-3">
			<div className="flex items-center justify-between py-2 pr-1">
				<CollapsibleTrigger asChild>
					<button type="button" className="flex items-center gap-1.5">
						<ChevronDown className={`text-muted-foreground size-3.5 transition-transform ${open ? "" : "-rotate-90"}`} />
						<Typography variant="body-sm" className="font-medium">
							{title}
						</Typography>
					</button>
				</CollapsibleTrigger>
				<AddStepMenu onAdd={(step) => onChange([...steps, step])} />
			</div>
			<CollapsibleContent className="pb-3 pr-3">
				<StepList steps={steps} onChange={onChange} emptyMessage="Nenhum passo neste ramo." />
			</CollapsibleContent>
		</Collapsible>
	);
};

export const IfStepRow = ({ step, index, total, onChange, onRemove, onMoveUp, onMoveDown }: IfStepRowProps) => {
	const { condition } = step;

	const updateCondition = (next: Condition) => onChange({ ...step, condition: next });

	return (
		<Card size="sm">
			<CardContent className="flex flex-col gap-3">
				<div className="flex items-center gap-3">
					<span className="bg-muted flex size-9 shrink-0 items-center justify-center rounded-full">
						<GitBranch className="text-muted-foreground size-4" />
					</span>
					<span className="text-muted-foreground flex-1 text-sm">Condição (SE)</span>
					<div className="flex shrink-0 items-center gap-1">
						<Button type="button" variant="ghost" size="icon-xs" disabled={index === 0} onClick={onMoveUp}>
							<ArrowUp className="size-3.5" />
						</Button>
						<Button type="button" variant="ghost" size="icon-xs" disabled={index === total - 1} onClick={onMoveDown}>
							<ArrowDown className="size-3.5" />
						</Button>
						<Button type="button" variant="ghost" size="icon-xs" onClick={onRemove}>
							<Trash2 className="text-destructive size-3.5" />
						</Button>
					</div>
				</div>

				<div className="flex flex-wrap items-center gap-2 pl-12">
					<Select
						value={condition.kind}
						onValueChange={(kind) => updateCondition(kind === "pixelColor" ? DEFAULT_PIXEL_CONDITION : DEFAULT_IMAGE_CONDITION)}
					>
						<SelectTrigger size="sm" className="w-40">
							<SelectValue />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="pixelColor">Cor de pixel</SelectItem>
							<SelectItem value="imageFound">Imagem na tela</SelectItem>
						</SelectContent>
					</Select>

					{condition.kind === "pixelColor" && (
						<>
							<Input
								inputSize="sm"
								type="number"
								className="w-20"
								value={condition.x}
								onChange={(e) => updateCondition({ ...condition, x: Number(e.target.value) })}
							/>
							<Input
								inputSize="sm"
								type="number"
								className="w-20"
								value={condition.y}
								onChange={(e) => updateCondition({ ...condition, y: Number(e.target.value) })}
							/>
							<PointPickerButton onPick={(point) => updateCondition({ ...condition, x: point.x, y: point.y })} />
							<input
								type="color"
								className="border-border size-8 rounded-md border p-0.5"
								value={condition.color}
								onChange={(e) => updateCondition({ ...condition, color: e.target.value })}
							/>
							<div className="flex items-center gap-1">
								<Input
									inputSize="sm"
									type="number"
									min={0}
									max={100}
									className="w-16"
									value={condition.tolerance}
									onChange={(e) => updateCondition({ ...condition, tolerance: Number(e.target.value) })}
								/>
								<span className="text-muted-foreground text-xs">% tolerância</span>
							</div>
						</>
					)}

					{condition.kind === "imageFound" && (
						<>
							<ImagePickerField
								imagePath={condition.imagePath}
								onChange={(imagePath) => updateCondition({ ...condition, imagePath })}
							/>
							<div className="flex items-center gap-1">
								<Input
									inputSize="sm"
									type="number"
									min={0}
									max={1}
									step={0.01}
									className="w-20"
									value={condition.tolerance}
									onChange={(e) => updateCondition({ ...condition, tolerance: Number(e.target.value) })}
								/>
								<span className="text-muted-foreground text-xs">confiança</span>
							</div>
						</>
					)}

					<Switch
						size="sm"
						label="Negar"
						checked={condition.negate ?? false}
						onCheckedChange={(negate) => updateCondition({ ...condition, negate })}
					/>
				</div>

				<div className="flex flex-col gap-2 pl-12">
					<Branch title="Então" steps={step.then} onChange={(next) => onChange({ ...step, then: next })} />
					<Branch title="Senão" steps={step.else} onChange={(next) => onChange({ ...step, else: next })} />
				</div>
			</CardContent>
		</Card>
	);
};
