import type { Region } from "./macro-types";

/** Uma imagem de referência (recorte do corpo de um pokémon) procurada na tela. */
export type CaptureTemplate = {
	id: string;
	name: string;
	/** Nome do arquivo em `userData/macros/images` — mesmo storage usado pelas macros. */
	imagePath: string;
	/** 0..1 — quanto mais alto, mais exigente. */
	tolerance: number;
	/** Desligado não entra na varredura (economiza tempo de scan, não só filtra o resultado). */
	enabled: boolean;
};

/** Para onde o cursor volta depois de uma rodada. */
export type CaptureParking = "origem" | "centro" | "fixo";

export type CaptureMode = "once" | "loop";

export type CaptureProfile = {
	id: string;
	name: string;
	/** Atalho global de disparo. */
	hotkey?: string;
	active: boolean;

	templates: CaptureTemplate[];
	/** Área varrida. Sem região, varre a tela inteira (mais lento e sujeito a falso positivo na HUD). */
	scanRegion?: Region;
	/** Áreas ignoradas mesmo dentro da região — barra de hotkeys, minimapa, inventário. */
	excludeRegions: Region[];

	/** Tecla da pokébola disparada com o mouse em cima do alvo. */
	ballKey: string;
	clickAfterKey: boolean;
	maxTargets: number;
	/** Tempo para o jogo registrar o hover antes da tecla. */
	delayBeforeKeyMs: number;
	delayBetweenTargetsMs: number;

	/** Memória de alvos já disparados, em ms. 0 desliga. */
	targetCooldownMs: number;
	/** Raio da memória de cooldown. Sem valor, usa metade do tamanho do template. */
	cooldownRadiusPx?: number;

	parking: CaptureParking;
	parkingPoint?: { x: number; y: number };

	requireGameFocus: boolean;
	/** Fragmento do título da janela do jogo, ex "PokeXGames". */
	gameWindowTitle?: string;

	mode: CaptureMode;
	loopIntervalMs: number;
};

export type CaptureTarget = {
	templateId: string;
	x: number;
	y: number;
	width: number;
	height: number;
	score: number;
};

export type CaptureRunSummary = {
	scanMs: number;
	totalMs: number;
	found: number;
	fired: number;
	skippedByCooldown: number;
	/** Preenchido quando a rodada não chegou a disparar (foco, sem template, abortada, erro). */
	reason?: "no-focus" | "no-templates" | "aborted" | "error";
	/** Mensagem do erro quando `reason === "error"`. */
	errorMessage?: string;
	/** Título da janela que estava em foco quando `reason === "no-focus"`. */
	activeWindowTitle?: string;
};

export type CaptureRunState = {
	profileId: string;
	status: "idle" | "scanning" | "acting";
	lastRun?: CaptureRunSummary;
};

export type CaptureScanPreview = {
	dataUrl: string;
	width: number;
	height: number;
	scanRegion?: Region;
	targets: CaptureTarget[];
	scanMs: number;
};

export const DEFAULT_TEMPLATE_TOLERANCE = 0.82;
/** Abaixo disso o matchTemplate devolve ruído demais e a varredura fica cara. */
export const MIN_TEMPLATE_TOLERANCE = 0.5;

export const defaultCaptureProfile = (id: string): CaptureProfile => ({
	id,
	name: "Novo perfil",
	active: false,
	templates: [],
	excludeRegions: [],
	ballKey: "F1",
	clickAfterKey: false,
	maxTargets: 5,
	delayBeforeKeyMs: 40,
	delayBetweenTargetsMs: 120,
	targetCooldownMs: 5000,
	parking: "origem",
	requireGameFocus: true,
	mode: "once",
	loopIntervalMs: 500,
});
