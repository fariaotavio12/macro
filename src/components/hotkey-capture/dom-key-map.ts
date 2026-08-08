import type { CanonicalKey } from "@shared/key-map";

// Mapeia KeyboardEvent.code (layout-independente) do DOM para o mesmo nome canônico
// usado pelo lado Electron (uiohook), garantindo que o combo capturado na UI bata
// exatamente com o que electron/engine/hotkeys.ts monta em runtime.
const DOM_CODE_TO_CANONICAL: Record<string, CanonicalKey> = {
	ControlLeft: "Ctrl",
	ControlRight: "Ctrl",
	ShiftLeft: "Shift",
	ShiftRight: "Shift",
	AltLeft: "Alt",
	AltRight: "Alt",
	MetaLeft: "Win",
	MetaRight: "Win",
	Escape: "Escape",
	Enter: "Enter",
	Space: "Space",
	Tab: "Tab",
	Backspace: "Backspace",
	Delete: "Delete",
	Insert: "Insert",
	Home: "Home",
	End: "End",
	PageUp: "PageUp",
	PageDown: "PageDown",
	ArrowUp: "ArrowUp",
	ArrowDown: "ArrowDown",
	ArrowLeft: "ArrowLeft",
	ArrowRight: "ArrowRight",
	CapsLock: "CapsLock",
	Digit0: "0",
	Digit1: "1",
	Digit2: "2",
	Digit3: "3",
	Digit4: "4",
	Digit5: "5",
	Digit6: "6",
	Digit7: "7",
	Digit8: "8",
	Digit9: "9",
	KeyA: "A",
	KeyB: "B",
	KeyC: "C",
	KeyD: "D",
	KeyE: "E",
	KeyF: "F",
	KeyG: "G",
	KeyH: "H",
	KeyI: "I",
	KeyJ: "J",
	KeyK: "K",
	KeyL: "L",
	KeyM: "M",
	KeyN: "N",
	KeyO: "O",
	KeyP: "P",
	KeyQ: "Q",
	KeyR: "R",
	KeyS: "S",
	KeyT: "T",
	KeyU: "U",
	KeyV: "V",
	KeyW: "W",
	KeyX: "X",
	KeyY: "Y",
	KeyZ: "Z",
	F1: "F1",
	F2: "F2",
	F3: "F3",
	F4: "F4",
	F5: "F5",
	F6: "F6",
	F7: "F7",
	F8: "F8",
	F9: "F9",
	F10: "F10",
	F11: "F11",
	F12: "F12",
	Semicolon: "Semicolon",
	Equal: "Equal",
	Comma: "Comma",
	Minus: "Minus",
	Period: "Period",
	Slash: "Slash",
	Backquote: "Backquote",
	BracketLeft: "BracketLeft",
	Backslash: "Backslash",
	BracketRight: "BracketRight",
	Quote: "Quote",
	Numpad0: "Numpad0",
	Numpad1: "Numpad1",
	Numpad2: "Numpad2",
	Numpad3: "Numpad3",
	Numpad4: "Numpad4",
	Numpad5: "Numpad5",
	Numpad6: "Numpad6",
	Numpad7: "Numpad7",
	Numpad8: "Numpad8",
	Numpad9: "Numpad9",
	NumpadAdd: "NumpadAdd",
	NumpadSubtract: "NumpadSubtract",
	NumpadMultiply: "NumpadMultiply",
	NumpadDivide: "NumpadDivide",
	NumpadDecimal: "NumpadDecimal",
};

const MODIFIER_CANONICALS = new Set<CanonicalKey>(["Ctrl", "Shift", "Alt", "Win"]);

/** Se o evento é de uma tecla modificadora isolada (Ctrl/Shift/Alt/Win), devolve seu nome canônico. */
export const modifierFromDomEvent = (e: KeyboardEvent): CanonicalKey | null => {
	const canonical = DOM_CODE_TO_CANONICAL[e.code];
	return canonical && MODIFIER_CANONICALS.has(canonical) ? canonical : null;
};

/** Monta o combo final (modificadores atualmente pressionados + tecla não-modificadora). */
export const comboFromDomEvent = (e: KeyboardEvent): string | null => {
	const canonical = DOM_CODE_TO_CANONICAL[e.code];
	if (!canonical || MODIFIER_CANONICALS.has(canonical)) return null;

	const mods: string[] = [];
	if (e.ctrlKey) mods.push("Ctrl");
	if (e.altKey) mods.push("Alt");
	if (e.metaKey) mods.push("Win");
	if (e.shiftKey) mods.push("Shift");
	mods.sort();

	return [...mods, canonical].join("+");
};
