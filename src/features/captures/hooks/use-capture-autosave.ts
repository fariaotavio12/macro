import type { CaptureConfig } from "@shared/capture-types";
import { useCallback, useEffect, useRef, useState } from "react";
import { useCaptureConfig, useSaveCaptureConfig } from "../api";

/** Tempo sem digitar antes de gravar: evita um save por tecla. */
const DEBOUNCE_MS = 500;

export type CaptureAutosaveStatus = "loading" | "saved" | "dirty" | "saving" | "error";

type Waiter = { revision: number; resolve: () => void; reject: (reason: Error) => void };

/**
 * Mantém o draft da tela e serializa as gravações. A revisão local — e não a igualdade do
 * objeto — decide se a resposta do main ainda descreve o que está na tela: sem ela, um save
 * lento devolveria valores velhos por cima de uma edição mais nova.
 */
export const useCaptureAutosave = () => {
	const { data: config, isError, refetch } = useCaptureConfig();
	const { mutateAsync } = useSaveCaptureConfig();

	const [draft, setDraft] = useState<CaptureConfig | null>(null);
	const [status, setStatus] = useState<CaptureAutosaveStatus>("saved");
	const [error, setError] = useState<string | null>(null);

	const draftRef = useRef<CaptureConfig | null>(null);
	const revision = useRef(0);
	const savedRevision = useRef(0);
	/** Revisão que está no ar agora, ou `null` quando nada está sendo gravado. */
	const inFlight = useRef<number | null>(null);
	const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
	const waiters = useRef<Waiter[]>([]);

	const settleWaiters = useCallback(() => {
		const done = waiters.current.filter((waiter) => waiter.revision <= savedRevision.current);
		waiters.current = waiters.current.filter((waiter) => waiter.revision > savedRevision.current);
		for (const waiter of done) waiter.resolve();
	}, []);

	const failWaiters = useCallback((reason: Error) => {
		const pending = waiters.current;
		waiters.current = [];
		for (const waiter of pending) waiter.reject(reason);
	}, []);

	const pump = useCallback(async () => {
		if (inFlight.current !== null) return;
		try {
			// O laço cobre a edição que chegou durante o save anterior: ela entra na fila na
			// hora, sem esperar outro debounce, e o snapshot mais novo é o último a gravar.
			while (draftRef.current && savedRevision.current < revision.current) {
				const target = revision.current;
				const snapshot = draftRef.current;
				inFlight.current = target;
				setStatus("saving");
				const saved = await mutateAsync(snapshot);
				inFlight.current = null;
				savedRevision.current = target;
				if (revision.current === target) {
					draftRef.current = saved;
					setDraft(saved);
					setStatus("saved");
					setError(null);
				}
				settleWaiters();
			}
			settleWaiters();
		} catch (cause) {
			// Conflito de atalho ou falha de escrita: o draft continua na tela e o retry
			// repete exatamente este snapshot.
			const reason = cause instanceof Error ? cause : new Error(String(cause));
			inFlight.current = null;
			setStatus("error");
			setError(reason.message);
			failWaiters(reason);
		}
	}, [mutateAsync, settleWaiters, failWaiters]);

	const clearTimer = useCallback(() => {
		if (!timer.current) return;
		clearTimeout(timer.current);
		timer.current = null;
	}, []);

	const patch = useCallback(
		(values: Partial<CaptureConfig>) => {
			const base = draftRef.current;
			if (!base) return;
			const next = { ...base, ...values };
			draftRef.current = next;
			revision.current += 1;
			setDraft(next);
			setStatus("dirty");
			clearTimer();
			timer.current = setTimeout(() => {
				timer.current = null;
				void pump();
			}, DEBOUNCE_MS);
		},
		[clearTimer, pump],
	);

	/** Grava agora e resolve quando a revisão mais recente for confirmada pelo main. */
	const flush = useCallback(() => {
		clearTimer();
		if (!draftRef.current || savedRevision.current >= revision.current) return Promise.resolve();
		const target = revision.current;
		const promise = new Promise<void>((resolve, reject) => {
			waiters.current.push({ revision: target, resolve, reject });
		});
		void pump();
		return promise;
	}, [clearTimer, pump]);

	const retry = useCallback(() => {
		clearTimer();
		void pump();
	}, [clearTimer, pump]);

	// Primeira carga: o draft nasce do snapshot do main. Refetch posterior não entra aqui —
	// substituir o draft descartaria edição local.
	useEffect(() => {
		if (!config || draftRef.current) return;
		draftRef.current = config;
		setDraft(config);
	}, [config]);

	// Sair da tela com save pendente: dispara o snapshot mais novo e não espera a resposta —
	// aguardar aqui travaria a navegação.
	useEffect(
		() => () => {
			if (timer.current) clearTimeout(timer.current);
			timer.current = null;
			failWaiters(new Error("A tela de Capturas foi fechada antes do salvamento terminar."));
			const snapshot = draftRef.current;
			if (!snapshot) return;
			if (savedRevision.current >= revision.current || inFlight.current === revision.current) return;
			void mutateAsync(snapshot).catch((cause) => console.error("[capture] autosave pendente falhou:", cause));
		},
		[failWaiters, mutateAsync],
	);

	return {
		draft,
		patch,
		status: draft ? status : ("loading" as CaptureAutosaveStatus),
		error,
		retry,
		flush,
		isLoadError: isError,
		reload: refetch,
	};
};
