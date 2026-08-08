import { app } from "electron";
import fs from "node:fs";
import path from "node:path";
import type { CaptureProfile } from "../../shared/capture-types";
import { defaultCaptureProfile } from "../../shared/capture-types";

function getProfilesDir() {
	const dir = path.join(app.getPath("userData"), "capturas");
	fs.mkdirSync(dir, { recursive: true });
	return dir;
}

function profilePath(id: string) {
	return path.join(getProfilesDir(), `${id}.json`);
}

/** Preenche campos ausentes em perfis salvos por versões anteriores. */
function withDefaults(profile: CaptureProfile): CaptureProfile {
	return { ...defaultCaptureProfile(profile.id), ...profile, excludeRegions: profile.excludeRegions ?? [] };
}

export function listProfiles(): CaptureProfile[] {
	const dir = getProfilesDir();
	return fs
		.readdirSync(dir)
		.filter((file) => file.endsWith(".json"))
		.map((file) => withDefaults(JSON.parse(fs.readFileSync(path.join(dir, file), "utf-8")) as CaptureProfile))
		.sort((a, b) => a.name.localeCompare(b.name));
}

export function getProfile(id: string): CaptureProfile | null {
	const filePath = profilePath(id);
	if (!fs.existsSync(filePath)) return null;
	return withDefaults(JSON.parse(fs.readFileSync(filePath, "utf-8")) as CaptureProfile);
}

export function saveProfile(profile: CaptureProfile): CaptureProfile {
	fs.writeFileSync(profilePath(profile.id), JSON.stringify(profile, null, 2), "utf-8");
	return profile;
}

export function deleteProfile(id: string): void {
	const filePath = profilePath(id);
	if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
}
