import { screen, imageToJimp } from "@nut-tree-fork/nut-js";
import type { Region } from "../../shared/macro-types";
import { isMainWindowVisible, minimizeMainWindow, showMainWindow } from "../window-ref";
import { MIME_PNG } from "./jimp-runtime";
import { saveImageBuffer } from "./storage";

type JimpImage = ReturnType<typeof imageToJimp>;

function sleep(ms: number) {
	return new Promise((resolve) => setTimeout(resolve, ms));
}

// Minimiza a janela e dá tempo do Windows terminar a animação antes de capturar,
// senão o próprio app aparece na screenshot (mesmo padrão de espera usado no fluxo de gravação).
async function hideAppWindow() {
	minimizeMainWindow();
	await sleep(300);
}

// Último print servido ao seletor. O recorte precisa sair exatamente desta imagem —
// ver o comentário em saveScreenshotCrop.
let lastCapture: JimpImage | null = null;

export type CaptureResult = { dataUrl: string; width: number; height: number };

export async function captureScreen(): Promise<CaptureResult> {
	await hideAppWindow();
	const jimpImage = imageToJimp(await screen.grab());
	lastCapture = jimpImage;
	const dataUrl = await jimpImage.getBase64Async(MIME_PNG);
	// A tela de seleção (ponto/recorte) roda dentro da própria janela principal — sem
	// restaurar aqui ela fica minimizada e a UI de seleção nunca aparece pro usuário.
	showMainWindow();
	return { dataUrl, width: jimpImage.bitmap.width, height: jimpImage.bitmap.height };
}

/** Print da tela como está agora, sem mexer na janela do app. */
export async function captureScreenRaw(): Promise<CaptureResult> {
	const jimpImage = imageToJimp(await screen.grab());
	const dataUrl = await jimpImage.getBase64Async(MIME_PNG);
	return { dataUrl, width: jimpImage.bitmap.width, height: jimpImage.bitmap.height };
}

/**
 * Roda `fn` com a janela do app escondida e restaura no fim.
 * O preview de detecção precisa disso: grab e varredura têm que acontecer os dois com a
 * janela fora do caminho, senão a interface do app entra na imagem analisada.
 */
export async function withAppWindowHidden<T>(fn: () => Promise<T>): Promise<T> {
	// Só restaura o que estava visível: acionado pelo dock, a janela principal está fechada
	// e trazê-la de volta jogaria o usuário para fora do jogo.
	const wasVisible = isMainWindowVisible();
	if (wasVisible) minimizeMainWindow();
	// Espera a animação do Windows mesmo quando só o dock precisou sumir.
	await sleep(300);
	try {
		return await fn();
	} finally {
		if (wasVisible) showMainWindow();
	}
}

export type CropSaveResult = { imagePath: string; width: number; height: number };

export async function saveScreenshotCrop(region: Region): Promise<CropSaveResult> {
	// Recorta do MESMO print que o usuário viu no seletor. A versão anterior fazia um grab
	// novo aqui — mas o captureScreen já restaurou a janela do app, então o recorte saía da
	// tela atual, com a interface por cima do jogo. Resultado: a imagem de referência era um
	// pedaço da própria UI e o template matching batia em qualquer lugar.
	const source = lastCapture ?? imageToJimp(await screen.grab());
	const maxX = Math.max(source.bitmap.width - 1, 0);
	const maxY = Math.max(source.bitmap.height - 1, 0);
	const x = Math.min(Math.max(Math.round(region.x), 0), maxX);
	const y = Math.min(Math.max(Math.round(region.y), 0), maxY);
	const width = Math.max(Math.min(Math.round(region.width), source.bitmap.width - x), 1);
	const height = Math.max(Math.min(Math.round(region.height), source.bitmap.height - y), 1);

	const cropped = source.clone().crop(x, y, width, height);
	const buffer = await cropped.getBufferAsync(MIME_PNG);
	const imagePath = saveImageBuffer(buffer);
	return { imagePath, width: cropped.bitmap.width, height: cropped.bitmap.height };
}
