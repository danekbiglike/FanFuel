export type Locale = "ru" | "en";

export type CurrencyCode = "RUB" | "USD" | "EUR";

export type ThemePreference = "system" | "light" | "dark";

export type HealthStatus = "ok" | "degraded" | "error";

export interface HealthResponse {
  service: string;
  status: HealthStatus;
  environment: string;
  checked_at: string;
}

export interface MoneyAmount {
  amount_minor: number;
  currency: CurrencyCode;
}

export type UserRole = "buyer" | "streamer" | "seller" | "admin" | "support" | "moderator";

export type UserStatus = "active" | "blocked" | "pending_verification" | "deleted";

export interface User {
  id: string;
  email: string;
  email_verified_at?: string;
  status: UserStatus;
  default_locale: Locale;
  time_zone: string;
  created_at: string;
  updated_at: string;
}

export interface Profile {
  id: string;
  user_id: string;
  display_name: string;
  slug: string;
  bio: string;
  created_at: string;
  updated_at: string;
}

export interface CreatorProfile {
  id: string;
  user_id: string;
  profile_id: string;
  creator_slug: string;
  title: string;
  description: string;
  donations_enabled: boolean;
  store_enabled: boolean;
  partner_disclosure_enabled: boolean;
  status: "draft" | "published" | "hidden" | "blocked";
  created_at: string;
  updated_at: string;
}

export interface SellerProfile {
  id: string;
  user_id: string;
  seller_type: "lite" | "pro";
  status: "draft" | "active" | "paused" | "blocked" | "rejected";
  display_name: string;
  description: string;
  verification_status: "not_started" | "pending" | "approved" | "rejected" | "manual_review";
  rating_avg: number;
  rating_count: number;
  created_at: string;
  updated_at: string;
}

export interface CurrentUser {
  user: User;
  roles: UserRole[];
  profile?: Profile;
  profile_name_confirmed_at?: string;
  creator_profile?: CreatorProfile;
  seller_profile?: SellerProfile;
}

export interface UserPreferences {
  user_id: string;
  themePreference: ThemePreference;
  locale: Locale;
  created_at: string;
  updated_at: string;
}

export interface AuthResponse {
  access_token: string;
  token_type: "Bearer";
  expires_at: string;
  user: CurrentUser;
}

export interface AuthIdentifyResponse {
  next_action: "login" | "register";
}

export interface EmailVerificationStartResponse {
  challenge_id: string;
  email: string;
  expires_at: string;
  resend_available_at: string;
}

export interface EmailVerificationVerifyResponse {
  registration_token: string;
  expires_at: string;
}

export interface PublicCreatorResponse {
  profile: Profile;
  creator: CreatorProfile;
}

