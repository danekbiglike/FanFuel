"use client";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { formatMoney } from "@fanfuel/i18n";
import type { Product, ProductCategory } from "@fanfuel/types";
import { AppTopBar } from "./app-chrome";
import { useExperience } from "./experience-provider";
import { ExperienceFooter } from "./experience-footer";
import { RolePresentation } from "./role-presentation";
import { OilyStage } from "./oily-stage";
import { ProductActions } from "./market-lists";
import { ProductCover } from "./product-cover";
import { searchCommerce } from "../lib/commerce";
import { useCommerceCopy } from "./commerce-shared";
import { getCategories } from "../lib/api";
import { getAppDictionary } from "../lib/i18n";
import { useAuthSession } from "../lib/use-auth-session";

type Audience = "buyer" | "creator" | "seller";
const audiences: Audience[] = ["buyer", "creator", "seller"];
const paths = [
  { key: "games", slug: "games" },
  { key: "software", slug: "software" },
  { key: "gameAssets", slug: "game-assets" },
  { key: "designAssets", slug: "design-assets" },
  { key: "services", slug: "digital-services" },
  { key: "creatorAssets", slug: "creator-assets" },
  { key: "obsPacks", slug: "obs-packs" },
  { key: "coaching", slug: "coaching" }
] as const;

