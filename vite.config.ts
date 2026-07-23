import mdx from "@mdx-js/rollup";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import path from "path";
import { defineConfig } from "vite";
import electron from "vite-plugin-electron/simple";
import { esmShim, notBundle } from "vite-plugin-electron/plugin";

import rehypeAutolinkHeadings from "rehype-autolink-headings";
import rehypeSlug from "rehype-slug";
import remarkGfm from "remark-gfm";

// https://vite.dev/config/
export default defineConfig(() => ({
	plugins: [
		{
			...mdx({
				remarkPlugins: [remarkGfm],
				rehypePlugins: [rehypeSlug, [rehypeAutolinkHeadings, { behavior: "wrap" }]],
			}),
			enforce: "pre",
		},
		react({
			include: ["**/*.tsx", "**/*.ts", "**/*.mdx"],
		}),
		tailwindcss(),
		electron({
			main: {
				entry: "electron/main.ts",
				vite: {
					plugins: [notBundle(), esmShim()],
				},
			},
			preload: {
				input: "electron/preload.ts",
			},
		}),
	],
	resolve: {
		alias: {
			"@": path.resolve(__dirname, "./src"),
			"@shared": path.resolve(__dirname, "./shared"),
		},
		dedupe: ["react", "react-dom"],
	},
	optimizeDeps: {
		exclude: ["@mantine/hooks", "@mantine/core", "@mantine/utils"],
	},
	build: {
		cssMinify: "esbuild" as const,
	},
}));
