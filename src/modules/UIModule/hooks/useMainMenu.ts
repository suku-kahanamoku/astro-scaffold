import { useNavigation } from "./useNavigation";
import { useHeaderOffset } from "./useHeaderOffset";
import { onDocumentDispose } from "./onDocumentDispose";

/** Odpojovací funkce předchozího volání, aby se hook nezdvojil. */
let dispose: (() => void) | undefined;

/**
 * Zapne chování všech hlaviček s `data-main-menu` v dokumentu:
 * synchronizaci výšky hlavičky a ovládání mobilního menu.
 *
 * Volá se z `MainMenu.astro` při prvním načtení i po každém
 * `astro:page-load`; předchozí instance se vždy odpojí. Registrace je
 * navázaná na `onDocumentDispose`, aby se hooky ukončily při opuštění stránky.
 *
 * @returns Nic.
 */
export function useMainMenu() {
  dispose?.();
  const cleanups: (() => void)[] = [];
  document
    .querySelectorAll<HTMLElement>("[data-main-menu]")
    .forEach((header) => {
      const toggle =
        header.querySelector<HTMLButtonElement>("[data-menu-toggle]");
      const menu = header.querySelector<HTMLElement>(".mobile-nav");
      cleanups.push(useHeaderOffset(header));
      if (toggle && menu) cleanups.push(useNavigation(toggle, menu));
    });
  /** Spustí všechny nasbírané odpojovací funkce dané hlavičky. */
  const cleanup = () => cleanups.forEach((fn) => fn());
  const removeDisposeListener = onDocumentDispose(cleanup);
  dispose = () => {
    removeDisposeListener();
  };
}
