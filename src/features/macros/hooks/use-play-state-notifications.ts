import { notify } from "@/components";
import type { PlayState } from "@shared/macro-types";
import { useEffect, useRef } from "react";
import { useMacros } from "../api";
import { usePlayState } from "./use-play-state";

/** Notifica início/fim de execução mesmo quando disparado por atalho global em outra tela. */
export const usePlayStateNotifications = () => {
	const { data: macros } = useMacros();
	const playStates = usePlayState();
	const previous = useRef<Record<string, PlayState["status"]>>({});

	useEffect(() => {
		for (const [macroId, status] of Object.entries(playStates)) {
			const prevStatus = previous.current[macroId];
			if (prevStatus === status) continue;

			const name = macros?.find((m) => m.id === macroId)?.name ?? "Macro";
			if (status === "playing") {
				notify.info(`Executando "${name}"`);
			} else if (status === "stopped" && prevStatus === "playing") {
				notify.success(`"${name}" finalizada`);
			}
		}
		previous.current = playStates;
	}, [playStates, macros]);
};
