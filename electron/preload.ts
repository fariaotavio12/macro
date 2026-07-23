import { contextBridge, ipcRenderer } from "electron";
import { IpcChannel } from "../shared/ipc-channels";
import type { Macro, PlayState, RecordState, Settings, Step } from "../shared/macro-types";

const macroBridge = {
	list: (): Promise<Macro[]> => ipcRenderer.invoke(IpcChannel.macroList),
	get: (id: string): Promise<Macro | null> => ipcRenderer.invoke(IpcChannel.macroGet, id),
	save: (macro: Macro): Promise<Macro> => ipcRenderer.invoke(IpcChannel.macroSave, macro),
	delete: (id: string): Promise<void> => ipcRenderer.invoke(IpcChannel.macroDelete, id),
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

const api = {
	macro: macroBridge,
	settings: settingsBridge,
	record: recordBridge,
	play: playBridge,
};

export type MacroApi = typeof api;

contextBridge.exposeInMainWorld("api", api);
