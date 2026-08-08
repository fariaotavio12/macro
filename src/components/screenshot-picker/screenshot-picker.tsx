import { notify } from "@/components/toast/notify";
import { Typography } from "@/components/typography";
import type { Region } from "@shared/macro-types";
import { Dialog as DialogPrimitive } from "radix-ui";
import { useEffect, useRef, useState } from "react";

type Point = { x: number; y: number };

type ScreenshotPickerProps = {
	open: boolean;
	onOpenChange: (open: boolean) => void;
} & ({ mode: "point"; onPick: (point: Point) => void } | { mode: "region"; onPick: (region: Region) => void });

type Capture = { dataUrl: string; width: number; height: number };
type Drag = { originLeft: number; originTop: number; startX: number; startY: number; curX: number; curY: number };

const MIN_REGION_PX = 4;

export const ScreenshotPicker = ({ open, onOpenChange, mode, onPick }: ScreenshotPickerProps) => {
	const [capture, setCapture] = useState<Capture | null>(null);
	const [loading, setLoading] = useState(false);
	const [drag, setDrag] = useState<Drag | null>(null);
	const imgRef = useRef<HTMLImageElement>(null);

	useEffect(() => {
		if (!open) return;
		const load = async () => {
			setLoading(true);
			try {
				setCapture(await window.api.screenshot.capture());
			} catch {
				notify.error("Não foi possível capturar a tela");
			} finally {
				setLoading(false);
			}
		};
		load();
	}, [open]);

	const toRealPoint = (clientX: number, clientY: number): Point | null => {
		const img = imgRef.current;
		if (!img || !capture) return null;
		const rect = img.getBoundingClientRect();
		const scaleX = capture.width / rect.width;
		const scaleY = capture.height / rect.height;
		const x = Math.round((clientX - rect.left) * scaleX);
		const y = Math.round((clientY - rect.top) * scaleY);
		return {
			x: Math.min(Math.max(x, 0), capture.width),
			y: Math.min(Math.max(y, 0), capture.height),
		};
	};

	const handlePointClick = (e: React.MouseEvent) => {
		const point = toRealPoint(e.clientX, e.clientY);
		if (!point || mode !== "point") return;
		onPick(point);
		onOpenChange(false);
	};

	const handleRegionMouseDown = (e: React.MouseEvent<HTMLImageElement>) => {
		if (mode !== "region") return;
		const rect = e.currentTarget.getBoundingClientRect();
		const { clientX, clientY } = e;
		setDrag({
			originLeft: rect.left,
			originTop: rect.top,
			startX: clientX,
			startY: clientY,
			curX: clientX,
			curY: clientY,
		});
	};

	const handleRegionMouseMove = (e: React.MouseEvent) => {
		if (mode !== "region" || !drag) return;
		setDrag({ ...drag, curX: e.clientX, curY: e.clientY });
	};

	const handleRegionMouseUp = () => {
		if (mode !== "region" || !drag) return;
		const displayedWidth = Math.abs(drag.curX - drag.startX);
		const displayedHeight = Math.abs(drag.curY - drag.startY);
		if (displayedWidth < MIN_REGION_PX || displayedHeight < MIN_REGION_PX) {
			setDrag(null);
			return;
		}
		const start = toRealPoint(Math.min(drag.startX, drag.curX), Math.min(drag.startY, drag.curY));
		const end = toRealPoint(Math.max(drag.startX, drag.curX), Math.max(drag.startY, drag.curY));
		setDrag(null);
		if (!start || !end) return;
		onPick({ x: start.x, y: start.y, width: end.x - start.x, height: end.y - start.y });
		onOpenChange(false);
	};

	return (
		<DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
			<DialogPrimitive.Portal>
				<DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/70" />
				<DialogPrimitive.Content
					className="fixed inset-0 z-[60] flex flex-col items-center justify-center gap-4 p-6 outline-none"
					aria-describedby={undefined}
				>
					<DialogPrimitive.Title className="sr-only">Selecionar {mode === "point" ? "ponto" : "área"} na tela</DialogPrimitive.Title>
					<Typography variant="body-sm" className="text-white">
						{mode === "point"
							? "Clique no ponto exato da tela"
							: "Arraste um retângulo ao redor da imagem de referência"}
						<span className="text-white/60"> — Esc para cancelar</span>
					</Typography>

					{loading && (
						<Typography variant="body-sm" className="text-white/70">
							Capturando tela...
						</Typography>
					)}

					{capture && (
						<div className="relative max-h-[80vh] max-w-[90vw]">
							<img
								ref={imgRef}
								src={capture.dataUrl}
								alt="Captura da tela"
								className={`max-h-[80vh] max-w-[90vw] cursor-crosshair ${mode === "region" ? "select-none" : ""}`}
								onClick={handlePointClick}
								onMouseDown={handleRegionMouseDown}
								onMouseMove={handleRegionMouseMove}
								onMouseUp={handleRegionMouseUp}
								draggable={false}
							/>
							{mode === "region" && drag && (
								<div
									className="border-primary bg-primary/20 pointer-events-none absolute border-2"
									style={{
										left: Math.min(drag.startX, drag.curX) - drag.originLeft,
										top: Math.min(drag.startY, drag.curY) - drag.originTop,
										width: Math.abs(drag.curX - drag.startX),
										height: Math.abs(drag.curY - drag.startY),
									}}
								/>
							)}
						</div>
					)}
				</DialogPrimitive.Content>
			</DialogPrimitive.Portal>
		</DialogPrimitive.Root>
	);
};
