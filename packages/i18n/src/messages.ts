import ruCommerce from "../locales/ru/commerce.json";
import enCommerce from "../locales/en/commerce.json";
import ruCommon from "../locales/ru/common.json";
import ruErrors from "../locales/ru/errors.json";
import enCommon from "../locales/en/common.json";
import enErrors from "../locales/en/errors.json";
import ruEmails from "../locales/ru/emails.json";
import enEmails from "../locales/en/emails.json";
import type { Locale } from "@fanfuel/types";
import ruExperience from "../locales/ru/experience.json";
import enExperience from "../locales/en/experience.json";

export const dictionaries = {
  ru: {
    commerce: ruCommerce,
    experience: ruExperience,
    common: ruCommon,
    errors: ruErrors,
    emails: ruEmails
  },
  en: {
    commerce: enCommerce,
    experience: enExperience,
    common: enCommon,
    errors: enErrors,
    emails: enEmails
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
