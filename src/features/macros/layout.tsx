import { Rotas } from "@/app/routing/variables";
import { cn } from "@/app/utils/cn";
import { Button } from "@/components/button";
import { Typography } from "@/components/typography";
import { useCaptureNotifications } from "@/features/captures/hooks/use-capture-notifications";
import { Settings } from "lucide-react";
import { useState } from "react";
import { NavLink, Outlet } from "react-router-dom";
import { SettingsSheet } from "./components/settings-sheet";
import { usePlayStateNotifications } from "./hooks/use-play-state-notifications";

const NAV_ITEMS = [
	{ to: Rotas.macros.library, label: "Macros" },
	{ to: Rotas.macros.captures, label: "Capturas" },
];

export const LayoutMacroApp = () => {
	const [settingsOpen, setSettingsOpen] = useState(false);
	usePlayStateNotifications();
	useCaptureNotifications();

	return (
		<div className="bg-background flex h-screen w-full flex-col">
			<header className="flex h-14 shrink-0 items-center justify-between border-b px-4">
				<div className="flex items-center gap-6">
					<Typography variant="title-sm" as="span">
						Macro App
					</Typography>
					<nav className="flex items-center gap-1">
						{NAV_ITEMS.map((item) => (
							<NavLink
								key={item.to}
								to={item.to}
								end
								className={({ isActive }) =>
									cn(
										"nav-link rounded-lg px-3 py-1.5 transition-colors",
										isActive ? "bg-muted text-foreground" : "text-muted-foreground hover:text-foreground",
									)
								}
							>
								{item.label}
							</NavLink>
						))}
					</nav>
				</div>
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
