import {
	Button,
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components";
import type { Step } from "@shared/macro-types";
import { Keyboard, MousePointer2, MousePointerClick, Plus, Timer, Type } from "lucide-react";

const OPTIONS: { type: Step["type"]; label: string; icon: typeof MousePointer2; build: () => Omit<Step, "id"> }[] = [
	{ type: "moveMouse", label: "Mover mouse", icon: MousePointer2, build: () => ({ type: "moveMouse", x: 0, y: 0 }) },
	{
		type: "click",
		label: "Clique",
		icon: MousePointerClick,
		build: () => ({ type: "click", button: "left", x: 0, y: 0 }),
	},
	{ type: "type", label: "Digitar texto", icon: Type, build: () => ({ type: "type", text: "" }) },
	{ type: "key", label: "Tecla", icon: Keyboard, build: () => ({ type: "key", keys: [] }) },
	{ type: "wait", label: "Esperar", icon: Timer, build: () => ({ type: "wait", ms: 500 }) },
];

type AddStepMenuProps = {
	onAdd: (step: Step) => void;
};

export const AddStepMenu = ({ onAdd }: AddStepMenuProps) => {
	return (
		<DropdownMenu>
			<DropdownMenuTrigger asChild>
				<Button type="button" variant="outline" size="sm">
					<Plus className="size-4" />
					Adicionar passo
				</Button>
			</DropdownMenuTrigger>
			<DropdownMenuContent align="start">
				{OPTIONS.map(({ type, label, icon: Icon, build }) => (
					<DropdownMenuItem key={type} onClick={() => onAdd({ ...build(), id: crypto.randomUUID() } as Step)}>
						<Icon className="size-4" />
						{label}
					</DropdownMenuItem>
				))}
			</DropdownMenuContent>
		</DropdownMenu>
	);
};
