import { StrictMode, useEffect, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import { formatMoney } from "@fanfuel/i18n";
import type { CurrencyCode } from "@fanfuel/types";
import type { RealtimeEvent } from "@fanfuel/sdk";
import { applyThemePreference, getStoredThemePreference, isThemePreference, type ThemePreference } from "@fanfuel/ui";
import { appLocale, dictionary } from "./i18n";
import "./styles.css";

interface DonationAlertPayload {
  donation_id: string;
  display_name: string;
  is_anonymous: boolean;
  amount_minor: number;
  currency: CurrencyCode;
  message: string;
}

const wsBaseUrl = import.meta.env.VITE_WS_BASE_URL ?? "ws://localhost:8081";

function WidgetApp() {
  const [alert, setAlert] = useState<DonationAlertPayload | null>(null);
  const [connectionLabel, setConnectionLabel] = useState(dictionary.common.widgetWaiting);
  const seenEvents = useRef<Set<string>>(new Set());

  useEffect(() => {
    applyWidgetTheme();
    const token = new URLSearchParams(window.location.search).get("token") ?? "";
    if (!token) {
      setConnectionLabel(dictionary.common.widgetTokenMissing);
      return;
    }

    let isStopped = false;
    let socket: WebSocket | undefined;
    let retryTimer: number | undefined;

    function connect() {
      setConnectionLabel(dictionary.common.widgetDisconnected);
      const url = new URL("/ws/alerts", wsBaseUrl);
      url.searchParams.set("token", token);
      socket = new WebSocket(url);

      socket.addEventListener("open", () => {
        setConnectionLabel(dictionary.common.widgetConnected);
      });

      socket.addEventListener("message", (event) => {
        const realtimeEvent = JSON.parse(event.data as string) as RealtimeEvent<DonationAlertPayload>;
        if (seenEvents.current.has(realtimeEvent.event_id)) {
          return;
        }
        seenEvents.current.add(realtimeEvent.event_id);

        if (realtimeEvent.event_type === "donation.alert.created") {
          setAlert(realtimeEvent.payload);
        }
      });

      socket.addEventListener("close", () => {
        if (!isStopped) {
          retryTimer = window.setTimeout(connect, 1500);
        }
      });

      socket.addEventListener("error", () => {
        socket?.close();
      });
    }

    connect();

    return () => {
      isStopped = true;
      if (retryTimer) {
        window.clearTimeout(retryTimer);
      }
      socket?.close();
    };
  }, []);

  return (
    <main className="widget-shell" aria-live="polite">
      <section className={alert ? "widget-alert widget-alert-live" : "widget-alert"} aria-labelledby="widget-title">
        <span>{connectionLabel}</span>
        {alert ? (
          <>
            <h1 id="widget-title">{alert.display_name || dictionary.common.anonymousDonor}</h1>
            <strong>
              {formatMoney({ amountMinor: alert.amount_minor, currency: alert.currency, locale: appLocale })}
            </strong>
            {alert.message ? <p>{alert.message}</p> : null}
          </>
        ) : (
          <>
            <h1 id="widget-title">{dictionary.common.widgetTitle}</h1>
            <p>{dictionary.common.widgetWaiting}</p>
          </>
        )}
      </section>
    </main>
  );
}

function applyWidgetTheme() {
  const themeParam = new URLSearchParams(window.location.search).get("theme") ?? "";
  const root = document.documentElement;

  if (themeParam === "transparent") {
    root.dataset.widgetTheme = "transparent";
    applyThemePreference("dark", root);
    return;
  }

  const preference: ThemePreference = isThemePreference(themeParam) ? themeParam : getStoredThemePreference();
  root.dataset.widgetTheme = "panel";
  applyThemePreference(preference, root);
}

createRoot(document.getElementById("root") as HTMLElement).render(
  <StrictMode>
    <WidgetApp />
  </StrictMode>
);
