import { getDictionary, resolveLocale } from "@fanfuel/i18n";
import type { Locale } from "@fanfuel/types";

export const appLocale = resolveLocale(process.env.NEXT_PUBLIC_DEFAULT_LOCALE);
export const dictionary = getDictionary(appLocale);

const localeStorageKey = "fanfuel_locale_preference";
const localeCookieMaxAge = 60 * 60 * 24 * 365;

export function getAppDictionary(locale: Locale = appLocale) {
  return getDictionary(locale);
}

export function getStoredLocalePreference(): Locale {
  if (typeof window === "undefined") {
    return appLocale;
  }

  try {
    return resolveLocale(
      window.localStorage.getItem(localeStorageKey) ?? readCookie(localeStorageKey) ?? appLocale
    );
  } catch {
    return appLocale;
  }
}

export function setStoredLocalePreference(locale: Locale) {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.setItem(localeStorageKey, locale);
  } catch {
    /* Cookie остаётся резервным хранилищем. */
  }
  document.cookie = `${localeStorageKey}=${locale}; path=/; max-age=${localeCookieMaxAge}; SameSite=Lax`;
}

function readCookie(name: string): string | null {
  if (typeof document === "undefined") {
    return null;
  }

  const cookie = document.cookie
    .split("; ")
    .find((entry) => entry.startsWith(`${encodeURIComponent(name)}=`));

  return cookie ? decodeURIComponent(cookie.split("=").slice(1).join("=")) : null;
}
