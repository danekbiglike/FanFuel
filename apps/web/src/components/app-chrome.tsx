"use client";

import { useEffect, useRef, useState, type FormEvent, type MouseEvent } from "react";
import type { ThemePreference } from "@fanfuel/ui";
import type { CurrentUser, Locale } from "@fanfuel/types";
import {
  clearStoredToken,
  getMe,
  getPreferences,
  getStoredToken,
  updatePreferences
} from "../lib/api";
import {
  appLocale,
  dictionary,
  getAppDictionary,
  getStoredLocalePreference,
  setStoredLocalePreference
} from "../lib/i18n";
import { useTheme } from "./theme-context";

type PreferenceMenuKind = "theme" | "language";

type FloatingPreferenceMenu = {
  kind: PreferenceMenuKind;
  top: number;
  left: number;
  width: number;
};

export function AppTopBar() {
  const theme = useTheme();
  const menuRef = useRef<HTMLDivElement | null>(null);
  const searchInputRef = useRef<HTMLInputElement | null>(null);
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const [authState, setAuthState] = useState<"checking" | "guest" | "authenticated">("checking");
  const [searchQuery, setSearchQuery] = useState("");
  const [isCompactSearch, setCompactSearch] = useState(false);
  const [isUserMenuOpen, setUserMenuOpen] = useState(false);
  const [localePreference, setLocalePreference] = useState<Locale>(appLocale);
  const [floatingPreferenceMenu, setFloatingPreferenceMenu] =
    useState<FloatingPreferenceMenu | null>(null);
  const common = getAppDictionary(localePreference).common;
  const menuThemeOptions: Array<{ value: ThemePreference; label: string }> = [
    {
      value: "system",
      label: common.themeSystem
    },
    {
      value: "light",
      label: common.themeLight
    },
    {
      value: "dark",
      label: common.themeDark
    }
  ];
  const menuLanguageOptions: Array<{ value: Locale; label: string }> = [
    {
      value: "ru",
      label: common.languageRussian
    },
    {
      value: "en",
      label: common.languageEnglish
    }
  ];
  const currentThemeLabel =
    menuThemeOptions.find((option) => option.value === theme.preference)?.label ??
    common.themeSystem;
  const currentLanguageLabel =
    menuLanguageOptions.find((option) => option.value === localePreference)?.label ??
    common.languageRussian;

  useEffect(() => {
    let isActive = true;

    async function syncAuthState() {
      const token = getStoredToken();

      if (!token) {
        if (isActive) {
          setCurrentUser(null);
          setAuthState("guest");
        }
        return;
      }

      try {
        const user = await getMe(token);
        if (isActive) {
          setCurrentUser(user);
          setAuthState("authenticated");
        }

        void getPreferences(token)
          .then((preferences) => {
            if (!isActive) {
              return;
            }

            setStoredLocalePreference(preferences.locale);
            setLocalePreference(preferences.locale);
          })
          .catch(() => {
            if (isActive) {
              setLocalePreference(getStoredLocalePreference());
            }
          });
      } catch {
        clearStoredToken();
        if (isActive) {
          setCurrentUser(null);
          setAuthState("guest");
        }
      }
    }

    void syncAuthState();

    window.addEventListener("storage", syncAuthState);
    window.addEventListener("fanfuel-auth-changed", syncAuthState);

    return () => {
      isActive = false;
      window.removeEventListener("storage", syncAuthState);
      window.removeEventListener("fanfuel-auth-changed", syncAuthState);
    };
  }, []);

  useEffect(() => {
    setLocalePreference(getStoredLocalePreference());
  }, []);

  useEffect(() => {
    document.documentElement.lang = localePreference;
  }, [localePreference]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setSearchQuery(params.get("query") ?? "");
  }, []);

  useEffect(() => {
    const searchInput = searchInputRef.current;
    if (!searchInput) {
      return;
    }

    const searchInputElement: HTMLInputElement = searchInput;
    let isActive = true;
    let animationFrameId: number | null = null;
    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d");

    function measurePlaceholder() {
      if (animationFrameId !== null) {
        window.cancelAnimationFrame(animationFrameId);
      }

      animationFrameId = window.requestAnimationFrame(() => {
        if (!isActive || !context || searchInputElement.clientWidth <= 0) {
          return;
        }

        const style = window.getComputedStyle(searchInputElement);
        const paddingLeft = Number.parseFloat(style.paddingLeft) || 0;
        const paddingRight = Number.parseFloat(style.paddingRight) || 0;
        const availableWidth = searchInputElement.clientWidth - paddingLeft - paddingRight;

        context.font = style.font || `${style.fontWeight} ${style.fontSize} ${style.fontFamily}`;

        const fullPlaceholderWidth = context.measureText(common.topbarSearchPlaceholder).width;
        const shouldCompact = fullPlaceholderWidth > availableWidth - 2;

        setCompactSearch((current) => (current === shouldCompact ? current : shouldCompact));
      });
    }

    measurePlaceholder();

    const resizeObserver =
      "ResizeObserver" in window ? new ResizeObserver(measurePlaceholder) : null;
    resizeObserver?.observe(searchInputElement);
    window.addEventListener("resize", measurePlaceholder);

    if ("fonts" in document) {
      void document.fonts.ready.then(measurePlaceholder).catch(() => undefined);
    }

    return () => {
      isActive = false;
      if (animationFrameId !== null) {
        window.cancelAnimationFrame(animationFrameId);
      }
      resizeObserver?.disconnect();
      window.removeEventListener("resize", measurePlaceholder);
    };
  }, [common.topbarSearchPlaceholder]);

  useEffect(() => {
    if (!isUserMenuOpen) {
      return;
    }

    function handlePointerDown(event: PointerEvent) {
      if (!menuRef.current?.contains(event.target as Node)) {
        setFloatingPreferenceMenu(null);
        setUserMenuOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setFloatingPreferenceMenu(null);
        setUserMenuOpen(false);
      }
    }

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isUserMenuOpen]);

  useEffect(() => {
    if (!isUserMenuOpen) {
      setFloatingPreferenceMenu(null);
    }
  }, [isUserMenuOpen]);

  const isAuthenticated = authState === "authenticated";
  const topbarClassName = isAuthenticated
    ? "ff-site-topbar ff-site-topbar-auth"
    : "ff-site-topbar ff-site-topbar-guest";
  const canStream = currentUser?.roles.includes("streamer") ?? false;
  const canSell = currentUser?.roles.includes("seller") ?? false;
  const displayName =
    currentUser?.profile?.display_name ?? currentUser?.user.email ?? common.navProfile;
  const profileMeta = currentUser?.profile?.slug
    ? `@${currentUser.profile.slug}`
    : currentUser?.user.email;
  const initials = getInitials(displayName);
  const topbarSearchPlaceholder = isCompactSearch
    ? common.topbarSearchPlaceholderCompact
    : common.topbarSearchPlaceholder;

  function handleTopbarSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const query = searchQuery.trim();
    const params = new URLSearchParams();
    if (query) {
      params.set("query", query);
    }

    window.location.assign(`/marketplace${params.toString() ? `?${params}` : ""}`);
  }

  function handleLogout() {
    clearStoredToken();
    setCurrentUser(null);
    setAuthState("guest");
    setFloatingPreferenceMenu(null);
    setUserMenuOpen(false);
    window.location.assign("/marketplace");
  }

  function openFloatingPreferenceMenu(
    kind: PreferenceMenuKind,
    event: MouseEvent<HTMLButtonElement>
  ) {
    const rect = event.currentTarget.getBoundingClientRect();
    const menuWidth = kind === "theme" ? 190 : 172;
    const menuHeight = kind === "theme" ? 132 : 92;
    const margin = 10;
    const maxLeft = Math.max(margin, window.innerWidth - menuWidth - margin);
    const left = Math.min(maxLeft, Math.max(margin, rect.right - menuWidth));
    const maxTop = Math.max(margin, window.innerHeight - menuHeight - margin);
    const shouldOpenAbove =
      window.innerHeight - rect.bottom < menuHeight + margin && rect.top > menuHeight + margin;
    const rawTop = shouldOpenAbove ? rect.top - menuHeight - 6 : rect.bottom + 6;
    const top = Math.min(maxTop, Math.max(margin, rawTop));

    setFloatingPreferenceMenu((current) =>
      current?.kind === kind ? null : { kind, top, left, width: menuWidth }
    );
  }

  function handleThemePreferenceChange(nextPreference: ThemePreference) {
    theme.setPreference(nextPreference);
    setFloatingPreferenceMenu(null);
  }

  function handleLocalePreferenceChange(nextLocale: Locale) {
    setLocalePreference(nextLocale);
    setStoredLocalePreference(nextLocale);
    document.documentElement.lang = nextLocale;
    setFloatingPreferenceMenu(null);

    const token = getStoredToken();
    if (token) {
      void updatePreferences(token, { locale: nextLocale });
    }
  }

  const floatingPreferenceMenuNode =
    isUserMenuOpen && floatingPreferenceMenu ? (
      <div
        className="ff-user-floating-menu"
        style={{
          top: floatingPreferenceMenu.top,
          left: floatingPreferenceMenu.left,
          width: floatingPreferenceMenu.width
        }}
        role="listbox"
        aria-label={floatingPreferenceMenu.kind === "theme" ? common.theme : common.navLanguage}
      >
        {floatingPreferenceMenu.kind === "theme"
          ? menuThemeOptions.map((option) => (
              <button
                key={option.value}
                className="ff-user-floating-option"
                type="button"
                role="option"
                aria-selected={theme.preference === option.value}
                onClick={() => handleThemePreferenceChange(option.value)}
              >
                <span>{option.label}</span>
                {theme.preference === option.value ? <CheckIcon /> : null}
              </button>
            ))
          : menuLanguageOptions.map((option) => (
              <button
                key={option.value}
                className="ff-user-floating-option"
                type="button"
                role="option"
                aria-selected={localePreference === option.value}
                onClick={() => handleLocalePreferenceChange(option.value)}
              >
                <span>{option.label}</span>
                {localePreference === option.value ? <CheckIcon /> : null}
              </button>
            ))}
      </div>
    ) : null;

  return (
    <header className={topbarClassName}>
      <a className="ff-brand" href="/marketplace" aria-label={common.projectName}>
        <span>FF</span>
        <strong>{common.projectName}</strong>
      </a>

      <form
        className="ff-topbar-search"
        role="search"
        onSubmit={handleTopbarSearch}
        suppressHydrationWarning
      >
        <label className="ff-sr-only" htmlFor="ff-topbar-search-input">
          {common.marketplaceSearch}
        </label>
        <input
          ref={searchInputRef}
          id="ff-topbar-search-input"
          value={searchQuery}
          onChange={(event) => setSearchQuery(event.target.value)}
          placeholder={topbarSearchPlaceholder}
          suppressHydrationWarning
        />
        <button type="submit" aria-label={common.topbarSearchSubmit}>
          <SearchIcon />
        </button>
      </form>

      {isAuthenticated ? (
        <div className="ff-topbar-actions">
          <button
            className="ff-icon-button ff-notification-button"
            type="button"
            disabled
            aria-label={common.notifications}
            title={common.notificationsUnavailable}
          >
            <BellIcon />
          </button>

          <div className="ff-user-menu-shell" ref={menuRef}>
            <button
              className="ff-user-menu-trigger"
              type="button"
              aria-haspopup="dialog"
              aria-expanded={isUserMenuOpen}
              onClick={() => setUserMenuOpen((value) => !value)}
            >
              <span className="ff-user-avatar" aria-hidden="true">
                {initials}
              </span>
              <span className="ff-user-trigger-name">{displayName}</span>
              <ChevronDownIcon />
            </button>

            {isUserMenuOpen ? (
              <div className="ff-user-dropdown" aria-label={common.topbarAccountMenu}>
                <div className="ff-user-dropdown-head">
                  <strong>{displayName}</strong>
                  {profileMeta ? <span>{profileMeta}</span> : null}
                </div>

                <div className="ff-user-menu-group">
                  <div className="ff-user-menu-section">{common.menuSectionAccount}</div>
                  <a
                    className="ff-user-menu-item ff-user-menu-subitem"
                    href="/me/profile"
                    onClick={() => setUserMenuOpen(false)}
                  >
                    <span>{common.navProfile}</span>
                  </a>
                </div>

                <div className="ff-user-menu-group">
                  <div className="ff-user-menu-section">{common.menuSectionMarketplace}</div>
                  <a
                    className="ff-user-menu-item ff-user-menu-subitem"
                    href="/buyer"
                    onClick={() => setUserMenuOpen(false)}
                  >
                    <span>{common.navBuyer}</span>
                  </a>
                  {canSell ? (
                    <a
                      className="ff-user-menu-item ff-user-menu-subitem"
                      href="/seller"
                      onClick={() => setUserMenuOpen(false)}
                    >
                      <span>{common.navSeller}</span>
                    </a>
                  ) : null}
                </div>

                <div className="ff-user-menu-group">
                  <div className="ff-user-menu-section">{common.menuSectionSupport}</div>
                  <button className="ff-user-menu-item ff-user-menu-subitem" type="button" disabled>
                    <span>{common.navHelp}</span>
                    <span className="ff-user-menu-hint">{common.menuSoon}</span>
                  </button>
                  <button className="ff-user-menu-item ff-user-menu-subitem" type="button" disabled>
                    <span>{common.navMessages}</span>
                    <span className="ff-user-menu-hint">{common.menuSoon}</span>
                  </button>
                </div>

                {canStream ? (
                  <div className="ff-user-menu-group">
                    <div className="ff-user-menu-section">{common.fanfuelStudio}</div>
                    <button
                      className="ff-user-menu-item ff-user-menu-subitem"
                      type="button"
                      disabled
                    >
                      <span>{common.navStudio}</span>
                      <span className="ff-user-menu-hint">{common.menuSoon}</span>
                    </button>
                    <button
                      className="ff-user-menu-item ff-user-menu-subitem"
                      type="button"
                      disabled
                    >
                      <span>{common.navFinances}</span>
                      <span className="ff-user-menu-hint">{common.menuPaymentReview}</span>
                    </button>
                  </div>
                ) : null}

                <div className="ff-user-menu-group">
                  <div className="ff-user-menu-section">{common.menuSectionSettings}</div>
                  <button className="ff-user-menu-item ff-user-menu-subitem" type="button" disabled>
                    <span>{common.navSettings}</span>
                    <span className="ff-user-menu-hint">{common.menuSoon}</span>
                  </button>
                  <button
                    className="ff-user-menu-item ff-user-menu-subitem ff-user-menu-control-button"
                    type="button"
                    aria-haspopup="listbox"
                    aria-expanded={floatingPreferenceMenu?.kind === "theme"}
                    onClick={(event) => openFloatingPreferenceMenu("theme", event)}
                  >
                    <span>{common.theme}</span>
                    <span className="ff-user-menu-value">
                      {currentThemeLabel}
                      <ChevronDownIcon />
                    </span>
                  </button>
                  <button
                    className="ff-user-menu-item ff-user-menu-subitem ff-user-menu-control-button"
                    type="button"
                    aria-haspopup="listbox"
                    aria-expanded={floatingPreferenceMenu?.kind === "language"}
                    onClick={(event) => openFloatingPreferenceMenu("language", event)}
                  >
                    <span>{common.navLanguage}</span>
                    <span className="ff-user-menu-value">
                      {currentLanguageLabel}
                      <ChevronDownIcon />
                    </span>
                  </button>
                </div>

                <div className="ff-user-menu-group">
                  <button
                    className="ff-user-menu-item ff-user-menu-subitem ff-user-menu-logout"
                    type="button"
                    onClick={handleLogout}
                  >
                    <span>{common.logoutAction}</span>
                  </button>
                </div>
              </div>
            ) : null}

            {floatingPreferenceMenuNode}
          </div>
        </div>
      ) : (
        <div className="ff-topbar-actions">
          <div className="ff-user-menu-shell" ref={menuRef}>
            <button
              className="ff-user-menu-trigger ff-guest-menu-trigger"
              type="button"
              aria-label={common.topbarGuestMenu}
              aria-haspopup="dialog"
              aria-expanded={isUserMenuOpen}
              onClick={() => setUserMenuOpen((value) => !value)}
            >
              <MenuIcon />
            </button>

            {isUserMenuOpen ? (
              <div
                className="ff-user-dropdown ff-guest-dropdown"
                aria-label={common.topbarGuestMenu}
              >
                <div className="ff-user-menu-group ff-guest-auth-group">
                  <div className="ff-user-menu-section">{common.menuSectionAccount}</div>
                  <div className="ff-guest-auth-actions">
                    <a
                      className="ff-guest-auth-button"
                      href="/auth/login"
                      onClick={() => setUserMenuOpen(false)}
                    >
                      {common.navLogin}
                    </a>
                    <a
                      className="ff-guest-auth-button ff-guest-auth-button-primary"
                      href="/auth/register"
                      onClick={() => setUserMenuOpen(false)}
                    >
                      {common.navRegister}
                    </a>
                  </div>
                </div>

                <div className="ff-user-menu-group">
                  <div className="ff-user-menu-section">{common.menuSectionExplore}</div>
                  <a
                    className="ff-user-menu-item ff-user-menu-subitem"
                    href="/marketplace"
                    onClick={() => setUserMenuOpen(false)}
                  >
                    <span>{common.navMarketplace}</span>
                  </a>
                  <a
                    className="ff-user-menu-item ff-user-menu-subitem"
                    href="/for-buyers"
                    onClick={() => setUserMenuOpen(false)}
                  >
                    <span>{common.navForBuyers}</span>
                  </a>
                  <a
                    className="ff-user-menu-item ff-user-menu-subitem"
                    href="/for-streamers"
                    onClick={() => setUserMenuOpen(false)}
                  >
                    <span>{common.navForStreamers}</span>
                  </a>
                  <a
                    className="ff-user-menu-item ff-user-menu-subitem"
                    href="/for-sellers"
                    onClick={() => setUserMenuOpen(false)}
                  >
                    <span>{common.navForSellers}</span>
                  </a>
                </div>

                <div className="ff-user-menu-group">
                  <div className="ff-user-menu-section">{common.menuSectionSettings}</div>
                  <button
                    className="ff-user-menu-item ff-user-menu-subitem ff-user-menu-control-button"
                    type="button"
                    aria-haspopup="listbox"
                    aria-expanded={floatingPreferenceMenu?.kind === "theme"}
                    onClick={(event) => openFloatingPreferenceMenu("theme", event)}
                  >
                    <span>{common.theme}</span>
                    <span className="ff-user-menu-value">
                      {currentThemeLabel}
                      <ChevronDownIcon />
                    </span>
                  </button>
                  <button
                    className="ff-user-menu-item ff-user-menu-subitem ff-user-menu-control-button"
                    type="button"
                    aria-haspopup="listbox"
                    aria-expanded={floatingPreferenceMenu?.kind === "language"}
                    onClick={(event) => openFloatingPreferenceMenu("language", event)}
                  >
                    <span>{common.navLanguage}</span>
                    <span className="ff-user-menu-value">
                      {currentLanguageLabel}
                      <ChevronDownIcon />
                    </span>
                  </button>
                </div>
              </div>
            ) : null}

            {floatingPreferenceMenuNode}
          </div>
        </div>
      )}
    </header>
  );
}

