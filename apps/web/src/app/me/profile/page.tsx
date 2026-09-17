"use client";

import { FormEvent, useEffect, useState } from "react";
import { formatDate, formatMoney } from "@fanfuel/i18n";
import { Button, EmptyState, Skeleton, Select } from "@fanfuel/ui";
import { AppTopBar, ThemeSettingsPanel } from "../../../components/app-chrome";
import type { CurrencyCode, CurrentUser, DonationGoal, UserRole, Widget } from "@fanfuel/types";
import {
  ApiError,
  clearStoredToken,
  createStudioGoal,
  createStudioWidget,
  getMe,
  getStoredToken,
  getStudioGoals,
  getStudioWidgets,
  rotateStudioWidgetToken,
  updateCreatorProfile,
  updateProfile,
  updateSellerProfile
} from "../../../lib/api";
import { appLocale, dictionary } from "../../../lib/i18n";

const widgetBaseUrl = process.env.NEXT_PUBLIC_WIDGET_BASE_URL ?? "http://localhost:5173";
const defaultCurrency = (process.env.NEXT_PUBLIC_DEFAULT_CURRENCY ?? "RUB") as CurrencyCode;

export default function ProfilePage() {
  const [token, setToken] = useState("");
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  const [displayName, setDisplayName] = useState("");
  const [slug, setSlug] = useState("");
  const [bio, setBio] = useState("");
  const [creatorTitle, setCreatorTitle] = useState("");
  const [creatorDescription, setCreatorDescription] = useState("");
  const [creatorStatus, setCreatorStatus] = useState("published");
  const [sellerDisplayName, setSellerDisplayName] = useState("");
  const [sellerDescription, setSellerDescription] = useState("");
  const [sellerType, setSellerType] = useState("lite");
  const [goals, setGoals] = useState<DonationGoal[]>([]);
  const [widgets, setWidgets] = useState<Widget[]>([]);
  const [latestWidgetLink, setLatestWidgetLink] = useState("");
  const [goalTitle, setGoalTitle] = useState("");
  const [goalDescription, setGoalDescription] = useState("");
  const [goalTargetMajor, setGoalTargetMajor] = useState("5000");
  const [goalCurrency, setGoalCurrency] = useState<CurrencyCode>(defaultCurrency);

  useEffect(() => {
    const storedToken = getStoredToken();
    setToken(storedToken);

    if (!storedToken) {
      setIsLoading(false);
      setError((dictionary.errors as Record<string, string>)["errors.unauthorized"]);
      return;
    }

    getMe(storedToken)
      .then((user) => {
        setCurrentUser(user);
        setDisplayName(user.profile?.display_name ?? "");
        setSlug(user.profile?.slug ?? "");
        setBio(user.profile?.bio ?? "");
        setCreatorTitle(user.creator_profile?.title ?? "");
        setCreatorDescription(user.creator_profile?.description ?? "");
        setCreatorStatus(user.creator_profile?.status ?? "published");
        setSellerDisplayName(user.seller_profile?.display_name ?? "");
        setSellerDescription(user.seller_profile?.description ?? "");
        setSellerType(user.seller_profile?.seller_type ?? "lite");

        if (user.creator_profile) {
          void Promise.all([getStudioGoals(storedToken), getStudioWidgets(storedToken)])
            .then(([goalResponse, widgetResponse]) => {
              setGoals(goalResponse.items);
              setWidgets(widgetResponse.items);
            })
            .catch((err: unknown) => setError(getErrorText(err)));
        }
      })
      .catch((err: unknown) => setError(getErrorText(err)))
      .finally(() => setIsLoading(false));
  }, []);

  async function handleProfileSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    setError("");

    try {
      const user = await updateProfile(token, {
        display_name: displayName,
        slug,
        bio
      });
      setCurrentUser(user);
      setMessage(dictionary.common.successSaved);
    } catch (err) {
      setError(getErrorText(err));
    }
  }

  async function handleCreatorSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    setError("");

    try {
      const user = await updateCreatorProfile(token, {
        title: creatorTitle,
        description: creatorDescription,
        status: creatorStatus
      });
      setCurrentUser(user);
      setMessage(dictionary.common.successSaved);
    } catch (err) {
      setError(getErrorText(err));
    }
  }

  async function handleSellerSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    setError("");

    try {
      const user = await updateSellerProfile(token, {
        display_name: sellerDisplayName,
        description: sellerDescription,
        seller_type: sellerType
      });
      setCurrentUser(user);
      setMessage(dictionary.common.successSaved);
    } catch (err) {
      setError(getErrorText(err));
    }
  }

  async function handleGoalSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    setError("");

    try {
      const goal = await createStudioGoal(token, {
        title: goalTitle,
        description: goalDescription,
        target_amount_minor: Math.round(Number(goalTargetMajor.replace(",", ".")) * 100),
        currency: goalCurrency
      });
      setGoals((current) => [goal, ...current]);
      setGoalTitle("");
      setGoalDescription("");
      setMessage(dictionary.common.successSaved);
    } catch (err) {
      setError(getErrorText(err));
    }
  }

  async function handleCreateWidget() {
    setMessage("");
    setError("");

    try {
      const widget = await createStudioWidget(token, {
        name: dictionary.common.studioWidgetsTitle
      });
      setWidgets((current) => [widget, ...current]);
      setLatestWidgetLink(buildWidgetLink(widget));
      setMessage(dictionary.common.successSaved);
    } catch (err) {
      setError(getErrorText(err));
    }
  }

  async function handleRotateWidget(widgetID: string) {
    setMessage("");
    setError("");

    try {
      const widget = await rotateStudioWidgetToken(token, widgetID);
      setWidgets((current) => current.map((item) => (item.id === widget.id ? widget : item)));
      setLatestWidgetLink(buildWidgetLink(widget));
      setMessage(dictionary.common.successSaved);
    } catch (err) {
      setError(getErrorText(err));
    }
  }

  function handleLogout() {
    clearStoredToken();
    window.location.href = "/";
  }

  if (isLoading) {
    return (
      <main className="ff-page">
        <AppTopBar />
        <section className="ff-page-with-topbar ff-wide-page">
          <div className="ff-profile-layout">
            <Skeleton className="ff-skeleton-card" />
            <Skeleton className="ff-skeleton-hero" />
          </div>
        </section>
      </main>
    );
  }

  if (!currentUser) {
    return (
      <main className="ff-page">
        <AppTopBar />
        <section className="ff-page-with-topbar ff-form-page">
          <div className="ff-panel ff-stack">
            <div className="ff-message ff-error">{error}</div>
            <a className="ff-button ff-button-primary" href="/auth">
              {dictionary.common.navLogin}
            </a>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="ff-page">
      <AppTopBar />
      <section className="ff-page-with-topbar ff-wide-page" aria-labelledby="profile-title">
        <div className="ff-profile-layout">
          <aside className="ff-profile-sidebar">
            <div className="ff-panel ff-stack">
              <div className="ff-status">{dictionary.common.profileTitle}</div>
              <h1 id="profile-title">{dictionary.common.profileLead}</h1>
              <div className="ff-roles" aria-label={dictionary.common.currentRoles}>
                {currentUser.roles.map((role) => (
                  <span className="ff-chip" key={role}>
                    {roleLabel(role)}
                  </span>
                ))}
              </div>
              <p className="ff-meta">
                {dictionary.common.registeredAt}:{" "}
                {formatDate(currentUser.user.created_at, { locale: appLocale })}
              </p>
              <div className="ff-actions">
                <a className="ff-button ff-button-secondary" href="/marketplace">
                  {dictionary.common.navMarketplace}
                </a>
                <a className="ff-button ff-button-secondary" href="/buyer">
                  {dictionary.common.navBuyer}
                </a>
                {currentUser.seller_profile ? (
                  <a className="ff-button ff-button-secondary" href="/seller">
                    {dictionary.common.navSeller}
                  </a>
                ) : null}
              </div>
            </div>

            <ThemeSettingsPanel />

            <div className={error ? "ff-message ff-error" : "ff-message"}>{error || message}</div>
          </aside>

          <div className="ff-profile-main">
            <form className="ff-panel ff-form" onSubmit={handleProfileSubmit}>
              <label className="ff-field">
                <span>{dictionary.common.displayName}</span>
                <input
                  value={displayName}
                  onChange={(event) => setDisplayName(event.target.value)}
                  required
                />
              </label>
              <label className="ff-field">
                <span>{dictionary.common.slug}</span>
                <input value={slug} onChange={(event) => setSlug(event.target.value)} required />
              </label>
              <label className="ff-field">
                <span>{dictionary.common.bio}</span>
                <textarea value={bio} onChange={(event) => setBio(event.target.value)} />
              </label>
              <div className="ff-actions">
                <Button type="submit">{dictionary.common.save}</Button>
                <button
                  className="ff-button ff-button-secondary"
                  type="button"
                  onClick={handleLogout}
                >
                  {dictionary.common.logoutAction}
                </button>
              </div>
            </form>

            {currentUser.creator_profile ? (
              <>
                <form className="ff-panel ff-form" onSubmit={handleCreatorSubmit}>
                  <h2>{dictionary.common.creatorProfileTitle}</h2>
                  <label className="ff-field">
                    <span>{dictionary.common.creatorTitle}</span>
                    <input
                      value={creatorTitle}
                      onChange={(event) => setCreatorTitle(event.target.value)}
                    />
                  </label>
                  <label className="ff-field">
                    <span>{dictionary.common.creatorDescription}</span>
                    <textarea
                      value={creatorDescription}
                      onChange={(event) => setCreatorDescription(event.target.value)}
                    />
                  </label>
                  <label className="ff-field">
                    <span>{dictionary.common.creatorStatus}</span>
                    <Select
                      value={creatorStatus}
                      onChange={(event) => setCreatorStatus(event.target.value)}
                    >
                      <option value="draft">{dictionary.common.statusDraft}</option>
                      <option value="published">{dictionary.common.statusPublished}</option>
                      <option value="hidden">{dictionary.common.statusHidden}</option>
                    </Select>
                  </label>
                  <div className="ff-actions">
                    <Button type="submit">{dictionary.common.save}</Button>
                    <a
                      className="ff-button ff-button-secondary"
                      href={`/creators/${currentUser.creator_profile.creator_slug}`}
                    >
                      {dictionary.common.openPublicPage}
                    </a>
                  </div>
                </form>

                <form className="ff-panel ff-form" onSubmit={handleGoalSubmit}>
                  <h2>{dictionary.common.studioGoalsTitle}</h2>
                  <label className="ff-field">
                    <span>{dictionary.common.goalTitle}</span>
                    <input
                      value={goalTitle}
                      onChange={(event) => setGoalTitle(event.target.value)}
                      required
                    />
                  </label>
                  <label className="ff-field">
                    <span>{dictionary.common.creatorDescription}</span>
                    <textarea
                      value={goalDescription}
                      onChange={(event) => setGoalDescription(event.target.value)}
                    />
                  </label>
                  <div className="ff-two-columns">
                    <label className="ff-field">
                      <span>{dictionary.common.goalTarget}</span>
                      <input
                        inputMode="decimal"
                        value={goalTargetMajor}
                        onChange={(event) => setGoalTargetMajor(event.target.value)}
                        required
                      />
                    </label>
                    <label className="ff-field">
                      <span>{dictionary.common.currency}</span>
                      <Select
                        value={goalCurrency}
                        onChange={(event) => setGoalCurrency(event.target.value as CurrencyCode)}
                      >
                        <option value="RUB">RUB</option>
                        <option value="USD">USD</option>
                        <option value="EUR">EUR</option>
                      </Select>
                    </label>
                  </div>
                  <div className="ff-actions">
                    <Button type="submit">{dictionary.common.goalCreate}</Button>
                  </div>
                  <div className="ff-stack">
                    {goals.length === 0 ? (
                      <EmptyState>
                        <span>{dictionary.common.profileGoalsEmptyText}</span>
                      </EmptyState>
                    ) : (
                      goals.map((goal) => (
                        <div className="ff-donation-row" key={goal.id}>
                          <div>
                            <strong>{goal.title}</strong>
                            <p className="ff-meta">{goalStatusLabel(goal.status)}</p>
                          </div>
                          <strong>
                            {formatMoney({
                              amountMinor: goal.current_amount_minor,
                              currency: goal.currency,
                              locale: appLocale
                            })}{" "}
                            /{" "}
                            {formatMoney({
                              amountMinor: goal.target_amount_minor,
                              currency: goal.currency,
                              locale: appLocale
                            })}
                          </strong>
                        </div>
                      ))
                    )}
                  </div>
                </form>

                <section className="ff-panel ff-stack" aria-labelledby="widgets-title">
                  <h2 id="widgets-title">{dictionary.common.studioWidgetsTitle}</h2>
                  <div className="ff-actions">
                    <button
                      className="ff-button ff-button-primary"
                      type="button"
                      onClick={handleCreateWidget}
                    >
                      {dictionary.common.widgetCreate}
                    </button>
                  </div>
                  {latestWidgetLink ? (
                    <label className="ff-field">
                      <span>{dictionary.common.widgetLink}</span>
                      <input readOnly value={latestWidgetLink} />
                    </label>
                  ) : (
                    <p className="ff-meta">{dictionary.common.widgetTokenVisibleOnce}</p>
                  )}
                  {widgets.length === 0 ? (
                    <EmptyState>
                      <span>{dictionary.common.profileWidgetsEmptyText}</span>
                    </EmptyState>
                  ) : (
                    widgets.map((widget) => (
                      <div className="ff-donation-row" key={widget.id}>
                        <div>
                          <strong>{widget.name}</strong>
                          <p className="ff-meta">{widgetStatusLabel(widget.status)}</p>
                        </div>
                        <button
                          className="ff-button ff-button-secondary"
                          type="button"
                          onClick={() => void handleRotateWidget(widget.id)}
                        >
                          {dictionary.common.widgetRotate}
                        </button>
                      </div>
                    ))
                  )}
                </section>
              </>
            ) : null}

            {currentUser.seller_profile ? (
              <form className="ff-panel ff-form" onSubmit={handleSellerSubmit}>
                <h2>{dictionary.common.sellerProfileTitle}</h2>
                <label className="ff-field">
                  <span>{dictionary.common.displayName}</span>
                  <input
                    value={sellerDisplayName}
                    onChange={(event) => setSellerDisplayName(event.target.value)}
                  />
                </label>
                <label className="ff-field">
                  <span>{dictionary.common.sellerDescription}</span>
                  <textarea
                    value={sellerDescription}
                    onChange={(event) => setSellerDescription(event.target.value)}
                  />
                </label>
                <label className="ff-field">
                  <span>{dictionary.common.sellerType}</span>
                  <Select
                    value={sellerType}
                    onChange={(event) => setSellerType(event.target.value)}
                  >
                    <option value="lite">{dictionary.common.sellerLite}</option>
                    <option value="pro">{dictionary.common.sellerPro}</option>
                  </Select>
                </label>
                <div className="ff-actions">
                  <Button type="submit">{dictionary.common.save}</Button>
                  <a className="ff-button ff-button-secondary" href="/seller/products">
                    {dictionary.common.navSellerProducts}
                  </a>
                  <a className="ff-button ff-button-secondary" href="/seller/orders">
                    {dictionary.common.navSellerOrders}
                  </a>
                </div>
              </form>
            ) : null}
          </div>
        </div>
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

function roleLabel(role: UserRole): string {
  const labels: Record<UserRole, string> = {
    buyer: dictionary.common.roleBuyer,
    streamer: dictionary.common.roleStreamer,
    seller: dictionary.common.roleSeller,
    admin: dictionary.common.roleAdmin,
    support: dictionary.common.roleSupport,
    moderator: dictionary.common.roleModerator
  };

  return labels[role];
}

function goalStatusLabel(status: DonationGoal["status"]): string {
  switch (status) {
    case "active":
      return dictionary.common.statusActive;
    case "paused":
      return dictionary.common.statusPaused;
    case "completed":
      return dictionary.common.statusCompleted;
    case "archived":
      return dictionary.common.statusArchived;
    default:
      return dictionary.common.notAvailable;
  }
}

function buildWidgetLink(widget: Widget): string {
  if (!widget.token) {
    return "";
  }

  const url = new URL(widgetBaseUrl);
  url.searchParams.set("token", widget.token);
  return url.toString();
}

function widgetStatusLabel(status: Widget["status"]): string {
  switch (status) {
    case "active":
      return dictionary.common.statusActive;
    case "disabled":
    case "revoked":
      return dictionary.common.statusBlocked;
    default:
      return dictionary.common.notAvailable;
  }
}
