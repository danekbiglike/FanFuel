"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { Alert, EmptyState, Select } from "@fanfuel/ui";
import type { CurrencyCode, Product, ProductCategory } from "@fanfuel/types";
import { AppTopBar } from "../../../../components/app-chrome";
import {
  ApiError,
  createSellerProduct,
  getCategories,
  getStoredToken,
  submitSellerProduct
} from "../../../../lib/api";
import { SellerCommerceEditor } from "../../../../components/seller-commerce-editor";
import { useCommerceCopy } from "../../../../components/commerce-shared";
import type { CommerceProduct } from "../../../../lib/commerce";
import { dictionary } from "../../../../lib/i18n";

const defaultCurrency = (process.env.NEXT_PUBLIC_DEFAULT_CURRENCY ?? "RUB") as CurrencyCode;

export default function SellerNewProductPage() {
  const { copy } = useCommerceCopy();
  const [token, setToken] = useState("");
  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [createdProduct, setCreatedProduct] = useState<Product | null>(null);
  const [categoryId, setCategoryId] = useState("");
  const [kind, setKind] = useState<Product["kind"]>("digital_asset");
  const [deliveryType, setDeliveryType] = useState<Product["delivery_type"]>("manual");
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [terms, setTerms] = useState("");
  const [priceMajor, setPriceMajor] = useState("1000");
  const [currency, setCurrency] = useState<CurrencyCode>(defaultCurrency);

  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const storedToken = getStoredToken();
    setToken(storedToken);

    getCategories()
      .then((response) => {
        const activeCategories = response.items.filter((item) => item.status === "active");
        setCategories(activeCategories);
        setCategoryId(activeCategories[0]?.id ?? "");
      })
      .catch((err: unknown) => setError(getErrorText(err)))
      .finally(() => setIsLoading(false));
  }, []);

  const canSubmit = useMemo(
    () =>
      token &&
      categoryId &&
      title &&
      description &&
      terms &&
      Number(priceMajor.replace(",", ".")) > 0,
    [categoryId, description, priceMajor, terms, title, token]
  );

  async function handleCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setMessage("");
    setIsSubmitting(true);

    try {
      const product = await createSellerProduct(token, {
        category_id: categoryId,
        kind,
        title,
        slug: slug || undefined,
        description,
        terms,
        price_amount_minor: Math.round(Number(priceMajor.replace(",", ".")) * 100),
        currency,
        delivery_type: deliveryType,
        affiliate_percent_bps: 0
      });
      setCreatedProduct(product);
      setMessage(dictionary.common.productCreatedMessage);
    } catch (err) {
      setError(getErrorText(err));
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleSubmitToModeration() {
    if (!createdProduct) {
      return;
    }
    setError("");
    setMessage("");
    setIsSubmitting(true);

    try {
      const updated = await submitSellerProduct(token, createdProduct.id);
      setCreatedProduct(updated);
      setMessage(dictionary.common.productSubmittedMessage);
    } catch (err) {
      setError(getErrorText(err));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="ff-page">
      <AppTopBar />
      <section className="ff-page-with-topbar ff-narrow-page" aria-labelledby="new-product-title">
        <div className="ff-page-heading">
          <div className="ff-status">{dictionary.common.createProduct}</div>
          <h1 id="new-product-title">{dictionary.common.newProductTitle}</h1>
          <p className="ff-meta">{dictionary.common.newProductLead}</p>
        </div>

        {!token ? (
          <EmptyState>
            <strong>{dictionary.common.checkoutLoginRequiredTitle}</strong>
            <span>{dictionary.common.checkoutLoginRequiredText}</span>
          </EmptyState>
        ) : (
          <form className="ff-panel ff-form" onSubmit={handleCreate}>
            <div className="ff-two-columns">
              <label className="ff-field">
                <span>{dictionary.common.marketplaceCategory}</span>
                <Select
                  value={categoryId}
                  onChange={(event) => setCategoryId(event.target.value)}
                  disabled={isLoading}
                >
                  {categories.map((item) => (
                    <option key={item.id} value={item.id}>
                      {translateKey(item.name_i18n_key)}
                    </option>
                  ))}
                </Select>
              </label>
              <label className="ff-field">
                <span>{dictionary.common.productKind}</span>
                <Select
                  value={kind}
                  onChange={(event) => setKind(event.target.value as Product["kind"])}
                >
                  <option value="digital_asset">
                    {dictionary.common["productKind.digital_asset"]}
                  </option>
                  <option value="obs_pack">{dictionary.common["productKind.obs_pack"]}</option>
                  <option value="design_asset">
                    {dictionary.common["productKind.design_asset"]}
                  </option>
                  <option value="coaching">{dictionary.common["productKind.coaching"]}</option>
                  <option value="digital_service">
                    {dictionary.common["productKind.digital_service"]}
                  </option>
                </Select>
              </label>
            </div>

            <label className="ff-field">
              <span>{dictionary.common.productTitleField}</span>
              <input value={title} onChange={(event) => setTitle(event.target.value)} required />
            </label>
            <label className="ff-field">
              <span>{dictionary.common.productSlugField}</span>
              <input value={slug} onChange={(event) => setSlug(event.target.value)} />
            </label>
            <label className="ff-field">
              <span>{dictionary.common.productDescriptionField}</span>
              <textarea
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                required
              />
            </label>
            <label className="ff-field">
              <span>{dictionary.common.productTermsTitle}</span>
              <textarea value={terms} onChange={(event) => setTerms(event.target.value)} required />
            </label>

            <div className="ff-two-columns">
              <label className="ff-field">
                <span>{dictionary.common.productPrice}</span>
                <input
                  inputMode="decimal"
                  value={priceMajor}
                  onChange={(event) => setPriceMajor(event.target.value)}
                  required
                />
              </label>
              <label className="ff-field">
                <span>{dictionary.common.currency}</span>
                <Select
                  value={currency}
                  onChange={(event) => setCurrency(event.target.value as CurrencyCode)}
                >
                  <option value="RUB">RUB</option>
                  <option value="USD">USD</option>
                  <option value="EUR">EUR</option>
                </Select>
              </label>
            </div>

            <div className="ff-two-columns">
              <label className="ff-field">
                <span>{dictionary.common.deliveryType}</span>
                <Select
                  value={deliveryType}
                  onChange={(event) =>
                    setDeliveryType(event.target.value as Product["delivery_type"])
                  }
                >
                  <option value="manual">{dictionary.common["deliveryType.manual"]}</option>
                  <option value="digital_file">
                    {dictionary.common["deliveryType.digital_file"]}
                  </option>
                  <option value="session">{dictionary.common["deliveryType.session"]}</option>
                </Select>
              </label>
            </div>

            <div className="ff-actions">
              <button
                className="ff-button ff-button-primary"
                type="submit"
                disabled={isSubmitting || !canSubmit || Boolean(createdProduct)}
              >
                {isSubmitting ? dictionary.common.loading : dictionary.common.save}
              </button>
              {createdProduct ? (
                <button
                  className="ff-button ff-button-secondary"
                  type="button"
                  disabled={
                    isSubmitting ||
                    createdProduct.status !== "draft" ||
                    !(createdProduct as CommerceProduct).commission_configured
                  }
                  onClick={() => void handleSubmitToModeration()}
                >
                  {dictionary.common.submitToModeration}
                </button>
              ) : null}
              <a className="ff-button ff-button-secondary" href="/seller/products">
                {dictionary.common.navSellerProducts}
              </a>
            </div>
          </form>
        )}

        {createdProduct && (
          <>
            <p className="commerce-note">{copy.configureBeforeSubmit}</p>
            <SellerCommerceEditor product={createdProduct} onSaved={setCreatedProduct} />
          </>
        )}
        {error ? <Alert tone="danger">{error}</Alert> : null}
        {message ? <Alert tone="success">{message}</Alert> : null}
      </section>
    </main>
  );
}

function translateKey(key: string): string {
  return (dictionary.common as Record<string, string>)[key] ?? key;
}

function getErrorText(error: unknown): string {
  if (error instanceof ApiError) {
    return (
      (dictionary.errors as Record<string, string>)[error.i18nKey] ?? dictionary.common.apiError
    );
  }

  return dictionary.common.apiError;
}
