/** Malý DOM hook; každé menu má vlastní posluchače a časovač pro hover. */

/**
 * Obsluhuje tlačítko a panel mobilního menu v hlavičce.
 *
 * Menu se otevírá kliknutím, zavírá klávesou `Escape`, kliknutím mimo,
 * vybráním odkazu, při přechodu na šířku alespoň 1280 px a při odchodu
 * kurzoru myši po krátké prodlevě. Každé menu má vlastní `AbortController`.
 *
 * @param toggle Tlačítko s `aria-expanded`, `data-open-label` a `data-close-label`.
 * @param mobileNav Panel navigace, který se skrývá atributem `hidden`.
 * @returns Funkce pro odebrání posluchačů a zrušení časovače.
 */
export function useNavigation(
  toggle: HTMLButtonElement,
  mobileNav: HTMLElement,
) {
  const controller = new AbortController();
  const options = { signal: controller.signal };
  let timer: ReturnType<typeof setTimeout> | undefined;
  /** Zruší čekající odložené zavření po opuštění kurzorem. */
  const cancelLeave = () => {
    clearTimeout(timer);
    timer = undefined;
  };
  /** Zavře mobilní panel a vrátí `aria-label` tlačítka do výchozího stavu. */
  const close = () => {
    cancelLeave();
    toggle.setAttribute("aria-expanded", "false");
    mobileNav.hidden = true;
    toggle.setAttribute("aria-label", toggle.dataset.openLabel ?? "");
  };
  toggle.addEventListener(
    "click",
    () => {
      cancelLeave();
      const expanded = toggle.getAttribute("aria-expanded") === "true";
      toggle.setAttribute("aria-expanded", String(!expanded));
      mobileNav.hidden = expanded;
      toggle.setAttribute(
        "aria-label",
        (expanded ? toggle.dataset.openLabel : toggle.dataset.closeLabel) ?? "",
      );
    },
    options,
  );
  /** Sleduje ukazatel myši a odloženě zavře menu, když kurzor opustí panel. */
  const pointer = (event: PointerEvent) => {
    if (
      event.pointerType !== "mouse" ||
      toggle.getAttribute("aria-expanded") !== "true"
    )
      return;
    const target =
      event.type === "pointerout" ? event.relatedTarget : event.target;
    if (
      target instanceof Node &&
      (toggle.contains(target) || mobileNav.contains(target))
    ) {
      cancelLeave();
      return;
    }
    if (timer === undefined) timer = setTimeout(close, 180);
  };
  document.addEventListener("pointermove", pointer, options);
  document.addEventListener(
    "pointerout",
    (event) => {
      if (!event.relatedTarget) pointer(event);
    },
    options,
  );
  document.addEventListener(
    "keydown",
    (event) => {
      if (
        event.key === "Escape" &&
        toggle.getAttribute("aria-expanded") === "true"
      ) {
        close();
        toggle.focus();
      }
    },
    options,
  );
  document.addEventListener(
    "click",
    (event) => {
      const target = event.target;
      if (
        target instanceof Node &&
        !toggle.contains(target) &&
        !mobileNav.contains(target)
      )
        close();
    },
    options,
  );
  matchMedia("(min-width: 1280px)").addEventListener(
    "change",
    (event) => {
      if (event.matches) close();
    },
    options,
  );
  mobileNav.addEventListener(
    "click",
    (event) => {
      if (event.target instanceof Element && event.target.closest("a")) close();
    },
    options,
  );
  return () => {
    cancelLeave();
    controller.abort();
  };
}
