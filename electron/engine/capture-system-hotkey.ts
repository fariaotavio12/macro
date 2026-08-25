import type { CaptureConfig } from "../../shared/capture-types";

type GlobalShortcutApi = {
	register: (accelerator: string, callback: () => void) => boolean;
	unregister: (accelerator: string) => void;
};

const toAccelerator = (hotkey: string) => hotkey.replace("Ctrl", "Control").replace("Win", "Super");

/** Registra a Captura no atalho do sistema e troca o callback sem duplicar o binding. */
export const createCaptureSystemHotkey = (shortcuts: GlobalShortcutApi) => {
	let registeredAccelerator: string | undefined;
	let trigger: (() => void) | undefined;

	const release = () => {
		if (!registeredAccelerator) return;
		shortcuts.unregister(registeredAccelerator);
		registeredAccelerator = undefined;
	};

	return {
		sync: (config: CaptureConfig, nextTrigger: () => void) => {
			trigger = nextTrigger;
			const nextAccelerator = config.active && config.hotkey ? toAccelerator(config.hotkey) : undefined;
			if (nextAccelerator === registeredAccelerator) return Boolean(registeredAccelerator);

			release();
			if (!nextAccelerator) return false;

			let registered = false;
			try {
				registered = shortcuts.register(nextAccelerator, () => trigger?.());
			} catch {
				return false;
			}
			if (!registered) return false;

			registeredAccelerator = nextAccelerator;
			return true;
		},
		release,
	};
};
