import type { CaptureRunState } from "@shared/capture-types";
import { useEffect, useState } from "react";

/** Estado ao vivo de cada perfil, alimentado pelo canal `capture:state` do processo main. */
export const useCaptureState = () => {
	const [states, setStates] = useState<Record<string, CaptureRunState>>({});

	useEffect(
		() =>
			window.api.capture.onState((state) => {
				setStates((prev) => ({ ...prev, [state.profileId]: state }));
			}),
		[],
	);

	return states;
};
