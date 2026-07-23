"use client";

import { ChevronsUpDown, LogOut, Settings } from "lucide-react";

import { useAuth } from "@/app/providers/authProvider";
import { Rotas } from "@/app/routing/variables";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/avatar/avatar";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/dropdown";
import { SidebarMenu, SidebarMenuButton, SidebarMenuItem, useSidebar } from "@/components/sidebar";
import { useNavigate } from "react-router-dom";

export const NavUser = () => {
	const { isMobile } = useSidebar();
	const { user, logout } = useAuth();
	const navigate = useNavigate();

	if (user == undefined) return null;
	return (
		<SidebarMenu>
			<SidebarMenuItem>
				<DropdownMenu>
					<DropdownMenuTrigger asChild>
						<SidebarMenuButton
							size="lg"
							className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground group-data-[collapsible=icon]:justify-center"
						>
							<Avatar className="h-8 w-8 rounded-lg">
								<AvatarImage src={user?.img} alt={user?.name || "Avatar"} />
								<AvatarFallback className="rounded-lg">
									{user?.name?.substring(0, 2).toUpperCase() || "CN"}
								</AvatarFallback>
							</Avatar>
							<div className="grid flex-1 text-left text-sm leading-tight group-data-[collapsible=icon]:hidden">
								<span className="truncate font-medium">{user?.name}</span>
								<span className="truncate text-xs">{user?.email}</span>
							</div>
							<ChevronsUpDown className="ml-auto size-4 group-data-[collapsible=icon]:hidden" />
						</SidebarMenuButton>
					</DropdownMenuTrigger>
					<DropdownMenuContent
						className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
						side={isMobile ? "bottom" : "right"}
						align="end"
						sideOffset={4}
					>
						<DropdownMenuLabel className="p-0 font-normal">
							<div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
								<Avatar className="h-8 w-8 rounded-lg">
									<AvatarImage src={user?.img} alt={user?.name || "Avatar"} />
									<AvatarFallback className="rounded-lg">
										{user.name?.substring(0, 2).toUpperCase() || "CN"}
									</AvatarFallback>
								</Avatar>
								<div className="grid flex-1 text-left text-sm leading-tight">
									<span className="truncate font-medium">{user.name}</span>
									<span className="truncate text-xs">{user.email}</span>
								</div>
							</div>
						</DropdownMenuLabel>
						<DropdownMenuSeparator />

						<DropdownMenuItem
							className="flex gap-2"
							onClick={() => navigate(Rotas.protegidas.dashboards.configuracoes)}
						>
							<Settings size={16} />
							Configurações
						</DropdownMenuItem>

						<DropdownMenuSeparator />

						<DropdownMenuItem className="flex gap-2" onClick={() => logout()}>
							<LogOut size={16} />
							Sair
						</DropdownMenuItem>
					</DropdownMenuContent>
				</DropdownMenu>
			</SidebarMenuItem>
		</SidebarMenu>
	);
}
