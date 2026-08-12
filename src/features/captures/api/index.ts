import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { CaptureConfig } from "@shared/capture-types";

export const captureKeys = {
	config: ["captures", "config"] as const,
	scanPreview: ["captures", "scan-preview"] as const,
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
