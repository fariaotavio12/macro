import { useRegisterUser, useSendEmailVerificationCode } from "@/features/public/auth/api";
import { affiliateCodeStorage } from "@/app/utils/affiliateCode";
import { Rotas } from "@/app/routing/variables";
import { Tabs, TabsContent, TabsContents } from "@/components/tabs";
import { CodeTab } from "@/features/public/auth/register/components/code-tab";
import { DataTab } from "@/features/public/auth/register/components/data-tab";
import { StartTab } from "@/features/public/auth/register/components/start-tab";
import { registerSchema, type RegisterFormValues } from "@/features/public/auth/register/schema";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useState } from "react";
import { FormProvider, useForm, useWatch } from "react-hook-form";
import { useNavigate, useSearchParams } from "react-router-dom";
import { apiUrl } from "@/app/api/clients";

type TabKey = "inicio" | "dados" | "message";

export const PageRegister = () => {
	const [valueTab, setValueTab] = useState<TabKey>("inicio");
	const [isPasswordVisible, setIsPasswordVisible] = useState(false);
	const navigate = useNavigate();
	const [searchParams] = useSearchParams();

	useEffect(() => {
		const ref = searchParams.get("ref");
		if (ref) affiliateCodeStorage.save(ref);
	}, [searchParams]);
	const { mutateAsync: sendVerificationCode, isPending: isSendingVerificationCode } = useSendEmailVerificationCode();
	const { mutateAsync: registerUser, isPending: isRegistering } = useRegisterUser();
	const methods = useForm<RegisterFormValues>({
		mode: "onTouched",
		resolver: zodResolver(registerSchema),
		defaultValues: {
			name: "",
			email: "",
			password: "",
			confirmPassword: "",
			companyName: "",
			document: "",
			phone: "",
			verificationCode: "",
		},
	});

	const {
		register,
		handleSubmit,
		formState: { errors },
		trigger,
	} = methods;

	const email = useWatch({ control: methods.control, name: "email" });
	const verificationCode = useWatch({
		control: methods.control,
		name: "verificationCode",
	});

	const onRegisterGoogle = async () => {
		const baseUrl = `${apiUrl}/auth/google/login?registrationId=google`;
		window.location.href = baseUrl;
	};

	const goToDados = async () => {
		const ok = await trigger(["email", "password", "confirmPassword"]);
		if (!ok) return;

		setValueTab("dados");
	}

	const goToMessage = async () => {
		const ok = await trigger(["name", "document", "phone", "companyName", "description"]);
		if (!ok) return;
		await sendVerificationCode(methods.getValues("email")).then(() => {
			setValueTab("message");
		});
	};

	const submitVerificationCode = async () => {
		const ok = await trigger("verificationCode");
		if (!ok) return;

		await handleSubmit(onSubmit)();
	};

	const onSubmit = async (data: RegisterFormValues) => {
		await registerUser({
			name: data.name,
			email: data.email,
			password: data.password,
			verificationCode: data.verificationCode,
			company: {
				name: data.companyName,
				identifier: data.document,
				description: data.description,
			},
			affiliateCode: affiliateCodeStorage.get(),
		}).then(() => {
			affiliateCodeStorage.clear();
			navigate(Rotas.protegidas.dashboards.home, { replace: true });
		});
	};

	return (
		<FormProvider {...methods}>
			<form onSubmit={handleSubmit(onSubmit)} className="flex h-auto w-full max-w-lg flex-col gap-6 p-6">
				<Tabs value={valueTab}>
					<TabsContents>
						<TabsContent className="flex w-full flex-col gap-6 rounded" value="inicio">
							<StartTab
								isPasswordVisible={isPasswordVisible}
								setIsPasswordVisible={setIsPasswordVisible}
								onRegisterGoogle={onRegisterGoogle}
								onContinue={goToDados}
								register={register}
								errors={errors}
							/>
						</TabsContent>
						<TabsContent className="flex w-full flex-col gap-6 rounded" value="dados">
							<DataTab
								onBack={() => setValueTab("inicio")}
								onContinue={goToMessage}
								register={register}
								errors={errors}
								isSubmitting={isSendingVerificationCode}
							/>
						</TabsContent>
						<TabsContent className="flex w-full flex-col gap-6 rounded" value="message">
							<CodeTab
								email={email}
								verificationCode={verificationCode}
								onVerificationCodeChange={(value) =>
									methods.setValue("verificationCode", value, {
										shouldValidate: true,
										shouldDirty: true,
										shouldTouch: true,
									})
								}
								onBack={() => setValueTab("dados")}
								onEditEmail={() => setValueTab("dados")}
								onContinue={submitVerificationCode}
								isSubmitting={isRegistering}
								errorMessage={errors.verificationCode?.message as string | undefined}
							/>
						</TabsContent>
					</TabsContents>
				</Tabs>
			</form>
		</FormProvider>
	);
};
