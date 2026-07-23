import { Rotas } from "@/app/routing/variables";
import { LayoutMacroApp } from "@/features/macros/layout";
import { PageLibrary } from "@/features/macros/page-library";
import { Route, Routes } from "react-router-dom";

export const AppRouter = () => (
	<Routes>
		<Route element={<LayoutMacroApp />}>
			<Route path={Rotas.macros.library} element={<PageLibrary />} />
		</Route>
	</Routes>
);
