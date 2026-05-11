import ruCommon from "../locales/ru/common.json";
import ruErrors from "../locales/ru/errors.json";
import enCommon from "../locales/en/common.json";
import enErrors from "../locales/en/errors.json";
import type { Locale } from "@fanfuel/types";

export const dictionaries = {
  ru: {
    common: ruCommon,
    errors: ruErrors
  },
  en: {
    common: enCommon,
    errors: enErrors
  }
} as const;

export type Dictionary = (typeof dictionaries)[Locale];

export function getDictionary(locale: Locale): Dictionary {
  return dictionaries[locale];
}

export function translate(locale: Locale, namespace: keyof Dictionary, key: string): string {
  const dictionary = dictionaries[locale][namespace] as Record<string, string>;
  return dictionary[key] ?? key;
}

