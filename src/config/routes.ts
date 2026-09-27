export const locales = ["cs", "en", "de"] as const;
export type Locale = (typeof locales)[number];
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
