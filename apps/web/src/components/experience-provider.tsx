"use client";

import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import type { Locale } from "@fanfuel/types";
import type { Attribution } from "../lib/commerce";
import { appLocale, getAppDictionary, getStoredLocalePreference } from "../lib/i18n";

type ListKind = "saved" | "cart";
type Lists = Record<ListKind, string[]> & { attribution: Record<string, Attribution> };
const empty: Lists = { saved: [], cart: [], attribution: {} };
const storageKey = "fanfuel_lists_v1";
const ExperienceContext = createContext<{
  locale: Locale;
  copy: ReturnType<typeof getAppDictionary>["experience"];
  lists: Lists;
  ready: boolean;
  persistent: boolean;
  toggle: (kind: ListKind, id: string, attribution?: Attribution) => void;
}>({
  locale: appLocale,
  copy: getAppDictionary(appLocale).experience,
  lists: empty,
  ready: false,
  persistent: true,
  toggle: () => {}
});

function readLists(value: string | null): Lists {
  try {
    const data = JSON.parse(value ?? "{}");
    const valid = (items: unknown): string[] =>
      Array.isArray(items)
        ? [
            ...new Set(
              items.filter(
                (id): id is string => typeof id === "string" && /^[a-zA-Z0-9-]{1,100}$/.test(id)
              )
            )
          ].slice(0, 100)
        : [];
    const saved = valid(data.saved),
      cart = valid(data.cart);
    const attribution: Record<string, Attribution> = {};
    for (const id of new Set([...saved, ...cart])) {
      const value = data.attribution?.[id];
      if (value && typeof value === "object") {
        const safe = (field: unknown) =>
          typeof field === "string" && field.length <= 128 ? field : "";
        attribution[id] = {
          storefront: safe(value.storefront),
          promo_code: safe(value.promo_code),
          attribution_choice: ["storefront", "promo", "none"].includes(value.attribution_choice)
            ? value.attribution_choice
            : ""
        };
      }
    }
    return { saved, cart, attribution };
  } catch {
    return empty;
  }
}

export function ExperienceProvider({ children }: { children: ReactNode }) {
  const [locale, setLocale] = useState<Locale>(appLocale);
  const [lists, setLists] = useState<Lists>(empty);
  const [ready, setReady] = useState(false);
  const [persistent, setPersistent] = useState(true);
  const pathname = usePathname();
  const lastMotionVisit = useRef<{ path: string | null; play: boolean }>({
    path: null,
    play: false
  });
  useEffect(() => {
    function syncLocale() {
      try {
        setLocale(getStoredLocalePreference());
      } catch {
        /* Локаль приложения остаётся доступной. */
      }
    }
    function syncLists() {
      try {
        setLists(readLists(localStorage.getItem(storageKey)));
      } catch {
        setPersistent(false);
      }
    }
    function onStorage(event: StorageEvent) {
      if (event.key === storageKey || event.key === null) syncLists();
      syncLocale();
    }
    syncLocale();
    syncLists();
    setReady(true);
    const observer = new MutationObserver(syncLocale);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["lang"] });
    window.addEventListener("storage", onStorage);
    return () => {
      observer.disconnect();
      window.removeEventListener("storage", onStorage);
    };
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    root.dataset.motion = "quiet";
    const connection = (
      navigator as Navigator & { connection?: { saveData?: boolean; effectiveType?: string } }
    ).connection;
    if (connection?.saveData || /^(slow-)?2g$/.test(connection?.effectiveType ?? "")) {
      root.dataset.lowData = "true";
      return;
    }
    const navigation = performance.getEntriesByType("navigation")[0] as
      PerformanceNavigationTiming | undefined;
    try {
      if (lastMotionVisit.current.path !== pathname) {
        const key = "fanfuel_seen:" + pathname;
        const seen = sessionStorage.getItem(key);
        sessionStorage.setItem(key, "1");
        lastMotionVisit.current = { path: pathname, play: !seen && navigation?.type !== "reload" };
      }
      if (lastMotionVisit.current.play && !matchMedia("(prefers-reduced-motion: reduce)").matches) {
        root.dataset.motion = "welcome";
      }
    } catch {
      /* Без sessionStorage не повторяем декоративное движение. */
    }
    return () => {
      root.dataset.motion = "quiet";
    };
  }, [pathname]);

  function toggle(kind: ListKind, id: string, attribution?: Attribution) {
    if (!ready) return;
    let current = lists;
    try {
      if (persistent) current = readLists(localStorage.getItem(storageKey));
    } catch {
      setPersistent(false);
    }
    const next = {
      ...current,
      [kind]: current[kind].includes(id)
        ? current[kind].filter((item) => item !== id)
        : [...current[kind], id].slice(0, 100)
    };
    next.attribution = { ...current.attribution };
    if (!current[kind].includes(id) && attribution) next.attribution[id] = attribution;
    if (!next.saved.includes(id) && !next.cart.includes(id)) delete next.attribution[id];
    setLists(next);
    try {
      localStorage.setItem(storageKey, JSON.stringify(next));
    } catch {
      setPersistent(false);
    }
  }
  return (
    <ExperienceContext.Provider
      value={{
        locale,
        copy: getAppDictionary(locale).experience,
        lists,
        ready,
        persistent,
        toggle
      }}
    >
      {children}
    </ExperienceContext.Provider>
  );
}
// Context и hook составляют один публичный модуль.
// eslint-disable-next-line react-refresh/only-export-components
export function useExperience() {
  return useContext(ExperienceContext);
}
