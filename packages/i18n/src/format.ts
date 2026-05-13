import type { CurrencyCode, Locale } from "@fanfuel/types";

interface MoneyInput {
  amountMinor: number;
  currency: CurrencyCode;
  locale?: Locale;
  trimZeroFraction?: boolean;
}

export function formatMoney({
  amountMinor,
  currency,
  locale = "ru",
  trimZeroFraction = false
}: MoneyInput): string {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    ...(trimZeroFraction && amountMinor % 100 === 0
      ? { maximumFractionDigits: 0, minimumFractionDigits: 0 }
      : {})
  }).format(amountMinor / 100);
}

export function formatDate(
  value: Date | string | number,
  options: Intl.DateTimeFormatOptions & { locale?: Locale } = {}
): string {
  const { locale = "ru", ...dateOptions } = options;
  return new Intl.DateTimeFormat(locale, {
    dateStyle: "medium",
    timeStyle: "short",
    ...dateOptions
  }).format(new Date(value));
}

export function formatNumber(value: number, locale: Locale = "ru"): string {
  return new Intl.NumberFormat(locale).format(value);
}
