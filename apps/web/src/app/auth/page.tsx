"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { Button } from "@fanfuel/ui";
import { AuthSessionState } from "../../components/auth-shell";
import { useAuthContext } from "../../components/auth-context";
import {
  ApiError,
  identifyAuthEmail,
  login,
  register,
  setStoredToken,
  startEmailVerification,
  verifyEmail
} from "../../lib/api";
import { authDestination, authNameDestination } from "../../lib/creator-draft";
import { validateEmail, validatePassword } from "../../lib/auth-validation";
import { useAuthSession } from "../../lib/use-auth-session";

type AuthStep = "identifier" | "login" | "register" | "code" | "password";

export default function UnifiedAuthPage() {
  const { email, setEmail, locale, dictionary } = useAuthContext();
  const common = dictionary.common as Record<string, string>;
  const errors = dictionary.errors as Record<string, string>;
  const session = useAuthSession();
  const [step, setStep] = useState<AuthStep>("identifier");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [challengeId, setChallengeId] = useState("");
  const [maskedEmail, setMaskedEmail] = useState("");
  const [registrationToken, setRegistrationToken] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (session.status !== "authenticated") return;
    window.location.replace(
      session.user.profile_name_confirmed_at ? authDestination() : authNameDestination()
    );
  }, [session]);

  const title = useMemo(() => {
    if (step === "login") return common["auth.login.title"];
    if (step === "register") return common["auth.register.title"];
    if (step === "code") return common["auth.code.title"];
    if (step === "password") return common["auth.password.title"];
    return common["auth.unified.title"];
  }, [common, step]);

  const lead = useMemo(() => {
    if (step === "login") return interpolate(common["auth.login.lead"], email);
    if (step === "register") return interpolate(common["auth.register.lead"], email);
    if (step === "code") return interpolate(common["auth.code.lead"], maskedEmail || email);
    if (step === "password") return common["auth.password.lead"];
    return common["auth.unified.lead"];
  }, [common, email, maskedEmail, step]);

  if (session.status === "checking" || session.status === "authenticated") {
    return (
      <AuthSessionState
        failed={false}
        retry={session.retry}
        useAnotherAccount={session.useAnotherAccount}
      />
    );
  }
  if (session.status === "error") {
    return (
      <AuthSessionState
        failed
        retry={session.retry}
        useAnotherAccount={session.useAnotherAccount}
      />
    );
  }

  async function submitIdentifier(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (validateEmail(email)) {
      setError(common["auth.error.email"]);
      return;
    }
    await run(async () => {
      const normalizedEmail = email.trim().toLowerCase();
      const response = await identifyAuthEmail({ email: normalizedEmail });
      setEmail(normalizedEmail);
      setStep(response.next_action);
    });
  }

  async function submitLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await run(async () => {
      const response = await login({ email, password });
      setStoredToken(response.access_token);
      window.location.href = response.user.profile_name_confirmed_at
        ? authDestination()
        : authNameDestination();
    });
  }

  async function sendCode(event?: FormEvent<HTMLFormElement>) {
    event?.preventDefault();
    await run(async () => {
      const response = await startEmailVerification({ email, locale });
      setChallengeId(response.challenge_id);
      setMaskedEmail(response.email);
      setCode("");
      setStep("code");
    });
  }

  async function submitCode(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await run(async () => {
      const response = await verifyEmail({ challenge_id: challengeId, code });
      setRegistrationToken(response.registration_token);
      setCode("");
      setStep("password");
    });
  }

  async function submitRegistration(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const passwordError = validatePassword(password, true);
    if (passwordError) {
      setError(
        passwordError === "passwordLong"
          ? common["auth.error.passwordLong"]
          : common["auth.error.passwordShort"]
      );
      return;
    }
    await run(async () => {
      const response = await register({
        registration_token: registrationToken,
        password,
        locale,
        time_zone: Intl.DateTimeFormat().resolvedOptions().timeZone
      });
      setStoredToken(response.access_token);
      window.location.href = authNameDestination();
    });
  }

  async function run(action: () => Promise<void>) {
    setError("");
    setIsSubmitting(true);
    try {
      await action();
    } catch (value) {
      setError(getErrorText(value, errors, common.apiError));
    } finally {
      setIsSubmitting(false);
    }
  }

  function resetIdentifier() {
    setStep("identifier");
    setPassword("");
    setCode("");
    setChallengeId("");
    setRegistrationToken("");
    setShowPassword(false);
    setError("");
  }

  return (
    <section className="ff-form-page ff-auth-page" aria-labelledby="auth-title">
      <div className="ff-auth-heading">
        <div className="ff-status">{common.projectName}</div>
        <h1 id="auth-title">{title}</h1>
        <p>{lead}</p>
      </div>

      {step === "identifier" ? (
        <form className="ff-panel ff-form ff-auth-card" onSubmit={submitIdentifier}>
          <label className="ff-field">
            <span>{common["auth.identifier.label"]}</span>
            <input
              type="email"
              name="username"
              autoComplete="username"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
              autoFocus
            />
            <span className="ff-field-hint">{common["auth.identifier.hint"]}</span>
          </label>
          <AuthActions
            loading={isSubmitting}
            label={common["auth.continue"]}
            loadingLabel={common["auth.checkingIdentifier"]}
          />
          <AuthError message={error} />
        </form>
      ) : null}

      {step === "login" ? (
        <form className="ff-panel ff-form ff-auth-card" onSubmit={submitLogin}>
          <PasswordField
            common={common}
            value={password}
            setValue={setPassword}
            show={showPassword}
            setShow={setShowPassword}
            autoComplete="current-password"
            register={false}
          />
          <AuthActions
            loading={isSubmitting}
            label={common.loginAction}
            loadingLabel={common.loading}
          />
          <AuthSecondary label={common["auth.changeEmail"]} onClick={resetIdentifier} />
          <AuthError message={error} />
        </form>
      ) : null}

      {step === "register" ? (
        <form className="ff-panel ff-form ff-auth-card" onSubmit={sendCode}>
          <p className="ff-field-hint">{email}</p>
          <AuthActions
            loading={isSubmitting}
            label={common["auth.sendCode"]}
            loadingLabel={common["auth.sendingCode"]}
          />
          <AuthSecondary label={common["auth.changeEmail"]} onClick={resetIdentifier} />
          <AuthError message={error} />
        </form>
      ) : null}

      {step === "code" ? (
        <form className="ff-panel ff-form ff-auth-card" onSubmit={submitCode}>
          <label className="ff-field">
            <span>{common["auth.code.label"]}</span>
            <input
              className="ff-auth-code"
              name="one-time-code"
              inputMode="numeric"
              autoComplete="one-time-code"
              pattern="[0-9]{6}"
              minLength={6}
              maxLength={6}
              value={code}
              onChange={(event) => setCode(event.target.value.replace(/\D/g, "").slice(0, 6))}
              required
              autoFocus
            />
            <span className="ff-field-hint">{common["auth.code.hint"]}</span>
          </label>
          <AuthActions
            loading={isSubmitting}
            label={common["auth.verifyCode"]}
            loadingLabel={common["auth.verifyingCode"]}
          />
          <AuthSecondary
            label={common["auth.resendCode"]}
            onClick={() => void sendCode()}
            disabled={isSubmitting}
          />
          <AuthSecondary
            label={common["auth.changeEmail"]}
            onClick={resetIdentifier}
            disabled={isSubmitting}
          />
          <AuthError message={error} />
        </form>
      ) : null}

      {step === "password" ? (
        <form className="ff-panel ff-form ff-auth-card" onSubmit={submitRegistration}>
          <div className="ff-message ff-success">{common["auth.emailVerified"]}</div>
          <PasswordField
            common={common}
            value={password}
            setValue={setPassword}
            show={showPassword}
            setShow={setShowPassword}
            autoComplete="new-password"
            register
          />
          <AuthActions
            loading={isSubmitting}
            label={common.createAccount}
            loadingLabel={common["auth.creatingAccount"]}
          />
          <AuthSecondary label={common["auth.changeEmail"]} onClick={resetIdentifier} />
          <AuthError message={error} />
        </form>
      ) : null}
    </section>
  );
}

