import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { Macro, Settings } from "@shared/macro-types";

export const macroKeys = {
	all: ["macros"] as const,
	detail: (id: string) => ["macros", id] as const,
};

export const settingsKeys = {
	all: ["settings"] as const,
};

export const useMacros = () =>
	useQuery({
		queryKey: macroKeys.all,
		queryFn: () => window.api.macro.list(),
	});

export const useMacro = (id: string | undefined) =>
	useQuery({
		queryKey: macroKeys.detail(id ?? ""),
		queryFn: () => window.api.macro.get(id as string),
		enabled: !!id,
	});

export const useSaveMacro = () => {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: (macro: Macro) => window.api.macro.save(macro),
		onSuccess: () => queryClient.invalidateQueries({ queryKey: macroKeys.all }),
	});
};

export const useDeleteMacro = () => {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: (id: string) => window.api.macro.delete(id),
		onSuccess: () => queryClient.invalidateQueries({ queryKey: macroKeys.all }),
	});
};

export const useSettings = () =>
	useQuery({
		queryKey: settingsKeys.all,
		queryFn: () => window.api.settings.get(),
	});

export const useSaveSettings = () => {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: (settings: Settings) => window.api.settings.set(settings),
		onSuccess: () => queryClient.invalidateQueries({ queryKey: settingsKeys.all }),
	});
};
