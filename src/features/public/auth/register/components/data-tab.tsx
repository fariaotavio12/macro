import { appBrand } from "@/app/config/branding";
import { Button } from "@/components/button";
import { Input } from "@/components/input";
import { Progress } from "@/components/progress-bar";
import { Textarea } from "@/components/textarea";
import type { RegisterFormValues } from "@/features/public/auth/register/schema";
import { ChevronLeft, LoaderCircle } from "lucide-react";
import type { FieldErrors, UseFormRegister } from "react-hook-form";

type Props = {
	onBack: () => void;
	onContinue: () => void;
	register: UseFormRegister<RegisterFormValues>;
	errors: FieldErrors<RegisterFormValues>;
	isSubmitting?: boolean;
};

export const DataTab = ({ onBack, onContinue, register, errors, isSubmitting = false }: Props) => {
	return (
		<>
			<div className="flex w-full flex-row items-center gap-4">
				<Progress value={66} />
				<span className="text-muted-foreground text-sm">2/3</span>
			</div>

			<div className="flex w-full flex-col items-center gap-6">
				<div className="flex w-full flex-col gap-3">
					<p className="text-2xl font-semibold tracking-tight">Dados da empresa</p>
					<p className="text-muted-foreground text-sm">
						Informe os dados da sua empresa para personalizar a plataforma.
					</p>
				</div>
			</div>

			<Input
				label="Seu nome"
				placeholder="Ex.: João da Silva"
				error={errors?.name?.message as string | undefined}
				{...register("name")}
			/>

			<Input
				label="Razão Social / Nome Completo"
				placeholder={`Ex.: ${appBrand.companyPlaceholder}`}
				error={errors?.companyName?.message as string | undefined}
				{...register("companyName")}
			/>

			<div className="flex w-full flex-row gap-3">
				<Input
					wrapperClassName="w-full"
					label="CNPJ / CPF"
					placeholder="Ex.: 12.345.678/0001-90"
					error={errors?.document?.message as string | undefined}
					{...register("document")}
				/>

				<Input
					wrapperClassName="w-full"
					label="Telefone comercial"
					placeholder="Ex.: (34) 99870-9248"
					error={errors?.phone?.message as string | undefined}
					{...register("phone")}
				/>
			</div>

			<Textarea
				label="Descrição"
				placeholder="Fale um pouco sobre sua empresa e suas necessidades / Importante para Ia"
				error={errors?.description?.message as string | undefined}
				{...register("description")}
			/>

			<div className="flex w-full flex-row gap-3">
				<Button variant="outline" type="button" onClick={onBack}>
					<ChevronLeft size={12} />
				</Button>

				<Button className="w-full" type="button" onClick={onContinue} disabled={isSubmitting}>
					{isSubmitting && <LoaderCircle className="animate-spin" />}
					Continuar
				</Button>
			</div>

			{/* <div className="flex w-full flex-row items-center gap-3">
				<Separator />
				or
				<Separator />
			</div> */}

			{/* <CustomLink
				to={Rotas.desprotegidas.auth.login}
				className="text-muted-foreground font-medium"
				variant="link"
				size="link"
			>
				Ja possui uma conta ? <p className="font-semibold text-text">Fazer login</p>
			</CustomLink> */}
		</>
	);
}
