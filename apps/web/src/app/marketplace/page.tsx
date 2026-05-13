"use client";

import { type MouseEvent, type ReactNode, useEffect, useMemo, useState } from "react";
import { formatMoney } from "@fanfuel/i18n";
import { Badge, EmptyState, ProductCard, Skeleton } from "@fanfuel/ui";
import type { Product, ProductCategory } from "@fanfuel/types";
import { usePathname } from "next/navigation";
import { AppTopBar } from "../../components/app-chrome";
import { ApiError, getCategories, getProducts } from "../../lib/api";
import { appLocale, dictionary } from "../../lib/i18n";

type ExplainerKey = "safeDeal" | "creatorPromos" | "verifiedSellers";

interface MarketplaceAction {
  labelKey?: string;
  label?: string;
  categorySlugs?: string[];
  query?: string;
  sort?: string;
}

interface CreatorCollection {
  id: string;
  avatar: string;
  slug: string;
  nameKey: string;
  titleKey: string;
  query: string;
}

const HERO_EXPLAINERS: Array<{
  key: ExplainerKey;
  titleKey: string;
  textKey: string;
}> = [
  {
    key: "safeDeal",
    titleKey: "marketplaceHeroSafeDealTitle",
    textKey: "marketplaceHeroSafeDealText"
  },
  {
    key: "creatorPromos",
    titleKey: "marketplaceHeroPromosTitle",
    textKey: "marketplaceHeroPromosText"
  },
  {
    key: "verifiedSellers",
    titleKey: "marketplaceHeroVerifiedTitle",
    textKey: "marketplaceHeroVerifiedText"
  }
];

const FALLBACK_QUICK_ACTIONS: MarketplaceAction[] = [
  {
    labelKey: "marketplaceQuickObs",
    categorySlugs: ["obs-packs"],
    query: "OBS"
  },
  {
    labelKey: "marketplaceQuickAlerts",
    categorySlugs: ["obs-packs"],
    query: "Р°Р»РµСЂС‚С‹"
  },
  {
    labelKey: "marketplaceQuickDesign",
    categorySlugs: ["design-assets"],
    query: "РѕС„РѕСЂРјР»РµРЅРёРµ"
  },
  {
    labelKey: "marketplaceQuickCoaching",
    categorySlugs: ["coaching"],
    query: "РєРѕСѓС‡РёРЅРі"
  },
  {
    labelKey: "marketplaceQuickServices",
    categorySlugs: ["digital-services"],
    query: "СѓСЃР»СѓРіРё"
  }
];

const CREATOR_COLLECTIONS: CreatorCollection[] = [
  {
    id: "w4veshift",
    avatar: "W4",
    slug: "w4veshift",
    nameKey: "marketplaceAuthorWaveshiftName",
    titleKey: "marketplaceAuthorWaveshiftTitle",
    query: "СЃС‚СЂРёРј"
  },
  {
    id: "starter-obs",
    avatar: "OB",
    slug: "starter-obs",
    nameKey: "marketplaceAuthorStarterObsName",
    titleKey: "marketplaceAuthorStarterObsTitle",
    query: "OBS"
  },
  {
    id: "game-week",
    avatar: "GW",
    slug: "game-week",
    nameKey: "marketplaceAuthorGameWeekName",
    titleKey: "marketplaceAuthorGameWeekTitle",
    query: "РёРіСЂРѕРІС‹Рµ СѓСЃР»СѓРіРё"
  }
];

