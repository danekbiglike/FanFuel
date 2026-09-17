"use client";

import { AppTopBar } from "./app-chrome";
import { dictionary } from "../lib/i18n";

export interface MarketplaceRouteCard {
  titleKey: string;
  textKey: string;
  href: string;
}

export interface MarketplaceRouteShellConfig {
  titleKey: string;
  leadKey: string;
  primaryActionKey: string;
  primaryHref: string;
  secondaryActionKey?: string;
  secondaryHref?: string;
  cards?: MarketplaceRouteCard[];
}

export function MarketplaceRouteShell({ config }: { config: MarketplaceRouteShellConfig }) {
  return (
    <main className="ff-page">
      <AppTopBar />
      <section
        className="ff-page-with-topbar ff-wide-page ff-market-route-page"
        aria-labelledby="market-route-title"
      >
        <header className="ff-market-route-hero">
          <div>
            <div className="ff-status">{dictionary.common.marketplaceEyebrow}</div>
            <h1 id="market-route-title">{t(config.titleKey)}</h1>
            <p className="ff-meta">{t(config.leadKey)}</p>
          </div>
          <div className="ff-actions">
            <a className="ff-button ff-button-primary" href={config.primaryHref}>
              {t(config.primaryActionKey)}
            </a>
            {config.secondaryHref && config.secondaryActionKey ? (
              <a className="ff-button ff-button-secondary" href={config.secondaryHref}>
                {t(config.secondaryActionKey)}
              </a>
            ) : null}
          </div>
        </header>

        {config.cards?.length ? (
          <div className="ff-market-route-grid">
            {config.cards.map((card) => (
              <a className="ff-feature-card ff-market-route-card" href={card.href} key={card.href}>
                <strong>{t(card.titleKey)}</strong>
                <p>{t(card.textKey)}</p>
              </a>
            ))}
          </div>
        ) : null}
      </section>
    </main>
  );
}

function t(key: string): string {
  return (dictionary.common as Record<string, string>)[key] ?? key;
}
