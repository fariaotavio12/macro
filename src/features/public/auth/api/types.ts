import type { ApiRequestParams } from "@/app/api/types";

export type LoginRequestDto = {
	email: string;
	password: string;
};

export type AuthResponseDto = {
	userId: string;
	email: string;
	tokenExpiresAt: string;
	message: string;
	token: string;
};

export type UserRole = "ADMIN" | "STAFF";

export type CurrentUserResponseDto = {
	userId: string;
	name: string;
	email: string;
	role: UserRole;
	img?: string;
	companyId?: string;
	isActive: boolean;
	createdAt: string;
	updatedAt: string;
};

export type RegisterCompanyRequestDto = {
	identifier: string;
	name: string;
	businessHoursId?: string;
	description?: string;
};

export type RegisterUserRequestDto = {
	name: string;
	email: string;
	password: string;
	company?: RegisterCompanyRequestDto;
	verificationCode: string;
	affiliateCode?: string;
};

export type RegisterUserResponseDto = {
	userId: string;
	name: string;
	email: string;
	role: UserRole;
	companyId?: string;
	isActive: boolean;
	createdAt: string;
};

export type SendEmailVerificationCodeRequestDto = {
	email: string;
};

export type SendEmailVerificationCodeResponseDto = {
	email: string;
	message: string;
	expiresInSeconds: number;
};

export type GoogleAuthUrlResponseDto = Record<string, string>;

export type AuthDtoResponse = LoginRequestDto;

export type authDtoResponse = AuthDtoResponse;

export type CompleteRegisterDtoRequest = {
	name: string;
	company: {
		identifier: string;
		name: string;
		description?: string;
	};
	affiliateCode?: string;
};

export type GetUsersFilters = {
	companyId?: string;
};

export type UserResponseDto = {
	id: string;
	role: UserRole;
	name: string;
	email: string;
	companyId?: string;
	isActive: boolean;
	createdAt: string;
	updatedAt: string;
};

export type UserDtoResponse = CurrentUserResponseDto;

export type CreateUserRequest = {
	name: string;
	email: string;
	password: string;
	role: UserRole;
	companyId?: string;
};

export type UpdateUserRequest = {
	name: string;
	role?: UserRole;
	isActive?: boolean;
	companyId?: string;
};

export type GetUsersParams = ApiRequestParams<UserResponseDto, GetUsersFilters>;
