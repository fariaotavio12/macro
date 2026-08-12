import {
	Button,
	Card,
	CardContent,
	Collapsible,
	CollapsibleContent,
	CollapsibleTrigger,
	HotkeyCapture,
	Input,
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
	SettingsRow,
	Switch,
} from "@/components";
import { Typography } from "@/components/typography";
import { cn } from "@/app/utils/cn";
import type { CaptureConfig, CaptureMode, CaptureParking } from "@shared/capture-types";
import type { Region } from "@shared/macro-types";
import { ChevronDown, Trash2 } from "lucide-react";
import type { ReactNode } from "react";
import { useState } from "react";
import { PointPickerField } from "./point-picker-field";
import { formatRegion, RegionPickerField } from "./region-picker-field";
import { TemplateList } from "./template-list";

type CaptureConfigFormProps = {
	config: CaptureConfig;
	/** Emite o snapshot novo. O formulário não grava nada por conta própria. */
	onChange: (values: Partial<CaptureConfig>) => void;
};

const PARKING_OPTIONS: { value: CaptureParking; label: string }[] = [
	{ value: "origem", label: "Onde estava" },
	{ value: "centro", label: "Centro da área" },
	{ value: "fixo", label: "Ponto fixo" },
];

const Section = ({
	title,
	description,
	children,
}: {
	title: string;
	description: string;
	children: ReactNode;
}) => (
	<section className="flex flex-col gap-3">
		<div className="flex flex-col gap-0.5">
			<Typography variant="title-sm">{title}</Typography>
			<Typography variant="caption" className="text-muted-foreground">
				{description}
			</Typography>
		</div>
		{children}
	</section>
);

const SettingsCard = ({ children }: { children: ReactNode }) => (
	<Card size="sm">
		<CardContent className="flex flex-col divide-y">{children}</CardContent>
	</Card>
);

