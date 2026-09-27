import { defineConfig } from "@playwright/test";
export default defineConfig({
  testDir: "./tests/browser",
  fullyParallel: true,
  use: {
    baseURL: "http://localhost:4328",
    browserName: "chromium",
    trace: "retain-on-failure",
  },
  webServer: [
    {
      command: "node tests/mock-core.mjs",
      url: "http://127.0.0.1:4399/health",
      reuseExistingServer: false,
    },
    {
      command: "npm run dev -- --port 4328 --ignore-lock",
      url: "http://localhost:4328",
      reuseExistingServer: false,
      env: {
        PUBLIC_SITE_URL: "http://localhost:4328",
        PHP_CORE_URL: "http://127.0.0.1:4399",
        PHP_CORE_API_KEY: "test-only-secret",
        PHP_CORE_TENANT_HOST: "scaffold.test",
      },
    },
  ],
});
