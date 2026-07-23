import { Rotas } from "@/app/routing/variables";
import {
	BarChart3,
	Blocks,
	ClipboardList,
	LayoutDashboard,
	LineChart,
	Palette,
	Settings,
	Shield,
	Users,
	type LucideIcon,
} from "lucide-react";

export type SidebarNavSubItem = {
	title: string;
	url: string;
};

export type SidebarNavItem = {
	title: string;
	url: string;
	icon?: LucideIcon;
	isActive?: boolean;
	items?: SidebarNavSubItem[];
	disabled?: boolean;
	isLoading?: boolean;
	showInMobileNav?: boolean;
};

export type SidebarNavGroup = {
	groupLabel: string;
	items: SidebarNavItem[];
};

export const sidebarVariable = {
	gestao: [
		{
			title: "Dashboard",
			url: Rotas.protegidas.dashboards.home,
			icon: LayoutDashboard,
			isActive: true,
			showInMobileNav: true,
		},
		{
			title: "Analytics",
			url: Rotas.protegidas.dashboards.overview,
			icon: LineChart,
			showInMobileNav: true,
		},
		{
			title: "Registros",
			url: Rotas.protegidas.dashboards.records,
			icon: ClipboardList,
			showInMobileNav: true,
		},
		{
			title: "Design system",
			url: Rotas.desprotegidas.designSystem,
			icon: Palette,
		},
	],
	cadastros: [
		{
			title: "Clientes",
			url: Rotas.protegidas.dashboards.customers,
			icon: Users,
			showInMobileNav: true,
		},
		{
			title: "Equipe",
			url: Rotas.protegidas.dashboards.team,
			icon: Shield,
		},
		{
			title: "Relatorios",
			url: Rotas.protegidas.dashboards.reports,
			icon: BarChart3,
		},
	],

	configuracoes: [
		{
			title: "Configuracoes",
			url: Rotas.protegidas.dashboards.settings,
			icon: Settings,
		},
	],

	admin: [
		{
			title: "Admin",
			url: Rotas.protegidas.admin.overview,
			icon: Shield,
		},
		{
			title: "Organizacoes",
			url: Rotas.protegidas.admin.organizations,
			icon: Blocks,
		},
		{
			title: "Usuarios",
			url: Rotas.protegidas.admin.users,
			icon: Users,
		},
	],
} satisfies Record<string, SidebarNavItem[]>;

export const getSidebarGroups = (isAdmin: boolean): SidebarNavGroup[] => [
	{ groupLabel: "Gestao", items: sidebarVariable.gestao },
	{ groupLabel: "Cadastros", items: sidebarVariable.cadastros },
	...(isAdmin ? [] : [{ groupLabel: "Configuracoes", items: sidebarVariable.configuracoes }]),
	...(isAdmin ? [{ groupLabel: "Admin", items: sidebarVariable.admin }] : []),
];

export const getMobileSidebarItems = (isAdmin: boolean) =>
	getSidebarGroups(isAdmin).flatMap((group) => group.items.filter((item) => item.showInMobileNav));
