export type MouseButton = "left" | "right" | "middle";

export type Region = { x: number; y: number; width: number; height: number };

export type Condition =
	| { kind: "pixelColor"; x: number; y: number; color: string; tolerance: number; negate?: boolean }
	| { kind: "imageFound"; imagePath: string; tolerance: number; region?: Region; negate?: boolean };

export type Step =
	| { id: string; type: "moveMouse"; x: number; y: number }
	| { id: string; type: "click"; button: MouseButton; x: number; y: number }
	| { id: string; type: "type"; text: string }
	| { id: string; type: "key"; keys: string[] }
	| { id: string; type: "wait"; ms: number }
	| { id: string; type: "clickImage"; imagePath: string; tolerance: number; timeoutMs: number; button: MouseButton }
	| { id: string; type: "if"; condition: Condition; then: Step[]; else: Step[] };

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

export type DockSide = "left" | "right";
export type DockVertical = "top" | "center" | "bottom";
export type DockPosition = `${DockSide}-${DockVertical}`;

export type Settings = {
	panicKey: string;
	dockEnabled: boolean;
	dockPosition: DockPosition;
};

export type PlayState = {
	macroId: string;
	status: "recording" | "playing" | "stopped";
};

export type RecordState = {
	recording: boolean;
	paused: boolean;
};
