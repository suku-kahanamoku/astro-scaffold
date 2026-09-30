import type { AdUnit } from "../../../config/ads";
import { consentProvider } from "./consent";

declare global {
  /** Doplnění globálního objektu o rozhraní, které si volají skripty poskytovatelů. */
  interface Window {
    /** Queue, kterou si Google's skript vyžádá po vložení `<ins class="adsbygoogle">`. */
    adsbygoogle?: Record<string, never>[];
    /** Globální objekt poskytovatele Seznam, přes který se volá `getAds()`. */
    sssp?: {
      /**
       * Nechá poskytovatele vykreslit reklamu do kontejneru s daným `id`.
       *
       * @param config Identifikátor zóny, `id` cílového kontejneru a rozměry slotu v pixelech.
       */
      getAds: (config: {
        zoneId: number;
        id: string;
        width: number;
        height: number;
      }) => void;
    };
  }
}

/**
 * Cache už načtených skriptů podle URL; slouží současně jako zámek proti
 * duplicitnímu vložení stejného `<script>`.
 */
const scripts = new Map<string, Promise<void>>();

/**
 * Načte externí skript poskytovatele právě jednou a asynchronně.
 *
 * @param src Absolutní URL skriptu třetí strany.
 * @returns Promise, která se splní po `onload` a odmítne po `onerror` nebo po 10 s.
 */
function loadScript(src: string): Promise<void> {
  const existing = scripts.get(src);
  if (existing) return existing;
  const pending = new Promise<void>((resolve, reject) => {
    const script = document.createElement("script");
    script.src = src;
    script.async = true;
    script.crossOrigin = "anonymous";
    const timeout = setTimeout(() => {
      script.remove();
      reject(new Error("Ad script timeout"));
    }, 10_000);
    script.onload = () => {
      clearTimeout(timeout);
      resolve();
    };
    script.onerror = () => {
      clearTimeout(timeout);
      script.remove();
      reject(new Error("Ad script unavailable"));
    };
    document.head.append(script);
  });
  scripts.set(src, pending);
  return pending;
}

/**
 * Vloží reklamní jednotku do cílového kontejneru a vyvolá vykreslení u poskytovatele.
 *
 * Před vykreslením se ověřuje souhlas i viditelnost kontejneru, aby se žádné
 * poskytovatelské ani měřicí kódy nespouštěly bez souhlasu.
 *
 * @param target Element s `id`, do kterého se vloží značka reklamy.
 * @param unit Definice jednotky z `src/config/ads.ts`.
 * @returns Promise, který se splní po vykreslení, odmítne při neplatné konfiguraci
 *   nebo nedostupném poskytovateli; při chybějícím souhlasu se tiše vyřeší.
 * @throws Error při neplatném publisher ID, slot ID či zóně a při chybějícím globálním objektu poskytovatele.
 */
async function renderAd(target: HTMLElement, unit: AdUnit) {
  if (unit.provider === "google") {
    if (!/^ca-pub-\d+$/.test(unit.client) || !/^\d+$/.test(unit.slot))
      throw new Error("Invalid ad configuration");
    await loadScript(
      `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${unit.client}`,
    );
    if (!consentProvider.advertising || !target.getClientRects().length) return;
    const ad = document.createElement("ins");
    ad.className = "adsbygoogle";
    ad.style.display = "block";
    ad.dataset.adClient = unit.client;
    ad.dataset.adSlot = unit.slot;
    ad.dataset.adFormat = "auto";
    ad.dataset.fullWidthResponsive = "true";
    target.replaceChildren(ad);
    (window.adsbygoogle ??= []).push({});
  } else if (unit.provider === "seznam") {
    if (!Number.isInteger(unit.zoneId) || unit.zoneId <= 0)
      throw new Error("Invalid ad configuration");
    await loadScript("https://ssp.seznam.cz/static/js/ssp.js");
    if (!consentProvider.advertising || !target.getClientRects().length) return;
    if (!window.sssp) throw new Error("Ad provider unavailable");
    target.replaceChildren();
    window.sssp.getAds({
      zoneId: unit.zoneId,
      id: target.id,
      width: unit.width,
      height: unit.height,
    });
  }
}

/**
 * Sleduje všechny sloty `[data-ad-unit]` v daném stromu a vykreslí reklamu
 * v okamžiku, kdy se slot dostane do blízkosti viewportu a existuje souhlas.
 *
 * Slot se zpracuje jen jednou, `placeholder` se přeskakuje a při chybě
 * poskytovatele se slot označí `data-ad-state="unavailable"`, takže místo
 * reklamy zůstane rezerva rozvržení.
 *
 * @param root Kořen, ve kterém se hledají sloty, defaultně celý dokument.
 * @returns Funkce pro odpojení pozorovatele a odhlášení od souhlasu.
 */
export function mountAds(root: ParentNode = document) {
  const slots = [...root.querySelectorAll<HTMLElement>("[data-ad-unit]")];
  const requested = new Set<HTMLElement>();
  let issued = false;
  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        const target = entry.target as HTMLElement;
        if (
          !entry.isIntersecting ||
          !target.getClientRects().length ||
          !consentProvider.advertising ||
          requested.has(target)
        )
          continue;
        const unit = JSON.parse(target.dataset.adUnit ?? "{}") as AdUnit;
        if (unit.provider === "placeholder") continue;
        requested.add(target);
        issued = true;
        void renderAd(target, unit).catch(() => {
          target.dataset.adState = "unavailable";
        });
      }
    },
    { rootMargin: "100px" },
  );
  const unsubscribe = consentProvider.subscribe((allowed) => {
    observer.disconnect();
    if (allowed) slots.forEach((slot) => observer.observe(slot));
    // Third-party code cannot be unloaded safely. A fresh document starts denied.
    else if (issued) window.location.reload();
  });
  return () => {
    unsubscribe();
    observer.disconnect();
  };
}
