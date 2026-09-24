"use client";

import { useRef, type CSSProperties } from "react";
import { dictionary } from "../lib/i18n";
import { homeText } from "../lib/home-copy";

export type HomeAudience = "buyer" | "creator" | "seller";
const audiences: HomeAudience[] = ["buyer", "creator", "seller"];

export function HomeAudienceSwitch({
  value,
  onChange
}: {
  value: HomeAudience;
  onChange: (value: HomeAudience) => void;
}) {
  const refs = useRef<Array<HTMLButtonElement | null>>([]);
  const copy = {
    label: dictionary.common["homeAudience.label"],
    buyer: dictionary.common["homeAudience.buyer"],
    creator: dictionary.common["homeAudience.creator"],
    seller: dictionary.common["homeAudience.seller"]
  };
  return (
    <div
      className="ff-home-audience"
      role="tablist"
      aria-label={copy.label}
      style={{ "--audience-index": audiences.indexOf(value) } as CSSProperties}
    >
      <span className="ff-home-audience-slider" aria-hidden="true" />
      {audiences.map((audience, index) => (
        <button
          key={audience}
          ref={(node) => {
            refs.current[index] = node;
          }}
          type="button"
          role="tab"
          id={`audience-${audience}`}
          aria-selected={value === audience}
          aria-controls={`audience-panel-${audience}`}
          tabIndex={value === audience ? 0 : -1}
          onClick={() => onChange(audience)}
          onKeyDown={(event) => {
            let next = index;
            if (event.key === "ArrowRight") next = (index + 1) % audiences.length;
            else if (event.key === "ArrowLeft")
              next = (index + audiences.length - 1) % audiences.length;
            else if (event.key === "Home") next = 0;
            else if (event.key === "End") next = audiences.length - 1;
            else return;
            event.preventDefault();
            onChange(audiences[next]);
            refs.current[next]?.focus();
          }}
        >
          {copy[audience]}
        </button>
      ))}
    </div>
  );
}

export function HomeAudiencePresentation({ audience }: { audience: "creator" | "seller" }) {
  return audience === "creator" ? <CreatorPresentation /> : <SellerPresentation />;
}

