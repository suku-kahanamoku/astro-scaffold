import { themeConfig } from "../config/theme";

/** Odpojovací funkce předchozí instance, aby se posluchače nezduplikovaly. */
let dispose: (() => void) | undefined;

/**
 * Aplikuje motiv webu a obsluhuje všechna tlačítka `.theme-toggle`.
 *
 * Dokud návštěvník výslovně nevybere motiv, sleduje se systémové
 * nastavení. Volba se ukládá do `localStorage`, souběžné změny v jiném
 * okně se přebírají přes událost `storage` a motiv se znovu načte i po
 * obnovení stránky z bfcache (`pageshow` s `persisted`).
 *
 * Všechny posluchače jsou vázané na jeden `AbortSignal`, který se odpálí
 * při `astro:before-swap` nebo ručním odpojení.
 *
 * @returns Funkce pro odpojení všech posluchačů.
 */
export function useTheme() {
  dispose?.();
  const abort = new AbortController();
  const { signal } = abort;
  const system = matchMedia("(prefers-color-scheme: dark)");
  const buttons = document.querySelectorAll<HTMLButtonElement>(".theme-toggle");
  let preference: string | null = null;
  /** Vrátí uloženou hodnotu jen tehdy, když odpovídá známému názvu motivu. */
  const validPreference = (value: string | null) =>
    value === themeConfig.light.name || value === themeConfig.dark.name
      ? value
      : null;
  try {
    preference = validPreference(localStorage.getItem(themeConfig.storageKey));
  } catch {
    /* Storage is optional. */
  }
  /** Zapíše aktivní motiv do kořene dokumentu, meta tagu a stavu tlačítek. */
  const apply = () => {
    const dark = preference
      ? preference === themeConfig.dark.name
      : system.matches;
    const theme = dark ? themeConfig.dark : themeConfig.light;
    document.documentElement.dataset.theme = theme.name;
    document.documentElement.dataset.themeMode = dark ? "dark" : "light";
    document
      .querySelector('meta[name="theme-color"]')
      ?.setAttribute("content", theme.color);
    buttons.forEach((button) => {
      button.hidden = false;
      button.setAttribute("aria-pressed", String(dark));
    });
  };
  buttons.forEach((button) =>
    button.addEventListener(
      "click",
      () => {
        preference =
          document.documentElement.dataset.themeMode === "dark"
            ? themeConfig.light.name
            : themeConfig.dark.name;
        try {
          localStorage.setItem(themeConfig.storageKey, preference);
        } catch {
          /* Keep the choice for this page. */
        }
        apply();
      },
      { signal },
    ),
  );
  system.addEventListener("change", apply, { signal });
  window.addEventListener(
    "storage",
    (event) => {
      if (event.key !== null && event.key !== themeConfig.storageKey) return;
      preference = validPreference(event.newValue);
      apply();
    },
    { signal },
  );
  document.addEventListener("astro:before-swap", () => abort.abort(), {
    once: true,
    signal,
  });
  window.addEventListener(
    "pageshow",
    (event) => {
      if (!event.persisted) return;
      try {
        preference = validPreference(
          localStorage.getItem(themeConfig.storageKey),
        );
      } catch {
        /* Storage is optional. */
      }
      apply();
    },
    { signal },
  );
  dispose = () => abort.abort();
  apply();
  return dispose;
}
