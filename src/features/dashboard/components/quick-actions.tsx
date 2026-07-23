import { Button } from "@/components/button";
import { Card, CardContent, CardHeader } from "@/components/card";
import { Typography } from "@/components/typography";
import { ArrowRight, BookOpen, Component, Settings2 } from "lucide-react";

const actions = [
	{ label: "Ver componentes", icon: Component },
	{ label: "Ler arquitetura", icon: BookOpen },
	{ label: "Ajustar tema", icon: Settings2 },
];

export const QuickActions = () => {
	return (
		<Card>
			<CardHeader>
				<Typography variant="title-sm">Acoes rapidas</Typography>
				<Typography variant="body-sm" className="text-muted-foreground">
					Atalhos demonstrativos para fluxos comuns de um SaaS.
				</Typography>
			</CardHeader>
			<CardContent className="flex flex-col gap-3">
				{actions.map(({ label, icon: Icon }) => (
					<Button key={label} type="button" variant="outline" className="w-full justify-between">
						<span className="flex items-center gap-2">
							<Icon className="size-4" />
							{label}
						</span>
						<ArrowRight className="size-4 text-muted-foreground" />
					</Button>
				))}
			</CardContent>
		</Card>
	);
};
