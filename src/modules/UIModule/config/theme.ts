export const themeConfig = {
  storageKey: "scaffold-theme",
  light: {
    name: "scaffold",
    color: "#f8f7f3",
  },
  dark: {
    name: "scaffold-dark",
    color: "#18221c",
  },
} as const;

export const defaultTheme = themeConfig.light;
