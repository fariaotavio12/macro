import { BrowserWindow } from "electron";

let mainWindow: BrowserWindow | null = null;
let quitting = false;

export function setMainWindow(win: BrowserWindow) {
	mainWindow = win;
}

export function markQuitting() {
	quitting = true;
}

export function isQuitting() {
	return quitting;
}

export function sendToRenderer(channel: string, ...args: unknown[]) {
	if (mainWindow && !mainWindow.isDestroyed()) {
		mainWindow.webContents.send(channel, ...args);
	}
}

export function minimizeMainWindow() {
	if (mainWindow && !mainWindow.isDestroyed()) {
		mainWindow.minimize();
	}
}

export function broadcast(channel: string, ...args: unknown[]) {
	for (const win of BrowserWindow.getAllWindows()) {
		if (!win.isDestroyed()) {
			win.webContents.send(channel, ...args);
		}
	}
}
