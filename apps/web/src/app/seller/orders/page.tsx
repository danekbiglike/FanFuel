"use client";

import { useEffect, useState } from "react";
import { formatMoney } from "@fanfuel/i18n";
import { Alert, Badge, EmptyState, Skeleton } from "@fanfuel/ui";
import type { OrderDetail } from "@fanfuel/types";
import { AppTopBar } from "../../../components/app-chrome";
import { ApiError, getSellerOrders, getStoredToken, startSellerOrder, submitSellerOrder } from "../../../lib/api";
import { appLocale, dictionary } from "../../../lib/i18n";

export default function SellerOrdersPage() {
  const [token, setToken] = useState("");
  const [orders, setOrders] = useState<OrderDetail[]>([]);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [activeOrderId, setActiveOrderId] = useState("");

  useEffect(() => {
    const storedToken = getStoredToken();
    setToken(storedToken);

    if (!storedToken) {
      setIsLoading(false);
      return;
    }

    setError("");
    setIsLoading(true);
    getSellerOrders(storedToken)
      .then((response) => setOrders(response.items))
      .catch((err: unknown) => setError(getErrorText(err)))
      .finally(() => setIsLoading(false));
  }, []);

  async function runOrderAction(order: OrderDetail, action: "start" | "submit") {
    setError("");
    setMessage("");
    setActiveOrderId(order.order.id);

    try {
      const response =
        action === "start"
          ? await startSellerOrder(token, order.order.id)
          : await submitSellerOrder(token, order.order.id);
      setOrders((current) => current.map((item) => (item.order.id === response.order.id ? response : item)));
      setMessage(action === "start" ? dictionary.common.orderStartedMessage : dictionary.common.orderSubmittedMessage);
    } catch (err) {
      setError(getErrorText(err));
    } finally {
      setActiveOrderId("");
    }
  }

  return (
    <main className="ff-page">
      <AppTopBar />
      <section className="ff-page-with-topbar ff-wide-page" aria-labelledby="seller-orders-title">
        <div className="ff-page-heading">
          <div className="ff-status">{dictionary.common.navSellerOrders}</div>
          <h1 id="seller-orders-title">{dictionary.common.sellerOrdersTitle}</h1>
          <p className="ff-meta">{dictionary.common.sellerOrdersLead}</p>
          <div className="ff-actions">
            <a className="ff-button ff-button-secondary" href="/seller">
              {dictionary.common.navSeller}
            </a>
            <a className="ff-button ff-button-secondary" href="/seller/products">
              {dictionary.common.navSellerProducts}
            </a>
          </div>
        </div>

        {!token ? (
          <EmptyState>
            <strong>{dictionary.common.checkoutLoginRequiredTitle}</strong>
            <span>{dictionary.common.checkoutLoginRequiredText}</span>
          </EmptyState>
        ) : isLoading ? (
          <div className="ff-order-list">
            <Skeleton className="ff-skeleton-row" />
            <Skeleton className="ff-skeleton-row" />
          </div>
        ) : orders.length === 0 ? (
          <EmptyState>
            <strong>{dictionary.common.sellerOrdersEmptyTitle}</strong>
            <span>{dictionary.common.sellerOrdersEmptyText}</span>
          </EmptyState>
        ) : (
          <section className="ff-panel ff-stack" aria-labelledby="seller-order-list-title">
            <h2 id="seller-order-list-title">{dictionary.common.sellerOrdersQueueTitle}</h2>
            <div className="ff-order-list">
              {orders.map((item) => (
                <article className="ff-order-row" key={item.order.id}>
                  <div>
                    <strong>{item.product.title}</strong>
                    <p className="ff-meta">{item.product.description}</p>
                  </div>
                  <Badge tone={orderTone(item.order.status)}>{orderStatusLabel(item.order.status)}</Badge>
                  <strong>
                    {formatMoney({
                      amountMinor: item.deal.seller_amount_minor,
                      currency: item.deal.currency,
                      locale: appLocale
                    })}
                  </strong>
                  <div className="ff-actions">
                    {item.order.status === "paid" ? (
                      <button
                        className="ff-button ff-button-primary ff-button-sm"
                        type="button"
                        disabled={activeOrderId === item.order.id}
                        onClick={() => void runOrderAction(item, "start")}
                      >
                        {activeOrderId === item.order.id ? dictionary.common.loading : dictionary.common.startOrderWork}
                      </button>
                    ) : null}
                    {item.order.status === "in_progress" ? (
                      <button
                        className="ff-button ff-button-secondary ff-button-sm"
                        type="button"
                        disabled={activeOrderId === item.order.id}
                        onClick={() => void runOrderAction(item, "submit")}
                      >
                        {activeOrderId === item.order.id ? dictionary.common.loading : dictionary.common.submitOrderWork}
                      </button>
                    ) : null}
                  </div>
                </article>
              ))}
            </div>
          </section>
        )}

        {error ? <Alert tone="danger">{error}</Alert> : null}
        {message ? <Alert tone="success">{message}</Alert> : null}
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
