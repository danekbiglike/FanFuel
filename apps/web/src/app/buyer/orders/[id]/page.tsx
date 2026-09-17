"use client";

import { FormEvent, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { formatMoney } from "@fanfuel/i18n";
import { Alert, Badge, DealTimeline, EmptyState, Skeleton, Select } from "@fanfuel/ui";
import type { OrderDetail } from "@fanfuel/types";
import { AppTopBar } from "../../../../components/app-chrome";
import {
  ApiError,
  confirmBuyerOrder,
  getOrder,
  getStoredToken,
  reviewBuyerOrder
} from "../../../../lib/api";
import { appLocale, dictionary } from "../../../../lib/i18n";

export default function BuyerOrderPage() {
  const params = useParams<{ id: string }>();
  const [token, setToken] = useState("");
  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [rating, setRating] = useState(5);
  const [reviewText, setReviewText] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const storedToken = getStoredToken();
    setToken(storedToken);

    if (!storedToken) {
      setIsLoading(false);
      return;
    }

    getOrder(storedToken, params.id)
      .then(setOrder)
      .catch((err: unknown) => setError(getErrorText(err)))
      .finally(() => setIsLoading(false));
  }, [params.id]);

  async function handleConfirm() {
    if (!order) {
      return;
    }
    setError("");
    setMessage("");
    setIsSubmitting(true);

    try {
      const response = await confirmBuyerOrder(token, order.order.id);
      setOrder(response);
      setMessage(dictionary.common.orderConfirmedMessage);
    } catch (err) {
      setError(getErrorText(err));
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleReview(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!order) {
      return;
    }
    setError("");
    setMessage("");
    setIsSubmitting(true);

    try {
      const review = await reviewBuyerOrder(token, order.order.id, { rating, text: reviewText });
      setOrder({ ...order, review });
      setMessage(dictionary.common.reviewCreatedMessage);
    } catch (err) {
      setError(getErrorText(err));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="ff-page">
      <AppTopBar />
      <section className="ff-page-with-topbar ff-wide-page" aria-labelledby="order-title">
        {isLoading ? (
          <div className="ff-product-detail">
            <Skeleton className="ff-skeleton-hero" />
            <Skeleton className="ff-skeleton-card" />
          </div>
        ) : !token ? (
          <EmptyState>
            <strong>{dictionary.common.checkoutLoginRequiredTitle}</strong>
            <span>{dictionary.common.checkoutLoginRequiredText}</span>
            <a className="ff-button ff-button-primary" href="/auth">
              {dictionary.common.navLogin}
            </a>
          </EmptyState>
        ) : !order ? (
          <EmptyState>
            <strong>{dictionary.common.orderNotFoundTitle}</strong>
            <span>{error || dictionary.common.orderNotFoundText}</span>
            <a className="ff-button ff-button-secondary" href="/buyer">
              {dictionary.common.navBuyer}
            </a>
          </EmptyState>
        ) : (
          <div className="ff-product-detail">
            <article className="ff-product-main" aria-labelledby="order-title">
              <div className="ff-product-card-head">
                <Badge tone={orderTone(order.order.status)}>
                  {orderStatusLabel(order.order.status)}
                </Badge>
                <Badge tone="held">{dealStatusLabel(order.deal.status)}</Badge>
                <Badge tone={order.payment.status === "succeeded" ? "success" : "warning"}>
                  {paymentStatusLabel(order.payment.status)}
                </Badge>
              </div>
              <h1 id="order-title">{order.product.title}</h1>
              <p className="ff-meta">{order.product.description}</p>

              <section className="ff-panel ff-stack" aria-labelledby="deal-title">
                <h2 id="deal-title">{dictionary.common.dealTimelineTitle}</h2>
                <DealTimeline>
                  {dealSteps(order).map((step) => (
                    <li key={step}>{step}</li>
                  ))}
                </DealTimeline>
              </section>

              {order.order.status === "delivered" ? (
                <section className="ff-panel ff-stack" aria-labelledby="confirm-title">
                  <h2 id="confirm-title">{dictionary.common.buyerConfirmTitle}</h2>
                  <p className="ff-meta">{dictionary.common.buyerConfirmText}</p>
                  <button
                    className="ff-button ff-button-primary"
                    type="button"
                    disabled={isSubmitting}
                    onClick={() => void handleConfirm()}
                  >
                    {isSubmitting ? dictionary.common.loading : dictionary.common.confirmDelivery}
                  </button>
                </section>
              ) : null}

              {order.order.status === "completed" && !order.review ? (
                <form className="ff-panel ff-form" onSubmit={handleReview}>
                  <h2>{dictionary.common.reviewTitle}</h2>
                  <label className="ff-field">
                    <span>{dictionary.common.reviewRating}</span>
                    <Select
                      value={rating}
                      onChange={(event) => setRating(Number(event.target.value))}
                    >
                      {[5, 4, 3, 2, 1].map((value) => (
                        <option key={value} value={value}>
                          {value}
                        </option>
                      ))}
                    </Select>
                  </label>
                  <label className="ff-field">
                    <span>{dictionary.common.reviewText}</span>
                    <textarea
                      value={reviewText}
                      onChange={(event) => setReviewText(event.target.value)}
                      maxLength={1000}
                    />
                  </label>
                  <button
                    className="ff-button ff-button-primary"
                    type="submit"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? dictionary.common.loading : dictionary.common.reviewSubmit}
                  </button>
                </form>
              ) : null}

              {order.review ? (
                <section className="ff-panel ff-stack">
                  <h2>{dictionary.common.productReviewsTitle}</h2>
                  <strong>
                    {dictionary.common.productRatingLabel}: {order.review.rating}/5
                  </strong>
                  <p className="ff-meta">
                    {order.review.text || dictionary.common.productReviewNoText}
                  </p>
                </section>
              ) : null}
            </article>

            <aside className="ff-product-side">
              <div className="ff-panel ff-stack">
                <div>
                  <span className="ff-meta">{dictionary.common.productPrice}</span>
                  <strong className="ff-price">
                    {formatMoney({
                      amountMinor: order.order.total_amount_minor,
                      currency: order.order.currency,
                      locale: appLocale
                    })}
                  </strong>
                </div>
                <div>
                  <span className="ff-meta">{dictionary.common.productSeller}</span>
                  <strong>
                    {order.product.seller?.display_name ?? dictionary.common.roleSeller}
                  </strong>
                </div>
                <Alert tone="info">{dictionary.common.safeDealMockText}</Alert>
                <a className="ff-button ff-button-secondary" href="/buyer">
                  {dictionary.common.navBuyer}
                </a>
              </div>
              {error ? <Alert tone="danger">{error}</Alert> : null}
              {message ? <Alert tone="success">{message}</Alert> : null}
            </aside>
          </div>
        )}
      </section>
    </main>
  );
}

function dealSteps(order: OrderDetail): string[] {
  const steps = [dictionary.common.dealStepPayment];
  if (["seller_working", "seller_submitted", "completed"].includes(order.deal.status)) {
    steps.push(dictionary.common.dealStepSellerWork);
  }
  if (["seller_submitted", "completed"].includes(order.deal.status)) {
    steps.push(dictionary.common.dealStepDelivered);
  }
  if (order.deal.status === "completed") {
    steps.push(dictionary.common.dealStepCompleted);
  }
  return steps;
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

function orderTone(status: OrderDetail["order"]["status"]) {
  if (status === "completed") {
    return "success";
  }
  if (status === "failed" || status === "cancelled" || status === "refunded") {
    return "danger";
  }
  return "held";
}

function getErrorText(error: unknown): string {
  if (error instanceof ApiError) {
    return (
      (dictionary.errors as Record<string, string>)[error.i18nKey] ?? dictionary.common.apiError
    );
  }

  return dictionary.common.apiError;
}
