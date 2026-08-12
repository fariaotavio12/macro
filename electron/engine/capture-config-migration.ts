import type { CaptureConfig, CaptureTemplate } from "../../shared/capture-types";
import { defaultCaptureConfig } from "../../shared/capture-types";

/**
 * Um perfil no formato antigo, um por arquivo em `userData/capturas`.
 *
 * Só a migração conhece `id` e `name`: eles existem aqui para ordenar os arquivos e
 * escolher a configuração-base, e não voltam para o domínio novo.
 */
export type LegacyCaptureProfile = CaptureConfig & {
	id: string;
	name: string;
};

const byName = (a: LegacyCaptureProfile, b: LegacyCaptureProfile) => a.name.localeCompare(b.name);

/**
 * Quem dita as opções da configuração global: o primeiro perfil ativo em ordem
 * alfabética e, se nenhum estiver ativo, o primeiro perfil.
 */
export function selectBaseProfile(profiles: LegacyCaptureProfile[]): LegacyCaptureProfile | undefined {
	const sorted = [...profiles].sort(byName);
	return sorted.find((profile) => profile.active) ?? sorted[0];
}

/**
 * Reúne os perfis legados em uma única configuração.
 *
 * Nenhum Pokémon é descartado: dois recortes com o mesmo nome ou a mesma imagem podem
 * ser alvos diferentes de propósito. Só o `id` repetido é trocado — a lista global usa
 * o id como chave — e apenas na ocorrência posterior, para o item do perfil-base manter
 * a identidade que já tinha.
 */
export function migrateProfiles(profiles: LegacyCaptureProfile[], createId: () => string): CaptureConfig {
	const base = selectBaseProfile(profiles);
	if (!base) return defaultCaptureConfig();

	const { id: _id, name: _name, ...options } = base;

	const usedIds = new Set<string>();
	const templates: CaptureTemplate[] = [];
	for (const profile of [...profiles].sort(byName)) {
		for (const template of profile.templates ?? []) {
			const id = usedIds.has(template.id) ? createId() : template.id;
			usedIds.add(id);
			templates.push({ ...template, id });
		}
	}

	return { ...options, templates };
}