export default function MarketplacePage() {
  const pathname = usePathname();
  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [category, setCategory] = useState("");
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState("new");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const marketplacePath = pathname === "/" ? "/" : "/marketplace";

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const nextQuery = params.get("query") ?? "";
    setCategory(params.get("category") ?? "");
    setQuery(nextQuery);
    setSort(params.get("sort") ?? "new");
  }, []);

  useEffect(() => {
    resetHorizontalMarketplaceScroll();
  }, []);

  useEffect(() => {
    if (!isLoading) {
      resetHorizontalMarketplaceScroll();
    }
  }, [categories.length, category, isLoading, products.length, query, sort]);

  useEffect(() => {
    setIsLoading(true);
    setError("");
    Promise.all([getCategories(true), getProducts({ category, query, sort })])
      .then(([categoryResponse, productResponse]) => {
        setCategories(categoryResponse.items);
        setProducts(productResponse.items);
      })
      .catch((err: unknown) => setError(getErrorText(err)))
      .finally(() => setIsLoading(false));
  }, [category, query, sort]);

  const activeCategories = useMemo(
    () => categories.filter((item) => item.status === "active"),
    [categories]
  );
  const quickActions = useMemo<MarketplaceAction[]>(
    () =>
      activeCategories.length > 0
        ? activeCategories.slice(0, 5).map((item) => ({
            label: translateKey(item.name_i18n_key),
            categorySlugs: [item.slug],
            query: translateKey(item.name_i18n_key)
          }))
        : FALLBACK_QUICK_ACTIONS,
    [activeCategories]
  );
  const featuredCategoryAction = useMemo<MarketplaceAction>(
    () => ({
      labelKey: "marketplacePopularOpen",
      categorySlugs: ["obs-packs", activeCategories[0]?.slug ?? ""].filter(Boolean),
      query: "OBS"
    }),
    [activeCategories]
  );
  const popularProducts = useMemo(
    () =>
      [...products]
        .sort((left, right) => {
          const leftRating = left.seller?.rating_avg ?? 0;
          const rightRating = right.seller?.rating_avg ?? 0;
          const leftReviews = left.seller?.rating_count ?? 0;
          const rightReviews = right.seller?.rating_count ?? 0;
          return rightRating - leftRating || rightReviews - leftReviews;
        })
        .slice(0, 7),
    [products]
  );
  const newProducts = useMemo(() => products.slice(0, 8), [products]);
  const heroProduct = popularProducts[0] ?? newProducts[0];

  function handleShowCategories(event: MouseEvent<HTMLAnchorElement>) {
    event.preventDefault();
    updateMarketplaceState({ category: "", query: "", sort: "new" });
    window.requestAnimationFrame(() => {
      document.getElementById("market-categories")?.scrollIntoView({
        block: "center",
        behavior: "smooth"
      });
    });
  }

  function handleAction(event: MouseEvent<HTMLAnchorElement>, action: MarketplaceAction) {
    event.preventDefault();
    const next = resolveAction(action, activeCategories);
    updateMarketplaceState(next, true);
  }

  function updateMarketplaceState(
    next: { category?: string; query?: string; sort?: string },
    scrollToCatalog = false
  ) {
    const nextCategory = next.category ?? "";
    const nextQuery = next.query ?? "";
    const nextSort = next.sort ?? "new";
    setCategory(nextCategory);
    setQuery(nextQuery);
    setSort(nextSort);
    writeMarketplaceUrl(nextCategory, nextQuery, nextSort, marketplacePath);

    if (scrollToCatalog) {
      window.requestAnimationFrame(() => {
        document.getElementById("marketplace-list")?.scrollIntoView({
          block: "start",
          behavior: "smooth"
        });
      });
    }
  }

  return (
    <main className="ff-page">
      <AppTopBar />
      <section
        className="ff-page-with-topbar ff-wide-page ff-market-home"
        aria-labelledby="marketplace-title"
      >
        <section className="ff-market-hero" aria-labelledby="marketplace-title">
          <div className="ff-market-hero-copy">
            <div className="ff-status">{dictionary.common.marketplaceEyebrow}</div>
            <h1 id="marketplace-title">
              <span>{dictionary.common.marketplaceTitlePrimary} </span>
              <span className="ff-market-title-accent">
                {dictionary.common.marketplaceTitleAccent}
              </span>
            </h1>
            <p className="ff-meta">{dictionary.common.marketplaceLead}</p>

            <div
              className="ff-market-hero-pills"
              aria-label={dictionary.common.marketplaceHeroFacts}
            >
              {HERO_EXPLAINERS.map((item) => (
                <span key={item.key}>
                  <strong>{translateKey(item.titleKey)}</strong>
                </span>
              ))}
            </div>

            <section
              className="ff-market-audience-tabs"
              aria-label={dictionary.common.roleNavigation}
            >
              <a className="ff-market-audience-tab" href="/for-buyers">
                {dictionary.common.navForBuyers}
              </a>
              <a className="ff-market-audience-tab" href="/for-streamers">
                {dictionary.common.navForStreamers}
              </a>
              <a className="ff-market-audience-tab" href="/for-sellers">
                {dictionary.common.navForSellers}
              </a>
            </section>
          </div>

          <MarketplaceHeroShowcase isLoading={isLoading} product={heroProduct} />
        </section>

        <div
          className="ff-market-quick-row"
          id="market-categories"
          aria-label={dictionary.common.marketplaceQuickCategories}
        >
          {quickActions.map((action) => (
            <a
              className="ff-chip ff-market-quick-chip"
              href={buildActionHref(action, activeCategories, marketplacePath)}
              key={getActionText(action)}
              onClick={(event) => handleAction(event, action)}
            >
              {getActionText(action)}
            </a>
          ))}
        </div>

        {error ? <div className="ff-alert ff-alert-danger">{error}</div> : null}

        <section className="ff-market-section" id="popular-now" aria-labelledby="popular-now-title">
          <div className="ff-market-section-heading">
            <div>
              {/* <span className="ff-status">{dictionary.common.marketplacePopularEyebrow}</span> */}
              <h2 id="popular-now-title">{dictionary.common.marketplacePopularTitle}</h2>
            </div>
            <a
              className="ff-market-section-link"
              href={buildActionHref(featuredCategoryAction, activeCategories, marketplacePath)}
              onClick={(event) => handleAction(event, featuredCategoryAction)}
              aria-label={dictionary.common.marketplacePopularOpen}
            >
              <span>{dictionary.common.marketplaceOpenSection}</span>
              <strong aria-hidden="true">{"\u2192"}</strong>
            </a>
          </div>
          <ProductShelf
            products={popularProducts}
            isLoading={isLoading}
            allAction={featuredCategoryAction}
            onAction={handleAction}
            onShowCategories={handleShowCategories}
            marketplacePath={marketplacePath}
          />
        </section>

        <section
          className="ff-market-section"
          id="creator-picks"
          aria-labelledby="creator-picks-title"
        >
          <div className="ff-market-section-heading">
            <div>
              {/* <span className="ff-status">{dictionary.common.marketplaceCreatorEyebrow}</span> */}
              <h2 id="creator-picks-title">{dictionary.common.marketplaceCreatorTitle}</h2>
            </div>
          </div>

          <div className="ff-market-author-stack">
            {CREATOR_COLLECTIONS.map((collection, index) => (
              <AuthorCollection
                collection={collection}
                products={pickCollectionProducts(products, index)}
                isLoading={isLoading}
                key={collection.id}
                onAction={handleAction}
                onShowCategories={handleShowCategories}
                marketplacePath={marketplacePath}
              />
            ))}
          </div>
        </section>

        <section className="ff-market-section" aria-labelledby="market-trust-title">
          <div className="ff-market-section-heading">
            <div>
              {/* <span className="ff-status">{dictionary.common.marketplaceTrustEyebrow}</span> */}
              <h2 id="market-trust-title">{dictionary.common.marketplaceTrustTitle}</h2>
            </div>
          </div>
          <div className="ff-market-trust-grid">
            <article>
              <strong>{dictionary.common.marketplaceTrustVisibleTitle}</strong>
              <span>{dictionary.common.marketplaceTrustVisibleText}</span>
            </article>
            <article>
              <strong>{dictionary.common.marketplaceTrustCreatorTitle}</strong>
              <span>{dictionary.common.marketplaceTrustCreatorText}</span>
            </article>
            <article>
              <strong>{dictionary.common.marketplaceTrustSafeDealTitle}</strong>
              <span>{dictionary.common.marketplaceTrustSafeDealText}</span>
            </article>
          </div>
        </section>

        <section
          className="ff-market-section"
          id="marketplace-list"
          aria-labelledby="marketplace-list-title"
        >
          <div className="ff-market-section-heading">
            <div>
              {/* <span className="ff-status">{dictionary.common.marketplaceNewEyebrow}</span> */}
              <h2 id="marketplace-list-title">{dictionary.common.marketplaceNewTitle}</h2>
            </div>
          </div>

          {isLoading ? (
            <div className="ff-market-feed-grid" aria-label={dictionary.common.loading}>
              <Skeleton className="ff-skeleton-card" />
              <Skeleton className="ff-skeleton-card" />
              <Skeleton className="ff-skeleton-card" />
              <Skeleton className="ff-skeleton-card" />
            </div>
          ) : newProducts.length === 0 ? (
            <MarketplaceEmptyState onShowCategories={handleShowCategories} />
          ) : (
            <div className="ff-market-feed-grid">
              {newProducts.map((product) => (
                <MarketplaceProductTile compact key={product.id} product={product} />
              ))}
            </div>
          )}
        </section>
      </section>
    </main>
  );
}

