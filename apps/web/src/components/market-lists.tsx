"use client";
import { useEffect, useRef, useState } from "react";
import { formatMoney } from "@fanfuel/i18n";
import type { Product } from "@fanfuel/types";
import { getProduct } from "../lib/api";
import { useExperience } from "./experience-provider";
import { attributionURL, type Attribution } from "../lib/commerce";

export function ListIcon({ kind }: { kind: "saved" | "cart" }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width="22"
      height="22"
      aria-hidden="true"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {kind === "saved" ? (
        <path d="M20.5 5.5c-3-3-6-1-8.5 1.5-2.5-2.5-5.5-4.5-8.5-1.5S3 13 12 20c9-7 11.5-11.5 8.5-14.5Z" />
      ) : (
        <>
          <path d="M3 4h3l2 12h11l2-8H7" />
          <circle cx="10" cy="20" r="1" />
          <circle cx="18" cy="20" r="1" />
        </>
      )}
    </svg>
  );
}
export function ProductActions({
  product,
  attribution
}: {
  product: Product;
  attribution?: Attribution;
}) {
  const { lists, ready, toggle, copy } = useExperience();
  return (
    <div className="fuel-product-actions">
      {(["saved", "cart"] as const).map((kind) => {
        const selected = lists[kind].includes(product.id);
        const limit = !selected && lists[kind].length >= 100;
        const label =
          kind === "saved"
            ? selected
              ? copy.home.saved
              : copy.home.save
            : selected
              ? copy.home.added
              : copy.home.add;
        return (
          <button
            key={kind}
            type="button"
            className={kind === "saved" ? "fuel-save" : "fuel-add"}
            aria-label={label + ": " + product.title}
            aria-pressed={selected}
            title={limit ? copy.nav.limit : label}
            disabled={!ready || limit}
            onClick={() => toggle(kind, product.id, attribution)}
          >
            <ListIcon kind={kind} />
            {kind === "cart" && <span>{label}</span>}
          </button>
        );
      })}
    </div>
  );
}

export function MarketLists() {
  const { lists, copy, persistent, toggle, locale } = useExperience();
  const [kind, setKind] = useState<"saved" | "cart">("saved");
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<Record<string, Product | null>>({});
  const [loading, setLoading] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const dialog = useRef<HTMLDialogElement>(null);
  const ids = lists[kind];
  useEffect(() => {
    if (!open) return;
    let active = true;
    setLoading(true);
    setItems({});
    // Ограниченная параллельность: локальные списки не создают всплеск запросов.
    async function load() {
      const result: Record<string, Product | null> = {};
      for (let index = 0; index < ids.length; index += 4) {
        if (!active) return;
        await Promise.all(
          ids.slice(index, index + 4).map(async (id) => {
            const controller = new AbortController();
            const timeout = window.setTimeout(() => controller.abort(), 12000);
            try {
              result[id] = await getProduct(id, controller.signal);
            } catch {
              result[id] = null;
            } finally {
              window.clearTimeout(timeout);
            }
          })
        );
        if (!active) return;
        setItems({ ...result });
      }
      if (active) setLoading(false);
    }
    void load();
    return () => {
      active = false;
    };
  }, [open, ids, attempt]);
  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [open]);
  function show(next: "saved" | "cart") {
    setKind(next);
    setOpen(true);
    dialog.current?.showModal();
  }
  return (
    <>
      <div className="fuel-list-triggers">
        {(["saved", "cart"] as const).map((value) => (
          <button
            type="button"
            key={value}
            onClick={() => show(value)}
            aria-label={copy.nav[value]}
            className="fuel-list-trigger"
          >
            <ListIcon kind={value} />
            <span>{copy.nav[value]}</span>
            {lists[value].length > 0 && <b>{lists[value].length}</b>}
          </button>
        ))}
      </div>
      <dialog
        ref={dialog}
        className="fuel-drawer"
        onClose={() => setOpen(false)}
        aria-labelledby="fuel-list-title"
      >
        <div className="fuel-drawer-head">
          <h2 id="fuel-list-title">{copy.nav[kind]}</h2>
          <button
            type="button"
            className="fuel-round"
            onClick={() => dialog.current?.close()}
            aria-label={copy.nav.close}
          >
            ×
          </button>
        </div>
        <p className="fuel-muted">{persistent ? copy.nav.local : copy.nav.memory}</p>
        {ids.length === 0 ? (
          <div className="fuel-list-empty">
            <ListIcon kind={kind} />
            <h3>{kind === "saved" ? copy.nav.emptySaved : copy.nav.emptyCart}</h3>
            <p>{copy.nav.emptyText}</p>
            <a className="fuel-button" href="/marketplace/catalog">
              {copy.nav.catalog}
            </a>
          </div>
        ) : (
          <ul className="fuel-drawer-items" aria-busy={loading}>
            {ids.map((id) => {
              const product = items[id];
              return (
                <li key={id}>
                  {product ? (
                    <>
                      <a
                        href={attributionURL(
                          "/marketplace/products/" + encodeURIComponent(product.slug),
                          lists.attribution[id] ?? {
                            storefront: "",
                            promo_code: "",
                            attribution_choice: ""
                          }
                        )}
                      >
                        {product.title}
                      </a>
                      <strong>
                        {formatMoney({
                          amountMinor: product.price_amount_minor,
                          currency: product.currency,
                          locale,
                          trimZeroFraction: true
                        })}
                      </strong>
                      {kind === "cart" && product.status === "published" && (
                        <a
                          className="fuel-button fuel-button-small"
                          href={attributionURL(
                            "/checkout/" + encodeURIComponent(product.id),
                            lists.attribution[id] ?? {
                              storefront: "",
                              promo_code: "",
                              attribution_choice: ""
                            }
                          )}
                        >
                          {copy.nav.checkout}
                        </a>
                      )}
                    </>
                  ) : (
                    <span>{id in items ? copy.nav.unavailable : copy.nav.loading}</span>
                  )}
                  <button
                    className="fuel-text-button"
                    type="button"
                    onClick={() => toggle(kind, id)}
                  >
                    {copy.nav.remove}
                  </button>
                </li>
              );
            })}
          </ul>
        )}
        {!loading && Object.values(items).some((item) => item === null) && (
          <button
            className="fuel-button"
            type="button"
            onClick={() => setAttempt((value) => value + 1)}
          >
            {copy.nav.retry}
          </button>
        )}
      </dialog>
    </>
  );
}
