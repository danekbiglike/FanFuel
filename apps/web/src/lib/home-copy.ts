import { dictionary } from "./i18n";

export function homeText(key: string): string {
  return (dictionary.common as Record<string, string>)[`home.${key}`] ?? key;
}
