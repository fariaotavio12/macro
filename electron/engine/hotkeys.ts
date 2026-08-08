import { uIOhook } from "uiohook-napi";
import type { Macro, Settings } from "../../shared/macro-types";
import type { CaptureProfile } from "../../shared/capture-types";
import { MODIFIER_KEYS, UIOHOOK_KEYCODE_TO_CANONICAL, type CanonicalKey } from "../../shared/key-map";
import * as storage from "./storage";
import * as captureStorage from "./capture-storage";
import { startPlaying, stopAll } from "./play-manager";
import { stopAllCaptures, triggerCapture } from "./capture-runner";
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
let captureMap = new Map<Combo, CaptureProfile>();
let panicCombo: Combo = "Escape";
let listening = false;

// Segurar a tecla gera key-repeat do Windows. Sem debounce, um perfil em modo loop
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
		stopAllCaptures();
		return;
	}

	const macro = hotkeyMap.get(combo);
	if (macro?.active) {
		void playFromHotkey(macro);
		return;
	}

	const profile = captureMap.get(combo);
	if (profile?.active && !isDebounced(combo)) {
		triggerCapture(profile, "hotkey");
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

export function syncHotkeys(macros: Macro[], profiles: CaptureProfile[], settings: Settings) {
	hotkeyMap = new Map();
	for (const macro of macros) {
		if (macro.active && macro.hotkey) {
			hotkeyMap.set(macro.hotkey, macro);
		}
	}
	captureMap = new Map();
	for (const profile of profiles) {
		if (profile.active && profile.hotkey) {
			captureMap.set(profile.hotkey, profile);
		}
	}
	panicCombo = settings.panicKey;
}

export function syncHotkeysFromStorage() {
	syncHotkeys(storage.listMacros(), captureStorage.listProfiles(), storage.getSettings());
}

export function registerHotkeyListener() {
	if (listening) return;
	uIOhook.on("keydown", onKeydown);
	listening = true;
}

type ComboOwner = { kind: "panic" } | { kind: "macro"; name: string } | { kind: "capture"; name: string };

/** Quem já usa `combo` hoje, ignorando o próprio item que está sendo salvo. */
function findComboOwner(combo: Combo, ignoreId: string): ComboOwner | null {
	if (combo === storage.getSettings().panicKey) return { kind: "panic" };

	const macro = storage.listMacros().find((m) => m.id !== ignoreId && m.active && m.hotkey === combo);
	if (macro) return { kind: "macro", name: macro.name };

	const profile = captureStorage.listProfiles().find((p) => p.id !== ignoreId && p.active && p.hotkey === combo);
	if (profile) return { kind: "capture", name: profile.name };

	return null;
}

function conflictMessage(combo: Combo, owner: ComboOwner) {
	if (owner.kind === "panic") return `O atalho "${combo}" é igual à tecla de pânico. Escolha outro atalho.`;
	const label = owner.kind === "macro" ? "macro" : "captura";
	return `O atalho "${combo}" já está em uso pela ${label} "${owner.name}".`;
}

/** RN2/RN3: valida conflito de atalho antes de persistir. Lança erro com mensagem amigável. */
export function assertNoHotkeyConflict(macro: Macro) {
	if (!macro.active || !macro.hotkey) return;
	const owner = findComboOwner(macro.hotkey, macro.id);
	if (owner) throw new Error(conflictMessage(macro.hotkey, owner));
}

export function assertNoCaptureHotkeyConflict(profile: CaptureProfile) {
	if (!profile.active || !profile.hotkey) return;
	const owner = findComboOwner(profile.hotkey, profile.id);
	if (owner) throw new Error(conflictMessage(profile.hotkey, owner));
}

export function assertPanicKeyNoConflict(settings: Settings) {
	const macro = storage.listMacros().find((m) => m.active && m.hotkey === settings.panicKey);
	if (macro) {
		throw new Error(`A tecla de pânico "${settings.panicKey}" já está em uso pela macro "${macro.name}".`);
	}
	const profile = captureStorage.listProfiles().find((p) => p.active && p.hotkey === settings.panicKey);
	if (profile) {
		throw new Error(`A tecla de pânico "${settings.panicKey}" já está em uso pela captura "${profile.name}".`);
	}
}