function PasswordField({
  common,
  value,
  setValue,
  show,
  setShow,
  autoComplete,
  register: isRegister
}: {
  common: Record<string, string>;
  value: string;
  setValue: (value: string) => void;
  show: boolean;
  setShow: (value: boolean) => void;
  autoComplete: "current-password" | "new-password";
  register: boolean;
}) {
  return (
    <label className="ff-field">
      <span>{common.password}</span>
      <div className="ff-password-field">
        <input
          type={show ? "text" : "password"}
          name={autoComplete}
          autoComplete={autoComplete}
          minLength={isRegister ? 8 : undefined}
          value={value}
          onChange={(event) => setValue(event.target.value)}
          required
          autoFocus
        />
        <button
          type="button"
          className="ff-password-toggle"
          onClick={() => setShow(!show)}
          aria-pressed={show}
        >
          {show ? common.hidePassword : common.showPassword}
        </button>
      </div>
      <span className="ff-field-hint">
        {isRegister ? common.passwordRequirements : common.authLoginHint}
      </span>
    </label>
  );
}

function AuthActions({
  loading,
  label,
  loadingLabel
}: {
  loading: boolean;
  label: string;
  loadingLabel: string;
}) {
  return (
    <div className="ff-auth-actions">
      <Button type="submit" size="sm" disabled={loading}>
        {loading ? loadingLabel : label}
      </Button>
    </div>
  );
}

function AuthSecondary({
  label,
  onClick,
  disabled = false
}: {
  label: string;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button className="ff-auth-text-button" type="button" onClick={onClick} disabled={disabled}>
      {label}
    </button>
  );
}

function AuthError({ message }: { message: string }) {
  return (
    <div
      className={message ? "ff-message ff-error" : "ff-message"}
      role={message ? "alert" : undefined}
    >
      {message}
    </div>
  );
}

function interpolate(template: string, email: string) {
  return template.replace("{{email}}", email);
}

function getErrorText(error: unknown, errors: Record<string, string>, fallback: string) {
  if (error instanceof ApiError) return errors[error.i18nKey] ?? fallback;
  return fallback;
}
