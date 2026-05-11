import { getDictionary, resolveLocale } from "@fanfuel/i18n";

export const appLocale = resolveLocale(import.meta.env.VITE_DEFAULT_LOCALE);
export const dictionary = getDictionary(appLocale);
