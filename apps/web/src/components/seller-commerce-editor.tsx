"use client";
import { useEffect, useState } from "react";
import type { Product } from "@fanfuel/types";
import { ApiError, apiFetch, getStoredToken } from "../lib/api";
import {
  decimalMinor,
  saveProductCommerce,
  type Identity,
  type CommerceProduct
} from "../lib/commerce";
import { useCommerceCopy, ProductEconomics } from "./commerce-shared";
import { AppTopBar } from "./app-chrome";
const empty: Identity = {
  source: "seller",
  external_id: "",
  work_title: "",
  format: "digital_file",
  platform: "",
  edition: "",
  region: "",
  language: "",
  duration_days: 0,
  license: "",
  bundle: ""
};
export function SellerCommerceEditor({
  product,
  onSaved
}: {
  product: Product;
  onSaved?: (p: Product) => void;
}) {
  const { copy, t, money } = useCommerceCopy();
  const existing = product as CommerceProduct;
  const [identity, setIdentity] = useState<Identity>({
    ...empty,
    ...existing.identity,
    source: existing.identity?.source || "seller",
    format: existing.identity?.format || "digital_file",
    work_title: existing.identity?.work_title || product.title
  });
  const [promo, setPromo] = useState(existing.promo_bps ? String(existing.promo_bps / 100) : "");
  const [store, setStore] = useState(
    existing.storefront_bps ? String(existing.storefront_bps / 100) : ""
  );
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const readOnly = !["draft", "rejected"].includes(product.status);
  const p = decimalMinor(promo);
  const s = decimalMinor(store);
  const valid = p !== null && s !== null && p > 0 && s > p && s <= 5000;
  const supported = ["digital_file", "service"].includes(identity.format);
  function change(key: keyof Identity, value: string | number) {
    setIdentity((x) => ({ ...x, [key]: value }));
    setMessage("");
  }
  async function save() {
    if (!valid) return;
    setBusy(true);
    try {
      const result = await saveProductCommerce(product.id, {
        identity,
        promo_bps: p!,
        storefront_bps: s!
      });
      onSaved?.(result);
      setMessage("saved");
    } catch (e) {
      setMessage(e instanceof ApiError && e.code === "conflict" ? "conflict" : "error");
    } finally {
      setBusy(false);
    }
  }
  return (
    <section className="commerce-panel">
      <h2>{copy.configure}</h2>
      <p>{copy.configureLead}</p>
      {readOnly && <p className="commerce-note">{copy.readOnly}</p>}
      <fieldset disabled={readOnly || busy} className="commerce-product-form">
        <div className="commerce-two">
          <label>
            {copy.source}
            <select value={identity.source} onChange={(e) => change("source", e.target.value)}>
              {["seller", "steam", "gog", "itch", "publisher"].map((x) => (
                <option value={x} key={x}>
                  {t(x)}
                </option>
              ))}
            </select>
          </label>
          <label>
            {copy.external_id}
            <input
              value={identity.external_id}
              maxLength={120}
              onChange={(e) => change("external_id", e.target.value)}
            />
          </label>
          <label>
            {copy.work_title}
            <input
              value={identity.work_title}
              maxLength={180}
              onChange={(e) => change("work_title", e.target.value)}
            />
          </label>
          <label>
            {copy.format}
            <select value={identity.format} onChange={(e) => change("format", e.target.value)}>
              {[
                "digital_file",
                "service",
                "license_key",
                "gift",
                "personal_account",
                "shared_account",
                "subscription",
                "unspecified"
              ].map((x) => (
                <option value={x} key={x}>
                  {t(x)}
                </option>
              ))}
            </select>
          </label>
          {(["platform", "edition", "region", "language", "license", "bundle"] as const).map(
            (key) => (
              <label key={key}>
                {t(key)}
                <input
                  value={identity[key]}
                  maxLength={100}
                  onChange={(e) => change(key, e.target.value)}
                />
              </label>
            )
          )}
          <label>
            {copy.duration_days}
            <input
              type="number"
              min={0}
              max={36500}
              step={1}
              value={identity.duration_days}
              onChange={(e) => change("duration_days", Number(e.target.value))}
            />
          </label>
        </div>
        <p>{copy.identityHelp}</p>
        {!supported && <p className="commerce-note">{copy.restricted}</p>}
        <h3>
          {copy.storeRate} / {copy.promoRate}
        </h3>
        <p>{copy.ratesHelp}</p>
        <div className="commerce-two">
          <label>
            {copy.storeRate} · %
            <input inputMode="decimal" value={store} onChange={(e) => setStore(e.target.value)} />
          </label>
          <label>
            {copy.promoRate} · %
            <input inputMode="decimal" value={promo} onChange={(e) => setPromo(e.target.value)} />
          </label>
        </div>
        {valid ? (
          <dl className="commerce-stats">
            <div>
              <dt>{copy.price}</dt>
              <dd>{money(product.price_amount_minor, product.currency)}</dd>
            </div>
            <div>
              <dt>{copy.storeRate}</dt>
              <dd>
                {money(Math.floor((product.price_amount_minor * s!) / 10000), product.currency)}
              </dd>
            </div>
            <div>
              <dt>{copy.sellerNet}</dt>
              <dd>
                {money(
                  product.price_amount_minor -
                    Math.floor((product.price_amount_minor * s!) / 10000),
                  product.currency
                )}
              </dd>
            </div>
          </dl>
        ) : (
          <p>{copy.invalidRates}</p>
        )}
        <small>{copy.beforeFees}</small>
        <button
          type="button"
          className="fuel-button"
          disabled={!valid || identity.work_title.length < 2 || busy}
          onClick={() => void save()}
        >
          {busy ? copy.saving : copy.save}
        </button>
      </fieldset>
      <p role="status">{message ? t(message) : ""}</p>
      {existing.commission_configured && <ProductEconomics product={existing} owner />}
    </section>
  );
}
export function SellerProductWorkspace({ id }: { id: string }) {
  const { copy } = useCommerceCopy();
  const [product, setProduct] = useState<Product | null>(null);
  const [error, setError] = useState(false);
  useEffect(() => {
    const c = new AbortController();
    void apiFetch<Product>("/api/v1/seller/products/" + encodeURIComponent(id), {
      headers: { Authorization: "Bearer " + getStoredToken() },
      signal: c.signal
    })
      .then(setProduct)
      .catch(() => {
        if (!c.signal.aborted) setError(true);
      });
    return () => c.abort();
  }, [id]);
  return (
    <main className="ff-page">
      <AppTopBar />
      <div className="fuel-wrap commerce-workspace">
        <a href="/seller/products">{copy.back}</a>
        <header className="commerce-heading">
          <h1>{product?.title || copy.configure}</h1>
        </header>
        {error ? (
          <p role="alert">{copy.error}</p>
        ) : product ? (
          <SellerCommerceEditor product={product} onSaved={setProduct} />
        ) : (
          <div className="fuel-skeleton commerce-loading" />
        )}
      </div>
    </main>
  );
}
