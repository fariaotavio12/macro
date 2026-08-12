import { Button, keyboard, mouse, Point, screen } from "@nut-tree-fork/nut-js";
import { IpcChannel } from "../../shared/ipc-channels";
import type { CanonicalKey } from "../../shared/key-map";
import type { CaptureConfig, CaptureRunState, CaptureRunSummary, CaptureTarget } from "../../shared/capture-types";
import { sendToRenderer } from "../window-ref";
import { CANONICAL_TO_NUT_KEY } from "./key-map-nut";
import { findAllImages } from "./vision";
import { checkWindowFocus } from "./window-focus";

/** De onde veio o disparo. Clique manual ignora a trava de foco: foi intencional. */
export type TriggerSource = "hotkey" | "manual";

type FiredTarget = { x: number; y: number; at: number };

// Uma configuração global, uma execução: o estado é escalar em vez de indexado por perfil.
let running = false;
let looping = false;
let aborted = false;
let firedTargets: FiredTarget[] = [];

function emitState(status: CaptureRunState["status"], lastRun?: CaptureRunSummary) {
	sendToRenderer(IpcChannel.captureState, { status, lastRun } satisfies CaptureRunState);
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

async function checkGameFocus(config: CaptureConfig, source: TriggerSource) {
	if (source === "manual" || !config.requireGameFocus) return { focused: true, activeTitle: undefined };
	return checkWindowFocus(config.gameWindowTitle);
}

function resolveKeys(combo: string) {
	return combo
		.split("+")
		.map((name) => CANONICAL_TO_NUT_KEY[name.trim() as CanonicalKey])
		.filter(Boolean);
}

// 40% do MENOR lado: com metade do maior lado, um recorte mais alto que o tile do jogo
// engolia o corpo do tile de baixo como se fosse o mesmo alvo.
function cooldownRadius(config: CaptureConfig, target: CaptureTarget) {
	return config.cooldownRadiusPx ?? Math.max(Math.min(target.width, target.height) * 0.4, 8);
}

function centerOf(target: CaptureTarget) {
	return { x: Math.round(target.x + target.width / 2), y: Math.round(target.y + target.height / 2) };
}

/**
 * Descarta alvos que receberam pokébola há pouco tempo. A memória é por **coordenada de
 * tela**: se o personagem andar entre um acionamento e outro os corpos mudam de lugar e o
 * cooldown perde a referência — por isso o TTL curto por padrão.
 */
function filterByCooldown(config: CaptureConfig, targets: CaptureTarget[], firedThisRun: FiredTarget[]) {
	const now = Date.now();
	const remembered =
		config.targetCooldownMs > 0 ? firedTargets.filter((entry) => now - entry.at < config.targetCooldownMs) : [];
	if (config.targetCooldownMs > 0) firedTargets = remembered;

	// firedThisRun entra sempre: sem ele, a segunda passada rejogaria pokébola nos mesmos
	// corpos quando o cooldown da configuração está desligado.
	const fired = [...remembered, ...firedThisRun];

	const isOnCooldown = (target: CaptureTarget) => {
		const center = centerOf(target);
		const radius = cooldownRadius(config, target);
		return fired.some((entry) => Math.abs(entry.x - center.x) < radius && Math.abs(entry.y - center.y) < radius);
	};

	const fresh = targets.filter((target) => !isOnCooldown(target));
	return { fresh, skipped: targets.length - fresh.length };
}

function rememberFired(center: { x: number; y: number }) {
	firedTargets.push({ ...center, at: Date.now() });
}

async function parkMouse(config: CaptureConfig, origin: { x: number; y: number }) {
	if (config.parking === "origem") {
		await mouse.setPosition(new Point(origin.x, origin.y));
		return;
	}
	if (config.parking === "fixo" && config.parkingPoint) {
		await mouse.setPosition(new Point(config.parkingPoint.x, config.parkingPoint.y));
		return;
	}
	// "centro" (e "fixo" sem ponto definido): centro da região do jogo, onde o personagem fica.
	const region = config.scanRegion;
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
export async function runCaptureOnce(config: CaptureConfig, source: TriggerSource): Promise<CaptureRunSummary> {
	const startedAt = Date.now();
	const isAborted = () => aborted;

	const enabledTemplates = config.templates.filter((template) => template.enabled && template.imagePath);
	if (enabledTemplates.length === 0) {
		return { scanMs: 0, totalMs: 0, found: 0, fired: 0, skippedByCooldown: 0, passes: 0, reason: "no-templates" };
	}
	const focus = await checkGameFocus(config, source);
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
	const ballKeys = resolveKeys(config.ballKey);
	// Alvos já atingidos nesta rodada. Separado do cooldown global porque as passadas
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
	const maxPasses = Math.max(config.rescanPasses, 1);
	for (let pass = 0; pass < maxPasses; pass += 1) {
		if (isAborted()) break;
		if (pass > 0) {
			await sleep(config.rescanDelayMs, isAborted);
			if (isAborted()) break;
		}

		emitState("scanning");
		const scanStartedAt = Date.now();
		const targets = await findAllImages(enabledTemplates, {
			region: config.scanRegion,
			excludeRegions: config.excludeRegions,
			maxTargets: config.maxTargets,
			maxOverlap: config.maxOverlap,
		});
		scanMs += Date.now() - scanStartedAt;
		passes = pass + 1;

		const { fresh, skipped: skippedNow } = filterByCooldown(config, targets, firedThisRun);
		skipped += skippedNow;
		found += fresh.length;
		const selected = fresh.slice(0, config.maxTargets);
		// Passada sem alvo novo: ou não sobrou corpo, ou o de baixo ainda não apareceu —
		// insistir só gastaria tempo com o cursor preso.
		if (selected.length === 0) break;

		emitState("acting");
		for (const target of selected) {
			if (isAborted()) break;
			const center = centerOf(target);
			await mouse.setPosition(new Point(center.x, center.y));
			await sleep(config.delayBeforeKeyMs, isAborted);
			if (isAborted()) break;

			if (ballKeys.length > 0) {
				await keyboard.pressKey(...ballKeys);
				await keyboard.releaseKey(...ballKeys);
			}
			if (config.clickAfterKey) await mouse.click(Button.LEFT);

			const entry = { ...center, at: Date.now() };
			firedThisRun.push(entry);
			rememberFired(center);
			fired += 1;
			await sleep(config.delayBetweenTargetsMs, isAborted);
		}
	}

	// Roda inclusive quando abortado: a tecla de pânico não pode largar o cursor
	// em cima de uma criatura.
	await parkMouse(config, { x: origin.x, y: origin.y });

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

async function runGuarded(body: () => Promise<CaptureRunSummary>) {
	// Reentrância: apertar o atalho de novo no meio de uma rodada não empilha execução.
	if (running) return;
	running = true;
	aborted = false;
	try {
		const summary = await body();
		emitState("idle", summary);
	} catch (error) {
		// Sem este catch a falha vira unhandled rejection: o atalho parece não fazer nada
		// e não sobra nenhum sinal na interface.
		const errorMessage = error instanceof Error ? error.message : String(error);
		console.error("[capture] falha na rodada:", error);
		emitState("idle", {
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
		running = false;
		aborted = false;
	}
}

async function runLoop(config: CaptureConfig, source: TriggerSource) {
	looping = true;
	try {
		await runGuarded(async () => {
			let last: CaptureRunSummary = { scanMs: 0, totalMs: 0, found: 0, fired: 0, skippedByCooldown: 0, passes: 0 };
			while (looping && !aborted) {
				last = await runCaptureOnce(config, source);
				if (last.reason === "no-templates") break;
				await sleep(config.loopIntervalMs, () => aborted);
			}
			return last;
		});
	} finally {
		looping = false;
	}
}

/** Ponto de entrada do atalho global e do botão da UI. */
export function triggerCapture(config: CaptureConfig, source: TriggerSource): void {
	if (config.mode === "loop") {
		if (looping) {
			stopCapture();
			return;
		}
		void runLoop(config, source);
		return;
	}
	void runGuarded(() => runCaptureOnce(config, source));
}

export function isCaptureRunning(): boolean {
	return running;
}

/** Também é o caminho da tecla de pânico: existe no máximo uma execução para interromper. */
export function stopCapture(): void {
	looping = false;
	if (running) aborted = true;
}

/** Zera a memória de cooldown — usado ao salvar ou desativar a configuração. */
export function resetCaptureCooldown(): void {
	firedTargets = [];
}
