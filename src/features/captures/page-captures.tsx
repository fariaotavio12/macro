import {
	Badge,
	Button,
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
	EmptyState,
	ErrorState,
	Kbd,
	KbdGroup,
	notify,
	ResponsiveTableCustom,
	Switch,
} from "@/components";
import { Typography } from "@/components/typography";
import type { CaptureProfile, CaptureRunSummary } from "@shared/capture-types";
import { defaultCaptureProfile } from "@shared/capture-types";
import type { ColumnDef } from "@tanstack/react-table";
import { Copy, MoreVertical, Pencil, Play, Plus, Square, Trash2 } from "lucide-react";
import { useCallback, useMemo, useState } from "react";
import { useCaptureProfiles, useDeleteCaptureProfile, useSaveCaptureProfile } from "./api";
import { CaptureEditorSheet } from "./components/capture-editor-sheet";
import { useCaptureProfileStates } from "./hooks/use-capture-state";

const blankProfile = (): CaptureProfile => defaultCaptureProfile(crypto.randomUUID());

const duplicateProfile = (profile: CaptureProfile): CaptureProfile => ({
	...profile,
	id: crypto.randomUUID(),
	name: `${profile.name} (cópia)`,
	templates: profile.templates.map((template) => ({ ...template, id: crypto.randomUUID() })),
	hotkey: undefined,
	active: false,
});

const lastRunLabel = (summary: CaptureRunSummary) => {
	if (summary.reason === "error") return "Falhou — ver detalhes";
	if (summary.reason === "no-focus") return "Jogo fora de foco";
	if (summary.reason === "no-templates") return "Sem pokémon ativo";
	if (summary.fired === 0) return `Nenhum alvo · ${summary.scanMs} ms`;
	const passes = summary.passes > 1 ? ` em ${summary.passes} passadas` : "";
	return `${summary.fired} pokébola(s)${passes} · ${summary.scanMs} ms`;
};

