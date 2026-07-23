import {
	AppSheet,
	Button,
	Card,
	CardContent,
	EmptyState,
	Input,
	notify,
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
	Switch,
	Tabs,
	TabsContent,
	TabsContents,
	TabsList,
	TabsTrigger,
	ToggleGroup,
	ToggleGroupItem,
} from "@/components";
import { Typography } from "@/components/typography";
import type { Macro, MouseMode, RecordState, RepeatMode, Step } from "@shared/macro-types";
import { Circle } from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";
import { useSaveMacro } from "../api";
import { AddStepMenu } from "./add-step-menu";
import { HotkeyCapture } from "./hotkey-capture";
import { StepRow } from "./step-row";

const withFreshIds = (steps: Step[]): Step[] => steps.map((step) => ({ ...step, id: crypto.randomUUID() }));
const IDLE_RECORD_STATE: RecordState = { recording: false, paused: false };

type SettingsRowProps = {
	label: string;
	description?: string;
	children: ReactNode;
};

const SettingsRow = ({ label, description, children }: SettingsRowProps) => (
	<div className="flex flex-col gap-3 py-4 first:pt-0 last:pb-0 sm:flex-row sm:items-center sm:justify-between">
		<div className="flex flex-col gap-0.5">
			<Typography variant="body-sm" className="font-medium">
				{label}
			</Typography>
			{description && (
				<Typography variant="caption" className="text-muted-foreground">
					{description}
				</Typography>
			)}
		</div>
		<div className="shrink-0">{children}</div>
	</div>
);

type MacroEditorSheetProps = {
	macro: Macro;
	mode: "create" | "edit";
	open: boolean;
	onOpenChange: (open: boolean) => void;
};

