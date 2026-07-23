import type { MacroApi } from "../../../electron/preload";

declare global {
	// eslint-disable-next-line @typescript-eslint/consistent-type-definitions -- Window global exige `interface`
	interface Window {
		api: MacroApi;
	}
}

export {};