export function MarketplaceExperience({
  catalog = false,
  categorySlug = ""
}: {
  catalog?: boolean;
  categorySlug?: string;
}) {
  const { copy, locale } = useExperience();
  const session = useAuthSession();
  const { copy: commerceCopy, t } = useCommerceCopy();
  const [format, setFormat] = useState("");
  const [platform, setPlatform] = useState("");
  const [region, setRegion] = useState("");
  const [audience, setAudience] = useState<Audience>("buyer");
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [query, setQuery] = useState("");
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState(categorySlug);
  const [sort, setSort] = useState("new");
  const [initialized, setInitialized] = useState(false);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const [count, setCount] = useState(4);
  const [total, setTotal] = useState(0);
  const [loadingMore, setLoadingMore] = useState(false);
  const [moreFailed, setMoreFailed] = useState(false);
  const generation = useRef(0);
  const tabs = useRef<Array<HTMLButtonElement | null>>([]);
  const guest = session.status === "guest";
  const activeAudience = guest && !catalog ? audience : "buyer";
  const common = getAppDictionary(locale).common as Record<string, string>;
  function categoryName(item: ProductCategory) {
    return common[item.name_i18n_key.replace(/^common\./, "")] ?? item.slug.replaceAll("-", " ");
  }

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setFormat(params.get("format") ?? "");
    setPlatform(params.get("platform") ?? "");
    setRegion(params.get("region") ?? "");
    setQuery(params.get("query") ?? "");
    setSearch(params.get("query") ?? "");
    setCategory(categorySlug || params.get("category") || "");
    const initialSort = params.get("sort");
    setSort(initialSort === "price_asc" || initialSort === "price_desc" ? initialSort : "new");
    setInitialized(true);
  }, [categorySlug]);
  useEffect(() => {
    if (!initialized || !catalog) return;
    const params = new URLSearchParams();
    if (query) params.set("query", query);
    if (format) params.set("format", format);
    if (platform) params.set("platform", platform);
    if (region) params.set("region", region);
    if (category && !categorySlug) params.set("category", category);
    if (sort !== "new") params.set("sort", sort);
    const suffix = params.toString();
    window.history.replaceState(null, "", window.location.pathname + (suffix ? "?" + suffix : ""));
  }, [initialized, catalog, categorySlug, query, category, sort, format, platform, region]);
  useEffect(() => {
    let active = true;
    void getCategories()
      .then((response) => {
        if (active) setCategories(response.items.filter((item) => item.status === "active"));
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, []);
  useEffect(() => {
    if (!initialized) return;
    generation.current += 1;
    let active = true;
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 15000);
    setLoading(true);
    setFailed(false);
    setCount(window.matchMedia("(max-width: 1199px)").matches ? 2 : 4);
    setLoadingMore(false);
    setMoreFailed(false);
    const request = searchCommerce(
      { query, category, sort, format, platform, region, limit: "12" },
      controller.signal
    );
    void request
      .then((response) => {
        if (active) {
          setProducts(response.items.filter((item) => item.status === "published"));
          setTotal(response.pagination?.total ?? response.items.length);
        }
      })
      .catch(() => {
        if (active) setFailed(true);
      })
      .finally(() => {
        window.clearTimeout(timeout);
        if (active) setLoading(false);
      });
    return () => {
      active = false;
      generation.current += 1;
      controller.abort();
      window.clearTimeout(timeout);
    };
  }, [initialized, query, category, sort, attempt, catalog, format, platform, region]);

  async function loadMore() {
    if (count < products.length) {
      setCount((value) => value + 4);
      return;
    }
    if (loadingMore) return;
    const current = generation.current;
    setLoadingMore(true);
    setMoreFailed(false);
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 15000);
    try {
      const response = await searchCommerce(
        {
          query,
          category,
          sort,
          format,
          platform,
          region,
          limit: "12",
          offset: String(products.length)
        },
        controller.signal
      );
      if (generation.current !== current) return;
      setProducts((previous) => [
        ...previous,
        ...response.items.filter(
          (item) =>
            item.status === "published" && !previous.some((existing) => existing.id === item.id)
        )
      ]);
      setTotal(response.items.length ? response.pagination.total : products.length);
      setCount((value) => value + 4);
    } catch {
      if (generation.current === current) setMoreFailed(true);
    } finally {
      window.clearTimeout(timeout);
      if (generation.current === current) setLoadingMore(false);
    }
  }

  function searchProducts(event: FormEvent) {
    event.preventDefault();
    setQuery(search.trim());
  }

  return (
    <OilyStage activeAnchor={activeAudience === "buyer" ? "welcome" : "role"} sceneKey={activeAudience}>
    <main className="ff-page fuel-page">
      <AppTopBar />
      <div className="fuel-wrap">
        {!catalog && (
          <div className="fuel-audience-slot">
            {guest ? (
              <div className="fuel-audience" role="tablist" aria-label={copy.home.audience}>
                {audiences.map((value, index) => (
                  <button
                    type="button"
                    key={value}
                    ref={(node) => {
                      tabs.current[index] = node;
                    }}
                    role="tab"
                    id={"fuel-tab-" + value}
                    aria-controls={"fuel-panel-" + value}
                    aria-selected={audience === value}
                    tabIndex={audience === value ? 0 : -1}
                    onClick={() => setAudience(value)}
                    onKeyDown={(event) => {
                      const next =
                        event.key === "ArrowRight"
                          ? (index + 1) % 3
                          : event.key === "ArrowLeft"
                            ? (index + 2) % 3
                            : event.key === "Home"
                              ? 0
                              : event.key === "End"
                                ? 2
                                : -1;
                      if (next < 0) return;
                      event.preventDefault();
                      setAudience(audiences[next]);
                      tabs.current[next]?.focus();
                    }}
                  >
                    <span>{copy.home[value]}</span>
                    {audience === value && (
                      <svg className="fuel-audience-sketch" viewBox="0 0 240 60" preserveAspectRatio="none" aria-hidden="true">
                        <path d="M17 9 C63 5 170 7 222 12 Q237 15 232 28 L229 45 Q224 55 203 53 C147 58 62 54 20 51 Q7 49 9 37 L10 20 Q11 13 17 9 Z" />
                        <path d="M21 7 Q103 4 218 10 M231 19 Q235 39 225 49 M214 55 Q119 58 24 52" />
                      </svg>
                    )}
                  </button>
                ))}
              </div>
            ) : (
              <div className="fuel-session-line">
                {session.status === "checking" ? (
                  <span className="fuel-skeleton-line" aria-label={copy.home.session} />
                ) : session.status === "error" ? (
                  <>
                    <span>{copy.home.sessionError}</span>
                    <button className="fuel-text-button" onClick={session.retry}>
                      {copy.nav.retry}
                    </button>
                  </>
                ) : (
                  <span>{copy.home.browse}</span>
                )}
              </div>
            )}
          </div>
        )}
        {audiences.map((value) => (
          <div
            key={value}
            id={"fuel-panel-" + value}
            hidden={activeAudience !== value}
            role={guest && !catalog ? "tabpanel" : undefined}
            aria-labelledby={guest && !catalog ? "fuel-tab-" + value : undefined}
            tabIndex={guest && !catalog ? 0 : undefined}
          >
            {value === "buyer" ? (
              <>
                <nav className="fuel-category-strip" aria-label={copy.home.filter}>
                  <a className={!category ? "is-active" : ""} href="/marketplace/catalog">
                    {copy.home.any}
                  </a>
                  {categories.length > 0
                    ? categories.map((item) => (
                        <a
                          className={category === item.slug ? "is-active" : ""}
                          href={"/marketplace/catalog?category=" + encodeURIComponent(item.slug)}
                          key={item.id}
                        >
                          {categoryName(item)}
                        </a>
                      ))
                    : paths.map((path) => (
                        <a href={"/marketplace/catalog?category=" + path.slug} key={path.key}>
                          {copy.home[path.key]}
                        </a>
                      ))}
                </nav>
                <section className="fuel-market-intro">
                  <div>
                    <p className="fuel-eyebrow">{copy.home.eyebrow}</p>
                    <h1>
                      <span>{catalog ? copy.home.catalogTitle : copy.home.title}</span>
                    </h1>
                    <p>{copy.home.lead}</p>
                  </div>
                  <div className="fuel-intro-note">
                    <span className="fuel-hand fuel-hand-reveal">{copy.home.note}</span>
                    <span className="fuel-oily-anchor fuel-oily-anchor-welcome" data-oily-anchor="welcome" aria-hidden="true" />
                    <svg viewBox="0 0 210 42" width="210" height="42" aria-hidden="true">
                      <path
                        className="fuel-draw-line"
                        d="M8 16 C60 28 131 5 198 17 M23 27 C83 34 144 21 184 25"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.2"
                        strokeLinecap="round"
                      />
                    </svg>
                  </div>
                </section>

                {catalog && (
                  <form className="fuel-catalog-search" onSubmit={searchProducts}>
                    <label className="ff-sr-only" htmlFor="fuel-query">
                      {copy.home.search}
                    </label>
                    <input
                      id="fuel-query"
                      type="search"
                      value={search}
                      onChange={(event) => setSearch(event.target.value)}
                      placeholder={copy.home.searchPlaceholder}
                    />
                    <button className="fuel-button" type="submit">
                      {copy.home.searchSubmit}
                    </button>
                  </form>
                )}
                {catalog && (
                  <div className="commerce-search-filters">
                    <label>
                      {commerceCopy.format}
                      <select value={format} onChange={(e) => setFormat(e.target.value)}>
                        <option value="">{commerceCopy.allFormats}</option>
                        {[
                          "digital_file",
                          "service",
                          "license_key",
                          "gift",
                          "personal_account",
                          "shared_account",
                          "subscription"
                        ].map((f) => (
                          <option key={f} value={f}>
                            {t(f)}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label>
                      {commerceCopy.platform}
                      <input
                        value={platform}
                        maxLength={100}
                        placeholder={commerceCopy.anyPlatform}
                        onChange={(e) => setPlatform(e.target.value)}
                      />
                    </label>
                    <label>
                      {commerceCopy.region}
                      <input
                        value={region}
                        maxLength={100}
                        placeholder={commerceCopy.anyRegion}
                        onChange={(e) => setRegion(e.target.value)}
                      />
                    </label>
                  </div>
                )}
                <section className="fuel-feed" aria-labelledby="fuel-feed-title">
                  <div className="fuel-section-head">
                    <div>
                      <span className="fuel-eyebrow">
                        {catalog ? copy.home.results : copy.home.feed}
                      </span>
                      <h2 id="fuel-feed-title">{query ? "«" + query + "»" : copy.home.fresh}</h2>
                    </div>
                    <div className="fuel-feed-tools">
                      <label className="ff-sr-only" htmlFor="fuel-sort">
                        {copy.home.new}
                      </label>
                      <select
                        id="fuel-sort"
                        value={sort}
                        onChange={(event) => setSort(event.target.value)}
                      >
                        <option value="new">{copy.home.new}</option>
                        <option value="price_asc">{copy.home.cheap}</option>
                        <option value="price_desc">{copy.home.expensive}</option>
                      </select>
                      {!catalog && <a href="/marketplace/catalog">{copy.home.all}</a>}
                    </div>
                  </div>
                  <div aria-busy={loading} className="fuel-feed-content">
                    {loading ? (
                      <ProductSkeleton />
                    ) : failed ? (
                      <div className="fuel-empty" role="status">
                        <EmptyInk />
                        <div>
                          <h3>{copy.home.error}</h3>
                          <p>{copy.home.errorText}</p>
                          <button
                            className="fuel-button"
                            onClick={() => setAttempt((value) => value + 1)}
                          >
                            {copy.nav.retry}
                          </button>
                        </div>
                      </div>
                    ) : products.length === 0 ? (
                      <div className="fuel-empty">
                        <EmptyInk />
                        <div>
                          <h3>{copy.home.empty}</h3>
                          <p>{copy.home.emptyText}</p>
                          <a className="fuel-button" href="/marketplace/catalog">
                            {category || query ? copy.home.reset : copy.home.all}
                          </a>
                        </div>
                      </div>
                    ) : (
                      <div className="fuel-product-grid">
                        {products.slice(0, count).map((product) => (
                          <ProductCard key={product.id} product={product} />
                        ))}
                      </div>
                    )}
                  </div>
                  {!loading && !failed && (products.length > count || total > products.length) && (
                    <div className="fuel-more">
                      <button
                        type="button"
                        className="fuel-button fuel-button-outline"
                        disabled={loadingMore}
                        onClick={() => void loadMore()}
                      >
                        {loadingMore
                          ? copy.nav.loading
                          : moreFailed
                            ? copy.nav.retry
                          : copy.home.more}
                      </button>
                      {moreFailed && <p role="status">{copy.home.errorText}</p>}
                    </div>
                  )}
                </section>
                <section className="fuel-discover">
                  <div className="fuel-section-head">
                    <div>
                      <h2>{copy.home.discover}</h2>
                      <p>{copy.home.discoverLead}</p>
                    </div>
                  </div>
                  <div className="fuel-direction-list">
                    {paths.map((path, index) => (
                      <a
                        className="fuel-direction"
                        href={"/marketplace/catalog?category=" + path.slug}
                        key={path.key}
                      >
                        <span className="fuel-direction-number" aria-hidden="true">{String(index + 1).padStart(2, "0")}</span>
                        <span className="fuel-direction-name">{copy.home[path.key]}</span>
                      </a>
                    ))}
                  </div>
                </section>
              </>
            ) : (
              activeAudience === value && <RolePresentation audience={value} sharedOily />
            )}
          </div>
        ))}
        <ExperienceFooter />
      </div>
    </main>
    </OilyStage>
  );
}

export function ProductSkeleton() {
  const { copy } = useExperience();
  return (
    <div className="fuel-product-grid" role="status">
      <span className="ff-sr-only">{copy.nav.loading}</span>
      {[0, 1, 2, 3].map((index) => (
        <div className="fuel-product fuel-product-skeleton" key={index} aria-hidden="true">
          <div className="fuel-product-art fuel-skeleton" />
          <div className="fuel-skeleton-line" />
          <div className="fuel-skeleton-line" />
          <div className="fuel-skeleton-line" />
          <div className="fuel-skeleton-actions" />
        </div>
      ))}
    </div>
  );
}

function EmptyInk() {
  return (
    <svg className="fuel-empty-ink" viewBox="0 0 210 150" fill="none" aria-hidden="true">
      <path d="M18 72 C42 27 89 16 129 47 C155 67 173 61 192 35" />
      <path d="M31 92 C67 70 118 74 164 90 M45 112 C88 103 123 106 152 116" />
    </svg>
  );
}
export function ProductCard({
  product,
  storefront = ""
}: {
  product: Product;
  storefront?: string;
}) {
  const productURL =
    "/marketplace/products/" +
    encodeURIComponent(product.slug) +
    (storefront ? "?storefront=" + encodeURIComponent(storefront) : "");
  const { copy, locale } = useExperience();
  const kind =
    product.kind === "coaching"
      ? "learn"
      : product.kind === "obs_pack"
        ? "stream"
        : product.category?.slug === "digital-services"
          ? "play"
          : "design";
  return (
    <article className="fuel-product">
      <a
        href={productURL}
        className={"fuel-product-art fuel-tone-" + kind}
        aria-label={product.title}
      >
        <ProductCover product={product} />
      </a>
      <div className="fuel-product-meta">
        <span>{product.seller?.display_name ?? copy.home.unknownSeller}</span>
        <span>
          {product.delivery_type === "session"
            ? copy.home.sessionDelivery
            : copy.home[product.delivery_type]}
        </span>
      </div>
      <h3>
        <a href={productURL}>{product.title}</a>
      </h3>
      <strong className="fuel-price">
        {formatMoney({
          amountMinor: product.price_amount_minor,
          currency: product.currency,
          locale,
          trimZeroFraction: true
        })}
      </strong>
      <ProductActions
        product={product}
        attribution={
          storefront ? { storefront, promo_code: "", attribution_choice: "" } : undefined
        }
      />
    </article>
  );
}
