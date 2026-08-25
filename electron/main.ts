import { app, BrowserWindow, net, protocol } from "electron";
import fs from "node:fs";
import path from "node:path";
import { registerIpcHandlers } from "./ipc";
import { setMainWindow } from "./window-ref";
import { ensureUiohookStarted, shutdownUiohook } from "./engine/uiohook-runtime";
import { registerHotkeyListener, releaseHotkeys, syncHotkeysFromStorage } from "./engine/hotkeys";
import { resolveImagePath } from "./engine/storage";
import { createTray } from "./tray";
import { isQuitting } from "./window-ref";
import { showDockWindow } from "./dock-window";

export const MACRO_IMAGE_PROTOCOL = "macro-image";

protocol.registerSchemesAsPrivileged([
	{
		scheme: MACRO_IMAGE_PROTOCOL,
		privileges: { standard: true, secure: true, supportFetchAPI: true, bypassCSP: true },
	},
]);

process.env.APP_ROOT = path.join(__dirname, "..");

const VITE_DEV_SERVER_URL = process.env["VITE_DEV_SERVER_URL"];
const RENDERER_DIST = path.join(process.env.APP_ROOT, "dist");
const ICON_PATH = VITE_DEV_SERVER_URL
	? path.join(process.env.APP_ROOT, "public", "app-icon.png")
	: path.join(RENDERER_DIST, "app-icon.png");

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

	mainWindow.webContents.on("console-message", (event) => {
		console.log(`[renderer:${event.level}] ${event.message} (${event.sourceId}:${event.lineNumber})`);
	});
	mainWindow.webContents.on("did-fail-load", (_event, errorCode, errorDescription, validatedURL) => {
		console.log(`[did-fail-load] ${errorCode} ${errorDescription} url=${validatedURL}`);
	});
	mainWindow.webContents.on("render-process-gone", (_event, details) => {
		console.log(`[render-process-gone] ${JSON.stringify(details)}`);
	});

	if (VITE_DEV_SERVER_URL) {
		mainWindow.loadURL(VITE_DEV_SERVER_URL);
		mainWindow.webContents.openDevTools();
	} else {
		mainWindow.loadFile(path.join(RENDERER_DIST, "index.html"));
	}

	mainWindow.on("close", (event) => {
		if (!isQuitting()) {
			event.preventDefault();
			mainWindow?.hide();
			showDockWindow();
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

function registerMacroImageProtocol() {
	protocol.handle(MACRO_IMAGE_PROTOCOL, (request) => {
		const fileName = new URL(request.url).hostname;
		const filePath = resolveImagePath(fileName);
		if (!fs.existsSync(filePath)) return new Response(null, { status: 404 });
		return net.fetch(`file://${filePath.replace(/\\/g, "/")}`);
	});
}

app.whenReady().then(() => {
	registerIpcHandlers();
	registerMacroImageProtocol();
	ensureUiohookStarted();
	registerHotkeyListener();
	syncHotkeysFromStorage();
	createWindow();
});

app.on("will-quit", () => {
	releaseHotkeys();
});
