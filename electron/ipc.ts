import { ipcMain } from "electron";
import { IpcChannel } from "../shared/ipc-channels";
import type { Macro, Region, Settings } from "../shared/macro-types";
import type { CaptureProfile, CaptureScanPreview } from "../shared/capture-types";
import * as storage from "./engine/storage";
import * as captureStorage from "./engine/capture-storage";
import { startPlaying, stopPlaying } from "./engine/play-manager";
import { isPaused, pauseRecording, resumeRecording, startRecording, stopRecording } from "./engine/recorder";
import {
	assertNoCaptureHotkeyConflict,
	assertNoHotkeyConflict,
	assertPanicKeyNoConflict,
	syncHotkeysFromStorage,
} from "./engine/hotkeys";
import { resetCaptureCooldown, stopCapture, triggerCapture } from "./engine/capture-runner";
import { findAllImages } from "./engine/vision";
import { captureScreen, captureScreenRaw, saveScreenshotCrop, withAppWindowHidden } from "./engine/screenshot";
import { broadcast, minimizeMainWindow, showMainWindow } from "./window-ref";
import { hideRecordingIndicator, showRecordingIndicator } from "./recording-indicator";
import { hideDockWindow, isDockVisible, refreshDockFromSettings, showDockWindow, toggleDockExpanded } from "./dock-window";
import type { RecordState } from "../shared/macro-types";

function broadcastRecordState(recording: boolean) {
	broadcast(IpcChannel.recordState, { recording, paused: recording && isPaused() } satisfies RecordState);
}

function broadcastMacrosChanged() {
	broadcast(IpcChannel.macroChanged, storage.listMacros());
}

function broadcastProfilesChanged() {
	broadcast(IpcChannel.captureChanged, captureStorage.listProfiles());
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

	ipcMain.handle(IpcChannel.captureList, () => captureStorage.listProfiles());
	ipcMain.handle(IpcChannel.captureGet, (_event, id: string) => captureStorage.getProfile(id));
	ipcMain.handle(IpcChannel.captureSave, (_event, profile: CaptureProfile) => {
		assertNoCaptureHotkeyConflict(profile);
		const saved = captureStorage.saveProfile(profile);
		// Editar templates ou região invalida a memória de alvos já disparados.
		resetCaptureCooldown(profile.id);
		syncHotkeysFromStorage();
		broadcastProfilesChanged();
		return saved;
	});
	ipcMain.handle(IpcChannel.captureDelete, (_event, id: string) => {
		stopCapture(id);
		captureStorage.deleteProfile(id);
		resetCaptureCooldown(id);
		syncHotkeysFromStorage();
		broadcastProfilesChanged();
	});
	ipcMain.handle(IpcChannel.captureRun, (_event, id: string) => {
		const profile = captureStorage.getProfile(id);
		if (!profile) return;
		triggerCapture(profile);
	});
	ipcMain.handle(IpcChannel.captureStop, (_event, id: string) => stopCapture(id));
	ipcMain.handle(IpcChannel.captureScanPreview, async (_event, id: string): Promise<CaptureScanPreview | null> => {
		const profile = captureStorage.getProfile(id);
		if (!profile) return null;
		// Grab e varredura acontecem os dois com a janela escondida: com o app na frente,
		// o preview analisaria a própria interface em vez do jogo. O dock também sai da
		// frente — ele fica sempre por cima e cobriria parte do cenário.
		const dockWasVisible = isDockVisible();
		if (dockWasVisible) hideDockWindow();
		try {
			return await withAppWindowHidden(async () => {
				const capture = await captureScreenRaw();
				const startedAt = Date.now();
				const targets = await findAllImages(
					profile.templates.filter((template) => template.enabled && template.imagePath),
					{ region: profile.scanRegion, excludeRegions: profile.excludeRegions, maxTargets: profile.maxTargets },
				);
				return { ...capture, scanRegion: profile.scanRegion, targets, scanMs: Date.now() - startedAt };
			});
		} finally {
			if (dockWasVisible) showDockWindow();
		}
	});

	ipcMain.handle(IpcChannel.dockToggle, (_event, expanded: boolean) => toggleDockExpanded(expanded));
	ipcMain.handle(IpcChannel.windowRestoreMain, () => {
		showMainWindow();
		hideDockWindow();
	});
}