function MarketplaceHeroShowcase({
  product,
  isLoading
}: {
  product?: Product;
  isLoading: boolean;
}) {
  return (
    <aside
      className="ff-market-hero-aside"
      aria-label={dictionary.common.marketplaceHeroProductAria}
    >
      <article className="ff-market-featured-product">
        {isLoading ? (
          <Skeleton className="ff-market-featured-skeleton" />
        ) : product ? (
          <MarketplaceFeaturedProduct product={product} />
        ) : (
          <div className="ff-market-featured-empty">
            <strong>{dictionary.common.marketplaceEmptyTitle}</strong>
            <span>{dictionary.common.marketplaceEmptyText}</span>
          </div>
        )}
      </article>

      <div className="ff-market-hero-flow">
        <strong>{dictionary.common.marketplaceHeroFlowTitle}</strong>
        <div className="ff-market-hero-flow-step">
          <span>01</span>
          <p>
            <b>{dictionary.common.marketplaceHeroBuyerStepTitle}</b>
            <small>{dictionary.common.marketplaceHeroBuyerStepText}</small>
          </p>
        </div>
        <div className="ff-market-hero-flow-step">
          <span>02</span>
          <p>
            <b>{dictionary.common.marketplaceHeroSellerStepTitle}</b>
            <small>{dictionary.common.marketplaceHeroSellerStepText}</small>
          </p>
        </div>
        <div className="ff-market-hero-flow-step">
          <span>03</span>
          <p>
            <b>{dictionary.common.marketplaceHeroCreatorStepTitle}</b>
            <small>{dictionary.common.marketplaceHeroCreatorStepText}</small>
          </p>
        </div>
      </div>
    </aside>
  );
}

