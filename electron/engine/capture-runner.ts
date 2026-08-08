import { Button, keyboard, mouse, Point, screen } from "@nut-tree-fork/nut-js";
import { IpcChannel } from "../../shared/ipc-channels";
import type { CanonicalKey } from "../../shared/key-map";
import type { CaptureProfile, CaptureRunSummary, CaptureTarget } from "../../shared/capture-types";
import { sendToRenderer } from "../window-ref";
import { CANONICAL_TO_NUT_KEY } from "./key-map-nut";
import { findAllImages } from "./vision";
import { checkWindowFocus } from "./window-focus";

/** De onde veio o disparo. Clique manual ignora a trava de foco: foi intencional. */
export type TriggerSource = "hotkey" | "manual";

type FiredTarget = { x: number; y: number; at: number };

const running = new Set<string>();
const looping = new Set<string>();
const aborted = new Set<string>();
const firedByProfile = new Map<string, FiredTarget[]>();

function emitState(profileId: string, status: "idle" | "scanning" | "acting", lastRun?: CaptureRunSummary) {
	sendToRenderer(IpcChannel.captureState, { profileId, status, lastRun });
}

function sleep(ms: number, isAborted: () => boolean): Promise<void> {
	return new Promise((resolve) => {
		if (ms <= 0) return resolve();
		const start = Date.now();
		const tick = () => {
			if (isAborted() || Date.now() - start >= ms) return resolve();
			setTimeout(tick, Math.min(20, ms));
		};
		tick();
	});
}

async function checkGameFocus(profile: CaptureProfile, source: TriggerSource) {
	if (source === "manual" || !profile.requireGameFocus) return { focused: true, activeTitle: undefined };
	return checkWindowFocus(profile.gameWindowTitle);
}

function resolveKeys(combo: string) {
	return combo
		.split("+")
		.map((name) => CANONICAL_TO_NUT_KEY[name.trim() as CanonicalKey])
		.filter(Boolean);
}

// 40% do MENOR lado: com metade do maior lado, um recorte mais alto que o tile do jogo
// engolia o corpo do tile de baixo como se fosse o mesmo alvo.
function cooldownRadius(profile: CaptureProfile, target: CaptureTarget) {
	return profile.cooldownRadiusPx ?? Math.max(Math.min(target.width, target.height) * 0.4, 8);
}

function centerOf(target: CaptureTarget) {
	return { x: Math.round(target.x + target.width / 2), y: Math.round(target.y + target.height / 2) };
}

/**
 * Descarta alvos que receberam pokébola há pouco tempo. A memória é por **coordenada de
 * tela**: se o personagem andar entre um acionamento e outro os corpos mudam de lugar e o
 * cooldown perde a referência — por isso o TTL curto por padrão.
 */
function filterByCooldown(profile: CaptureProfile, targets: CaptureTarget[], firedThisRun: FiredTarget[]) {
	const now = Date.now();
	const fromProfile =
		profile.targetCooldownMs > 0
			? (firedByProfile.get(profile.id) ?? []).filter((entry) => now - entry.at < profile.targetCooldownMs)
			: [];
	if (profile.targetCooldownMs > 0) firedByProfile.set(profile.id, fromProfile);

	// firedThisRun entra sempre: sem ele, a segunda passada rejogaria pokébola nos mesmos
	// corpos quando o cooldown do perfil está desligado.
	const fired = [...fromProfile, ...firedThisRun];

	const isOnCooldown = (target: CaptureTarget) => {
		const center = centerOf(target);
		const radius = cooldownRadius(profile, target);
		return fired.some((entry) => Math.abs(entry.x - center.x) < radius && Math.abs(entry.y - center.y) < radius);
	};

	const fresh = targets.filter((target) => !isOnCooldown(target));
	return { fresh, skipped: targets.length - fresh.length };
}

function rememberFired(profileId: string, center: { x: number; y: number }) {
	const fired = firedByProfile.get(profileId) ?? [];
	fired.push({ ...center, at: Date.now() });
	firedByProfile.set(profileId, fired);
}

async function parkMouse(profile: CaptureProfile, origin: { x: number; y: number }) {
	if (profile.parking === "origem") {
		await mouse.setPosition(new Point(origin.x, origin.y));
		return;
	}
	if (profile.parking === "fixo" && profile.parkingPoint) {
		await mouse.setPosition(new Point(profile.parkingPoint.x, profile.parkingPoint.y));
		return;
	}
	// "centro" (e "fixo" sem ponto definido): centro da região do jogo, onde o personagem fica.
	const region = profile.scanRegion;
	if (region) {
		const centerX = Math.round(region.x + region.width / 2);
		const centerY = Math.round(region.y + region.height / 2);
		await mouse.setPosition(new Point(centerX, centerY));
		return;
	}
	const [width, height] = await Promise.all([screen.width(), screen.height()]);
	await mouse.setPosition(new Point(Math.round(width / 2), Math.round(height / 2)));
}

