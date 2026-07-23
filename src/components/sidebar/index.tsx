"use client";

import * as React from "react";

import { AppBrandIcon, appBrand } from "@/app/config/branding";
import { useAuth } from "@/app/providers/authProvider";
import { ModeSwitcher } from "@/components/sidebar/themeMode";
import { getSidebarGroups } from "@/components/sidebar/variables";
import { NavMain } from "@/components/sidebar/navMain";
import { NavUser } from "@/components/sidebar/navUser";
import {
	Sidebar,
	SidebarContent,
	SidebarFooter,
	SidebarGroup,
	SidebarGroupLabel,
	SidebarHeader,
	SidebarRail,
} from "./sidebar";

export * from "./sidebar";

export const AppSidebar = ({ ...props }: React.ComponentProps<typeof Sidebar>) => {
	const { isAdmin } = useAuth();
	const sidebarGroups = getSidebarGroups(isAdmin);

	return (
		<Sidebar collapsible="icon" {...props}>
			<SidebarHeader className="flex flex-row items-center gap-3 group-data-[collapsible=icon]:items-center group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:p-1.5">
				<div className="bg-sidebar-primary text-sidebar-primary-foreground flex aspect-square size-9 items-center justify-center rounded-lg">
					<AppBrandIcon className="h-5 w-5" />
				</div>
				<span className="truncate text-left text-sm leading-tight font-semibold group-data-[collapsible=icon]:hidden">
					{appBrand.name}
				</span>
			</SidebarHeader>

			<SidebarContent>
				{sidebarGroups.map((group) => (
					<NavMain key={group.groupLabel} items={group.items} groupLabel={group.groupLabel} />
				))}

				<SidebarGroup>
					<SidebarGroupLabel>Extras</SidebarGroupLabel>
					<ModeSwitcher />
				</SidebarGroup>
			</SidebarContent>
			<SidebarFooter className="group-data-[collapsible=icon]:items-center group-data-[collapsible=icon]:p-1.5 [@media(max-height:800px)]:gap-0 [@media(max-height:800px)]:py-0 [@media(max-height:800px)]:pb-1">
				<NavUser />
			</SidebarFooter>
			<SidebarRail />
		</Sidebar>
	);
};
