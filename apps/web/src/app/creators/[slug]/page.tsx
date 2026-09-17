"use client";

import { FormEvent, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { formatMoney } from "@fanfuel/i18n";
import { Button, EmptyState, Skeleton, Select } from "@fanfuel/ui";
import { AppTopBar } from "../../../components/app-chrome";
import type {
  CreateDonationResponse,
  CurrencyCode,
  Donation,
  DonationGoal,
  DonationListResponse,
  PublicCreatorResponse,
  TopDonor
} from "@fanfuel/types";
import {
  ApiError,
  completeMockPayment,
  createDonation,
  getPublicCreator,
  getPublicDonations,
  getPublicGoals
} from "../../../lib/api";
import { appLocale, dictionary } from "../../../lib/i18n";

const defaultCurrency = (process.env.NEXT_PUBLIC_DEFAULT_CURRENCY ?? "RUB") as CurrencyCode;

export default function CreatorPage() {
  const params = useParams<{ slug: string }>();
  const [creator, setCreator] = useState<PublicCreatorResponse | null>(null);
  const [goals, setGoals] = useState<DonationGoal[]>([]);
  const [donations, setDonations] = useState<Donation[]>([]);
  const [topDonors, setTopDonors] = useState<TopDonor[]>([]);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCompletingPayment, setIsCompletingPayment] = useState(false);
  const [donationResult, setDonationResult] = useState<CreateDonationResponse | null>(null);

  const [amountMajor, setAmountMajor] = useState("100");
  const [currency, setCurrency] = useState<CurrencyCode>(defaultCurrency);
  const [displayName, setDisplayName] = useState("");
  const [donationMessage, setDonationMessage] = useState("");
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [selectedGoalID, setSelectedGoalID] = useState("");

  useEffect(() => {
    Promise.all([
      getPublicCreator(params.slug),
      getPublicGoals(params.slug),
      getPublicDonations(params.slug)
    ])
      .then(([creatorResponse, goalsResponse, donationResponse]) => {
        setCreator(creatorResponse);
        setGoals(goalsResponse.items);
        applyDonationResponse(donationResponse);
      })
      .catch((err: unknown) => setError(getErrorText(err)))
      .finally(() => setIsLoading(false));
  }, [params.slug]);

  async function refreshSupportData() {
    const [goalsResponse, donationResponse] = await Promise.all([
      getPublicGoals(params.slug),
      getPublicDonations(params.slug)
    ]);
    setGoals(goalsResponse.items);
    applyDonationResponse(donationResponse);
  }

  async function handleDonationSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setMessage("");
    setIsSubmitting(true);

    try {
      const amountMinor = Math.round(Number(amountMajor.replace(",", ".")) * 100);
      const response = await createDonation(
        {
          creator_slug: params.slug,
          amount_minor: amountMinor,
          currency,
          display_name: displayName,
          message: donationMessage,
          is_anonymous: isAnonymous,
          donation_goal_id: selectedGoalID || undefined
        },
        newIdempotencyKey()
      );
      setDonationResult(response);
      setMessage(dictionary.common.donationCreated);
    } catch (err) {
      setError(getErrorText(err));
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleMockPayment() {
    if (!donationResult) {
      return;
    }

    setError("");
    setMessage("");
    setIsCompletingPayment(true);

    try {
      const response = await completeMockPayment(donationResult.payment.id);
      setDonationResult(response);
      setMessage(dictionary.common.donationPaid);
      await refreshSupportData();
    } catch (err) {
      setError(getErrorText(err));
    } finally {
      setIsCompletingPayment(false);
    }
  }

  if (isLoading) {
    return (
      <main className="ff-page">
        <AppTopBar />
        <section className="ff-page-with-topbar ff-wide-page">
          <div className="ff-creator-layout">
            <Skeleton className="ff-skeleton-hero" />
            <Skeleton className="ff-skeleton-card" />
          </div>
        </section>
      </main>
    );
  }

  if (!creator) {
    return (
      <main className="ff-page">
        <AppTopBar />
        <section className="ff-page-with-topbar ff-form-page">
          <div className="ff-panel ff-stack">
            <div className="ff-message ff-error">
              {error || dictionary.common.publicProfileMissing}
            </div>
            <a className="ff-button ff-button-secondary" href="/">
              {dictionary.common.projectName}
            </a>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="ff-page">
      <AppTopBar />
      <section className="ff-page-with-topbar ff-wide-page" aria-labelledby="creator-title">
        <div className="ff-creator-layout">
          <div className="ff-profile-main">
            <div className="ff-creator-hero">
              <div className="ff-avatar" aria-hidden="true">
                {(creator.profile.display_name || creator.creator.creator_slug)
                  .slice(0, 2)
                  .toUpperCase()}
              </div>
              <div className="ff-status">{dictionary.common.creatorPage}</div>
              <h1 id="creator-title">{creator.creator.title || creator.profile.display_name}</h1>
              <p>
                {creator.creator.description ||
                  creator.profile.bio ||
                  dictionary.common.notAvailable}
              </p>
              <div className="ff-roles">
                <span className="ff-chip">{dictionary.common.roleStreamer}</span>
                <span className="ff-chip">{statusLabel(creator.creator.status)}</span>
              </div>
            </div>

            <SupportGoals goals={goals} />
            <DonationHistory donations={donations} topDonors={topDonors} />
          </div>

          <aside>
            <form className="ff-panel ff-form" onSubmit={handleDonationSubmit}>
              <div>
                <h2>{dictionary.common.donateTitle}</h2>
                <p className="ff-meta">{dictionary.common.donateLead}</p>
              </div>

              <div className="ff-two-columns">
                <label className="ff-field">
                  <span>{dictionary.common.donationAmount}</span>
                  <input
                    inputMode="decimal"
                    min="1"
                    step="1"
                    value={amountMajor}
                    onChange={(event) => setAmountMajor(event.target.value)}
                    required
                  />
                </label>
                <label className="ff-field">
                  <span>{dictionary.common.currency}</span>
                  <Select
                    value={currency}
                    onChange={(event) => setCurrency(event.target.value as CurrencyCode)}
                  >
                    <option value="RUB">RUB</option>
                    <option value="USD">USD</option>
                    <option value="EUR">EUR</option>
                  </Select>
                </label>
              </div>

              <label className="ff-field">
                <span>{dictionary.common.donationName}</span>
                <input
                  value={displayName}
                  onChange={(event) => setDisplayName(event.target.value)}
                  maxLength={80}
                />
              </label>

              <label className="ff-field">
                <span>{dictionary.common.donationMessage}</span>
                <textarea
                  value={donationMessage}
                  onChange={(event) => setDonationMessage(event.target.value)}
                  maxLength={240}
                />
              </label>

              <label className="ff-field">
                <span>{dictionary.common.donationGoal}</span>
                <Select
                  value={selectedGoalID}
                  onChange={(event) => setSelectedGoalID(event.target.value)}
                >
                  <option value="">{dictionary.common.donationGoalNone}</option>
                  {goals
                    .filter((goal) => goal.currency === currency)
                    .map((goal) => (
                      <option key={goal.id} value={goal.id}>
                        {goal.title}
                      </option>
                    ))}
                </Select>
              </label>

              <label className="ff-check">
                <input
                  type="checkbox"
                  checked={isAnonymous}
                  onChange={(event) => setIsAnonymous(event.target.checked)}
                />
                <span>{dictionary.common.donationAnonymous}</span>
              </label>

              <div className="ff-actions">
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? dictionary.common.loading : dictionary.common.sendDonation}
                </Button>
                {donationResult?.payment.status === "pending" ? (
                  <button
                    className="ff-button ff-button-secondary"
                    type="button"
                    onClick={handleMockPayment}
                    disabled={isCompletingPayment}
                  >
                    {isCompletingPayment
                      ? dictionary.common.loading
                      : dictionary.common.completeMockPayment}
                  </button>
                ) : null}
              </div>

              {donationResult ? (
                <p className="ff-meta">
                  {dictionary.common.paymentStatus}:{" "}
                  {paymentStatusLabel(donationResult.payment.status)}
                </p>
              ) : null}
              <div className={error ? "ff-message ff-error" : "ff-message"}>{error || message}</div>
            </form>
          </aside>
        </div>
      </section>
    </main>
  );

  function applyDonationResponse(response: DonationListResponse) {
    setDonations(response.items);
    setTopDonors(response.top_donors);
  }
}

function SupportGoals({ goals }: { goals: DonationGoal[] }) {
  if (goals.length === 0) {
    return (
      <section className="ff-panel ff-stack" aria-labelledby="goals-title">
        <h2 id="goals-title">{dictionary.common.goalsTitle}</h2>
        <EmptyState>
          <span>{dictionary.common.creatorGoalsEmptyText}</span>
        </EmptyState>
      </section>
    );
  }

  return (
    <section className="ff-panel ff-stack" aria-labelledby="goals-title">
      <h2 id="goals-title">{dictionary.common.goalsTitle}</h2>
      {goals.map((goal) => {
        const progress = Math.min(
          100,
          Math.round((goal.current_amount_minor / goal.target_amount_minor) * 100)
        );
        return (
          <article className="ff-goal" key={goal.id}>
            <div>
              <strong>{goal.title}</strong>
              <p className="ff-meta">
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
              </p>
            </div>
            <div className="ff-progress" aria-label={dictionary.common.goalProgress}>
              <span style={{ width: `${progress}%` }} />
            </div>
          </article>
        );
      })}
    </section>
  );
}

function DonationHistory({
  donations,
  topDonors
}: {
  donations: Donation[];
  topDonors: TopDonor[];
}) {
  return (
    <section className="ff-panel ff-stack" aria-labelledby="donations-title">
      <h2 id="donations-title">{dictionary.common.donationHistory}</h2>
      {donations.length === 0 ? (
        <EmptyState>
          <span>{dictionary.common.noDonationsYet}</span>
        </EmptyState>
      ) : null}
      {donations.map((donation) => (
        <article className="ff-donation-row" key={donation.id}>
          <div>
            <strong>{donation.public_name || dictionary.common.anonymousDonor}</strong>
            <p className="ff-meta">{donation.message || statusDonationLabel(donation.status)}</p>
          </div>
          <strong>
            {formatMoney({
              amountMinor: donation.amount_minor,
              currency: donation.currency,
              locale: appLocale
            })}
          </strong>
        </article>
      ))}

      {topDonors.length > 0 ? (
        <>
          <h3>{dictionary.common.topDonors}</h3>
          <div className="ff-roles">
            {topDonors.map((donor) => (
              <span className="ff-chip" key={`${donor.display_name}-${donor.currency}`}>
                {donor.display_name} -{" "}
                {formatMoney({
                  amountMinor: donor.total_amount_minor,
                  currency: donor.currency,
                  locale: appLocale
                })}
              </span>
            ))}
          </div>
        </>
      ) : null}
    </section>
  );
}

function statusLabel(status: string): string {
  switch (status) {
    case "draft":
      return dictionary.common.statusDraft;
    case "published":
      return dictionary.common.statusPublished;
    case "hidden":
      return dictionary.common.statusHidden;
    case "blocked":
      return dictionary.common.statusBlocked;
    default:
      return dictionary.common.notAvailable;
  }
}

function paymentStatusLabel(status: string): string {
  switch (status) {
    case "pending":
      return dictionary.common.paymentPending;
    case "succeeded":
      return dictionary.common.paymentSucceeded;
    case "failed":
      return dictionary.common.paymentFailed;
    default:
      return dictionary.common.notAvailable;
  }
}

function statusDonationLabel(status: string): string {
  switch (status) {
    case "paid":
      return dictionary.common.statusPaid;
    case "payment_pending":
      return dictionary.common.statusPaymentPending;
    case "failed":
      return dictionary.common.statusFailed;
    default:
      return dictionary.common.notAvailable;
  }
}

function getErrorText(error: unknown): string {
  if (error instanceof ApiError) {
    return (
      (dictionary.errors as Record<string, string>)[error.i18nKey] ?? dictionary.common.apiError
    );
  }

  return dictionary.common.apiError;
}

function newIdempotencyKey(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }

  return `donation-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}
