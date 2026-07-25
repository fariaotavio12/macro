import { Region as NutRegion, screen, imageToJimp } from "@nut-tree-fork/nut-js";
import * as Jimp from "jimp";
import type { Region } from "../../shared/macro-types";
import { minimizeMainWindow, showMainWindow } from "../window-ref";
import { saveImageBuffer } from "./storage";

function sleep(ms: number) {
	return new Promise((resolve) => setTimeout(resolve, ms));
}

// Minimiza a janela e dá tempo do Windows terminar a animação antes de capturar,
// senão o próprio app aparece na screenshot (mesmo padrão de espera usado no fluxo de gravação).
async function hideAppWindow() {
	minimizeMainWindow();
	await sleep(300);
}

export type CaptureResult = { dataUrl: string; width: number; height: number };

export async function captureScreen(): Promise<CaptureResult> {
	await hideAppWindow();
	const jimpImage = imageToJimp(await screen.grab());
	const dataUrl = await jimpImage.getBase64Async(Jimp.MIME_PNG);
	// A tela de seleção (ponto/recorte) roda dentro da própria janela principal — sem
	// restaurar aqui ela fica minimizada e a UI de seleção nunca aparece pro usuário.
	showMainWindow();
	return { dataUrl, width: jimpImage.bitmap.width, height: jimpImage.bitmap.height };
}

export type CropSaveResult = { imagePath: string; width: number; height: number };

export async function saveScreenshotCrop(region: Region): Promise<CropSaveResult> {
	const nutRegion = new NutRegion(region.x, region.y, region.width, region.height);
	const jimpImage = imageToJimp(await screen.grabRegion(nutRegion));
	const buffer = await jimpImage.getBufferAsync(Jimp.MIME_PNG);
	const imagePath = saveImageBuffer(buffer);
	return { imagePath, width: jimpImage.bitmap.width, height: jimpImage.bitmap.height };
}
