import { IconGoogle } from "@/app/assets/icons";
import { appBrand } from "@/app/config/branding";
import { Rotas } from "@/app/routing/variables";
import { Button } from "@/components/button";
import { Input } from "@/components/input";
import { CustomLink } from "@/components/link";
import { Progress } from "@/components/progress-bar";
import { Separator } from "@/components/separator";
import type { RegisterFormValues } from "@/features/public/auth/register/schema";
import { Eye, EyeClosed, LoaderCircle } from "lucide-react";
import type { FieldErrors, UseFormRegister } from "react-hook-form";

type Props = {
	isPasswordVisible: boolean;
	setIsPasswordVisible: (v: boolean) => void;
	onRegisterGoogle: () => void;
	onContinue: () => void;
	isButtonLoading?: boolean;
	register: UseFormRegister<RegisterFormValues>;
	errors: FieldErrors<RegisterFormValues>;
};

export const StartTab = ({
	isPasswordVisible,
	setIsPasswordVisible,
	onRegisterGoogle,
	isButtonLoading = false,
	onContinue,
	register,
	errors,
}: Props) => {
	return (
		<>
			<div className="flex w-full flex-row items-center gap-4">
				<Progress value={33} />
				<span className="text-muted-foreground text-sm">1/3</span>
			</div>

			<div className="flex w-full flex-col items-center gap-6">
				<div className="flex w-full flex-col gap-3">
					<p className="text-2xl font-semibold tracking-tight">Crie sua conta</p>
					<p className="text-muted-foreground text-sm">
						Inicie sua jornada com o {appBrand.shortName}! Cadastre-se para começar a gerenciar o
						atendimento da sua empresa.
					</p>
				</div>
			</div>

			<Button className="w-full" type="button" variant="outline" onClick={onRegisterGoogle}>
				<IconGoogle size={"md_sm"} />
				Entrar com o Google
			</Button>

			<div className="flex w-full flex-row items-center gap-3">
				<Separator />
				or
				<Separator />
			</div>

			<Input
				label="Email"
				placeholder="Insira seu email"
				id="email"
				error={errors?.email?.message as string | undefined}
				{...register("email")}
			/>

			<Input
				label="Senha"
				placeholder="Insira sua senha"
				id="password"
				error={errors?.password?.message as string | undefined}
				type={isPasswordVisible ? "text" : "password"}
				iconRight={
					<div className="cursor-pointer" onClick={() => setIsPasswordVisible(!isPasswordVisible)}>
						{isPasswordVisible ? <Eye size={16} /> : <EyeClosed size={16} />}
					</div>
				}
				{...register("password")}
			/>

			<Input
				label="Confirmar senha"
				placeholder="Repita sua senha"
				id="confirmPassword"
				error={errors?.confirmPassword?.message as string | undefined}
				type={isPasswordVisible ? "text" : "password"}
				iconRight={
					<div className="cursor-pointer" onClick={() => setIsPasswordVisible(!isPasswordVisible)}>
						{isPasswordVisible ? <Eye size={16} /> : <EyeClosed size={16} />}
					</div>
				}
				{...register("confirmPassword")}
			/>

			<Button
				type="button"
				onClick={onContinue}
				disabled={!!errors.email || !!errors.password || !!errors.confirmPassword || isButtonLoading}
			>
				{isButtonLoading && <LoaderCircle className="animate-spin" />}
				Continuar
			</Button>

			<CustomLink
				to={Rotas.desprotegidas.auth.login}
				className="text-muted-foreground font-medium"
				variant="link"
				size="link"
			>
				Ja possui uma conta ? <p className="text-text font-semibold">Fazer login</p>
			</CustomLink>
		</>
	);
}
