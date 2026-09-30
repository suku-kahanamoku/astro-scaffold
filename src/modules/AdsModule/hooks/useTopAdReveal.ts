/**
 * Posune reklamní kreativu rychlostí poloviny scrollu uvnitř oříznutého okna.
 * Okno musí obsahovat atribut `data-top-ad-reveal` a uvnitř banner `.ad-top`;
 * posun se zapisuje do proměnné `--ad-reveal-offset`.
 *
 * @param root Kořen, ve kterém se hledá okno, defaultně celý dokument.
 * @returns Funkce, která zruší animaci a odstraní nastavenou CSS proměnnou.
 */
export function mountTopAdReveal(root: ParentNode = document) {
  const windowElement = root.querySelector<HTMLElement>("[data-top-ad-reveal]");
  const banner = windowElement?.querySelector<HTMLElement>(".ad-top");
  if (!windowElement || !banner) return () => {};

  const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)");
  let frame: number | undefined;
  /** Přepočítá a zapíše posun banneru pro aktuální polohu scrollu. */
  const render = () => {
    frame = undefined;
    const bounds = windowElement.getBoundingClientRect();
    // Stop updating the translation once the entire reserved window is offscreen.
    const distance = Math.max(
      0,
      Math.min(window.scrollY, bounds.bottom + window.scrollY),
    );
    const offset = reducedMotion.matches ? 0 : distance * 0.5;
    banner.style.setProperty("--ad-reveal-offset", `${offset}px`);
  };
  /** Zahájí jediný nadcházející snímek, aby se nestřílelo na každou událost. */
  const schedule = () => {
    if (frame === undefined) frame = requestAnimationFrame(render);
  };
  const resize = new ResizeObserver(schedule);
  resize.observe(windowElement);
  window.addEventListener("scroll", schedule, { passive: true });
  window.addEventListener("pageshow", schedule);
  reducedMotion.addEventListener("change", schedule);
  render();
  return () => {
    if (frame !== undefined) cancelAnimationFrame(frame);
    resize.disconnect();
    window.removeEventListener("scroll", schedule);
    window.removeEventListener("pageshow", schedule);
    reducedMotion.removeEventListener("change", schedule);
    banner.style.removeProperty("--ad-reveal-offset");
  };
}
