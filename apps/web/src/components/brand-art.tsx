import Image from "next/image";
import type { CSSProperties } from "react";

export function CanisterMark() {
  return (
    <svg className="fuel-mark" viewBox="0 0 48 52" aria-hidden="true" width="40" height="44">
      <path
        d="M12.5 4.2q8.7-.9 17.7.1l5.2 7.8 5.8 3.1q1.1.6 1 2v27.2q-.1 4.1-4.4 4.2H9.5q-4.1-.1-4.2-4.3V16.5l6.2-4.8z"
        fill="var(--brand-lime)"
        stroke="var(--brand-ink)"
        strokeWidth="1.55"
        strokeLinejoin="round"
      />
      <path
        d="M11.7 5.1q8.9-1.1 17.1.2m5.6 7.1 5.6 3.2.1 28.4q-.2 3-3.6 3.2H9.2q-3-.2-3.1-3.2"
        fill="none"
        stroke="var(--brand-pencil)"
        strokeWidth=".8"
        strokeLinecap="round"
        opacity=".85"
      />
      <path
        d="m15.1 7.5 11.4-.1 2.3 4.8-15.1.1z"
        fill="var(--brand-ink)"
        stroke="var(--brand-ink)"
        strokeWidth=".8"
        strokeLinejoin="round"
      />
      <path
        d="m34.9 3.7 6.2 3.5-3 5.3-6.4-3.7z"
        fill="var(--brand-lime)"
        stroke="var(--brand-ink)"
        strokeWidth="1.45"
        strokeLinejoin="round"
      />
      <path
        d="m16.1 21.9 16.4-.3m-15.7 1.7 15-.2m-14.8-.2-.2 21.2m1.8-12.1 10.6-.1m-10.6 1.6 9.6-.1"
        fill="none"
        stroke="var(--brand-ink)"
        strokeWidth="4.8"
        strokeLinecap="square"
        strokeLinejoin="round"
      />
      <path
        d="m17.4 20.8 15.2-.2m-13.1 3.5-.2 18.1m1.6-9.7 8.4-.1"
        fill="none"
        stroke="var(--brand-pencil)"
        strokeWidth=".75"
        strokeLinecap="round"
        opacity=".8"
      />
      <path
        d="m8.1 18.3 2.1-1.5m-2.1 4.1 2.1-1.6M8 23.4l2.1-1.5m-2 4.1 2-1.5m-.1 5.2 2-1.5m23.8 13.9 2.5-1.9m-2.4 4.3 2.4-1.8"
        fill="none"
        stroke="var(--brand-pencil)"
        strokeWidth=".75"
        strokeLinecap="round"
        opacity=".8"
      />
    </svg>
  );
}

export function OilyArt({ pose = 0 }: { pose?: number }) {
  return (
    <Image
      className="oily-art oily-pencil"
      src="/brand/oily-pencil.webp"
      alt=""
      width={220}
      height={220}
      unoptimized
      style={{ "--oily-tilt": pose % 2 ? "-4deg" : "2deg" } as CSSProperties}
    />
  );
}

export function Doodle({ kind = "design" }: { kind?: string }) {
  return (
    <svg viewBox="0 0 300 220" width="300" height="220" aria-hidden="true" className="fuel-doodle">
      {kind === "learn" ? (
        <g fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round">
          <path d="m63 52 74 16 88-18v121l-86 19-76-17z" />
          <path d="m137 68 2 122M80 87l37 8m-37 14 37 8m44-21 45-11m-45 34 45-11" />
          <circle cx="212" cy="50" r="26" fill="var(--brand-lime)" />
          <path d="m199 50 9 8 16-18" />
        </g>
      ) : kind === "play" ? (
        <g fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round">
          <rect x="55" y="58" width="180" height="116" rx="12" fill="var(--color-surface)" />
          <path d="M55 85h180m-158-14h2m10 0h2m10 0h2m12 30-15 16 15 15m71-31 16 16-16 15" />
          <path d="m152 104-15 36" />
        </g>
      ) : kind === "stream" ? (
        <g fill="none" stroke="currentColor" strokeWidth="3">
          <rect x="49" y="50" width="188" height="115" rx="14" fill="var(--color-surface)" />
          <path d="M125 88v41l34-20z" fill="var(--brand-lime)" />
          <path d="M80 182h128M145 165v17" />
          <path d="m212 43 13-19m1 24 25-4M50 173l-16 13" />
        </g>
      ) : (
        <g fill="none" stroke="currentColor" strokeWidth="3" strokeLinejoin="round">
          <rect
            x="58"
            y="45"
            width="127"
            height="134"
            rx="8"
            transform="rotate(-12 120 110)"
            fill="var(--color-surface)"
          />
          <rect
            x="105"
            y="64"
            width="133"
            height="119"
            rx="9"
            transform="rotate(8 170 120)"
            fill="var(--brand-lime)"
          />
          <circle cx="141" cy="104" r="17" />
          <path d="m141 162 37-43 41 48z" fill="var(--brand-ink)" />
          <path d="m51 36-10-12m9 29-19-1" />
        </g>
      )}
    </svg>
  );
}
