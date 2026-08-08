import { Button, Card, CardContent, EmptyState, ImagePickerField, Input, Switch } from "@/components";
import { Typography } from "@/components/typography";
import type { CaptureTemplate } from "@shared/capture-types";
import { DEFAULT_TEMPLATE_TOLERANCE, MIN_TEMPLATE_TOLERANCE } from "@shared/capture-types";
import { Plus, Trash2 } from "lucide-react";

type TemplateListProps = {
	templates: CaptureTemplate[];
	onChange: (templates: CaptureTemplate[]) => void;
};

const blankTemplate = (index: number): CaptureTemplate => ({
	id: crypto.randomUUID(),
	name: `Pokémon ${index + 1}`,
	imagePath: "",
	tolerance: DEFAULT_TEMPLATE_TOLERANCE,
	enabled: true,
});

export const TemplateList = ({ templates, onChange }: TemplateListProps) => {
	const update = (id: string, patch: Partial<CaptureTemplate>) =>
		onChange(templates.map((template) => (template.id === id ? { ...template, ...patch } : template)));

	const addTemplate = () => onChange([...templates, blankTemplate(templates.length)]);

	return (
		<div className="flex flex-col gap-3">
			{templates.length === 0 ? (
				<EmptyState
					title="Nenhum pokémon cadastrado"
					message="Recorte na tela o corpo de um pokémon para o app procurar por ele."
					actionLabel="Adicionar pokémon"
					onAction={addTemplate}
				/>
			) : (
				<>
					{templates.map((template) => (
						<Card key={template.id} size="sm">
							<CardContent className="flex flex-wrap items-center gap-3">
								<Switch
									checked={template.enabled}
									onCheckedChange={(enabled) => update(template.id, { enabled })}
									aria-label={`Procurar por ${template.name}`}
								/>
								<Input
									inputSize="sm"
									className="w-40"
									value={template.name}
									onChange={(e) => update(template.id, { name: e.target.value })}
								/>
								<ImagePickerField
									imagePath={template.imagePath}
									onChange={(imagePath) => update(template.id, { imagePath })}
								/>
								<div className="flex items-center gap-1">
									<Input
										inputSize="sm"
										type="number"
										className="w-20"
										min={MIN_TEMPLATE_TOLERANCE}
										max={1}
										step={0.01}
										value={template.tolerance}
										onChange={(e) =>
											update(template.id, {
												tolerance: Math.min(Math.max(Number(e.target.value), MIN_TEMPLATE_TOLERANCE), 1),
											})
										}
									/>
									<Typography variant="caption" className="text-muted-foreground">
										confiança
									</Typography>
								</div>
								<Button
									type="button"
									variant="ghost"
									size="icon-sm"
									className="ml-auto"
									aria-label={`Remover ${template.name}`}
									onClick={() => onChange(templates.filter((item) => item.id !== template.id))}
								>
									<Trash2 className="size-4" />
								</Button>
							</CardContent>
						</Card>
					))}
					<Button type="button" variant="outline" size="sm" className="self-start" onClick={addTemplate}>
						<Plus className="size-4" />
						Adicionar pokémon
					</Button>
				</>
			)}
		</div>
	);
};