function getInitials(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) {
    return "FF";
  }

  const parts = trimmed.split(/\s+/).filter(Boolean);
  const source = parts.length > 1 ? `${parts[0][0]}${parts[1][0]}` : trimmed.slice(0, 2);

  return source.toUpperCase();
}

function SearchIcon() {
  return (
    <svg className="ff-topbar-icon" viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="11" cy="11" r="6" />
      <path d="m16 16 4 4" />
    </svg>
  );
}

function BellIcon() {
  return (
    <svg className="ff-topbar-icon" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M18 9a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" />
      <path d="M10 21h4" />
    </svg>
  );
}

function MenuIcon() {
  return (
    <svg className="ff-topbar-icon" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M4 7h16" />
      <path d="M4 12h16" />
      <path d="M4 17h16" />
    </svg>
  );
}

function ChevronDownIcon() {
  return (
    <svg className="ff-topbar-icon ff-topbar-icon-small" viewBox="0 0 24 24" aria-hidden="true">
      <path d="m7 10 5 5 5-5" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg className="ff-topbar-icon ff-topbar-icon-small" viewBox="0 0 24 24" aria-hidden="true">
      <path d="m20 6-11 11-5-5" />
    </svg>
  );
}

export function ThemeSettingsPanel() {
  const theme = useTheme();

  return (
    <section className="ff-panel ff-form" aria-labelledby="appearance-title">
      <div>
        <h2 id="appearance-title">{dictionary.common.appearance}</h2>
        <p className="ff-meta">{dictionary.common.themeSystemDescription}</p>
      </div>
      <div className="ff-theme-radio-group" role="radiogroup" aria-label={dictionary.common.theme}>
        <label>
          <input
            type="radio"
            name="themePreference"
            checked={theme.preference === "system"}
            onChange={() => theme.setPreference("system")}
          />
          <span>{dictionary.common.themeSystem}</span>
        </label>
        <label>
          <input
            type="radio"
            name="themePreference"
            checked={theme.preference === "light"}
            onChange={() => theme.setPreference("light")}
          />
          <span>{dictionary.common.themeLight}</span>
        </label>
        <label>
          <input
            type="radio"
            name="themePreference"
            checked={theme.preference === "dark"}
            onChange={() => theme.setPreference("dark")}
          />
          <span>{dictionary.common.themeDark}</span>
        </label>
      </div>
      <div className={theme.error ? "ff-message ff-error" : "ff-message"}>
        {theme.error
          ? dictionary.common.themeSaveError
          : theme.isSaving
            ? dictionary.common.themeSaving
            : ""}
      </div>
    </section>
  );
}
