import test from "node:test";
import assert from "node:assert/strict";
import { locales, pages, url, resolveRoute, localeFromPath } from "../src/i18n";
test("all locale/page combinations round-trip through shared routes", () => {
  for (const locale of locales)
    for (const page of pages)
      assert.deepEqual(resolveRoute(url(locale, page)), { locale, page });
  assert.equal(url("cs"), "/");
  assert.equal(url("de", "account"), "/de/account/");
});
test("unknown routes never render a home page with HTTP 200", () => {
  for (const path of [
    "/missing/",
    "/fr/",
    "/cs/",
    "/en/unknown/",
    "/about/extra/",
  ])
    assert.equal(resolveRoute(path), null);
  assert.equal(localeFromPath("/en/unknown/"), "en");
});
