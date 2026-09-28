import { defaultTheme } from "../modules/UIModule/config/theme";
export const site = {
  name: "Studio",
  email: "hello@example.com",
  theme: defaultTheme,
  modules: { auth: true, ads: true, realtime: true },
} as const;
