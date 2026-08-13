import { Badge, Button, Card, CardContent, ErrorState, LoadingSpinner } from "@/components";
import { Typography } from "@/components/typography";
import type { CaptureRunSummary } from "@shared/capture-types";
import { Play, RefreshCw, ScanSearch, Square } from "lucide-react";
import { useState } from "react";
import { CaptureConfigForm } from "./components/capture-config-form";
import { ScanPreviewDialog } from "./components/scan-preview-dialog";
import { useCaptureAutosave } from "./hooks/use-capture-autosave";
import { useCaptureState } from "./hooks/use-capture-state";

const lastRunLabel = (summary: CaptureRunSummary) => {
	if (summary.reason === "error") return summary.errorMessage ?? "A captura falhou.";
	if (summary.reason === "no-focus") return "O jogo estava fora de foco.";
	if (summary.reason === "no-templates") return "Nenhum Pokémon ativo com imagem.";
	if (summary.reason === "aborted") return "Rodada interrompida.";
	if (summary.fired === 0) return `Nenhum alvo encontrado em ${summary.scanMs} ms.`;
	const passes = summary.passes > 1 ? ` em ${summary.passes} passadas` : "";
	return `${summary.fired} pokébola(s)${passes} · ${summary.scanMs} ms de varredura.`;
};

export const PageCaptures = () => {
	const { draft, patch, status, error, retry, flush, isLoadError, reload } = useCaptureAutosave();
	const runState = useCaptureState();
	const [previewOpen, setPreviewOpen] = useState(false);
	const [openingPreview, setOpeningPreview] = useState(false);
	const running = runState.status === "scanning" || runState.status === "acting";
	// Sem pokémon ativo com imagem não há o que detectar — mesmo critério do dock.
	const hasUsableTemplate = draft?.templates.some((template) => template.enabled && template.imagePath) ?? false;

	const openPreview = async () => {
		setOpeningPreview(true);
		try {
			await flush();
			setPreviewOpen(true);
		} catch {
			// O autosave mantém o erro e o draft visíveis para retry.
		} finally {
			setOpeningPreview(false);
		}
	};

	if (isLoadError) {
		return (
			<div className="p-4 md:p-6">
				<ErrorState onRetry={() => void reload()} />
			</div>
		);
	}

	if (!draft) {
		return (
			<div className="flex min-h-64 items-center justify-center">
				<LoadingSpinner />
			</div>
		);
	}

	return (
		<div className="flex w-full flex-col gap-6 p-4 md:p-6">
			<header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
				<div className="flex flex-col gap-1">
					<Typography variant="display-md">Capturas</Typography>
					<Typography variant="body-sm" className="max-w-2xl text-muted-foreground">
						Configure os Pokémons, as teclas e a área de busca nesta tela. As alterações são salvas
						automaticamente.
					</Typography>
				</div>

				<div className="flex flex-wrap items-center gap-2">
					{status === "saving" || status === "dirty" ? (
						<Badge variant="secondary">Salvando...</Badge>
					) : status === "error" ? (
						<Badge variant="destructive">Erro ao salvar</Badge>
					) : (
						<Badge variant="success">Salvo</Badge>
					)}
					<Button
						type="button"
						variant="outline"
						onClick={() => void openPreview()}
						disabled={openingPreview || !hasUsableTemplate}
						title={hasUsableTemplate ? undefined : "Ative um Pokémon com imagem para testar a detecção."}
					>
						<ScanSearch className="size-4" />
						{openingPreview ? "Salvando..." : "Testar detecção"}
					</Button>
					<Button
						type="button"
						variant={running ? "destructive" : "default"}
						onClick={() => (running ? window.api.capture.stop() : window.api.capture.run())}
					>
						{running ? <Square className="size-4" /> : <Play className="size-4" />}
						{running ? "Parar" : "Executar agora"}
					</Button>
				</div>
			</header>

			{status === "error" && (
				<Card size="sm" className="border-destructive/40">
					<CardContent className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
						<div>
							<Typography variant="body-sm" className="font-medium text-destructive">
								Não foi possível salvar a configuração.
							</Typography>
							<Typography variant="caption" className="text-muted-foreground">
								{error ?? "Tente novamente sem perder as alterações desta tela."}
							</Typography>
						</div>
						<Button type="button" variant="outline" size="sm" onClick={retry}>
							<RefreshCw className="size-4" />
							Tentar novamente
						</Button>
					</CardContent>
				</Card>
			)}

			<Card size="sm">
				<CardContent className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
					<div>
						<Typography variant="title-sm">Última rodada</Typography>
						<Typography variant="body-sm" className="text-muted-foreground">
							{runState.status === "scanning"
								? "Varrendo a tela..."
								: runState.status === "acting"
									? "Jogando pokébola..."
									: runState.lastRun
										? lastRunLabel(runState.lastRun)
										: "Nenhuma captura executada nesta sessão."}
						</Typography>
					</div>
					{running && <Badge variant="secondary">Em execução</Badge>}
				</CardContent>
			</Card>

			<CaptureConfigForm config={draft} onChange={patch} />

			{previewOpen && (
				<ScanPreviewDialog config={draft} open={previewOpen} onOpenChange={setPreviewOpen} />
			)}
		</div>
	);
};
