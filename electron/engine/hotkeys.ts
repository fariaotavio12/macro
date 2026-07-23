import { uIOhook } from "uiohook-napi";
import type { Macro, Settings } from "../../shared/macro-types";
import { MODIFIER_KEYS, UIOHOOK_KEYCODE_TO_CANONICAL, type CanonicalKey } from "../../shared/key-map";
import * as storage from "./storage";
import { startPlaying, stopAll } from "./play-manager";

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
let panicCombo: Combo = "Escape";
let listening = false;

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

function onKeydown(e: KeydownEvent) {
	const combo = comboFromEvent(e);
	if (!combo) return;

	// RN1: tecla de pânico tem prioridade máxima sobre qualquer execução.
	if (combo === panicCombo) {
		stopAll();
		return;
	}

	const macro = hotkeyMap.get(combo);
	if (macro?.active) {
		void startPlaying(macro);
	}
}

export function syncHotkeys(macros: Macro[], settings: Settings) {
	hotkeyMap = new Map();
	for (const macro of macros) {
		if (macro.active && macro.hotkey) {
			hotkeyMap.set(macro.hotkey, macro);
		}
	}
	panicCombo = settings.panicKey;
}

export function syncHotkeysFromStorage() {
	syncHotkeys(storage.listMacros(), storage.getSettings());
}

export function registerHotkeyListener() {
	if (listening) return;
	uIOhook.on("keydown", onKeydown);
	listening = true;
}

/** RN2/RN3: valida conflito de atalho antes de persistir. Lança erro com mensagem amigável. */
export function assertNoHotkeyConflict(macro: Macro) {
	if (!macro.active || !macro.hotkey) return;
	const settings = storage.getSettings();
	if (macro.hotkey === settings.panicKey) {
		throw new Error(`O atalho "${macro.hotkey}" é igual à tecla de pânico. Escolha outro atalho.`);
	}
	const conflict = storage.listMacros().find((m) => m.id !== macro.id && m.active && m.hotkey === macro.hotkey);
	if (conflict) {
		throw new Error(`O atalho "${macro.hotkey}" já está em uso pela macro "${conflict.name}".`);
	}
}

export function assertPanicKeyNoConflict(settings: Settings) {
	const conflict = storage.listMacros().find((m) => m.active && m.hotkey === settings.panicKey);
	if (conflict) {
		throw new Error(`A tecla de pânico "${settings.panicKey}" já está em uso pela macro "${conflict.name}".`);
	}
}
