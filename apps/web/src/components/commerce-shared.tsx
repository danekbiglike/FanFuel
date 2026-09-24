"use client";
import { useEffect, useState } from "react";
import { formatMoney } from "@fanfuel/i18n";
import type { CurrencyCode, Product } from "@fanfuel/types";
import { useExperience } from "./experience-provider";
import { getAppDictionary } from "../lib/i18n";
import {
  getInsights,
  getSellerInsights,
  getQuote,
  type Attribution,
  type Quote,
  type Insights,
  type CommerceProduct
} from "../lib/commerce";
// Связанный с компонентами hook использует общий локализованный контекст.
// eslint-disable-next-line react-refresh/only-export-components
export function useCommerceCopy() {
  const { locale } = useExperience();
  const copy = getAppDictionary(locale).commerce;
  return {
    copy,
    locale,
    t: (key: string) => (copy as Record<string, string>)[key] ?? key,
    money: (amount: number, currency: CurrencyCode) =>
      formatMoney({ amountMinor: amount, currency, locale, trimZeroFraction: true })
  };
}
export function ProductEconomics({
  product,
  owner = false
}: {
  product: CommerceProduct;
  owner?: boolean;
}) {
  const { copy, t, money } = useCommerceCopy();
  const [data, setData] = useState<Insights | null>(null);
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    const ctrl = new AbortController();
    setData(null);
    setFailed(false);
    void (owner ? getSellerInsights(product.id, ctrl.signal) : getInsights(product.id, ctrl.signal))
      .then(setData)
      .catch(() => {
        if (!ctrl.signal.aborted) setFailed(true);
      });
    return () => ctrl.abort();
  }, [product.id, product.updated_at, owner]);
  return (
    <div className="commerce-economics">
      <dl>
        <div>
          <dt>{copy.storeRate}</dt>
          <dd>
            {money(
              Math.floor((product.price_amount_minor * (product.storefront_bps ?? 0)) / 10000),
              product.currency
            )}{" "}
            · {(product.storefront_bps ?? 0) / 100}%
          </dd>
        </div>
        <div>
          <dt>{copy.promoRate}</dt>
          <dd>
            {money(
              Math.floor((product.price_amount_minor * (product.promo_bps ?? 0)) / 10000),
              product.currency
            )}{" "}
            · {(product.promo_bps ?? 0) / 100}%
          </dd>
        </div>
      </dl>
      <details>
        <summary>{copy.priceTitle}</summary>
        {failed ? (
          <p role="status">{copy.error}</p>
        ) : !data ? (
          <p>{copy.loading}</p>
        ) : (
          <>
            <p>
              {data.reference.status === "observed"
                ? money(data.reference.median_minor, product.currency)
                : data.reference.status === "unmatched"
                  ? copy.unmatched
                  : data.reference.status === "sample_limited"
                    ? copy.priceLimited
                    : copy.priceInsufficient}
            </p>
            <p>{copy.priceExplanation}</p>
            {data.signals.map((signal) => (
              <p className="commerce-note" key={signal}>
                {t(signal)}
              </p>
            ))}
            <h4>{copy.conversion}</h4>
            <p>{copy.conversionEmpty}</p>
          </>
        )}
      </details>
    </div>
  );
}
export function ProductVariant({ product }: { product: Product }) {
  const { t } = useCommerceCopy();
  const identity = (product as Partial<CommerceProduct>).identity;
  if (!identity) return null;
  return (
    <p className="commerce-note commerce-variant">
      <strong>{t(identity.format || "unspecified")}</strong>
      {[identity.platform, identity.edition, identity.region].filter(Boolean).map((value, i) => (
        <span key={i}> · {value}</span>
      ))}
    </p>
  );
}
export function EquivalentOffers({ id }: { id: string }) {
  const { copy, t, money } = useCommerceCopy();
  const [data, setData] = useState<Insights | null>(null);
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    const c = new AbortController();
    void getInsights(id, c.signal)
      .then(setData)
      .catch(() => {
        if (!c.signal.aborted) setFailed(true);
      });
    return () => c.abort();
  }, [id]);
  return (
    <section className="commerce-equivalents">
      <h2>{copy.equivalents}</h2>
      {failed ? (
        <p role="status">{copy.error}</p>
      ) : !data ? (
        <div className="fuel-skeleton commerce-loading" />
      ) : (
        <>
          <p className="commerce-note">
            {[
              t(data.product.identity.format || "unspecified"),
              data.product.identity.platform,
              data.product.identity.edition,
              data.product.identity.region
            ]
              .filter(Boolean)
              .join(" · ")}
          </p>
          {data.offers.length ? (
            data.offers.map((p) => (
              <a
                className="commerce-offer"
                href={"/marketplace/products/" + encodeURIComponent(p.slug)}
                key={p.id}
              >
                <span>
                  {p.seller?.display_name}
                  <small>{p.title}</small>
                </span>
                <strong>
                  {money(p.price_amount_minor, p.currency)}
                  {p.price_amount_minor < data.product.price_amount_minor && (
                    <small>{copy.cheaper}</small>
                  )}
                </strong>
              </a>
            ))
          ) : (
            <p>{copy.noEquivalents}</p>
          )}
        </>
      )}
    </section>
  );
}
export function SupportPicker({
  id,
  value,
  onChange,
  onResolved,
  disabled = false
}: {
  id: string;
  value: Attribution;
  onChange: (a: Attribution) => void;
  onResolved: (q: Quote | null) => void;
  disabled?: boolean;
}) {
  const { copy, money } = useCommerceCopy();
  const [code, setCode] = useState(value.promo_code);
  const [quote, setQuote] = useState<Quote | null>(null);
  const [error, setError] = useState(false);
  useEffect(() => {
    const c = new AbortController();
    setError(false);
    onResolved(null);
    void getQuote(id, value, c.signal)
      .then((q) => {
        setQuote(q);
        onResolved(q);
      })
      .catch(() => {
        if (!c.signal.aborted) setError(true);
      });
    return () => c.abort();
  }, [id, value, onResolved]);
  return (
    <fieldset className="commerce-support" disabled={disabled}>
      <legend>{copy.recipient}</legend>
      <div className="commerce-inline">
        <label>
          <span>{copy.promo}</span>
          <input
            value={code}
            maxLength={24}
            onChange={(e) => setCode(e.target.value)}
            autoCapitalize="characters"
          />
        </label>
        <button
          type="button"
          className="fuel-button fuel-button-outline"
          onClick={() => onChange({ ...value, promo_code: code.trim(), attribution_choice: "" })}
        >
          {copy.apply}
        </button>
      </div>
      {error ? (
        <p role="alert">{copy.quoteError}</p>
      ) : !quote ? (
        <p aria-live="polite">{copy.loading}</p>
      ) : (
        <>
          {quote.choice_required && <p className="commerce-note">{copy.choose}</p>}
          {[quote.storefront, quote.promo]
            .filter((x) => x !== null)
            .map((c) => (
              <label className="commerce-choice" key={c.channel}>
                <input
                  type="radio"
                  name={"support-" + id}
                  checked={(value.attribution_choice || quote.selected?.channel) === c.channel}
                  onChange={() => onChange({ ...value, attribution_choice: c.channel })}
                />
                <span>
                  {c.creator_name}
                  <small>
                    {c.channel === "storefront" ? copy.storeRate : copy.promoRate} · {c.bps / 100}%
                  </small>
                </span>
              </label>
            ))}
          {quote.selected && (
            <p className="commerce-support-amount">
              {copy.supportAmount}{" "}
              <strong>{money(quote.allocation.creator_amount_minor, quote.currency)}</strong> ·{" "}
              {quote.selected.creator_name}
            </p>
          )}
          <p>{copy.supportHelp}</p>
        </>
      )}
      <button
        type="button"
        className="fuel-text-button"
        onClick={() => {
          setCode("");
          onChange({ storefront: "", promo_code: "", attribution_choice: "none" });
        }}
      >
        {copy.noSupport}
      </button>
    </fieldset>
  );
}
