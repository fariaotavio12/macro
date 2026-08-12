import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { CaptureConfig, CaptureProfile } from "@shared/capture-types";

export const captureKeys = {
	config: ["captures", "config"] as const,
	scanPreview: ["captures", "scan-preview"] as const,
	/** @deprecated Só existe enquanto a migração incremental para `CaptureConfig` não termina. */
	profiles: ["captures", "profiles"] as const,
};

export const useCaptureConfig = () =>
	useQuery({
		queryKey: captureKeys.config,
		queryFn: () => window.api.capture.get(),
	});

/** O cache recebe o snapshot confirmado pelo main, nunca o draft enviado. */
export const useSaveCaptureConfig = () => {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: (config: CaptureConfig) => window.api.capture.save(config),
		onSuccess: (saved) => queryClient.setQueryData(captureKeys.config, saved),
	});
};

/** Varredura de calibração: sempre refaz ao abrir, nunca serve print velho de cache. */
export const useCaptureScanPreview = (enabled: boolean) =>
	useQuery({
		queryKey: captureKeys.scanPreview,
		queryFn: () => window.api.capture.scanPreview(),
		enabled,
		staleTime: 0,
		gcTime: 0,
		refetchOnMount: "always",
	});

// Hooks por perfil: só existem enquanto a migração incremental não termina.

/** @deprecated Só existe enquanto a migração incremental para `CaptureConfig` não termina. */
export const useCaptureProfiles = () =>
	useQuery({
		queryKey: captureKeys.profiles,
		queryFn: () => window.api.capture.listProfiles(),
	});

/** @deprecated Só existe enquanto a migração incremental para `CaptureConfig` não termina. */
export const useSaveCaptureProfile = () => {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: (profile: CaptureProfile) => window.api.capture.saveProfile(profile),
		onSuccess: () => queryClient.invalidateQueries({ queryKey: captureKeys.profiles }),
	});
};

/** @deprecated Só existe enquanto a migração incremental para `CaptureConfig` não termina. */
export const useDeleteCaptureProfile = () => {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: (id: string) => window.api.capture.deleteProfile(id),
		onSuccess: () => queryClient.invalidateQueries({ queryKey: captureKeys.profiles }),
	});
};
