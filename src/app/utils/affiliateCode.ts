const STORAGE_KEY = "affiliate_ref";

export const affiliateCodeStorage = {
	save: (code: string) => localStorage.setItem(STORAGE_KEY, code),
	get: (): string | undefined => localStorage.getItem(STORAGE_KEY) ?? undefined,
	clear: () => localStorage.removeItem(STORAGE_KEY),
};
