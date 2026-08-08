import { getActiveWindow } from "@nut-tree-fork/nut-js";
import { getSettings } from "./storage";

export type FocusCheck = { focused: boolean; activeTitle?: string };

const ALLOWED: FocusCheck = { focused: true };

/** Override do item vence; vazio cai no título global das configurações. */
export function resolveExpectedTitle(override?: string): string | undefined {
	const own = override?.trim();
	if (own) return own;
	return getSettings().gameWindowTitle?.trim() || undefined;
}

/**
 * A janela em foco é a do jogo?
 *
 * Falha em aberto de propósito: sem título configurado, ou quando não dá para ler a janela
 * ativa, o disparo passa. A trava existe para evitar acionamento acidental fora do jogo —
 * não pode ser o motivo de uma macro deixar de funcionar por causa de uma API que falhou.
 */
export async function checkWindowFocus(expectedTitle?: string): Promise<FocusCheck> {
	const expected = resolveExpectedTitle(expectedTitle);
	if (!expected) return ALLOWED;
	try {
		const active = await getActiveWindow();
		const title = await active.title;
		return { focused: title.toLowerCase().includes(expected.toLowerCase()), activeTitle: title };
	} catch (error) {
		console.warn("[focus] não foi possível ler a janela ativa, seguindo sem a trava:", error);
		return ALLOWED;
	}
}
