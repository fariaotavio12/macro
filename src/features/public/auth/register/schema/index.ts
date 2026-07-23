import { z } from "zod";

export const registerSchema = z
	.object({
		name: z.string().min(1, "Nome é obrigatório"),
		email: z.string().min(1, "Email é obrigatório").email("Email inválido"),
		password: z.string().min(6, "Mínimo 6 caracteres"),
		confirmPassword: z.string().min(1, "Confirme a senha"),
		companyName: z.string().min(1, "Nome é obrigatório"),
		document: z.string().min(1, "Documento é obrigatório"),
		phone: z.string().min(1, "Telefone é obrigatório"),
		verificationCode: z.string().min(1, "Código de verificação é obrigatório"),
		description: z.string().optional(),
	})
	.refine((data) => data.password === data.confirmPassword, {
		message: "As senhas não conferem",
		path: ["confirmPassword"],
	});

export type RegisterFormValues = z.infer<typeof registerSchema>;
