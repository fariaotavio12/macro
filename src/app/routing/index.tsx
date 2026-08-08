import { Rotas } from "@/app/routing/variables";
import { PageCaptures } from "@/features/captures/page-captures";
import { LayoutMacroApp } from "@/features/macros/layout";
import { PageLibrary } from "@/features/macros/page-library";
import { Route, Routes } from "react-router-dom";

export const AppRouter = () => (
	<Routes>
		<Route element={<LayoutMacroApp />}>
			<Route path={Rotas.macros.library} element={<PageLibrary />} />
			<Route path={Rotas.macros.captures} element={<PageCaptures />} />
		</Route>
	</Routes>
);
