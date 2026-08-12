import { notify } from "@/components/toast/notify";
import type { CaptureRunSummary } from "@shared/capture-types";
import { useEffect, useRef } from "react";
import { useCaptureState } from "./use-capture-state";

/**
 * Avisa quando uma rodada disparada por atalho não fez o que devia. Sem isso, apertar a
 * tecla e nada acontecer é indistinguível de atalho não registrado.
 * Rodada bem-sucedida não notifica: ela acontece em jogo, com o app atrás da janela.
 */
export const useCaptureNotifications = () => {
	const { lastRun } = useCaptureState();
	const notified = useRef<CaptureRunSummary | null>(null);

	useEffect(() => {
		if (!lastRun || notified.current === lastRun) return;
		notified.current = lastRun;

		if (lastRun.reason === "error") {
			notify.error(`A captura falhou: ${lastRun.errorMessage ?? "erro desconhecido"}`);
		} else if (lastRun.reason === "no-focus") {
			const seen = lastRun.activeWindowTitle ? ` Janela ativa: "${lastRun.activeWindowTitle}".` : "";
			notify.warning(`A captura não disparou: o jogo não estava em foco.${seen}`);
		} else if (lastRun.reason === "no-templates") {
			notify.warning("Nenhum pokémon ativo com imagem de referência.");
		} else if (lastRun.fired === 0) {
			notify.info(`Nenhum alvo encontrado (${lastRun.scanMs} ms de varredura).`);
		}
	}, [lastRun]);
};
