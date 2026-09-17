import type { Locale } from "@fanfuel/types";

export const defaultLocale: Locale = "ru";

export const supportedLocales = ["ru", "en"] as const satisfies readonly Locale[];

export function resolveLocale(locale?: string | null): Locale {
  if (locale === "en" || locale === "ru") {
    return locale;
  }

  return defaultLocale;
}
