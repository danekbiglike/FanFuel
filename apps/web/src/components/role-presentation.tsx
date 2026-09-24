"use client";
import { useState } from "react";
import { useExperience } from "./experience-provider";
import { CanisterMark, Doodle, OilyArt } from "./brand-art";
import { useOilyStage } from "./oily-stage";
export function RolePresentation({ audience, sharedOily = false }: { audience: "creator" | "seller"; sharedOily?: boolean }) {
  const { copy } = useExperience();
  const role = copy.roles[audience];
  const [step, setStep] = useState(0);
  const oily = useOilyStage();
  const href = audience === "creator" ? "/create" : "/me/profile";
  return (
    <div className={"fuel-role fuel-role-" + audience}>
      <section className="fuel-role-hero">
        <div>
          <p className="fuel-eyebrow">{role.label}</p>
          <h1>{role.title}</h1>
          <span className="fuel-hand fuel-hand-reveal">{role.note}</span>
          <p className="fuel-role-lead">{role.lead}</p>
          <a className="fuel-button" href={href}>
            {role.cta}
          </a>
          <a className="fuel-role-back" href="/marketplace/catalog">
            {copy.shared.back}
          </a>
        </div>
        <div className="fuel-role-scene" aria-label={role.preview}>
          <div className="fuel-scene-note">
            <span className="fuel-hand">{role.preview}</span>
            <svg viewBox="0 0 100 60" width="80" height="48" aria-hidden="true">
              <path
                d="M8 20 C29 5 65 7 88 23 M18 33 C42 40 70 34 85 29"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              />
            </svg>
          </div>
          <div className="fuel-scene-card">
            <CanisterMark />
            <p>{copy.shared.demo}</p>
            <h2>{role.previewTitle}</h2>
            <p>{role.previewText}</p>
            <div className="fuel-scene-pieces" aria-hidden="true">
              <Doodle kind={audience === "creator" ? "stream" : "design"} />
            </div>
            <div className="fuel-scene-status">
              <i />
              {role.steps[step].title}
            </div>
          </div>
          {sharedOily ? <span className="fuel-oily-anchor fuel-oily-anchor-role" data-oily-anchor="role" aria-hidden="true" /> : <div className="fuel-scene-oily"><OilyArt pose={step} /></div>}
        </div>
      </section>
      <div className="fuel-paper-strip">
        <span>{role.strip}</span>
        <svg className="fuel-paper-ink" viewBox="0 0 160 45" fill="none" aria-hidden="true">
          <path d="M9 28 C34 9 61 13 83 25 C107 38 132 32 151 15" />
          <path d="M27 36 C65 29 99 38 133 27" />
        </svg>
      </div>
      <section className="fuel-role-steps">
        <p className="fuel-eyebrow">
          {copy.footer.brand} / {role.label}
        </p>
        <h2>{role.stepsTitle}</h2>
        <div className="fuel-step-layout">
          <div className="fuel-step-buttons">
            {role.steps.map((item, index) => (
              <button
                type="button"
                key={item.title}
                aria-pressed={step === index}
                aria-controls={"role-detail-" + audience}
                onClick={() => { setStep(index); if (sharedOily) oily.visit("role-step"); }}
              >
                <span className="fuel-step-number">0{index + 1}</span>
                <span>
                  <strong>{item.title}</strong>
                  <small>
                    {copy.shared.step} {index + 1}
                  </small>
                </span>
              </button>
            ))}
          </div>
          <div className="fuel-step-detail" id={"role-detail-" + audience} aria-live="polite">
            {sharedOily && <span className="fuel-oily-anchor fuel-oily-anchor-step" data-oily-anchor="role-step" aria-hidden="true" />}
            <span className="fuel-step-big" aria-hidden="true">
              0{step + 1}
            </span>
            <h3>{role.steps[step].title}</h3>
            <p>{role.steps[step].text}</p>
            <span className="fuel-hand">{copy.shared.roleFooter}</span>
          </div>
        </div>
      </section>
      <section className="fuel-future">
        <span className="fuel-label">{copy.shared.planned}</span>
        <div>
          <h2>{role.futureTitle}</h2>
          <p>{role.futureText}</p>
        </div>
        <CanisterMark />
      </section>
      <section className="fuel-faq">
        <h2>{copy.shared.faq}</h2>
        <div>
          {role.faq.map((item) => (
            <details key={item.q}>
              <summary>
                {item.q}
                <span aria-hidden="true">+</span>
              </summary>
              <p>{item.a}</p>
            </details>
          ))}
        </div>
      </section>
      <div className="fuel-role-final">
        <h2>{role.title}</h2>
        <a href={href} className="fuel-button">
          {role.cta}
        </a>
      </div>
    </div>
  );
}
