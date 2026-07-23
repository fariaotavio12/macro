import { appBrand } from "@/app/config/branding";
import { useGetUserMe, useLogoutUser } from "@/features/public/auth/api";
import type { authDtoResponse } from "@/features/public/auth/api";
import type { UserDtoResponse } from "@/features/public/auth/api";
import { useNotificationWatcher } from "@/app/hooks/useNotificationWatcher";
import { tokenStorage } from "@/app/utils/tokenStorage";
import {
	createContext,
	type Dispatch,
	type ReactNode,
	type SetStateAction,
	useContext,
	useEffect,
	useMemo,
	useState,
} from "react";

const DEMO_TOKEN = "template-demo-token";

const createDemoUser = (email = appBrand.demoEmail): UserDtoResponse => ({
	userId: "demo-user",
	name: email.split("@")[0] || "Usuario Demo",
	email,
	role: "ADMIN",
	companyId: "template-company",
	isActive: true,
	createdAt: new Date().toISOString(),
	updatedAt: new Date().toISOString(),
});

type AuthContextProps = {
	user?: UserDtoResponse;
	setUser: Dispatch<SetStateAction<UserDtoResponse | undefined>>;
	login: (userCredentials: authDtoResponse) => Promise<void>;
	logout: () => void;
	refetchUser: () => Promise<void>;
	isAdmin: boolean;
	isLoading: boolean;
	isInitializing: boolean;
};

const AuthContext = createContext<AuthContextProps | null>(null);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
	const { refetch: getUserMe, isLoading: isGettingLoggedUser } = useGetUserMe({
		enabled: false,
	});
	const [user, setUser] = useState<UserDtoResponse | undefined>(undefined);
	const [isInitializing, setIsInitializing] = useState(true);
	const { mutateAsync: logoutApi } = useLogoutUser();
	const isLoading = useMemo(() => isGettingLoggedUser, [isGettingLoggedUser]);
	const isAdmin = user?.role === "ADMIN";

	useNotificationWatcher(!!user);

	const loadUserData = async () => {
		try {
			const token = await tokenStorage.get();

			if (token === DEMO_TOKEN) {
				setUser(createDemoUser());
				return;
			}

			const { data: userData } = await getUserMe();

			if (!userData) {
				setUser(undefined);
				return;
			}
			setUser(userData);
		} catch {
			setUser(undefined);
		} finally {
			setIsInitializing(false);
		}
	};

	const login = async (userCredentials: authDtoResponse) => {
		await tokenStorage.save(DEMO_TOKEN);
		setUser(createDemoUser(userCredentials.email));
		setIsInitializing(false);
	};

	const logout = () => {
		setUser(undefined);
		tokenStorage.clear();
		logoutApi();
	};

	useEffect(() => {
		const url = new URL(window.location.href);
		const token = url.searchParams.get("token");
		if (token) {
			tokenStorage.save(token);
			url.searchParams.delete("token");
			window.history.replaceState({}, "", url);
		}
		// eslint-disable-next-line react-hooks/set-state-in-effect
		loadUserData();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	return (
		<AuthContext.Provider
			value={{
				user,
				setUser,
				login,
				logout,
				refetchUser: loadUserData,
				isAdmin,
				isLoading,
				isInitializing,
			}}
		>
			{children}
		</AuthContext.Provider>
	);
};

export const useAuth = () => {
	const context = useContext(AuthContext);
	if (!context) throw new Error("useAuth deve ser usado dentro de um AuthProvider");
	return context;
};
