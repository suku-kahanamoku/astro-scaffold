import { test, expect } from "@playwright/test";

test("responsive frame keeps content visible and hides rails below xl", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  for (const width of [360, 640, 768, 1024, 1280, 1536, 1920]) {
    await page.setViewportSize({ width, height: 1000 });
    await page.goto("/");
    await expect(page.locator("main h1")).toBeVisible();
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    if (width < 768) {
      await expect(page.locator(".login-link")).toBeHidden();
      const menu = await page.locator("summary").boundingBox();
      const header = await page.locator(".site-header").boundingBox();
      expect(menu!.x + menu!.width).toBeLessThanOrEqual(
        header!.x + header!.width,
      );
    }
    if (width < 1280) await expect(page.locator(".ad-left")).toBeHidden();
    else {
      await expect(page.locator(".ad-left")).toBeVisible();
      await expect(page.locator(".ad-right")).toBeVisible();
    }
  }
  expect(errors).toEqual([]);
  await page.screenshot({
    path: "test-results/home-desktop.png",
    fullPage: true,
  });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await page.screenshot({
    path: "test-results/home-mobile.png",
    fullPage: true,
  });
});
test("localized SEO, navigation, mobile menu and not-found status", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/en/about/");
  await expect(page.locator("html")).toHaveAttribute("lang", "en");
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
    "href",
    "http://localhost:4328/en/about/",
  );
  await page.getByRole("link", { name: "DE", exact: true }).click();
  await expect(page).toHaveURL(/\/de\/about\/$/);
  await page.locator("summary").click();
  await page
    .locator(".mobile-menu-panel")
    .getByRole("link", { name: "Startseite" })
    .click();
  await expect(page).toHaveURL(/\/de\/$/);
  const response = await page.goto("/en/unknown/");
  expect(response?.status()).toBe(404);
  await expect(page.locator("html")).toHaveAttribute("lang", "en");
});
test("auth forms, HttpOnly token, protected account and logout follow php-core contract", async ({
  page,
  context,
}) => {
  await page.goto("/en/account/");
  await expect(page).toHaveURL(/\/en\/login\/$/);
  await page.getByLabel("Email", { exact: true }).fill("user@example.test");
  await page.getByLabel("Password", { exact: true }).fill("incorrect");
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page.getByRole("alert")).toContainText("check your email");
  await page.getByLabel("Email", { exact: true }).fill("user@example.test");
  await page.getByLabel("Password", { exact: true }).fill("test-password");
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page).toHaveURL(/\/en\/account\/$/);
  await expect(page.locator("main h1")).toContainText("Test Account");
  const cookie = (await context.cookies()).find(
    (cookie) => cookie.name === "scaffold_session",
  );
  expect(cookie?.httpOnly).toBe(true);
  expect(cookie?.sameSite).toBe("Lax");
  expect(await page.evaluate(() => document.cookie)).not.toContain(
    "scaffold_session",
  );
  const me = await context.request.get("/api/auth/me/");
  expect(me.headers()["cache-control"]).toContain("no-store");
  expect(await me.text()).not.toMatch(/token|private_field|test-only-secret/);
  await page.getByRole("button", { name: "Sign out" }).click();
  await expect(page).toHaveURL(/\/en\/login\/$/);
  expect((await context.request.get("/api/auth/me/")).status()).toBe(401);
});
test("foreign origins cannot log in and default ads contact no third parties", async ({
  page,
  request,
}) => {
  const response = await request.post("/api/auth/login/", {
    headers: { Origin: "https://foreign.test" },
    data: { email: "user@example.test", password: "test-password" },
  });
  expect(response.status()).toBe(403);
  const external: string[] = [];
  page.on("request", (request) => {
    if (/googlesyndication|ssp\.seznam/.test(request.url()))
      external.push(request.url());
  });
  await page.goto("/");
  await page.waitForLoadState("networkidle");
  expect(external).toEqual([]);
  expect(await page.content()).not.toContain("test-only-secret");
});
