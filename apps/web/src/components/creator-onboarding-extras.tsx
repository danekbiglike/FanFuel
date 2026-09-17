"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { formatMoney } from "@fanfuel/i18n";
import type { Product } from "@fanfuel/types";
import { getProducts } from "../lib/api";
import { appLocale, dictionary } from "../lib/i18n";
import type { DraftProduct } from "../lib/creator-draft";
import type { useCreatorDraftMedia } from "../lib/use-creator-draft-media";

const copy = (key: string) => (dictionary.common as Record<string, string>)[`onboard.${key}`];

export function CreatorMediaStep({ media }: { media: ReturnType<typeof useCreatorDraftMedia> }) {
  return (
    <div className="ff-onboard-media-fields">
      {(["avatar", "banner"] as const).map((kind) => (
        <div className={`ff-onboard-media-field ff-onboard-media-${kind}`} key={kind}>
          <div className="ff-onboard-media-thumbnail">
            {media.urls[kind] ? (
              <Image src={media.urls[kind]} alt={copy(kind)} fill unoptimized sizes="160px" />
            ) : (
              <span aria-hidden="true">{kind === "avatar" ? "◯" : "▧"}</span>
            )}
          </div>
          <label className="ff-field">
            <span>
              {copy(kind)} <small>{copy("optional")}</small>
            </span>
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              disabled={media.busy}
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (file) void media.change(kind, file);
                event.target.value = "";
              }}
            />
          </label>
          {media.urls[kind] ? (
            <button
              className="ff-onboard-text-button"
              type="button"
              disabled={media.busy}
              onClick={() => void media.change(kind, null)}
            >
              {copy("removeImage")}
            </button>
          ) : null}
        </div>
      ))}
      <small className="ff-onboard-local-note">{copy("imageFormats")}</small>
      {media.error ? (
        <p className="ff-message ff-error" role="alert">
          {media.error}
        </p>
      ) : null}
    </div>
  );
}

export function CreatorProductsStep({
  selected,
  onChange
}: {
  selected: DraftProduct[];
  onChange: (products: DraftProduct[]) => void;
}) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(false);
    getProducts({ sort: "new" })
      .then((response) => {
        if (active)
          setProducts(
            response.items.filter(
              (product) => product.status === "published" && product.affiliate_percent_bps > 0
            )
          );
      })
      .catch(() => {
        if (active) setError(true);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [attempt]);
  return (
    <div className="ff-onboard-products">
      <p className="ff-onboard-local-note">{copy("productsNote")}</p>
      {loading ? (
        <p role="status">{dictionary.common.loading}</p>
      ) : error ? (
        <div className="ff-onboard-catalog-state" role="status">
          <p>{copy("productsError")}</p>
          <button
            className="ff-onboard-text-button"
            type="button"
            onClick={() => setAttempt((value) => value + 1)}
          >
            {copy("retry")}
          </button>
        </div>
      ) : products.length === 0 ? (
        <p role="status">{copy("productsEmpty")}</p>
      ) : (
        <div className="ff-onboard-product-options">
          {products.map((product) => {
            const checked = selected.some((item) => item.id === product.id);
            return (
              <label className="ff-onboard-product-option" key={product.id}>
                <input
                  type="checkbox"
                  checked={checked}
                  disabled={!checked && selected.length >= 12}
                  onChange={() =>
                    onChange(
                      checked
                        ? selected.filter((item) => item.id !== product.id)
                        : [...selected, { id: product.id, title: product.title }]
                    )
                  }
                />
                <span>
                  <strong>{product.title}</strong>
                  <small>
                    {formatMoney({
                      amountMinor: product.price_amount_minor,
                      currency: product.currency,
                      locale: appLocale,
                      trimZeroFraction: true
                    })}
                  </small>
                </span>
              </label>
            );
          })}
        </div>
      )}
      {selected.length > 0 ? (
        <div className="ff-onboard-selected">
          <strong>
            {copy("selected")} {selected.length} / 12
          </strong>
          {selected.map((item) => (
            <div key={item.id}>
              <span>{item.title}</span>
              <button
                className="ff-onboard-text-button"
                type="button"
                aria-label={`${copy("removeProduct")}: ${item.title}`}
                onClick={() => onChange(selected.filter((product) => product.id !== item.id))}
              >
                {copy("remove")}
              </button>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}
