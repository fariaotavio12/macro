import {
	AppSheet,
	Card,
	CardContent,
	HotkeyCapture,
	notify,
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
	SettingsRow,
	Switch,
} from "@/components";
import { Typography } from "@/components/typography";
import type { DockPosition } from "@shared/macro-types";
import { useEffect, useRef, useState } from "react";
import { useSaveSettings, useSettings } from "../api";

type SettingsSheetProps = {
	open: boolean;
	onOpenChange: (open: boolean) => void;
};

const DOCK_POSITION_OPTIONS: { value: DockPosition; label: string }[] = [
	{ value: "right-top", label: "Direita (topo)" },
	{ value: "right-center", label: "Direita (centro)" },
	{ value: "right-bottom", label: "Direita (baixo)" },
	{ value: "left-top", label: "Esquerda (topo)" },
	{ value: "left-center", label: "Esquerda (centro)" },
	{ value: "left-bottom", label: "Esquerda (baixo)" },
];

export const SettingsSheet = ({ open, onOpenChange }: SettingsSheetProps) => {
	const { data: settings } = useSettings();
	const saveSettings = useSaveSettings();
	const [panicKey, setPanicKey] = useState("Escape");
	const [dockEnabled, setDockEnabled] = useState(true);
	const [dockPosition, setDockPosition] = useState<DockPosition>("right-center");
	const initialized = useRef(false);

	useEffect(() => {
		if (settings && !initialized.current) {
			setPanicKey(settings.panicKey);
			setDockEnabled(settings.dockEnabled);
			setDockPosition(settings.dockPosition);
			initialized.current = true;
		}
	}, [settings]);

	const handleSave = () => {
		saveSettings.mutate(
			{ panicKey, dockEnabled, dockPosition },
			{
				onSuccess: () => {
					notify.success("Configurações salvas");
					onOpenChange(false);
				},
				onError: (err) => notify.error(err.message),
			},
		);
	};

	return (
		<AppSheet
			open={open}
			onOpenChange={onOpenChange}
			title="Configurações"
			contentClassName="sm:max-w-lg"
			onAction={handleSave}
			actionLabel="Salvar"
			actionDisabled={saveSettings.isPending}
		>
			<div className="flex flex-col gap-3">
				<div className="flex flex-col gap-1">
					<Typography variant="title-sm">Tecla de pânico</Typography>
					<Typography variant="body-sm" className="text-muted-foreground">
						Interrompe qualquer macro em execução na hora, mesmo em loop. Tem prioridade sobre qualquer atalho de
						disparo.
					</Typography>
				</div>
				<HotkeyCapture value={panicKey} onChange={(combo) => setPanicKey(combo ?? "Escape")} />
			</div>

			<Card size="sm">
				<CardContent className="flex flex-col divide-y">
					<SettingsRow
						label="Aba lateral ao minimizar"
						description="Mostra uma aba retrátil na borda da tela ao fechar a janela principal, em vez de sumir de vez."
					>
						<Switch checked={dockEnabled} onCheckedChange={setDockEnabled} />
					</SettingsRow>

					{dockEnabled && (
						<SettingsRow label="Posição da aba" description="Onde a aba fica encostada na tela.">
							<Select value={dockPosition} onValueChange={(v) => setDockPosition(v as DockPosition)}>
								<SelectTrigger size="sm" className="w-40">
									<SelectValue />
								</SelectTrigger>
								<SelectContent>
									{DOCK_POSITION_OPTIONS.map((option) => (
										<SelectItem key={option.value} value={option.value}>
											{option.label}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</SettingsRow>
					)}
				</CardContent>
			</Card>
		</AppSheet>
	);
};
