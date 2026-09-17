export type ThemePreference = "system" | "light" | "dark";
export type ResolvedTheme = "light" | "dark";

export const themeStorageKey = "fanfuel_theme_preference";
export const themeCookieName = "fanfuel_theme_preference";

export function isThemePreference(value: unknown): value is ThemePreference {
  return value === "system" || value === "light" || value === "dark";
}

export function getStoredThemePreference(fallback: ThemePreference = "system"): ThemePreference {
  if (typeof window === "undefined") {
    return fallback;
  }

  const localValue = window.localStorage.getItem(themeStorageKey);
  if (isThemePreference(localValue)) {
    return localValue;
  }

  const cookieValue = readThemeCookie();
  if (isThemePreference(cookieValue)) {
    return cookieValue;
  }

  return fallback;
}

export function setStoredThemePreference(preference: ThemePreference) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(themeStorageKey, preference);
  document.cookie = `${themeCookieName}=${preference}; Path=/; Max-Age=31536000; SameSite=Lax`;
}

export function resolveThemePreference(preference: ThemePreference): ResolvedTheme {
  if (preference === "light" || preference === "dark") {
    return preference;
  }

  if (typeof window !== "undefined" && window.matchMedia("(prefers-color-scheme: dark)").matches) {
    return "dark";
  }

  return "light";
}

export function applyThemePreference(
  preference: ThemePreference,
  root?: HTMLElement
): ResolvedTheme {
  const target = root ?? (typeof document !== "undefined" ? document.documentElement : undefined);
  const resolvedTheme = resolveThemePreference(preference);

  if (target) {
    target.dataset.theme = resolvedTheme;
    target.dataset.themePreference = preference;
    target.style.colorScheme = resolvedTheme;
  }

  return resolvedTheme;
}

export function subscribeToSystemTheme(callback: () => void): () => void {
  if (typeof window === "undefined") {
    return () => undefined;
  }

  const media = window.matchMedia("(prefers-color-scheme: dark)");
  media.addEventListener("change", callback);

  return () => media.removeEventListener("change", callback);
}

function readThemeCookie(): string {
  if (typeof document === "undefined") {
    return "";
  }

  const cookies = document.cookie.split(";").map((item) => item.trim());
  const match = cookies.find((item) => item.startsWith(`${themeCookieName}=`));
  return match ? decodeURIComponent(match.slice(themeCookieName.length + 1)) : "";
}
