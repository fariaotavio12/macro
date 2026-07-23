import { Rotas } from "@/app/routing/variables";
import { Button } from "@/components/button";
import { CustomLink } from "@/components/link";
import { Typography } from "@/components/typography";
import { Settings } from "lucide-react";
import { useState } from "react";
import { Outlet } from "react-router-dom";
import { SettingsSheet } from "./components/settings-sheet";
import { usePlayStateNotifications } from "./hooks/use-play-state-notifications";

export const LayoutMacroApp = () => {
	const [settingsOpen, setSettingsOpen] = useState(false);
	usePlayStateNotifications();

	return (
		<div className="bg-background flex h-screen w-full flex-col">
			<header className="flex h-14 shrink-0 items-center justify-between border-b px-4">
				<CustomLink to={Rotas.macros.library} variant="ghost" size="sm" className="gap-2 px-2">
					<Typography variant="title-sm" as="span">
						Macro App
					</Typography>
				</CustomLink>
				<Button
					type="button"
					variant="ghost"
					size="icon-sm"
					aria-label="Configurações"
					onClick={() => setSettingsOpen(true)}
				>
					<Settings className="size-4" />
				</Button>
			</header>
			<main className="flex min-h-0 flex-1 flex-col overflow-y-auto">
				<Outlet />
			</main>

			<SettingsSheet open={settingsOpen} onOpenChange={setSettingsOpen} />
		</div>
	);
};
