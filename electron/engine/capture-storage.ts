import { app } from "electron";
import { randomUUID } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import type { CaptureConfig } from "../../shared/capture-types";
import { defaultCaptureConfig } from "../../shared/capture-types";
import type { LegacyCaptureProfile } from "./capture-config-migration";
import { migrateProfiles } from "./capture-config-migration";

/** Arquivo canônico da configuração global. Sua existência é o que marca a migração como feita. */
const CONFIG_FILE = "config.json";

function getProfilesDir() {
	const dir = path.join(app.getPath("userData"), "capturas");
	fs.mkdirSync(dir, { recursive: true });
	return dir;
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
			const normalized: LegacyCaptureProfile = {
				...defaultCaptureConfig(),
				...parsed,
				id: parsed.id ?? path.basename(file, ".json"),
				name: parsed.name ?? "Perfil legado",
				excludeRegions: parsed.excludeRegions ?? [],
			};
			profiles.push(normalized);
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