/** Uma varredura: acha os corpos visíveis agora e joga pokébola em cada um. */
export async function runCaptureOnce(profile: CaptureProfile, source: TriggerSource): Promise<CaptureRunSummary> {
	const startedAt = Date.now();
	const isAborted = () => aborted.has(profile.id);

	const enabledTemplates = profile.templates.filter((template) => template.enabled && template.imagePath);
	if (enabledTemplates.length === 0) {
		return { scanMs: 0, totalMs: 0, found: 0, fired: 0, skippedByCooldown: 0, passes: 0, reason: "no-templates" };
	}
	const focus = await checkGameFocus(profile, source);
	if (!focus.focused) {
		return {
			scanMs: 0,
			totalMs: Date.now() - startedAt,
			found: 0,
			fired: 0,
			skippedByCooldown: 0,
			passes: 0,
			reason: "no-focus",
			activeWindowTitle: focus.activeTitle,
		};
	}

	const origin = await mouse.getPosition();
	const ballKeys = resolveKeys(profile.ballKey);
	// Alvos já atingidos nesta rodada. Separado do cooldown do perfil porque as passadas
	// precisam se enxergar mesmo com o cooldown desligado.
	const firedThisRun: FiredTarget[] = [];

	let scanMs = 0;
	let found = 0;
	let fired = 0;
	let skipped = 0;
	let passes = 0;

	// Corpo empilhado fica escondido atrás do de cima: não dá para detectar antes do primeiro
	// ser capturado e sumir. Por isso a rodada varre de novo depois de jogar, até não achar
	// mais nada novo ou esgotar as passadas.
	const maxPasses = Math.max(profile.rescanPasses, 1);
	for (let pass = 0; pass < maxPasses; pass += 1) {
		if (isAborted()) break;
		if (pass > 0) {
			await sleep(profile.rescanDelayMs, isAborted);
			if (isAborted()) break;
		}

		emitState(profile.id, "scanning");
		const scanStartedAt = Date.now();
		const targets = await findAllImages(enabledTemplates, {
			region: profile.scanRegion,
			excludeRegions: profile.excludeRegions,
			maxTargets: profile.maxTargets,
			maxOverlap: profile.maxOverlap,
		});
		scanMs += Date.now() - scanStartedAt;
		passes = pass + 1;

		const { fresh, skipped: skippedNow } = filterByCooldown(profile, targets, firedThisRun);
		skipped += skippedNow;
		found += fresh.length;
		const selected = fresh.slice(0, profile.maxTargets);
		// Passada sem alvo novo: ou não sobrou corpo, ou o de baixo ainda não apareceu —
		// insistir só gastaria tempo com o cursor preso.
		if (selected.length === 0) break;

		emitState(profile.id, "acting");
		for (const target of selected) {
			if (isAborted()) break;
			const center = centerOf(target);
			await mouse.setPosition(new Point(center.x, center.y));
			await sleep(profile.delayBeforeKeyMs, isAborted);
			if (isAborted()) break;

			if (ballKeys.length > 0) {
				await keyboard.pressKey(...ballKeys);
				await keyboard.releaseKey(...ballKeys);
			}
			if (profile.clickAfterKey) await mouse.click(Button.LEFT);

			const entry = { ...center, at: Date.now() };
			firedThisRun.push(entry);
			rememberFired(profile.id, center);
			fired += 1;
			await sleep(profile.delayBetweenTargetsMs, isAborted);
		}
	}

	// Roda inclusive quando abortado: a tecla de pânico não pode largar o cursor
	// em cima de uma criatura.
	await parkMouse(profile, { x: origin.x, y: origin.y });

	return {
		scanMs,
		totalMs: Date.now() - startedAt,
		found,
		fired,
		skippedByCooldown: skipped,
		passes,
		reason: isAborted() ? "aborted" : undefined,
	};
}

async function runGuarded(profile: CaptureProfile, body: () => Promise<CaptureRunSummary>) {
	// Reentrância: apertar o atalho de novo no meio de uma rodada não empilha execução.
	if (running.has(profile.id)) return;
	running.add(profile.id);
	aborted.delete(profile.id);
	try {
		const summary = await body();
		emitState(profile.id, "idle", summary);
	} catch (error) {
		// Sem este catch a falha vira unhandled rejection: o atalho parece não fazer nada
		// e não sobra nenhum sinal na interface.
		const errorMessage = error instanceof Error ? error.message : String(error);
		console.error(`[capture] falha na rodada do perfil "${profile.name}":`, error);
		emitState(profile.id, "idle", {
			scanMs: 0,
			totalMs: 0,
			found: 0,
			fired: 0,
			skippedByCooldown: 0,
			passes: 0,
			reason: "error",
			errorMessage,
		});
	} finally {
		running.delete(profile.id);
		aborted.delete(profile.id);
	}
}

async function runLoop(profile: CaptureProfile, source: TriggerSource) {
	looping.add(profile.id);
	try {
		await runGuarded(profile, async () => {
			let last: CaptureRunSummary = { scanMs: 0, totalMs: 0, found: 0, fired: 0, skippedByCooldown: 0, passes: 0 };
			while (looping.has(profile.id) && !aborted.has(profile.id)) {
				last = await runCaptureOnce(profile, source);
				if (last.reason === "no-templates") break;
				await sleep(profile.loopIntervalMs, () => aborted.has(profile.id));
			}
			return last;
		});
	} finally {
		looping.delete(profile.id);
	}
}

/** Ponto de entrada do atalho global e do botão da UI. */
export function triggerCapture(profile: CaptureProfile, source: TriggerSource): void {
	if (profile.mode === "loop") {
		if (looping.has(profile.id)) {
			stopCapture(profile.id);
			return;
		}
		void runLoop(profile, source);
		return;
	}
	void runGuarded(profile, () => runCaptureOnce(profile, source));
}

export function isCaptureRunning(profileId: string): boolean {
	return running.has(profileId);
}

export function stopCapture(profileId: string): void {
	looping.delete(profileId);
	if (running.has(profileId)) aborted.add(profileId);
}

export function stopAllCaptures(): void {
	looping.clear();
	for (const id of running) aborted.add(id);
}

/** Zera a memória de cooldown — usado ao editar/desativar o perfil. */
export function resetCaptureCooldown(profileId: string): void {
	firedByProfile.delete(profileId);
}
