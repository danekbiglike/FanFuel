"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { formatMoney } from "@fanfuel/i18n";
import { Alert, Badge, EmptyState, Skeleton } from "@fanfuel/ui";
import type { OrderDetail, Product } from "@fanfuel/types";
import { AppTopBar } from "../../../components/app-chrome";
import {
  ApiError,
  completeMockOrderPayment,
  createOrder,
  getProduct,
  getStoredToken
} from "../../../lib/api";
import { appLocale, dictionary } from "../../../lib/i18n";

export default function CheckoutPage() {
  const params = useParams<{ productId: string }>();
  const [token, setToken] = useState("");
  const [product, setProduct] = useState<Product | null>(null);
  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [acceptedTerms, setAcceptedTerms] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCompleting, setIsCompleting] = useState(false);

  useEffect(() => {
    setToken(getStoredToken());
    getProduct(params.productId)
      .then(setProduct)
      .catch((err: unknown) => setError(getErrorText(err)))
      .finally(() => setIsLoading(false));
  }, [params.productId]);

  async function handleCreateOrder() {
    if (!product) {
      return;
    }
    setError("");
    setMessage("");
    setIsSubmitting(true);

    try {
      const response = await createOrder(
        token,
        {
          product_id: product.id,
          quantity: 1,
          accepted_terms: acceptedTerms
        },
        newIdempotencyKey()
      );
      setOrder(response);
      setMessage(dictionary.common.checkoutOrderCreated);
    } catch (err) {
      setError(getErrorText(err));
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleMockPayment() {
    if (!order) {
      return;
    }
    setError("");
    setMessage("");
    setIsCompleting(true);

    try {
      const response = await completeMockOrderPayment(order.payment.id);
      setOrder(response);
      setMessage(dictionary.common.checkoutPaymentCompleted);
    } catch (err) {
      setError(getErrorText(err));
    } finally {
      setIsCompleting(false);
    }
  }

  return (
    <main className="ff-page">
      <AppTopBar />
      <section className="ff-page-with-topbar ff-narrow-page" aria-labelledby="checkout-title">
        {isLoading ? (
          <Skeleton className="ff-skeleton-hero" />
        ) : !token ? (
          <EmptyState>
            <strong>{dictionary.common.checkoutLoginRequiredTitle}</strong>
            <span>{dictionary.common.checkoutLoginRequiredText}</span>
            <a className="ff-button ff-button-primary" href="/auth/login">
              {dictionary.common.navLogin}
            </a>
          </EmptyState>
        ) : !product ? (
          <EmptyState>
            <strong>{dictionary.common.productNotFoundTitle}</strong>
            <span>{error || dictionary.common.productNotFoundText}</span>
          </EmptyState>
        ) : (
          <div className="ff-checkout-flow">
            <div className="ff-page-heading">
              <div className="ff-status">{dictionary.common.checkoutEyebrow}</div>
              <h1 id="checkout-title">{dictionary.common.checkoutTitle}</h1>
              <p className="ff-meta">{dictionary.common.checkoutLead}</p>
            </div>

            <section className="ff-panel ff-stack">
              <div className="ff-checkout-summary">
                <div>
                  <h2>{product.title}</h2>
                  <p className="ff-meta">{product.seller?.display_name}</p>
                </div>
                <strong>
                  {formatMoney({ amountMinor: product.price_amount_minor, currency: product.currency, locale: appLocale })}
                </strong>
              </div>
              <Alert tone="info">{dictionary.common.safeDealMockText}</Alert>
              <label className="ff-check">
                <input
                  type="checkbox"
                  checked={acceptedTerms}
                  onChange={(event) => setAcceptedTerms(event.target.checked)}
                />
                <span>{dictionary.common.checkoutAcceptTerms}</span>
              </label>
              <div className="ff-actions">
                <button
                  className="ff-button ff-button-primary"
                  type="button"
                  disabled={isSubmitting || Boolean(order) || !acceptedTerms}
                  onClick={() => void handleCreateOrder()}
                >
                  {isSubmitting ? dictionary.common.loading : dictionary.common.checkoutCreateOrder}
                </button>
                <a className="ff-button ff-button-secondary" href={`/marketplace/products/${product.id}`}>
                  {dictionary.common.marketplaceBack}
                </a>
              </div>
            </section>

            {order ? (
              <section className="ff-panel ff-stack" aria-labelledby="order-status-title">
                <h2 id="order-status-title">{dictionary.common.checkoutStatusTitle}</h2>
                <div className="ff-status-grid">
                  <Badge tone="warning">{orderStatusLabel(order.order.status)}</Badge>
                  <Badge tone="held">{dealStatusLabel(order.deal.status)}</Badge>
                  <Badge tone={order.payment.status === "succeeded" ? "success" : "warning"}>
                    {paymentStatusLabel(order.payment.status)}
                  </Badge>
                </div>
                {order.payment.status === "pending" ? (
                  <button
                    className="ff-button ff-button-secondary"
                    type="button"
                    disabled={isCompleting}
                    onClick={() => void handleMockPayment()}
                  >
                    {isCompleting ? dictionary.common.loading : dictionary.common.completeMockPayment}
                  </button>
                ) : null}
                <a className="ff-button ff-button-primary" href={`/buyer/orders/${order.order.id}`}>
                  {dictionary.common.checkoutOpenOrder}
                </a>
              </section>
            ) : null}

            {error ? <Alert tone="danger">{error}</Alert> : null}
            {message ? <Alert tone="success">{message}</Alert> : null}
          </div>
        )}
      </section>
    </main>
  );
}

function orderStatusLabel(status: OrderDetail["order"]["status"]): string {
  return (dictionary.common as Record<string, string>)[`orderStatus.${status}`] ?? status;
}

function dealStatusLabel(status: OrderDetail["deal"]["status"]): string {
  return (dictionary.common as Record<string, string>)[`dealStatus.${status}`] ?? status;
}

function paymentStatusLabel(status: string): string {
  return (dictionary.common as Record<string, string>)[`paymentStatus.${status}`] ?? status;
}

function getErrorText(error: unknown): string {
  if (error instanceof ApiError) {
    return (dictionary.errors as Record<string, string>)[error.i18nKey] ?? dictionary.common.apiError;
  }

  return dictionary.common.apiError;
}

function newIdempotencyKey(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }

  return `order-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}
