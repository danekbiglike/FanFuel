"use client";

import { FormEvent, useEffect, useState } from "react";
import { Button } from "@fanfuel/ui";
import { ApiError, clearStoredToken, getMe, getStoredToken, updateProfile } from "../../../lib/api";
import { dictionary } from "../../../lib/i18n";
import { authDestination, isCreatorAuthFlow } from "../../../lib/creator-draft";

export default function ProfileNamePage() {
  const [displayName, setDisplayName] = useState("");
  const [slug, setSlug] = useState("");
  const [bio, setBio] = useState("");
  const [token, setToken] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCheckingSession, setIsCheckingSession] = useState(true);

  useEffect(() => {
    const storedToken = getStoredToken();

    if (!storedToken) {
      window.location.replace(isCreatorAuthFlow() ? "/auth?flow=creator" : "/auth");
      return;
    }

    getMe(storedToken)
      .then((user) => {
        if (user.profile_name_confirmed_at) {
          window.location.replace(authDestination());
          return;
        }

        setToken(storedToken);
        setSlug(user.profile?.slug ?? "");
        setBio(user.profile?.bio ?? "");
        setIsCheckingSession(false);
      })
      .catch(() => {
        clearStoredToken();
        window.location.replace("/auth");
      });
  }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    setError("");
    setIsSubmitting(true);

    try {
      await updateProfile(token, {
        display_name: displayName,
        slug,
        bio
      });
      setMessage(dictionary.common.successProfileNameSaved);
      window.location.href = authDestination();
    } catch (err) {
      setError(getErrorText(err));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <section className="ff-form-page ff-auth-page" aria-labelledby="profile-name-title">
      <div className="ff-auth-heading">
        <div className="ff-status">{dictionary.common.profileNameStatus}</div>
        <h1 id="profile-name-title">{dictionary.common.profileNameTitle}</h1>
        <p>{dictionary.common.profileNameLead}</p>
      </div>

      <form
        className="ff-panel ff-form ff-auth-card"
        onSubmit={handleSubmit}
        suppressHydrationWarning
      >
        <label className="ff-field">
          <span>{dictionary.common.displayName}</span>
          <input
            value={displayName}
            onChange={(event) => setDisplayName(event.target.value)}
            minLength={2}
            maxLength={80}
            autoComplete="name"
            required
            suppressHydrationWarning
          />
        </label>

        <div className="ff-auth-actions">
          <Button type="submit" size="sm" disabled={isSubmitting || isCheckingSession}>
            {isSubmitting ? dictionary.common.loading : dictionary.common.profileNameSubmit}
          </Button>
        </div>

        <div className={error ? "ff-message ff-error" : "ff-message"}>{error || message}</div>
      </form>
    </section>
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
