import { AppBrandIcon, appBrand } from "@/app/config/branding";
import { useAuth } from "@/app/providers/authProvider";
import { Rotas } from "@/app/routing/variables";
import { Button } from "@/components/button";
import { CustomLink } from "@/components/link";
import { Sheet, SheetClose, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/sheet";
import { Typography } from "@/components/typography";
import { MenuIcon } from "lucide-react";
import { useEffect, useState } from "react";

const navItems = [
	{ label: "Features", to: `${Rotas.desprotegidas.landingPages.home}#features` },
	{ label: "Included", to: `${Rotas.desprotegidas.landingPages.home}#included` },
	{ label: "Stack", to: `${Rotas.desprotegidas.landingPages.home}#stack` },
	{ label: "Design system", to: Rotas.desprotegidas.designSystem },
];

export const NavBarLanding = () => {
	const [scrolled, setScrolled] = useState(false);
	const { user } = useAuth();

	useEffect(() => {
		const onScroll = () => setScrolled(window.scrollY > 0);
		window.addEventListener("scroll", onScroll, { passive: true });
		onScroll();
		return () => window.removeEventListener("scroll", onScroll);
	}, []);

	return (
		<nav
			className={`sticky top-0 z-50 h-16 w-full items-center transition-colors ${
				scrolled ? "bg-background/95 border-b backdrop-blur-md" : "bg-background"
			}`}
		>
			<section className="mx-auto grid h-full w-full max-w-7xl grid-cols-[1fr_1fr] items-center px-5 md:px-10 lg:grid-cols-[1fr_auto_1fr] lg:px-20">
				<CustomLink
					className="text-foreground flex w-fit items-center gap-3"
					to={Rotas.desprotegidas.landingPages.home}
					variant="link"
					size="link"
				>
					<div className="bg-foreground text-background flex size-9 items-center justify-center rounded-full">
						<AppBrandIcon className="size-5" />
					</div>
					<Typography variant="caption" as="span" className="text-foreground hidden sm:inline">
						{appBrand.name}
					</Typography>
				</CustomLink>

				<div className="hidden items-center gap-1 justify-self-center lg:flex">
					{navItems.map((item) => (
						<CustomLink key={item.to} to={item.to} variant="ghost" className="h-9 px-4">
							<Typography variant="nav-link" as="span">
								{item.label}
							</Typography>
						</CustomLink>
					))}
				</div>

				<div className="flex flex-row items-center gap-3 justify-self-end">
					{user ? (
						<CustomLink to={Rotas.protegidas.dashboards.home} variant="outline">
							Dashboard
						</CustomLink>
					) : (
						<>
							<CustomLink className="hidden h-9 px-4 lg:flex" to={Rotas.desprotegidas.auth.login} variant="ghost">
								Login
							</CustomLink>

							<CustomLink to={Rotas.desprotegidas.auth.login}>Acessar demo</CustomLink>
						</>
					)}

					<Sheet>
						<SheetTrigger asChild>
							<Button className="flex lg:hidden" variant="ghost" size="icon" aria-label="Abrir menu">
								<MenuIcon />
							</Button>
						</SheetTrigger>

						<SheetContent side="right" className="flex h-screen w-80 flex-col p-6 sm:w-[320px]">
							<SheetHeader>
								<SheetTitle asChild>
									<Typography variant="title-lg">Menu</Typography>
								</SheetTitle>
							</SheetHeader>

							<div className="mt-8 flex h-full flex-col justify-between gap-6">
								<div className="flex flex-col gap-3">
									{navItems.map((item) => (
										<SheetClose key={item.to} asChild>
											<CustomLink
												to={item.to}
												variant="link"
												size="link"
												className="text-foreground hover:text-primary"
											>
												<Typography variant="body-md" as="span">
													{item.label}
												</Typography>
											</CustomLink>
										</SheetClose>
									))}
								</div>

								<div className="flex flex-col gap-3">
									<SheetClose asChild>
										<CustomLink to={Rotas.desprotegidas.auth.login} variant="outline" className="w-full justify-center">
											Login
										</CustomLink>
									</SheetClose>

									<SheetClose asChild>
										<CustomLink className="w-full justify-center" to={Rotas.desprotegidas.auth.login}>
											Acessar demo
										</CustomLink>
									</SheetClose>
								</div>
							</div>
						</SheetContent>
					</Sheet>
				</div>
			</section>
		</nav>
	);
};
