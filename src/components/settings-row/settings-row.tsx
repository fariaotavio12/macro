import { Typography } from "@/components/typography";
import type { ReactNode } from "react";

type SettingsRowProps = {
	label: string;
	description?: string;
	children: ReactNode;
};

export const SettingsRow = ({ label, description, children }: SettingsRowProps) => (
	<div className="flex flex-col gap-3 py-4 first:pt-0 last:pb-0 sm:flex-row sm:items-center sm:justify-between">
		<div className="flex flex-col gap-0.5">
			<Typography variant="body-sm" className="font-medium">
				{label}
			</Typography>
			{description && (
				<Typography variant="caption" className="text-muted-foreground">
					{description}
				</Typography>
			)}
		</div>
		<div className="shrink-0">{children}</div>
	</div>
);
