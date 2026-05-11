"use client";

import { useEffect, useMemo, useState } from "react";
import { formatMoney } from "@fanfuel/i18n";
import { Badge, EmptyState, Skeleton, StatCard } from "@fanfuel/ui";
import type { CurrencyCode, OrderDetail, Product } from "@fanfuel/types";
import { AppTopBar } from "../../components/app-chrome";
import { ApiError, getSellerOrders, getSellerProducts, getStoredToken } from "../../lib/api";
import { appLocale, dictionary } from "../../lib/i18n";

export default function SellerDashboardPage() {
  const [token, setToken] = useState("");
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<OrderDetail[]>([]);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const storedToken = getStoredToken();
    setToken(storedToken);

    if (!storedToken) {
      setIsLoading(false);
      return;
    }

    Promise.all([getSellerProducts(storedToken), getSellerOrders(storedToken)])
      .then(([productResponse, orderResponse]) => {
        setProducts(productResponse.items);
        setOrders(orderResponse.items);
      })
      .catch((err: unknown) => setError(getErrorText(err)))
      .finally(() => setIsLoading(false));
  }, []);

  const revenue = useMemo(() => formatSellerTotals(orders.filter((item) => item.order.status === "completed")), [orders]);
  const pendingProducts = products.filter((item) => item.status === "pending_moderation").length;

  return (
    <main className="ff-page">
      <AppTopBar />
      <section className="ff-page-with-topbar ff-wide-page" aria-labelledby="seller-title">
        <div className="ff-page-heading">
          <div className="ff-status">{dictionary.common.sellerEyebrow}</div>
          <h1 id="seller-title">{dictionary.common.sellerTitle}</h1>
          <p className="ff-meta">{dictionary.common.sellerLead}</p>
        </div>

        {!token ? (
          <EmptyState>
            <strong>{dictionary.common.checkoutLoginRequiredTitle}</strong>
            <span>{dictionary.common.checkoutLoginRequiredText}</span>
            <a className="ff-button ff-button-primary" href="/auth/login">
              {dictionary.common.navLogin}
            </a>
          </EmptyState>
        ) : (
          <div className="ff-dashboard-stack">
            <div className="ff-actions">
              <a className="ff-button ff-button-primary" href="/seller/products/new">
                {dictionary.common.createProduct}
              </a>
              <a className="ff-button ff-button-secondary" href="/seller/products">
                {dictionary.common.navSellerProducts}
              </a>
              <a className="ff-button ff-button-secondary" href="/seller/orders">
                {dictionary.common.navSellerOrders}
              </a>
            </div>

            <div className="ff-stat-grid">
              <StatCard label={dictionary.common.sellerProductsCount} value={products.length} />
              <StatCard label={dictionary.common.sellerPendingProducts} value={pendingProducts} />
              <StatCard
                label={dictionary.common.sellerCompletedRevenue}
                value={revenue}
                meta={dictionary.common.mockOnlyLabel}
              />
            </div>

            {error ? <div className="ff-alert ff-alert-danger">{error}</div> : null}

            {isLoading ? (
              <div className="ff-grid-2">
                <Skeleton className="ff-skeleton-card" />
                <Skeleton className="ff-skeleton-card" />
              </div>
            ) : (
              <div className="ff-grid-2">
                <section className="ff-panel ff-stack">
                  <h2>{dictionary.common.sellerRecentProducts}</h2>
                  {products.length === 0 ? (
                    <EmptyState>
                      <span>{dictionary.common.sellerProductsEmptyText}</span>
                    </EmptyState>
                  ) : (
                    products.slice(0, 4).map((product) => (
                      <article className="ff-compact-row" key={product.id}>
                        <div>
                          <strong>{product.title}</strong>
                          <p className="ff-meta">
                            {formatMoney({
                              amountMinor: product.price_amount_minor,
                              currency: product.currency,
                              locale: appLocale
                            })}
                          </p>
                        </div>
                        <Badge tone={product.status === "published" ? "success" : "warning"}>
                          {productStatusLabel(product.status)}
                        </Badge>
                      </article>
                    ))
                  )}
                </section>
                <section className="ff-panel ff-stack">
                  <h2>{dictionary.common.sellerRecentOrders}</h2>
                  {orders.length === 0 ? (
                    <EmptyState>
                      <span>{dictionary.common.sellerOrdersEmptyText}</span>
                    </EmptyState>
                  ) : (
                    orders.slice(0, 4).map((item) => (
                      <article className="ff-compact-row" key={item.order.id}>
                        <div>
                          <strong>{item.product.title}</strong>
                          <p className="ff-meta">{orderStatusLabel(item.order.status)}</p>
                        </div>
                        <a className="ff-button ff-button-secondary ff-button-sm" href="/seller/orders">
                          {dictionary.common.navSellerOrders}
                        </a>
                      </article>
                    ))
                  )}
                </section>
              </div>
            )}
          </div>
        )}
      </section>
    </main>
  );
}

function productStatusLabel(status: Product["status"]): string {
  return (dictionary.common as Record<string, string>)[`productStatus.${status}`] ?? status;
}

function orderStatusLabel(status: OrderDetail["order"]["status"]): string {
  return (dictionary.common as Record<string, string>)[`orderStatus.${status}`] ?? status;
}

function getErrorText(error: unknown): string {
  if (error instanceof ApiError) {
    return (dictionary.errors as Record<string, string>)[error.i18nKey] ?? dictionary.common.apiError;
  }

  return dictionary.common.apiError;
}

function formatSellerTotals(items: OrderDetail[]): string {
  const totals = new Map<CurrencyCode, number>();
  items.forEach((item) => {
    totals.set(item.deal.currency, (totals.get(item.deal.currency) ?? 0) + item.deal.seller_amount_minor);
  });

  if (totals.size === 0) {
    return formatMoney({ amountMinor: 0, currency: "RUB", locale: appLocale });
  }

  return Array.from(totals.entries())
    .map(([currency, amountMinor]) => formatMoney({ amountMinor, currency, locale: appLocale }))
    .join(" / ");
}
