// import { LoadingSpinner } from "@/components/elements/loading/loadingSpinner";
import { useAuth } from "@/app/providers/authProvider";
import { Rotas } from "@/app/routing/variables";
import { Loader2Icon } from "lucide-react";
import { Navigate, Outlet } from "react-router-dom";
// import { useAuth } from "../providers/authProvider";

export const Middleware = () => {
	const { user, isInitializing } = useAuth();

	if (isInitializing) {
		return (
			<div className="flex h-screen w-full items-center justify-center">
				<Loader2Icon className="animate-spin" />
			</div>
		);
	}

	if (!user) {
		return <Navigate to={Rotas.desprotegidas.auth.login} replace />;
	}

	if (user.companyId == null) {
		return <Navigate to={Rotas.desprotegidas.auth.completeRegister} replace />;
	}

	return <Outlet />;
};
