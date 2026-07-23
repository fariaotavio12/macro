import { uIOhook } from "uiohook-napi";
import type { MouseButton, Step } from "../../shared/macro-types";
import { MODIFIER_KEYS, PUNCTUATION_CHAR, UIOHOOK_KEYCODE_TO_CANONICAL, type CanonicalKey } from "../../shared/key-map";

const SHIFT_DIGIT_SYMBOL: Record<string, string> = {
	"1": "!",
	"2": "@",
	"3": "#",
	"4": "$",
	"5": "%",
	"6": "^",
	"7": "&",
	"8": "*",
	"9": "(",
	"0": ")",
};

const NUMPAD_CHAR: Partial<Record<CanonicalKey, string>> = {
	Numpad0: "0",
	Numpad1: "1",
	Numpad2: "2",
	Numpad3: "3",
	Numpad4: "4",
	Numpad5: "5",
	Numpad6: "6",
	Numpad7: "7",
	Numpad8: "8",
	Numpad9: "9",
	NumpadAdd: "+",
	NumpadSubtract: "-",
	NumpadMultiply: "*",
	NumpadDivide: "/",
	NumpadDecimal: ".",
};

const MIN_WAIT_MS = 15;

const BUTTON_MAP: Record<number, MouseButton> = { 1: "left", 2: "right", 3: "middle" };

type KeydownEvent = { keycode: number; ctrlKey: boolean; altKey: boolean; shiftKey: boolean; metaKey: boolean };

let steps: Step[] = [];
let recording = false;
let paused = false;
let lastActionTime = 0;
let textBuffer = "";
let textBufferStartTime = 0;
let stepIdCounter = 0;

const nextId = () => {
	stepIdCounter += 1;
	return `s${stepIdCounter}`;
};

const pushWait = (before: number) => {
	const gap = before - lastActionTime;
	if (gap > MIN_WAIT_MS) {
		steps.push({ id: nextId(), type: "wait", ms: gap });
	}
};

const flushText = (now: number) => {
	if (!textBuffer) return;
	pushWait(textBufferStartTime);
	steps.push({ id: nextId(), type: "type", text: textBuffer });
	textBuffer = "";
	lastActionTime = now;
};

const appendToBuffer = (now: number, char: string) => {
	if (!textBuffer) textBufferStartTime = now;
	textBuffer += char;
};

// O clique já carrega a posição (x, y) — não gravamos o mouse se movendo entre ações,
// só o momento e o local em que ele efetivamente clica.
const handleClick = (e: { x: number; y: number; button: unknown }) => {
	const now = Date.now();
	flushText(now);
	pushWait(now);
	const button = BUTTON_MAP[Number(e.button)] ?? "left";
	steps.push({ id: nextId(), type: "click", button, x: e.x, y: e.y });
	lastActionTime = now;
};

const handleKeydown = (e: KeydownEvent) => {
	const canonical = UIOHOOK_KEYCODE_TO_CANONICAL[e.keycode];
	if (!canonical || MODIFIER_KEYS.has(canonical)) return;

	const now = Date.now();
	const hasCombo = e.ctrlKey || e.altKey || e.metaKey;

	if (hasCombo) {
		flushText(now);
		pushWait(now);
		const keys: CanonicalKey[] = [];
		if (e.ctrlKey) keys.push("Ctrl");
		if (e.altKey) keys.push("Alt");
		if (e.metaKey) keys.push("Win");
		if (e.shiftKey) keys.push("Shift");
		keys.push(canonical);
		steps.push({ id: nextId(), type: "key", keys });
		lastActionTime = now;
		return;
	}

	if (/^[A-Z]$/.test(canonical)) {
		appendToBuffer(now, e.shiftKey ? canonical : canonical.toLowerCase());
		return;
	}
	if (/^[0-9]$/.test(canonical)) {
		appendToBuffer(now, e.shiftKey ? SHIFT_DIGIT_SYMBOL[canonical] : canonical);
		return;
	}
	if (canonical === "Space") {
		appendToBuffer(now, " ");
		return;
	}
	const punctuation = PUNCTUATION_CHAR[canonical];
	if (punctuation) {
		appendToBuffer(now, e.shiftKey ? punctuation.shifted : punctuation.plain);
		return;
	}
	const numpadChar = NUMPAD_CHAR[canonical];
	if (numpadChar) {
		appendToBuffer(now, numpadChar);
		return;
	}

	flushText(now);
	pushWait(now);
	steps.push({ id: nextId(), type: "key", keys: [canonical] });
	lastActionTime = now;
};

const attachListeners = () => {
	uIOhook.on("click", handleClick);
	uIOhook.on("keydown", handleKeydown);
};

const detachListeners = () => {
	uIOhook.removeListener("click", handleClick);
	uIOhook.removeListener("keydown", handleKeydown);
};

export const startRecording = () => {
	steps = [];
	textBuffer = "";
	stepIdCounter = 0;
	lastActionTime = Date.now();
	recording = true;
	paused = false;

	attachListeners();
};

export const pauseRecording = () => {
	if (!recording || paused) return;
	detachListeners();
	flushText(Date.now());
	paused = true;
};

export const resumeRecording = () => {
	if (!recording || !paused) return;
	lastActionTime = Date.now();
	attachListeners();
	paused = false;
};

export const isPaused = () => paused;

export const stopRecording = (): Step[] => {
	if (!recording) return steps;
	recording = false;
	if (!paused) detachListeners();
	paused = false;
	flushText(Date.now());
	return steps;
};
