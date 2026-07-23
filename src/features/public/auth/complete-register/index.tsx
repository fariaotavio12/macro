import { useCompleteRegisterGoogle } from "@/features/public/auth/api";
import { appBrand } from "@/app/config/branding";
import { useAuth } from "@/app/providers/authProvider";
import { affiliateCodeStorage } from "@/app/utils/affiliateCode";
import { Rotas } from "@/app/routing/variables";
import { Button } from "@/components/button";
import { Input } from "@/components/input";
import { Textarea } from "@/components/textarea";
import { zodResolver } from "@hookform/resolvers/zod";
import { Building2, Loader2Icon } from "lucide-react";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import { z } from "zod";

const completeRegisterGoogleSchema = z.object({
	name: z.string().trim().min(1, "Nome é obrigatório"),
	companyName: z.string().trim().min(1, "Nome da empresa é obrigatório"),
	document: z.string().trim().min(1, "CNPJ / CPF é obrigatório"),
	description: z.string().trim().optional(),
});

type CompleteRegisterGoogleFormValues = z.infer<typeof completeRegisterGoogleSchema>;

export const PageCompleteRegister = () => {
	const { user, refetchUser } = useAuth();
	const navigate = useNavigate();

	useEffect(() => {
		if (user?.companyId != null) {
			navigate(Rotas.protegidas.dashboards.home, { replace: true });
		}
	}, [user, navigate]);

	const { mutateAsync: completeRegisterGoogle, isPending } = useCompleteRegisterGoogle();

	const form = useForm<CompleteRegisterGoogleFormValues>({
		resolver: zodResolver(completeRegisterGoogleSchema),
		defaultValues: {
			name: "",
			companyName: "",
			document: "",
		},
	});

	const onSubmit = async (value: CompleteRegisterGoogleFormValues) => {
		await completeRegisterGoogle({
			name: value.name,
			company: {
				name: value.companyName,
				identifier: value.document,
				description: value.description,
			},
			affiliateCode: affiliateCodeStorage.get(),
		}).then(async () => {
			affiliateCodeStorage.clear();
			await refetchUser();
			navigate(Rotas.protegidas.dashboards.home, { replace: true });
		});
	};

	return (
		<form onSubmit={form.handleSubmit(onSubmit)} className="flex h-auto w-full max-w-lg flex-col gap-6 p-6">
			<Input
				label="Seu nome"
				placeholder="Ex.: João da Silva"
				error={form.formState.errors.name?.message}
				{...form.register("name")}
			/>

			<Input
				label="Razão social / Nome completo"
				placeholder={`Ex.: ${appBrand.companyPlaceholder}`}
				error={form.formState.errors.companyName?.message}
				iconLeft={<Building2 size={16} />}
				{...form.register("companyName")}
			/>

			<Input
				label="CNPJ / CPF"
				placeholder="Ex.: 12.345.678/0001-90"
				error={form.formState.errors.document?.message}
				{...form.register("document")}
			/>

			<Textarea
				label="Descrição"
				placeholder="Fale um pouco sobre sua empresa e suas necessidades / Importante para Ia"
				{...form.register("description")}
			/>

			<Button>
				{isPending && <Loader2Icon className="animate-spin" size={16} />}
				Completar Cadastro
			</Button>
			<Button variant={"outline"} onClick={() => navigate(Rotas.desprotegidas.auth.login)}>
				Cancelar
			</Button>
		</form>
	);
};
