import { tanStackQueryClient } from "@/app/api/clients";
import { usePullToRefresh } from "@/app/hooks/usePullToRefresh";
import { AuthProvider } from "@/app/providers/authProvider";
import { OverlayPreferenceProvider } from "@/app/providers/ui-overlay-preference";
import { ThemeProvider } from "@/app/providers/useThemeContext";

import { SidebarProvider } from "@/components/sidebar";
import { Toaster } from "@/components/sonner/sonner";
import { QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { BrowserRouter } from "react-router-dom";

type AppProviderProps = {
	children: ReactNode;
};

const AppInner = ({ children }: AppProviderProps) => {
	usePullToRefresh();
	return <>{children}</>;
};

export const AppProvider = ({ children }: AppProviderProps): ReactNode => {
	return (
		<ThemeProvider defaultTheme="system" storageKey="vite-ui-theme">
			<QueryClientProvider client={tanStackQueryClient}>
				<BrowserRouter>
					<AuthProvider>
						<SidebarProvider>
							<OverlayPreferenceProvider>
								<AppInner>{children}</AppInner>
							</OverlayPreferenceProvider>
						</SidebarProvider>
					</AuthProvider>
					<Toaster />
				</BrowserRouter>
			</QueryClientProvider>
		</ThemeProvider>
	);
};
