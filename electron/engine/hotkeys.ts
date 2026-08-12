import { uIOhook } from "uiohook-napi";
import type { Macro, Settings } from "../../shared/macro-types";
import type { CaptureConfig } from "../../shared/capture-types";
import { MODIFIER_KEYS, UIOHOOK_KEYCODE_TO_CANONICAL, type CanonicalKey } from "../../shared/key-map";
import * as storage from "./storage";
import * as captureStorage from "./capture-storage";
import { startPlaying, stopAll } from "./play-manager";
import { stopCapture, triggerCapture } from "./capture-runner";
import { checkWindowFocus } from "./window-focus";
import { IpcChannel } from "../../shared/ipc-channels";
import type { PlayState } from "../../shared/macro-types";
import { sendToRenderer } from "../window-ref";

type Combo = string;

type KeydownEvent = {
	keycode: number;
	ctrlKey: boolean;
	altKey: boolean;
	shiftKey: boolean;
	metaKey: boolean;
};

export function comboKey(keys: CanonicalKey[]): Combo {
	const mods = keys.filter((k) => MODIFIER_KEYS.has(k)).sort();
	const rest = keys.filter((k) => !MODIFIER_KEYS.has(k));
	return [...mods, ...rest].join("+");
}

let hotkeyMap = new Map<Combo, Macro>();
/** Uma única configuração de Capturas concorre pelos atalhos. */
let captureConfig: CaptureConfig | null = null;
let panicCombo: Combo = "Escape";
let listening = false;

// Segurar a tecla gera key-repeat do Windows. Sem debounce, o modo loop
// ligaria e desligaria dezenas de vezes num único toque.
const HOTKEY_DEBOUNCE_MS = 300;
const lastTriggerAt = new Map<Combo, number>();

function comboFromEvent(e: KeydownEvent): Combo | null {
	const canonical = UIOHOOK_KEYCODE_TO_CANONICAL[e.keycode];
	if (!canonical || MODIFIER_KEYS.has(canonical)) return null;
	const keys: CanonicalKey[] = [];
	if (e.ctrlKey) keys.push("Ctrl");
	if (e.altKey) keys.push("Alt");
	if (e.metaKey) keys.push("Win");
	if (e.shiftKey) keys.push("Shift");
	keys.push(canonical);
	return comboKey(keys);
}

function isDebounced(combo: Combo): boolean {
	const now = Date.now();
	const last = lastTriggerAt.get(combo) ?? 0;
	if (now - last < HOTKEY_DEBOUNCE_MS) return true;
	lastTriggerAt.set(combo, now);
	return false;
}

function onKeydown(e: KeydownEvent) {
	const combo = comboFromEvent(e);
	if (!combo) return;

	// RN1: tecla de pânico tem prioridade máxima sobre qualquer execução.
	if (combo === panicCombo) {
		stopAll();
		stopCapture();
		return;
	}

	const macro = hotkeyMap.get(combo);
	if (macro?.active) {
		void playFromHotkey(macro);
		return;
	}

	if (captureConfig?.hotkey === combo && !isDebounced(combo)) {
		triggerCapture(captureConfig, "hotkey");
	}
}

/**
 * O atalho é global: sem a trava, um toque acidental fora do jogo reproduz a macro em cima
 * do que estiver na frente — clicando e digitando em outro app.
 */
async function playFromHotkey(macro: Macro) {
	if (macro.requireGameFocus) {
		const focus = await checkWindowFocus();
		if (!focus.focused) {
			sendToRenderer(IpcChannel.playState, {
				macroId: macro.id,
				status: "blocked",
				activeWindowTitle: focus.activeTitle,
			} satisfies PlayState);
			return;
		}
	}
	await startPlaying(macro);
}

export function syncHotkeys(macros: Macro[], config: CaptureConfig, settings: Settings) {
	hotkeyMap = new Map();
	for (const macro of macros) {
		if (macro.active && macro.hotkey) {
			hotkeyMap.set(macro.hotkey, macro);
		}
	}
	captureConfig = config.active && config.hotkey ? config : null;
	panicCombo = settings.panicKey;
}

export function syncHotkeysFromStorage() {
	syncHotkeys(storage.listMacros(), captureStorage.getConfig(), storage.getSettings());
}

export function registerHotkeyListener() {
	if (listening) return;
	uIOhook.on("keydown", onKeydown);
	listening = true;
}

type ComboOwner = { kind: "panic" } | { kind: "macro"; name: string } | { kind: "capture" };

/** Quem já usa `combo` hoje, ignorando o próprio item que está sendo salvo. */
function findComboOwner(combo: Combo, ignore: { macroId?: string; capture?: boolean }): ComboOwner | null {
	if (combo === storage.getSettings().panicKey) return { kind: "panic" };

	const macro = storage.listMacros().find((m) => m.id !== ignore.macroId && m.active && m.hotkey === combo);
	if (macro) return { kind: "macro", name: macro.name };

	if (!ignore.capture) {
		const config = captureStorage.getConfig();
		if (config.active && config.hotkey === combo) return { kind: "capture" };
	}

	return null;
}

function conflictMessage(combo: Combo, owner: ComboOwner) {
	if (owner.kind === "panic") return `O atalho "${combo}" é igual à tecla de pânico. Escolha outro atalho.`;
	if (owner.kind === "capture") return `O atalho "${combo}" já está em uso pelas Capturas.`;
	return `O atalho "${combo}" já está em uso pela macro "${owner.name}".`;
}

/** RN2/RN3: valida conflito de atalho antes de persistir. Lança erro com mensagem amigável. */
export function assertNoHotkeyConflict(macro: Macro) {
	if (!macro.active || !macro.hotkey) return;
	const owner = findComboOwner(macro.hotkey, { macroId: macro.id });
	if (owner) throw new Error(conflictMessage(macro.hotkey, owner));
}

export function assertNoCaptureHotkeyConflict(config: CaptureConfig) {
	if (!config.active || !config.hotkey) return;
	const owner = findComboOwner(config.hotkey, { capture: true });
	if (owner) throw new Error(conflictMessage(config.hotkey, owner));
}

export function assertPanicKeyNoConflict(settings: Settings) {
	const macro = storage.listMacros().find((m) => m.active && m.hotkey === settings.panicKey);
	if (macro) {
		throw new Error(`A tecla de pânico "${settings.panicKey}" já está em uso pela macro "${macro.name}".`);
	}
	const config = captureStorage.getConfig();
	if (config.active && config.hotkey === settings.panicKey) {
		throw new Error(`A tecla de pânico "${settings.panicKey}" já está em uso pelas Capturas.`);
	}
}
