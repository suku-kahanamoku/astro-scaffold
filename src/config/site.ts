import { defaultTheme } from "../modules/UIModule/config/theme";

/**
 * Základní identita a zapnuté moduly projektu.
 *
 * `name` a `email` používá hlavička, patička i sekce O nás. `theme` přebírá
 * výchozí motiv UIModule a zapisuje se do kořene dokumentu. Přepínače
 * v `modules` rozhodují, zda se vykreslí auth UI, reklamní sloty a realtime
 * klient. Objekt je `as const`, takže nelze měnit za běhu.
 */
export const site = {
  name: "Studio",
  email: "hello@example.com",
  theme: defaultTheme,
  modules: { auth: true, ads: true, realtime: true },
} as const;
