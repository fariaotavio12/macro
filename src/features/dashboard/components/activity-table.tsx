import { ResponsiveTableCustom } from "@/components/table/responsiveTableCustom";
import { Typography } from "@/components/typography";
import { Badge } from "@/components/badge";
import type { ColumnDef } from "@tanstack/react-table";

type Activity = {
	id: string;
	event: string;
	description: string;
	owner: string;
	status: "Pronto" | "Em revisao";
	time: string;
};

const activities: Activity[] = [
	{
		id: "routing",
		event: "Nova rota protegida",
		description: "Atualizacao do template base",
		owner: "Routing",
		status: "Pronto",
		time: "2 min",
	},
	{
		id: "auth",
		event: "Login demo ativado",
		description: "Fluxo local sem backend",
		owner: "Auth",
		status: "Pronto",
		time: "8 min",
	},
	{
		id: "dashboard",
		event: "Dashboard base",
		description: "Sidebar, metricas e graficos",
		owner: "UI",
		status: "Em revisao",
		time: "12 min",
	},
	{
		id: "components",
		event: "Componentes compartilhados",
		description: "Padroes do design system",
		owner: "Design system",
		status: "Pronto",
		time: "18 min",
	},
];

const columns: ColumnDef<Activity>[] = [
	{
		accessorKey: "event",
		header: "Evento",
		cell: ({ row }) => (
			<div className="flex min-w-0 flex-col gap-0.5 md:min-w-52">
				<Typography variant="body-sm" className="font-medium">
					{row.original.event}
				</Typography>
				<Typography variant="caption" className="text-muted-foreground">
					{row.original.description}
				</Typography>
			</div>
		),
		meta: {
			mobileHeader: true,
			mobileOrder: 1,
		},
	},
	{
		accessorKey: "owner",
		header: "Area",
		cell: ({ row }) => (
			<Typography variant="body-sm" className="text-muted-foreground">
				{row.original.owner}
			</Typography>
		),
		meta: {
			mobileLabel: "Area",
			mobileOrder: 2,
		},
	},
	{
		accessorKey: "status",
		header: "Status",
		cell: ({ row }) => (
			<Badge variant={row.original.status === "Pronto" ? "success" : "outline"}>{row.original.status}</Badge>
		),
		meta: {
			mobileStatus: true,
			mobileOrder: 3,
		},
	},
	{
		accessorKey: "time",
		header: "Atualizado",
		cell: ({ row }) => (
			<Typography variant="body-sm" className="text-muted-foreground md:text-right">
				{row.original.time}
			</Typography>
		),
		meta: {
			mobileLabel: "Atualizado",
			mobileOrder: 4,
		},
	},
];

const pagination = {
	page: 0,
	size: 10,
	totalElements: activities.length,
	totalPages: 1,
};

export const ActivityTable = () => {
	return (
		<section className="flex flex-col gap-3">
			<div className="flex flex-col gap-1">
				<Typography variant="title-sm">Atividade recente</Typography>
				<Typography variant="body-sm" className="text-muted-foreground">
					Exemplo usando o componente responsivo padrao de tabela do template.
				</Typography>
			</div>
			<ResponsiveTableCustom
				columns={columns}
				data={activities}
				pagination={pagination}
				onPageChange={() => undefined}
				onSizeChange={() => undefined}
			/>
		</section>
	);
};