function CreatorPresentation() {
  return (
    <div className="ff-role-page ff-role-creator">
      <section className="ff-role-hero">
        <div className="ff-role-hero-copy">
          <p className="ff-role-kicker">{homeText("creator.eyebrow")}</p>
          <h1>{homeText("creator.title")}</h1>
          <p className="ff-role-lead">{homeText("creator.lead")}</p>
          <div className="ff-role-actions">
            <a className="ff-button ff-button-primary" href="/create">
              {homeText("creator.action")}
            </a>
            <a className="ff-role-text-link" href="#creator-mechanic">
              {homeText("creator.secondary")}
            </a>
          </div>
          <p className="ff-role-availability">
            <span aria-hidden="true" />
            {homeText("creator.previewNote")}
          </p>
        </div>
        <CreatorStoreConcept />
      </section>

      <section className="ff-role-mechanic" id="creator-mechanic">
        <div className="ff-role-section-intro">
          <p className="ff-role-kicker">{homeText("creator.mechanicEyebrow")}</p>
          <h2>{homeText("creator.mechanicTitle")}</h2>
          <p>{homeText("creator.mechanicLead")}</p>
        </div>
        <ol className="ff-role-steps">
          {[1, 2, 3].map((step) => (
            <li key={step}>
              <span className="ff-role-step-index" aria-hidden="true">
                0{step}
              </span>
              <h3>{homeText(`creator.step${step}.title`)}</h3>
              <p>{homeText(`creator.step${step}.text`)}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className="ff-role-control">
        <div>
          <span className="ff-role-label">{homeText("creator.controlTag")}</span>
          <h2>{homeText("creator.controlTitle")}</h2>
          <p>{homeText("creator.controlText")}</p>
        </div>
        <div className="ff-role-collection-strips">
          {["design", "game", "community"].map((kind, index) => (
            <div key={kind}>
              <DiscoveryArt kind={kind as DiscoveryArtKind} />
              <strong>{homeText(`creator.control${index + 1}`)}</strong>
            </div>
          ))}
        </div>
      </section>

      <section className="ff-role-live">
        <div className="ff-role-live-art" aria-hidden="true">
          <DiscoveryArt kind="stream" />
          <span className="ff-role-live-signal">♥</span>
        </div>
        <div>
          <p className="ff-role-kicker">{homeText("creator.liveEyebrow")}</p>
          <h2>{homeText("creator.liveTitle")}</h2>
          <p>{homeText("creator.liveText")}</p>
          <ul className="ff-role-inline-list">
            {[1, 2, 3].map((i) => (
              <li key={i}>{homeText(`creator.live${i}`)}</li>
            ))}
          </ul>
          <small>{homeText("creator.liveNote")}</small>
        </div>
      </section>
      <RoleClosing audience="creator" />
    </div>
  );
}

function CreatorStoreConcept() {
  return (
    <figure className="ff-store-concept" aria-label={homeText("creator.visualLabel")}>
      <figcaption>
        {homeText("creator.visualLabel")} <span>{homeText("shared.planned")}</span>
      </figcaption>
      <div className="ff-store-concept-window">
        <div className="ff-store-concept-cover" aria-hidden="true">
          <span />
          <span />
          <span />
        </div>
        <div className="ff-store-concept-profile">
          <span aria-hidden="true">F</span>
          <div>
            <strong>{homeText("creator.storeLabel")}</strong>
            <p>{homeText("creator.storeSubtitle")}</p>
          </div>
        </div>
        <div className="ff-store-concept-tabs" aria-hidden="true">
          {["One", "Two", "Three"].map((n) => (
            <span key={n}>{homeText(`creator.storeTab${n}`)}</span>
          ))}
        </div>
        <div className="ff-store-concept-products">
          {(["design", "game", "community"] as const).map((kind, i) => (
            <div key={kind}>
              <DiscoveryArt kind={kind} />
              <span>{homeText(`creator.storeItem${["One", "Two", "Three"][i]}`)}</span>
            </div>
          ))}
        </div>
      </div>
      <div className="ff-store-concept-support">
        <span className="ff-store-heart" aria-hidden="true">
          ♡
        </span>
        <div>
          <span>{homeText("creator.supportLabel")}</span>
          <strong>{homeText("creator.supportValue")}</strong>
          <small>{homeText("creator.supportFootnote")}</small>
        </div>
      </div>
    </figure>
  );
}

function SellerPresentation() {
  return (
    <div className="ff-role-page ff-role-seller">
      <section className="ff-role-hero">
        <div className="ff-role-hero-copy">
          <p className="ff-role-kicker">{homeText("seller.eyebrow")}</p>
          <h1>{homeText("seller.title")}</h1>
          <p className="ff-role-lead">{homeText("seller.lead")}</p>
          <div className="ff-role-actions">
            <a className="ff-button ff-button-primary" href="/auth">
              {homeText("seller.action")}
            </a>
            <a className="ff-role-text-link" href="/marketplace/catalog">
              {homeText("seller.secondary")}
            </a>
          </div>
        </div>
        <figure className="ff-seller-channels" aria-label={homeText("seller.visualLabel")}>
          <figcaption>{homeText("seller.visualLabel")}</figcaption>
          <div className="ff-seller-source">
            <DiscoveryArt kind="design" />
            <div>
              <strong>{homeText("seller.productLabel")}</strong>
              <p>{homeText("seller.productText")}</p>
            </div>
          </div>
          <div className="ff-seller-branch" aria-hidden="true">
            <span />
            <span />
          </div>
          <div className="ff-seller-destinations">
            <div>
              <DiscoveryArt kind="market" />
              <strong>{homeText("seller.channelMarket")}</strong>
              <p>{homeText("seller.channelMarketText")}</p>
            </div>
            <div>
              <DiscoveryArt kind="community" />
              <strong>{homeText("seller.channelCreator")}</strong>
              <p>{homeText("seller.channelCreatorText")}</p>
              <small>{homeText("seller.channelTag")}</small>
            </div>
          </div>
          <p className="ff-seller-channel-outcome">{homeText("seller.channelOutcome")}</p>
        </figure>
      </section>
      <section className="ff-role-channel-section">
        <div className="ff-role-section-intro">
          <h2>{homeText("seller.channelsTitle")}</h2>
          <p>{homeText("seller.channelsLead")}</p>
        </div>
        <div className="ff-role-channel-columns">
          <article>
            <span className="ff-role-step-index" aria-hidden="true">
              01
            </span>
            <h3>{homeText("seller.marketTitle")}</h3>
            <p>{homeText("seller.marketText")}</p>
            <strong>{homeText("seller.marketDetail")}</strong>
          </article>
          <article>
            <span className="ff-role-label">{homeText("shared.planned")}</span>
            <h3>{homeText("seller.partnerTitle")}</h3>
            <p>{homeText("seller.partnerText")}</p>
            <strong>{homeText("seller.partnerDetail")}</strong>
          </article>
        </div>
      </section>
      <section className="ff-role-workflow">
        <div className="ff-role-section-intro">
          <p className="ff-role-kicker">{homeText("seller.workflowEyebrow")}</p>
          <h2>{homeText("seller.workflowTitle")}</h2>
        </div>
        <ol className="ff-role-steps ff-role-steps-four">
          {[1, 2, 3, 4].map((step) => (
            <li key={step}>
              <span className="ff-role-step-index" aria-hidden="true">
                0{step}
              </span>
              <h3>{homeText(`seller.step${step}.title`)}</h3>
              <p>{homeText(`seller.step${step}.text`)}</p>
            </li>
          ))}
        </ol>
      </section>
      <section className="ff-role-workspace">
        <div>
          <h2>{homeText("seller.workspaceTitle")}</h2>
          <p>{homeText("seller.workspaceText")}</p>
        </div>
        <ul>
          {[1, 2, 3].map((i) => (
            <li key={i}>
              <span aria-hidden="true">✓</span>
              {homeText(`seller.workspace${i}`)}
            </li>
          ))}
        </ul>
      </section>
      <RoleClosing audience="seller" />
    </div>
  );
}

function RoleClosing({ audience }: { audience: "creator" | "seller" }) {
  return (
    <section className="ff-role-closing">
      <div>
        <h2>{homeText(`${audience}.finalTitle`)}</h2>
        <p>{homeText(`${audience}.finalText`)}</p>
      </div>
      <div>
        <a
          className="ff-button ff-button-primary"
          href={audience === "creator" ? "/create" : "/auth"}
        >
          {homeText(`${audience}.action`)}
        </a>
        <small>{homeText("shared.testNote")}</small>
      </div>
    </section>
  );
}

type DiscoveryArtKind =
  "design" | "stream" | "game" | "community" | "coaching" | "market" | "alerts";

export function DiscoveryArt({ kind }: { kind: DiscoveryArtKind }) {
  return (
    <svg
      className={`ff-discovery-art ff-discovery-art-${kind}`}
      viewBox="0 0 240 160"
      fill="none"
      aria-hidden="true"
    >
      {kind === "design" ? (
        <>
          <rect
            className="ff-art-back"
            x="48"
            y="27"
            width="132"
            height="98"
            rx="8"
            transform="rotate(-10 114 76)"
          />
          <rect className="ff-art-front" x="66" y="35" width="128" height="98" rx="8" />
          <circle className="ff-art-accent" cx="108" cy="76" r="22" />
          <path className="ff-art-secondary" d="m130 112 28-54 28 54z" />
          <path className="ff-art-stroke" d="M82 121h35" />
        </>
      ) : null}
      {kind === "stream" ? (
        <>
          <rect className="ff-art-back" x="27" y="27" width="180" height="110" rx="9" />
          <rect className="ff-art-front" x="38" y="39" width="125" height="67" rx="4" />
          <path className="ff-art-secondary" d="m89 55 28 17-28 17z" />
          <rect className="ff-art-accent" x="143" y="88" width="62" height="47" rx="5" />
          <path className="ff-art-stroke" d="M47 118h51m72-69h25m-25 15h19" />
          <circle className="ff-art-cutout" cx="174" cy="109" r="8" />
        </>
      ) : null}
      {kind === "game" ? (
        <g transform="translate(0 -6)">
          <path
            className="ff-art-back"
            d="M87 43h66c18 0 27 12 30 32l10 40c6 22-13 35-29 18l-20-25H96l-20 25c-16 17-35 4-29-18l10-40c3-20 12-32 30-32Z"
          />
          <rect className="ff-art-front" x="99" y="52" width="42" height="25" rx="7" />
          <path className="ff-art-stroke" d="M78 62v25M66 74h24" />
          <circle className="ff-art-accent" cx="162" cy="63" r="5" />
          <circle className="ff-art-secondary" cx="173" cy="74" r="5" />
          <circle className="ff-art-secondary" cx="151" cy="74" r="5" />
          <circle className="ff-art-accent" cx="162" cy="85" r="5" />
          <circle className="ff-art-front" cx="100" cy="96" r="13" />
          <circle className="ff-art-front" cx="140" cy="96" r="13" />
          <circle className="ff-art-accent" cx="100" cy="96" r="7" />
          <circle className="ff-art-accent" cx="140" cy="96" r="7" />
        </g>
      ) : null}
      {kind === "community" ? (
        <>
          <rect className="ff-art-back" x="34" y="28" width="122" height="86" rx="14" />
          <path className="ff-art-back" d="m58 110-4 24 31-24" />
          <circle className="ff-art-accent" cx="66" cy="67" r="8" />
          <circle className="ff-art-accent" cx="95" cy="67" r="8" />
          <circle className="ff-art-accent" cx="124" cy="67" r="8" />
          <rect className="ff-art-front" x="97" y="65" width="112" height="67" rx="12" />
          <path className="ff-art-front" d="m180 127 10 17-30-17" />
          <path className="ff-art-stroke" d="M120 89h63m-63 17h43" />
        </>
      ) : null}
      {kind === "coaching" ? (
        <>
          <path
            className="ff-art-back"
            d="M120 46C98 32 72 28 46 34Q38 36 38 44v77q0 9 9 6c26-6 51-1 73 12 22-13 47-18 73-12q9 3 9-6V44q0-8-8-10c-26-6-52-2-74 12Z"
          />
          <path
            className="ff-art-stroke"
            d="M120 47v79M57 57q20-2 43 8M57 76q20-2 43 8M57 95q16-1 30 4m52 11q23-9 44-6"
          />
          <rect className="ff-art-accent" x="134" y="62" width="39" height="29" rx="8" />
          <path className="ff-art-accent" d="m174 72 10-6q5-3 5 3v16q0 6-5 3l-10-6Z" />
        </>
      ) : null}
      {kind === "market" ? (
        <>
          <path className="ff-art-back" d="M48 65h144v73H48Z" />
          <path className="ff-art-front" d="M50 28h140l17 43H33Z" />
          <path className="ff-art-stroke" d="M77 29 69 71m45-42-3 42m34-42 7 42" />
          <rect className="ff-art-accent" x="65" y="89" width="49" height="29" rx="3" />
          <path className="ff-art-secondary" d="M140 90h33v48h-33z" />
        </>
      ) : null}
      {kind === "alerts" ? (
        <>
          <rect className="ff-art-back" x="31" y="30" width="178" height="108" rx="12" />
          <path className="ff-art-stroke" d="M44 44h24m-24 79h18m-18-9v9m152-18v18h-14" />
          <rect className="ff-art-front" x="49" y="67" width="142" height="46" rx="12" />
          <path className="ff-art-accent" d="M77 103 66 92c-11-11 5-21 11-10 6-11 22-1 11 10Z" />
          <path className="ff-art-stroke" d="M103 83h65m-65 14h41" />
          <path
            className="ff-art-secondary"
            d="M159 22q0 18-18 18 18 0 18 18 0-18 18-18-18 0-18-18Z"
          />
          <path className="ff-art-stroke" d="m184 48 7-8m-59 12-4-7" />
          <circle
            cx="190"
            cy="48"
            r="23"
            fill="var(--color-warm-surface)"
            stroke="var(--color-warm)"
            strokeWidth="2"
          />
          <circle cx="190" cy="48" r="18" fill="none" stroke="var(--color-warm)" strokeWidth="1" />
          <path
            d="M185 60V36h8a7 7 0 0 1 0 14h-12m0 5h15"
            fill="none"
            stroke="var(--color-warm-foreground)"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </>
      ) : null}
    </svg>
  );
}
