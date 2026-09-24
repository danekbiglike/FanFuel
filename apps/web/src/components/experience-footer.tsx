"use client";
import { CanisterMark } from "./brand-art";
import { useExperience } from "./experience-provider";
export function ExperienceFooter() {
  const { copy } = useExperience();
  return (
    <footer className="fuel-footer">
      <a className="fuel-footer-brand" href="/">
        <CanisterMark />
        <span>
          <strong>{copy.footer.brand}</strong>
          <small>{copy.footer.line}</small>
        </span>
      </a>
      <nav aria-label={copy.footer.market}>
        <a href="/marketplace/catalog">{copy.footer.market}</a>
        <a href="/for-streamers">{copy.footer.authors}</a>
        <a href="/for-sellers">{copy.footer.sellers}</a>
        <a href="/for-buyers">{copy.footer.help}</a>
        <a href="/safe-deal">{copy.footer.safe}</a>
      </nav>
    </footer>
  );
}
