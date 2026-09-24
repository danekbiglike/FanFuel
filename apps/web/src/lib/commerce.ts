import type { CurrencyCode, Product, ProductListResponse } from "@fanfuel/types";
import { apiFetch, getStoredToken } from "./api";
// Ограничиваем ожидание, включая чтение ответа; повтор записи безопасен через revision/idempotency.
async function commerceFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
  const controller = new AbortController();
  const abort = () => controller.abort();
  if (init.signal?.aborted) controller.abort();
  init.signal?.addEventListener("abort", abort, { once: true });
  const timer = setTimeout(abort, 15000);
  try {
    return await apiFetch<T>(path, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timer);
    init.signal?.removeEventListener("abort", abort);
  }
}
export type Identity = {
  source: string;
  external_id: string;
  work_title: string;
  format: string;
  platform: string;
  edition: string;
  region: string;
  language: string;
  duration_days: number;
  license: string;
  bundle: string;
};
export type CommerceProduct = Product & {
  identity: Identity;
  variant_key: string;
  promo_bps: number;
  storefront_bps: number;
  commission_configured: boolean;
};
export type StoreDesign = {
  avatar_media_id?: string;
  banner_media_id?: string;
  banner: "lime" | "ink" | "grid";
  avatar: "oily" | "letter" | "canister";
  accent: "lime" | "neutral";
  layout: "grid" | "list";
  blocks: string[];
  headline: string;
  about: string;
  donate_placement: "button" | "block" | "hidden";
};
export type CreatorCommerce = {
  creator_id: string;
  slug: string;
  title: string;
  published: boolean;
  donations_enabled: boolean;
  storefront_enabled: boolean;
  promo_enabled: boolean;
  promo_code: string;
  design: StoreDesign;
  revision: number;
  product_ids: string[];
  products: CommerceProduct[];
  stats: {
    currency: CurrencyCode;
    orders: number;
    pending_minor: number;
    completed_minor: number;
  }[];
};
export type Candidate = { creator_id: string; creator_name: string; channel: string; bps: number };
export type Quote = {
  fingerprint: string;
  product_id: string;
  currency: CurrencyCode;
  quantity: number;
  storefront: Candidate | null;
  promo: Candidate | null;
  selected: Candidate | null;
  choice_required: boolean;
  allocation: {
    buyer_amount_minor: number;
    creator_amount_minor: number;
    seller_amount_minor: number;
  };
  promo_code: string;
};
export type Attribution = { storefront: string; promo_code: string; attribution_choice: string };
export type Insights = {
  product: CommerceProduct;
  offers: CommerceProduct[];
  reference: {
    status: string;
    median_minor: number;
    low_minor: number;
    high_minor: number;
    sellers: number;
    excluded: number;
    as_of: string;
  };
  signals: string[];
  conversion: { status: string; rate: number; low: number; high: number };
};
const auth = () => {
  const token = getStoredToken();
  return token ? { Authorization: "Bearer " + token } : undefined;
};
export const getCreatorCommerce = (signal?: AbortSignal) =>
  commerceFetch<CreatorCommerce>("/api/v1/studio/commerce", { headers: auth(), signal });
export const saveCreatorCommerce = (payload: CreatorCommerce) =>
  commerceFetch<CreatorCommerce>("/api/v1/studio/commerce", {
    method: "PUT",
    headers: auth(),
    body: JSON.stringify(payload)
  });
export const getStore = (slug: string, signal?: AbortSignal) =>
  commerceFetch<CreatorCommerce>("/api/v1/commerce/creators/" + encodeURIComponent(slug), {
    signal
  });
export const getInsights = (id: string, signal?: AbortSignal) =>
  commerceFetch<Insights>("/api/v1/commerce/products/" + encodeURIComponent(id), { signal });
export const getSellerInsights = (id: string, signal?: AbortSignal) =>
  commerceFetch<Insights>("/api/v1/seller/products/" + encodeURIComponent(id) + "/insights", {
    headers: auth(),
    signal
  });
export const saveProductCommerce = (
  id: string,
  payload: { identity: Identity; promo_bps: number; storefront_bps: number }
) =>
  commerceFetch<CommerceProduct>(
    "/api/v1/seller/products/" + encodeURIComponent(id) + "/commerce",
    {
      method: "PUT",
      headers: auth(),
      body: JSON.stringify(payload)
    }
  );
export const searchCommerce = (params: Record<string, string>, signal?: AbortSignal) =>
  commerceFetch<ProductListResponse>("/api/v1/commerce/search?" + new URLSearchParams(params), {
    signal
  });
export const getQuote = (id: string, attribution: Attribution, signal?: AbortSignal) =>
  commerceFetch<Quote>(
    "/api/v1/commerce/quote?" +
      new URLSearchParams({ product_id: id, quantity: "1", ...attribution }),
    { headers: auth(), signal }
  );
export function initialAttribution(): Attribution {
  if (typeof window === "undefined")
    return { storefront: "", promo_code: "", attribution_choice: "" };
  const p = new URLSearchParams(window.location.search);
  return {
    storefront: p.get("storefront") ?? "",
    promo_code: p.get("promo_code") ?? "",
    attribution_choice: p.get("attribution_choice") ?? ""
  };
}
export function attributionURL(path: string, a: Attribution) {
  const q = new URLSearchParams();
  if (a.storefront) q.set("storefront", a.storefront);
  if (a.promo_code) q.set("promo_code", a.promo_code);
  if (a.attribution_choice) q.set("attribution_choice", a.attribution_choice);
  return path + (q.size ? "?" + q : "");
}
// Точный ввод процентов/цены: не использовать parseFloat для финансовых настроек.
export function decimalMinor(value: string): number | null {
  const s = value.trim().replace(",", ".");
  if (!/^\d{1,9}(\.\d{1,2})?$/.test(s)) return null;
  const [a, b = ""] = s.split(".");
  return Number(a) * 100 + Number(b.padEnd(2, "0"));
}
