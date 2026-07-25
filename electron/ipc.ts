import { ipcMain } from "electron";
import { IpcChannel } from "../shared/ipc-channels";
import type { Macro, Region, Settings } from "../shared/macro-types";
import * as storage from "./engine/storage";
import { startPlaying, stopPlaying } from "./engine/play-manager";
import { isPaused, pauseRecording, resumeRecording, startRecording, stopRecording } from "./engine/recorder";
import { assertNoHotkeyConflict, assertPanicKeyNoConflict, syncHotkeysFromStorage } from "./engine/hotkeys";
import { captureScreen, saveScreenshotCrop } from "./engine/screenshot";
import { broadcast, minimizeMainWindow, showMainWindow } from "./window-ref";
import { hideRecordingIndicator, showRecordingIndicator } from "./recording-indicator";
import { hideDockWindow, refreshDockFromSettings, toggleDockExpanded } from "./dock-window";
import type { RecordState } from "../shared/macro-types";

function broadcastRecordState(recording: boolean) {
	broadcast(IpcChannel.recordState, { recording, paused: recording && isPaused() } satisfies RecordState);
}

function broadcastMacrosChanged() {
	broadcast(IpcChannel.macroChanged, storage.listMacros());
}

export function registerIpcHandlers() {
	ipcMain.handle(IpcChannel.macroList, () => storage.listMacros());
	ipcMain.handle(IpcChannel.macroGet, (_event, id: string) => storage.getMacro(id));
	ipcMain.handle(IpcChannel.macroSave, (_event, macro: Macro) => {
		assertNoHotkeyConflict(macro);
		const saved = storage.saveMacro(macro);
		syncHotkeysFromStorage();
		broadcastMacrosChanged();
		return saved;
	});
	ipcMain.handle(IpcChannel.macroDelete, (_event, id: string) => {
		storage.deleteMacro(id);
		syncHotkeysFromStorage();
		broadcastMacrosChanged();
	});
	ipcMain.handle(IpcChannel.settingsGet, () => storage.getSettings());
	ipcMain.handle(IpcChannel.settingsSet, (_event, settings: Settings) => {
		assertPanicKeyNoConflict(settings);
		const saved = storage.setSettings(settings);
		syncHotkeysFromStorage();
		refreshDockFromSettings();
		return saved;
	});

	ipcMain.handle(IpcChannel.playStart, (_event, macroId: string) => {
		const macro = storage.getMacro(macroId);
		if (!macro) return;
		void startPlaying(macro);
	});
	ipcMain.handle(IpcChannel.playStop, (_event, macroId: string) => stopPlaying(macroId));

	ipcMain.handle(IpcChannel.recordStart, () => {
		// hook global primeiro e sozinho nesse tick — criar a janela indicadora e minimizar
		// são operações mais pesadas; adiadas para não atrasar a resposta do callback do
		// hook de teclado (o Windows pode desativar hooks WH_KEYBOARD_LL que demoram a responder).
		startRecording();
		broadcastRecordState(true);
		setImmediate(() => {
			minimizeMainWindow();
			showRecordingIndicator();
		});
	});
	ipcMain.handle(IpcChannel.recordPauseToggle, () => {
		if (isPaused()) resumeRecording();
		else pauseRecording();
		broadcastRecordState(true);
	});
	ipcMain.handle(IpcChannel.recordStop, () => {
		const steps = stopRecording();
		hideRecordingIndicator();
		broadcastRecordState(false);
		broadcast(IpcChannel.recordStopped, steps);
		return steps;
	});

	ipcMain.handle(IpcChannel.hotkeysSync, () => syncHotkeysFromStorage());

	ipcMain.handle(IpcChannel.screenshotCapture, () => captureScreen());
	ipcMain.handle(IpcChannel.screenshotCropSave, (_event, region: Region) => saveScreenshotCrop(region));

	ipcMain.handle(IpcChannel.dockToggle, (_event, expanded: boolean) => toggleDockExpanded(expanded));
	ipcMain.handle(IpcChannel.windowRestoreMain, () => {
		showMainWindow();
		hideDockWindow();
	});
}
