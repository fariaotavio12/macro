export type MouseButton = "left" | "right" | "middle";

export type Step =
	| { id: string; type: "moveMouse"; x: number; y: number }
	| { id: string; type: "click"; button: MouseButton; x: number; y: number }
	| { id: string; type: "type"; text: string }
	| { id: string; type: "key"; keys: string[] }
	| { id: string; type: "wait"; ms: number };
// Fase 2: | { id: string; type: "clickImage"; imagePath: string; tolerance: number }

export type RepeatMode = "once" | "times" | "loop";

export type Repeat = {
	mode: RepeatMode;
	count?: number;
};

export type MouseMode = "jump" | "trajectory";

export type Macro = {
	id: string;
	name: string;
	steps: Step[];
	hotkey?: string;
	repeat: Repeat;
	mouseMode: MouseMode;
	active: boolean;
};

export type Settings = {
	panicKey: string;
};

export type PlayState = {
	macroId: string;
	status: "recording" | "playing" | "stopped";
};

export type RecordState = {
	recording: boolean;
	paused: boolean;
};
