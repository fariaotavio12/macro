import { Rotas } from "@/app/routing/variables";

export const breadcrumbMap: Record<string, string> = {
	[Rotas.protegidas.dashboards.home]: "",
	[Rotas.protegidas.dashboards.overview]: "Visão geral",
	[Rotas.protegidas.dashboards.records]: "Registros",
	[Rotas.protegidas.dashboards.customers]: "Clientes",
	[Rotas.protegidas.dashboards.team]: "Equipe",
	[Rotas.protegidas.dashboards.reports]: "Relatórios",
	[Rotas.protegidas.dashboards.settings]: "Configurações",
	[Rotas.protegidas.dashboards.assinatura]: "Assinatura",
	[Rotas.protegidas.dashboards.configuracoes]: "Configurações",
	[Rotas.protegidas.admin.overview]: "Admin",
	[Rotas.protegidas.admin.organizations]: "Organizações",
	[Rotas.protegidas.admin.users]: "Usuários",
};
