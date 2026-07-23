import { app } from "electron";
import fs from "node:fs";
import path from "node:path";
import type { Macro, Settings } from "../../shared/macro-types";

const DEFAULT_SETTINGS: Settings = { panicKey: "Escape" };

function getMacrosDir() {
	const dir = path.join(app.getPath("userData"), "macros");
	fs.mkdirSync(dir, { recursive: true });
	return dir;
}

function getSettingsPath() {
	return path.join(app.getPath("userData"), "settings.json");
}

function macroPath(id: string) {
	return path.join(getMacrosDir(), `${id}.json`);
}

export function listMacros(): Macro[] {
	const dir = getMacrosDir();
	return fs
		.readdirSync(dir)
		.filter((file) => file.endsWith(".json"))
		.map((file) => JSON.parse(fs.readFileSync(path.join(dir, file), "utf-8")) as Macro)
		.sort((a, b) => a.name.localeCompare(b.name));
}

export function getMacro(id: string): Macro | null {
	const filePath = macroPath(id);
	if (!fs.existsSync(filePath)) return null;
	return JSON.parse(fs.readFileSync(filePath, "utf-8")) as Macro;
}

export function saveMacro(macro: Macro): Macro {
	fs.writeFileSync(macroPath(macro.id), JSON.stringify(macro, null, 2), "utf-8");
	return macro;
}

export function deleteMacro(id: string): void {
	const filePath = macroPath(id);
	if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
}

export function getSettings(): Settings {
	const filePath = getSettingsPath();
	if (!fs.existsSync(filePath)) return DEFAULT_SETTINGS;
	return { ...DEFAULT_SETTINGS, ...(JSON.parse(fs.readFileSync(filePath, "utf-8")) as Settings) };
}

export function setSettings(settings: Settings): Settings {
	fs.writeFileSync(getSettingsPath(), JSON.stringify(settings, null, 2), "utf-8");
	return settings;
}
