import { IconfavIcon } from "@/app/assets/icons";
import type { ComponentProps, ComponentType } from "react";

type BrandIconProps = ComponentProps<typeof IconfavIcon>;

type BrandConfig = {
	name: string;
	shortName: string;
	description: string;
	siteUrl: string;
	ogImage: string;
	defaultKeywords: string[];
	demoEmail: string;
	companyPlaceholder: string;
	footerDescription: string;
	favicon: {
		ico: string;
		png: string;
		svg: string;
		apple: string;
		manifest: string;
	};
	Icon: ComponentType<BrandIconProps>;
};

export const brandVariants = {
	template: {
		name: "React Vite Template",
		shortName: "Template",
		description:
			"Template React com Vite, TypeScript, Tailwind, React Router e arquitetura por features para acelerar novos produtos web.",
		siteUrl: "https://example.com",
		ogImage: "https://example.com/assets/og-image.jpg",
		defaultKeywords: ["react", "vite", "typescript", "tailwind", "dashboard template"],
		demoEmail: "usuario@template.dev",
		companyPlaceholder: "App Template Tecnologia Ltda.",
		footerDescription: "Base neutra para produtos web.",
		favicon: {
			ico: "/favicon.ico",
			png: "/favicon-96x96.png",
			svg: "/favicon.svg",
			apple: "/apple-touch-icon.png",
			manifest: "/site.webmanifest",
		},
		Icon: IconfavIcon,
	},
} satisfies Record<string, BrandConfig>;

export type BrandKey = keyof typeof brandVariants;

export const activeBrandKey: BrandKey = "template";
export const appBrand = brandVariants[activeBrandKey];
export const AppBrandIcon = appBrand.Icon;