function MarketplaceFeaturedProduct({ product }: { product: Product }) {
  const sellerName = product.seller?.display_name ?? dictionary.common.roleSeller;
  const rating = getRatingLabel(product);
  const hasRating = hasProductRating(product);

  return (
    <a href={`/marketplace/products/${product.slug}`} className="ff-market-featured-link">
      <div
        className={`ff-market-featured-media ff-market-product-media-${product.kind}`}
        aria-hidden="true"
      >
        <span>{dictionary.common.marketplaceHeroFeaturedBadge}</span>
      </div>
      <div className="ff-market-featured-body">
        <div className="ff-market-product-meta ff-market-featured-meta">
          <b>
            {formatMoney({
              amountMinor: product.price_amount_minor,
              currency: product.currency,
              locale: appLocale,
              trimZeroFraction: true
            })}
          </b>
          <span className="ff-market-rating">
            {hasRating ? (
              <span className="ff-market-rating-star" aria-hidden="true">
                {"\u2605"}
              </span>
            ) : null}
            {rating}
          </span>
        </div>
        <strong>{product.title}</strong>
        <small>{sellerName}</small>
        <div className="ff-market-product-badges ff-market-featured-badges">
          <Badge tone="warning">{dictionary.common.marketplaceHeroFeaturedBadge}</Badge>
          {product.safe_deal_required ? (
            <MarketplaceBadge kind="safe">
              {dictionary.common.marketplaceSafeDealBadge}
            </MarketplaceBadge>
          ) : null}
          {isVerifiedAuthorProduct(product) ? (
            <MarketplaceBadge kind="author">
              {dictionary.common.marketplaceFromAuthorBadge}
            </MarketplaceBadge>
          ) : null}
        </div>
      </div>
    </a>
  );
}

