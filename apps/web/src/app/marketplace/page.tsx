"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { formatMoney } from "@fanfuel/i18n";
import { Badge, EmptyState, ProductCard, Skeleton } from "@fanfuel/ui";
import type { Product, ProductCategory } from "@fanfuel/types";
import { AppTopBar } from "../../components/app-chrome";
import { ApiError, getCategories, getProducts } from "../../lib/api";
import { appLocale, dictionary } from "../../lib/i18n";

export default function MarketplacePage() {
  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [category, setCategory] = useState("");
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState("new");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setCategory(params.get("category") ?? "");
    setQuery(params.get("query") ?? "");
    setSort(params.get("sort") ?? "new");
  }, []);

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
  const restrictedCategories = useMemo(
    () => categories.filter((item) => item.status === "restricted"),
    [categories]
  );

  function handleSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
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
    window.history.replaceState(null, "", `/marketplace${params.toString() ? `?${params}` : ""}`);
  }

  return (
    <main className="ff-page">
      <AppTopBar />
      <section className="ff-page-with-topbar ff-wide-page" aria-labelledby="marketplace-title">
        <div className="ff-page-heading">
          <div className="ff-status">{dictionary.common.marketplaceEyebrow}</div>
          <h1 id="marketplace-title">{dictionary.common.marketplaceTitle}</h1>
          <p className="ff-meta">{dictionary.common.marketplaceLead}</p>
        </div>

        <section className="ff-marketplace-benefits" aria-labelledby="marketplace-benefits-title">
          <div>
            <div className="ff-status">{dictionary.common.forBuyersEyebrow}</div>
            <h2 id="marketplace-benefits-title">{dictionary.common.marketplaceBenefitsTitle}</h2>
            <p className="ff-meta">{dictionary.common.marketplaceBenefitsLead}</p>
          </div>
          <article>
            <strong>{dictionary.common.marketplaceBenefitTrustTitle}</strong>
            <span>{dictionary.common.marketplaceBenefitTrustText}</span>
          </article>
          <article>
            <strong>{dictionary.common.marketplaceBenefitCreatorTitle}</strong>
            <span>{dictionary.common.marketplaceBenefitCreatorText}</span>
          </article>
          <article>
            <strong>{dictionary.common.marketplaceBenefitOrdersTitle}</strong>
            <span>{dictionary.common.marketplaceBenefitOrdersText}</span>
          </article>
        </section>

        <form className="ff-marketplace-toolbar" onSubmit={handleSearch} suppressHydrationWarning>
          <label className="ff-field">
            <span>{dictionary.common.marketplaceSearch}</span>
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              suppressHydrationWarning
            />
          </label>
          <label className="ff-field">
            <span>{dictionary.common.marketplaceCategory}</span>
            <select
              value={category}
              onChange={(event) => setCategory(event.target.value)}
              suppressHydrationWarning
            >
              <option value="">{dictionary.common.marketplaceAllCategories}</option>
              {activeCategories.map((item) => (
                <option key={item.id} value={item.slug}>
                  {translateKey(item.name_i18n_key)}
                </option>
              ))}
            </select>
          </label>
          <label className="ff-field">
            <span>{dictionary.common.marketplaceSort}</span>
            <select
              value={sort}
              onChange={(event) => setSort(event.target.value)}
              suppressHydrationWarning
            >
              <option value="new">{dictionary.common.marketplaceSortNew}</option>
              <option value="price_asc">{dictionary.common.marketplaceSortPriceAsc}</option>
              <option value="price_desc">{dictionary.common.marketplaceSortPriceDesc}</option>
            </select>
          </label>
          <button className="ff-button ff-button-primary" type="submit">
            {dictionary.common.marketplaceApplyFilters}
          </button>
        </form>

        {restrictedCategories.length > 0 ? (
          <div className="ff-alert ff-alert-warning">
            {dictionary.common.marketplaceRestrictedNote}
          </div>
        ) : null}

        {error ? <div className="ff-alert ff-alert-danger">{error}</div> : null}

        {isLoading ? (
          <div className="ff-product-grid" aria-label={dictionary.common.loading}>
            <Skeleton className="ff-skeleton-card" />
            <Skeleton className="ff-skeleton-card" />
            <Skeleton className="ff-skeleton-card" />
          </div>
        ) : products.length === 0 ? (
          <EmptyState>
            <strong>{dictionary.common.marketplaceEmptyTitle}</strong>
            <span>{dictionary.common.marketplaceEmptyText}</span>
          </EmptyState>
        ) : (
          <div className="ff-product-grid">
            {products.map((product) => (
              <ProductCard className="ff-product-card-rich" key={product.id}>
                <div className="ff-product-card-head">
                  <Badge tone="info">
                    {product.category
                      ? translateKey(product.category.name_i18n_key)
                      : kindLabel(product.kind)}
                  </Badge>
                  <Badge tone="held">{dictionary.common.safeDealMockBadge}</Badge>
                </div>
                <h2>{product.title}</h2>
                <p className="ff-meta">{product.description}</p>
                <div className="ff-product-card-meta">
                  <strong>
                    {formatMoney({
                      amountMinor: product.price_amount_minor,
                      currency: product.currency,
                      locale: appLocale
                    })}
                  </strong>
                  <span>{product.seller?.display_name ?? dictionary.common.roleSeller}</span>
                </div>
                <a
                  className="ff-button ff-button-secondary"
                  href={`/marketplace/products/${product.id}`}
                >
                  {dictionary.common.marketplaceOpenProduct}
                </a>
              </ProductCard>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}

function translateKey(key: string): string {
  return (dictionary.common as Record<string, string>)[key] ?? key;
}

function kindLabel(kind: Product["kind"]): string {
  return (dictionary.common as Record<string, string>)[`productKind.${kind}`] ?? kind;
}

function getErrorText(error: unknown): string {
  if (error instanceof ApiError) {
    return (
      (dictionary.errors as Record<string, string>)[error.i18nKey] ?? dictionary.common.apiError
    );
  }

  return dictionary.common.apiError;
}
