import type {
  ApiErrorResponse,
  AuthIdentifyResponse,
  AuthResponse,
  CurrentUser,
  CreateDonationResponse,
  DonationGoal,
  DonationGoalListResponse,
  DonationListResponse,
  EmailVerificationStartResponse,
  EmailVerificationVerifyResponse,
  OrderDetail,
  OrderListResponse,
  Payment,
  Product,
  ProductCategoryListResponse,
  ProductListResponse,
  PublicCreatorResponse,
  Review,
  ThemePreference,
  UserPreferences,
  Widget,
  WidgetListResponse
} from "@fanfuel/types";

const PUBLIC_API_BASE_URL = normalizeApiBaseUrl(process.env.NEXT_PUBLIC_API_BASE_URL);
const INTERNAL_API_BASE_URL =
  normalizeApiBaseUrl(process.env.FANFUEL_INTERNAL_API_BASE_URL) ??
  PUBLIC_API_BASE_URL ??
  "http://localhost:8080";

export class ApiError extends Error {
  code: string;
  i18nKey: string;

  constructor(code: string, i18nKey: string) {
    super(code);
    this.code = code;
    this.i18nKey = i18nKey;
  }
}

export function getStoredToken(): string {
  if (typeof window === "undefined") {
    return "";
  }

  return window.localStorage.getItem("fanfuel_access_token") ?? "";
}

export function setStoredToken(token: string) {
  window.localStorage.setItem("fanfuel_access_token", token);
  window.dispatchEvent(new Event("fanfuel-auth-changed"));
}

export function clearStoredToken() {
  window.localStorage.removeItem("fanfuel_access_token");
  window.dispatchEvent(new Event("fanfuel-auth-changed"));
}

export async function register(
  payload: {
    registration_token: string;
    password: string;
  },
  signal?: AbortSignal
): Promise<AuthResponse> {
  return apiFetch<AuthResponse>("/api/v1/auth/register", {
    signal,
    method: "POST",
    body: JSON.stringify(payload)
  });
}

export async function identifyAuthEmail(
  payload: { email: string },
  signal?: AbortSignal
): Promise<AuthIdentifyResponse> {
  return apiFetch<AuthIdentifyResponse>("/api/v1/auth/identify", {
    signal,
    method: "POST",
    body: JSON.stringify(payload)
  });
}

export async function startEmailVerification(
  payload: { email: string; locale: string },
  signal?: AbortSignal
): Promise<EmailVerificationStartResponse> {
  return apiFetch<EmailVerificationStartResponse>("/api/v1/auth/email-verification/start", {
    signal,
    method: "POST",
    body: JSON.stringify(payload)
  });
}

export async function verifyEmail(
  payload: { challenge_id: string; code: string },
  signal?: AbortSignal
): Promise<EmailVerificationVerifyResponse> {
  return apiFetch<EmailVerificationVerifyResponse>("/api/v1/auth/email-verification/verify", {
    signal,
    method: "POST",
    body: JSON.stringify(payload)
  });
}

export async function login(
  payload: { email: string; password: string },
  signal?: AbortSignal
): Promise<AuthResponse> {
  return apiFetch<AuthResponse>("/api/v1/auth/login", {
    signal,
    method: "POST",
    body: JSON.stringify(payload)
  });
}

export async function getMe(token: string, signal?: AbortSignal): Promise<CurrentUser> {
  return apiFetch<CurrentUser>("/api/v1/auth/me", {
    signal,
    headers: authHeaders(token)
  });
}

export async function getPreferences(token: string): Promise<UserPreferences> {
  return apiFetch<UserPreferences>("/api/v1/me/preferences", {
    headers: authHeaders(token)
  });
}

export async function updatePreferences(
  token: string,
  payload: { themePreference?: ThemePreference; locale?: string }
): Promise<UserPreferences> {
  return apiFetch<UserPreferences>("/api/v1/me/preferences", {
    method: "PATCH",
    headers: authHeaders(token),
    body: JSON.stringify(payload)
  });
}

export async function updateProfile(
  token: string,
  payload: { display_name: string; slug: string; bio: string }
): Promise<CurrentUser> {
  return apiFetch<CurrentUser>("/api/v1/me/profile", {
    method: "PATCH",
    headers: authHeaders(token),
    body: JSON.stringify(payload)
  });
}

export async function updateCreatorProfile(
  token: string,
  payload: { title: string; description: string; status: string }
): Promise<CurrentUser> {
  return apiFetch<CurrentUser>("/api/v1/studio/profile", {
    method: "PATCH",
    headers: authHeaders(token),
    body: JSON.stringify(payload)
  });
}

