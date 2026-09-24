"use client";
import Image from "next/image";
import { useState } from "react";
import type { Product } from "@fanfuel/types";
import { useExperience } from "./experience-provider";

export function ProductCover({ product }: { product: Product }) {
  const { copy } = useExperience();
  const [failed, setFailed] = useState(false);
  const url = product.cover_url ?? "";
  const safe = /^https:\/\//i.test(url) || /^\/(?!\/)/.test(url);
  const sketchKind =
    product.kind === "obs_pack"
      ? "stream"
      : product.kind === "coaching"
        ? "learn"
        : product.kind === "digital_service"
          ? "service"
          : "design";
  const sketchPaths: Record<string, string[]> = {
    design: [
      "M46 30 Q55 22 83 27 L165 38 Q177 40 176 52 L166 119 Q164 128 152 126 L54 113 Q44 111 45 99 Z",
      "M63 43 L186 57 Q196 59 192 69 L181 132 Q178 139 166 136 L60 122",
      "M78 87 C105 74 132 81 156 94"
    ],
    stream: [
      "M30 37 Q35 29 49 31 L183 39 Q195 41 194 52 L189 113 Q187 123 173 121 L42 112 Q30 110 30 99 Z",
      "M40 63 C60 62 59 82 77 82 C94 82 89 55 108 58 C126 61 119 95 142 91 C157 88 157 72 181 75",
      "M65 131 C102 136 141 136 173 129"
    ],
    learn: [
      "M30 47 Q69 29 111 49 Q146 30 190 44 L184 122 Q145 108 112 127 Q75 109 36 125 Z",
      "M111 49 Q114 85 112 127 M50 60 Q76 52 96 62 M132 63 Q155 53 175 60",
      "M50 77 Q74 72 95 80 M132 80 Q152 72 171 77"
    ],
    service: [
      "M44 44 Q47 34 59 35 L162 41 Q172 42 173 53 L169 116 Q168 126 156 126 L49 119 Q39 117 40 106 Z",
      "M69 54 L189 61 Q199 62 197 74 L187 133 Q185 140 175 138 L67 128",
      "M60 88 C82 77 98 83 115 92 C132 101 149 101 166 91 M70 104 C87 99 103 102 115 107"
    ]
  };
  if (url && safe && !failed)
    return (
      <Image
        className="fuel-cover-image"
        src={url}
        alt={product.title}
        width={640}
        height={400}
        unoptimized
        loading="lazy"
        referrerPolicy="no-referrer"
        onError={() => setFailed(true)}
      />
    );
  return (
    <>
      <svg className="fuel-cover-ink" viewBox="0 0 240 160" fill="none" aria-hidden="true">
        {sketchPaths[sketchKind].map((path, index) => (
          <path key={path} d={path} className={index === 0 ? "fuel-cover-ink-main" : undefined} />
        ))}
      </svg>
      <span className="fuel-art-caption">{copy.home.preview}</span>
    </>
  );
}
