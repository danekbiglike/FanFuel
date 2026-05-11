import { AppTopBar } from "./app-chrome";
import { dictionary } from "../lib/i18n";

type LandingTone =
  | "neutral"
  | "success"
  | "warning"
  | "danger"
  | "info"
  | "held"
  | "payout"
  | "refunded"
  | "disputed";

export interface PublicLandingConfig {
  eyebrowKey: string;
  titleKey: string;
  leadKey: string;
  primaryActionKey: string;
  primaryHref: string;
  secondaryActionKey: string;
  secondaryHref: string;
  previewLabelKey: string;
  previewTitleKey: string;
  previewLeadKey: string;
  cards: Array<{
    titleKey: string;
    textKey: string;
  }>;
  flow: Array<{
    labelKey: string;
    valueKey: string;
    tone: LandingTone;
  }>;
}

export function PublicLanding({ config }: { config: PublicLandingConfig }) {
  return (
    <main className="ff-page">
      <AppTopBar />
      <section
        className="ff-page-with-topbar ff-wide-page ff-landing-page"
        aria-labelledby="landing-title"
      >
        <div className="ff-landing-hero">
          <div className="ff-landing-copy">
            <div className="ff-status">{t(config.eyebrowKey)}</div>
            <h1 id="landing-title">{t(config.titleKey)}</h1>
            <p>{t(config.leadKey)}</p>
            <div className="ff-actions">
              <a className="ff-button ff-button-primary" href={config.primaryHref}>
                {t(config.primaryActionKey)}
              </a>
              <a className="ff-button ff-button-secondary" href={config.secondaryHref}>
                {t(config.secondaryActionKey)}
              </a>
            </div>
          </div>

          <aside className="ff-landing-visual" aria-label={t(config.previewLabelKey)}>
            <div>
              <span className="ff-chip">{t(config.previewLabelKey)}</span>
              <strong>{t(config.previewTitleKey)}</strong>
              <p className="ff-meta">{t(config.previewLeadKey)}</p>
            </div>
            <div className="ff-landing-flow">
              {config.flow.map((item) => (
                <div className="ff-landing-flow-row" key={item.labelKey}>
                  <span>{t(item.labelKey)}</span>
                  <span className={`ff-badge ff-badge-${item.tone}`}>{t(item.valueKey)}</span>
                </div>
              ))}
            </div>
          </aside>
        </div>

        <div className="ff-grid-3">
          {config.cards.map((card) => (
            <article className="ff-feature-card" key={card.titleKey}>
              <strong>{t(card.titleKey)}</strong>
              <p>{t(card.textKey)}</p>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}

function t(key: string): string {
  return (dictionary.common as Record<string, string>)[key] ?? key;
}