export interface ProductCategory {
  id: string;
  parent_id?: string;
  slug: string;
  name_i18n_key: string;
  description_i18n_key: string;
  status: "active" | "hidden" | "restricted";
  requires_legal_review: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface SellerSummary {
  id: string;
  display_name: string;
  seller_type: "lite" | "pro";
  status: SellerProfile["status"];
  verification_status: SellerProfile["verification_status"];
  rating_avg: number;
  rating_count: number;
}

export interface Product {
  id: string;
  seller_profile_id: string;
  category_id: string;
  kind: "digital_asset" | "obs_pack" | "design_asset" | "coaching" | "digital_service";
  status: "draft" | "pending_moderation" | "published" | "rejected" | "hidden" | "archived";
  title: string;
  slug: string;
  description: string;
  terms: string;
  price_amount_minor: number;
  currency: CurrencyCode;
  delivery_type: "manual" | "digital_file" | "session";
  affiliate_percent_bps: number;
  safe_deal_required: boolean;
  moderation_note?: string;
  published_at?: string;
  created_at: string;
  updated_at: string;
  category?: ProductCategory;
  seller?: SellerSummary;
  reviews?: Review[];
}

export type PaymentStatus =
  | "created"
  | "pending"
  | "requires_action"
  | "succeeded"
  | "failed"
  | "cancelled"
  | "refunded"
  | "partially_refunded";

export type DonationStatus = "created" | "payment_pending" | "paid" | "failed" | "refunded";

export interface Payment {
  id: string;
  status: PaymentStatus;
  purpose: "donation" | "order";
  amount_minor: number;
  currency: CurrencyCode;
  provider: string;
  provider_payment_id: string;
  confirmation_url: string;
  paid_at?: string;
  created_at: string;
  updated_at: string;
}

export type OrderStatus =
  | "created"
  | "awaiting_payment"
  | "paid"
  | "in_progress"
  | "delivered"
  | "completed"
  | "disputed"
  | "cancelled"
  | "refunded"
  | "failed";

export type DealStatus =
  | "created"
  | "awaiting_payment"
  | "paid"
  | "held"
  | "seller_working"
  | "seller_submitted"
  | "buyer_confirmed"
  | "auto_confirmed"
  | "disputed"
  | "resolved_to_buyer"
  | "resolved_to_seller"
  | "refunded"
  | "completed"
  | "cancelled"
  | "failed";

export interface Order {
  id: string;
  buyer_user_id: string;
  seller_profile_id: string;
  product_id: string;
  deal_id?: string;
  payment_id: string;
  status: OrderStatus;
  quantity: number;
  gross_amount_minor: number;
  discount_amount_minor: number;
  total_amount_minor: number;
  currency: CurrencyCode;
  terms_snapshot_json: Record<string, unknown>;
  creator_profile_id?: string;
  promo_code?: string;
  created_at: string;
  updated_at: string;
}

export interface Deal {
  id: string;
  order_id: string;
  status: DealStatus;
  gross_amount_minor: number;
  seller_amount_minor: number;
  creator_amount_minor: number;
  platform_fee_minor: number;
  provider_fee_minor: number;
  currency: CurrencyCode;
  buyer_response_deadline_at?: string;
  seller_response_deadline_at?: string;
  auto_confirm_at?: string;
  completed_at?: string;
  created_at: string;
  updated_at: string;
}

export interface Review {
  id: string;
  order_id: string;
  buyer_user_id: string;
  seller_profile_id: string;
  product_id: string;
  rating: number;
  text: string;
  status: "published" | "hidden" | "flagged" | "removed";
  created_at: string;
  updated_at: string;
}

export interface OrderDetail {
  order: Order;
  deal: Deal;
  payment: Payment;
  product: Product;
  review?: Review;
}

export interface Donation {
  id: string;
  creator_profile_id: string;
  donation_goal_id?: string;
  payment_id: string;
  status: DonationStatus;
  display_name: string;
  public_name: string;
  message: string;
  amount_minor: number;
  currency: CurrencyCode;
  is_anonymous: boolean;
  paid_at?: string;
  created_at: string;
  updated_at: string;
}

export interface DonationGoal {
  id: string;
  creator_profile_id: string;
  title: string;
  description: string;
  target_amount_minor: number;
  current_amount_minor: number;
  currency: CurrencyCode;
  status: "active" | "paused" | "completed" | "archived";
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface TopDonor {
  display_name: string;
  total_amount_minor: number;
  currency: CurrencyCode;
  donation_count: number;
}

export interface CreateDonationResponse {
  donation: Donation;
  payment: Payment;
}

export interface DonationListResponse {
  items: Donation[];
  top_donors: TopDonor[];
}

export interface DonationGoalListResponse {
  items: DonationGoal[];
}

export interface Widget {
  id: string;
  creator_profile_id: string;
  kind: "donation_alert";
  status: "active" | "disabled" | "revoked";
  name: string;
  token?: string;
  connect_path?: string;
  expires_at?: string;
  created_at: string;
  updated_at: string;
}

export interface WidgetListResponse {
  items: Widget[];
}

export interface ProductCategoryListResponse {
  items: ProductCategory[];
}

export interface ProductListResponse {
  items: Product[];
  pagination: Pagination;
}

export interface OrderListResponse {
  items: OrderDetail[];
  pagination: Pagination;
}

export interface AdminUserSummary {
  id: string;
  email: string;
  status: UserStatus;
  default_locale: Locale;
  created_at: string;
  display_name: string;
  slug: string;
  roles: UserRole[];
}

export interface Pagination {
  limit: number;
  offset: number;
  total: number;
  has_next: boolean;
  has_prev: boolean;
  next_offset?: number;
  prev_offset?: number;
}

export interface AdminUserListResponse {
  items: AdminUserSummary[];
  pagination: Pagination;
}

export interface ApiErrorResponse {
  error: {
    code: string;
    message: string;
    i18n_key: string;
    details?: unknown;
  };
}
