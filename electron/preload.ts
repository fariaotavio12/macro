import { contextBridge, ipcRenderer } from "electron";
import { IpcChannel } from "../shared/ipc-channels";
import type { Macro, PlayState, RecordState, Region, Settings, Step } from "../shared/macro-types";
import type { CaptureProfile, CaptureProfileRunState, CaptureScanPreview } from "../shared/capture-types";
import type { CaptureResult, CropSaveResult } from "./engine/screenshot";

const macroBridge = {
	list: (): Promise<Macro[]> => ipcRenderer.invoke(IpcChannel.macroList),
	get: (id: string): Promise<Macro | null> => ipcRenderer.invoke(IpcChannel.macroGet, id),
	save: (macro: Macro): Promise<Macro> => ipcRenderer.invoke(IpcChannel.macroSave, macro),
	delete: (id: string): Promise<void> => ipcRenderer.invoke(IpcChannel.macroDelete, id),
	onChanged: (listener: (macros: Macro[]) => void) => {
		const handler = (_event: Electron.IpcRendererEvent, macros: Macro[]) => listener(macros);
		ipcRenderer.on(IpcChannel.macroChanged, handler);
		return () => {
			ipcRenderer.removeListener(IpcChannel.macroChanged, handler);
		};
	},
};

const settingsBridge = {
	get: (): Promise<Settings> => ipcRenderer.invoke(IpcChannel.settingsGet),
	set: (settings: Settings): Promise<Settings> => ipcRenderer.invoke(IpcChannel.settingsSet, settings),
};

const recordBridge = {
	start: (): Promise<void> => ipcRenderer.invoke(IpcChannel.recordStart),
	stop: (): Promise<Step[]> => ipcRenderer.invoke(IpcChannel.recordStop),
	pauseToggle: (): Promise<void> => ipcRenderer.invoke(IpcChannel.recordPauseToggle),
	onState: (listener: (state: RecordState) => void) => {
		const handler = (_event: Electron.IpcRendererEvent, state: RecordState) => listener(state);
		ipcRenderer.on(IpcChannel.recordState, handler);
		return () => {
			ipcRenderer.removeListener(IpcChannel.recordState, handler);
		};
	},
	onStopped: (listener: (steps: Step[]) => void) => {
		const handler = (_event: Electron.IpcRendererEvent, steps: Step[]) => listener(steps);
		ipcRenderer.on(IpcChannel.recordStopped, handler);
		return () => {
			ipcRenderer.removeListener(IpcChannel.recordStopped, handler);
		};
	},
};

const playBridge = {
	start: (macroId: string): Promise<void> => ipcRenderer.invoke(IpcChannel.playStart, macroId),
	stop: (macroId: string): Promise<void> => ipcRenderer.invoke(IpcChannel.playStop, macroId),
	onState: (listener: (state: PlayState) => void) => {
		const handler = (_event: Electron.IpcRendererEvent, state: PlayState) => listener(state);
		ipcRenderer.on(IpcChannel.playState, handler);
		return () => {
			ipcRenderer.removeListener(IpcChannel.playState, handler);
		};
	},
};

const screenshotBridge = {
	capture: (): Promise<CaptureResult> => ipcRenderer.invoke(IpcChannel.screenshotCapture),
	cropSave: (region: Region): Promise<CropSaveResult> => ipcRenderer.invoke(IpcChannel.screenshotCropSave, region),
};

const captureBridge = {
	list: (): Promise<CaptureProfile[]> => ipcRenderer.invoke(IpcChannel.captureList),
	get: (id: string): Promise<CaptureProfile | null> => ipcRenderer.invoke(IpcChannel.captureGet, id),
	save: (profile: CaptureProfile): Promise<CaptureProfile> => ipcRenderer.invoke(IpcChannel.captureSave, profile),
	delete: (id: string): Promise<void> => ipcRenderer.invoke(IpcChannel.captureDelete, id),
	run: (id: string): Promise<void> => ipcRenderer.invoke(IpcChannel.captureRun, id),
	stop: (id: string): Promise<void> => ipcRenderer.invoke(IpcChannel.captureStop, id),
	/** `includeImage: false` devolve só alvos e tempo — o print base64 é caro de trafegar. */
	scanPreview: (id: string, includeImage = true): Promise<CaptureScanPreview | null> =>
		ipcRenderer.invoke(IpcChannel.captureScanPreview, id, includeImage),
	onChanged: (listener: (profiles: CaptureProfile[]) => void) => {
		const handler = (_event: Electron.IpcRendererEvent, profiles: CaptureProfile[]) => listener(profiles);
		ipcRenderer.on(IpcChannel.captureChanged, handler);
		return () => {
			ipcRenderer.removeListener(IpcChannel.captureChanged, handler);
		};
	},
	onState: (listener: (state: CaptureProfileRunState) => void) => {
		const handler = (_event: Electron.IpcRendererEvent, state: CaptureProfileRunState) => listener(state);
		ipcRenderer.on(IpcChannel.captureState, handler);
		return () => {
			ipcRenderer.removeListener(IpcChannel.captureState, handler);
		};
	},
};

const dockBridge = {
	toggle: (expanded: boolean): Promise<void> => ipcRenderer.invoke(IpcChannel.dockToggle, expanded),
};

const windowBridge = {
	restoreMain: (): Promise<void> => ipcRenderer.invoke(IpcChannel.windowRestoreMain),
};

const api = {
	macro: macroBridge,
	settings: settingsBridge,
	record: recordBridge,
	play: playBridge,
	screenshot: screenshotBridge,
	capture: captureBridge,
	dock: dockBridge,
	window: windowBridge,
};

export type MacroApi = typeof api;

contextBridge.exposeInMainWorld("api", api);
