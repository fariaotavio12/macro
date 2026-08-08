import * as cvModule from "@techstark/opencv-js";
import { Point, Region as NutRegion, screen, imageToJimp } from "@nut-tree-fork/nut-js";
import * as Jimp from "jimp";
import fs from "node:fs";
import type { Condition, Region } from "../../shared/macro-types";
import type { CaptureTarget } from "../../shared/capture-types";
import { jimp } from "./jimp-runtime";
import { resolveImagePath } from "./storage";

// opencv.js é um build Emscripten: dependendo de como o runtime WASM termina de carregar,
// o módulo importado já vem pronto, vem como Promise, ou precisa esperar onRuntimeInitialized.
type Cv = typeof cvModule & Record<string, unknown>;
let cvReady: Promise<Cv> | null = null;

// Mesma armadilha do jimp: `import * as cvModule` devolve um namespace ESM congelado, com o
// módulo real dentro de `default`. Sem desembrulhar, `cvModule.Mat` é undefined e escrever
// `onRuntimeInitialized` no namespace lança "Cannot assign to property of [object Module]".
function unwrapCvModule(): unknown {
	const namespace = cvModule as unknown as { default?: unknown };
	return namespace.default ?? cvModule;
}

function getCv(): Promise<Cv> {
	if (!cvReady) {
		cvReady = (async () => {
			const mod = unwrapCvModule();
			if (mod instanceof Promise) return (await mod) as Cv;
			const maybeReady = mod as { Mat?: unknown; onRuntimeInitialized?: () => void };
			if (maybeReady.Mat) return mod as Cv;
			await new Promise<void>((resolve) => {
				maybeReady.onRuntimeInitialized = () => resolve();
			});
			return mod as Cv;
		})();
	}
	return cvReady;
}

function jimpToGrayMat(cv: Cv, image: Jimp): { mat: unknown; width: number; height: number } {
	const cvAny = cv as any;
	const rgba = new cvAny.Mat(image.bitmap.height, image.bitmap.width, cvAny.CV_8UC4);
	rgba.data.set(image.bitmap.data);
	const gray = new cvAny.Mat();
	cvAny.cvtColor(rgba, gray, cvAny.COLOR_RGBA2GRAY);
	rgba.delete();
	return { mat: gray, width: image.bitmap.width, height: image.bitmap.height };
}

async function grabAsJimp(region?: Region): Promise<Jimp> {
	const image = region
		? await screen.grabRegion(new NutRegion(region.x, region.y, region.width, region.height))
		: await screen.grab();
	return imageToJimp(image);
}

/** Localiza `imagePath` na tela (ou dentro de `region`). Nunca lança — retorna `null` se não encontrar. */
export async function findImage(imagePath: string, tolerance: number, region?: Region): Promise<Region | null> {
	const absolutePath = resolveImagePath(imagePath);
	if (!fs.existsSync(absolutePath)) return null;

	const cv = await getCv();
	const cvAny = cv as any;
	const templateJimp = await jimp.read(absolutePath);
	const screenJimp = await grabAsJimp(region);

	if (templateJimp.bitmap.width > screenJimp.bitmap.width || templateJimp.bitmap.height > screenJimp.bitmap.height) {
		return null;
	}

	const { mat: screenGray } = jimpToGrayMat(cv, screenJimp);
	const { mat: templateGray, width: templateWidth, height: templateHeight } = jimpToGrayMat(cv, templateJimp);
	const result = new cvAny.Mat();
	try {
		cvAny.matchTemplate(screenGray, templateGray, result, cvAny.TM_CCOEFF_NORMED);
		const { maxVal, maxLoc } = cvAny.minMaxLoc(result);
		if (maxVal < tolerance) return null;

		const offsetX = region?.x ?? 0;
		const offsetY = region?.y ?? 0;
		return { x: offsetX + maxLoc.x, y: offsetY + maxLoc.y, width: templateWidth, height: templateHeight };
	} finally {
		(screenGray as any).delete();
		(templateGray as any).delete();
		result.delete();
	}
}

