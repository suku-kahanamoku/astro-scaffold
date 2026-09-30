/**
 * Sdílená výška sticky hlavičky pro `scroll-padding` a nativní navigaci na kotvu.
 * Hodnota se zapisuje do CSS proměnné `--site-header-height`.
 *
 * @param header Měřený element hlavičky.
 * @param root Element, do jehož stylu se proměnná zapisuje, defaultně `document.documentElement`.
 * @returns Funkce pro odpojení `ResizeObserver` a posluchače `pageshow`.
 */
export function useHeaderOffset(
  header: HTMLElement,
  root = document.documentElement,
) {
  /** Zapíše aktuální výšku hlavičky do CSS proměnné kořene. */
  const update = () =>
    root.style.setProperty(
      "--site-header-height",
      `${header.getBoundingClientRect().height}px`,
    );
  const observer = new ResizeObserver(update);
  observer.observe(header);
  update();
  window.addEventListener("pageshow", update);
  return () => {
    observer.disconnect();
    window.removeEventListener("pageshow", update);
  };
}