function ProductShelf({
  products,
  isLoading,
  leadingItem,
  showAuthorSupportBadge = false,
  allAction,
  onAction,
  onShowCategories,
  marketplacePath
}: {
  products: Product[];
  isLoading: boolean;
  leadingItem?: ReactNode;
  showAuthorSupportBadge?: boolean;
  allAction: MarketplaceAction;
  onAction: (event: MouseEvent<HTMLAnchorElement>, action: MarketplaceAction) => void;
  onShowCategories: (event: MouseEvent<HTMLAnchorElement>) => void;
  marketplacePath: string;
}) {
  const shelfClassName = `ff-market-shelf-wrap${
    leadingItem ? " ff-market-shelf-wrap-with-leading" : ""
  }`;

  if (isLoading) {
    return (
      <div className={shelfClassName}>
        <div className="ff-market-shelf-row" aria-label={dictionary.common.loading}>
          {leadingItem}
          {Array.from({ length: 6 }).map((_, index) => (
            <Skeleton className="ff-market-shelf-skeleton" key={index} />
          ))}
        </div>
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <MarketplaceEmptyState
        className="ff-market-empty-inline"
        onShowCategories={onShowCategories}
      />
    );
  }

  return (
    <div className={shelfClassName}>
      <div className="ff-market-shelf-row">
        {leadingItem}
        {products.map((product) => (
          <MarketplaceProductTile
            key={product.id}
            product={product}
            showAuthorSupportBadge={showAuthorSupportBadge}
          />
        ))}
        <a
          className="ff-market-open-all"
          href={buildActionHref(allAction, [], marketplacePath)}
          onClick={(event) => onAction(event, allAction)}
        >
          <span aria-hidden="true">{"\u2192"}</span>
          <strong>{dictionary.common.marketplaceOpenCollection}</strong>
          <small>{dictionary.common.marketplaceOpenCollectionText}</small>
        </a>
      </div>
    </div>
  );
}

function AuthorCollection({
  collection,
  products,
  isLoading,
  onAction,
  onShowCategories,
  marketplacePath
}: {
  collection: CreatorCollection;
  products: Product[];
  isLoading: boolean;
  onAction: (event: MouseEvent<HTMLAnchorElement>, action: MarketplaceAction) => void;
  onShowCategories: (event: MouseEvent<HTMLAnchorElement>) => void;
  marketplacePath: string;
}) {
  const action: MarketplaceAction = {
    query: collection.query,
    labelKey: "marketplaceOpenCollection"
  };
  const name = translateKey(collection.nameKey);

  return (
    <section className="ff-market-author-collection" aria-labelledby={`${collection.id}-title`}>
      <a
        className="ff-market-author ff-market-author-side"
        href={`/creators/${collection.slug}`}
        aria-label={`${dictionary.common.marketplaceOpenCreatorPage}: ${name}`}
      >
        <span className="ff-market-author-avatar">{collection.avatar}</span>
        <strong>{name}</strong>
      </a>
      <div className="ff-market-author-products">
        <div className="ff-market-author-heading">
          <h3 id={`${collection.id}-title`}>{translateKey(collection.titleKey)}</h3>
          <a
            className="ff-market-section-link"
            href={buildActionHref(action, [], marketplacePath)}
            onClick={(event) => onAction(event, action)}
            aria-label={dictionary.common.marketplaceOpenCollection}
          >
            <span>{dictionary.common.marketplaceOpenSection}</span>
            <strong aria-hidden="true">{"\u2192"}</strong>
          </a>
        </div>
        <ProductShelf
          products={products}
          isLoading={isLoading}
          leadingItem={
            <a
              className="ff-market-author ff-market-author-inline"
              href={`/creators/${collection.slug}`}
              aria-label={`${dictionary.common.marketplaceOpenCreatorPage}: ${name}`}
            >
              <span className="ff-market-author-avatar">{collection.avatar}</span>
              <strong>{name}</strong>
            </a>
          }
          showAuthorSupportBadge
          allAction={action}
          onAction={onAction}
          onShowCategories={onShowCategories}
          marketplacePath={marketplacePath}
        />
      </div>
    </section>
  );
}