/** Como {@link findImage}, mas tenta repetidamente até `timeoutMs`. */
export async function waitForImage(
	imagePath: string,
	tolerance: number,
	timeoutMs: number,
	region?: Region,
	isAborted?: () => boolean,
): Promise<Region | null> {
	const start = Date.now();
	while (true) {
		const found = await findImage(imagePath, tolerance, region);
		if (found) return found;
		if (isAborted?.() || Date.now() - start >= timeoutMs) return null;
		await new Promise((resolve) => setTimeout(resolve, 200));
	}
}

type TemplateSpec = { id: string; imagePath: string; tolerance: number };
type TemplateMat = { mat: unknown; width: number; height: number; mtimeMs: number };
type Candidate = { x: number; y: number; score: number };

// Decodificar o PNG e converter para cinza custa mais que o próprio matchTemplate.
// A aba de capturas dispara a mesma varredura a cada toque na tecla, então os templates
// ficam em cache — invalidado pelo mtime, para recapturar a imagem valer na hora.
const templateCache = new Map<string, TemplateMat>();

// Com tolerância muito baixa o matchTemplate devolve ruído em quase todo pixel.
// O teto evita montar um array de milhões de candidatos e travar o processo main.
const MAX_CANDIDATES = 50_000;

async function getTemplateMat(cv: Cv, imagePath: string): Promise<TemplateMat | null> {
	const absolutePath = resolveImagePath(imagePath);
	if (!fs.existsSync(absolutePath)) return null;

	const { mtimeMs } = fs.statSync(absolutePath);
	const cached = templateCache.get(absolutePath);
	if (cached && cached.mtimeMs === mtimeMs) return cached;
	if (cached) (cached.mat as { delete: () => void }).delete();

	const { mat, width, height } = jimpToGrayMat(cv, await jimp.read(absolutePath));
	const entry = { mat, width, height, mtimeMs };
	templateCache.set(absolutePath, entry);
	return entry;
}

/** Todos os pontos do mapa de correlação acima da tolerância (o `minMaxLoc` só devolve o melhor). */
function collectCandidates(result: { data32F: Float32Array; cols: number }, tolerance: number): Candidate[] {
	const data = result.data32F;
	const cols = result.cols;
	const candidates: Candidate[] = [];
	for (let i = 0; i < data.length; i += 1) {
		const score = data[i];
		if (score < tolerance) continue;
		candidates.push({ x: i % cols, y: Math.floor(i / cols), score });
		if (candidates.length >= MAX_CANDIDATES) break;
	}
	return candidates;
}

type Box = Candidate & { width: number; height: number };

/** Interseção sobre união entre duas caixas. */
function overlapRatio(a: Box, b: Box): number {
	const interWidth = Math.min(a.x + a.width, b.x + b.width) - Math.max(a.x, b.x);
	const interHeight = Math.min(a.y + a.height, b.y + b.height) - Math.max(a.y, b.y);
	if (interWidth <= 0 || interHeight <= 0) return 0;
	const intersection = interWidth * interHeight;
	return intersection / (a.width * a.height + b.width * b.height - intersection);
}

/**
 * Supressão de vizinhos por sobreposição de área: um único corpo gera dezenas de pontos
 * acima da tolerância, todos praticamente na mesma caixa (IoU alto). Alvos em tiles
 * vizinhos encostam mas se sobrepõem pouco, e precisam sobreviver — medir por distância
 * entre centros descartava o corpo de baixo sempre que o recorte era mais alto que o tile.
 */
function suppressNeighbors<T extends Box>(candidates: T[], max: number, maxOverlap: number): T[] {
	const sorted = [...candidates].sort((a, b) => b.score - a.score);
	const kept: T[] = [];
	for (const candidate of sorted) {
		if (kept.length >= max) break;
		if (kept.some((accepted) => overlapRatio(accepted, candidate) > maxOverlap)) continue;
		kept.push(candidate);
	}
	return kept;
}

