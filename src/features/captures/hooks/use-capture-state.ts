import type { CaptureRunState } from "@shared/capture-types";
import { useEffect, useState } from "react";

const IDLE: CaptureRunState = { status: "idle" };

/** Estado ao vivo da única execução de Capturas, alimentado pelo canal `capture:state`. */
export const useCaptureState = () => {
	const [state, setState] = useState<CaptureRunState>(IDLE);

	useEffect(() => window.api.capture.onState(setState), []);

	return state;
};
