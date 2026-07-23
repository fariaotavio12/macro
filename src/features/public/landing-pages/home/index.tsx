import { dashboardLightFallback } from "@/app/assets/fallbacks";
import { appBrand } from "@/app/config/branding";
import { Rotas } from "@/app/routing/variables";
import { Badge } from "@/components";
import { CustomLink } from "@/components/link";
import { Typography } from "@/components/typography";
import { ArrowRight, Blocks, Code2, DatabaseZap, GitBranch, LayoutDashboard, Route, ShieldCheck } from "lucide-react";

const highlights = [
	{
		icon: GitBranch,
		label: "Architecture",
		title: "Arquitetura por features",
		description: "Paginas, APIs, hooks, tipos e validacoes ficam perto do dominio que atendem.",
	},
	{
		icon: Blocks,
		label: "System",
		title: "Componentes prontos",
		description: "Design system com botoes, tabelas, formularios, overlays, feedbacks e estados.",
	},
	{
		icon: ShieldCheck,
		label: "Access",
		title: "Auth demonstrativo",
		description: "Login local para acessar uma area protegida sem depender de backend no primeiro teste.",
	},
];

const included = [
	{
		icon: LayoutDashboard,
		label: "Dashboard",
		title: "Shell operacional",
		description: "Sidebar, metricas, grafico e tabela para validar o produto interno.",
	},
	{
		icon: Route,
		label: "Routing",
		title: "Rotas centralizadas",
		description: "Rotas publicas e protegidas ficam no app routing com constantes reutilizaveis.",
	},
	{
		icon: DatabaseZap,
		label: "Data",
		title: "API layer",
		description: "Servicos e hooks preparados para viver dentro de cada feature.",
	},
	{
		icon: Code2,
		label: "Standards",
		title: "Padroes do projeto",
		description: "Imports absolutos, Typography, tokens semanticos e componentes compartilhados.",
	},
];

const stackItems = [
	"React 19",
	"Vite",
	"TypeScript",
	"Tailwind v4",
	"React Router",
	"TanStack Query",
	"Axios",
	"Radix UI",
];

