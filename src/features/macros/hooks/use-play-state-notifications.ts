import { notify } from "@/components";
import type { PlayState } from "@shared/macro-types";
import { useEffect, useRef } from "react";
import { useMacros } from "../api";
import { usePlayState } from "./use-play-state";

/** Notifica início/fim de execução mesmo quando disparado por atalho global em outra tela. */
export const usePlayStateNotifications = () => {
	const { data: macros } = useMacros();
	const playStates = usePlayState();
	// Comparação por referência: cada evento do main é um objeto novo, então dois bloqueios
	// seguidos notificam duas vezes em vez de virarem um só.
	const previous = useRef<Record<string, PlayState>>({});

	useEffect(() => {
		for (const [macroId, state] of Object.entries(playStates)) {
			const previousState = previous.current[macroId];
			if (previousState === state) continue;
			previous.current[macroId] = state;

			const name = macros?.find((m) => m.id === macroId)?.name ?? "Macro";
			if (state.status === "playing") {
				notify.info(`Executando "${name}"`);
			} else if (state.status === "blocked") {
				const seen = state.activeWindowTitle ? ` Janela ativa: "${state.activeWindowTitle}".` : "";
				notify.warning(`"${name}" não disparou: o jogo não estava em foco.${seen}`);
			} else if (state.status === "stopped" && previousState?.status === "playing") {
				notify.success(`"${name}" finalizada`);
			}
		}
	}, [playStates, macros]);
};
