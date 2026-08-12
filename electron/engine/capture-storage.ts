import { app } from "electron";
import { randomUUID } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import type { CaptureConfig, CaptureProfile } from "../../shared/capture-types";
import { defaultCaptureConfig, defaultCaptureProfile } from "../../shared/capture-types";
import type { LegacyCaptureProfile } from "./capture-config-migration";
import { migrateProfiles } from "./capture-config-migration";

/** Arquivo canônico da configuração global. Sua existência é o que marca a migração como feita. */
const CONFIG_FILE = "config.json";

function getProfilesDir() {
	const dir = path.join(app.getPath("userData"), "capturas");
	fs.mkdirSync(dir, { recursive: true });
	return dir;
}

function profilePath(id: string) {
	return path.join(getProfilesDir(), `${id}.json`);
}

/** Preenche campos ausentes em configurações salvas por versões anteriores. */
function withConfigDefaults(config: CaptureConfig): CaptureConfig {
	return {
		...defaultCaptureConfig(),
		...config,
		templates: config.templates ?? [],
		excludeRegions: config.excludeRegions ?? [],
	};
}

/**
 * Lê os perfis antigos um arquivo por vez: um JSON corrompido não pode impedir a migração
 * dos outros. O nome do arquivo ignorado vai para o log.
 */
function readLegacyProfiles(dir: string): LegacyCaptureProfile[] {
	const profiles: LegacyCaptureProfile[] = [];
	for (const file of fs.readdirSync(dir)) {
		if (!file.endsWith(".json") || file === CONFIG_FILE) continue;
		try {
			const parsed = JSON.parse(fs.readFileSync(path.join(dir, file), "utf-8")) as LegacyCaptureProfile;
			profiles.push({ ...defaultCaptureProfile(parsed.id ?? path.basename(file, ".json")), ...parsed });
		} catch (error) {
			console.error(`[capture] perfil legado ignorado: "${file}"`, error);
		}
	}
	return profiles;
}

/**
 * Grava em arquivo temporário e renomeia: uma falha no meio da escrita deixa o último
 * `config.json` válido no lugar, em vez de um arquivo truncado.
 */
function writeConfig(config: CaptureConfig): CaptureConfig {
	const target = path.join(getProfilesDir(), CONFIG_FILE);
	const temp = `${target}.tmp`;
	fs.writeFileSync(temp, JSON.stringify(config, null, 2), "utf-8");
	fs.renameSync(temp, target);
	return config;
}

export function getConfig(): CaptureConfig {
	const dir = getProfilesDir();
	const target = path.join(dir, CONFIG_FILE);
	if (fs.existsSync(target)) {
		return withConfigDefaults(JSON.parse(fs.readFileSync(target, "utf-8")) as CaptureConfig);
	}
	// Primeira execução depois da atualização: reúne os perfis antigos uma única vez. Os
	// JSONs legados ficam no disco como backup e não são lidos novamente depois disto.
	return writeConfig(withConfigDefaults(migrateProfiles(readLegacyProfiles(dir), randomUUID)));
}

export function saveConfig(config: CaptureConfig): CaptureConfig {
	return writeConfig(withConfigDefaults(config));
}

/** Preenche campos ausentes em perfis salvos por versões anteriores. */
function withDefaults(profile: CaptureProfile): CaptureProfile {
	return { ...defaultCaptureProfile(profile.id), ...profile, excludeRegions: profile.excludeRegions ?? [] };
}

/** @deprecated Só existe enquanto a migração incremental para `CaptureConfig` não termina. */
export function listProfiles(): CaptureProfile[] {
	const dir = getProfilesDir();
	return fs
		.readdirSync(dir)
		.filter((file) => file.endsWith(".json") && file !== CONFIG_FILE)
		.map((file) => withDefaults(JSON.parse(fs.readFileSync(path.join(dir, file), "utf-8")) as CaptureProfile))
		.sort((a, b) => a.name.localeCompare(b.name));
}

/** @deprecated Só existe enquanto a migração incremental para `CaptureConfig` não termina. */
export function getProfile(id: string): CaptureProfile | null {
	const filePath = profilePath(id);
	if (!fs.existsSync(filePath)) return null;
	return withDefaults(JSON.parse(fs.readFileSync(filePath, "utf-8")) as CaptureProfile);
}

/** @deprecated Só existe enquanto a migração incremental para `CaptureConfig` não termina. */
export function saveProfile(profile: CaptureProfile): CaptureProfile {
	fs.writeFileSync(profilePath(profile.id), JSON.stringify(profile, null, 2), "utf-8");
	return profile;
}

/** @deprecated Só existe enquanto a migração incremental para `CaptureConfig` não termina. */
export function deleteProfile(id: string): void {
	const filePath = profilePath(id);
	if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
}
