"use client";

import { useEffect, useState } from "react";
import { formatMoney } from "@fanfuel/i18n";
import { Alert, Badge, EmptyState, ProductCard, Skeleton } from "@fanfuel/ui";
import type { Product } from "@fanfuel/types";
import { AppTopBar } from "../../../components/app-chrome";
import { ApiError, getSellerProducts, getStoredToken, submitSellerProduct } from "../../../lib/api";
import { appLocale, dictionary } from "../../../lib/i18n";

export default function SellerProductsPage() {
  const [token, setToken] = useState("");
  const [products, setProducts] = useState<Product[]>([]);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [submittingId, setSubmittingId] = useState("");

  useEffect(() => {
    const storedToken = getStoredToken();
    setToken(storedToken);

    if (!storedToken) {
      setIsLoading(false);
      return;
    }

    setError("");
    setIsLoading(true);
    getSellerProducts(storedToken)
      .then((response) => setProducts(response.items))
      .catch((err: unknown) => setError(getErrorText(err)))
      .finally(() => setIsLoading(false));
  }, []);

  async function handleSubmit(product: Product) {
    setError("");
    setMessage("");
    setSubmittingId(product.id);

    try {
      const updated = await submitSellerProduct(token, product.id);
      setProducts((current) => current.map((item) => (item.id === updated.id ? updated : item)));
      setMessage(dictionary.common.productSubmittedMessage);
    } catch (err) {
      setError(getErrorText(err));
    } finally {
      setSubmittingId("");
    }
  }

  return (
    <main className="ff-page">
      <AppTopBar />
      <section className="ff-page-with-topbar ff-wide-page" aria-labelledby="seller-products-title">
        <div className="ff-page-heading">
          <div className="ff-status">{dictionary.common.navSellerProducts}</div>
          <h1 id="seller-products-title">{dictionary.common.sellerProductsTitle}</h1>
          <p className="ff-meta">{dictionary.common.sellerProductsLead}</p>
          <div className="ff-actions">
            <a className="ff-button ff-button-primary" href="/seller/products/new">
              {dictionary.common.createProduct}
            </a>
            <a className="ff-button ff-button-secondary" href="/seller">
              {dictionary.common.navSeller}
            </a>
          </div>
        </div>

        {!token ? (
          <EmptyState>
            <strong>{dictionary.common.checkoutLoginRequiredTitle}</strong>
            <span>{dictionary.common.checkoutLoginRequiredText}</span>
          </EmptyState>
        ) : isLoading ? (
          <div className="ff-product-grid">
            <Skeleton className="ff-skeleton-card" />
            <Skeleton className="ff-skeleton-card" />
            <Skeleton className="ff-skeleton-card" />
          </div>
        ) : products.length === 0 ? (
          <EmptyState>
            <strong>{dictionary.common.sellerProductsEmptyTitle}</strong>
            <span>{dictionary.common.sellerProductsEmptyText}</span>
            <a className="ff-button ff-button-primary" href="/seller/products/new">
              {dictionary.common.createProduct}
            </a>
          </EmptyState>
        ) : (
          <div className="ff-product-grid">
            {products.map((product) => (
              <ProductCard className="ff-product-card-rich" key={product.id}>
                <div className="ff-product-card-head">
                  <Badge tone={product.status === "published" ? "success" : "warning"}>
                    {productStatusLabel(product.status)}
                  </Badge>
                  <Badge tone="info">{deliveryTypeLabel(product.delivery_type)}</Badge>
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
                  <span>{kindLabel(product.kind)}</span>
                </div>
                {product.status === "draft" || product.status === "rejected" ? (
                  <button
                    className="ff-button ff-button-primary"
                    type="button"
                    disabled={submittingId === product.id}
                    onClick={() => void handleSubmit(product)}
                  >
                    {submittingId === product.id
                      ? dictionary.common.loading
                      : dictionary.common.submitToModeration}
                  </button>
                ) : null}
              </ProductCard>
            ))}
          </div>
        )}

        {error ? <Alert tone="danger">{error}</Alert> : null}
        {message ? <Alert tone="success">{message}</Alert> : null}
      </section>
    </main>
  );
}

function productStatusLabel(status: Product["status"]): string {
  return (dictionary.common as Record<string, string>)[`productStatus.${status}`] ?? status;
}

function kindLabel(kind: Product["kind"]): string {
  return (dictionary.common as Record<string, string>)[`productKind.${kind}`] ?? kind;
}

function deliveryTypeLabel(deliveryType: Product["delivery_type"]): string {
  return (
    (dictionary.common as Record<string, string>)[`deliveryType.${deliveryType}`] ?? deliveryType
  );
}

function getErrorText(error: unknown): string {
  if (error instanceof ApiError) {
    return (
      (dictionary.errors as Record<string, string>)[error.i18nKey] ?? dictionary.common.apiError
    );
  }

  return dictionary.common.apiError;
}