export const CaptureConfigForm = ({ config, onChange }: CaptureConfigFormProps) => {
	const [advancedOpen, setAdvancedOpen] = useState(false);

	const addExcludeRegion = (region: Region | undefined) => {
		if (!region) return;
		onChange({ excludeRegions: [...config.excludeRegions, region] });
	};

	return (
		<div className="flex flex-col gap-6">
			<Section title="Pokémon" description="Os corpos que o app procura na tela a cada varredura.">
				<TemplateList templates={config.templates} onChange={(templates) => onChange({ templates })} />
			</Section>

			<div className="grid gap-6 lg:grid-cols-2 lg:items-start">
				<Section title="Disparo" description="Teclas e ritmo de cada rodada.">
					<SettingsCard>
						<SettingsRow label="Atalho" description="Tecla global que dispara uma varredura.">
							<HotkeyCapture value={config.hotkey} onChange={(hotkey) => onChange({ hotkey })} />
						</SettingsRow>

						<SettingsRow
							label="Tecla da pokébola"
							description="Apertada com o cursor em cima de cada corpo encontrado."
						>
							<HotkeyCapture value={config.ballKey} onChange={(ballKey) => onChange({ ballKey: ballKey ?? "F1" })} />
						</SettingsRow>

						<SettingsRow
							label="Clicar depois da tecla"
							description="Só ligue se o seu cliente exigir clique para usar o item no alvo."
						>
							<Switch checked={config.clickAfterKey} onCheckedChange={(clickAfterKey) => onChange({ clickAfterKey })} />
						</SettingsRow>

						<SettingsRow label="Máximo de alvos" description="Quantas pokébolas por varredura, no máximo.">
							<Input
								inputSize="sm"
								type="number"
								className="w-24"
								min={1}
								value={config.maxTargets}
								onChange={(e) => onChange({ maxTargets: Math.max(Number(e.target.value), 1) })}
							/>
						</SettingsRow>

						<SettingsRow label="Modo" description="Disparo único por toque, ou loop até apertar de novo.">
							<div className="flex items-center gap-2">
								<Select value={config.mode} onValueChange={(v) => onChange({ mode: v as CaptureMode })}>
									<SelectTrigger size="sm" className="w-36">
										<SelectValue />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="once">Uma varredura</SelectItem>
										<SelectItem value="loop">Loop</SelectItem>
									</SelectContent>
								</Select>
								{config.mode === "loop" && (
									<Input
										inputSize="sm"
										type="number"
										className="w-24"
										min={100}
										value={config.loopIntervalMs}
										onChange={(e) => onChange({ loopIntervalMs: Math.max(Number(e.target.value), 100) })}
									/>
								)}
							</div>
						</SettingsRow>

						<SettingsRow label="Capturas ativas" description="Permite disparar pelo atalho configurado.">
							<Switch checked={config.active} onCheckedChange={(active) => onChange({ active })} />
						</SettingsRow>
					</SettingsCard>
				</Section>

				<Section title="Área" description="Onde a varredura procura e o que ela deve ignorar.">
					<SettingsCard>
						<SettingsRow
							label="Área do jogo"
							description="Recorte a área útil. Sem ela a varredura cobre a tela toda e fica mais lenta e sujeita a falso positivo."
						>
							<RegionPickerField region={config.scanRegion} onChange={(scanRegion) => onChange({ scanRegion })} />
						</SettingsRow>

						<SettingsRow
							label="Ignorar área"
							description="Barra de hotkeys, inventário e minimapa mostram os mesmos sprites dos corpos."
						>
							<RegionPickerField region={undefined} onChange={addExcludeRegion} emptyLabel="Adicionar área" />
						</SettingsRow>
					</SettingsCard>

					{config.excludeRegions.length > 0 && (
						<div className="flex flex-col gap-2">
							{config.excludeRegions.map((region, index) => (
								<div key={`${region.x}-${region.y}-${index}`} className="flex items-center gap-2">
									<Typography variant="body-sm" className="text-muted-foreground">
										{formatRegion(region)}
									</Typography>
									<Button
										type="button"
										variant="ghost"
										size="icon-sm"
										aria-label="Remover área ignorada"
										onClick={() => onChange({ excludeRegions: config.excludeRegions.filter((_, i) => i !== index) })}
									>
										<Trash2 className="size-4" />
									</Button>
								</div>
							))}
						</div>
					)}
				</Section>
			</div>

			<Collapsible open={advancedOpen} onOpenChange={setAdvancedOpen} className="flex flex-col gap-3">
				<CollapsibleTrigger asChild>
					<Button type="button" variant="outline" size="sm" className="self-start">
						<ChevronDown className={cn("size-4 transition-transform", advancedOpen && "rotate-180")} />
						Avançado
					</Button>
				</CollapsibleTrigger>

				<CollapsibleContent>
					<SettingsCard>
						<SettingsRow
							label="Passadas por acionamento"
							description="Corpo empilhado fica escondido atrás do de cima. Depois de jogar, o app varre de novo para pegar o que apareceu."
						>
							<div className="flex items-center gap-2">
								<Input
									inputSize="sm"
									type="number"
									className="w-20"
									min={1}
									max={10}
									value={config.rescanPasses}
									onChange={(e) => onChange({ rescanPasses: Math.min(Math.max(Number(e.target.value), 1), 10) })}
								/>
								<Typography variant="caption" className="text-muted-foreground">
									varreduras
								</Typography>
							</div>
						</SettingsRow>

						<SettingsRow
							label="Espera entre passadas"
							description="Tempo para o corpo capturado sumir da tela antes da próxima varredura."
						>
							<div className="flex items-center gap-2">
								<Input
									inputSize="sm"
									type="number"
									className="w-24"
									min={0}
									step={100}
									value={config.rescanDelayMs}
									onChange={(e) => onChange({ rescanDelayMs: Math.max(Number(e.target.value), 0) })}
								/>
								<Typography variant="caption" className="text-muted-foreground">
									ms
								</Typography>
							</div>
						</SettingsRow>

						<SettingsRow
							label="Sobreposição máxima"
							description="Acima disso, duas deteções contam como o mesmo corpo. Baixe se corpos vizinhos estiverem sendo ignorados; suba se o mesmo corpo levar duas pokébolas."
						>
							<Input
								inputSize="sm"
								type="number"
								className="w-20"
								min={0.1}
								max={0.9}
								step={0.05}
								value={config.maxOverlap}
								onChange={(e) => onChange({ maxOverlap: Math.min(Math.max(Number(e.target.value), 0.1), 0.9) })}
							/>
						</SettingsRow>

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
									value={config.targetCooldownMs}
									onChange={(e) => onChange({ targetCooldownMs: Math.max(Number(e.target.value), 0) })}
								/>
								<Typography variant="caption" className="text-muted-foreground">
									ms
								</Typography>
							</div>
						</SettingsRow>

						<SettingsRow label="Cursor no fim" description="Para onde o mouse volta depois da rodada.">
							<Select value={config.parking} onValueChange={(v) => onChange({ parking: v as CaptureParking })}>
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

						{config.parking === "fixo" && (
							<SettingsRow label="Ponto fixo" description="Escolha um lugar vazio, sem criatura ou item.">
								<PointPickerField point={config.parkingPoint} onChange={(parkingPoint) => onChange({ parkingPoint })} />
							</SettingsRow>
						)}

						<SettingsRow
							label="Só disparar com o jogo em foco"
							description="Evita apertar a tecla da pokébola no navegador por engano."
						>
							<Switch
								checked={config.requireGameFocus}
								onCheckedChange={(requireGameFocus) => onChange({ requireGameFocus })}
							/>
						</SettingsRow>

						{config.requireGameFocus && (
							<SettingsRow
								label="Título da janela"
								description="Vazio usa o título definido em Configurações. Preencha só para sobrescrever aqui."
							>
								<Input
									inputSize="sm"
									className="w-52"
									placeholder="usar o global"
									value={config.gameWindowTitle ?? ""}
									onChange={(e) => onChange({ gameWindowTitle: e.target.value })}
								/>
							</SettingsRow>
						)}

						<SettingsRow label="Espera antes da tecla" description="Tempo para o jogo registrar o cursor sobre o alvo.">
							<div className="flex items-center gap-2">
								<Input
									inputSize="sm"
									type="number"
									className="w-24"
									min={0}
									value={config.delayBeforeKeyMs}
									onChange={(e) => onChange({ delayBeforeKeyMs: Math.max(Number(e.target.value), 0) })}
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
									value={config.delayBetweenTargetsMs}
									onChange={(e) => onChange({ delayBetweenTargetsMs: Math.max(Number(e.target.value), 0) })}
								/>
								<Typography variant="caption" className="text-muted-foreground">
									ms
								</Typography>
							</div>
						</SettingsRow>
					</SettingsCard>
				</CollapsibleContent>
			</Collapsible>
		</div>
	);
};
