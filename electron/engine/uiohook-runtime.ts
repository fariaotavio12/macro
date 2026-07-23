import { uIOhook } from "uiohook-napi";

// uIOhook é um singleton global: precisa ficar rodando o app inteiro (para hotkeys/pânico
// funcionarem a qualquer momento), então start/stop são geridos aqui uma única vez.
// recorder.ts e hotkeys.ts apenas anexam/removem seus próprios listeners.
let started = false;

export function ensureUiohookStarted() {
	if (started) return;
	uIOhook.start();
	started = true;
}

export function shutdownUiohook() {
	if (!started) return;
	uIOhook.stop();
	started = false;
}
