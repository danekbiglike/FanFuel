"use client";

import { useEffect, useState } from "react";
import { formatMoney } from "@fanfuel/i18n";
import type { Product } from "@fanfuel/types";
import { AppTopBar } from "../../components/app-chrome";
import {
  Arrow,
  DiscoveryArt,
  HomeAudiencePresentation,
  HomeAudienceSwitch,
  type HomeAudience
} from "../../components/home-audience";
import { getProducts } from "../../lib/api";
import { homeText } from "../../lib/home-copy";
import { appLocale, dictionary } from "../../lib/i18n";

const categories = [
  { name: "design", art: "design", slug: "design-assets" },
  { name: "obs", art: "stream", slug: "obs-packs" },
  { name: "alerts", art: "alerts", slug: "alerts" },
  { name: "games", art: "game", slug: "game-services" },
  { name: "community", art: "community", slug: "community-design" },
  { name: "coaching", art: "coaching", slug: "coaching" }
] as const;

const shoppingPaths = [
  { name: "stream", art: "stream", slug: "obs-packs" },
  { name: "community", art: "community", slug: "community-design" },
  { name: "skill", art: "coaching", slug: "coaching" }
] as const;

export default function MarketplacePage() {
  const [audience, setAudience] = useState<HomeAudience>("buyer");
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setLoading] = useState(true);
  const [hasError, setError] = useState(false);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(false);
    getProducts({ sort: "new" })
      .then((response) => {
        if (active) setProducts(response.items);
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
    <main className="ff-page">
      <AppTopBar />
      <div className="ff-page-with-topbar ff-wide-page ff-market-home ff-audience-home ff-home-refresh">
        <HomeAudienceSwitch value={audience} onChange={setAudience} />
        {(["buyer", "creator", "seller"] as const).map((mode) => (
          <div
            key={mode}
            role="tabpanel"
            id={`audience-panel-${mode}`}
            aria-labelledby={`audience-${mode}`}
            hidden={audience !== mode}
            tabIndex={0}
            className="ff-home-panel"
          >
            {mode === "buyer" ? (
              <div className="ff-shop-page">
                <section className="ff-shop-intro">
                  <div>
                    <p className="ff-role-kicker">{homeText("market.eyebrow")}</p>
                    <h1>{homeText("market.title")}</h1>
                    <p>{homeText("market.lead")}</p>
                  </div>
                  <a className="ff-shop-catalog-link" href="/marketplace/catalog">
                    {homeText("market.all")} <Arrow />
                  </a>
                </section>
                <nav className="ff-shop-categories" aria-label={homeText("market.categories")}>
                  {categories.map((category) => (
                    <a key={category.name} href={`/marketplace/category/${category.slug}`}>
                      <div>
                        <DiscoveryArt kind={category.art} />
                      </div>
                      <span>{homeText(`category.${category.name}`)}</span>
                    </a>
                  ))}
                </nav>
                <section
                  className="ff-shop-products"
                  aria-labelledby="shop-products-title"
                  aria-busy={isLoading}
                >
                  <div className="ff-shop-section-heading">
                    <div>
                      <h2 id="shop-products-title">{homeText("market.latest")}</h2>
                      <p>{homeText("market.latestLead")}</p>
                    </div>
                    <a href="/marketplace/catalog?sort=new">
                      {homeText("market.more")} <Arrow />
                    </a>
                  </div>
                  {isLoading ? (
                    <div
                      className="ff-shop-product-grid"
                      role="status"
                      aria-label={homeText("market.loading")}
                    >
                      {[0, 1, 2, 3].map((i) => (
                        <div className="ff-shop-loading" key={i}>
                          <div />
                          <span />
                          <span />
                        </div>
                      ))}
                    </div>
                  ) : hasError ? (
                    <div className="ff-shop-status" role="status">
                      <span className="ff-shop-status-symbol" aria-hidden="true">
                        ↻
                      </span>
                      <div>
                        <h3>{homeText("market.errorTitle")}</h3>
                        <p>{homeText("market.errorText")}</p>
                      </div>
                      <button
                        className="ff-button ff-button-secondary"
                        type="button"
                        onClick={() => setAttempt((value) => value + 1)}
                      >
                        {homeText("market.retry")}
                      </button>
                    </div>
                  ) : products.length ? (
                    <div className="ff-shop-product-grid">
                      {products.slice(0, 8).map((product) => (
                        <ShopProduct product={product} key={product.id} />
                      ))}
                    </div>
                  ) : (
                    <div className="ff-shop-status">
                      <span className="ff-shop-status-symbol" aria-hidden="true">
                        ✦
                      </span>
                      <div>
                        <h3>{homeText("market.emptyTitle")}</h3>
                        <p>{homeText("market.emptyText")}</p>
                      </div>
                      <a className="ff-button ff-button-secondary" href="/marketplace/categories">
                        {homeText("market.categories")}
                      </a>
                    </div>
                  )}
                </section>
                <section className="ff-shop-paths" aria-labelledby="shop-paths-title">
                  <div className="ff-shop-section-heading">
                    <div>
                      <h2 id="shop-paths-title">{homeText("market.paths")}</h2>
                      <p>{homeText("market.pathsLead")}</p>
                    </div>
                  </div>
                  <div className="ff-shop-path-grid">
                    {shoppingPaths.map((path) => (
                      <a
                        className={`ff-shop-path ff-shop-path-${path.name}`}
                        href={`/marketplace/category/${path.slug}`}
                        key={path.name}
                      >
                        <DiscoveryArt kind={path.art} />
                        <h3>{homeText(`path.${path.name}.title`)}</h3>
                        <p>{homeText(`path.${path.name}.text`)}</p>
                        <span>
                          {homeText(`path.${path.name}.link`)} <Arrow />
                        </span>
                      </a>
                    ))}
                  </div>
                </section>
                <aside className="ff-shop-creator-note">
                  <span aria-hidden="true">♡</span>
                  <div>
                    <h2>{homeText("market.noteTitle")}</h2>
                    <p>{homeText("market.note")}</p>
                  </div>
                  <a href="/creators">
                    {homeText("market.noteAction")} <Arrow />
                  </a>
                </aside>
              </div>
            ) : audience === mode ? (
              <HomeAudiencePresentation audience={mode} />
            ) : null}
          </div>
        ))}
        <footer className="ff-home-footer">
          <div>
            <a className="ff-home-wordmark" href="/">
              {dictionary.common.projectName}
            </a>
            <p>{homeText("shared.footer")}</p>
          </div>
          <nav aria-label={dictionary.common.primaryNavigation}>
            <a href="/marketplace/catalog">{homeText("market.all")}</a>
            <a href="/creators">{dictionary.common.navAuthors}</a>
            <a href="/for-buyers">{homeText("shared.footerHelp")}</a>
            <a href="/safe-deal">{homeText("shared.footerSafety")}</a>
          </nav>
        </footer>
      </div>
    </main>
  );
}

