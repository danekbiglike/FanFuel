"use client";
import { CreatorMedia } from "./creator-media";
import { useEffect, useState } from "react";
import { getStore, type CreatorCommerce } from "../lib/commerce";
import { OilyArt, CanisterMark } from "./brand-art";
import { ProductCard } from "./marketplace-experience";
import { useCommerceCopy } from "./commerce-shared";
export function Storefront({
  store,
  preview = false
}: {
  store: CreatorCommerce;
  preview?: boolean;
}) {
  const { copy } = useCommerceCopy();
  const d = store.design;
  return (
    <section className={"commerce-store commerce-accent-" + d.accent} aria-label={copy.preview}>
      <header
        className={
          "commerce-banner commerce-banner-" +
          d.banner +
          (d.banner_media_id ? " commerce-banner-photo" : "")
        }
      >
        {d.banner_media_id && <CreatorMedia id={d.banner_media_id} preview={preview} banner />}
        <span className="fuel-hand">{preview ? copy.preview : store.title}</span>
        <h2>{d.headline || store.title}</h2>
      </header>
      <div className="commerce-store-identity">
        <div className="commerce-avatar">
          {d.avatar_media_id ? (
            <CreatorMedia id={d.avatar_media_id} preview={preview} />
          ) : d.avatar === "oily" ? (
            <OilyArt />
          ) : d.avatar === "canister" ? (
            <CanisterMark />
          ) : (
            <span>{store.title.slice(0, 1)}</span>
          )}
        </div>
        <strong>{store.title}</strong>
        {store.donations_enabled && d.donate_placement === "button" && (
          <a
            className="fuel-button"
            href={"/creators/" + encodeURIComponent(store.slug) + "#donate"}
          >
            {copy.donate}
          </a>
        )}
      </div>
      {store.promo_enabled && (
        <p className="commerce-promo-line">
          {copy.promo} <strong>{store.promo_code}</strong>
          <small>{copy.supportHelp}</small>
        </p>
      )}
      {d.blocks.map((block) =>
        block === "products" ? (
          <section key={block}>
            <h3>{copy.products}</h3>
            {!store.storefront_enabled ? (
              <p>{copy.storeClosed}</p>
            ) : store.products.length ? (
              <div className={"commerce-store-products commerce-layout-" + d.layout}>
                {store.products.map((p) => (
                  <ProductCard key={p.id} product={p} storefront={store.slug} />
                ))}
              </div>
            ) : (
              <p>{copy.empty}</p>
            )}
          </section>
        ) : block === "about" ? (
          <section key={block}>
            <h3>{copy.about}</h3>
            <p className="commerce-preserve">{d.about}</p>
          </section>
        ) : store.donations_enabled && d.donate_placement === "block" ? (
          <section className="commerce-note" key={block}>
            <h3>{copy.donation}</h3>
            <a
              className="fuel-button"
              href={"/creators/" + encodeURIComponent(store.slug) + "#donate"}
            >
              {copy.donate}
            </a>
          </section>
        ) : null
      )}
    </section>
  );
}
export function PublicStorefront({ slug }: { slug: string }) {
  const { copy } = useCommerceCopy();
  const [store, setStore] = useState<CreatorCommerce | null>(null);
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    const c = new AbortController();
    void getStore(slug, c.signal)
      .then(setStore)
      .catch(() => {
        if (!c.signal.aborted) setFailed(true);
      });
    return () => c.abort();
  }, [slug]);
  if (failed) return <p role="status">{copy.error}</p>;
  return store ? <Storefront store={store} /> : <div className="fuel-skeleton commerce-loading" />;
}
