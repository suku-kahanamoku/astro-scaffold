import { locales, type Locale } from "../modules/LangModule/config";
export { locales, type Locale } from "../modules/LangModule/config";
export const pages = ["home", "about", "login", "account"] as const;
export type PageId = (typeof pages)[number];
export const publicPages: PageId[] = ["home", "about"];
export function url(locale: Locale, page: PageId = "home") {
  const parts = [
    locale === "cs" ? "" : locale,
    page === "home" ? "" : page,
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
