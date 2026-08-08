import { Button } from "@/components/button";
import { ScreenshotPicker } from "@/components/screenshot-picker";
import { notify } from "@/components/toast/notify";
import { ImageIcon, ScanSearch } from "lucide-react";
import { useState } from "react";

type ImagePickerFieldProps = {
	imagePath: string;
	onChange: (imagePath: string) => void;
};

export const ImagePickerField = ({ imagePath, onChange }: ImagePickerFieldProps) => {
	const [pickerOpen, setPickerOpen] = useState(false);

	return (
		<>
			<div className="flex items-center gap-2">
				<div className="bg-muted flex size-9 shrink-0 items-center justify-center overflow-hidden rounded-md">
					{imagePath ? (
						<img src={`macro-image://${imagePath}`} alt="Referência" className="size-full object-cover" />
					) : (
						<ImageIcon className="text-muted-foreground size-4" />
					)}
				</div>
				<Button type="button" variant="outline" size="sm" onClick={() => setPickerOpen(true)}>
					<ScanSearch className="size-4" />
					{imagePath ? "Recapturar" : "Selecionar imagem"}
				</Button>
			</div>

			<ScreenshotPicker
				open={pickerOpen}
				onOpenChange={setPickerOpen}
				mode="region"
				onPick={(region) => {
					window.api.screenshot
						.cropSave(region)
						.then((result) => onChange(result.imagePath))
						.catch(() => notify.error("Não foi possível salvar a imagem recortada"));
				}}
			/>
		</>
	);
};
