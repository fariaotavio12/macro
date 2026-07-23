export const Rotas = {
	macros: {
		library: "/",
	},
	desprotegidas: {
		auth: {
			login: "/login",
			passwordRecovery: "/recuperar-senha",
			register: "/registrar",
			completeRegister: "/completar-cadastro",
		},
		landingPages: {
			home: "/",
			prices: "/precos",
			download: "/download",
			privacyPolicy: "/politica-de-privacidade",
			knowledgeBase: {
				helpCenter: "/help-center/introducao",
				slug: "/help-center/:slug",
				faq: "/help-center/faq",
			},
		},
		subscription: {
			success: "/subscription/success",
			cancel: "/subscription/cancel",
		},
		designSystem: "/design-system",
		NOT_FOUND: "*",
	},
	protegidas: {
		dashboards: {
			home: "/dashboard",
			overview: "/dashboard/overview",
			reports: "/dashboard/reports",
			records: "/dashboard/records",
			customers: "/dashboard/customers",
			team: "/dashboard/team",
			settings: "/dashboard/settings",
			configuracoes: "/dashboard/configuracoes",
			assinatura: "/dashboard/assinatura",
		},
		admin: {
			overview: "/admin/overview",
			organizations: "/admin/organizations",
			users: "/admin/users",
		},
	},
};
