"use client";

import { FormEvent, useEffect, useState } from "react";
import { Button } from "@fanfuel/ui";
import { AppTopBar } from "../../../components/app-chrome";
import {
  ApiError,
  clearStoredToken,
  getMe,
  getStoredToken,
  login,
  setStoredToken
} from "../../../lib/api";
import { dictionary } from "../../../lib/i18n";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
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
      const response = await login({ email, password });
      setStoredToken(response.access_token);
      setMessage(dictionary.common.successLoggedIn);
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
        aria-labelledby="login-title"
      >
        <div className="ff-auth-heading">
          <div className="ff-status">{dictionary.common.navLogin}</div>
          <h1 id="login-title">{dictionary.common.authLoginTitle}</h1>
          <p>{dictionary.common.authLoginLead}</p>
        </div>

        <form
          className="ff-panel ff-form ff-auth-card"
          onSubmit={handleSubmit}
          suppressHydrationWarning
        >
          <div className="ff-auth-switch" aria-label={dictionary.common.primaryNavigation}>
            <strong>{dictionary.common.navLogin}</strong>
            <a href="/auth/register">{dictionary.common.navRegister}</a>
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
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
              suppressHydrationWarning
            />
          </label>

          <div className="ff-auth-actions">
            <Button type="submit" size="sm" disabled={isSubmitting || isCheckingSession}>
              {isSubmitting ? dictionary.common.loading : dictionary.common.loginAction}
            </Button>
            <a className="ff-auth-link" href="/auth/register">
              {dictionary.common.navRegister}
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
