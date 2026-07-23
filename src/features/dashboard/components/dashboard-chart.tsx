import { Card, CardContent, CardHeader } from "@/components/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/chart";
import { Typography } from "@/components/typography";
import { Area, AreaChart, CartesianGrid, XAxis } from "recharts";

const chartData = [
	{ month: "Jan", visitors: 1240, signups: 340 },
	{ month: "Fev", visitors: 1580, signups: 410 },
	{ month: "Mar", visitors: 1420, signups: 390 },
	{ month: "Abr", visitors: 1860, signups: 520 },
	{ month: "Mai", visitors: 2140, signups: 620 },
	{ month: "Jun", visitors: 2380, signups: 710 },
];

const chartConfig = {
	visitors: {
		label: "Visitantes",
		color: "var(--chart-1)",
	},
	signups: {
		label: "Cadastros",
		color: "var(--chart-4)",
	},
} satisfies ChartConfig;

export const DashboardChart = () => {
	return (
		<Card className="lg:col-span-2">
			<CardHeader>
				<Typography variant="title-sm">Crescimento do template</Typography>
				<Typography variant="body-sm" className="text-muted-foreground">
					Dados demonstrativos para validar cards, graficos e estados de painel.
				</Typography>
			</CardHeader>
			<CardContent>
				<ChartContainer config={chartConfig} className="min-h-[280px]">
					<AreaChart data={chartData} margin={{ left: 0, right: 12, top: 12 }}>
						<CartesianGrid vertical={false} />
						<XAxis dataKey="month" tickLine={false} axisLine={false} tickMargin={8} />
						<ChartTooltip cursor={false} content={<ChartTooltipContent indicator="dot" />} />
						<Area
							dataKey="visitors"
							type="natural"
							fill="var(--color-visitors)"
							fillOpacity={0.12}
							stroke="var(--color-visitors)"
							strokeWidth={2}
						/>
						<Area
							dataKey="signups"
							type="natural"
							fill="var(--color-signups)"
							fillOpacity={0.1}
							stroke="var(--color-signups)"
							strokeWidth={2}
						/>
					</AreaChart>
				</ChartContainer>
			</CardContent>
		</Card>
	);
};
