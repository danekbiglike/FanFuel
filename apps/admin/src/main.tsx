import { FormEvent, StrictMode, useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import { formatMoney } from "@fanfuel/i18n";
import {
  applyThemePreference,
  Button,
  getStoredThemePreference,
  setStoredThemePreference,
  subscribeToSystemTheme,
  ThemeSwitcher,
  type ThemePreference
} from "@fanfuel/ui";
import type {
  AdminUserListResponse,
  AdminUserSummary,
  ApiErrorResponse,
  AuthResponse,
  Product,
  ProductListResponse
} from "@fanfuel/types";
import { appLocale, dictionary } from "./i18n";
import "@fanfuel/ui/src/styles.css";
import "./styles.css";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8080";

const themeLabels = {
  appearance: dictionary.common.appearance,
  themeSystem: dictionary.common.themeSystem,
  themeLight: dictionary.common.themeLight,
  themeDark: dictionary.common.themeDark,
  themeSystemDescription: dictionary.common.themeSystemDescription
};

function AdminApp() {
  const [token, setToken] = useState(
    () => window.localStorage.getItem("fanfuel_admin_token") ?? ""
  );
  const [themePreference, setThemePreference] = useState<ThemePreference>(() =>
    getStoredThemePreference()
  );
  const [activeTab, setActiveTab] = useState<"users" | "products">("users");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [users, setUsers] = useState<AdminUserSummary[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    applyThemePreference(themePreference);
    setStoredThemePreference(themePreference);

    return subscribeToSystemTheme(() => {
      if (themePreference === "system") {
        applyThemePreference(themePreference);
      }
    });
  }, [themePreference]);

  async function handleLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setMessage("");
    setIsLoading(true);

    try {
      const response = await apiFetch<AuthResponse>("/api/v1/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password })
      });
      setToken(response.access_token);
      window.localStorage.setItem("fanfuel_admin_token", response.access_token);
      setMessage(dictionary.common.successLoggedIn);
      await Promise.all([loadUsers(response.access_token), loadProducts(response.access_token)]);
    } catch (err) {
      setError(errorText(err));
    } finally {
      setIsLoading(false);
    }
  }

  async function loadUsers(nextToken = token) {
    setError("");
    setMessage("");
    setIsLoading(true);

    try {
      const response = await apiFetch<AdminUserListResponse>("/api/v1/admin/users?limit=50", {
        headers: authHeaders(nextToken)
      });
      setUsers(response.items);
    } catch (err) {
      setError(errorText(err));
    } finally {
      setIsLoading(false);
    }
  }

  async function loadProducts(nextToken = token) {
    setError("");
    setMessage("");
    setIsLoading(true);

    try {
      const response = await apiFetch<ProductListResponse>(
        "/api/v1/admin/products?status=pending_moderation&limit=50",
        {
          headers: authHeaders(nextToken)
        }
      );
      setProducts(response.items);
    } catch (err) {
      setError(errorText(err));
    } finally {
      setIsLoading(false);
    }
  }

  async function updateStatus(user: AdminUserSummary, status: "active" | "blocked") {
    const confirmation =
      status === "blocked"
        ? dictionary.common.confirmBlockUser
        : dictionary.common.confirmActivateUser;
    if (!window.confirm(confirmation)) {
      return;
    }

    setError("");
    setMessage("");
    setIsLoading(true);

    try {
      await apiFetch(`/api/v1/admin/users/${user.id}/status`, {
        method: "PATCH",
        headers: authHeaders(token),
        body: JSON.stringify({ status })
      });
      setMessage(dictionary.common.successSaved);
      await loadUsers();
    } catch (err) {
      setError(errorText(err));
    } finally {
      setIsLoading(false);
    }
  }

  async function moderateProduct(product: Product, action: "approve" | "reject") {
    const confirmation =
      action === "approve"
        ? dictionary.common.confirmApproveProduct
        : dictionary.common.confirmRejectProduct;
    if (!window.confirm(confirmation)) {
      return;
    }

    setError("");
    setMessage("");
    setIsLoading(true);

    try {
      await apiFetch(`/api/v1/admin/products/${product.id}/${action}`, {
        method: "POST",
        headers: authHeaders(token),
        body:
          action === "reject"
            ? JSON.stringify({ moderation_note: dictionary.common.adminModerationDefaultNote })
            : undefined
      });
      setMessage(dictionary.common.successSaved);
      await loadProducts();
    } catch (err) {
      setError(errorText(err));
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <main className="admin-shell">
      <header className="admin-topbar">
        <a className="admin-brand" href="/">
          <span>FF</span>
          <strong>{dictionary.common.adminTitle}</strong>
        </a>
        <ThemeSwitcher
          labels={themeLabels}
          preference={themePreference}
          onChange={setThemePreference}
        />
      </header>
      <section className="admin-panel" aria-labelledby="admin-title">
        <span>{dictionary.common.navAdmin}</span>
        <h1 id="admin-title">{dictionary.common.adminTitle}</h1>
        <p>{dictionary.common.adminDescription}</p>

        {!token ? (
          <form className="admin-card admin-form" onSubmit={handleLogin}>
            <label>
              <span>{dictionary.common.email}</span>
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
              />
            </label>
            <label>
              <span>{dictionary.common.password}</span>
              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
              />
            </label>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? dictionary.common.loading : dictionary.common.loginAction}
            </Button>
          </form>
        ) : (
          <div className="admin-stack">
            <div className="admin-tabs" role="tablist" aria-label={dictionary.common.adminSections}>
              <button
                className={activeTab === "users" ? "admin-tab admin-tab-active" : "admin-tab"}
                type="button"
                role="tab"
                aria-selected={activeTab === "users"}
                onClick={() => setActiveTab("users")}
              >
                {dictionary.common.adminUsersTitle}
              </button>
              <button
                className={activeTab === "products" ? "admin-tab admin-tab-active" : "admin-tab"}
                type="button"
                role="tab"
                aria-selected={activeTab === "products"}
                onClick={() => setActiveTab("products")}
              >
                {dictionary.common.adminProductsTitle}
              </button>
            </div>

            <div className="admin-actions">
              <Button
                type="button"
                onClick={() => void (activeTab === "users" ? loadUsers() : loadProducts())}
                disabled={isLoading}
              >
                {isLoading ? dictionary.common.loading : dictionary.common.refreshList}
              </Button>
              <button
                className="ff-button ff-button-secondary"
                type="button"
                onClick={() => {
                  window.localStorage.removeItem("fanfuel_admin_token");
                  setToken("");
                  setUsers([]);
                  setProducts([]);
                }}
              >
                {dictionary.common.logoutAction}
              </button>
            </div>

            {activeTab === "users" ? (
              <div
                className="admin-table"
                role="table"
                aria-label={dictionary.common.adminUsersTitle}
              >
                {users.map((user) => (
                  <div className="admin-row" role="row" key={user.id}>
                    <div>
                      <strong>{user.display_name || user.email}</strong>
                      <small>{user.email}</small>
                    </div>
                    <div className="admin-tags">
                      {user.roles.map((role) => (
                        <span key={role}>{roleLabel(role)}</span>
                      ))}
                    </div>
                    <div>{statusLabel(user.status)}</div>
                    <div className="admin-row-actions">
                      {user.status === "blocked" ? (
                        <button
                          className="ff-button ff-button-secondary"
                          type="button"
                          onClick={() => void updateStatus(user, "active")}
                        >
                          {dictionary.common.activateUser}
                        </button>
                      ) : (
                        <button
                          className="ff-button ff-button-secondary"
                          type="button"
                          onClick={() => void updateStatus(user, "blocked")}
                        >
                          {dictionary.common.blockUser}
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div
                className="admin-table"
                role="table"
                aria-label={dictionary.common.adminProductsTitle}
              >
                {products.length === 0 ? (
                  <div className="admin-card">
                    <strong>{dictionary.common.adminProductsEmptyTitle}</strong>
                    <p>{dictionary.common.adminProductsEmptyText}</p>
                  </div>
                ) : null}
                {products.map((product) => (
                  <div className="admin-row admin-product-row" role="row" key={product.id}>
                    <div>
                      <strong>{product.title}</strong>
                      <small>{product.seller?.display_name ?? dictionary.common.roleSeller}</small>
                    </div>
                    <div className="admin-tags">
                      <span>{productStatusLabel(product.status)}</span>
                      <span>{productKindLabel(product.kind)}</span>
                    </div>
                    <div>
                      {formatMoney({
                        amountMinor: product.price_amount_minor,
                        currency: product.currency,
                        locale: appLocale
                      })}
                    </div>
                    <div className="admin-row-actions">
                      <button
                        className="ff-button ff-button-secondary"
                        type="button"
                        onClick={() => void moderateProduct(product, "approve")}
                      >
                        {dictionary.common.approveProduct}
                      </button>
                      <button
                        className="ff-button ff-button-danger"
                        type="button"
                        onClick={() => void moderateProduct(product, "reject")}
                      >
                        {dictionary.common.rejectProduct}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        <div className={error ? "admin-message admin-error" : "admin-message"}>
          {error || message}
        </div>
      </section>
    </main>
  );
}

async function apiFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers);
  if (!headers.has("Content-Type") && init.body) {
    headers.set("Content-Type", "application/json");
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
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

    throw new Error(payload?.error.i18n_key ?? "errors.generic");
  }

  return (await response.json()) as T;
}

function authHeaders(token: string): HeadersInit {
  return token ? { Authorization: `Bearer ${token}` } : {};
}

function errorText(error: unknown): string {
  if (error instanceof Error) {
    return (
      (dictionary.errors as Record<string, string>)[error.message] ?? dictionary.common.apiError
    );
  }

  return dictionary.common.apiError;
}

function roleLabel(role: string): string {
  const labels: Record<string, string> = {
    buyer: dictionary.common.roleBuyer,
    streamer: dictionary.common.roleStreamer,
    seller: dictionary.common.roleSeller,
    admin: dictionary.common.roleAdmin,
    support: dictionary.common.roleSupport,
    moderator: dictionary.common.roleModerator
  };

  return labels[role] ?? dictionary.common.notAvailable;
}

function statusLabel(status: string): string {
  const labels: Record<string, string> = {
    active: dictionary.common.statusActive,
    blocked: dictionary.common.statusBlocked,
    pending_verification: dictionary.common.statusPendingVerification,
    deleted: dictionary.common.statusDeleted
  };

  return labels[status] ?? dictionary.common.notAvailable;
}

function productStatusLabel(status: string): string {
  return (
    (dictionary.common as Record<string, string>)[`productStatus.${status}`] ??
    dictionary.common.notAvailable
  );
}

function productKindLabel(kind: string): string {
  return (
    (dictionary.common as Record<string, string>)[`productKind.${kind}`] ??
    dictionary.common.notAvailable
  );
}

createRoot(document.getElementById("root") as HTMLElement).render(
  <StrictMode>
    <AdminApp />
  </StrictMode>
);
