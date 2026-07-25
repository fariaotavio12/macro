import * as cvModule from "@techstark/opencv-js";
import { Point, Region as NutRegion, screen, imageToJimp } from "@nut-tree-fork/nut-js";
import * as Jimp from "jimp";
import fs from "node:fs";
import type { Condition, Region } from "../../shared/macro-types";
import { resolveImagePath } from "./storage";

// opencv.js é um build Emscripten: dependendo de como o runtime WASM termina de carregar,
// o módulo importado já vem pronto, vem como Promise, ou precisa esperar onRuntimeInitialized.
type Cv = typeof cvModule & Record<string, unknown>;
let cvReady: Promise<Cv> | null = null;

function getCv(): Promise<Cv> {
	if (!cvReady) {
		cvReady = (async () => {
			const mod = cvModule as unknown;
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
	const templateJimp = await Jimp.read(absolutePath);
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
