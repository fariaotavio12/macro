import { Button, ScreenshotPicker } from "@/components";
import { Typography } from "@/components/typography";
import type { Region } from "@shared/macro-types";
import { Crop, X } from "lucide-react";
import { useState } from "react";

type RegionPickerFieldProps = {
	region?: Region;
	onChange: (region: Region | undefined) => void;
	emptyLabel?: string;
};

export const formatRegion = (region: Region) => `${region.width}×${region.height} em (${region.x}, ${region.y})`;

export const RegionPickerField = ({ region, onChange, emptyLabel = "Tela inteira" }: RegionPickerFieldProps) => {
	const [pickerOpen, setPickerOpen] = useState(false);

	return (
		<>
			<div className="flex items-center gap-2">
				<Typography variant="body-sm" className="text-muted-foreground min-w-40">
					{region ? formatRegion(region) : emptyLabel}
				</Typography>
				<Button type="button" variant="outline" size="sm" onClick={() => setPickerOpen(true)}>
					<Crop className="size-4" />
					{region ? "Redefinir" : "Selecionar"}
				</Button>
				{region && (
					<Button
						type="button"
						variant="ghost"
						size="icon-sm"
						aria-label="Limpar região"
						onClick={() => onChange(undefined)}
					>
						<X className="size-4" />
					</Button>
				)}
			</div>

			<ScreenshotPicker
				open={pickerOpen}
				onOpenChange={setPickerOpen}
				mode="region"
				onPick={(picked) => onChange(picked)}
			/>
		</>
	);
};