function intersects(target: CaptureTarget, region: Region): boolean {
	return (
		target.x < region.x + region.width &&
		target.x + target.width > region.x &&
		target.y < region.y + region.height &&
		target.y + target.height > region.y
	);
}

export type FindAllOptions = {
	region?: Region;
	excludeRegions?: Region[];
	maxTargets?: number;
	/** IoU a partir do qual duas deteções contam como o mesmo alvo. */
	maxOverlap?: number;
};

/**
 * Localiza **todas** as ocorrências de vários templates em uma única captura de tela.
 * Nunca lança — templates ausentes ou maiores que a área varrida são ignorados.
 */
export async function findAllImages(templates: TemplateSpec[], options: FindAllOptions = {}): Promise<CaptureTarget[]> {
	const { region, excludeRegions = [], maxTargets = 20, maxOverlap = 0.4 } = options;
	if (templates.length === 0) return [];

	const cv = await getCv();
	const cvAny = cv as any;
	const screenJimp = await grabAsJimp(region);
	const { mat: screenGray } = jimpToGrayMat(cv, screenJimp);
	const offsetX = region?.x ?? 0;
	const offsetY = region?.y ?? 0;

	const targets: CaptureTarget[] = [];
	try {
		for (const template of templates) {
			const templateMat = await getTemplateMat(cv, template.imagePath);
			if (!templateMat) continue;
			if (templateMat.width > screenJimp.bitmap.width || templateMat.height > screenJimp.bitmap.height) continue;

			const result = new cvAny.Mat();
			try {
				cvAny.matchTemplate(screenGray, templateMat.mat, result, cvAny.TM_CCOEFF_NORMED);
				const candidates = collectCandidates(result, template.tolerance).map((candidate) => ({
					...candidate,
					width: templateMat.width,
					height: templateMat.height,
				}));
				for (const kept of suppressNeighbors(candidates, maxTargets, maxOverlap)) {
					targets.push({
						templateId: template.id,
						x: offsetX + kept.x,
						y: offsetY + kept.y,
						width: kept.width,
						height: kept.height,
						score: kept.score,
					});
				}
			} finally {
				result.delete();
			}
		}
	} finally {
		(screenGray as any).delete();
	}

	// Dois templates parecidos podem casar com o mesmo corpo — sem esta passada final,
	// o mesmo alvo levaria duas pokébolas.
	const deduped = suppressNeighbors(targets, maxTargets, maxOverlap);
	return deduped.filter((target) => !excludeRegions.some((excluded) => intersects(target, excluded)));
}

export async function colorAt(x: number, y: number) {
	return screen.colorAt(new Point(x, y));
}

function hexToRgb(hex: string): { r: number; g: number; b: number } {
	const normalized = hex.replace("#", "");
	const value = Number.parseInt(normalized.length === 3 ? normalized.replace(/(.)/g, "$1$1") : normalized, 16);
	return { r: (value >> 16) & 255, g: (value >> 8) & 255, b: value & 255 };
}

const MAX_COLOR_DISTANCE = Math.sqrt(3 * 255 ** 2);

/** Avalia uma {@link Condition} do passo `if`. */
export async function matchesCondition(condition: Condition): Promise<boolean> {
	let matched: boolean;
	if (condition.kind === "pixelColor") {
		const rgba = await colorAt(condition.x, condition.y);
		const target = hexToRgb(condition.color);
		const distance = Math.sqrt((rgba.R - target.r) ** 2 + (rgba.G - target.g) ** 2 + (rgba.B - target.b) ** 2);
		matched = distance <= (condition.tolerance / 100) * MAX_COLOR_DISTANCE;
	} else {
		const found = await findImage(condition.imagePath, condition.tolerance, condition.region);
		matched = found !== null;
	}
	return condition.negate ? !matched : matched;
}
