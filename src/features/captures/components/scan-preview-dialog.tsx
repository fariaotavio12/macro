import {
	Badge,
	Button,
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	ErrorState,
	LoadingSpinner,
} from "@/components";
import { Typography } from "@/components/typography";
import type { CaptureProfile } from "@shared/capture-types";
import { useCaptureScanPreview } from "../api";

type ScanPreviewDialogProps = {
	profile: CaptureProfile;
	open: boolean;
	onOpenChange: (open: boolean) => void;
};

const percent = (value: number, total: number) => `${(value / total) * 100}%`;

export const ScanPreviewDialog = ({ profile, open, onOpenChange }: ScanPreviewDialogProps) => {
	const { data: preview, isFetching, isError, refetch } = useCaptureScanPreview(profile.id, open);

	const templateName = (templateId: string) =>
		profile.templates.find((template) => template.id === templateId)?.name ?? "—";

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent size="xl">
				<DialogHeader>
					<DialogTitle>Testar detecção</DialogTitle>
					<DialogDescription>
						Cada retângulo é um alvo que receberia pokébola agora. Se aparecer alvo demais, aumente a confiança do
						template; se faltar alvo, diminua.
					</DialogDescription>
				</DialogHeader>

				{isError && <ErrorState onRetry={() => refetch()} />}

				{isFetching && (
					<div className="flex h-64 items-center justify-center">
						<LoadingSpinner />
					</div>
				)}

				{!isFetching && preview && (
					<div className="flex flex-col gap-4">
						<div className="relative max-h-[55vh] overflow-hidden rounded-lg border">
							<img src={preview.dataUrl} alt="Tela varrida" className="w-full" />
							{preview.scanRegion && (
								<div
									className="border-muted-foreground/60 pointer-events-none absolute border border-dashed"
									style={{
										left: percent(preview.scanRegion.x, preview.width),
										top: percent(preview.scanRegion.y, preview.height),
										width: percent(preview.scanRegion.width, preview.width),
										height: percent(preview.scanRegion.height, preview.height),
									}}
								/>
							)}
							{preview.targets.map((target) => (
								<div
									key={`${target.templateId}-${target.x}-${target.y}`}
									className="border-primary bg-primary/15 pointer-events-none absolute border-2"
									style={{
										left: percent(target.x, preview.width),
										top: percent(target.y, preview.height),
										width: percent(target.width, preview.width),
										height: percent(target.height, preview.height),
									}}
								/>
							))}
						</div>

						<div className="flex flex-wrap items-center gap-2">
							<Badge variant="outline">{preview.targets.length} alvo(s)</Badge>
							<Badge variant="outline">{preview.scanMs} ms de varredura</Badge>
							{profile.rescanPasses > 1 && (
								<Typography variant="caption" className="text-muted-foreground">
									O teste faz uma varredura só. Em jogo, o perfil repete até {profile.rescanPasses}x para pegar corpo
									empilhado.
								</Typography>
							)}
							{!profile.scanRegion && (
								<Typography variant="caption" className="text-muted-foreground">
									Sem área definida — a varredura cobre a tela toda e pode achar sprites da própria interface do jogo.
								</Typography>
							)}
						</div>

						{preview.targets.length > 0 && (
							<div className="flex flex-col gap-1">
								{preview.targets.map((target) => (
									<Typography
										key={`row-${target.templateId}-${target.x}-${target.y}`}
										variant="caption"
										className="text-muted-foreground"
									>
										{templateName(target.templateId)} — ({target.x}, {target.y}) · confiança {target.score.toFixed(3)}
									</Typography>
								))}
							</div>
						)}
					</div>
				)}

				<DialogFooter>
					<Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
						Fechar
					</Button>
					<Button type="button" onClick={() => refetch()} disabled={isFetching}>
						Varrer de novo
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
};
