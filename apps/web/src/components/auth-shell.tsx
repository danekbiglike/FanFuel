"use client";

import Link from "next/link";
import { useEffect, useState, type ReactNode } from "react";
import { Button, Select, ThemeSwitcher } from "@fanfuel/ui";
import { isCreatorAuthFlow } from "../lib/creator-draft";
import { useAuthContext } from "./auth-context";
import { useTheme } from "./theme-context";

export function AuthShell({ children }: { children: ReactNode }) {
  const { dictionary: { common }, locale, setLocale } = useAuthContext();
  const theme = useTheme();
  const [creatorFlow, setCreatorFlow] = useState(false);
  useEffect(() => setCreatorFlow(isCreatorAuthFlow()), []);

  return (
    <div className="ff-auth-shell" lang={locale}>
      <header className="ff-auth-topbar">
        <Link className="ff-brand" href="/" aria-label={common.projectName}>
          <span aria-hidden="true">FF</span><strong>{common.projectName}</strong>
        </Link>
        <div className="ff-auth-preferences">
          <Select aria-label={common["auth.language"]} value={locale} onChange={(event) => setLocale(event.target.value === "en" ? "en" : "ru")}>
            <option value="ru">{common.languageRussian}</option>
            <option value="en">{common.languageEnglish}</option>
          </Select>
          <ThemeSwitcher preference={theme.preference} onChange={theme.setPreference} labels={common} compact />
        </div>
      </header>
      <main className="ff-auth-main">
        <div className="ff-auth-surface">{children}</div>
        <Link className="ff-auth-return" href={creatorFlow ? "/create?step=finish" : "/marketplace"}>
          <span aria-hidden="true">←</span> {creatorFlow ? common["auth.backToDraft"] : common["auth.backToMarket"]}
        </Link>
      </main>
    </div>
  );
}

export function AuthSessionState({ failed, retry, useAnotherAccount }: { failed: boolean; retry: () => void; useAnotherAccount: () => void }) {
  const { dictionary: { common } } = useAuthContext();
  return (
    <div className="ff-auth-session">
      <div className="ff-auth-heading">
        <h1>{failed ? common["auth.sessionErrorTitle"] : common["auth.checkingSession"]}</h1>
        <p role={failed ? "alert" : "status"}>{failed ? common["auth.sessionError"] : common["auth.checkingHint"]}</p>
      </div>
      {failed ? <>
        <Button onClick={retry}>{common["auth.retry"]}</Button>
        <button className="ff-auth-text-button" type="button" onClick={useAnotherAccount}>{common["auth.anotherAccount"]}</button>
      </> : <span className="ff-auth-spinner" aria-hidden="true" />}
    </div>
  );
}