function MarketplaceProductTile({
  product,
  compact = false,
  showAuthorSupportBadge = false
}: {
  product: Product;
  compact?: boolean;
  showAuthorSupportBadge?: boolean;
}) {
  const sellerName = product.seller?.display_name ?? dictionary.common.roleSeller;
  const categoryLabel = product.category
    ? translateKey(product.category.name_i18n_key)
    : kindLabel(product.kind);
  const rating = getRatingLabel(product);
  const hasRating = hasProductRating(product);
  const hasSafeDeal = product.safe_deal_required;
  const hasAuthorSupport = showAuthorSupportBadge && product.affiliate_percent_bps > 0;
  const hasFromAuthor = isVerifiedAuthorProduct(product);

  return (
    <ProductCard
      className={`ff-market-product-tile${compact ? " ff-market-product-tile-compact" : ""}`}
    >
      <a className="ff-market-product-link" href={`/marketplace/products/${product.id}`}>
        <div
          className={`ff-market-product-media ff-market-product-media-${product.kind}`}
          aria-hidden="true"
        >
          <span>{categoryLabel}</span>
        </div>
        <div className="ff-market-product-body">
          <div className="ff-market-product-meta">
            <b>
              {formatMoney({
                amountMinor: product.price_amount_minor,
                currency: product.currency,
                locale: appLocale,
                trimZeroFraction: true
              })}
            </b>
            <span className="ff-market-rating">
              {hasRating ? (
                <span className="ff-market-rating-star" aria-hidden="true">
                  {"\u2605"}
                </span>
              ) : null}
              {rating}
            </span>
          </div>
          <strong className="ff-market-product-title">{product.title}</strong>
          <span className="ff-market-product-seller">{sellerName}</span>
          {hasSafeDeal || hasFromAuthor || hasAuthorSupport ? (
            <div className="ff-market-product-badges">
              {hasSafeDeal ? (
                <MarketplaceBadge kind="safe">
                  {dictionary.common.marketplaceSafeDealBadge}
                </MarketplaceBadge>
              ) : null}
              {hasFromAuthor ? (
                <MarketplaceBadge kind="author">
                  {dictionary.common.marketplaceFromAuthorBadge}
                </MarketplaceBadge>
              ) : null}
              {hasAuthorSupport ? (
                <MarketplaceBadge kind="support">
                  {dictionary.common.marketplaceAuthorSupportBadge}
                </MarketplaceBadge>
              ) : null}
            </div>
          ) : null}
        </div>
      </a>
    </ProductCard>
  );
}

function MarketplaceBadge({
  kind,
  children
}: {
  kind: "safe" | "support" | "author";
  children: ReactNode;
}) {
  return (
    <Badge className={`ff-market-badge ff-market-badge-${kind}`}>
      <span className={`ff-market-badge-icon ff-market-badge-icon-${kind}`} aria-hidden="true" />
      {children}
    </Badge>
  );
}

function resolveAction(
  action: MarketplaceAction,
  activeCategories: ProductCategory[]
): { category: string; query: string; sort: string } {
  const categorySlug =
    action.categorySlugs?.find((slug) => activeCategories.some((item) => item.slug === slug)) ?? "";

  return {
    category: categorySlug,
    query: categorySlug ? "" : (action.query ?? ""),
    sort: action.sort ?? "new"
  };
}

