"use client";

import { FormEvent, useEffect, useState } from "react";
import { Button } from "@fanfuel/ui";
import { AppTopBar } from "../../../components/app-chrome";
import {
  ApiError,
  clearStoredToken,
  getMe,
  getStoredToken,
  register,
  setStoredToken
} from "../../../lib/api";
import { dictionary } from "../../../lib/i18n";

export default function RegisterPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [roleIntent, setRoleIntent] = useState("buyer");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCheckingSession, setIsCheckingSession] = useState(true);

  useEffect(() => {
    const token = getStoredToken();

    if (!token) {
      setIsCheckingSession(false);
      return;
    }

    getMe(token)
      .then(() => {
        window.location.replace("/marketplace");
      })
      .catch(() => {
        clearStoredToken();
        setIsCheckingSession(false);
      });
  }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    setError("");
    setIsSubmitting(true);

    try {
      const response = await register({
        email,
        password,
        display_name: displayName,
        role_intent: roleIntent
      });
      setStoredToken(response.access_token);
      setMessage(dictionary.common.successRegistered);
      window.location.href = "/marketplace";
    } catch (err) {
      setError(getErrorText(err));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="ff-page">
      <AppTopBar />
      <section
        className="ff-page-with-topbar ff-form-page ff-auth-page"
        aria-labelledby="register-title"
      >
        <div className="ff-auth-heading">
          <div className="ff-status">{dictionary.common.navRegister}</div>
          <h1 id="register-title">{dictionary.common.authRegisterTitle}</h1>
          <p>{dictionary.common.authRegisterLead}</p>
        </div>

        <form
          className="ff-panel ff-form ff-auth-card"
          onSubmit={handleSubmit}
          suppressHydrationWarning
        >
          <div className="ff-auth-switch" aria-label={dictionary.common.primaryNavigation}>
            <a href="/auth/login">{dictionary.common.navLogin}</a>
            <strong>{dictionary.common.navRegister}</strong>
          </div>

          <label className="ff-field">
            <span>{dictionary.common.email}</span>
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
              suppressHydrationWarning
            />
          </label>

          <label className="ff-field">
            <span>{dictionary.common.password}</span>
            <input
              type="password"
              minLength={8}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
              suppressHydrationWarning
            />
          </label>

          <label className="ff-field">
            <span>{dictionary.common.displayName}</span>
            <input
              value={displayName}
              onChange={(event) => setDisplayName(event.target.value)}
              minLength={2}
              maxLength={80}
              required
              suppressHydrationWarning
            />
          </label>

          <label className="ff-field">
            <span>{dictionary.common.roleIntent}</span>
            <select
              value={roleIntent}
              onChange={(event) => setRoleIntent(event.target.value)}
              suppressHydrationWarning
            >
              <option value="buyer">{dictionary.common.roleBuyer}</option>
              <option value="streamer">{dictionary.common.roleStreamer}</option>
              <option value="seller">{dictionary.common.roleSeller}</option>
            </select>
          </label>

          <div className="ff-auth-actions">
            <Button type="submit" size="sm" disabled={isSubmitting || isCheckingSession}>
              {isSubmitting ? dictionary.common.loading : dictionary.common.createAccount}
            </Button>
            <a className="ff-auth-link" href="/auth/login">
              {dictionary.common.navLogin}
            </a>
          </div>

          <div className={error ? "ff-message ff-error" : "ff-message"}>{error || message}</div>
        </form>
      </section>
    </main>
  );
}

function getErrorText(error: unknown): string {
  if (error instanceof ApiError) {
    return (
      (dictionary.errors as Record<string, string>)[error.i18nKey] ?? dictionary.common.apiError
    );
  }

  return dictionary.common.apiError;
}
