import cs from "./locales/cs.json" with { type: "json" };
import en from "./locales/en.json" with { type: "json" };
import de from "./locales/de.json" with { type: "json" };
import { locales, type Locale } from "../modules/LangModule/config";
export { locales, type Locale } from "../modules/LangModule/config";
export const pages = ["home", "about", "login", "account"] as const;
export type PageId = (typeof pages)[number];
export const publicPages: PageId[] = ["home", "about"];
const dictionaries = { cs, en, de } satisfies Record<Locale, typeof cs>;
export const routeDictionary = (locale: Locale) => dictionaries[locale];
export function url(locale: Locale, page: PageId = "home") {
  const parts = [
    locale === "cs" ? "" : locale,
    routeDictionary(locale).routes[page],
  ].filter(Boolean);
  return parts.length ? `/${parts.join("/")}/` : "/";
}

export function resolveRoute(
  pathname: string,
): { locale: Locale; page: PageId } | null {
  for (const locale of locales)
    for (const page of pages) {
      if (url(locale, page) === pathname) return { locale, page };
    }
  return null;
}

/** Previous, non-localized paths are aliases, never additional canonical pages. */
export function legacyRedirect(pathname: string): string | null {
  for (const locale of locales) {
    for (const page of pages) {
      const legacy = `${url(locale)}${page === "home" ? "" : `${page}/`}`;
      const canonical = url(locale, page);
      if (pathname === legacy && legacy !== canonical) return canonical;
    }
  }
  return null;
}