export async function createCreatorDraft(
  token: string,
  payload: { title: string; description: string }
): Promise<CurrentUser> {
  return apiFetch<CurrentUser>("/api/v1/studio/onboarding", {
    method: "POST",
    headers: authHeaders(token),
    body: JSON.stringify(payload)
  });
}

export async function updateSellerProfile(
  token: string,
  payload: { display_name: string; description: string; seller_type: string }
): Promise<CurrentUser> {
  return apiFetch<CurrentUser>("/api/v1/seller/profile", {
    method: "PATCH",
    headers: authHeaders(token),
    body: JSON.stringify(payload)
  });
}

export async function getPublicCreator(slug: string): Promise<PublicCreatorResponse> {
  return apiFetch<PublicCreatorResponse>(`/api/v1/creators/${encodeURIComponent(slug)}`);
}

export async function getPublicDonations(slug: string): Promise<DonationListResponse> {
  return apiFetch<DonationListResponse>(`/api/v1/creators/${encodeURIComponent(slug)}/donations`);
}

export async function getPublicGoals(slug: string): Promise<DonationGoalListResponse> {
  return apiFetch<DonationGoalListResponse>(`/api/v1/creators/${encodeURIComponent(slug)}/goals`);
}

export async function getCategories(
  includeRestricted = false
): Promise<ProductCategoryListResponse> {
  const query = includeRestricted ? "?include_restricted=true" : "";
  return apiFetch<ProductCategoryListResponse>(`/api/v1/categories${query}`);
}

export async function getProducts(
  params: { category?: string; query?: string; sort?: string } = {}
): Promise<ProductListResponse> {
  const searchParams = new URLSearchParams();
  if (params.category) {
    searchParams.set("category", params.category);
  }
  if (params.query) {
    searchParams.set("query", params.query);
  }
  if (params.sort) {
    searchParams.set("sort", params.sort);
  }
  const query = searchParams.toString();
  return apiFetch<ProductListResponse>(`/api/v1/products${query ? `?${query}` : ""}`);
}

export async function getProduct(idOrSlug: string): Promise<Product> {
  return apiFetch<Product>(`/api/v1/products/${encodeURIComponent(idOrSlug)}`);
}

export async function createDonation(
  payload: {
    creator_slug: string;
    amount_minor: number;
    currency: string;
    display_name: string;
    message: string;
    is_anonymous: boolean;
    donation_goal_id?: string;
  },
  idempotencyKey: string
): Promise<CreateDonationResponse> {
  return apiFetch<CreateDonationResponse>("/api/v1/donations", {
    method: "POST",
    headers: {
      "Idempotency-Key": idempotencyKey
    },
    body: JSON.stringify(payload)
  });
}

export async function completeMockPayment(paymentId: string): Promise<CreateDonationResponse> {
  return apiFetch<CreateDonationResponse>(
    `/api/v1/mock/payments/${encodeURIComponent(paymentId)}/succeed`,
    {
      method: "POST"
    }
  );
}

export async function completeMockOrderPayment(paymentId: string): Promise<OrderDetail> {
  return apiFetch<OrderDetail>(`/api/v1/mock/payments/${encodeURIComponent(paymentId)}/succeed`, {
    method: "POST"
  });
}

export async function getPayment(paymentId: string): Promise<Payment> {
  return apiFetch<Payment>(`/api/v1/payments/${encodeURIComponent(paymentId)}`);
}

export async function getStudioDonations(token: string): Promise<DonationListResponse> {
  return apiFetch<DonationListResponse>("/api/v1/studio/donations", {
    headers: authHeaders(token)
  });
}

export async function getStudioGoals(token: string): Promise<DonationGoalListResponse> {
  return apiFetch<DonationGoalListResponse>("/api/v1/studio/goals", {
    headers: authHeaders(token)
  });
}

export async function createStudioGoal(
  token: string,
  payload: { title: string; description: string; target_amount_minor: number; currency: string }
): Promise<DonationGoal> {
  return apiFetch<DonationGoal>("/api/v1/studio/goals", {
    method: "POST",
    headers: authHeaders(token),
    body: JSON.stringify(payload)
  });
}

export async function getStudioWidgets(token: string): Promise<WidgetListResponse> {
  return apiFetch<WidgetListResponse>("/api/v1/studio/widgets", {
    headers: authHeaders(token)
  });
}

export async function createStudioWidget(
  token: string,
  payload: { name: string }
): Promise<Widget> {
  return apiFetch<Widget>("/api/v1/studio/widgets", {
    method: "POST",
    headers: authHeaders(token),
    body: JSON.stringify(payload)
  });
}

export async function rotateStudioWidgetToken(token: string, widgetId: string): Promise<Widget> {
  return apiFetch<Widget>(`/api/v1/studio/widgets/${encodeURIComponent(widgetId)}/rotate-token`, {
    method: "POST",
    headers: authHeaders(token)
  });
}

