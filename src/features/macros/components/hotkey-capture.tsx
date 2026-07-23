import { Button, Kbd, KbdGroup } from "@/components";
import { useEffect, useRef, useState } from "react";
import { comboFromDomEvent, modifierFromDomEvent } from "../lib/dom-key-map";

type HotkeyCaptureProps = {
	value?: string;
	onChange: (combo: string | undefined) => void;
};

export const HotkeyCapture = ({ value, onChange }: HotkeyCaptureProps) => {
	const [listening, setListening] = useState(false);
	const [heldMods, setHeldMods] = useState<string[]>([]);
	const heldRef = useRef<string[]>([]);

	useEffect(() => {
		if (!listening) return;

		const onKeyDown = (e: KeyboardEvent) => {
			e.preventDefault();

			const combo = comboFromDomEvent(e);
			if (combo) {
				onChange(combo);
				setListening(false);
				heldRef.current = [];
				setHeldMods([]);
				return;
			}

			const mod = modifierFromDomEvent(e);
			if (mod && !heldRef.current.includes(mod)) {
				heldRef.current = [...heldRef.current, mod];
				setHeldMods(heldRef.current);
			}
		};

		const onKeyUp = (e: KeyboardEvent) => {
			const mod = modifierFromDomEvent(e);
			if (mod) {
				heldRef.current = heldRef.current.filter((m) => m !== mod);
				setHeldMods(heldRef.current);
			}
		};

		window.addEventListener("keydown", onKeyDown, true);
		window.addEventListener("keyup", onKeyUp, true);
		return () => {
			window.removeEventListener("keydown", onKeyDown, true);
			window.removeEventListener("keyup", onKeyUp, true);
		};
	}, [listening, onChange]);

	const handleStart = () => {
		heldRef.current = [];
		setHeldMods([]);
		setListening(true);
	};

	const handleCancel = () => {
		setListening(false);
		heldRef.current = [];
		setHeldMods([]);
	};

	if (listening) {
		return (
			<div className="flex items-center gap-2">
				<span className="border-input-border bg-muted/40 flex h-9 min-w-44 items-center gap-1 rounded-lg border px-3">
					{heldMods.length > 0 ? (
						<KbdGroup>
							{heldMods.map((m) => (
								<Kbd key={m}>{m}</Kbd>
							))}
							<span className="text-muted-foreground text-xs">+...</span>
						</KbdGroup>
					) : (
						<span className="text-muted-foreground text-xs">
							Segure os modificadores e pressione a tecla final
						</span>
					)}
				</span>
				<Button type="button" variant="ghost" size="sm" onClick={handleCancel}>
					Cancelar
				</Button>
			</div>
		);
	}

	return (
		<div className="flex items-center gap-2">
			<Button type="button" variant="outline" size="sm" onClick={handleStart}>
				{value ? "Alterar atalho" : "Definir atalho"}
			</Button>
			{value && (
				<KbdGroup>
					{value.split("+").map((key) => (
						<Kbd key={key}>{key}</Kbd>
					))}
				</KbdGroup>
			)}
			{value && (
				<Button type="button" variant="ghost" size="sm" onClick={() => onChange(undefined)}>
					Remover
				</Button>
			)}
		</div>
	);
};
