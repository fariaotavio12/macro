import { useEffect, useState } from "react";
import type { PlayState } from "@shared/macro-types";

/** Estado ao vivo de cada macro. Guarda o evento inteiro: `blocked` traz a janela em foco junto. */
export const usePlayState = () => {
	const [states, setStates] = useState<Record<string, PlayState>>({});

	useEffect(
		() =>
			window.api.play.onState((state) => {
				setStates((prev) => ({ ...prev, [state.macroId]: state }));
			}),
		[],
	);

	return states;
};
