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
	KbdGroup,
	Kbd,
	notify,
	ResponsiveTableCustom,
	Switch,
} from "@/components";
import { Typography } from "@/components/typography";
import type { ColumnDef } from "@tanstack/react-table";
import { MoreVertical, Pencil, Play, Plus, Square, Trash2 } from "lucide-react";
import { useCallback, useMemo, useState } from "react";
import { useDeleteMacro, useMacros, useSaveMacro } from "./api";
import { MacroEditorSheet } from "./components/macro-editor-sheet";
import { usePlayState } from "./hooks/use-play-state";
import type { Macro } from "@shared/macro-types";

const repeatLabel = (macro: Macro) => {
	if (macro.repeat.mode === "loop") return "Loop";
	if (macro.repeat.mode === "times") return `${macro.repeat.count ?? 1}x`;
	return "1x";
};

const blankMacro = (): Macro => ({
	id: crypto.randomUUID(),
	name: "Nova macro",
	steps: [],
	repeat: { mode: "once" },
	mouseMode: "jump",
	active: false,
});

export const PageLibrary = () => {
	const { data: macros, isPending, isError, refetch } = useMacros();
	const saveMacro = useSaveMacro();
	const deleteMacro = useDeleteMacro();
	const playStates = usePlayState();
	const [macroToDelete, setMacroToDelete] = useState<Macro | null>(null);
	const [editor, setEditor] = useState<{ macro: Macro; mode: "create" | "edit" } | null>(null);

	const handleToggleActive = useCallback(
		(macro: Macro, active: boolean) => {
			saveMacro.mutate({ ...macro, active }, { onError: (err) => notify.error(err.message) });
		},
		[saveMacro],
	);

	const handlePlayToggle = useCallback(
		(macro: Macro) => {
			const status = playStates[macro.id];
			if (status === "playing") {
				window.api.play.stop(macro.id);
			} else {
				window.api.play.start(macro.id);
			}
		},
		[playStates],
	);

	const handleConfirmDelete = () => {
		if (!macroToDelete) return;
		deleteMacro.mutate(macroToDelete.id, {
			onError: (err) => notify.error(err.message),
			onSuccess: () => notify.success("Macro excluída"),
		});
		setMacroToDelete(null);
	};

	const columns = useMemo<ColumnDef<Macro>[]>(
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
				id: "repeat",
				header: "Repetição",
				cell: ({ row }) => <Badge variant="outline">{repeatLabel(row.original)}</Badge>,
				meta: { mobileLabel: "Repetição", mobileOrder: 3 },
			},
			{
				id: "active",
				header: "Ativa",
				cell: ({ row }) => (
					<Switch
						checked={row.original.active}
						onCheckedChange={(checked) => handleToggleActive(row.original, checked)}
					/>
				),
				meta: { mobileLabel: "Ativa", mobileOrder: 4 },
			},
		],
		[handleToggleActive],
	);

	const renderRowActions = useCallback(
		(row: { original: Macro }) => {
			const macro = row.original;
			const isPlaying = playStates[macro.id] === "playing";
			return (
				<div className="flex items-center justify-end gap-1">
					<Button
						type="button"
						variant={isPlaying ? "destructive" : "outline"}
						size="icon-sm"
						aria-label={isPlaying ? "Parar" : "Executar"}
						onClick={() => handlePlayToggle(macro)}
					>
						{isPlaying ? <Square className="size-3.5" /> : <Play className="size-3.5" />}
					</Button>
					<DropdownMenu>
						<DropdownMenuTrigger asChild>
							<Button type="button" variant="ghost" size="icon-sm" aria-label="Mais ações">
								<MoreVertical className="size-4" />
							</Button>
						</DropdownMenuTrigger>
						<DropdownMenuContent align="end">
							<DropdownMenuItem onClick={() => setEditor({ macro, mode: "edit" })}>
								<Pencil className="size-4" />
								Editar
							</DropdownMenuItem>
							<DropdownMenuItem variant="destructive" onClick={() => setMacroToDelete(macro)}>
								<Trash2 className="size-4" />
								Excluir
							</DropdownMenuItem>
						</DropdownMenuContent>
					</DropdownMenu>
				</div>
			);
		},
		[playStates, handlePlayToggle],
	);

	const pagination = {
		page: 0,
		size: Math.max(macros?.length ?? 0, 10),
		totalElements: macros?.length ?? 0,
		totalPages: 1,
	};

	return (
		<div className="flex w-full flex-col gap-6 p-4 md:p-6">
			<div className="flex items-center justify-between gap-4">
				<div className="flex flex-col gap-1">
					<Typography variant="display-md">Macros</Typography>
					<Typography variant="body-sm" className="text-muted-foreground">
						Grave, edite e execute suas automações.
					</Typography>
				</div>
				<Button type="button" onClick={() => setEditor({ macro: blankMacro(), mode: "create" })}>
					<Plus className="size-4" />
					Nova macro
				</Button>
			</div>

			{isError ? (
				<ErrorState onRetry={() => refetch()} />
			) : !isPending && (macros?.length ?? 0) === 0 ? (
				<EmptyState
					title="Nenhuma macro ainda"
					message="Crie a primeira macro para começar a automatizar."
					actionLabel="Nova macro"
					onAction={() => setEditor({ macro: blankMacro(), mode: "create" })}
				/>
			) : (
				<ResponsiveTableCustom
					columns={columns}
					data={macros ?? []}
					isPending={isPending}
					pagination={pagination}
					onPageChange={() => undefined}
					onSizeChange={() => undefined}
					onRowClick={(macro) => setEditor({ macro, mode: "edit" })}
					renderActions={renderRowActions}
				/>
			)}

			<Dialog open={!!macroToDelete} onOpenChange={(open) => !open && setMacroToDelete(null)}>
				<DialogContent size="sm">
					<DialogHeader>
						<DialogTitle>Excluir "{macroToDelete?.name}"?</DialogTitle>
						<DialogDescription>Essa ação não pode ser desfeita.</DialogDescription>
					</DialogHeader>
					<DialogFooter>
						<Button type="button" variant="outline" onClick={() => setMacroToDelete(null)}>
							Cancelar
						</Button>
						<Button type="button" variant="destructive" onClick={handleConfirmDelete}>
							Excluir
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>

			{editor && (
				<MacroEditorSheet
					key={editor.macro.id}
					macro={editor.macro}
					mode={editor.mode}
					open={!!editor}
					onOpenChange={(open) => !open && setEditor(null)}
				/>
			)}
		</div>
	);
};