function ShopProduct({ product }: { product: Product }) {
  const media = product as Product & {
    cover_url?: string;
    coverUrl?: string;
    image_url?: string;
    imageUrl?: string;
    media_url?: string;
    mediaUrl?: string;
  };
  const cover =
    media.cover_url ??
    media.coverUrl ??
    media.image_url ??
    media.imageUrl ??
    media.media_url ??
    media.mediaUrl;
  const art =
    product.kind === "obs_pack" ? "stream" : product.kind === "coaching" ? "coaching" : "design";
  const rating =
    product.seller && product.seller.rating_count > 0
      ? new Intl.NumberFormat(appLocale, { maximumFractionDigits: 1 }).format(
          product.seller.rating_avg
        )
      : null;
  return (
    <article className="ff-shop-product">
      <a href={`/marketplace/products/${product.slug}`}>
        <div className="ff-shop-product-cover">
          {cover ? <img src={cover} alt="" loading="lazy" /> : <DiscoveryArt kind={art} />}
        </div>
        <div className="ff-shop-product-details">
          <div className="ff-shop-product-seller">
            <span>{product.seller?.display_name ?? homeText("market.unnamedSeller")}</span>
            {rating ? (
              <span>
                <span aria-hidden="true">★ </span>
                {rating}
              </span>
            ) : null}
          </div>
          <h3>{product.title}</h3>
          <strong className="ff-shop-product-price">
            {formatMoney({
              amountMinor: product.price_amount_minor,
              currency: product.currency,
              locale: appLocale,
              trimZeroFraction: true
            })}
          </strong>
          <p className="ff-shop-product-terms">
            {product.safe_deal_required ? (
              <span>{dictionary.common.marketplaceSafeDealBadge}</span>
            ) : null}
            <span>{homeText("market.delivery")}</span>
          </p>
        </div>
      </a>
    </article>
  );
}
