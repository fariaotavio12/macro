import { ipcMain } from "electron";
import { IpcChannel } from "../shared/ipc-channels";
import type { Macro, Region, Settings } from "../shared/macro-types";
import type { CaptureConfig, CaptureProfile, CaptureScanPreview } from "../shared/capture-types";
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
import { captureScreen, captureScreenPreview, saveScreenshotCrop, screenSize, withAppWindowHidden } from "./engine/screenshot";
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

/** @deprecated Só existe enquanto a migração incremental para `CaptureConfig` não termina. */
function broadcastProfilesChanged() {
	broadcast(IpcChannel.captureProfilesChanged, captureStorage.listProfiles());
}

/**
 * Grab e varredura acontecem os dois com a janela escondida: com o app na frente, o
 * preview analisaria a própria interface em vez do jogo. O dock também sai da frente —
 * ele fica sempre por cima e cobriria parte do cenário.
 */
async function runScanPreview(config: CaptureConfig, includeImage: boolean): Promise<CaptureScanPreview> {
	const dockWasVisible = isDockVisible();
	if (dockWasVisible) hideDockWindow();
	try {
		return await withAppWindowHidden(async () => {
			// Chamada do dock não usa a imagem: sem ela, nem gera o base64.
			const capture = includeImage ? await captureScreenPreview() : await screenSize();
			const startedAt = Date.now();
			const targets = await findAllImages(
				config.templates.filter((template) => template.enabled && template.imagePath),
				{
					region: config.scanRegion,
					excludeRegions: config.excludeRegions,
					maxTargets: config.maxTargets,
					maxOverlap: config.maxOverlap,
				},
			);
			return { ...capture, scanRegion: config.scanRegion, targets, scanMs: Date.now() - startedAt };
		});
	} finally {
		if (dockWasVisible) showDockWindow();
	}
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

	ipcMain.handle(IpcChannel.captureGet, () => captureStorage.getConfig());
	ipcMain.handle(IpcChannel.captureSave, (_event, config: CaptureConfig) => {
		// Conflito primeiro: um atalho recusado não pode chegar ao disco nem ao registry.
		assertNoCaptureHotkeyConflict(config);
		const saved = captureStorage.saveConfig(config);
		// Editar templates ou região invalida a memória de alvos já disparados.
		resetCaptureCooldown();
		syncHotkeysFromStorage();
		broadcast(IpcChannel.captureChanged, saved);
		return saved;
	});
	// Clique no app ou no dock: sempre executa, a trava de foco vale só para o atalho.
	ipcMain.handle(IpcChannel.captureRun, () => triggerCapture(captureStorage.getConfig(), "manual"));
	ipcMain.handle(IpcChannel.captureStop, () => stopCapture());
	ipcMain.handle(IpcChannel.captureScanPreview, (_event, includeImage: boolean) =>
		runScanPreview(captureStorage.getConfig(), includeImage),
	);

	ipcMain.handle(IpcChannel.captureProfileList, () => captureStorage.listProfiles());
	ipcMain.handle(IpcChannel.captureProfileSave, (_event, profile: CaptureProfile) => {
		const saved = captureStorage.saveProfile(profile);
		resetCaptureCooldown();
		syncHotkeysFromStorage();
		broadcastProfilesChanged();
		return saved;
	});
	ipcMain.handle(IpcChannel.captureProfileDelete, (_event, id: string) => {
		stopCapture();
		captureStorage.deleteProfile(id);
		resetCaptureCooldown();
		syncHotkeysFromStorage();
		broadcastProfilesChanged();
	});
	ipcMain.handle(IpcChannel.captureProfileRun, (_event, id: string) => {
		const profile = captureStorage.getProfile(id);
		if (!profile) return;
		triggerCapture(profile, "manual");
	});
	ipcMain.handle(IpcChannel.captureProfileStop, () => stopCapture());
	ipcMain.handle(
		IpcChannel.captureProfileScanPreview,
		async (_event, id: string, includeImage: boolean): Promise<CaptureScanPreview | null> => {
			const profile = captureStorage.getProfile(id);
			if (!profile) return null;
			return runScanPreview(profile, includeImage);
		},
	);

	ipcMain.handle(IpcChannel.dockToggle, (_event, expanded: boolean) => toggleDockExpanded(expanded));
	ipcMain.handle(IpcChannel.windowRestoreMain, () => {
		showMainWindow();
		hideDockWindow();
	});
}
