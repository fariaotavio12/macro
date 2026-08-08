import {
	Button,
	Card,
	CardContent,
	HotkeyCapture,
	Input,
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components";
import { cn } from "@/app/utils/cn";
import type { MouseButton, Step } from "@shared/macro-types";
import {
	ArrowDown,
	ArrowUp,
	Copy,
	Crosshair,
	GitBranch,
	GripVertical,
	ImageIcon,
	Keyboard,
	MousePointer2,
	MousePointerClick,
	Timer,
	Trash2,
	Type,
} from "lucide-react";
import { useState } from "react";
import { ImagePickerField } from "@/components/image-picker-field";
import { ScreenshotPicker } from "@/components/screenshot-picker";

const STEP_META: Record<Step["type"], { icon: typeof MousePointer2; label: string }> = {
	moveMouse: { icon: MousePointer2, label: "Mover mouse" },
	click: { icon: MousePointerClick, label: "Clique" },
	type: { icon: Type, label: "Digitar texto" },
	key: { icon: Keyboard, label: "Tecla" },
	wait: { icon: Timer, label: "Esperar" },
	clickImage: { icon: ImageIcon, label: "Clicar na imagem" },
	if: { icon: GitBranch, label: "Condição (SE)" },
};

type PointPickerButtonProps = {
	onPick: (point: { x: number; y: number }) => void;
};

export const PointPickerButton = ({ onPick }: PointPickerButtonProps) => {
	const [open, setOpen] = useState(false);
	return (
		<>
			<Button type="button" variant="ghost" size="icon-xs" title="Selecionar ponto na tela" onClick={() => setOpen(true)}>
				<Crosshair className="size-3.5" />
			</Button>
			<ScreenshotPicker open={open} onOpenChange={setOpen} mode="point" onPick={onPick} />
		</>
	);
};

type StepRowProps = {
	step: Step;
	index: number;
	total: number;
	onChange: (step: Step) => void;
	onRemove: () => void;
	onMoveUp: () => void;
	onMoveDown: () => void;
	onDuplicate: () => void;
	isDragging?: boolean;
	isDragOver?: boolean;
	onDragStart?: () => void;
	onDragOver?: () => void;
	onDrop?: () => void;
	onDragEnd?: () => void;
};

export const StepRow = ({
	step,
	index,
	total,
	onChange,
	onRemove,
	onMoveUp,
	onMoveDown,
	onDuplicate,
	isDragging,
	isDragOver,
	onDragStart,
	onDragOver,
	onDrop,
	onDragEnd,
}: StepRowProps) => {
	const { icon: Icon, label } = STEP_META[step.type];

	return (
		<Card
			size="sm"
			draggable
			onDragStart={onDragStart}
			onDragOver={(e) => {
				e.preventDefault();
				onDragOver?.();
			}}
			onDrop={(e) => {
				e.preventDefault();
				onDrop?.();
			}}
			onDragEnd={onDragEnd}
			className={cn("transition-[opacity,box-shadow]", isDragging && "opacity-50", isDragOver && "ring-primary ring-2")}
		>
			<CardContent className="flex items-center gap-3">
				<span className="text-muted-foreground flex size-9 shrink-0 cursor-grab items-center justify-center active:cursor-grabbing">
					<GripVertical className="size-4" />
				</span>
				<span className="bg-muted flex size-9 shrink-0 items-center justify-center rounded-full">
					<Icon className="text-muted-foreground size-4" />
				</span>

				<div className="flex flex-1 flex-wrap items-center gap-2">
					<span className="text-muted-foreground w-28 shrink-0 text-sm">{label}</span>

					{step.type === "moveMouse" && (
						<>
							<Input
								inputSize="sm"
								type="number"
								className="w-24"
								value={step.x}
								onChange={(e) => onChange({ ...step, x: Number(e.target.value) })}
							/>
							<Input
								inputSize="sm"
								type="number"
								className="w-24"
								value={step.y}
								onChange={(e) => onChange({ ...step, y: Number(e.target.value) })}
							/>
							<PointPickerButton onPick={(point) => onChange({ ...step, x: point.x, y: point.y })} />
						</>
					)}

					{step.type === "click" && (
						<>
							<Select value={step.button} onValueChange={(v) => onChange({ ...step, button: v as MouseButton })}>
								<SelectTrigger size="sm" className="w-28">
									<SelectValue />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="left">Esquerdo</SelectItem>
									<SelectItem value="right">Direito</SelectItem>
									<SelectItem value="middle">Meio</SelectItem>
								</SelectContent>
							</Select>
							<Input
								inputSize="sm"
								type="number"
								className="w-24"
								value={step.x}
								onChange={(e) => onChange({ ...step, x: Number(e.target.value) })}
							/>
							<Input
								inputSize="sm"
								type="number"
								className="w-24"
								value={step.y}
								onChange={(e) => onChange({ ...step, y: Number(e.target.value) })}
							/>
							<PointPickerButton onPick={(point) => onChange({ ...step, x: point.x, y: point.y })} />
						</>
					)}

					{step.type === "type" && (
						<Input
							inputSize="sm"
							className="min-w-48 flex-1"
							value={step.text}
							onChange={(e) => onChange({ ...step, text: e.target.value })}
						/>
					)}

					{step.type === "key" && (
						<HotkeyCapture
							value={step.keys.join("+")}
							onChange={(combo) => onChange({ ...step, keys: combo ? combo.split("+") : [] })}
						/>
					)}

					{step.type === "wait" && (
						<div className="flex items-center gap-2">
							<Input
								inputSize="sm"
								type="number"
								className="w-24"
								value={step.ms}
								onChange={(e) => onChange({ ...step, ms: Number(e.target.value) })}
							/>
							<span className="text-muted-foreground text-xs">ms</span>
						</div>
					)}

					{step.type === "clickImage" && (
						<>
							<ImagePickerField imagePath={step.imagePath} onChange={(imagePath) => onChange({ ...step, imagePath })} />
							<Select value={step.button} onValueChange={(v) => onChange({ ...step, button: v as MouseButton })}>
								<SelectTrigger size="sm" className="w-28">
									<SelectValue />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="left">Esquerdo</SelectItem>
									<SelectItem value="right">Direito</SelectItem>
									<SelectItem value="middle">Meio</SelectItem>
								</SelectContent>
							</Select>
							<div className="flex items-center gap-1">
								<Input
									inputSize="sm"
									type="number"
									min={0}
									max={1}
									step={0.01}
									className="w-20"
									value={step.tolerance}
									onChange={(e) => onChange({ ...step, tolerance: Number(e.target.value) })}
								/>
								<span className="text-muted-foreground text-xs">confiança</span>
							</div>
							<div className="flex items-center gap-1">
								<Input
									inputSize="sm"
									type="number"
									className="w-24"
									value={step.timeoutMs}
									onChange={(e) => onChange({ ...step, timeoutMs: Number(e.target.value) })}
								/>
								<span className="text-muted-foreground text-xs">ms timeout</span>
							</div>
						</>
					)}
				</div>

				<div className="flex shrink-0 items-center gap-1">
					<Button type="button" variant="ghost" size="icon-xs" disabled={index === 0} onClick={onMoveUp}>
						<ArrowUp className="size-3.5" />
					</Button>
					<Button type="button" variant="ghost" size="icon-xs" disabled={index === total - 1} onClick={onMoveDown}>
						<ArrowDown className="size-3.5" />
					</Button>
					<Button type="button" variant="ghost" size="icon-xs" title="Duplicar passo" onClick={onDuplicate}>
						<Copy className="size-3.5" />
					</Button>
					<Button type="button" variant="ghost" size="icon-xs" onClick={onRemove}>
						<Trash2 className="text-destructive size-3.5" />
					</Button>
				</div>
			</CardContent>
		</Card>
	);
};
