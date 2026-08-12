import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { CaptureProfile } from "@shared/capture-types";

export const captureKeys = {
	all: ["captures"] as const,
	detail: (id: string) => ["captures", id] as const,
	scanPreview: (id: string) => ["captures", id, "scan-preview"] as const,
};

export const useCaptureProfiles = () =>
	useQuery({
		queryKey: captureKeys.all,
		queryFn: () => window.api.capture.listProfiles(),
	});

export const useSaveCaptureProfile = () => {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: (profile: CaptureProfile) => window.api.capture.saveProfile(profile),
		onSuccess: () => queryClient.invalidateQueries({ queryKey: captureKeys.all }),
	});
};

/** Varredura de calibração: sempre refaz ao abrir, nunca serve print velho de cache. */
export const useCaptureScanPreview = (profileId: string, enabled: boolean) =>
	useQuery({
		queryKey: captureKeys.scanPreview(profileId),
		queryFn: () => window.api.capture.scanPreviewProfile(profileId),
		enabled,
		staleTime: 0,
		gcTime: 0,
		refetchOnMount: "always",
	});

export const useDeleteCaptureProfile = () => {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: (id: string) => window.api.capture.deleteProfile(id),
		onSuccess: () => queryClient.invalidateQueries({ queryKey: captureKeys.all }),
	});
};
