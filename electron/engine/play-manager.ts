import { IpcChannel } from "../../shared/ipc-channels";
import type { Macro, PlayState } from "../../shared/macro-types";
import { sendToRenderer } from "../window-ref";
import { playMacro } from "./player";

const abortedMacroIds = new Set<string>();
const runningMacroIds = new Set<string>();

function emitState(macroId: string, status: PlayState["status"]) {
	sendToRenderer(IpcChannel.playState, { macroId, status } satisfies PlayState);
}

export function isRunning(macroId: string): boolean {
	return runningMacroIds.has(macroId);
}

export async function startPlaying(macro: Macro): Promise<void> {
	if (runningMacroIds.has(macro.id)) return;
	runningMacroIds.add(macro.id);
	abortedMacroIds.delete(macro.id);
	emitState(macro.id, "playing");
	try {
		await playMacro(macro, () => abortedMacroIds.has(macro.id));
	} finally {
		runningMacroIds.delete(macro.id);
		abortedMacroIds.delete(macro.id);
		emitState(macro.id, "stopped");
	}
}

export function stopPlaying(macroId: string): void {
	abortedMacroIds.add(macroId);
}

export function stopAll(): void {
	for (const id of runningMacroIds) abortedMacroIds.add(id);
}
