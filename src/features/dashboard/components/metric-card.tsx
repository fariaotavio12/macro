import { Card, CardContent } from "@/components/card";
import { Typography } from "@/components/typography";
import type { LucideIcon } from "lucide-react";

type MetricCardProps = {
	title: string;
	value: string;
	description: string;
	icon: LucideIcon;
	trend: string;
};

export const MetricCard = ({ title, value, description, icon: Icon, trend }: MetricCardProps) => {
	return (
		<Card>
			<CardContent className="flex flex-col gap-4 p-4">
				<div className="flex items-center justify-between gap-4">
					<div className="bg-background flex size-10 items-center justify-center rounded-lg border">
						<Icon className="size-4 text-foreground" />
					</div>
					<Typography variant="caption" as="span" className="text-success">
						{trend}
					</Typography>
				</div>
				<div className="flex flex-col gap-1">
					<Typography variant="body-sm" className="text-muted-foreground">
						{title}
					</Typography>
					<Typography variant="display-sm">{value}</Typography>
					<Typography variant="caption" className="text-muted-foreground">
						{description}
					</Typography>
				</div>
			</CardContent>
		</Card>
	);
};
