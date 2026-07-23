import { app, BrowserWindow, Menu, Tray } from "electron";
import { markQuitting } from "./window-ref";

let tray: Tray | null = null;

export function createTray(mainWindow: BrowserWindow, iconPath: string) {
	if (tray) return;

	tray = new Tray(iconPath);
	tray.setToolTip("Macro App");

	const menu = Menu.buildFromTemplate([
		{
			label: "Abrir",
			click: () => {
				mainWindow.show();
				mainWindow.focus();
			},
		},
		{
			label: "Sair",
			click: () => {
				markQuitting();
				app.quit();
			},
		},
	]);
	tray.setContextMenu(menu);

	tray.on("click", () => {
		if (mainWindow.isVisible()) {
			mainWindow.hide();
		} else {
			mainWindow.show();
			mainWindow.focus();
		}
	});
}