export const MacroEditorSheet = ({ macro, mode, open, onOpenChange }: MacroEditorSheetProps) => {
	const saveMacro = useSaveMacro();
	const [draft, setDraft] = useState<Macro>(macro);
	const [recordState, setRecordState] = useState<RecordState>(IDLE_RECORD_STATE);
	const [tab, setTab] = useState("steps");

	// A cada abertura o componente monta do zero (ver key={macro.id} em page-library),
	// então o estado inicial acima já nasce correto — nada para sincronizar aqui.

	useEffect(() => {
		const offState = window.api.record.onState((state) => setRecordState(state));
		const offStopped = window.api.record.onStopped((recorded) => {
			setDraft((prev) => ({ ...prev, steps: [...prev.steps, ...withFreshIds(recorded)] }));
			notify.success(`${recorded.length} passo(s) capturado(s)`);
		});
		return () => {
			offState();
			offStopped();
		};
	}, []);

	const handleToggleRecord = () => {
		if (recordState.recording) {
			window.api.record.stop();
		} else {
			window.api.record.start();
			notify.info("Gravando... a janela foi minimizada. Use a janelinha flutuante para pausar/parar.");
		}
	};

	const updateStep = (index: number, step: Step) => {
		setDraft((prev) => {
			const steps = [...prev.steps];
			steps[index] = step;
			return { ...prev, steps };
		});
	};

	const removeStep = (index: number) => {
		setDraft((prev) => ({ ...prev, steps: prev.steps.filter((_, i) => i !== index) }));
	};

	const moveStep = (index: number, direction: -1 | 1) => {
		setDraft((prev) => {
			const steps = [...prev.steps];
			const target = index + direction;
			[steps[index], steps[target]] = [steps[target], steps[index]];
			return { ...prev, steps };
		});
	};

	const handleSave = () => {
		saveMacro.mutate(draft, {
			onSuccess: () => {
				notify.success("Macro salva");
				onOpenChange(false);
			},
			onError: (err) => notify.error(err.message),
		});
	};

	return (
		<AppSheet
			open={open}
			onOpenChange={onOpenChange}
			title={mode === "create" ? "Nova macro" : "Editar macro"}
			contentClassName="sm:max-w-2xl"
			onAction={handleSave}
			actionLabel="Salvar"
			actionDisabled={saveMacro.isPending}
		>
			<Input
				label="Nome"
				value={draft.name}
				onChange={(e) => setDraft((prev) => ({ ...prev, name: e.target.value }))}
			/>

			<Tabs value={tab} onValueChange={setTab} className="gap-4">
				<TabsList variant="underline">
					<TabsTrigger value="steps">Passos</TabsTrigger>
					<TabsTrigger value="settings">Configurações</TabsTrigger>
				</TabsList>

				<TabsContents>
					<TabsContent value="steps" className="flex flex-col gap-4">
						<div className="flex flex-wrap items-center gap-3">
							<Button
								type="button"
								variant={recordState.recording ? "destructive" : "outline"}
								size="sm"
								onClick={handleToggleRecord}
							>
								<Circle
									className={
										recordState.recording
											? "fill-destructive-foreground size-2"
											: "fill-destructive text-destructive size-3"
									}
								/>
								{recordState.recording ? "Parar gravação" : "Gravar"}
							</Button>
							{recordState.recording && recordState.paused && (
								<Typography variant="caption" className="text-muted-foreground">
									Pausado
								</Typography>
							)}
							<AddStepMenu onAdd={(step) => setDraft((prev) => ({ ...prev, steps: [...prev.steps, step] }))} />
						</div>

						<div className="flex flex-col gap-2">
							{draft.steps.length === 0 ? (
								<EmptyState title="Nenhum passo ainda" message="Grave ou adicione o primeiro passo desta macro." />
							) : (
								draft.steps.map((step, index) => (
									<StepRow
										key={step.id}
										step={step}
										index={index}
										total={draft.steps.length}
										onChange={(next) => updateStep(index, next)}
										onRemove={() => removeStep(index)}
										onMoveUp={() => moveStep(index, -1)}
										onMoveDown={() => moveStep(index, 1)}
									/>
								))
							)}
						</div>
					</TabsContent>

					<TabsContent value="settings">
						<Card size="sm">
							<CardContent className="flex flex-col divide-y">
								<SettingsRow label="Modo do mouse" description="Como o mouse se move ao reproduzir a macro.">
									<ToggleGroup
										type="single"
										variant="outline"
										size="sm"
										value={draft.mouseMode}
										onValueChange={(v) => v && setDraft((prev) => ({ ...prev, mouseMode: v as MouseMode }))}
									>
										<ToggleGroupItem value="jump">Pulo direto</ToggleGroupItem>
										<ToggleGroupItem value="trajectory">Trajetória</ToggleGroupItem>
									</ToggleGroup>
								</SettingsRow>

								<SettingsRow label="Repetição" description="Quantas vezes a macro roda por execução.">
									<div className="flex items-center gap-2">
										<Select
											value={draft.repeat.mode}
											onValueChange={(v) =>
												setDraft((prev) => ({ ...prev, repeat: { ...prev.repeat, mode: v as RepeatMode } }))
											}
										>
											<SelectTrigger size="sm" className="w-32">
												<SelectValue />
											</SelectTrigger>
											<SelectContent>
												<SelectItem value="once">Uma vez</SelectItem>
												<SelectItem value="times">N vezes</SelectItem>
												<SelectItem value="loop">Loop</SelectItem>
											</SelectContent>
										</Select>
										{draft.repeat.mode === "times" && (
											<Input
												inputSize="sm"
												type="number"
												className="w-20"
												min={1}
												value={draft.repeat.count ?? 1}
												onChange={(e) =>
													setDraft((prev) => ({
														...prev,
														repeat: { ...prev.repeat, count: Number(e.target.value) },
													}))
												}
											/>
										)}
									</div>
								</SettingsRow>

								<SettingsRow label="Atalho" description="Tecla global para disparar esta macro.">
									<HotkeyCapture
										value={draft.hotkey}
										onChange={(combo) => setDraft((prev) => ({ ...prev, hotkey: combo }))}
									/>
								</SettingsRow>

								<SettingsRow label="Ativa" description="Permite disparar essa macro pelo atalho configurado.">
									<Switch
										checked={draft.active}
										onCheckedChange={(checked) => setDraft((prev) => ({ ...prev, active: checked }))}
									/>
								</SettingsRow>
							</CardContent>
						</Card>
					</TabsContent>
				</TabsContents>
			</Tabs>
		</AppSheet>
	);
};
