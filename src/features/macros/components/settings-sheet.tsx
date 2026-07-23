import { AppSheet, notify } from "@/components";
import { Typography } from "@/components/typography";
import { useEffect, useRef, useState } from "react";
import { useSaveSettings, useSettings } from "../api";
import { HotkeyCapture } from "./hotkey-capture";

type SettingsSheetProps = {
	open: boolean;
	onOpenChange: (open: boolean) => void;
};

export const SettingsSheet = ({ open, onOpenChange }: SettingsSheetProps) => {
	const { data: settings } = useSettings();
	const saveSettings = useSaveSettings();
	const [panicKey, setPanicKey] = useState("Escape");
	const initialized = useRef(false);

	useEffect(() => {
		if (settings && !initialized.current) {
			setPanicKey(settings.panicKey);
			initialized.current = true;
		}
	}, [settings]);

	const handleSave = () => {
		saveSettings.mutate(
			{ panicKey },
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
		</AppSheet>
	);
};
