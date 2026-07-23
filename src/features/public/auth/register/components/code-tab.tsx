import { Button } from "@/components/button";
import { InputOTP, InputOTPGroup, InputOTPSeparator, InputOTPSlot } from "@/components/input-otp";
import { Progress } from "@/components/progress-bar";
import { REGEXP_ONLY_DIGITS_AND_CHARS } from "input-otp";
import { ChevronLeft, Edit2, LoaderCircle } from "lucide-react";

type Props = {
	email: string;
	verificationCode: string;
	onVerificationCodeChange: (value: string) => void;
	onBack: () => void;
	onEditEmail: () => void;
	onContinue: () => void;
	isSubmitting?: boolean;
	errorMessage?: string;
};

export const CodeTab = ({
	email,
	verificationCode,
	onVerificationCodeChange,
	onBack,
	onEditEmail,
	onContinue,
	isSubmitting = false,
	errorMessage,
}: Props) => {
	return (
		<>
			<div className="flex w-full flex-row items-center gap-4">
				<Progress value={100} />
				<span className="text-muted-foreground text-sm">3/3</span>
			</div>

			<div className="flex w-full flex-col gap-3">
				<p className="text-2xl font-semibold tracking-tight">Digite o código de verificação</p>
				<p className="text-muted-foreground flex w-full flex-row items-center text-sm">
					Enviamos um código para {email}
					<Edit2 size={16} className="ml-3 cursor-pointer" onClick={onEditEmail} />
				</p>
			</div>

			<InputOTP
				maxLength={6}
				pattern={REGEXP_ONLY_DIGITS_AND_CHARS}
				value={verificationCode}
				onChange={onVerificationCodeChange}
			>
				<InputOTPGroup className="w-full">
					<InputOTPSlot index={0} className="h-18 w-18" />
					<InputOTPSlot index={1} className="h-18 w-18" />
					<InputOTPSlot index={2} className="h-18 w-18" />
					<InputOTPSeparator />
					<InputOTPSlot index={3} className="h-18 w-18" />
					<InputOTPSlot index={4} className="h-18 w-18" />
					<InputOTPSlot index={5} className="h-18 w-18" />
				</InputOTPGroup>
			</InputOTP>

			{errorMessage && <p className="text-destructive text-sm">{errorMessage}</p>}

			<div className="flex w-full flex-row gap-3">
				<Button variant="outline" type="button" onClick={onBack}>
					<ChevronLeft size={12} />
				</Button>

				<Button className="w-full" type="button" onClick={onContinue} disabled={isSubmitting}>
					{isSubmitting && <LoaderCircle className="animate-spin" />}
					Continuar
				</Button>
			</div>
		</>
	);
}
