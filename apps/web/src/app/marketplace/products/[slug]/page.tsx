"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { formatMoney } from "@fanfuel/i18n";
import { Badge, EmptyState, Skeleton } from "@fanfuel/ui";
import type { Product } from "@fanfuel/types";
import { AppTopBar } from "../../../../components/app-chrome";
import { ApiError, getProduct } from "../../../../lib/api";
import { appLocale, dictionary } from "../../../../lib/i18n";
import {
  EquivalentOffers,
  SupportPicker,
  ProductVariant
} from "../../../../components/commerce-shared";
import { initialAttribution, attributionURL, type Quote } from "../../../../lib/commerce";
import { ProductActions } from "../../../../components/market-lists";
import { ProductCover } from "../../../../components/product-cover";

export default function ProductPage() {
  const [attribution, setAttribution] = useState(initialAttribution);
  const [quote, setQuote] = useState<Quote | null>(null);
  const params = useParams<{ slug: string }>();
  const [product, setProduct] = useState<Product | null>(null);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    getProduct(params.slug)
      .then(setProduct)
      .catch((err: unknown) => setError(getErrorText(err)))
      .finally(() => setIsLoading(false));
  }, [params.slug]);

  return (
    <main className="ff-page">
      <AppTopBar />
      <section className="ff-page-with-topbar ff-wide-page">
        {isLoading ? (
          <div className="ff-product-detail">
            <Skeleton className="ff-skeleton-hero" />
            <Skeleton className="ff-skeleton-card" />
          </div>
        ) : !product ? (
          <EmptyState>
            <strong>{dictionary.common.productNotFoundTitle}</strong>
            <span>{error || dictionary.common.productNotFoundText}</span>
            <a className="ff-button ff-button-secondary" href="/marketplace">
              {dictionary.common.navMarketplace}
            </a>
          </EmptyState>
        ) : (
          <div className="ff-product-detail">
            <article className="ff-product-main" aria-labelledby="product-title">
              <div className="ff-product-card-head">
                <Badge tone="info">
                  {product.category
                    ? translateKey(product.category.name_i18n_key)
                    : kindLabel(product.kind)}
                </Badge>
                <Badge tone="success">{productStatusLabel(product.status)}</Badge>
                <Badge tone="held">{dictionary.common.safeDealMockBadge}</Badge>
              </div>
              <h1 id="product-title">{product.title}</h1>
              <ProductVariant product={product} />
              <ProductActions product={product} attribution={attribution} />
              <p className="ff-meta">{product.description}</p>
              <div className="ff-product-preview fuel-product-art">
                <ProductCover product={product} />
              </div>
              <section className="ff-stack" aria-labelledby="product-terms">
                <h2 id="product-terms">{dictionary.common.productTermsTitle}</h2>
                <p>{product.terms}</p>
              </section>
              <EquivalentOffers id={product.id} />
              <section className="ff-stack" aria-labelledby="product-reviews">
                <h2 id="product-reviews">{dictionary.common.productReviewsTitle}</h2>
                {product.reviews && product.reviews.length > 0 ? (
                  product.reviews.map((review) => (
                    <article className="ff-review-row" key={review.id}>
                      <strong>
                        {dictionary.common.productRatingLabel}: {review.rating}/5
                      </strong>
                      <p className="ff-meta">
                        {review.text || dictionary.common.productReviewNoText}
                      </p>
                    </article>
                  ))
                ) : (
                  <EmptyState>
                    <span>{dictionary.common.productReviewsEmpty}</span>
                  </EmptyState>
                )}
              </section>
            </article>

            <aside className="ff-product-side">
              <div className="ff-panel ff-stack">
                <div>
                  <span className="ff-meta">{dictionary.common.productPrice}</span>
                  <strong className="ff-price">
                    {formatMoney({
                      amountMinor: product.price_amount_minor,
                      currency: product.currency,
                      locale: appLocale
                    })}
                  </strong>
                </div>
                <div>
                  <span className="ff-meta">{dictionary.common.productSeller}</span>
                  <strong>{product.seller?.display_name ?? dictionary.common.roleSeller}</strong>
                  <p className="ff-meta">
                    {dictionary.common.productSellerRating}:{" "}
                    {product.seller?.rating_avg.toFixed(1) ?? "0.0"} / 5
                  </p>
                </div>
                <div className="ff-alert ff-alert-info">{dictionary.common.safeDealMockText}</div>
                <SupportPicker
                  id={product.id}
                  value={attribution}
                  onChange={setAttribution}
                  onResolved={setQuote}
                />
                <a
                  className="ff-button ff-button-primary"
                  aria-disabled={quote?.choice_required}
                  href={attributionURL(`/checkout/${product.id}`, attribution)}
                >
                  {dictionary.common.productBuyAction}
                </a>
                <a className="ff-button ff-button-secondary" href="/marketplace">
                  {dictionary.common.marketplaceBack}
                </a>
              </div>
            </aside>
          </div>
        )}
      </section>
    </main>
  );
}

function translateKey(key: string): string {
  return (dictionary.common as Record<string, string>)[key] ?? key;
}

function productStatusLabel(status: Product["status"]): string {
  const labels: Record<Product["status"], string> = {
    draft: dictionary.common.statusDraft,
    pending_moderation: dictionary.common.statusModerationPending,
    published: dictionary.common.statusPublished,
    rejected: dictionary.common.statusRejected,
    hidden: dictionary.common.statusHidden,
    archived: dictionary.common.statusArchived
  };

  return labels[status] ?? dictionary.common.notAvailable;
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
