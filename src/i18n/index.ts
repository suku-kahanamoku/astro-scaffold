import cs from "../locales/cs.json";
import en from "../locales/en.json";
import de from "../locales/de.json";

import {
  locales,
  pages,
  url,
  type Locale,
  type PageId,
} from "../config/routes";
export {
  locales,
  pages,
  url,
  type Locale,
  type PageId,
} from "../config/routes";
export type Dictionary = typeof cs;
const dictionaries: Record<Locale, Dictionary> = { cs, en, de };
export const dictionary = (locale: Locale) => dictionaries[locale];
export const isLocale = (value: string): value is Locale =>
  locales.includes(value as Locale);
export function resolveRoute(
  pathname: string,
): { locale: Locale; page: PageId } | null {
  for (const locale of locales)
    for (const page of pages) {
      if (url(locale, page) === pathname) return { locale, page };
    }
  return null;
}
export function localeFromPath(pathname: string): Locale {
  const segment = pathname.split("/")[1] ?? "";
  return isLocale(segment) ? segment : "cs";
}
