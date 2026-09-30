/**
 * Zavěsí zánik životního cyklu na `pagehide`, aby se klientové hooky
 * odpojily jen tehdy, když je dokument opravdu zahazovaný.
 *
 * @param cleanup Odpojovací funkce, například z `useAds()` nebo `useMainMenu()`.
 * @returns Funkce pro ruční odpojení, která zároveň provede `cleanup`.
 */
export function onDocumentDispose(cleanup: () => void) {
  /** Obsluha `pagehide`, která při trvalém opuštění dokumentu zavolá `cleanup`. */
  const dispose = (event: PageTransitionEvent) => {
    if (event.persisted) return;
    window.removeEventListener("pagehide", dispose);
    cleanup();
  };
  window.addEventListener("pagehide", dispose);
  return () => {
    window.removeEventListener("pagehide", dispose);
    cleanup();
  };
}
