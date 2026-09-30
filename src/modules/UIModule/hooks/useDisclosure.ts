/**
 * Doplní chování `<details>`: zavření klávesou `Escape` s vrácením fokusu
 * na `summary` a zavření kliknutím mimo otevřenou rozbalovací oblast.
 * Nativní `<details>` zůstává použitelné i bez JavaScriptu.
 *
 * @param selector CSS selektor otevřených prvků `<details>`, např. `.language-picker`.
 * @param root Kořen, na němž se poslouchají události, defaultně `document`.
 * @returns Funkce pro odebrání posluchačů.
 */
export function useDisclosure(selector: string, root: Document = document) {
  const controller = new AbortController();
  const options = { signal: controller.signal };

  root.addEventListener(
    "keydown",
    (event) => {
      if (event.key !== "Escape") return;
      root
        .querySelectorAll<HTMLDetailsElement>(`${selector}[open]`)
        .forEach((picker) => {
          picker.open = false;
          picker.querySelector("summary")?.focus();
        });
    },
    options,
  );
  root.addEventListener(
    "click",
    (event) => {
      root
        .querySelectorAll<HTMLDetailsElement>(`${selector}[open]`)
        .forEach((picker) => {
          if (event.target instanceof Node && !picker.contains(event.target))
            picker.open = false;
        });
    },
    options,
  );

  return () => controller.abort();
}
