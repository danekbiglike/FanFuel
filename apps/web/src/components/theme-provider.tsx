"use client";

import { useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import {
  applyThemePreference,
  getStoredThemePreference,
  setStoredThemePreference,
  subscribeToSystemTheme,
  type ResolvedTheme,
  type ThemePreference
} from "@fanfuel/ui";
import { getPreferences, getStoredToken, updatePreferences } from "../lib/api";
import { ThemeContext } from "./theme-context";

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [preference, setPreferenceState] = useState<ThemePreference>("system");
  const [resolvedTheme, setResolvedTheme] = useState<ResolvedTheme>("light");
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const storedPreference = getStoredThemePreference();
    setPreferenceState(storedPreference);
    setResolvedTheme(applyThemePreference(storedPreference));

    const token = getStoredToken();
    if (token) {
      void getPreferences(token)
        .then((preferences) => {
          setStoredThemePreference(preferences.themePreference);
          setPreferenceState(preferences.themePreference);
          setResolvedTheme(applyThemePreference(preferences.themePreference));
        })
        .catch(() => {
          setError("preferences_load_failed");
        });
    }
  }, []);

  useEffect(() => {
    return subscribeToSystemTheme(() => {
      if (preference === "system") {
        setResolvedTheme(applyThemePreference(preference));
      }
    });
  }, [preference]);

  function setPreference(nextPreference: ThemePreference) {
    setError("");
    setPreferenceState(nextPreference);
    setStoredThemePreference(nextPreference);
    setResolvedTheme(applyThemePreference(nextPreference));

    const token = getStoredToken();
    if (!token) {
      return;
    }

    setIsSaving(true);
    void updatePreferences(token, { themePreference: nextPreference })
      .catch(() => {
        setError("preferences_save_failed");
      })
      .finally(() => setIsSaving(false));
  }

  const value = useMemo(
    () => ({
      preference,
      resolvedTheme,
      isSaving,
      error,
      setPreference
    }),
    [error, isSaving, preference, resolvedTheme]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}
