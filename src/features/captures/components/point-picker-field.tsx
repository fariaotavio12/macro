import { Button, ScreenshotPicker } from "@/components";
import { Typography } from "@/components/typography";
import { Crosshair } from "lucide-react";
import { useState } from "react";

type Point = { x: number; y: number };

type PointPickerFieldProps = {
	point?: Point;
	onChange: (point: Point) => void;
};

export const PointPickerField = ({ point, onChange }: PointPickerFieldProps) => {
	const [pickerOpen, setPickerOpen] = useState(false);

	return (
		<>
			<div className="flex items-center gap-2">
				<Typography variant="body-sm" className="text-muted-foreground min-w-24">
					{point ? `(${point.x}, ${point.y})` : "Não definido"}
				</Typography>
				<Button type="button" variant="outline" size="sm" onClick={() => setPickerOpen(true)}>
					<Crosshair className="size-4" />
					Selecionar
				</Button>
			</div>

			<ScreenshotPicker open={pickerOpen} onOpenChange={setPickerOpen} mode="point" onPick={onChange} />
		</>
	);
};
