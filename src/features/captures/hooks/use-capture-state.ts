import type { CaptureRunState } from "@shared/capture-types";
import { useEffect, useMemo, useState } from "react";

const IDLE: CaptureRunState = { status: "idle" };

/** Estado ao vivo da única execução de Capturas, alimentado pelo canal `capture:state`. */
export const useCaptureState = () => {
	const [state, setState] = useState<CaptureRunState>(IDLE);

	useEffect(() => window.api.capture.onState(setState), []);

	return state;
};

/**
 * Mesmo estado singleton em forma de mapa, para as telas que ainda indexam por perfil.
 * A chave é fixa: o main não emite mais identidade nenhuma.
 *
 * @deprecated Só existe enquanto a migração incremental para `CaptureConfig` não termina.
 */
export const useCaptureProfileStates = (): Record<string, CaptureRunState> => {
	const state = useCaptureState();
	return useMemo(() => ({ capturas: state }), [state]);
};
