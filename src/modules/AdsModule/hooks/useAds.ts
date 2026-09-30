import { mountAds } from "../providers/advertising";
import { mountTopAdReveal } from "./useTopAdReveal";

/**
 * Zapne obsah reklamního modulu v prohlížeči.
 *
 * Používá se v `AdFrame.astro` přes `onDocumentDispose`, aby se při přechodu
 * v rámci view transitions pozorovatelé zase odpojili a znovu osadili.
 *
 * @returns Funkce, která ukončí sledování slotů i animaci horního banneru.
 */
export function useAds() {
  const cleanupAds = mountAds();
  const cleanupReveal = mountTopAdReveal();
  return () => {
    cleanupAds();
    cleanupReveal();
  };
}
