import { createContext, useContext } from "react";
import type { ResolvedTheme, ThemePreference } from "@fanfuel/ui";

export interface ThemeContextValue {
  preference: ThemePreference;
  resolvedTheme: ResolvedTheme;
  isSaving: boolean;
  error: string;
  setPreference: (preference: ThemePreference) => void;
}

export const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

export function useTheme() {
  const value = useContext(ThemeContext);
  if (!value) {
    throw new Error("useTheme must be used inside ThemeProvider");
  }

  return value;
}