export async function getSellerProducts(token: string): Promise<ProductListResponse> {
  return apiFetch<ProductListResponse>("/api/v1/seller/products", {
    headers: authHeaders(token)
  });
}

export async function createSellerProduct(
  token: string,
  payload: {
    category_id: string;
    kind: Product["kind"];
    title: string;
    slug?: string;
    description: string;
    terms: string;
    price_amount_minor: number;
    currency: string;
    delivery_type: Product["delivery_type"];
    affiliate_percent_bps: number;
  }
): Promise<Product> {
  return apiFetch<Product>("/api/v1/seller/products", {
    method: "POST",
    headers: authHeaders(token),
    body: JSON.stringify(payload)
  });
}

export async function submitSellerProduct(token: string, productId: string): Promise<Product> {
  return apiFetch<Product>(`/api/v1/seller/products/${encodeURIComponent(productId)}/submit`, {
    method: "POST",
    headers: authHeaders(token)
  });
}

export async function getSellerOrders(token: string): Promise<OrderListResponse> {
  return apiFetch<OrderListResponse>("/api/v1/seller/orders", {
    headers: authHeaders(token)
  });
}

export async function startSellerOrder(token: string, orderId: string): Promise<OrderDetail> {
  return apiFetch<OrderDetail>(`/api/v1/seller/orders/${encodeURIComponent(orderId)}/start`, {
    method: "POST",
    headers: authHeaders(token)
  });
}

export async function submitSellerOrder(token: string, orderId: string): Promise<OrderDetail> {
  return apiFetch<OrderDetail>(`/api/v1/seller/orders/${encodeURIComponent(orderId)}/submit`, {
    method: "POST",
    headers: authHeaders(token)
  });
}

export async function createOrder(
  token: string,
  payload: {
    product_id: string;
    quantity: number;
    creator_profile_id?: string;
    promo_code?: string;
    accepted_terms: boolean;
  },
  idempotencyKey: string
): Promise<OrderDetail> {
  return apiFetch<OrderDetail>("/api/v1/orders", {
    method: "POST",
    headers: {
      ...authHeaders(token),
      "Idempotency-Key": idempotencyKey
    },
    body: JSON.stringify(payload)
  });
}

export async function getOrder(token: string, orderId: string): Promise<OrderDetail> {
  return apiFetch<OrderDetail>(`/api/v1/orders/${encodeURIComponent(orderId)}`, {
    headers: authHeaders(token)
  });
}

export async function getBuyerOrders(token: string): Promise<OrderListResponse> {
  return apiFetch<OrderListResponse>("/api/v1/buyer/orders", {
    headers: authHeaders(token)
  });
}

export async function confirmBuyerOrder(token: string, orderId: string): Promise<OrderDetail> {
  return apiFetch<OrderDetail>(`/api/v1/buyer/orders/${encodeURIComponent(orderId)}/confirm`, {
    method: "POST",
    headers: authHeaders(token)
  });
}

export async function reviewBuyerOrder(
  token: string,
  orderId: string,
  payload: { rating: number; text: string }
): Promise<Review> {
  return apiFetch<Review>(`/api/v1/buyer/orders/${encodeURIComponent(orderId)}/review`, {
    method: "POST",
    headers: authHeaders(token),
    body: JSON.stringify(payload)
  });
}

function authHeaders(token: string): Record<string, string> {
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function apiFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers);
  if (!headers.has("Content-Type") && init.body) {
    headers.set("Content-Type", "application/json");
  }

  const response = await fetch(`${getApiBaseUrl()}${path}`, {
    ...init,
    headers
  });

  if (!response.ok) {
    let payload: ApiErrorResponse | undefined;
    try {
      payload = (await response.json()) as ApiErrorResponse;
    } catch {
      payload = undefined;
    }

    throw new ApiError(
      payload?.error.code ?? "api_error",
      payload?.error.i18n_key ?? "errors.generic"
    );
  }

  return (await response.json()) as T;
}

function getApiBaseUrl(): string {
  if (typeof window === "undefined") {
    return INTERNAL_API_BASE_URL;
  }

  if (PUBLIC_API_BASE_URL && !isLocalhostApiBaseUrl(PUBLIC_API_BASE_URL)) {
    return PUBLIC_API_BASE_URL;
  }

  return "";
}

function normalizeApiBaseUrl(value: string | undefined): string | undefined {
  const trimmed = value?.trim();

  if (!trimmed) {
    return undefined;
  }

  return trimmed.replace(/\/+$/, "");
}

function isLocalhostApiBaseUrl(value: string): boolean {
  try {
    const hostname = new URL(value).hostname;
    return hostname === "localhost" || hostname === "127.0.0.1" || hostname === "::1";
  } catch {
    return false;
  }
}
