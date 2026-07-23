import { useAuth } from "@/app/providers/authProvider";
import { Rotas } from "@/app/routing/variables";
import { Loader2Icon } from "lucide-react";
import { Navigate, Outlet, useLocation } from "react-router-dom";

export const MiddlewareAuth = () => {
	const { isInitializing, user } = useAuth();
	const location = useLocation();
	// const navigate = useNavigate();

	if (isInitializing) {
		return (
			<div className="flex h-screen w-full items-center justify-center">
				<Loader2Icon className="animate-spin" />
			</div>
		);
	}

	// if (!user) {
	// 	if (location.pathname !== Rotas.desprotegidas.auth.login) {
	// 		return <Navigate to={Rotas.desprotegidas.auth.login} replace />;
	// 	}
	// 	return <Outlet />;
	// }

	if (user) {
		if (user?.companyId == null) {
			if (location.pathname !== Rotas.desprotegidas.auth.completeRegister) {
				return <Navigate to={Rotas.desprotegidas.auth.completeRegister} replace />;
			}
		} else {
			return <Navigate to={Rotas.protegidas.dashboards.home} replace />;
		}
	}

	// if (user?.companyId == null) {
	// 	if (location.pathname !== Rotas.desprotegidas.auth.completeRegister) {
	// 		return <Navigate to={Rotas.desprotegidas.auth.completeRegister} replace />;
	// 	}

	//
	// }

	return <Outlet />;
};
