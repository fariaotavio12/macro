import {
	AppSheet,
	Button,
	Card,
	CardContent,
	HotkeyCapture,
	Input,
	notify,
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
	SettingsRow,
	Switch,
	Tabs,
	TabsContent,
	TabsContents,
	TabsList,
	TabsTrigger,
} from "@/components";
import { Typography } from "@/components/typography";
import type { CaptureMode, CaptureParking, CaptureProfile } from "@shared/capture-types";
import type { Region } from "@shared/macro-types";
import { ScanSearch, Trash2 } from "lucide-react";
import { useState } from "react";
import { useSaveCaptureProfile } from "../api";
import { PointPickerField } from "./point-picker-field";
import { formatRegion, RegionPickerField } from "./region-picker-field";
import { ScanPreviewDialog } from "./scan-preview-dialog";
import { TemplateList } from "./template-list";

type CaptureEditorSheetProps = {
	profile: CaptureProfile;
	mode: "create" | "edit";
	open: boolean;
	onOpenChange: (open: boolean) => void;
};

const PARKING_OPTIONS: { value: CaptureParking; label: string }[] = [
	{ value: "origem", label: "Onde estava" },
	{ value: "centro", label: "Centro da área" },
	{ value: "fixo", label: "Ponto fixo" },
];

export const CaptureEditorSheet = ({ profile, mode, open, onOpenChange }: CaptureEditorSheetProps) => {
	const saveProfile = useSaveCaptureProfile();
	const [draft, setDraft] = useState<CaptureProfile>(profile);
	const [tab, setTab] = useState("pokemons");
	const [previewOpen, setPreviewOpen] = useState(false);

	const patch = (values: Partial<CaptureProfile>) => setDraft((prev) => ({ ...prev, ...values }));

	const handleSave = () => {
		saveProfile.mutate(draft, {
			onSuccess: () => {
				notify.success("Perfil salvo");
				onOpenChange(false);
			},
			onError: (err) => notify.error(err.message),
		});
	};

	const addExcludeRegion = (region: Region | undefined) => {
		if (!region) return;
		patch({ excludeRegions: [...draft.excludeRegions, region] });
	};

	return (
		<AppSheet
			open={open}
			onOpenChange={onOpenChange}
			title={mode === "create" ? "Novo perfil de captura" : "Editar perfil de captura"}
			contentClassName="sm:max-w-2xl"
			onAction={handleSave}
			actionLabel="Salvar"
			actionDisabled={saveProfile.isPending}
		>
			<Input label="Nome" value={draft.name} onChange={(e) => patch({ name: e.target.value })} />

			<Tabs value={tab} onValueChange={setTab} className="gap-4">
				<TabsList variant="underline">
					<TabsTrigger value="pokemons">Pokémons</TabsTrigger>
					<TabsTrigger value="disparo">Disparo</TabsTrigger>
					<TabsTrigger value="area">Área</TabsTrigger>
					<TabsTrigger value="avancado">Avançado</TabsTrigger>
				</TabsList>

				<TabsContents>
					<TabsContent value="pokemons" className="flex flex-col gap-4">
						<TemplateList templates={draft.templates} onChange={(templates) => patch({ templates })} />
						<Button
							type="button"
							variant="outline"
							size="sm"
							className="self-start"
							disabled={draft.templates.every((template) => !template.enabled || !template.imagePath)}
							onClick={() => setPreviewOpen(true)}
						>
							<ScanSearch className="size-4" />
							Testar detecção
						</Button>
						<Typography variant="caption" className="text-muted-foreground">
							O teste usa o perfil salvo. Salve antes de testar mudanças de template ou de área.
						</Typography>
					</TabsContent>

					<TabsContent value="disparo">
						<Card size="sm">
							<CardContent className="flex flex-col divide-y">
								<SettingsRow label="Atalho" description="Tecla global que dispara uma varredura.">
									<HotkeyCapture value={draft.hotkey} onChange={(hotkey) => patch({ hotkey })} />
								</SettingsRow>

								<SettingsRow
									label="Tecla da pokébola"
									description="Apertada com o cursor em cima de cada corpo encontrado."
								>
									<HotkeyCapture value={draft.ballKey} onChange={(ballKey) => patch({ ballKey: ballKey ?? "F1" })} />
								</SettingsRow>

								<SettingsRow
									label="Clicar depois da tecla"
									description="Só ligue se o seu cliente exigir clique para usar o item no alvo."
								>
									<Switch checked={draft.clickAfterKey} onCheckedChange={(clickAfterKey) => patch({ clickAfterKey })} />
								</SettingsRow>

								<SettingsRow label="Máximo de alvos" description="Quantas pokébolas por varredura, no máximo.">
									<Input
										inputSize="sm"
										type="number"
										className="w-24"
										min={1}
										value={draft.maxTargets}
										onChange={(e) => patch({ maxTargets: Math.max(Number(e.target.value), 1) })}
									/>
								</SettingsRow>

								<SettingsRow label="Modo" description="Disparo único por toque, ou loop até apertar de novo.">
									<div className="flex items-center gap-2">
										<Select value={draft.mode} onValueChange={(v) => patch({ mode: v as CaptureMode })}>
											<SelectTrigger size="sm" className="w-36">
												<SelectValue />
											</SelectTrigger>
											<SelectContent>
												<SelectItem value="once">Uma varredura</SelectItem>
												<SelectItem value="loop">Loop</SelectItem>
											</SelectContent>
										</Select>
										{draft.mode === "loop" && (
											<Input
												inputSize="sm"
												type="number"
												className="w-24"
												min={100}
												value={draft.loopIntervalMs}
												onChange={(e) => patch({ loopIntervalMs: Math.max(Number(e.target.value), 100) })}
											/>
										)}
									</div>
								</SettingsRow>

								<SettingsRow label="Ativo" description="Permite disparar este perfil pelo atalho configurado.">
									<Switch checked={draft.active} onCheckedChange={(active) => patch({ active })} />
								</SettingsRow>
							</CardContent>
						</Card>
					</TabsContent>

					<TabsContent value="area" className="flex flex-col gap-4">
						<Card size="sm">
							<CardContent className="flex flex-col divide-y">
								<SettingsRow
									label="Área do jogo"
									description="Recorte a área útil. Sem ela a varredura cobre a tela toda e fica mais lenta e sujeita a falso positivo."
								>
									<RegionPickerField region={draft.scanRegion} onChange={(scanRegion) => patch({ scanRegion })} />
								</SettingsRow>

								<SettingsRow
									label="Ignorar área"
									description="Barra de hotkeys, inventário e minimapa mostram os mesmos sprites dos corpos."
								>
									<RegionPickerField region={undefined} onChange={addExcludeRegion} emptyLabel="Adicionar área" />
								</SettingsRow>
							</CardContent>
						</Card>

						{draft.excludeRegions.length > 0 && (
							<div className="flex flex-col gap-2">
								{draft.excludeRegions.map((region, index) => (
									<div key={`${region.x}-${region.y}-${index}`} className="flex items-center gap-2">
										<Typography variant="body-sm" className="text-muted-foreground">
											{formatRegion(region)}
										</Typography>
										<Button
											type="button"
											variant="ghost"
											size="icon-sm"
											aria-label="Remover área ignorada"
											onClick={() => patch({ excludeRegions: draft.excludeRegions.filter((_, i) => i !== index) })}
										>
											<Trash2 className="size-4" />
										</Button>
									</div>
								))}
							</div>
						)}
					</TabsContent>

					<TabsContent value="avancado">
						<Card size="sm">
							<CardContent className="flex flex-col divide-y">
								<SettingsRow
									label="Cooldown por alvo"
									description="Evita gastar outra pokébola no mesmo corpo. Vale por coordenada de tela — andar entre disparos invalida a memória. 0 desliga."
								>
									<div className="flex items-center gap-2">
										<Input
											inputSize="sm"
											type="number"
											className="w-24"
											min={0}
											step={500}
											value={draft.targetCooldownMs}
											onChange={(e) => patch({ targetCooldownMs: Math.max(Number(e.target.value), 0) })}
										/>
										<Typography variant="caption" className="text-muted-foreground">
											ms
										</Typography>
									</div>
								</SettingsRow>

								<SettingsRow label="Cursor no fim" description="Para onde o mouse volta depois da rodada.">
									<Select value={draft.parking} onValueChange={(v) => patch({ parking: v as CaptureParking })}>
										<SelectTrigger size="sm" className="w-40">
											<SelectValue />
										</SelectTrigger>
										<SelectContent>
											{PARKING_OPTIONS.map((option) => (
												<SelectItem key={option.value} value={option.value}>
													{option.label}
												</SelectItem>
											))}
										</SelectContent>
									</Select>
								</SettingsRow>

								{draft.parking === "fixo" && (
									<SettingsRow label="Ponto fixo" description="Escolha um lugar vazio, sem criatura ou item.">
										<PointPickerField point={draft.parkingPoint} onChange={(parkingPoint) => patch({ parkingPoint })} />
									</SettingsRow>
								)}

								<SettingsRow
									label="Só disparar com o jogo em foco"
									description="Evita apertar a tecla da pokébola no navegador por engano."
								>
									<Switch
										checked={draft.requireGameFocus}
										onCheckedChange={(requireGameFocus) => patch({ requireGameFocus })}
									/>
								</SettingsRow>

								{draft.requireGameFocus && (
									<SettingsRow label="Título da janela" description="Trecho do título, ex: PokeXGames.">
										<Input
											inputSize="sm"
											className="w-52"
											value={draft.gameWindowTitle ?? ""}
											onChange={(e) => patch({ gameWindowTitle: e.target.value })}
										/>
									</SettingsRow>
								)}

								<SettingsRow
									label="Espera antes da tecla"
									description="Tempo para o jogo registrar o cursor sobre o alvo."
								>
									<div className="flex items-center gap-2">
										<Input
											inputSize="sm"
											type="number"
											className="w-24"
											min={0}
											value={draft.delayBeforeKeyMs}
											onChange={(e) => patch({ delayBeforeKeyMs: Math.max(Number(e.target.value), 0) })}
										/>
										<Typography variant="caption" className="text-muted-foreground">
											ms
										</Typography>
									</div>
								</SettingsRow>

								<SettingsRow label="Espera entre alvos" description="Intervalo entre uma pokébola e a próxima.">
									<div className="flex items-center gap-2">
										<Input
											inputSize="sm"
											type="number"
											className="w-24"
											min={0}
											value={draft.delayBetweenTargetsMs}
											onChange={(e) => patch({ delayBetweenTargetsMs: Math.max(Number(e.target.value), 0) })}
										/>
										<Typography variant="caption" className="text-muted-foreground">
											ms
										</Typography>
									</div>
								</SettingsRow>
							</CardContent>
						</Card>
					</TabsContent>
				</TabsContents>
			</Tabs>

			{previewOpen && <ScanPreviewDialog profile={draft} open={previewOpen} onOpenChange={setPreviewOpen} />}
		</AppSheet>
	);
};
