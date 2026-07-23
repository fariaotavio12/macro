import { ActivityTable } from "@/features/dashboard/components/activity-table";
import { DashboardChart } from "@/features/dashboard/components/dashboard-chart";
import { MetricCard } from "@/features/dashboard/components/metric-card";
import { QuickActions } from "@/features/dashboard/components/quick-actions";
import { Badge } from "@/components/badge";
import { Typography } from "@/components/typography";
import { Activity, Component, Route, ShieldCheck } from "lucide-react";

const metrics = [
	{
		title: "Rotas prontas",
		value: "12",
		description: "Publicas, autenticadas e utilitarias.",
		icon: Route,
		trend: "+4",
	},
	{
		title: "Componentes",
		value: "40+",
		description: "Primitivos e modulos reutilizaveis.",
		icon: Component,
		trend: "base",
	},
	{
		title: "Fluxo auth",
		value: "Demo",
		description: "Login local para testar o painel.",
		icon: ShieldCheck,
		trend: "ativo",
	},
	{
		title: "Eventos",
		value: "98%",
		description: "Dados estaticos para visualizacao.",
		icon: Activity,
		trend: "+12%",
	},
];

export const PageDashboard = () => {
	return (
		<div className="flex w-full flex-col gap-6 p-4 md:p-6">
			<div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
				<div className="flex max-w-3xl flex-col gap-3">
					<Badge className="w-fit" variant="secondary">
						Template SaaS
					</Badge>
					<div className="flex flex-col gap-2">
						<Typography variant="display-md">Dashboard</Typography>
						<Typography variant="body-md" className="text-muted-foreground">
							Area protegida demonstrativa com sidebar, metricas, grafico e tabela para acelerar novos produtos.
						</Typography>
					</div>
				</div>
			</div>

			<section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
				{metrics.map((metric) => (
					<MetricCard key={metric.title} {...metric} />
				))}
			</section>

			<section className="grid gap-4 lg:grid-cols-3">
				<DashboardChart />
				<QuickActions />
			</section>

			<ActivityTable />
		</div>
	);
};
