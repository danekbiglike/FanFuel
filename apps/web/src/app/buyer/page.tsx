"use client";

import { useEffect, useMemo, useState } from "react";
import { formatMoney } from "@fanfuel/i18n";
import { Badge, EmptyState, Skeleton, StatCard } from "@fanfuel/ui";
import type { CurrencyCode, OrderDetail } from "@fanfuel/types";
import { AppTopBar } from "../../components/app-chrome";
import { ApiError, getBuyerOrders, getStoredToken } from "../../lib/api";
import { appLocale, dictionary } from "../../lib/i18n";

export default function BuyerDashboardPage() {
  const [token, setToken] = useState("");
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

    getBuyerOrders(storedToken)
      .then((response) => setOrders(response.items))
      .catch((err: unknown) => setError(getErrorText(err)))
      .finally(() => setIsLoading(false));
  }, []);

  const totalSpent = useMemo(
    () => formatTotals(orders.filter((item) => ["paid", "in_progress", "delivered", "completed"].includes(item.order.status))),
    [orders]
  );
  const activeCount = orders.filter((item) => ["paid", "in_progress", "delivered"].includes(item.order.status)).length;

  return (
    <main className="ff-page">
      <AppTopBar />
      <section className="ff-page-with-topbar ff-wide-page" aria-labelledby="buyer-title">
        <div className="ff-page-heading">
          <div className="ff-status">{dictionary.common.buyerEyebrow}</div>
          <h1 id="buyer-title">{dictionary.common.buyerTitle}</h1>
          <p className="ff-meta">{dictionary.common.buyerLead}</p>
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
            <div className="ff-stat-grid">
              <StatCard label={dictionary.common.buyerTotalOrders} value={orders.length} />
              <StatCard label={dictionary.common.buyerActiveOrders} value={activeCount} />
              <StatCard
                label={dictionary.common.buyerTotalSpent}
                value={totalSpent}
                meta={dictionary.common.mockOnlyLabel}
              />
            </div>

            {error ? <div className="ff-alert ff-alert-danger">{error}</div> : null}

            {isLoading ? (
              <div className="ff-order-list">
                <Skeleton className="ff-skeleton-row" />
                <Skeleton className="ff-skeleton-row" />
              </div>
            ) : orders.length === 0 ? (
              <EmptyState>
                <strong>{dictionary.common.buyerEmptyTitle}</strong>
                <span>{dictionary.common.buyerEmptyText}</span>
                <a className="ff-button ff-button-secondary" href="/marketplace">
                  {dictionary.common.navMarketplace}
                </a>
              </EmptyState>
            ) : (
              <section className="ff-panel ff-stack" aria-labelledby="buyer-orders-title">
                <h2 id="buyer-orders-title">{dictionary.common.buyerOrdersTitle}</h2>
                <div className="ff-order-list">
                  {orders.map((item) => (
                    <article className="ff-order-row" key={item.order.id}>
                      <div>
                        <strong>{item.product.title}</strong>
                        <p className="ff-meta">{item.product.seller?.display_name ?? dictionary.common.roleSeller}</p>
                      </div>
                      <Badge tone={orderTone(item.order.status)}>{orderStatusLabel(item.order.status)}</Badge>
                      <strong>
                        {formatMoney({
                          amountMinor: item.order.total_amount_minor,
                          currency: item.order.currency,
                          locale: appLocale
                        })}
                      </strong>
                      <a className="ff-button ff-button-secondary" href={`/buyer/orders/${item.order.id}`}>
                        {dictionary.common.openOrder}
                      </a>
                    </article>
                  ))}
                </div>
              </section>
            )}
          </div>
        )}
      </section>
    </main>
  );
}

function orderStatusLabel(status: OrderDetail["order"]["status"]): string {
  return (dictionary.common as Record<string, string>)[`orderStatus.${status}`] ?? status;
}

function orderTone(status: OrderDetail["order"]["status"]) {
  if (status === "completed") {
    return "success";
  }
  if (status === "failed" || status === "cancelled" || status === "refunded") {
    return "danger";
  }
  if (status === "delivered" || status === "paid" || status === "in_progress") {
    return "held";
  }
  return "warning";
}

function getErrorText(error: unknown): string {
  if (error instanceof ApiError) {
    return (dictionary.errors as Record<string, string>)[error.i18nKey] ?? dictionary.common.apiError;
  }

  return dictionary.common.apiError;
}

function formatTotals(items: OrderDetail[]): string {
  const totals = new Map<CurrencyCode, number>();
  items.forEach((item) => {
    totals.set(item.order.currency, (totals.get(item.order.currency) ?? 0) + item.order.total_amount_minor);
  });

  if (totals.size === 0) {
    return formatMoney({ amountMinor: 0, currency: "RUB", locale: appLocale });
  }

  return Array.from(totals.entries())
    .map(([currency, amountMinor]) => formatMoney({ amountMinor, currency, locale: appLocale }))
    .join(" / ");
}
