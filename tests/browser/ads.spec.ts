import { test, expect } from "@playwright/test";

test("ad providers wait for consent and request side slots only when visible", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  const scripts: string[] = [];
  await page.route("https://ssp.seznam.cz/static/js/ssp.js", (route) => {
    scripts.push("seznam");
    return route.fulfill({
      contentType: "application/javascript",
      body: "window.sssp = { getAds(config) { document.getElementById(config.id).dataset.rendered = String(config.zoneId); } };",
    });
  });
  await page.route("https://pagead2.googlesyndication.com/**", (route) => {
    scripts.push("google");
    return route.fulfill({
      contentType: "application/javascript",
      body: "window.adsbygoogle = { push() { document.querySelectorAll('.adsbygoogle').forEach(el => el.dataset.rendered = 'google'); } };",
    });
  });
  await page.goto("/");
  await page.evaluate(() => {
    document.getElementById("ad-top")!.dataset.adUnit = JSON.stringify({
      provider: "google",
      client: "ca-pub-123456",
      slot: "12345",
    });
    document.getElementById("ad-left")!.dataset.adUnit = JSON.stringify({
      provider: "seznam",
      zoneId: 12345,
      width: 160,
      height: 600,
    });
  });
  expect(scripts).toEqual([]);
  await page.evaluate(async () => {
    // This is the same Vite module a project's CMP imports; no test-only global in the app.
    const modulePath = "/src/providers/consent.ts";
    const { consentProvider } = await import(/* @vite-ignore */ modulePath);
    consentProvider.setAdvertising(true);
  });
  await expect(page.locator('#ad-top [data-rendered="google"]')).toHaveCount(1);
  expect(scripts).toEqual(["google"]);
  await page.setViewportSize({ width: 1440, height: 1000 });
  await expect(page.locator("#ad-left")).toHaveAttribute(
    "data-rendered",
    "12345",
  );
  expect(scripts).toEqual(["google", "seznam"]);
});