export const PageCaptures = () => {
	const { data: profiles, isPending, isError, refetch } = useCaptureProfiles();
	const saveProfile = useSaveCaptureProfile();
	const deleteProfile = useDeleteCaptureProfile();
	const captureStates = useCaptureProfileStates();
	const [profileToDelete, setProfileToDelete] = useState<CaptureProfile | null>(null);
	const [editor, setEditor] = useState<{ profile: CaptureProfile; mode: "create" | "edit" } | null>(null);

	const handleToggleActive = useCallback(
		(profile: CaptureProfile, active: boolean) => {
			saveProfile.mutate({ ...profile, active }, { onError: (err) => notify.error(err.message) });
		},
		[saveProfile],
	);

	const handleRunToggle = useCallback(
		(profile: CaptureProfile) => {
			const status = captureStates[profile.id]?.status;
			if (status === "scanning" || status === "acting") {
				window.api.capture.stopProfile(profile.id);
			} else {
				window.api.capture.runProfile(profile.id);
			}
		},
		[captureStates],
	);

	const handleDuplicate = useCallback(
		(profile: CaptureProfile) => {
			saveProfile.mutate(duplicateProfile(profile), {
				onError: (err) => notify.error(err.message),
				onSuccess: () => notify.success("Perfil duplicado"),
			});
		},
		[saveProfile],
	);

	const handleConfirmDelete = () => {
		if (!profileToDelete) return;
		deleteProfile.mutate(profileToDelete.id, {
			onError: (err) => notify.error(err.message),
			onSuccess: () => notify.success("Perfil excluído"),
		});
		setProfileToDelete(null);
	};

	const columns = useMemo<ColumnDef<CaptureProfile>[]>(
		() => [
			{
				accessorKey: "name",
				header: "Nome",
				cell: ({ row }) => (
					<Typography variant="body-sm" className="font-medium">
						{row.original.name}
					</Typography>
				),
				meta: { mobileHeader: true, mobileOrder: 1 },
			},
			{
				id: "hotkey",
				header: "Atalho",
				cell: ({ row }) =>
					row.original.hotkey ? (
						<KbdGroup>
							{row.original.hotkey.split("+").map((key) => (
								<Kbd key={key}>{key}</Kbd>
							))}
						</KbdGroup>
					) : (
						<Typography variant="body-sm" className="text-muted-foreground">
							—
						</Typography>
					),
				meta: { mobileLabel: "Atalho", mobileOrder: 2 },
			},
			{
				id: "templates",
				header: "Pokémons",
				cell: ({ row }) => {
					const enabled = row.original.templates.filter((template) => template.enabled).length;
					return <Badge variant="outline">{`${enabled}/${row.original.templates.length}`}</Badge>;
				},
				meta: { mobileLabel: "Pokémons", mobileOrder: 3 },
			},
			{
				id: "lastRun",
				header: "Última rodada",
				cell: ({ row }) => {
					const state = captureStates[row.original.id];
					if (state?.status === "scanning") return <Badge variant="outline">Varrendo...</Badge>;
					if (state?.status === "acting") return <Badge variant="outline">Jogando pokébola...</Badge>;
					return (
						<Typography variant="body-sm" className="text-muted-foreground">
							{state?.lastRun ? lastRunLabel(state.lastRun) : "—"}
						</Typography>
					);
				},
				meta: { mobileLabel: "Última rodada", mobileOrder: 4 },
			},
			{
				id: "active",
				header: "Ativo",
				cell: ({ row }) => (
					<Switch
						checked={row.original.active}
						onCheckedChange={(checked) => handleToggleActive(row.original, checked)}
					/>
				),
				meta: { mobileLabel: "Ativo", mobileOrder: 5 },
			},
		],
		[handleToggleActive, captureStates],
	);

	const renderRowActions = useCallback(
		(row: { original: CaptureProfile }) => {
			const profile = row.original;
			const status = captureStates[profile.id]?.status;
			const isRunning = status === "scanning" || status === "acting";
			return (
				<div className="flex items-center justify-end gap-1">
					<Button
						type="button"
						variant={isRunning ? "destructive" : "outline"}
						size="icon-sm"
						aria-label={isRunning ? "Parar" : "Executar agora"}
						onClick={() => handleRunToggle(profile)}
					>
						{isRunning ? <Square className="size-3.5" /> : <Play className="size-3.5" />}
					</Button>
					<DropdownMenu>
						<DropdownMenuTrigger asChild>
							<Button type="button" variant="ghost" size="icon-sm" aria-label="Mais ações">
								<MoreVertical className="size-4" />
							</Button>
						</DropdownMenuTrigger>
						<DropdownMenuContent align="end">
							<DropdownMenuItem onClick={() => setEditor({ profile, mode: "edit" })}>
								<Pencil className="size-4" />
								Editar
							</DropdownMenuItem>
							<DropdownMenuItem onClick={() => handleDuplicate(profile)}>
								<Copy className="size-4" />
								Duplicar
							</DropdownMenuItem>
							<DropdownMenuItem variant="destructive" onClick={() => setProfileToDelete(profile)}>
								<Trash2 className="size-4" />
								Excluir
							</DropdownMenuItem>
						</DropdownMenuContent>
					</DropdownMenu>
				</div>
			);
		},
		[captureStates, handleRunToggle, handleDuplicate],
	);

	const pagination = {
		page: 0,
		size: Math.max(profiles?.length ?? 0, 10),
		totalElements: profiles?.length ?? 0,
		totalPages: 1,
	};

	return (
		<div className="flex w-full flex-col gap-6 p-4 md:p-6">
			<div className="flex items-center justify-between gap-4">
				<div className="flex flex-col gap-1">
					<Typography variant="display-md">Capturas</Typography>
					<Typography variant="body-sm" className="text-muted-foreground">
						Ao apertar o atalho, o app procura os corpos na tela e joga pokébola em cada um.
					</Typography>
				</div>
				<Button type="button" onClick={() => setEditor({ profile: blankProfile(), mode: "create" })}>
					<Plus className="size-4" />
					Novo perfil
				</Button>
			</div>

			{isError ? (
				<ErrorState onRetry={() => refetch()} />
			) : !isPending && (profiles?.length ?? 0) === 0 ? (
				<EmptyState
					title="Nenhum perfil de captura"
					message="Crie um perfil, recorte os corpos que quer capturar e escolha a tecla de disparo."
					actionLabel="Novo perfil"
					onAction={() => setEditor({ profile: blankProfile(), mode: "create" })}
				/>
			) : (
				<ResponsiveTableCustom
					columns={columns}
					data={profiles ?? []}
					isPending={isPending}
					pagination={pagination}
					onPageChange={() => undefined}
					onSizeChange={() => undefined}
					onRowClick={(profile) => setEditor({ profile, mode: "edit" })}
					renderActions={renderRowActions}
				/>
			)}

			<Dialog open={!!profileToDelete} onOpenChange={(open) => !open && setProfileToDelete(null)}>
				<DialogContent size="sm">
					<DialogHeader>
						<DialogTitle>Excluir "{profileToDelete?.name}"?</DialogTitle>
						<DialogDescription>Essa ação não pode ser desfeita.</DialogDescription>
					</DialogHeader>
					<DialogFooter>
						<Button type="button" variant="outline" onClick={() => setProfileToDelete(null)}>
							Cancelar
						</Button>
						<Button type="button" variant="destructive" onClick={handleConfirmDelete}>
							Excluir
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>

			{editor && (
				<CaptureEditorSheet
					key={editor.profile.id}
					profile={editor.profile}
					mode={editor.mode}
					open={!!editor}
					onOpenChange={(open) => !open && setEditor(null)}
				/>
			)}
		</div>
	);
};