export const HomePage = () => {
	return (
		<div className="flex w-full flex-col">
			<section className="w-full border-b">
				<div className="mx-auto flex min-h-[calc(100vh-3.75rem)] w-full max-w-7xl flex-col justify-between gap-12 px-5 py-16 md:px-10 lg:px-20 lg:py-24">
					<div className="grid gap-10 lg:grid-cols-[0.95fr_1.05fr] lg:items-end">
						<div className="flex max-w-4xl flex-col gap-8">
							<Typography variant="caption" className="text-primary">
								{appBrand.name} / React application template
							</Typography>
							<Typography variant="display-xl" className="text-foreground max-w-4xl">
								Um starter limpo para produtos React.
							</Typography>
						</div>

						<div className="flex flex-col gap-8 lg:pb-2">
							<Typography variant="body-md" className="text-muted-foreground max-w-xl">
								Base com landing, login demo, dashboard protegido, componentes reutilizaveis e arquitetura vertical para
								comecar um SaaS sem carregar decisoes de dominio.
							</Typography>
							<div className="flex flex-col gap-3 sm:flex-row">
								<CustomLink to={Rotas.desprotegidas.auth.login}>
									Acessar demo
									<ArrowRight className="size-4" />
								</CustomLink>
								<CustomLink to={Rotas.desprotegidas.designSystem} variant="outline">
									Ver design system
								</CustomLink>
							</div>
						</div>
					</div>

					<div className="bg-card overflow-hidden rounded-lg border">
						<div className="bg-muted grid border-b px-5 py-4 md:grid-cols-[1fr_auto] md:items-center">
							<Typography variant="caption" className="text-muted-foreground">
								Product preview
							</Typography>
							<Typography variant="caption" className="text-primary">
								Landing completa / Login sem backend / Dashboard pronto
							</Typography>
						</div>
						<img src={dashboardLightFallback} alt={`Preview do dashboard do ${appBrand.name}`} className="w-full" />
					</div>
				</div>
			</section>

			<section id="features" className="w-full border-b">
				<div className="mx-auto grid w-full max-w-7xl gap-12 px-5 py-16 md:px-10 lg:grid-cols-[0.8fr_1.2fr] lg:px-20 lg:py-24">
					<div className="flex max-w-xl flex-col gap-5">
						<Typography variant="caption" className="text-primary">
							Features
						</Typography>
						<Typography variant="display-md">O essencial para sair do zero.</Typography>
						<Typography variant="body-md" className="text-muted-foreground">
							Um conjunto pequeno de decisoes bem encaixadas para manter o produto rapido, organizado e facil de
							evoluir.
						</Typography>
					</div>

					<div className="grid gap-0 border-t">
						{highlights.map(({ icon: Icon, label, title, description }) => (
							<article key={title} className="grid gap-4 border-b py-6 sm:grid-cols-[9rem_1fr] sm:gap-8">
								<Typography variant="caption" className="text-primary">
									{label}
								</Typography>
								<div className="grid gap-4 sm:grid-cols-[1fr_auto]">
									<div className="flex flex-col gap-2">
										<Typography variant="title-lg">{title}</Typography>
										<Typography variant="body-md" className="text-muted-foreground max-w-xl">
											{description}
										</Typography>
									</div>
									<div className="bg-muted text-primary flex size-11 items-center justify-center rounded-full border">
										<Icon className="size-5" />
									</div>
								</div>
							</article>
						))}
					</div>
				</div>
			</section>

			<section id="included" className="bg-muted w-full border-b">
				<div className="mx-auto flex w-full max-w-7xl flex-col gap-12 px-5 py-16 md:px-10 lg:px-20 lg:py-24">
					<div className="grid gap-6 lg:grid-cols-[1fr_1fr] lg:items-end">
						<div className="flex flex-col gap-5">
							<Typography variant="caption" className="text-primary">
								Included
							</Typography>
							<Typography variant="display-md">Uma primeira experiencia completa.</Typography>
						</div>
						<Typography variant="body-md" className="text-muted-foreground max-w-xl lg:justify-self-end">
							O template mostra o caminho feliz de um app real: visitante chega na landing, faz login demo e entra no
							painel protegido com navegacao lateral.
						</Typography>
					</div>

					<div className="grid border-t md:grid-cols-2">
						{included.map(({ icon: Icon, label, title, description }) => (
							<article
								key={title}
								className="flex min-h-52 flex-col justify-between gap-8 border-b p-6 md:border-r md:even:border-r-0"
							>
								<div className="flex items-center justify-between gap-4">
									<Typography variant="caption" className="text-primary">
										{label}
									</Typography>
									<Icon className="text-muted-foreground size-5" />
								</div>
								<div className="flex flex-col gap-2">
									<Typography variant="title-lg">{title}</Typography>
									<Typography variant="body-md" className="text-muted-foreground">
										{description}
									</Typography>
								</div>
							</article>
						))}
					</div>
				</div>
			</section>

			<section id="stack" className="w-full">
				<div className="mx-auto grid w-full max-w-7xl gap-10 px-5 py-16 md:px-10 lg:grid-cols-[0.75fr_1.25fr] lg:px-20 lg:py-24">
					<div className="flex flex-col gap-5">
						<Typography variant="caption" className="text-primary">
							Stack
						</Typography>
						<Typography variant="display-md">Tecnologias modernas, sem excesso.</Typography>
					</div>
					<div className="flex flex-col gap-8">
						<div className="flex flex-wrap gap-2">
							{stackItems.map((item) => (
								<Badge key={item} variant="secondary">
									{item}
								</Badge>
							))}
						</div>
						<CustomLink to={Rotas.desprotegidas.auth.login} variant="outline" className="w-fit">
							Testar dashboard
							<ArrowRight className="size-4" />
						</CustomLink>
					</div>
				</div>
			</section>
		</div>
	);
};
