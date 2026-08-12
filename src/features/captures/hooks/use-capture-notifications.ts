import { notify } from "@/components/toast/notify";
import type { CaptureRunSummary } from "@shared/capture-types";
import { useEffect, useRef } from "react";
import { useCaptureProfiles } from "../api";
import { useCaptureProfileStates } from "./use-capture-state";

/**
 * Avisa quando uma rodada disparada por atalho não fez o que devia. Sem isso, apertar a
 * tecla e nada acontecer é indistinguível de atalho não registrado.
 * Rodada bem-sucedida não notifica: ela acontece em jogo, com o app atrás da janela.
 */
export const useCaptureNotifications = () => {
	const { data: profiles } = useCaptureProfiles();
	const captureStates = useCaptureProfileStates();
	const notified = useRef<Record<string, CaptureRunSummary>>({});

	useEffect(() => {
		for (const [profileId, state] of Object.entries(captureStates)) {
			const summary = state.lastRun;
			if (!summary || notified.current[profileId] === summary) continue;
			notified.current[profileId] = summary;

			const name = profiles?.find((profile) => profile.id === profileId)?.name ?? "Captura";
			if (summary.reason === "error") {
				notify.error(`"${name}" falhou: ${summary.errorMessage ?? "erro desconhecido"}`);
			} else if (summary.reason === "no-focus") {
				const seen = summary.activeWindowTitle ? ` Janela ativa: "${summary.activeWindowTitle}".` : "";
				notify.warning(`"${name}" não disparou: o jogo não estava em foco.${seen}`);
			} else if (summary.reason === "no-templates") {
				notify.warning(`"${name}" não tem nenhum pokémon ativo com imagem.`);
			} else if (summary.fired === 0) {
				notify.info(`"${name}": nenhum alvo encontrado (${summary.scanMs} ms de varredura).`);
			}
		}
	}, [captureStates, profiles]);
};
