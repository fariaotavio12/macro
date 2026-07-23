import { useEffect, useState } from "react";
import type { PlayState } from "@shared/macro-types";

export const usePlayState = () => {
	const [states, setStates] = useState<Record<string, PlayState["status"]>>({});

	useEffect(
		() =>
			window.api.play.onState((state) => {
				setStates((prev) => ({ ...prev, [state.macroId]: state.status }));
			}),
		[],
	);

	return states;
};
