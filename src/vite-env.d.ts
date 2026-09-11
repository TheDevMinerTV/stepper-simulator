/// <reference types="vite/client" />

interface ImportMetaEnv {
	/** Public origin of the application */
	readonly VITE_BASE_URL?: string;
	/** Site name registered in Plausible. Unset disables analytics. */
	readonly VITE_PLAUSIBLE_DOMAIN?: string;
}
