/**
 * Konfigurace motivu, kterou sdílí inicializace v `<head>` a runtime přepínač.
 * Klíč `storageKey` i jména motivů jsou součástí veřejného kontraktu webu.
 */
export const themeConfig = {
  /** Klíč v `localStorage`, pod kterým se ukládá volba návštěvníka. */
  storageKey: "scaffold-theme",
  /** Světlý motiv: hodnota pro `data-theme` a barva pro `meta[name="theme-color"]`. */
  light: {
    name: "scaffold",
    color: "#f8f7f3",
  },
  /** Tmavý motiv, aktivní pro `data-theme-mode="dark"`. */
  dark: {
    name: "scaffold-dark",
    color: "#18221c",
  },
} as const;

/** Motiv zapisovaný do kořene dokumentu, dokud návštěvník neodloží jiný. */
export const defaultTheme = themeConfig.light;