function buildActionHref(
  action: MarketplaceAction,
  activeCategories: ProductCategory[],
  basePath: string
): string {
  const next = resolveAction(action, activeCategories);
  const params = new URLSearchParams();
  if (next.category) {
    params.set("category", next.category);
  }
  if (next.query) {
    params.set("query", next.query);
  }
  if (next.sort && next.sort !== "new") {
    params.set("sort", next.sort);
  }
  const queryString = params.toString();
  return `${basePath}${queryString ? `?${queryString}` : ""}`;
}

function writeMarketplaceUrl(category: string, query: string, sort: string, basePath: string) {
  const params = new URLSearchParams();
  if (category) {
    params.set("category", category);
  }
  if (query) {
    params.set("query", query);
  }
  if (sort && sort !== "new") {
    params.set("sort", sort);
  }
  window.history.replaceState(null, "", `${basePath}${params.toString() ? `?${params}` : ""}`);
}

function resetHorizontalMarketplaceScroll() {
  const reset = () => {
    document
      .querySelectorAll<HTMLElement>(".ff-market-shelf-row, .ff-market-quick-row")
      .forEach((node) => {
        node.scrollTo({ left: 0, behavior: "auto" });
      });
  };

  window.requestAnimationFrame(() => {
    reset();
    window.requestAnimationFrame(reset);
  });
  window.setTimeout(reset, 120);
}

function MarketplaceEmptyState({
  className = "",
  onShowCategories
}: {
  className?: string;
  onShowCategories: (event: MouseEvent<HTMLAnchorElement>) => void;
}) {
  return (
    <EmptyState className={`ff-market-empty-state ${className}`.trim()}>
      <strong>{dictionary.common.marketplaceEmptyTitle}</strong>
      <span>{dictionary.common.marketplaceEmptyText}</span>
      <div className="ff-market-empty-actions">
        <a className="ff-button ff-button-primary" href="/for-sellers">
          {dictionary.common.marketplaceEmptySellerAction}
        </a>
        <a
          className="ff-button ff-button-secondary"
          href="#market-categories"
          onClick={onShowCategories}
        >
          {dictionary.common.marketplaceEmptyCategoriesAction}
        </a>
      </div>
    </EmptyState>
  );
}

function pickCollectionProducts(products: Product[], index: number): Product[] {
  if (products.length === 0) {
    return [];
  }

  const rotated = [...products.slice(index * 2), ...products.slice(0, index * 2)];
  return rotated.slice(0, 7);
}

function getActionText(action: MarketplaceAction): string {
  if (action.label) {
    return action.label;
  }

  return action.labelKey
    ? translateKey(action.labelKey)
    : (action.query ?? dictionary.common.openMarketplace);
}

function translateKey(key: string): string {
  return (dictionary.common as Record<string, string>)[key] ?? key;
}

function kindLabel(kind: Product["kind"]): string {
  return (dictionary.common as Record<string, string>)[`productKind.${kind}`] ?? kind;
}

function getRatingLabel(product: Product): string {
  const rating = product.seller?.rating_avg ?? 0;
  const count = product.seller?.rating_count ?? 0;

  if (!hasProductRating(product)) {
    return dictionary.common.marketplaceNewSeller;
  }

  if (count > 0) {
    return `${formatRating(rating)} (${count})`;
  }

  return `${formatRating(rating)} В· ${count}`;
}

function formatRating(value: number): string {
  return new Intl.NumberFormat(appLocale, {
    maximumFractionDigits: 1,
    minimumFractionDigits: value % 1 === 0 ? 0 : 1
  }).format(value);
}

function hasProductRating(product: Product): boolean {
  const rating = product.seller?.rating_avg ?? 0;
  const count = product.seller?.rating_count ?? 0;

  return count > 0 && rating > 0;
}

function isVerifiedAuthorProduct(product: Product): boolean {
  return product.seller?.seller_type === "pro" && product.seller.verification_status === "approved";
}

function getErrorText(error: unknown): string {
  if (error instanceof ApiError) {
    return (
      (dictionary.errors as Record<string, string>)[error.i18nKey] ?? dictionary.common.apiError
    );
  }

  return dictionary.common.apiError;
}
