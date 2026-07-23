import { cn } from "@/app/utils/cn";
import { Typography } from "@/components/typography";
import type { ReactNode } from "react";

type PageHeaderProps = {
	eyebrow?: string;
	title: ReactNode;
	description?: string;
	actions?: ReactNode;
	maxWidthClassName?: string;
};

export const PageHeader = ({ eyebrow, title, description, actions, maxWidthClassName = "max-w-6xl" }: PageHeaderProps) => (
	<header className="border-b">
		<div className={cn("mx-auto flex w-full flex-col gap-4 px-4 py-6 lg:flex-row lg:flex-wrap lg:items-end lg:justify-between", maxWidthClassName)}>
			<div className="min-w-0 flex-1 space-y-2">
				{eyebrow && (
					<Typography variant="section-label" className="text-muted-foreground block">
						{eyebrow}
					</Typography>
				)}
				{typeof title === "string" ? (
					<Typography variant="display-md" className="block break-words">
						{title}
					</Typography>
				) : (
					title
				)}
				{description && (
					<Typography variant="body-sm" className="text-muted-foreground block max-w-3xl">
						{description}
					</Typography>
				)}
			</div>
			{actions && <div className="flex max-w-full flex-wrap gap-2 lg:ml-auto lg:justify-end">{actions}</div>}
		</div>
	</header>
);
