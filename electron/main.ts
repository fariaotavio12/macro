import { app, BrowserWindow } from "electron";
import path from "node:path";
import { registerIpcHandlers } from "./ipc";
import { setMainWindow } from "./window-ref";
import { ensureUiohookStarted, shutdownUiohook } from "./engine/uiohook-runtime";
import { registerHotkeyListener, syncHotkeysFromStorage } from "./engine/hotkeys";
import { createTray } from "./tray";
import { isQuitting } from "./window-ref";

process.env.APP_ROOT = path.join(__dirname, "..");

const VITE_DEV_SERVER_URL = process.env["VITE_DEV_SERVER_URL"];
const RENDERER_DIST = path.join(process.env.APP_ROOT, "dist");
const ICON_PATH = VITE_DEV_SERVER_URL
	? path.join(process.env.APP_ROOT, "public", "favicon.ico")
	: path.join(RENDERER_DIST, "favicon.ico");

let mainWindow: BrowserWindow | null = null;

function createWindow() {
	mainWindow = new BrowserWindow({
		width: 1200,
		height: 800,
		icon: ICON_PATH,
		webPreferences: {
			preload: path.join(__dirname, "preload.mjs"),
			contextIsolation: true,
			nodeIntegration: false,
		},
	});

	if (VITE_DEV_SERVER_URL) {
		mainWindow.loadURL(VITE_DEV_SERVER_URL);
		mainWindow.webContents.openDevTools();
		mainWindow.webContents.on("console-message", (event) => {
			console.log(`[renderer:${event.level}] ${event.message} (${event.sourceId}:${event.lineNumber})`);
		});
	} else {
		mainWindow.loadFile(path.join(RENDERER_DIST, "index.html"));
	}

	mainWindow.on("close", (event) => {
		if (!isQuitting()) {
			event.preventDefault();
			mainWindow?.hide();
		}
	});

	mainWindow.on("closed", () => {
		mainWindow = null;
	});

	setMainWindow(mainWindow);
	createTray(mainWindow, ICON_PATH);
}

app.on("window-all-closed", () => {
	if (process.platform !== "darwin" && isQuitting()) {
		app.quit();
	}
});

app.on("activate", () => {
	if (BrowserWindow.getAllWindows().length === 0) {
		createWindow();
	}
});

app.on("before-quit", () => {
	shutdownUiohook();
});

app.whenReady().then(() => {
	registerIpcHandlers();
	ensureUiohookStarted();
	registerHotkeyListener();
	syncHotkeysFromStorage();
	createWindow();
});
