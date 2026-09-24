"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { Locale } from "@fanfuel/types";
import {
  appLocale,
  getAppDictionary,
  getStoredLocalePreference,
  setStoredLocalePreference
} from "../lib/i18n";

type AuthContextValue = {
  email: string;
  setEmail: (email: string) => void;
  locale: Locale;
  setLocale: (locale: Locale) => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [email, setEmail] = useState("");
  const [locale, setLocaleState] = useState<Locale>(appLocale);
  useEffect(() => setLocaleState(getStoredLocalePreference()), []);

  function setLocale(value: Locale) {
    setLocaleState(value);
    setStoredLocalePreference(value);
  }

  return (
    <AuthContext.Provider value={{ email, setEmail, locale, setLocale }}>
      {children}
    </AuthContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuthContext() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("AuthProvider required");
  return { ...context, dictionary: getAppDictionary(context.locale) };
}
