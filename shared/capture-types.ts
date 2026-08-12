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

/** Configuração global de Capturas: uma só, sem identidade nem nome. */
export type CaptureConfig = {
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

	/**
	 * Quantas varreduras por acionamento. Corpo empilhado fica encoberto pelo de cima e não
	 * aparece na primeira passada — só depois que o primeiro é capturado e some.
	 */
	rescanPasses: number;
	/** Espera entre passadas: tempo do corpo capturado sumir da tela. */
	rescanDelayMs: number;

	/** Memória de alvos já disparados, em ms. 0 desliga. */
	targetCooldownMs: number;
	/** Raio da memória de cooldown. Sem valor, usa 40% do menor lado do template. */
	cooldownRadiusPx?: number;
	/** Sobreposição (IoU) a partir da qual duas deteções são consideradas o mesmo alvo. */
	maxOverlap: number;

	parking: CaptureParking;
	parkingPoint?: { x: number; y: number };

	requireGameFocus: boolean;
	/** Fragmento do título da janela do jogo, ex "PokeXGames". */
	gameWindowTitle?: string;

	mode: CaptureMode;
	loopIntervalMs: number;
};

/**
 * Formato antigo, com um perfil por arquivo.
 *
 * @deprecated Só existe enquanto a migração incremental para `CaptureConfig` não termina.
 */
export type CaptureProfile = CaptureConfig & {
	id: string;
	name: string;
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
	/** Quantas varreduras a rodada precisou (só chega em `rescanPasses` se seguir achando alvo). */
	passes: number;
	/** Preenchido quando a rodada não chegou a disparar (foco, sem template, abortada, erro). */
	reason?: "no-focus" | "no-templates" | "aborted" | "error";
	/** Mensagem do erro quando `reason === "error"`. */
	errorMessage?: string;
	/** Título da janela que estava em foco quando `reason === "no-focus"`. */
	activeWindowTitle?: string;
};

/** Só existe uma execução de Capturas por vez — o estado ao vivo é único. */
export type CaptureRunState = {
	status: "idle" | "scanning" | "acting";
	lastRun?: CaptureRunSummary;
};

/**
 * Estado ao vivo endereçado por perfil.
 *
 * @deprecated Só existe enquanto a migração incremental para `CaptureConfig` não termina.
 */
export type CaptureProfileRunState = CaptureRunState & { profileId: string };

export type CaptureScanPreview = {
	/** Ausente quando o chamador pediu só a contagem — ver `capture.scanPreview`. */
	dataUrl?: string;
	width: number;
	height: number;
	scanRegion?: Region;
	targets: CaptureTarget[];
	scanMs: number;
};

export const DEFAULT_TEMPLATE_TOLERANCE = 0.82;
/** Abaixo disso o matchTemplate devolve ruído demais e a varredura fica cara. */
export const MIN_TEMPLATE_TOLERANCE = 0.5;

export const defaultCaptureConfig = (): CaptureConfig => ({
	active: false,
	templates: [],
	excludeRegions: [],
	ballKey: "F1",
	clickAfterKey: false,
	maxTargets: 5,
	delayBeforeKeyMs: 40,
	delayBetweenTargetsMs: 120,
	rescanPasses: 3,
	rescanDelayMs: 700,
	targetCooldownMs: 5000,
	maxOverlap: 0.4,
	parking: "origem",
	requireGameFocus: true,
	mode: "once",
	loopIntervalMs: 500,
});

/** @deprecated Só existe enquanto a migração incremental para `CaptureConfig` não termina. */
export const defaultCaptureProfile = (id: string): CaptureProfile => ({
	...defaultCaptureConfig(),
	id,
	name: "Novo perfil",
});
